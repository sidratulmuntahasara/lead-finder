// lib/types.ts
// Shared shape for a "Lead" (a business with no website) used by both
// the backend API routes and the frontend flashcard UI.

export type LeadStatus = "new" | "contacted" | "replied";

export interface Lead {
  id: string; // Google Place ID, also used as the Firestore document ID
  name: string;
  niche: string; // the search term used to find this business, e.g. "real estate agency"
  location: string; // the location search term, e.g. "Sharjah"
  address: string;
  phone: string | null;
  mapsUrl: string;
  status: LeadStatus;
  createdAt: number; // stored as a timestamp (milliseconds) for simple sorting
}
