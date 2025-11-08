import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * API endpoint to analyze emails and extract deadlines
 * Uses simplified approach to avoid quota issues
 */
export async function POST(req: NextRequest) {
  try {
    const { subject, body, from, emailId } = await req.json();

    if (!subject && !body) {
      return NextResponse.json(
        { error: "Email subject or body is required" },
        { status: 400 }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // Single AI call to get summary AND deadlines
    const prompt = `Analyze this email and provide:
1. A brief summary (2-3 sentences)
2. Any deadlines/due dates found

Email Subject: ${subject}
From: ${from}
Content: ${body}

Respond in JSON format:
{
  "summary": "Brief summary here",
  "hasDeadline": true/false,
  "deadlines": [
    {
      "title": "Assignment/task name",
      "date": "YYYY-MM-DD",
      "time": "HH:MM" or null,
      "description": "Brief description"
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    let analysisData;

    if (jsonMatch) {
      analysisData = JSON.parse(jsonMatch[0]);
    } else {
      // Fallback if JSON parsing fails
      analysisData = {
        summary: responseText.substring(0, 500),
        hasDeadline: false,
        deadlines: []
      };
    }

    // Format summary for display
    const formattedSummary = `## 📧 Email Summary

### 🎯 Main Purpose
${analysisData.summary}

${analysisData.deadlines && analysisData.deadlines.length > 0 ? `
### 📅 Deadlines Found
${analysisData.deadlines.map((d: any) =>
  `• **${d.title}** - Due: ${d.date}${d.time ? ` at ${d.time}` : ''}`
).join('\n')}
` : ''}

### ✅ Action Items
${analysisData.hasDeadline ? 'Review deadlines above and add to calendar' : '_No immediate action required._'}`;

    return NextResponse.json({
      success: true,
      summary: formattedSummary,
      hasDeadline: analysisData.hasDeadline || false,
      deadlines: analysisData.deadlines || [],
      emailId: emailId,
    });
  } catch (error: any) {
    console.error("Error analyzing email:", error);

    // Return simple fallback instead of error
    return NextResponse.json({
      success: true,
      summary: `## 📧 Email Summary\n\n**Subject:** ${req.body?.subject || 'N/A'}\n**From:** ${req.body?.from || 'N/A'}\n\n_Analysis temporarily unavailable. Please try again later._`,
      hasDeadline: false,
      deadlines: [],
    });
  }
}
