import { Composio } from '@composio/core';

// Initialize Composio client
export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY!,
});

// Map of app names to their Composio toolkit slugs
const APP_TOOLKIT_MAP: Record<string, string> = {
  gmail: "gmail",
  googleclassroom: "googleclassroom",
  googlecalendar: "googlecalendar",
  googledrive: "googledrive",
  whatsapp: "whatsapp",
  telegram: "telegram",
};

// Get connection URL for OAuth
export async function getConnectionLink(
  firebaseUid: string,
  app: string,
  redirectUrl?: string
) {
  try {
    // Add detailed logging and validation
    console.log("getConnectionLink called with:", { firebaseUid, app, redirectUrl });

    if (!app) {
      throw new Error("App parameter is required but was undefined or null");
    }

    const toolkitSlug = APP_TOOLKIT_MAP[app.toLowerCase()] || app.toLowerCase();

    // Use toolkit.authorize to initiate connection with entityId
    const connectionRequest = await composio.toolkits.authorize(
      firebaseUid, // This is the entityId
      toolkitSlug,
      {
        redirectUrl: redirectUrl,
      }
    );

    console.log("Connection request created:", connectionRequest);

    return connectionRequest.redirectUrl;
  } catch (error) {
    console.error("Error generating connection link:", error);
    throw error;
  }
}

// Get list of all user connections
export async function getUserConnections(firebaseUid: string) {
  try {
    console.log("Fetching connections for entityId:", firebaseUid);

    // Use correct parameter: user_ids (array of user IDs)
    const connections = await composio.connectedAccounts.list({
      user_ids: [firebaseUid],
    });

    console.log("Found connections:", connections?.items?.length || 0);
    console.log("Connections detail:", JSON.stringify(connections.items, null, 2));

    return connections.items || [];
  } catch (error) {
    console.error("Error fetching connections:", error);
    return [];
  }
}

// Check if user has connected an app
export async function hasConnection(firebaseUid: string, app: string) {
  try {
    const connections = await getUserConnections(firebaseUid);
    const toolkitSlug = APP_TOOLKIT_MAP[app.toLowerCase()] || app.toLowerCase();

    return connections.some(
      (conn: any) =>
        conn.appUniqueId?.toLowerCase().includes(toolkitSlug) &&
        conn.status === "ACTIVE"
    );
  } catch (error) {
    console.error("Error checking connection:", error);
    return false;
  }
}

// Disconnect an app
export async function disconnectApp(firebaseUid: string, connectionId: string) {
  try {
    await composio.connectedAccounts.delete({ connectedAccountId: connectionId });
    return true;
  } catch (error) {
    console.error("Error disconnecting app:", error);
    return false;
  }
}

// Execute an action with Composio
export async function executeAction(
  firebaseUid: string,
  action: string,
  params: any = {}
) {
  try {
    // Ensure params is always an object
    const inputParams = params || {};

    console.log(`Executing action: ${action}`, {
      entityId: firebaseUid,
      params: inputParams,
    });

    // According to Composio SDK, we need to use the object format with connectedAccountId
    // First, get the connected account for this entity and toolkit
    const connections = await composio.connectedAccounts.list({
      user_ids: [firebaseUid],
    });

    // Find the first active Gmail connection
    const toolkit = action.split('_')[0].toLowerCase(); // e.g., "GMAIL_FETCH_EMAILS" -> "gmail"
    const connection = connections.items?.find(
      (conn: any) =>
        conn.toolkit?.slug === toolkit &&
        conn.status === 'ACTIVE'
    );

    if (!connection) {
      throw new Error(`No active ${toolkit} connection found for entity ${firebaseUid}`);
    }

    console.log(`Using connection: ${connection.id} for toolkit: ${toolkit}`);

    // Execute with connectedAccountId
    const result = await composio.tools.execute(action, {
      connectedAccountId: connection.id,
      arguments: inputParams,
      dangerouslySkipVersionCheck: true, // Skip version check for now
    });

    console.log(`Action ${action} result:`, {
      successfull: result.successfull,
      hasData: !!result.data,
    });

    return result;
  } catch (error: any) {
    console.error(`Error executing action ${action}:`, {
      message: error.message,
      code: error.code,
      possibleFixes: error.possibleFixes,
      fullError: JSON.stringify(error, null, 2),
    });
    throw error;
  }
}

// Get tools for AI agent
export async function getToolsForEntity(firebaseUid: string, apps: string[]) {
  try {
    // Map app names to toolkit slugs
    const toolkitSlugs = apps.map(
      (app) => APP_TOOLKIT_MAP[app.toLowerCase()] || app.toLowerCase()
    );

    console.log("Fetching tools for apps:", toolkitSlugs);

    const toolset = await composio.getToolsWithApps(toolkitSlugs, {
      entityId: firebaseUid,
    });

    const tools = toolset.tools || [];

    console.log(`Retrieved ${tools.length} tools for user ${firebaseUid}`);

    return tools;
  } catch (error) {
    console.error("Error getting tools:", error);
    return [];
  }
}
