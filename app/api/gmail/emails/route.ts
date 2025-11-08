import { NextRequest, NextResponse } from "next/server";
import { executeAction } from "@/lib/composio";

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

    // Fetch emails using Gmail API through Composio v3
    const result = await executeAction(userId, "GMAIL_FETCH_EMAILS", {
      query: query || "is:unread", // Default to unread emails
      max_results: maxResults,
    });

    return NextResponse.json({
      success: true,
      emails: result.data || result || [],
    });
  } catch (error: any) {
    console.error("Error fetching Gmail emails:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
