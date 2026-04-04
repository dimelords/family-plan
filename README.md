# Familjeveckan 📅

A mobile-first family planning dashboard for Fredrik, Camilla, Emilia och Celvin.
Single-file web app — open `index.html` in a browser and you're done.

## Features

- **Weekly schedule** — navigate week by week, add events per family member with time, tag and colour coding
- **Meal planning** — plan breakfast, lunch and dinner for each day of the week
- **AI meal suggestions** — Claude Haiku suggests meals based on your pantry, leftovers and recent meal history, with extra awareness of gym days
- **Pantry tracker** — keep track of what's at home and what's left over from previous meals, with optional expiry dates
- **Pantry AI input** — add pantry items by typing freetext, taking a photo, or scanning barcodes (EAN/UPC via BarcodeDetector + Open Food Facts)
- **Training schedule** — Fredrik's gym split is baked in (Mon/Wed/Fri/Sun), visible on both the schedule and meal views
- **Swipe navigation** — swipe left/right on the day panel to move between days


## Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML/CSS/JS (single file, no build step) |
| Database | [Supabase](https://supabase.com) (PostgreSQL via REST API) |
| AI | Claude Haiku (`claude-haiku-4-5-20251001`) — direct browser API calls |
| Barcode lookup | BarcodeDetector API + [Open Food Facts](https://world.openfoodfacts.org) |
| Fonts | DM Serif Display + DM Sans (Google Fonts) |

## Database schema

Three tables in Supabase:

```sql
-- Weekly events per family member
schedule_events (id, day date, person text, title text, time_start time, tag text)

-- Meal plan
meal_plan (id, day date, meal_type text, description text)
-- meal_type: 'F' = Frukost, 'L' = Lunch, 'M' = Middag

-- Pantry / leftovers
pantry (id, item text, is_leftover bool, expires_date date, added_date date)
```

## Setup

1. Clone the repo
2. Open `index.html` directly in a browser (no server needed for basic use)
3. Tap ⚙️ and enter your [Anthropic API key](https://console.anthropic.com) — required for AI features
4. The Supabase instance is already configured in the file


## Family members & colours

| Person | CSS variable | Colour |
|---|---|---|
| Fredrik | `--fredrik` | Lime `#c8f064` |
| Camilla | `--camilla` | Pink `#ff9de2` |
| Emilia | `--emilia` | Blue `#6fd4ff` |
| Celvin | `--celvin` | Orange `#ffb86c` |

## Fredrik's gym split

| Day | Workout |
|---|---|
| Måndag | Ben & Glutes |
| Onsdag | Rygg & Biceps |
| Fredag | Bröst & Triceps |
| Söndag | Axlar & Core |

## Notes

- The API key is stored in `localStorage` — never committed
- The app is in Swedish
- Mobile-first layout, max-width 480px
- BarcodeDetector requires Chrome on Android or Safari iOS 17+
