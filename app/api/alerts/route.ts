import { NextRequest, NextResponse } from "next/server";
// import { getComposioEntity } from "@/lib/composio"; // DEPRECATED - function doesn't exist
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getGeminiModel } from "@/lib/gemini";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Try to fetch from cache first
    const cacheRef = collection(db, `cache_alerts/${userId}/items`);
    const snapshot = await getDocs(cacheRef);

    if (!snapshot.empty) {
      const alerts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return NextResponse.json({ alerts });
    }

    // If cache is empty, fetch from Composio and analyze
    const entity = await getComposioEntity(userId);
    const alerts: any[] = [];

    // Keywords to watch for
    const keywords = [
      "cancelled",
      "canceled",
      "postponed",
      "rescheduled",
      "room change",
      "location change",
      "urgent",
      "important announcement",
    ];

    // Fetch recent Gmail messages with alert keywords
    try {
      const query = keywords.join(" OR ");
      const gmailResult = await entity.execute("gmail_list_emails", {
        query,
        maxResults: 15,
      });

      const emails = gmailResult.data?.messages || [];

      // Use Gemini to analyze each email for alert type
      const model = getGeminiModel();
      for (const email of emails) {
        try {
          const prompt = `Analyze this email and determine if it contains a schedule alert. Return ONLY a JSON object:
{
  "isAlert": boolean,
  "kind": "Cancelled" | "Rescheduled" | "Urgent" | "RoomChange" | null,
  "course": string or null
}

Subject: ${email.subject || "No Subject"}
Snippet: ${email.snippet || ""}`;

          const result = await model.generateContent(prompt);
          const response = result.response.text();
          const jsonMatch = response.match(/\{[\s\S]*\}/);

          if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);

            if (analysis.isAlert && analysis.kind) {
              alerts.push({
                kind: analysis.kind,
                subject: email.subject || "No Subject",
                date: new Date(email.date || Date.now()).toISOString(),
                link: `https://mail.google.com/mail/u/0/#inbox/${email.id}`,
                course: analysis.course,
              });
            }
          }
        } catch (err) {
          console.error("Error analyzing email:", err);
        }
      }
    } catch (err) {
      console.error("Error fetching Gmail for alerts:", err);
    }

    // Fetch Google Calendar for cancelled/rescheduled events
    try {
      const calendarResult = await entity.execute("googlecalendar_list_events", {
        maxResults: 20,
        timeMin: new Date().toISOString(),
      });

      const events = calendarResult.data?.items || [];
      for (const event of events) {
        // Check if event status is cancelled
        if (event.status === "cancelled") {
          alerts.push({
            kind: "Cancelled",
            subject: `Event Cancelled: ${event.summary || "Untitled Event"}`,
            date: new Date(event.updated || Date.now()).toISOString(),
            link: event.htmlLink,
            course: null,
          });
        }

        // Check if event was recently updated (might be rescheduled)
        const updated = new Date(event.updated || 0);
        const created = new Date(event.created || 0);
        const hoursSinceUpdate = (Date.now() - updated.getTime()) / (1000 * 60 * 60);

        if (hoursSinceUpdate < 24 && updated > created) {
          alerts.push({
            kind: "Rescheduled",
            subject: `Event Updated: ${event.summary || "Untitled Event"}`,
            date: updated.toISOString(),
            link: event.htmlLink,
            course: null,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching Calendar for alerts:", err);
    }

    // Sort by date (most recent first)
    alerts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Cache the results
    for (const alert of alerts) {
      await addDoc(cacheRef, alert);
    }

    return NextResponse.json({ alerts });
  } catch (error: any) {
    console.error("Error fetching alerts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch alerts" },
      { status: 500 }
    );
  }
}
