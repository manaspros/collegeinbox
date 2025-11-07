import { NextRequest, NextResponse } from "next/server";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const alertRef = doc(db, `cache_alerts/${userId}/items/${params.id}`);
    await deleteDoc(alertRef);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting alert:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete alert" },
      { status: 500 }
    );
  }
}
