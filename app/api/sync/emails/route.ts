import { NextRequest, NextResponse } from "next/server";
import { executeAction } from "@/lib/composio";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { categorizeEmail, extractDeadlines, detectAlerts } from "@/lib/gemini";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    console.log(`Starting email sync for user: ${userId}`);

    // Check last sync time to do incremental sync
    const db = getAdminDb();
    const statusDoc = await db.collection("sync_status").doc(userId).get();

    let query = "";
    let isInitialSync = false;

    if (statusDoc.exists) {
      // Incremental sync: only fetch emails since last sync
      const data = statusDoc.data();
      const lastSync = data?.lastSync;
      if (lastSync && lastSync.toDate) {
        const lastSyncTime = lastSync.toDate();
        const lastSyncUnix = Math.floor(lastSyncTime.getTime() / 1000);
        query = `after:${lastSyncUnix}`;
        console.log(`Incremental sync: fetching emails after ${lastSyncTime.toISOString()}`);
      } else {
        isInitialSync = true;
      }
    } else {
      isInitialSync = true;
    }

    if (isInitialSync) {
      // Initial sync: fetch last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      query = `after:${Math.floor(thirtyDaysAgo.getTime() / 1000)}`;
      console.log(`Initial sync: fetching emails from last 30 days`);
    }

    // Use GMAIL_FETCH_EMAILS with correct parameters
    const searchResult = await executeAction(userId, "GMAIL_FETCH_EMAILS", {
      query: query,
      max_results: 100,
      user_id: "me",
      include_payload: true,
      verbose: true,
    });

    console.log("Search result:", {
      successfull: searchResult.successfull,
      hasData: !!searchResult.data,
      dataKeys: searchResult.data ? Object.keys(searchResult.data) : [],
    });

    if (!searchResult.successfull || !searchResult.data?.emails) {
      console.log("No new emails found since last sync");
      return NextResponse.json({
        success: true,
        synced: 0,
        message: isInitialSync ? "No emails found in the last 30 days" : "No new emails since last sync",
        debug: searchResult.data || "No data returned"
      });
    }

    const messages = searchResult.data.emails;

    if (messages.length === 0) {
      console.log("Email sync: Already up to date, no new emails");
      return NextResponse.json({
        success: true,
        synced: 0,
        message: "Already up to date! No new emails since last sync.",
      });
    }

    let batch = db.batch();
    let synced = 0;
    let deadlinesFound = 0;
    let alertsFound = 0;
    let documentsFound = 0;
    let batchCount = 0;

    // Process emails in batches
    for (const message of messages) {
      try {
        // With verbose=true, the emails should already have full details
        // No need to fetch message details again
        const msgData = message;
        const headers = msgData.payload?.headers || [];

        const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
        const from = headers.find((h: any) => h.name === "From")?.value || "";
        const date = headers.find((h: any) => h.name === "Date")?.value || "";
        const snippet = msgData.snippet || "";

        // Get email body
        let body = "";
        if (msgData.payload?.body?.data) {
          body = Buffer.from(msgData.payload.body.data, "base64").toString("utf-8");
        } else if (msgData.payload?.parts) {
          const textPart = msgData.payload.parts.find((p: any) =>
            p.mimeType === "text/plain" || p.mimeType === "text/html"
          );
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data, "base64").toString("utf-8");
          }
        }

        const emailText = `${subject}\n\n${body || snippet}`;

        // AI Categorization
        const course = await categorizeEmail(subject, from, emailText);

        // Extract deadlines
        const deadlines = await extractDeadlines(emailText, subject);
        if (deadlines.length > 0) {
          for (const deadline of deadlines) {
            const deadlineRef = db.collection("cache_deadlines").doc(userId).collection("items").doc();
            batch.set(deadlineRef, {
              ...deadline,
              course: course || "Uncategorized",
              source: "gmail",
              emailId: message.id,
              from: from,
              createdAt: FieldValue.serverTimestamp(),
            });
            deadlinesFound++;
            batchCount++;
          }
        }

        // Detect alerts
        const alert = await detectAlerts(subject, emailText);
        if (alert) {
          const alertRef = db.collection("cache_alerts").doc(userId).collection("items").doc();
          batch.set(alertRef, {
            ...alert,
            course: course || "Uncategorized",
            emailId: message.id,
            from: from,
            date: date,
            createdAt: FieldValue.serverTimestamp(),
          });
          alertsFound++;
          batchCount++;
        }

        // Extract attachments
        const parts = msgData.payload?.parts || [];
        for (const part of parts) {
          const filename = part.filename || "";
          const isDocument =
            filename.endsWith(".pdf") ||
            filename.endsWith(".docx") ||
            filename.endsWith(".pptx") ||
            filename.endsWith(".ppt") ||
            filename.endsWith(".doc");

          if (isDocument && part.body?.attachmentId) {
            const docRef = db.collection("cache_documents").doc(userId).collection("files").doc();
            batch.set(docRef, {
              name: filename,
              course: course || "Uncategorized",
              mime: part.mimeType,
              emailId: message.id,
              attachmentId: part.body.attachmentId,
              subject: subject,
              from: from,
              size: part.body.size || 0,
              createdAt: FieldValue.serverTimestamp(),
            });
            documentsFound++;
            batchCount++;
          }
        }

        synced++;

        // Firebase Admin SDK allows max 500 operations per batch
        // Commit and create new batch every 400 operations to be safe
        if (batchCount >= 400) {
          await batch.commit();
          console.log(`Committed batch at ${synced} emails (${batchCount} operations)`);
          batch = db.batch();
          batchCount = 0;
        }

      } catch (msgError) {
        console.error(`Error processing message ${message.id}:`, msgError);
      }
    }

    // Commit remaining items
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch (${batchCount} operations)`);
    }

    // Update sync status
    await db.collection("sync_status").doc(userId).set({
      lastSync: FieldValue.serverTimestamp(),
      emailsSynced: synced,
      deadlinesFound: deadlinesFound,
      alertsFound: alertsFound,
      documentsFound: documentsFound,
    });

    console.log(`Sync complete: ${synced} emails, ${deadlinesFound} deadlines, ${alertsFound} alerts, ${documentsFound} documents`);

    return NextResponse.json({
      success: true,
      synced: synced,
      deadlines: deadlinesFound,
      alerts: alertsFound,
      documents: documentsFound,
    });

  } catch (error: any) {
    console.error("Email sync error:", error);
    return NextResponse.json(
      { error: error.message || "Sync failed" },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("user-id");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const db = getAdminDb();
    const statusDoc = await db.collection("sync_status").doc(userId).get();

    if (!statusDoc.exists) {
      return NextResponse.json({ synced: false });
    }

    return NextResponse.json({
      synced: true,
      ...statusDoc.data()
    });

  } catch (error: any) {
    console.error("Error checking sync status:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
