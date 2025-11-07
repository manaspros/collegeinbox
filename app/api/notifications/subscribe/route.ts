import { NextRequest, NextResponse } from "next/server";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(req: NextRequest) {
  try {
    const { userId, subscription } = await req.json();

    if (!userId || !subscription) {
      return NextResponse.json(
        { error: "User ID and subscription required" },
        { status: 400 }
      );
    }

    // Store subscription in Firestore
    const subscriptionRef = doc(db, "push_subscriptions", userId);
    await setDoc(subscriptionRef, {
      subscription,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error subscribing to notifications:", error);
    return NextResponse.json(
      { error: error.message || "Failed to subscribe" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Remove subscription from Firestore
    const subscriptionRef = doc(db, "push_subscriptions", userId);
    await deleteDoc(subscriptionRef);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error unsubscribing from notifications:", error);
    return NextResponse.json(
      { error: error.message || "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
