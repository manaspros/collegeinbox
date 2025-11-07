import { NextRequest, NextResponse } from "next/server";
import { executeAction } from "@/lib/composio";

export async function POST(req: NextRequest) {
  try {
    const { userId, messageId, attachmentId, filename } = await req.json();

    if (!userId || !messageId || !attachmentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get attachment data from Gmail via Composio
    const result = await executeAction(userId, "GMAIL_GET_ATTACHMENT", {
      messageId: messageId,
      id: attachmentId,
    });

    if (!result.successfull || !result.data?.data) {
      return NextResponse.json(
        { error: "Failed to fetch attachment" },
        { status: 500 }
      );
    }

    // Decode base64 data
    const buffer = Buffer.from(result.data.data, "base64");

    // Return file as blob
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error downloading attachment:", error);
    return NextResponse.json(
      { error: error.message || "Failed to download attachment" },
      { status: 500 }
    );
  }
}
