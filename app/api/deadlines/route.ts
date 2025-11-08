import { NextRequest, NextResponse } from "next/server";
// import { getComposioEntity } from "@/lib/composio"; // DEPRECATED - function doesn't exist
import { collection, query, where, getDocs, addDoc, doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CLASSROOM_ACTIONS, GMAIL_ACTIONS, executeComposioAction } from "@/lib/composio-actions";

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Try to fetch from cache first
    const cacheRef = collection(db, `cache_deadlines/${userId}/items`);
    const snapshot = await getDocs(cacheRef);

    if (!snapshot.empty) {
      const deadlines = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return NextResponse.json({ deadlines });
    }

    // If cache is empty, fetch from Composio
    const entity = await getComposioEntity(userId);

    // Fetch Google Classroom assignments
    let classroomDeadlines: any[] = [];
    try {
      const coursesResult = await executeComposioAction(
        entity,
        CLASSROOM_ACTIONS.LIST_COURSES,
        {}
      );
      const courses = coursesResult.data?.courses || [];

      for (const course of courses.slice(0, 5)) {
        // Limit to first 5 courses
        try {
          const assignmentsResult = await executeComposioAction(
            entity,
            CLASSROOM_ACTIONS.LIST_COURSEWORK,
            { courseId: course.id }
          );

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

              classroomDeadlines.push({
                title: assignment.title,
                course: course.name,
                dueAt: dueDate.toISOString(),
                source: "classroom",
                url: assignment.alternateLink,
                type: "assignment",
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching coursework for ${course.name}:`, err);
        }
      }
    } catch (err) {
      console.error("Error fetching Classroom data:", err);
    }

    // Fetch Gmail for deadline keywords
    let gmailDeadlines: any[] = [];
    try {
      const gmailResult = await executeComposioAction(
        entity,
        GMAIL_ACTIONS.FETCH_EMAILS,
        {
          query: "deadline OR due date OR submit by",
          max_results: 10,
        }
      );

      const emails = gmailResult.data?.messages || [];
      // Parse emails for deadlines (simplified)
      for (const email of emails) {
        // This is a placeholder - in production, use Gemini to extract deadlines
        gmailDeadlines.push({
          title: `Email: ${email.subject || "No Subject"}`,
          course: "Email",
          dueAt: new Date(email.date || Date.now()).toISOString(),
          source: "gmail",
          url: `https://mail.google.com/mail/u/0/#inbox/${email.id}`,
          type: "other",
        });
      }
    } catch (err) {
      console.error("Error fetching Gmail data:", err);
    }

    // Combine and sort deadlines
    const allDeadlines = [...classroomDeadlines, ...gmailDeadlines].sort(
      (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
    );

    // Cache the results
    for (const deadline of allDeadlines) {
      await addDoc(cacheRef, {
        ...deadline,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ deadlines: allDeadlines });
  } catch (error: any) {
    console.error("Error fetching deadlines:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch deadlines" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const deadlineId = req.nextUrl.searchParams.get("deadlineId");

    if (!userId || !deadlineId) {
      return NextResponse.json({ error: "User ID and Deadline ID required" }, { status: 400 });
    }

    const deadlineRef = doc(db, `cache_deadlines/${userId}/items/${deadlineId}`);
    await deleteDoc(deadlineRef);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting deadline:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete deadline" },
      { status: 500 }
    );
  }
}
