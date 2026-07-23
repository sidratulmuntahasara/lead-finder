"use client";

// app/page.tsx
//
// The main (and only) page of the app. Contains:
// 1. A search form (niche + location)
// 2. A grid of flashcards showing businesses with no website
// 3. Filter controls to narrow the flashcards by niche/location
// 4. A status button on each card (New -> Contacted -> Replied)

import { useEffect, useMemo, useState } from "react";
import type { Lead, LeadStatus } from "@/lib/types";

const STATUS_ORDER: LeadStatus[] = ["new", "contacted", "replied"];

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  replied: "Replied",
};

const STATUS_STYLE: Record<LeadStatus, string> = {
  new: "bg-neutral-100 text-neutral-700 border-neutral-300",
  contacted: "bg-amber-50 text-amber-700 border-amber-300",
  replied: "bg-emerald-50 text-emerald-700 border-emerald-300",
};

export default function Home() {
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchSummary, setSearchSummary] = useState<string | null>(null);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(true);

  const [nicheFilter, setNicheFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | LeadStatus>("all");

  async function loadLeads() {
    setIsLoadingLeads(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      setLeads(data.leads || []);
    } catch {
      setSearchError("Could not load saved leads.");
    } finally {
      setIsLoadingLeads(false);
    }
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!niche.trim() || !location.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchSummary(null);

    try {
      const res = await fetch("/api/search-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: niche.trim(), location: location.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error || "Search failed.");
        return;
      }

      setSearchSummary(
        `Found ${data.totalFound} businesses, ${data.noWebsiteCount} with no website.`
      );
      await loadLeads();
    } catch {
      setSearchError("Something went wrong while searching. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  async function cycleStatus(lead: Lead) {
    const currentIndex = STATUS_ORDER.indexOf(lead.status);
    const nextStatus = STATUS_ORDER[(currentIndex + 1) % STATUS_ORDER.length];

    // Update UI immediately, then save in the background
    setLeads((prev) =>
      prev.map((l) => (l.id === lead.id ? { ...l, status: nextStatus } : l))
    );

    await fetch("/api/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: lead.id, status: nextStatus }),
    });
  }

  const niches = useMemo(
    () => Array.from(new Set(leads.map((l) => l.niche))).sort(),
    [leads]
  );
  const locations = useMemo(
    () => Array.from(new Set(leads.map((l) => l.location))).sort(),
    [leads]
  );

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (nicheFilter !== "all" && lead.niche !== nicheFilter) return false;
      if (locationFilter !== "all" && lead.location !== locationFilter)
        return false;
      if (statusFilter !== "all" && lead.status !== statusFilter) return false;
      return true;
    });
  }, [leads, nicheFilter, locationFilter, statusFilter]);

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#14171A]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="mb-10">
          <p className="font-mono text-xs uppercase tracking-widest text-[#0F6E5C]">
            Lead Finder
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Businesses without a website
          </h1>
          <p className="mt-2 max-w-xl text-sm text-neutral-600">
            Search a niche and location. Results are filtered down to only
            businesses with no website listed on Google, and saved here for
            you to track.
          </p>
        </header>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="mb-10 flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Niche
            </label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. real estate agency"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[#0F6E5C] focus:ring-1 focus:ring-[#0F6E5C]"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-neutral-600">
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Sharjah"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-[#0F6E5C] focus:ring-1 focus:ring-[#0F6E5C]"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="rounded-lg bg-[#0F6E5C] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#0C5949] disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>

        {searchError && (
          <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {searchError}
          </p>
        )}
        {searchSummary && (
          <p className="mb-6 rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-600">
            {searchSummary}
          </p>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <select
            value={nicheFilter}
            onChange={(e) => setNicheFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="all">All niches</option>
            {niches.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="all">All locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as "all" | LeadStatus)
            }
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="all">All statuses</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>

        {/* Flashcards */}
        {isLoadingLeads ? (
          <p className="text-sm text-neutral-500">Loading leads...</p>
        ) : filteredLeads.length === 0 ? (
          <p className="text-sm text-neutral-500">
            No leads yet. Run a search above to get started.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                className="flex flex-col justify-between rounded-xl border border-neutral-200 bg-white p-5 shadow-sm"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                    {lead.niche} · {lead.location}
                  </p>
                  <h2 className="mt-1 text-lg font-semibold leading-snug">
                    {lead.name}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    {lead.address}
                  </p>
                  {lead.phone && (
                    <p className="mt-1 text-sm text-neutral-600">
                      {lead.phone}
                    </p>
                  )}
                  <a
                    href={lead.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-sm text-[#0F6E5C] underline underline-offset-2"
                  >
                    View on Google Maps
                  </a>
                </div>

                <button
                  onClick={() => cycleStatus(lead)}
                  className={`mt-4 w-full rounded-lg border px-3 py-2 text-sm font-medium transition ${STATUS_STYLE[lead.status]}`}
                >
                  {STATUS_LABEL[lead.status]} — click to advance
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
