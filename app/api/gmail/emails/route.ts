import { NextRequest, NextResponse } from "next/server";
import { getComposioEntity } from "@/lib/composio";

/**
 * API endpoint to fetch Gmail emails with filtering
 * Supports filtering by unread, from specific senders, date range, etc.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, query, maxResults = 50 } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const entity = await getComposioEntity(userId);

    // Fetch emails using Gmail API through Composio
    const result = await entity.execute("GMAIL_LIST_EMAILS", {
      query: query || "is:unread", // Default to unread emails
      maxResults,
    });

    return NextResponse.json({
      success: true,
      emails: result.data || [],
    });
  } catch (error: any) {
    console.error("Error fetching Gmail emails:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
