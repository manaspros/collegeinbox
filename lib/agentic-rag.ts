import { adminDb } from "@/lib/firebaseAdmin";
import { categorizeEmail, extractDeadlines } from "@/lib/gemini";
import { generateNomicEmbedding, generateNomicQueryEmbedding } from "@/lib/nomic-embeddings";
import { executeAction, getConnectedAccountId } from "@/lib/composio";

/**
 * Agentic RAG System for Collegiate Inbox Navigator
 *
 * This system automatically:
 * 1. Converts emails to vector embeddings
 * 2. Extracts deadlines, documents, and alerts using AI agents
 * 3. Stores everything in Firestore for instant dashboard access
 * 4. Enables semantic search over email content
 */

// ==================== TYPES ====================

export interface EmailEmbedding {
  id: string;
  emailId: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  body: string;
  embedding: number[];
  category: string;
  courseName: string | null;
  hasDeadline: boolean;
  processed: boolean;
  createdAt: Date;
}

export interface Deadline {
  id: string;
  emailId: string;
  title: string;
  course: string;
  dueDate: string;
  dueTime?: string;
  description: string;
  type: "assignment" | "exam" | "project" | "submission";
  priority: "high" | "medium" | "low";
  addedToCalendar: boolean;
  createdAt: Date;
}

export interface ScheduleChange {
  id: string;
  emailId: string;
  type: "cancelled" | "rescheduled" | "room_change" | "urgent";
  course: string;
  message: string;
  date: string;
  details: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  emailId: string;
  filename: string;
  course: string;
  type: "pdf" | "docx" | "ppt" | "xlsx" | "other";
  category: "assignment" | "lecture" | "notes" | "syllabus";
  url?: string;
  mimeType?: string;
  size?: number;
  createdAt: Date;
}

// ==================== AGENTS ====================

/**
 * Deadline Extraction Agent
 * Analyzes email content and extracts all deadlines/due dates
 */
export async function deadlineAgent(
  userId: string,
  emailId: string,
  subject: string,
  body: string
): Promise<Deadline[]> {
  console.log(`[Deadline Agent] Processing email: ${emailId}`);

  try {
    const extractedDeadlines = await extractDeadlines(`${subject}\n\n${body}`);

    const deadlines: Deadline[] = extractedDeadlines.map((d: any, index: number) => ({
      id: `${emailId}_deadline_${index}`,
      emailId,
      title: d.title,
      course: d.course || "Unknown",
      dueDate: d.date,
      dueTime: d.time || undefined,
      description: `From email: ${subject}`,
      type: d.type || "assignment",
      priority: determinePriority(d.date),
      addedToCalendar: false,
      createdAt: new Date(),
    }));

    // Save to Firestore
    for (const deadline of deadlines) {
      await adminDb
        .collection("deadlines")
        .doc(userId)
        .collection("events")
        .doc(deadline.id)
        .set(deadline);
    }

    console.log(`[Deadline Agent] Extracted ${deadlines.length} deadlines`);
    return deadlines;
  } catch (error) {
    console.error("[Deadline Agent] Error:", error);
    return [];
  }
}

/**
 * Document Extraction Agent
 * Finds and catalogs all attachments (PDFs, DOCX, PPT, etc.)
 */
export async function documentAgent(
  userId: string,
  emailId: string,
  emailData: any,
  courseName: string | null
): Promise<Document[]> {
  console.log(`[Document Agent] Processing email: ${emailId}`);

  try {
    const attachments = emailData.attachments || [];
    const documents: Document[] = [];

    for (const attachment of attachments) {
      const fileType = getFileType(attachment.filename || attachment.mimeType);

      if (["pdf", "docx", "ppt", "xlsx"].includes(fileType)) {
        const document: Document = {
          id: `${emailId}_doc_${attachment.id || documents.length}`,
          emailId,
          filename: attachment.filename,
          course: courseName || "Unknown",
          type: fileType as any,
          category: categorizeDocument(attachment.filename),
          url: attachment.url,
          mimeType: attachment.mimeType,
          size: attachment.size,
          createdAt: new Date(),
        };

        documents.push(document);

        // Save to Firestore
        await adminDb
          .collection("documents")
          .doc(userId)
          .collection("files")
          .doc(document.id)
          .set(document);
      }
    }

    console.log(`[Document Agent] Extracted ${documents.length} documents`);
    return documents;
  } catch (error) {
    console.error("[Document Agent] Error:", error);
    return [];
  }
}

/**
 * Alert Detection Agent
 * Detects schedule changes, cancellations, urgent notices
 */
export async function alertAgent(
  userId: string,
  emailId: string,
  subject: string,
  body: string,
  courseName: string | null
): Promise<ScheduleChange[]> {
  console.log(`[Alert Agent] Processing email: ${emailId}`);

  try {
    const alerts: ScheduleChange[] = [];
    const alertKeywords = {
      cancelled: /cancel{1,2}ed|class cancel{1,2}ed/i,
      rescheduled: /reschedule[d]?|moved to|new time/i,
      room_change: /room change|new location|moved to room/i,
      urgent: /urgent|important notice|immediate attention/i,
    };

    const combinedText = `${subject}\n${body}`.toLowerCase();

    for (const [type, regex] of Object.entries(alertKeywords)) {
      if (regex.test(combinedText)) {
        const alert: ScheduleChange = {
          id: `${emailId}_alert_${type}`,
          emailId,
          type: type as any,
          course: courseName || "Unknown",
          message: subject,
          date: new Date().toISOString(),
          details: body.substring(0, 200),
          createdAt: new Date(),
        };

        alerts.push(alert);

        // Save to Firestore
        await adminDb
          .collection("alerts")
          .doc(userId)
          .collection("items")
          .doc(alert.id)
          .set(alert);
      }
    }

    console.log(`[Alert Agent] Detected ${alerts.length} alerts`);
    return alerts;
  } catch (error) {
    console.error("[Alert Agent] Error:", error);
    return [];
  }
}

/**
 * Reminder Detection Agent
 * Detects time-based reminders and offers calendar sync
 */
export async function reminderAgent(
  userId: string,
  emailId: string,
  subject: string,
  body: string
): Promise<{ hasReminder: boolean; suggestedEvent?: any }> {
  console.log(`[Reminder Agent] Processing email: ${emailId}`);

  try {
    // Detect time/date patterns
    const timePatterns = [
      /(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/,
      /(\d{1,2})\s*(am|pm|AM|PM)/,
      /(tomorrow|today|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
      /(\d{4}-\d{2}-\d{2})/,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
    ];

    const combinedText = `${subject}\n${body}`;
    let hasReminder = false;
    let suggestedEvent = null;

    for (const pattern of timePatterns) {
      if (pattern.test(combinedText)) {
        hasReminder = true;

        // Extract potential event details
        suggestedEvent = {
          title: subject,
          description: body.substring(0, 500),
          emailId,
          extractedTime: combinedText.match(pattern)?.[0],
        };

        break;
      }
    }

    console.log(`[Reminder Agent] Has reminder: ${hasReminder}`);
    return { hasReminder, suggestedEvent };
  } catch (error) {
    console.error("[Reminder Agent] Error:", error);
    return { hasReminder: false };
  }
}

// ==================== EMAIL PROCESSING PIPELINE ====================

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main pipeline: Process a single email through all agents
 */
export async function processEmail(
  userId: string,
  emailData: any
): Promise<void> {
  try {
    // Extract email ID - handle different formats from Gmail API
    const emailId = emailData.id || emailData.messageId || emailData.threadId || `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Validate emailId
    if (!emailId || typeof emailId !== 'string' || emailId.trim() === '') {
      console.error('[Pipeline] Invalid email ID:', emailData);
      throw new Error('Email ID is required and must be a non-empty string');
    }

    console.log(`\n[Pipeline] Processing email: ${emailId}`);

    const subject = emailData.subject || "";
    const body = emailData.body || emailData.snippet || "";
    const from = emailData.from || "";
    const date = emailData.date || new Date().toISOString();

    // 1. Categorize email
    const categorization = await categorizeEmail(body, subject);

    // 2. Generate embedding for semantic search using Nomic
    const embedding = await generateNomicEmbedding(`${subject}\n\n${body}`);

    if (!embedding) {
      console.error("[Pipeline] Failed to generate embedding - Nomic API may not be configured");
      return;
    }

    // 3. Store email with embedding
    const emailEmbedding: EmailEmbedding = {
      id: emailId,
      emailId,
      subject,
      from,
      date,
      snippet: body.substring(0, 200),
      body,
      embedding,
      category: categorization.category,
      courseName: categorization.courseName,
      hasDeadline: categorization.hasDeadline,
      processed: false,
      createdAt: new Date(),
    };

    await adminDb
      .collection("email_embeddings")
      .doc(userId)
      .collection("emails")
      .doc(emailId)
      .set(emailEmbedding);

    // 4. Run parallel agents
    const [deadlines, documents, alerts, reminder] = await Promise.all([
      deadlineAgent(userId, emailId, subject, body),
      documentAgent(userId, emailId, emailData, categorization.courseName),
      alertAgent(userId, emailId, subject, body, categorization.courseName),
      reminderAgent(userId, emailId, subject, body),
    ]);

    // 5. Mark as processed
    await adminDb
      .collection("email_embeddings")
      .doc(userId)
      .collection("emails")
      .doc(emailId)
      .update({ processed: true });

    console.log(`[Pipeline] ✅ Email processed successfully`);
    console.log(`  - Deadlines: ${deadlines.length}`);
    console.log(`  - Documents: ${documents.length}`);
    console.log(`  - Alerts: ${alerts.length}`);
    console.log(`  - Has Reminder: ${reminder.hasReminder}`);
  } catch (error) {
    console.error("[Pipeline] Error processing email:", error);
    throw error;
  }
}

/**
 * Batch process multiple emails
 */
export async function batchProcessEmails(
  userId: string,
  emails: any[]
): Promise<{ success: number; failed: number }> {
  console.log(`\n[Batch Pipeline] Processing ${emails.length} emails`);

  // Log structure of first email for debugging
  if (emails.length > 0) {
    console.log('[Batch Pipeline] Sample email structure:', JSON.stringify(emails[0], null, 2).substring(0, 500));
  }

  let success = 0;
  let failed = 0;

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    try {
      console.log(`[Batch Pipeline] Processing ${i + 1}/${emails.length}`);
      await processEmail(userId, email);
      success++;

      // Rate limiting: Gemini free tier allows 10 requests/minute
      // Each email uses ~2 Gemini calls (categorize + extractDeadlines)
      // Sleep 7 seconds between emails to stay under quota (8 emails/min = 16 calls/min with buffer)
      if (i < emails.length - 1) {
        console.log(`[Batch Pipeline] Rate limiting: waiting 7 seconds...`);
        await sleep(7000);
      }
    } catch (error) {
      console.error(`[Batch Pipeline] Failed to process email ${i + 1}/${emails.length}:`, error);
      console.error(`[Batch Pipeline] Email data:`, email);
      failed++;

      // Still apply rate limiting on errors
      if (i < emails.length - 1) {
        await sleep(7000);
      }
    }
  }

  console.log(`[Batch Pipeline] ✅ Complete: ${success} success, ${failed} failed`);
  return { success, failed };
}

// ==================== SEMANTIC SEARCH ====================

/**
 * Search emails using semantic similarity
 */
export async function searchEmails(
  userId: string,
  query: string,
  topK: number = 10
): Promise<EmailEmbedding[]> {
  console.log(`[Search] Query: "${query}"`);

  try {
    // Generate query embedding using Nomic
    const queryEmbedding = await generateNomicQueryEmbedding(query);

    if (!queryEmbedding) {
      throw new Error("Failed to generate query embedding - Nomic API may not be configured");
    }

    // Fetch all email embeddings
    const emailsSnapshot = await adminDb
      .collection("email_embeddings")
      .doc(userId)
      .collection("emails")
      .get();

    const emails: EmailEmbedding[] = [];
    emailsSnapshot.forEach((doc) => {
      emails.push(doc.data() as EmailEmbedding);
    });

    // Calculate cosine similarity
    const results = emails.map((email) => ({
      email,
      similarity: cosineSimilarity(queryEmbedding, email.embedding),
    }));

    // Sort by similarity and return top K
    results.sort((a, b) => b.similarity - a.similarity);

    console.log(`[Search] Found ${results.length} results, returning top ${topK}`);
    return results.slice(0, topK).map((r) => r.email);
  } catch (error) {
    console.error("[Search] Error:", error);
    return [];
  }
}

// ==================== DASHBOARD DATA RETRIEVAL ====================

/**
 * Get all deadlines for dashboard (from Firestore, not API!)
 */
export async function getDeadlines(userId: string): Promise<Deadline[]> {
  const snapshot = await adminDb
    .collection("deadlines")
    .doc(userId)
    .collection("events")
    .orderBy("dueDate", "asc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as Deadline);
}

/**
 * Get all alerts for dashboard
 */
export async function getAlerts(userId: string): Promise<ScheduleChange[]> {
  const snapshot = await adminDb
    .collection("alerts")
    .doc(userId)
    .collection("items")
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((doc) => doc.data() as ScheduleChange);
}

/**
 * Get all documents for dashboard
 */
export async function getDocuments(userId: string): Promise<Document[]> {
  const snapshot = await adminDb
    .collection("documents")
    .doc(userId)
    .collection("files")
    .get();

  return snapshot.docs.map((doc) => doc.data() as Document);
}

// ==================== HELPER FUNCTIONS ====================

function determinePriority(dueDate: string): "high" | "medium" | "low" {
  const days = Math.ceil(
    (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (days < 2) return "high";
  if (days < 7) return "medium";
  return "low";
}

function getFileType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "docx";
  if (ext === "ppt" || ext === "pptx") return "ppt";
  if (ext === "xls" || ext === "xlsx") return "xlsx";
  return "other";
}

function categorizeDocument(filename: string): "assignment" | "lecture" | "notes" | "syllabus" {
  const lower = filename.toLowerCase();
  if (lower.includes("assignment") || lower.includes("hw") || lower.includes("homework")) return "assignment";
  if (lower.includes("lecture") || lower.includes("slides")) return "lecture";
  if (lower.includes("notes")) return "notes";
  if (lower.includes("syllabus")) return "syllabus";
  return "notes";
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
