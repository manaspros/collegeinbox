import { NextRequest, NextResponse } from "next/server";
import { composio } from "@/lib/composio";

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("user-id");

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("DEBUG: Fetching connections for userId:", userId);

    // Try different methods to get connections
    const methods = [];

    // Method 1: user_uuid
    try {
      const connections1 = await composio.connectedAccounts.list({
        user_uuid: userId,
      });
      methods.push({
        method: "user_uuid",
        success: true,
        data: connections1,
      });
    } catch (e: any) {
      methods.push({
        method: "user_uuid",
        success: false,
        error: e.message,
      });
    }

    // Method 2: entity_id (alternative parameter name)
    try {
      const connections2 = await composio.connectedAccounts.list({
        entity_id: userId,
      } as any);
      methods.push({
        method: "entity_id",
        success: true,
        data: connections2,
      });
    } catch (e: any) {
      methods.push({
        method: "entity_id",
        success: false,
        error: e.message,
      });
    }

    // Method 3: No parameters (get all)
    try {
      const connections3 = await composio.connectedAccounts.list();
      methods.push({
        method: "no_params",
        success: true,
        data: connections3,
      });
    } catch (e: any) {
      methods.push({
        method: "no_params",
        success: false,
        error: e.message,
      });
    }

    return NextResponse.json({
      userId,
      methods,
    }, { status: 200 });

  } catch (error: any) {
    console.error("Debug endpoint error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
