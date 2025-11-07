import { NextRequest, NextResponse } from "next/server";
import { getConnectionLink } from "@/lib/composio";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { app, redirectUrl, firebaseUid } = body;

    // Log received parameters for debugging
    console.log("Connect route received:", { app, redirectUrl, firebaseUid });

    // Validate required parameters
    if (!app) {
      return NextResponse.json(
        { error: "App name is required", received: body },
        { status: 400 }
      );
    }

    if (!firebaseUid) {
      return NextResponse.json(
        { error: "Firebase UID is required", received: body },
        { status: 400 }
      );
    }

    // Get connection link (redirectUrl can be optional)
    const connectionUrl = await getConnectionLink(
      firebaseUid,
      app,
      redirectUrl || undefined
    );

    return NextResponse.json({ connectionUrl });
  } catch (error: any) {
    console.error("Error in connect route:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate connection link" },
      { status: 500 }
    );
  }
}
