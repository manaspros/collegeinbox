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
      "telegram",
    ];

    console.log("Fetched connections:", JSON.stringify(connections, null, 2));

    // Map connections to integration status
    const integrations = availableApps.map((app) => {
      const connection = connections.find(
        (conn: any) => {
          // Check both toolkitSlug and toolkit.slug for compatibility
          const toolkitSlug = conn.toolkitSlug || conn.toolkit?.slug;
          return (
            toolkitSlug?.toLowerCase() === app.toLowerCase() &&
            conn.status === "ACTIVE"
          );
        }
      );

      return {
        name: app,
        connected: !!connection,
        connection: connection,
      };
    });

    console.log("Mapped integrations:", integrations);

    return NextResponse.json({ integrations });
  } catch (error: any) {
    console.error("Error fetching integrations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch integrations" },
      { status: 500 }
    );
  }
}
