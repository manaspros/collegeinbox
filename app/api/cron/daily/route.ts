import { NextRequest, NextResponse } from "next/server";
// import { getComposioEntity } from "@/lib/composio"; // DEPRECATED - function doesn't exist
import { collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getGeminiModel } from "@/lib/gemini";
import { format } from "date-fns";

/**
 * Daily 8 AM Routine
 * This endpoint should be called by a cron job (Vercel Cron or node-cron)
 * It refreshes caches, generates digests, and sends notifications
 */
export async function POST(req: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = req.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all users (in production, you'd fetch from a users collection)
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    console.log(`Running daily routine for user ${userId}`);

    const entity = await getComposioEntity(userId);

    // 1. Clear old caches
    await clearCaches(userId);

    // 2. Fetch fresh data
    const { deadlines, documents, alerts } = await fetchFreshData(entity, userId);

    // 3. Generate daily digest
    const digest = await generateDigest(userId, deadlines, alerts);

    // 4. Send notifications
    await sendNotifications(entity, userId, digest);

    return NextResponse.json({
      success: true,
      summary: {
        deadlines: deadlines.length,
        documents: documents.length,
        alerts: alerts.length,
        digest,
      },
    });
  } catch (error: any) {
    console.error("Error in daily routine:", error);
    return NextResponse.json(
      { error: error.message || "Failed to run daily routine" },
      { status: 500 }
    );
  }
}

async function clearCaches(userId: string) {
  const collections = ["cache_deadlines", "cache_documents", "cache_alerts"];

  for (const collectionName of collections) {
    try {
      const cacheRef = collection(db, `${collectionName}/${userId}/items`);
      const snapshot = await getDocs(cacheRef);

      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, `${collectionName}/${userId}/items/${docSnap.id}`));
      }
    } catch (error) {
      console.error(`Error clearing ${collectionName}:`, error);
    }
  }
}

async function fetchFreshData(entity: any, userId: string) {
  const deadlines: any[] = [];
  const documents: any[] = [];
  const alerts: any[] = [];

  // Fetch Classroom assignments
  try {
    const coursesResult = await entity.execute("GOOGLECLASSROOM_LIST_COURSES", {});
    const courses = coursesResult.data?.courses || [];

    for (const course of courses.slice(0, 5)) {
      const assignmentsResult = await entity.execute("GOOGLECLASSROOM_LIST_COURSEWORK", {
        courseId: course.id,
      });

      const assignments = assignmentsResult.data?.courseWork || [];
      for (const assignment of assignments) {
        if (assignment.dueDate) {
          const dueDate = new Date(
            assignment.dueDate.year,
            assignment.dueDate.month - 1,
            assignment.dueDate.day,
            assignment.dueTime?.hours || 23,
            assignment.dueTime?.minutes || 59
          );

          const deadline = {
            title: assignment.title,
            course: course.name,
            dueAt: dueDate.toISOString(),
            source: "classroom",
            url: assignment.alternateLink,
            type: "assignment",
            createdAt: new Date().toISOString(),
          };

          deadlines.push(deadline);

          // Cache in Firestore
          await addDoc(collection(db, `cache_deadlines/${userId}/items`), deadline);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching classroom data:", error);
  }

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
          const document = {
            name: attachment.filename,
            course: "Email",
            mime: attachment.mimeType,
            emailId: email.id,
            url: `https://mail.google.com/mail/u/0/#inbox/${email.id}`,
            createdAt: new Date().toISOString(),
          };

          documents.push(document);

          // Cache in Firestore
          await addDoc(collection(db, `cache_documents/${userId}/files`), document);
        }
      }
    }
  } catch (error) {
    console.error("Error fetching Gmail attachments:", error);
  }

  // Fetch alerts (schedule changes)
  try {
    const alertKeywords = "cancelled OR rescheduled OR urgent OR room change";
    const gmailResult = await entity.execute("gmail_list_emails", {
      query: alertKeywords,
      maxResults: 10,
    });

    const emails = gmailResult.data?.messages || [];
    const model = getGeminiModel();

    for (const email of emails) {
      try {
        const prompt = `Analyze if this is a schedule alert: "${email.subject || "No subject"}". Return JSON: {"isAlert": boolean, "kind": "Cancelled" | "Rescheduled" | "Urgent" | "RoomChange" | null}`;
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const jsonMatch = response.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          if (analysis.isAlert && analysis.kind) {
            const alert = {
              kind: analysis.kind,
              subject: email.subject || "No Subject",
              date: new Date().toISOString(),
              link: `https://mail.google.com/mail/u/0/#inbox/${email.id}`,
            };

            alerts.push(alert);

            // Cache in Firestore
            await addDoc(collection(db, `cache_alerts/${userId}/items`), alert);
          }
        }
      } catch (error) {
        console.error("Error analyzing email for alert:", error);
      }
    }
  } catch (error) {
    console.error("Error fetching alerts:", error);
  }

  return { deadlines, documents, alerts };
}

async function generateDigest(userId: string, deadlines: any[], alerts: any[]) {
  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  // Filter deadlines for today and next 7 days
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingDeadlines = deadlines.filter((d) => {
    const dueDate = new Date(d.dueAt);
    return dueDate >= now && dueDate <= nextWeek;
  });

  let digest = `📅 Daily Digest for ${today}\n\n`;

  if (upcomingDeadlines.length > 0) {
    digest += `📝 Upcoming Deadlines (Next 7 Days):\n`;
    upcomingDeadlines.forEach((d) => {
      const dueDate = format(new Date(d.dueAt), "MMM d, h:mm a");
      digest += `  • ${d.title} - ${d.course} (Due: ${dueDate})\n`;
    });
    digest += "\n";
  } else {
    digest += "✅ No upcoming deadlines in the next 7 days!\n\n";
  }

  if (alerts.length > 0) {
    digest += `⚠️ Schedule Alerts:\n`;
    alerts.forEach((a) => {
      digest += `  • [${a.kind}] ${a.subject}\n`;
    });
    digest += "\n";
  }

  digest += `\n💡 Tip: Use the AI assistant to ask about specific assignments or search for documents!`;

  return digest;
}

async function sendNotifications(entity: any, userId: string, digest: string) {
  try {
    // Send via Gmail (send email to self)
    await entity.execute("gmail_send_email", {
      to: "me",
      subject: `Daily Academic Digest - ${format(new Date(), "MMM d, yyyy")}`,
      body: digest,
    });

    console.log("Digest email sent successfully");

    // Optionally send via WhatsApp or Slack (if connected)
    // Uncomment if you want to use these integrations:
    /*
    try {
      await entity.execute("whatsapp_send_message", {
        to: "your_phone_number",
        body: digest,
      });
    } catch (err) {
      console.log("WhatsApp not connected or failed:", err);
    }

    try {
      await entity.execute("slack_send_message", {
        channel: "personal-reminders",
        text: digest,
      });
    } catch (err) {
      console.log("Slack not connected or failed:", err);
    }
    */
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
}
