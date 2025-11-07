import { NextRequest } from "next/server";
import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { executeAction } from "@/lib/composio";
import { customTools } from "@/lib/customTools";

export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json();

    if (!userId) {
      return new Response("User ID is required", { status: 400 });
    }

    console.log("Chat - Using custom cache tools for faster responses");

    // System prompt to guide the AI
    const systemPrompt = `You are an intelligent academic assistant for college students.

IMPORTANT - Tool Usage Strategy:
1. ALWAYS use cached data first (query_deadlines, query_documents, query_alerts, check_sync_status)
2. These cached tools are MUCH FASTER (< 500ms vs 3-7 seconds)
3. Only use Gmail/Calendar/Drive tools for:
   - Sending emails
   - Real-time searches for very recent data
   - Actions that modify data

Available Tools:
- query_deadlines: Get upcoming assignments and deadlines (from cache, FAST)
- query_documents: Search for PDFs, DOCX, PPT files (from cache, FAST)
- query_alerts: Get schedule changes, cancellations (from cache, FAST)
- check_sync_status: See when last sync happened
- Gmail tools: For sending emails or real-time searches (SLOW, use sparingly)
- Calendar tools: For creating events
- Classroom tools: For course-specific queries
- Drive tools: For file management

Your role is to help students:
1. Find and track assignment deadlines (use query_deadlines)
2. Organize course materials and documents (use query_documents)
3. Monitor schedule changes and important announcements (use query_alerts)
4. Search for specific files and emails
5. Summarize course updates
6. Add deadlines to calendar

Response Strategy:
- User asks "show my deadlines" → Use query_deadlines (FAST)
- User asks "Math 101 assignments" → Use query_deadlines with course filter (FAST)
- User asks "find PDFs about machine learning" → Use query_documents (FAST)
- User asks "any cancelled classes" → Use query_alerts (FAST)
- User asks "send email to professor" → Use Gmail tools (appropriate)

Always prioritize cached tools for faster responses. Be concise but helpful.`;

    // Register custom cache tools (FAST)
    const aiTools: any = {};

    for (const [toolName, tool] of Object.entries(customTools)) {
      aiTools[toolName] = {
        description: tool.description,
        parameters: tool.parameters,
        execute: async (params: any) => {
          console.log(`Executing custom tool: ${toolName}`, params);
          try {
            const result = await tool.execute(params, userId);
            console.log(`Tool ${toolName} result:`, result);
            return result;
          } catch (error: any) {
            console.error(`Error executing ${toolName}:`, error);
            return { error: error.message };
          }
        },
      };
    }

    // Note: Composio tools (Gmail, Calendar, etc.) can be added here if needed for real-time actions
    // For now, we prioritize cached data for faster responses

    const result = streamText({
      model: google("gemini-2.0-flash-exp"),
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      tools: aiTools,
      maxSteps: 5, // Allow multi-step tool usage
      onStepFinish: async ({ toolCalls, toolResults }) => {
        // Log tool executions for debugging
        if (toolCalls && toolCalls.length > 0) {
          console.log("Tools called:", toolCalls.map((t: any) => t.toolName));
        }
      },
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to process chat" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
