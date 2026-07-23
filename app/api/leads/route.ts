// app/api/leads/route.ts
//
// Returns every lead currently stored in Firestore. The frontend calls
// this on page load (and after a new search) to display the flashcards.

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import type { Lead } from "@/lib/types";

export async function GET() {
  try {
    const leadsQuery = query(
      collection(db, "leads"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(leadsQuery);

    const leads: Lead[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name,
        niche: data.niche,
        location: data.location,
        address: data.address,
        phone: data.phone,
        mapsUrl: data.mapsUrl,
        status: data.status,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : 0,
      };
    });

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("get-leads error:", error);
    return NextResponse.json(
      { error: "Could not load leads from the database." },
      { status: 500 }
    );
  }
}
