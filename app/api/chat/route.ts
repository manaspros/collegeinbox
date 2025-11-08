import { NextRequest } from "next/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { getToolsForEntity } from "@/lib/composio";
import { getDeadlines, getAlerts, getDocuments, searchEmails } from "@/lib/agentic-rag";

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json();

    if (!userId) {
      return new Response("User ID is required", { status: 400 });
    }

    // Get Composio tools for the user (Gmail, Classroom, Calendar, Drive)
    const tools = await getToolsForEntity(userId, [
      "gmail",
      "google_classroom",
      "googlecalendar",
      "googledrive",
    ]);

    // RAG: Fetch cached data from Firestore (instant, no API calls!)
    let ragContext = "";
    try {
      console.log("Fetching RAG context from Firestore...");

      // Get cached deadlines, alerts, and documents
      const [deadlines, alerts, documents] = await Promise.all([
        getDeadlines(userId),
        getAlerts(userId),
        getDocuments(userId),
      ]);

      // Build structured context
      if (deadlines.length > 0 || alerts.length > 0 || documents.length > 0) {
        ragContext = `\n\n**CACHED DATA (from your emails):**\n`;

        // Add upcoming deadlines
        if (deadlines.length > 0) {
          ragContext += `\n**UPCOMING DEADLINES (${deadlines.length} total):**\n`;
          deadlines.slice(0, 10).forEach((d: any) => {
            ragContext += `- ${d.title} (${d.course}) - Due: ${d.dueDate} [Priority: ${d.priority}]\n`;
          });
        }

        // Add recent alerts
        if (alerts.length > 0) {
          ragContext += `\n**RECENT ALERTS (${alerts.length} total):**\n`;
          alerts.slice(0, 5).forEach((a: any) => {
            ragContext += `- ${a.message} (${a.course}) - ${a.type}\n`;
          });
        }

        // Add documents
        if (documents.length > 0) {
          ragContext += `\n**DOCUMENTS (${documents.length} total):**\n`;
          const docsByCourse = documents.reduce((acc: any, doc: any) => {
            if (!acc[doc.course]) acc[doc.course] = [];
            acc[doc.course].push(doc);
            return acc;
          }, {});
          Object.entries(docsByCourse).slice(0, 5).forEach(([course, docs]: [string, any]) => {
            ragContext += `- ${course}: ${docs.length} files (${docs.map((d: any) => d.filename).slice(0, 3).join(", ")})\n`;
          });
        }

        console.log(`Added RAG context: ${deadlines.length} deadlines, ${alerts.length} alerts, ${documents.length} documents`);
      } else {
        ragContext = `\n\n**NOTE:** No cached email data found. User should sync emails first using the sync button.`;
        console.log("No RAG data available - user needs to sync emails");
      }
    } catch (error) {
      console.error("Failed to fetch RAG context:", error);
      ragContext = `\n\n**NOTE:** Could not load cached data. Some features may be limited.`;
    }

    // System prompt to guide the AI (enhanced with RAG)
    const systemPrompt = `You are an intelligent academic assistant for college students. You have access to:

- Gmail: Read, search, and send emails
- Google Classroom: Access courses, assignments, materials, and submissions
- Google Calendar: View and create events, find deadlines
- Google Drive: Search and access files and documents

Your role is to help students:
1. Find and track assignment deadlines
2. Organize course materials and documents
3. Monitor schedule changes and important announcements
4. Search for specific files and emails
5. Summarize long emails and course updates

When a user asks about deadlines, assignments, emails, or schedule:
- FIRST check the CACHED DATA below - this is extracted from the student's emails
- The cached data includes deadlines, alerts, and documents already processed
- Only use Composio tools if you need fresh/real-time data not in the cache
- Provide accurate, specific information with dates and details
- Suggest relevant actions (e.g., "Would you like me to add this to your calendar?")
- Be concise but helpful

Examples of queries you should handle:
- "Show me all deadlines this week"
- "Find PDFs from my Machine Learning course"
- "What assignments are due this weekend?"
- "Search for unread emails from professors"
- "When is my next exam?"
- "What schedule changes do I have?"
- "Show me documents from my Database course"

${ragContext}

**IMPORTANT:** If the cached data shows no information, politely inform the user they need to sync their emails first (there's a sync button in the dashboard). Otherwise, use the cached data above for instant answers.`;

    const result = await streamText({
      model: google("gemini-2.0-flash-exp"),
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      tools: tools as any,
      maxSteps: 5, // Allow multi-step tool usage
      onStepFinish: async ({ toolCalls, toolResults }) => {
        // Log tool executions for debugging
        if (toolCalls && toolCalls.length > 0) {
          console.log("Tools called:", toolCalls.map((t: any) => t.name));
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process chat" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
