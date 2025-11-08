import { NextRequest, NextResponse } from "next/server";
import { getDeadlines, getAlerts, getDocuments } from "@/lib/agentic-rag";

/**
 * Dashboard Data API
 *
 * Efficiently retrieves dashboard data from Firestore (no Gmail API calls!)
 * This replaces the old /api/gmail/analyze endpoint which was expensive.
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

    console.log(`\n=== Fetching dashboard data for user: ${userId} ===`);

    // Fetch all data in parallel from Firestore (FAST!)
    const [deadlines, scheduleChanges, documents] = await Promise.all([
      getDeadlines(userId),
      getAlerts(userId),
      getDocuments(userId),
    ]);

    console.log(`Retrieved:`);
    console.log(`  - Deadlines: ${deadlines.length}`);
    console.log(`  - Alerts: ${scheduleChanges.length}`);
    console.log(`  - Documents: ${documents.length}`);

    return NextResponse.json({
      success: true,
      data: {
        deadlines,
        scheduleChanges,
        documents,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}
