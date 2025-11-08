import { NextRequest, NextResponse } from "next/server";
import { executeAction, getConnectedAccountId } from "@/lib/composio";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Calendar Sync API
 *
 * Adds events to Google Calendar with optional reminders
 */
export async function POST(req: NextRequest) {
  try {
    const {
      userId,
      event,
      addReminders = true,
      reminderMinutes = [60, 1440], // 1 hour and 1 day before
    } = await req.json();

    if (!userId || !event) {
      return NextResponse.json(
        { error: "User ID and event data are required" },
        { status: 400 }
      );
    }

    console.log(`\n=== Adding event to calendar for user: ${userId} ===`);
    console.log(`Event:`, event);

    // Get Google Calendar connection
    const accountId = await getConnectedAccountId(userId, "googlecalendar");

    if (!accountId) {
      return NextResponse.json(
        {
          error:
            "No Google Calendar connection found. Please connect Google Calendar first.",
        },
        { status: 400 }
      );
    }

    // Prepare event data
    const calendarEvent: any = {
      summary: event.title || event.summary,
      description: event.description || "",
      start: {
        dateTime: event.startDate || event.dueDate,
        timeZone: event.timeZone || "America/New_York",
      },
      end: {
        dateTime: event.endDate || event.dueDate,
        timeZone: event.timeZone || "America/New_York",
      },
    };

    // Add reminders if requested
    if (addReminders) {
      calendarEvent.reminders = {
        useDefault: false,
        overrides: reminderMinutes.map((minutes: number) => ({
          method: "popup",
          minutes,
        })),
      };
    }

    // Add event to Google Calendar using Composio
    const result = await executeAction(
      userId,
      "GOOGLECALENDAR_CREATE_EVENT",
      calendarEvent,
      accountId
    );

    console.log(`✅ Event added to calendar successfully`);

    // Update Firestore to mark deadline as added to calendar
    if (event.id) {
      try {
        await updateDoc(
          doc(db, "deadlines", userId, "events", event.id),
          {
            addedToCalendar: true,
            calendarEventId: result.data?.id || result.id,
          }
        );
        console.log(`Updated deadline ${event.id} in Firestore`);
      } catch (firestoreError) {
        console.error("Error updating Firestore:", firestoreError);
        // Don't fail the request if Firestore update fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Event added to calendar successfully",
      eventId: result.data?.id || result.id,
      eventLink: result.data?.htmlLink || result.htmlLink,
    });
  } catch (error: any) {
    console.error("Error adding event to calendar:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add event to calendar" },
      { status: 500 }
    );
  }
}

/**
 * Add reminder from email detection
 */
export async function PUT(req: NextRequest) {
  try {
    const {
      userId,
      emailId,
      reminderData,
    } = await req.json();

    if (!userId || !emailId || !reminderData) {
      return NextResponse.json(
        { error: "User ID, email ID, and reminder data are required" },
        { status: 400 }
      );
    }

    console.log(`\n=== Adding reminder from email: ${emailId} ===`);

    // Create event from reminder data
    const event = {
      title: reminderData.title || "Reminder",
      description: reminderData.description || "",
      startDate: reminderData.suggestedDate || new Date().toISOString(),
      endDate: reminderData.suggestedDate || new Date().toISOString(),
    };

    // Use POST logic
    return POST(
      new NextRequest(req.url, {
        method: "POST",
        body: JSON.stringify({
          userId,
          event: { ...event, emailId },
          addReminders: true,
        }),
      })
    );
  } catch (error: any) {
    console.error("Error adding reminder:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add reminder" },
      { status: 500 }
    );
  }
}
