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

    // RAG: Use semantic search to find relevant emails
    let ragContext = "";
    try {
      console.log("Using semantic search for RAG context...");

      // Get last user message to search for relevant emails
      const lastUserMessage = messages.filter((m: any) => m.role === "user").pop();
      const query = lastUserMessage?.content || "";

      if (query) {
        // Semantic search: Find most relevant emails
        const relevantEmails = await searchEmails(userId, query, 5); // Top 5 most relevant

        if (relevantEmails.length > 0) {
          ragContext = `\n\n**RELEVANT EMAILS (found using semantic search):**\n`;
          relevantEmails.forEach((email: any, idx: number) => {
            ragContext += `\n--- Email ${idx + 1} ---\n`;
            ragContext += `Subject: ${email.subject}\n`;
            ragContext += `From: ${email.from}\n`;
            ragContext += `Date: ${email.date}\n`;
            ragContext += `Content: ${email.body.substring(0, 500)}${email.body.length > 500 ? '...' : ''}\n`;
          });
          console.log(`Found ${relevantEmails.length} relevant emails via semantic search`);
        } else {
          ragContext = `\n\n**NOTE:** No relevant emails found. User may need to sync emails first.`;
          console.log("No emails found in vector database");
        }
      }
    } catch (error) {
      console.error("Failed to fetch RAG context:", error);
      ragContext = `\n\n**NOTE:** Could not search emails. Some features may be limited.`;
    }

    // System prompt to guide the AI (enhanced with RAG)
    const systemPrompt = `You are an intelligent academic assistant for college students. You have access to:

- **Semantic Email Search**: The system has already found the most relevant emails for this question (see below)
- **Gmail Tools**: Use only if you need fresh/real-time data not in the search results
- **Google Classroom**: Access courses, assignments, materials, and submissions
- **Google Calendar**: View and create events, find deadlines
- **Google Drive**: Search and access files and documents

Your role is to help students by:
1. **Analyzing emails** found through semantic search to extract deadlines, assignments, and important information
2. **Identifying patterns** across multiple emails (recurring themes, upcoming deadlines, course requirements)
3. **Summarizing key information** from professors and course staff
4. **Suggesting actions** like adding deadlines to calendar or organizing materials
5. **Answering questions** directly from email content

How to respond:
- **FIRST** analyze the relevant emails provided below (found via semantic search)
- **Extract information** like deadlines, assignment details, exam dates, schedule changes
- **Provide specific details** with dates, times, course names from the emails
- **Quote key parts** of emails when relevant
- **Only use Composio tools** if the emails don't contain the answer
- Be concise and helpful

Examples of what you can do:
- "Show me all deadlines this week" → Analyze emails to find and list deadlines
- "What did my professor say about the exam?" → Find and summarize professor's email
- "Find assignments for Machine Learning" → Search emails for ML course assignments
- "When is the project due?" → Extract deadline from relevant emails
- "Any schedule changes?" → Identify cancellations, room changes from emails

${ragContext}

**IMPORTANT:** The emails above were found using semantic search based on the user's question. Analyze them carefully to provide accurate answers. If no emails are shown, the user needs to sync their emails first (sync button in dashboard).`;

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
