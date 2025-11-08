import { NextRequest, NextResponse } from "next/server";
import { executeAction, getConnectedAccountId } from "@/lib/composio";

/**
 * API endpoint to fetch Google Classroom course materials
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, courseId, connectedAccountId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
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

    console.log(`Fetching materials for course: ${courseId}, user: ${userId}`);

    // Fetch course materials using Composio v3
    const result = await executeAction(
      userId,
      "GOOGLECLASSROOM_LIST_COURSE_MATERIALS",
      {
        courseId: courseId,
        pageSize: 100,
      },
      accountId
    );

    return NextResponse.json({
      success: true,
      materials: (result.data?.materials || []) as any[],
    });
  } catch (error: any) {
    console.error("Error fetching Google Classroom materials:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch materials" },
      { status: 500 }
    );
  }
}
