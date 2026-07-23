# Lead Finder

Finds businesses (via Google Places) that don't have a website listed, and
tracks them as flashcards you can filter by niche/location and mark as
New / Contacted / Replied.

## 1. Get a Google Places API key

1. Go to https://console.cloud.google.com and create a new project.
2. In the left menu: **APIs & Services > Library**, search for **"Places API (New)"**, and click **Enable**.
3. Go to **APIs & Services > Credentials > Create Credentials > API Key**.
4. Click into the new key and restrict it to only the "Places API (New)" under **API restrictions**, so it can't be misused for anything else.
5. Copy the key.

Google gives a free monthly usage credit that comfortably covers normal use at small scale — check current pricing/limits at https://developers.google.com/maps/billing-and-pricing/pricing since this can change.

## 2. Set up Firebase (free)

1. Go to https://console.firebase.google.com and create a new project.
2. Go to **Build > Firestore Database > Create database**, and start in **test mode** (fine for getting started — tighten security rules before handling anything sensitive long-term).
3. Go to **Project settings (gear icon) > General > Your apps**, click the web icon (`</>`) to register a new web app, and copy the config values shown.

## 3. Configure environment variables

Copy `.env.local.example` to a new file called `.env.local`, and fill in:
- `GOOGLE_PLACES_API_KEY` from step 1
- The six `NEXT_PUBLIC_FIREBASE_...` values from step 2

## 4. Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000 — enter a niche (e.g. "real estate agency") and a location (e.g. "Sharjah"), hit Search, and matching no-website businesses will appear as flashcards below.

## 5. Deploy for free on Vercel

1. Push this project to a GitHub repo (keep it private — it's tied to your business).
2. Go to https://vercel.com, click **Add New Project**, and import the repo.
3. In the Vercel project's **Settings > Environment Variables**, add the same variables from your `.env.local` file.
4. Deploy. You'll get a live URL you can use from anywhere.

## How it works (short version)

- `app/api/search-leads/route.ts` — calls Google's Places API (New) "Text Search" with a fieldMask that includes `websiteUri` directly, filters out any business that has a website, and saves the rest to Firestore.
- `app/api/leads/route.ts` — returns everything saved in Firestore so the page can display it.
- `app/api/update-status/route.ts` — updates a lead's status when you click its flashcard button.
- `app/page.tsx` — the search form, filters, and flashcard grid.

## Notes

- Duplicate searches won't create duplicate entries — each business is stored using its Google Place ID, so re-searching the same area just reuses existing records (and keeps whatever status you already set).
- This uses the Places API's fieldMask capability to get the website field in a single search call — no separate per-business lookup needed.
