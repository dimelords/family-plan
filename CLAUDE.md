# SKILL.md — Familjeveckan codebase guide

This file gives Claude all the context needed to work on this project effectively.
Read this before making any changes.

## What this is

A single-file (`index.html`) family planning web app for Fredrik, Camilla, Emilia and Celvin.
No build step. No framework. No npm. Open the file → it works.

## Architecture

Everything lives in `index.html`:
- **`<style>`** — all CSS, using CSS custom properties for theming and per-person colours
- **`<body>`** — all HTML markup (header, day strip, day panels, tab sections, modals)
- **`<script>`** — all JS at the bottom of body, no modules

State is held in plain global variables (`allEvents`, `allMeals`, `allPantry`, `recentMeals`, `currentDay`, `currentWeekStart`).
Rendering is done by calling `render*()` functions that rebuild innerHTML.

## Services

### Supabase
```js
const SB_URL = 'https://jbyhmiztcnaxocwdbgwi.supabase.co';
const SB_KEY = 'sb_publishable_OOqqsCtOK6fHPOrHwAQzPQ_DfFtqkgz';
```
All DB access goes through `sbFetch(path, opts)` which wraps fetch against the Supabase REST API.
Tables: `schedule_events`, `meal_plan`, `pantry`.


### Claude API
```js
async function claudeCall(system, user, maxTokens=600)
```
- Reads `anthropic_key` from `localStorage` — set by the user in ⚙️ Settings
- Uses `claude-haiku-4-5-20251001`
- Direct browser calls via `anthropic-dangerous-direct-browser-access: true`
- Used for: meal suggestions (`askAI`) and pantry parsing (`parsePantryText`, `parsePantryPhoto`)
- Always expects the model to return raw JSON (no markdown fences) — strip with `.replace(/```json|```/g,'')`

### Open Food Facts (barcode lookup)
```
GET https://world.openfoodfacts.org/api/v0/product/{ean}.json
```
Used in `lookupBarcode()` after BarcodeDetector finds a code.
Falls back to `"EAN {code}"` if product not found.

## CSS conventions

CSS variables defined in `:root`:
```css
--bg, --surface, --surface2, --border   /* dark theme layers */
--accent (#c8f064), --accent2 (#7b6fff) /* lime green, purple */
--text, --muted, --danger
--fredrik, --camilla, --emilia, --celvin /* per-person colours */
```

Per-person event border colours use `.ev-{person}` classes (e.g. `.ev-fredrik`).
Gym-day styling uses `.gym-day` and `.ev-gym` / `.badge-gym`.
Tags use `.tag-{name}` classes: `tag-gym`, `tag-skola`, `tag-vila`.

Modals: add class `open` to show, remove to hide. `closeModal(id)` handles cleanup.


## Key data structures

```js
// schedule_events row
{ id, day: "2025-01-06", person: "Fredrik", title: "Möte", time_start: "09:00", tag: "SKOLA"|"GYM"|"VILA"|null }

// meal_plan row
{ id, day: "2025-01-06", meal_type: "F"|"L"|"M", description: "Havregrynsgröt med bär" }

// pantry row
{ id, item: "Kycklingfilé 500g", is_leftover: false, expires_date: "2025-01-08"|null, added_date }
```

## Gym split (hardcoded)

```js
const gymDays = [0, 2, 4, 6]; // Mon, Wed, Fri, Sun (0 = Monday in this app)
const gymLabels = ['Ben & Glutes','','Rygg & Biceps','','Bröst & Triceps','','Axlar & Core'];
```

Fredrik's training is baked into the UI — gym events appear automatically and meal suggestions
are aware of gym days (higher protein/calorie targets).

## Adding a new feature — checklist

1. **New Supabase table?** Add `sbFetch` calls following the existing pattern. No migrations file — do it in the Supabase dashboard.
2. **New modal?** Copy an existing modal's HTML structure (`.modal-overlay > .modal`), add `open`/`closeModal` wiring.
3. **New tab?** Add a `.tab-btn` + `.tab-panel` pair, hook into `selectTab()`.
4. **New person?** Add a CSS variable `--name: #hex`, a `.ev-name` border rule, and include them in `personClass`/`personColor` maps.
5. **New AI feature?** Follow the `claudeCall` pattern — always ask for raw JSON, always strip fences, always handle errors inline in the result element.


## Rendering flow

```
loadData()
  → sbFetch (schedule_events, meal_plan, pantry, recent meal_plan)
  → allEvents / allMeals / allPantry / recentMeals updated
  → renderEvents()   — rebuilds #events-{dayIdx} for current week
  → renderMeals()    — rebuilds #mealList
  → renderPantry()   — rebuilds #pantryList
  → setStatus()      — updates connection indicator

renderWeek()         — called on week change, rebuilds day strip + day panels
selectDay(idx)       — toggles active class on day buttons and panels
```

Always call `loadData()` after any write to keep UI in sync.

## What NOT to do

- Don't split into multiple files without a bundler — the whole point is zero-dependency simplicity
- Don't add npm or a framework without discussing with Fredrik first
- Don't commit the Anthropic API key — it lives in localStorage only
- Don't change the Supabase credentials without updating the database accordingly
- Don't use `async/await` at top level — all async logic lives inside `async function`s and is kicked off from event handlers or `renderWeek()`/`loadData()`

## Language

The UI is in Swedish. Keep all user-facing strings in Swedish.
Code comments and this file can be in English.
