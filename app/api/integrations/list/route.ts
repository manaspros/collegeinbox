import { NextRequest, NextResponse } from "next/server";
import { getUserConnections } from "@/lib/composio";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connections = await getUserConnections(userId);

    // Define available apps
    const availableApps = [
      "gmail",
      "googleclassroom",
      "googlecalendar",
      "googledrive",
      "whatsapp",
      "telegram",
    ];

    // Map connections to integration status
    const integrations = availableApps.map((app) => ({
      name: app,
      connected: connections.some(
        (conn: any) =>
          conn.toolkitSlug?.toLowerCase() === app.toLowerCase() &&
          conn.status === "ACTIVE"
      ),
      connection: connections.find(
        (conn: any) =>
          conn.toolkitSlug?.toLowerCase() === app.toLowerCase() &&
          conn.status === "ACTIVE"
      ),
    }));

    return NextResponse.json({ integrations });
  } catch (error: any) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}
