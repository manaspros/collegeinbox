import { NextRequest, NextResponse } from "next/server";
import { executeAction } from "@/lib/composio";

export async function POST(req: NextRequest) {
  try {
    const { userId, title, start, course, description } = await req.json();

    if (!userId || !title || !start) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Parse the date
    const startDate = new Date(start);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

    // Create calendar event using Composio
    const result = await executeAction(userId, "GOOGLECALENDAR_CREATE_EVENT", {
      summary: title,
      description: description || `${course} - ${title}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "America/New_York", // TODO: Get user's timezone
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "America/New_York",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 60 }, // 1 hour before
        ],
      },
    });

    if (result.successfull) {
      return NextResponse.json({
        success: true,
        event: result.data,
      });
    } else {
      return NextResponse.json(
        { error: "Failed to create calendar event" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add to calendar" },
      { status: 500 }
    );
  }
}
