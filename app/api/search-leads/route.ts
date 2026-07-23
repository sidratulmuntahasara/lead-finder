// app/api/search-leads/route.ts
//
// This is the core backend route. It receives a niche + location from the
// frontend search form, calls Google's Places API (New) "Text Search"
// endpoint, and filters the results down to only businesses that do NOT
// have a website listed.
//
// IMPORTANT: We're using the NEW Places API (places.googleapis.com/v1),
// not the older legacy API. The new API lets us request the "websiteUri"
// field directly in the same search call using a fieldMask header - we do
// NOT need a separate "Place Details" call per business, which keeps this
// simple and keeps API usage (and cost) low.

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import type { Lead } from "@/lib/types";

// The specific fields we ask Google for. Each field you request affects
// your API cost tier, so we only ask for what we actually use.
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.googleMapsUri",
  "places.websiteUri",
].join(",");

export async function POST(request: NextRequest) {
  try {
    const { niche, location } = await request.json();

    if (!niche || !location) {
      return NextResponse.json(
        { error: "Both 'niche' and 'location' are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GOOGLE_PLACES_API_KEY is missing from your .env.local file.",
        },
        { status: 500 }
      );
    }

    // Call Google's Places API (New) - Text Search endpoint
    const searchQuery = `${niche} in ${location}`;

    const placesResponse = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify({ textQuery: searchQuery }),
      }
    );

    if (!placesResponse.ok) {
      const errorBody = await placesResponse.text();
      return NextResponse.json(
        { error: `Google Places API error: ${errorBody}` },
        { status: placesResponse.status }
      );
    }

    const placesData = await placesResponse.json();
    const allPlaces = placesData.places || [];

    // Filter to only businesses with NO website field returned at all
    const noWebsitePlaces = allPlaces.filter(
      (place: { websiteUri?: string }) => !place.websiteUri
    );

    // Save each matching lead to Firestore, skipping ones we've already
    // saved before so re-running the same search doesn't create duplicates
    // or overwrite a status you've already updated.
    const savedLeads: Lead[] = [];

    for (const place of noWebsitePlaces) {
      const leadRef = doc(collection(db, "leads"), place.id);
      const existing = await getDoc(leadRef);

      if (!existing.exists()) {
        const newLead: Omit<Lead, "createdAt"> & { createdAt: unknown } = {
          id: place.id,
          name: place.displayName?.text || "Unknown business",
          niche,
          location,
          address: place.formattedAddress || "",
          phone: place.nationalPhoneNumber || null,
          mapsUrl: place.googleMapsUri || "",
          status: "new",
          createdAt: serverTimestamp(),
        };
        await setDoc(leadRef, newLead);
        savedLeads.push({ ...newLead, createdAt: Date.now() } as Lead);
      } else {
        savedLeads.push(existing.data() as Lead);
      }
    }

    return NextResponse.json({
      totalFound: allPlaces.length,
      noWebsiteCount: noWebsitePlaces.length,
      leads: savedLeads,
    });
  } catch (error) {
    console.error("search-leads error:", error);
    return NextResponse.json(
      { error: "Something went wrong while searching for leads." },
      { status: 500 }
    );
  }
}
