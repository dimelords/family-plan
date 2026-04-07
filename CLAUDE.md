# CLAUDE.md — Family Planner codebase guide

This file gives Claude all the context needed to work on this project effectively.
Read this before making any changes.

## What this is

A React/TypeScript family planning web app for Fredrik, Camilla, Emilia and Celvin.
Built with Vite, deployed on Netlify, backed by Supabase.

## Architecture

```
src/
  App.tsx               — root, auth gate, main layout, modal wiring
  main.tsx              — entry point
  index.css             — all styles (CSS custom properties, no CSS modules)
  components/
    Header.tsx          — week navigation + settings button
    StatusBar.tsx       — DB connection indicator
    DayStrip.tsx        — horizontal day selector
    DayPanel.tsx        — swipeable day event cards
    auth/
      LoginScreen.tsx   — Google + Spotify OAuth buttons
      FamilySetupScreen.tsx
    modals/
      EventModal.tsx    — add/edit calendar events
      MealModal.tsx     — add meals, trigger AI suggestions
      PantryModal.tsx   — add pantry items (manual, AI, barcode)
      RecipeModal.tsx   — cooking view with wake lock, timers, servings scaling
      SettingsModal.tsx — features, theme, Withings, invite link, API key
      OnboardingModal.tsx
  tabs/
    TrainingTab.tsx     — AI training plans, drag-and-drop sessions
    MealsTab.tsx        — weekly meal plan, recipe button per meal
    PantryTab.tsx       — pantry inventory
    BodyTab.tsx         — weight/measurements charts
    PhotosTab.tsx       — progress photos
  hooks/
    useAuth.ts          — Supabase auth state + signInWithProvider
    useFamily.ts        — family members + colour map
    useScheduleData.ts  — events, meals, pantry, recentMeals
    useCurrentMember.ts — logged-in member + person_preferences
    usePersonFeatures.ts — feature flag derivation from prefs
    useTrainingPlan.ts  — training sessions for current member
    useWeek.ts          — week navigation state
    useTheme.ts         — light/dark/system theme
    useWakeLock.ts      — screen wake lock (used by RecipeModal)
  lib/
    supabase.ts         — typed Supabase client
    claude.ts           — claudeCall(), parseJson(), getApiKey()
    dates.ts            — dateStr(), weekStart helpers
    constants.ts        — GYM_DAYS, MEAL_NAMES, FULL_DAY_NAMES
    holidays.ts         — Swedish public holidays
  types/
    database.ts         — generated Supabase types + app-level interfaces
supabase/
  functions/
    withings-callback/  — OAuth redirect handler (verify_jwt: false)
    withings-sync/      — manual re-sync endpoint
```

## Services

### Supabase
```
URL:  https://jbyhmiztcnaxocwdbgwi.supabase.co
KEY:  sb_publishable_OOqqsCtOK6fHPOrHwAQzPQ_DfFtqkgz  (anon, safe to expose)
```
All DB access via the typed client in `src/lib/supabase.ts`.
Tables: `families`, `family_members`, `family_invitations`, `person_preferences`,
        `schedule_events`, `meal_plan`, `pantry`, `recipes`,
        `training_plans`, `training_sessions`, `body_log`, `progress_photos`,
        `withings_tokens`.

RLS is enabled on all tables. Policies are family-scoped via `family_members.user_id = auth.uid()`.

### Claude API
```ts
claudeCall(system: string, userContent: string | AnthropicContent, maxTokens = 600): Promise<string>
parseJson<T>(raw: string): T   // strips fences + jsonrepair fallback
```
- API key read from `localStorage('anthropic_key')` — set in ⚙️ Settings
- Model: `claude-haiku-4-5-20251001`
- Direct browser calls via `anthropic-dangerous-direct-browser-access: true`
- Always request raw JSON. Use `parseJson<T>()` to parse — never `JSON.parse` directly.

### Withings (weight sync)
OAuth 2.0 via Edge Functions. Client ID safe to expose; secret lives in Supabase secrets only.
- `withings-callback` — receives redirect, stores tokens, fetches initial weight
- `withings-sync` — re-fetches weight, refreshes token if near expiry

### Open Food Facts (barcode lookup)
```
GET https://world.openfoodfacts.org/api/v0/product/{ean}.json
```

## CSS conventions

Variables defined in `:root` (and overridden in `[data-theme="light"]`):
```css
--bg, --surface, --surface2, --border   /* dark theme layers */
--accent (#c8f064), --accent2 (#7b6fff) /* lime green, purple */
--text, --muted, --danger
```

No CSS modules. All styles in `src/index.css`, organised by component with `/* ── Section ── */` comments.

Modals: render with `className="modal-overlay open"`. The `open` class is always present — visibility is controlled by conditional rendering (`if (!open) return null`).

## Key data structures

```ts
// person_preferences (one per family_member)
{ family_member_id, enable_training, enable_nutrition_ai, enable_body_tracking,
  weight_kg, height_cm, age, gender, activity_level,
  wake_time, preferred_training_time, goal, is_minor }

// schedule_events
{ id, family_id, day: "2025-01-06", person: "Fredrik", title, time_start, tag: "SKOLA"|"GYM"|"VILA"|null }

// meal_plan
{ id, family_id, day, meal_type: "F"|"L"|"M", description }

// recipes  (cached by family_id + source_description)
{ id, family_id, source_description, title, servings, ingredients: RecipeIngredient[], steps: RecipeStep[] }

// training_sessions
{ id, family_id, plan_id, person, scheduled_date, workout_type, exercises: Exercise[], completed, notes }
```

## Gym split

```ts
const GYM_DAYS = [0, 2, 4, 6] // Mon, Wed, Fri, Sun (0 = Monday)
```

Gym days affect meal AI suggestions (higher protein targets) and training tab display.

## Adding a new feature — checklist

1. **New Supabase table?** Run migration via Supabase MCP (`apply_migration`), add the type to `src/types/database.ts` Tables section and export a named alias at the bottom.
2. **New modal?** Create `src/components/modals/MyModal.tsx`, lazy-import in `App.tsx`, add open state, render conditionally with `<Suspense fallback={null}>`.
3. **New tab?** Add component to `src/tabs/`, lazy-import in `App.tsx`, add feature-flag check + tab button.
4. **New AI feature?** Use `claudeCall` + `parseJson<T>`. Ask for raw JSON in the system prompt. Handle errors with a user-visible message, never a silent catch.
5. **New hook?** Keep hooks pure — no side effects outside `useEffect`. Return stable references with `useMemo`/`useCallback` where needed.

## What NOT to do

- Don't use `JSON.parse` directly — always use `parseJson<T>()` from `src/lib/claude.ts`
- Don't add `any` types — derive proper types from the DB schema or define interfaces
- Don't commit secrets — API key in localStorage, Withings secret in Supabase secrets only
- Don't change Supabase credentials without updating the DB accordingly
- Don't use top-level `await` — all async logic lives inside functions
- Don't discuss architecture in code comments — this file is for that

## Language

The UI is in Swedish. Keep all user-facing strings in Swedish.
Code, comments, and this file can be in English.

## Code Review Standards

After completing any implementation, review the code for:

- **Functions longer than 30 lines** — likely doing too much; split into smaller focused functions
- **Logic duplicated more than twice** — extract to a utility in `src/lib/` or a shared hook
- **Any `any` type usage in TypeScript** — replace with real types derived from `database.ts` or explicit interfaces
- **Components with more than 3 props that could be grouped** — consider an options object or splitting the component
- **Missing error handling on async operations** — every `claudeCall`, `supabase.from(...)`, and `fetch` must have a catch path that surfaces feedback to the user
