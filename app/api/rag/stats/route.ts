import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

/**
 * Get RAG statistics (number of indexed emails)
 */
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Count vectorized emails in Firestore
    const emailsSnapshot = await adminDb
      .collection("email_embeddings")
      .doc(userId)
      .collection("emails")
      .get();

    const emailCount = emailsSnapshot.size;

    console.log(`[RAG Stats] User ${userId} has ${emailCount} vectorized emails`);

    return NextResponse.json({
      success: true,
      emailCount,
    });
  } catch (error: any) {
    console.error("Error fetching RAG stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch RAG stats" },
      { status: 500 }
    );
  }
}
