import { NextRequest, NextResponse } from "next/server";
import { executeAction, getConnectedAccountId } from "@/lib/composio";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * API endpoint to analyze emails for deadlines, alerts, and categorization
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, maxEmails = 100, connectedAccountId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get or use provided connected account ID
    const accountId = connectedAccountId || await getConnectedAccountId(userId, "gmail");

    if (!accountId) {
      return NextResponse.json(
        { error: "No Gmail connection found. Please connect Gmail first." },
        { status: 400 }
      );
    }

    console.log(`Using connected account: ${accountId} for user: ${userId}`);

    // Fetch recent emails from college domain using Composio v3
    const emailsResult = await executeAction(
      userId,
      "GMAIL_LIST_EMAILS",
      {
        query: "newer_than:30d",
        maxResults: maxEmails,
      },
      accountId // Pass connected account ID
    );

    const emails = emailsResult.data || emailsResult || [];

    // Initialize Gemini AI for analysis
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Analyze emails to extract:
    // 1. Deadlines (assignments, exams)
    // 2. Schedule changes (cancelled, rescheduled)
    // 3. Course categorization
    // 4. Documents (PDFs, DOCX, PPT)

    const prompt = `Analyze the following email data and extract:

1. **Deadlines**: Any assignments, exams, or submission dates
   - Extract: title, course/subject, due date, description

2. **Schedule Changes**: Emails about cancelled classes, room changes, rescheduled events
   - Extract: type (cancelled/rescheduled/urgent), course, original/new details, date

3. **Documents**: All PDF, DOCX, and PPT attachments
   - Extract: filename, course/subject, type (assignment/lecture/notes)

4. **Categorization**: Categorize each email by course/subject
   - Extract: course name, category (assignment/announcement/grade/administrative)

Email Data (JSON format):
${JSON.stringify(emails.slice(0, 50), null, 2)}

Return a JSON object with this structure:
{
  "deadlines": [
    {
      "id": "unique-id",
      "title": "Assignment name",
      "course": "Course name",
      "dueDate": "ISO date string",
      "description": "Brief description",
      "type": "assignment|exam|project|submission",
      "priority": "high|medium|low"
    }
  ],
  "scheduleChanges": [
    {
      "id": "unique-id",
      "type": "cancelled|rescheduled|room_change|urgent",
      "course": "Course name",
      "message": "Change description",
      "date": "ISO date string",
      "details": "Additional details"
    }
  ],
  "documents": [
    {
      "id": "unique-id",
      "filename": "Document name",
      "course": "Course name",
      "type": "pdf|docx|ppt",
      "category": "assignment|lecture|notes|syllabus",
      "url": "Download URL if available"
    }
  ],
  "categorization": {
    "courseName": {
      "totalEmails": 10,
      "unreadCount": 3,
      "categories": {
        "assignments": 5,
        "announcements": 3,
        "grades": 2
      }
    }
  }
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      deadlines: [],
      scheduleChanges: [],
      documents: [],
      categorization: {}
    };

    return NextResponse.json({
      success: true,
      analysis,
      totalEmailsAnalyzed: emails.length,
    });
  } catch (error: any) {
    console.error("Error analyzing emails:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze emails" },
      { status: 500 }
    );
  }
}
