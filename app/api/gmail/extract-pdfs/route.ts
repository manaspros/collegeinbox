import { NextRequest, NextResponse } from "next/server";
import { executeAction } from "@/lib/composio";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

export async function POST(req: NextRequest) {
  try {
    const { userId, query: searchQuery, maxResults = 10 } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    console.log(`Extracting PDFs for user ${userId} with query: ${searchQuery}`);

    // Search Gmail for messages with PDF attachments
    const gmailQuery = searchQuery
      ? `${searchQuery} has:attachment filename:pdf`
      : "has:attachment filename:pdf";

    const searchResult = await executeAction(userId, "GMAIL_SEARCH_GMAIL", {
      query: gmailQuery,
      maxResults: maxResults,
    });

    if (!searchResult.successfull || !searchResult.data?.messages) {
      console.log("No messages found or search failed");
      return NextResponse.json({ pdfs: [], count: 0 });
    }

    const messages = searchResult.data.messages;
    console.log(`Found ${messages.length} messages with PDFs`);

    const extractedPDFs: any[] = [];

    // Process each message to extract PDF attachments
    for (const message of messages.slice(0, maxResults)) {
      try {
        // Get message details
        const messageDetails = await executeAction(userId, "GMAIL_GET_MESSAGE", {
          messageId: message.id,
        });

        if (!messageDetails.successfull || !messageDetails.data?.payload) {
          continue;
        }

        const payload = messageDetails.data.payload;
        const parts = payload.parts || [payload];

        // Extract metadata
        const headers = payload.headers || [];
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "No Subject";
        const from = headers.find((h: any) => h.name === "From")?.value || "Unknown";
        const date = headers.find((h: any) => h.name === "Date")?.value || new Date().toISOString();

        // Find PDF attachments
        for (const part of parts) {
          if (
            part.mimeType === "application/pdf" ||
            part.filename?.toLowerCase().endsWith(".pdf")
          ) {
            const attachmentId = part.body?.attachmentId;

            if (attachmentId) {
              // Get attachment content
              const attachmentResult = await executeAction(userId, "GMAIL_GET_ATTACHMENT", {
                messageId: message.id,
                attachmentId: attachmentId,
              });

              if (attachmentResult.successfull && attachmentResult.data?.data) {
                const pdfData = {
                  messageId: message.id,
                  filename: part.filename || "untitled.pdf",
                  subject: subject,
                  from: from,
                  date: date,
                  size: part.body?.size || 0,
                  attachmentId: attachmentId,
                  // Store base64 data (consider moving to cloud storage for production)
                  data: attachmentResult.data.data,
                  extractedAt: new Date().toISOString(),
                };

                extractedPDFs.push(pdfData);

                // Save to Firestore for caching
                try {
                  await addDoc(collection(db, "pdf_cache", userId, "files"), {
                    ...pdfData,
                    data: null, // Don't store large binary data in Firestore
                    userId: userId,
                  });
                } catch (firestoreError) {
                  console.error("Error saving to Firestore:", firestoreError);
                }
              }
            }
          }
        }
      } catch (msgError) {
        console.error(`Error processing message ${message.id}:`, msgError);
      }
    }

    console.log(`Extracted ${extractedPDFs.length} PDFs`);

    return NextResponse.json({
      pdfs: extractedPDFs.map((pdf) => ({
        ...pdf,
        data: undefined, // Don't send full data back, just metadata
        preview: `${pdf.data?.substring(0, 100)}...`,
      })),
      count: extractedPDFs.length,
    });
  } catch (error: any) {
    console.error("Error extracting PDFs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to extract PDFs" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve cached PDFs
export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get("user-id");

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const pdfsQuery = query(
      collection(db, "pdf_cache", userId, "files")
    );

    const snapshot = await getDocs(pdfsQuery);
    const pdfs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ pdfs, count: pdfs.length });
  } catch (error: any) {
    console.error("Error fetching cached PDFs:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch PDFs" },
      { status: 500 }
    );
  }
}
