import { NextRequest, NextResponse } from "next/server";
// import { getComposioEntity } from "@/lib/composio"; // DEPRECATED - function doesn't exist
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, startOfWeek, startOfMonth, eachDayOfInterval, startOfYear, endOfYear } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Fetch deadlines from cache
    const deadlinesRef = collection(db, `cache_deadlines/${userId}/items`);
    const deadlinesSnapshot = await getDocs(deadlinesRef);
    const deadlines = deadlinesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Fetch documents from cache
    const documentsRef = collection(db, `cache_documents/${userId}/files`);
    const documentsSnapshot = await getDocs(documentsRef);
    const documents = documentsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Try to fetch email stats from Composio
    let totalEmails = 0;
    let unreadEmails = 0;
    let emailsByWeek: { [key: string]: number } = {};

    try {
      const entity = await getComposioEntity(userId);

      // Get total and unread emails
      const profileResult = await entity.execute("gmail_get_profile", {});
      if (profileResult.data) {
        totalEmails = profileResult.data.messagesTotal || 0;
      }

      // Get recent emails for weekly stats
      const recentEmailsResult = await entity.execute("gmail_list_emails", {
        maxResults: 100,
      });

      const emails = recentEmailsResult.data?.messages || [];
      for (const email of emails) {
        const date = new Date(email.date || Date.now());
        const weekStart = format(startOfWeek(date), "MMM dd");
        emailsByWeek[weekStart] = (emailsByWeek[weekStart] || 0) + 1;
      }

      // Get unread count
      const unreadResult = await entity.execute("gmail_list_emails", {
        query: "is:unread",
        maxResults: 10,
      });
      unreadEmails = unreadResult.data?.resultSizeEstimate || 0;
    } catch (err) {
      console.error("Error fetching Gmail stats:", err);
    }

    // Process deadlines by month
    const deadlinesByMonth: { [key: string]: number } = {};
    const upcomingDeadlines = deadlines.filter((d: any) => new Date(d.dueAt) > new Date()).length;

    for (const deadline of deadlines) {
      const date = new Date((deadline as any).dueAt);
      const monthKey = format(startOfMonth(date), "MMM yyyy");
      deadlinesByMonth[monthKey] = (deadlinesByMonth[monthKey] || 0) + 1;
    }

    // Process course distribution
    const courseDistribution: { [key: string]: number } = {};
    for (const doc of documents) {
      const course = (doc as any).course || "Uncategorized";
      courseDistribution[course] = (courseDistribution[course] || 0) + 1;
    }

    // Generate heatmap data (deadlines by day)
    const heatmapData: { date: string; count: number }[] = [];
    const yearStart = startOfYear(new Date());
    const yearEnd = endOfYear(new Date());
    const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

    const deadlinesByDay: { [key: string]: number } = {};
    for (const deadline of deadlines) {
      const dateKey = format(new Date((deadline as any).dueAt), "yyyy-MM-dd");
      deadlinesByDay[dateKey] = (deadlinesByDay[dateKey] || 0) + 1;
    }

    for (const day of allDays) {
      const dateKey = format(day, "yyyy-MM-dd");
      heatmapData.push({
        date: dateKey,
        count: deadlinesByDay[dateKey] || 0,
      });
    }

    // Format data for charts
    const analytics = {
      stats: {
        totalEmails,
        unreadEmails,
        upcomingDeadlines,
        completedAssignments: Math.max(0, deadlines.length - upcomingDeadlines),
      },
      emailsPerWeek: Object.entries(emailsByWeek)
        .map(([week, count]) => ({ week, count }))
        .slice(0, 8),
      deadlinesPerMonth: Object.entries(deadlinesByMonth)
        .map(([month, count]) => ({ month, count }))
        .slice(0, 6),
      courseDistribution: Object.entries(courseDistribution)
        .map(([name, value]) => ({ name, value }))
        .slice(0, 6),
    };

    return NextResponse.json({ analytics, heatmap: heatmapData });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
