import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { executeAction, getConnectedAccountId } from "@/lib/composio";

/**
 * RAG-based chat endpoint for emails and PDFs
 * Fetches emails, extracts context, and answers questions using Gemini AI
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, question, maxEmails = 100 } = await req.json();

    if (!userId || !question) {
      return NextResponse.json(
        { error: "User ID and question are required" },
        { status: 400 }
      );
    }

    // Step 1: Get connected account ID for Gmail
    const accountId = await getConnectedAccountId(userId, "gmail");

    if (!accountId) {
      return NextResponse.json(
        { error: "No Gmail connection found. Please connect Gmail first." },
        { status: 400 }
      );
    }

    // Step 2: Fetch recent emails
    console.log(`Fetching ${maxEmails} emails for RAG context...`);
    const emailsResult = await executeAction(
      userId,
      "GMAIL_LIST_EMAILS",
      {
        query: "newer_than:60d", // Last 60 days
        maxResults: maxEmails,
      },
      accountId
    );

    const emails = emailsResult.data?.messages || emailsResult.messages || [];
    console.log(`Fetched ${emails.length} emails`);

    // Step 3: Build context from emails
    const emailContext = emails.slice(0, 50).map((email: any, index: number) => {
      return `Email ${index + 1}:
Subject: ${email.subject || "(No Subject)"}
From: ${email.from || "Unknown"}
Date: ${email.date || "Unknown"}
Body: ${(email.snippet || email.body || "").substring(0, 500)}
${email.hasAttachments ? `Attachments: ${email.attachmentNames?.join(", ") || "Yes"}` : ""}
---`;
    }).join("\n\n");

    // Step 4: Generate AI response using RAG
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `You are an intelligent email assistant for college students. You have access to the user's email inbox and can answer questions about their emails, assignments, deadlines, professors, courses, and documents.

**User's Question:** ${question}

**Email Context (Recent Emails):**
${emailContext}

**Instructions:**
1. Answer the question based ONLY on the email context provided above
2. If the answer is not in the emails, say "I don't see that information in your recent emails"
3. Be specific - mention email subjects, dates, senders when relevant
4. If there are deadlines or dates, highlight them clearly
5. If there are attachments (PDFs, docs) related to the question, mention them
6. Keep answers concise but informative (2-4 sentences)

**Answer:**`;

    const result = await model.generateContent(prompt);
    const answer = result.response.text();

    return NextResponse.json({
      success: true,
      answer,
      emailsAnalyzed: emails.length,
      context: {
        totalEmails: emails.length,
        dateRange: "Last 60 days",
      },
    });
  } catch (error: any) {
    console.error("Error in email RAG chat:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process question" },
      { status: 500 }
    );
  }
}
