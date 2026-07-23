// app/api/update-status/route.ts
//
// Updates a single lead's status when you click a status button on its
// flashcard in the UI (New -> Contacted -> Replied).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import type { LeadStatus } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { id, status } = (await request.json()) as {
      id: string;
      status: LeadStatus;
    };

    if (!id || !status) {
      return NextResponse.json(
        { error: "Both 'id' and 'status' are required." },
        { status: 400 }
      );
    }

    const leadRef = doc(db, "leads", id);
    await updateDoc(leadRef, { status });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("update-status error:", error);
    return NextResponse.json(
      { error: "Could not update this lead's status." },
      { status: 500 }
    );
  }
}
