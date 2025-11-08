import { Composio } from "@composio/core";

// Initialize Composio v3 client
export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY!,
});

// Check if user has connected an app
export async function hasConnection(firebaseUid: string, app: string) {
  try {
    const connections = await composio.connectedAccounts.list({
      userIds: [firebaseUid],
    });

    return connections.items.some((conn: any) => {
      const toolkitSlug = conn.toolkitSlug || conn.toolkit?.slug;
      return (
        toolkitSlug?.toLowerCase() === app.toLowerCase() &&
        conn.status === "ACTIVE"
      );
    });
  } catch (error) {
    console.error("Error checking connection:", error);
    return false;
  }
}

// Get connection URL for OAuth
export async function getConnectionLink(
  firebaseUid: string,
  app: string,
  redirectUrl?: string
) {
  try {
    console.log(`\n=== Getting connection link for ${app} ===`);
    console.log(`User ID: ${firebaseUid}`);

    // Step 1: Get ALL auth configs first to see what's available
    const allAuthConfigs = await composio.authConfigs.list({});
    console.log(`Total auth configs available: ${allAuthConfigs.items?.length || 0}`);

    // Log first auth config to see structure
    if (allAuthConfigs.items && allAuthConfigs.items.length > 0) {
      console.log("Sample auth config structure:", JSON.stringify(allAuthConfigs.items[0], null, 2));
    }

    // Filter for the specific toolkit (check multiple possible field names)
    const toolkitConfigs = allAuthConfigs.items?.filter((config: any) => {
      const toolkitSlug = config.toolkitSlug || config.toolkit?.slug || config.toolkit;
      return toolkitSlug?.toLowerCase() === app.toLowerCase();
    }) || [];

    console.log(`Found ${toolkitConfigs.length} auth configs for ${app}`);
    console.log(`Matching configs:`, toolkitConfigs.map((c: any) => ({
      id: c.id,
      toolkit: c.toolkitSlug || c.toolkit?.slug || c.toolkit,
      isComposioManaged: c.isComposioManaged,
      status: c.status
    })));

    if (toolkitConfigs.length === 0) {
      const availableToolkits = [...new Set(allAuthConfigs.items?.map((c: any) =>
        c.toolkitSlug || c.toolkit?.slug || c.toolkit || 'unknown'
      ))];
      throw new Error(
        `No auth config found for toolkit: ${app}.\n` +
        `Available toolkits: ${availableToolkits.filter(t => t !== 'unknown').join(", ")}\n` +
        `Create one at: https://app.composio.dev/settings/auth-configs`
      );
    }

    // Prefer: Composio-managed + ACTIVE > ACTIVE > any
    const authConfig =
      toolkitConfigs.find((config: any) => config.isComposioManaged && config.status === "ACTIVE") ||
      toolkitConfigs.find((config: any) => config.status === "ACTIVE") ||
      toolkitConfigs[0];

    console.log(`Selected auth config:`, {
      id: authConfig.id,
      toolkit: authConfig.toolkitSlug,
      isComposioManaged: authConfig.isComposioManaged,
      status: authConfig.status
    });

    // Step 2: Initiate connection with user_id and auth_config_id
    const connection = await composio.connectedAccounts.initiate(
      firebaseUid,
      authConfig.id,
      {
        redirectUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/integrations`,
      }
    );

    console.log(`✅ Connection initiated successfully`);
    console.log(`Redirect URL: ${connection.redirectUrl}`);
    return connection.redirectUrl;
  } catch (error: any) {
    console.error("❌ Error generating connection link:", error);
    throw new Error(error.message || "Failed to generate connection link");
  }
}

// Get list of all user connections
export async function getUserConnections(firebaseUid: string) {
  try {
    const connections = await composio.connectedAccounts.list({
      userIds: [firebaseUid],
    });
    return connections.items || [];
  } catch (error) {
    console.error("Error fetching connections:", error);
    return [];
  }
}

// Disconnect an app
export async function disconnectApp(firebaseUid: string, connectionId: string) {
  try {
    await composio.connectedAccounts.delete(connectionId);
    return true;
  } catch (error) {
    console.error("Error disconnecting app:", error);
    return false;
  }
}

// Execute an action with Composio v3
export async function executeAction(
  firebaseUid: string,
  action: string,
  params: any = {},
  connectedAccountId?: string
) {
  try {
    // Build execution parameters
    const executeParams: any = {
      arguments: params,
    };

    // Option 1: Use existing connectedAccountId (fastest, no OAuth needed)
    if (connectedAccountId) {
      executeParams.connectedAccountId = connectedAccountId;
    }
    // Option 2: Use userId to auto-find connection
    else {
      executeParams.userId = firebaseUid;
    }

    console.log(`Executing ${action} with params:`, JSON.stringify(executeParams, null, 2));

    const result = await composio.tools.execute(action, executeParams);

    console.log(`Result for ${action}:`, result);
    return result;
  } catch (error: any) {
    console.error(`Error executing action ${action}:`, error);
    throw error;
  }
}

// Create a connected account with hardcoded OAuth2 credentials
// This bypasses the OAuth flow entirely
export async function createHardcodedConnection(
  firebaseUid: string,
  authConfigId: string,
  oauthCredentials: {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  }
) {
  try {
    const connection = await composio.connectedAccounts.initiate(
      firebaseUid,
      authConfigId,
      {
        config: {
          authScheme: "OAUTH2" as const,
          toolkitSlug: "gmail", // adjust per toolkit
          val: {
            status: "ACTIVE" as const,
            access_token: oauthCredentials.access_token,
            refresh_token: oauthCredentials.refresh_token,
            expires_in: oauthCredentials.expires_in,
            token_type: oauthCredentials.token_type || "Bearer",
          },
        },
      }
    );

    return connection;
  } catch (error) {
    console.error("Error creating hardcoded connection:", error);
    throw error;
  }
}

// Get active connected account ID for a user and toolkit
export async function getConnectedAccountId(
  firebaseUid: string,
  toolkitSlug: string
): Promise<string | null> {
  try {
    const connections = await composio.connectedAccounts.list({
      userIds: [firebaseUid],
    });

    const activeConnection = connections.items?.find((conn: any) => {
      const slug = conn.toolkitSlug || conn.toolkit?.slug;
      return (
        slug?.toLowerCase() === toolkitSlug.toLowerCase() &&
        conn.status === "ACTIVE"
      );
    });

    console.log(`Found connection for ${toolkitSlug}:`, activeConnection?.id || null);
    return activeConnection?.id || null;
  } catch (error) {
    console.error("Error getting connected account ID:", error);
    return null;
  }
}

// Get tools for AI agent using v3 API
export async function getToolsForEntity(firebaseUid: string, apps: string[]) {
  try {
    const tools = await composio.tools.get({
      toolkits: apps,
      userId: firebaseUid,
    });
    return tools;
  } catch (error) {
    console.error("Error getting tools:", error);
    return [];
  }
}
