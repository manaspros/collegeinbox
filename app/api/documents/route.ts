import { NextRequest, NextResponse } from "next/server";
// import { getComposioEntity } from "@/lib/composio"; // DEPRECATED - function doesn't exist
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { categorizeEmail } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Try to fetch from cache first
    const cacheRef = collection(db, `cache_documents/${userId}/files`);
    const snapshot = await getDocs(cacheRef);

    if (!snapshot.empty) {
      const documents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return NextResponse.json({ documents });
    }

    // If cache is empty, fetch from Composio
    const entity = await getComposioEntity(userId);
    const documents: any[] = [];

    // Fetch Gmail attachments
    try {
      const gmailResult = await entity.execute("gmail_list_emails", {
        query: "has:attachment",
        maxResults: 20,
      });

      const emails = gmailResult.data?.messages || [];
      for (const email of emails) {
        if (email.attachments && email.attachments.length > 0) {
          for (const attachment of email.attachments) {
            // Use heuristic to determine course (check for course codes in subject)
            let course = "Uncategorized";
            const subject = email.subject || "";

            // Try to extract course code (e.g., CS-101, MATH 203, etc.)
            const courseMatch = subject.match(/[A-Z]{2,4}[-\s]?\d{3,4}/i);
            if (courseMatch) {
              course = courseMatch[0];
            } else {
              // Use Gemini as fallback
              try {
                const analysis = await categorizeEmail(
                  email.snippet || "",
                  subject
                );
                course = analysis.courseName || "Uncategorized";
              } catch (err) {
                console.error("Error categorizing email:", err);
              }
            }

            documents.push({
              name: attachment.filename,
              course,
              mime: attachment.mimeType,
              emailId: email.id,
              url: attachment.url || `https://mail.google.com/mail/u/0/#inbox/${email.id}`,
              createdAt: new Date(email.date || Date.now()).toISOString(),
            });
          }
        }
      }
    } catch (err) {
      console.error("Error fetching Gmail attachments:", err);
    }

    // Fetch Google Drive files (from specific folders if available)
    try {
      const driveResult = await entity.execute("googledrive_list_files", {
        query: "mimeType='application/pdf' or mimeType contains 'document' or mimeType contains 'presentation'",
        pageSize: 50,
      });

      const files = driveResult.data?.files || [];
      for (const file of files) {
        // Try to determine course from folder name or file name
        let course = "Drive";
        const fileName = file.name || "";

        // Try to extract course code
        const courseMatch = fileName.match(/[A-Z]{2,4}[-\s]?\d{3,4}/i);
        if (courseMatch) {
          course = courseMatch[0];
        }

        documents.push({
          name: file.name,
          course,
          mime: file.mimeType,
          driveFileId: file.id,
          url: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
          createdAt: new Date(file.createdTime || Date.now()).toISOString(),
        });
      }
    } catch (err) {
      console.error("Error fetching Drive files:", err);
    }

    // Cache the results
    for (const document of documents) {
      await addDoc(cacheRef, document);
    }

    return NextResponse.json({ documents });
  } catch (error: any) {
    console.error("Error fetching documents:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
