import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables");
}

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Get Gemini model for general use
export function getGeminiModel(modelName: string = "gemini-2.0-flash-exp") {
  return genAI.getGenerativeModel({ model: modelName });
}

// Categorize email by course using Gemini
export async function categorizeEmail(subject: string, from: string, emailContent: string): Promise<string | null> {
  const model = getGeminiModel();

  const prompt = `Analyze this email and identify the course name. Look for:
- Course codes (e.g., CS-101, MATH-204, ENG201)
- Course names (e.g., "Introduction to Computer Science", "Organic Chemistry")
- Department abbreviations

Return ONLY the course name/code, nothing else. If no course is identifiable, return "null".

From: ${from}
Subject: ${subject}
Content: ${emailContent.substring(0, 500)}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    return response === "null" ? null : response;
  } catch (error) {
    console.error("Error categorizing email:", error);
    return null;
  }
}

// OLD categorizeEmail function for backward compatibility
export async function categorizeEmailDetailed(emailContent: string, subject: string) {
  const model = getGeminiModel();

  const prompt = `Analyze this email and categorize it. Return ONLY a JSON object with these fields:
{
  "category": "assignment" | "exam" | "schedule_change" | "grade" | "administrative" | "general",
  "priority": "high" | "medium" | "low",
  "hasDeadline": boolean,
  "deadline": "YYYY-MM-DD" or null,
  "courseName": string or null,
  "actionItems": string[]
}

Email Subject: ${subject}
Email Content: ${emailContent}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    // Extract JSON from response (might have markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON in response");
  } catch (error) {
    console.error("Error categorizing email:", error);
    return {
      category: "general",
      priority: "low",
      hasDeadline: false,
      deadline: null,
      courseName: null,
      actionItems: [],
    };
  }
}

// Summarize long email
export async function summarizeEmail(emailContent: string) {
  const model = getGeminiModel();

  const prompt = `Summarize this email in 2-3 concise sentences. Focus on:
1. Main topic/purpose
2. Key action items or deadlines
3. Important details

Email: ${emailContent}`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Error summarizing email:", error);
    return "Unable to generate summary.";
  }
}

// Extract deadlines from text
export async function extractDeadlines(text: string, subject: string) {
  const model = getGeminiModel();

  const prompt = `Extract all deadlines, due dates, and important dates from this email. Return ONLY a JSON array:
[
  {
    "title": "Assignment title or event name",
    "dueAt": "YYYY-MM-DDTHH:mm:ss.000Z" (ISO 8601 format),
    "type": "assignment" | "exam" | "submission" | "event"
  }
]

If no deadlines found, return empty array [].

Subject: ${subject}
Text: ${text.substring(0, 1000)}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return [];
  } catch (error) {
    console.error("Error extracting deadlines:", error);
    return [];
  }
}

// Detect schedule alerts/changes
export async function detectAlerts(subject: string, text: string) {
  const keywords = ["cancelled", "canceled", "rescheduled", "postponed", "urgent", "room change", "location change", "time change"];

  const lowerSubject = subject.toLowerCase();
  const lowerText = text.toLowerCase();

  const foundKeyword = keywords.find(
    (kw) => lowerSubject.includes(kw) || lowerText.includes(kw)
  );

  if (!foundKeyword) return null;

  const model = getGeminiModel();
  const prompt = `Analyze this email for schedule changes/alerts. Return ONLY a JSON object:
{
  "kind": "cancelled" | "rescheduled" | "urgent" | "room_change",
  "subject": "brief description",
  "link": null
}

Subject: ${subject}
Text: ${text.substring(0, 500)}`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("Error detecting alert:", error);
    return null;
  }
}

// Generate embeddings for semantic search
export async function generateEmbedding(text: string) {
  try {
    const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}

export default genAI;
