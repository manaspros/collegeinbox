import { NextRequest } from "next/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { getToolsForEntity } from "@/lib/composio";

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json();

    if (!userId) {
      return new Response("User ID is required", { status: 400 });
    }

    // Get Composio tools for the user (Gmail, Classroom, Calendar, Drive)
    const tools = await getToolsForEntity(userId, [
      "gmail",
      "googleclassroom",
      "googlecalendar",
      "googledrive",
    ]);

    // System prompt to guide the AI
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
- Use the appropriate Composio tools to fetch real data
- Provide accurate, specific information with dates and details
- Suggest relevant actions (e.g., "Would you like me to add this to your calendar?")
- Be concise but helpful

Examples of queries you should handle:
- "Show me all deadlines this week"
- "Find PDFs from my Machine Learning course"
- "What assignments are due this weekend?"
- "Search for unread emails from professors"
- "When is my next exam?"

Always prioritize accuracy and use tools to get real-time data instead of making assumptions.`;

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
