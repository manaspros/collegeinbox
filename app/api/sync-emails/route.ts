import { NextRequest, NextResponse } from "next/server";
import { executeAction, getConnectedAccountId } from "@/lib/composio";
import { batchProcessEmails } from "@/lib/agentic-rag";

/**
 * Email Sync Endpoint
 *
 * Fetches new emails from Gmail and processes them through the agentic RAG pipeline.
 * This should be called:
 * 1. On user login (initial sync)
 * 2. Periodically (via cron job or webhook)
 * 3. On manual refresh
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, maxEmails = 50, query = "newer_than:7d" } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log(`\n=== Email Sync Started for user: ${userId} ===`);

    // Get Gmail connection
    const accountId = await getConnectedAccountId(userId, "gmail");

    if (!accountId) {
      return NextResponse.json(
        { error: "No Gmail connection found. Please connect Gmail first." },
        { status: 400 }
      );
    }

    // Fetch emails from Gmail
    console.log(`Fetching emails with query: ${query}, max: ${maxEmails}`);
    const emailsResult = await executeAction(
      userId,
      "GMAIL_FETCH_EMAILS",
      {
        query,
        max_results: maxEmails,
      },
      accountId
    );

    const emails = emailsResult.data?.messages || emailsResult.messages || [];

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No new emails to process",
        stats: {
          fetched: 0,
          processed: 0,
          failed: 0,
        },
      });
    }

    console.log(`Fetched ${emails.length} emails from Gmail`);

    // Process emails through agentic RAG pipeline
    const { success, failed } = await batchProcessEmails(userId, emails);

    console.log(`=== Email Sync Complete ===`);
    console.log(`  Fetched: ${emails.length}`);
    console.log(`  Processed: ${success}`);
    console.log(`  Failed: ${failed}`);

    return NextResponse.json({
      success: true,
      message: `Processed ${success} emails successfully`,
      stats: {
        fetched: emails.length,
        processed: success,
        failed,
      },
    });
  } catch (error: any) {
    console.error("Error syncing emails:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync emails" },
      { status: 500 }
    );
  }
}

/**
 * Get sync status
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // TODO: Implement sync status tracking
    // For now, return a simple status
    return NextResponse.json({
      status: "ready",
      lastSync: null,
      message: "Sync endpoint is ready. Use POST to start sync.",
    });
  } catch (error: any) {
    console.error("Error getting sync status:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get sync status" },
      { status: 500 }
    );
  }
}
