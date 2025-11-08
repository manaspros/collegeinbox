import { NextRequest, NextResponse } from "next/server";
import { executeAction, getConnectedAccountId } from "@/lib/composio";

/**
 * API endpoint to fetch Google Classroom courses
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, connectedAccountId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get or use provided connected account ID
    const accountId = connectedAccountId || await getConnectedAccountId(userId, "googleclassroom");

    if (!accountId) {
      return NextResponse.json(
        { error: "No Google Classroom connection found. Please connect Google Classroom first." },
        { status: 400 }
      );
    }

    console.log(`Fetching Google Classroom courses for user: ${userId}, account: ${accountId}`);

    // Fetch courses using Composio v3
    const result = await executeAction(
      userId,
      "GOOGLECLASSROOM_LIST_COURSES",
      {
        courseStates: ["ACTIVE"],
        pageSize: 100,
      },
      accountId
    );

    return NextResponse.json({
      success: true,
      courses: (result.data?.courses || []) as any[],
    });
  } catch (error: any) {
    console.error("Error fetching Google Classroom courses:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}
