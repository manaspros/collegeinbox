import { Composio } from "@composio/core";

// Initialize Composio client with v3 API
export const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY!,
});

// Get or create entity for a Firebase user
// Composio automatically creates entities if they don't exist
export async function getComposioEntity(firebaseUid: string) {
  try {
    const entity = await composio.getEntity(firebaseUid);
    return entity;
  } catch (error: any) {
    console.error("Error getting/creating Composio entity:", error);
    throw error;
  }
}

// Check if user has connected an app
export async function hasConnection(firebaseUid: string, app: string) {
  try {
    const entity = await getComposioEntity(firebaseUid);
    const connections = await entity.getConnections();
    return connections.some(
      (conn: any) => conn.appName.toLowerCase() === app.toLowerCase() && conn.status === "ACTIVE"
    );
  } catch (error) {
    console.error("Error checking connection:", error);
    return false;
  }
}

// Map of app names to their Composio integration names
const APP_INTEGRATION_MAP: Record<string, string> = {
  gmail: "GMAIL",
  googleclassroom: "GOOGLECLASSROOM",
  googlecalendar: "GOOGLECALENDAR",
  googledrive: "GOOGLEDRIVE",
  whatsapp: "WHATSAPP",
  telegram: "TELEGRAM",
};

// Get connection URL for OAuth using Composio's hosted authentication (v3 API)
export async function getConnectionLink(
  firebaseUid: string,
  app: string,
  redirectUrl?: string
) {
  try {
    // Use Composio v3 link method for hosted authentication
    // This automatically handles auth configs for common apps
    const integrationName = APP_INTEGRATION_MAP[app.toLowerCase()] || app.toUpperCase();

    const connectionRequest = await composio.connectedAccounts.link(
      firebaseUid,
      integrationName,
      {
        callbackUrl: redirectUrl || `${process.env.NEXT_PUBLIC_APP_URL}/integrations`,
      }
    );

    // The response has redirectUrl - this is the OAuth URL
    return connectionRequest.redirectUrl;
  } catch (error) {
    console.error("Error generating connection link:", error);
    throw error;
  }
}

// Get list of all user connections
export async function getUserConnections(firebaseUid: string) {
  try {
    const entity = await getComposioEntity(firebaseUid);
    const connections = await entity.getConnections();
    return connections;
  } catch (error) {
    console.error("Error fetching connections:", error);
    return [];
  }
}

// Disconnect an app (v3 API)
export async function disconnectApp(firebaseUid: string, connectionId: string) {
  try {
    // Composio v3 API - delete takes just the connection ID
    await composio.connectedAccounts.delete(connectionId);
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
    const entity = await getComposioEntity(firebaseUid);
    const result = await entity.execute(action, params);
    return result;
  } catch (error) {
    console.error("Error executing action:", error);
    throw error;
  }
}

// Get tools for AI agent
export async function getToolsForEntity(firebaseUid: string, apps: string[]) {
  try {
    const toolset = composio.getToolSet();
    const tools = await toolset.getTools({
      apps,
      entityId: firebaseUid,
    });
    return tools;
  } catch (error) {
    console.error("Error getting tools:", error);
    return [];
  }
}
