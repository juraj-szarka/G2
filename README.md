# Gen2

Gen2 is an Expo React Native health and habit tracker. Android is the first target through Health Connect, and iOS is prepared for a future HealthKit build.

## What Is Included

- Expo Router navigation with auth, dashboard, workout, nutrition, social, and settings screens.
- NativeWind styling with a minimal palette and green accents reserved for scores, progress, and success states.
- Zustand stores for auth, health sync, and daily manual counters.
- Supabase Auth, Database, Storage, RLS policies, friend workflow, and signup profile trigger.
- Supabase Edge Function that sends a meal image to OpenAI and returns structured macro JSON.
- Android Health Connect service plus an iOS HealthKit placeholder service.
- 30 preset workout activities with per-unit scoring, interactive history charts (react-native-svg), and daily point goals.
- Manual workout tracking with adaptive increment buttons, goal progress bars, and auto-sync to health score.

---

## Prerequisites

| Tool | What it's for | Download |
|---|---|---|
| **Node.js** | Runs JavaScript outside the browser | https://nodejs.org (version 22 or newer) |
| **Git** | Version control | Usually pre-installed or from https://git-scm.com |
| **Android Studio** | Android emulator + native builds | https://developer.android.com/studio |
| **Expo CLI** | Builds and runs the React Native app | Installed via npm below |
| **EAS CLI** | Deploys to app stores / cloud builds | Installed via npm below |
| **Supabase CLI** | Pushes database migrations | Installed via npm below |

Verify Node.js is installed:

```powershell
node --version   # should show v22.x or higher
```

---

## Step 1 — Clone the repository

```powershell
git clone https://github.com/YOUR-ORG/gen2.git
cd gen2
```

---

## Step 2 — Install dependencies

```powershell
npm install
npx expo install --fix
```

---

## Step 3 — Create a Supabase project

1. Go to https://supabase.com and sign up (free tier is fine).
2. Click **New project**.
3. Fill in:
   - **Name**: `gen2` (or anything)
   - **Database password**: generate a strong one and save it
   - **Region**: pick one close to you
4. Wait ~2 minutes for the project to spin up.

After creation, go to **Project Settings > API** and find:
- **Project URL** (looks like `https://xxxxx.supabase.co`)
- **anon public key** (a long base64 string)

---

## Step 4 — Configure environment variables

Copy the template:

```powershell
Copy-Item .env.example .env
```

Open `.env` and fill in:

```text
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

Only these two values are required to get the app running. Leave `EXPO_PUBLIC_EAS_PROJECT_ID` blank for now.

> `.env` is listed in `.gitignore` so your keys never get committed.

---

## Step 5 — Run the database migrations

### Option A — Supabase SQL Editor (easiest)

1. In your Supabase dashboard, go to **SQL Editor**.
2. Open each file from `supabase/migrations/` **in order**:
   - `0001_gen2.sql` — main schema (profiles, daily_logs, manual_workouts, nutrition_logs, RLS, triggers)
   - `0002_workout_scores.sql` — adds `score_per_unit` to manual_workouts
   - `0003_manual_score_sync.sql` — syncs manual workout points into daily_logs health score
   - `0004_workout_goal.sql` — adds `workout_points_goal` to profiles
3. Copy the entire file content, paste it into the SQL Editor, and click **Run**.
4. After all four are done, refresh the schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

### Option B — Supabase CLI

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

The project ref is the part of the URL between `https://` and `.supabase.co`.

---

## Step 6 — Set up authentication

1. In your Supabase dashboard, go to **Authentication > Providers**.
2. Make sure **Email** is enabled.
3. (Optional) Under **Email > Disable email confirmation** — turn this on for development so you can sign up without verifying.

> The signup form calls `supabase.auth.signUp()`. A database trigger automatically creates a matching row in the `profiles` table on signup.

---

## Step 7 — Enable native Android builds

This app uses **Health Connect** and other native modules. You **cannot** run it with Expo Go — you need a development build.

### 7a — Open Android Studio once

1. Open Android Studio.
2. Go to **SDK Manager** (gear icon in the top-right).
3. Make sure **Android SDK** is installed (at least one version).
4. Set the `ANDROID_HOME` environment variable:
   ```
   ANDROID_HOME = C:\Users\YOUR_USER\AppData\Local\Android\Sdk
   ```

### 7b — Prebuild the native project

```powershell
npx expo prebuild --platform android
```

This generates the `android/` folder (a full Android Studio project). Run it once; re-run only if you add a new native plugin.

---

## Step 8 — Build and run

### First run — install the dev build

Make sure you have an Android emulator running (from Android Studio's Device Manager) or a physical Android device connected via USB with USB debugging enabled.

```powershell
npm run android
```

This compiles a native `.apk`, installs it on your device, and launches the app. It takes a few minutes the first time.

### Subsequent runs — fast reload

```powershell
npm run start
```

Then press `a` to open it on Android. Changes to JS/TS files will hot-reload instantly.

---

## Step 9 — TypeScript check (recommended)

```powershell
npm run typecheck
```

This runs `tsc --noEmit`. Fix any errors before committing.

---

## Step 10 — (Optional) Edge function for meal analysis

The app has a Supabase Edge Function (`supabase/functions/analyze-meal/`) that sends a meal photo to OpenAI and parses the macro response.

### Deploy

```powershell
npx supabase secrets set OPENAI_API_KEY=sk-your-key-here
npx supabase secrets set OPENAI_VISION_MODEL=gpt-4o
npx supabase functions deploy analyze-meal
```

### Test locally

Create `supabase/.env.local`:

```text
OPENAI_API_KEY=sk-...
OPENAI_VISION_MODEL=gpt-4o
```

Then serve:

```powershell
npm run supabase:functions:serve
```

---

## Project structure

```
gen2/
├── app/                     # Expo Router pages (file-based routing)
│   ├── (auth)/              # sign-in, sign-up
│   ├── (tabs)/              # index, workout, nutrition, social, settings
│   └── _layout.tsx          # root layout (auth guard + providers)
├── src/
│   ├── components/          # MetricCard, ProgressBar, WorkoutChart, etc.
│   ├── constants/           # color palette, theme tokens
│   ├── data/                # 30 workout activity presets
│   ├── lib/                 # Supabase client singleton
│   ├── services/            # API calls (logs, health, etc.)
│   ├── store/               # Zustand state stores (auth, health, etc.)
│   └── types/               # TypeScript types matching the DB schema
├── supabase/
│   ├── migrations/          # SQL migrations (run in order)
│   └── functions/           # analyze-meal Edge Function
├── .env                     # local env vars (gitignored)
├── .env.example             # template
├── app.config.ts            # Expo config (native plugins, permissions)
├── tailwind.config.js       # NativeWind / Tailwind theme
└── tsconfig.json            # TypeScript config with @/ path alias
```

---

## Common issues

### `npx expo start` opens Expo Go instead of dev build
- Close Expo Go.
- Run `npx expo start --dev-client` or press `s` in the Metro terminal to switch to development build mode.

### "Cannot connect to Supabase"
- Double-check the URL and anon key in `.env`.
- Make sure the Supabase project isn't paused (free projects pause after 1 week of inactivity — unpause in dashboard).
- Run `NOTIFY pgrst, 'reload schema';` in SQL Editor.

### "column workout_points_goal does not exist"
- You missed migration `0004_workout_goal.sql`. Run it in the SQL Editor.

### "TypeError: Invalid URL" on sign-up
- Make sure `EXPO_PUBLIC_SUPABASE_URL` in `.env` is a valid URL (e.g. `https://abc123.supabase.co`).

### Build fails on Android
- Re-run `npx expo prebuild --platform android --clean` then `npm run android`.
- Make sure Android Studio SDK is installed and `ANDROID_HOME` is set.

---

## Manual QA Checklist

1. Sign up with email/password.
2. Confirm a profile row is created in Supabase (`profiles` table).
3. Open the workout tab and add an activity from the 30 presets.
4. Tap the activity, increment using the adaptive buttons, verify the progress bar and points update.
5. Delete the activity with the trash icon and confirm.
6. Open workout history, toggle between Past 7 days / Past month, tap bars to see day detail.
7. Check the dotted goal line matches your goal from Settings.
8. Go to Settings, change your daily point goal, and verify it updates in history.
9. Open Nutrition, take or pick a meal photo, and verify macros are saved (if Edge Function is deployed).
10. Open Social, copy or scan a friend code, send a request, and accept from the other account.
11. Verify friends can read shared profile metrics but cannot read private logs.
12. Open Dashboard and tap Health Connect sync on Android (requires Health Connect app installed).

---

## Notes

- Green UI is intentionally limited to scores, progress, and success states.
- The health score formula is stored in the SQL trigger: 40% workout target, 40% sleep target, 20% macro target. Manual workout points contribute up to +20 toward the exercise score and up to +10 toward the health score.
- Workout activities have per-unit scoring (e.g. running = 5 pts/km, push-ups = 0.1 pts/rep). The daily point goal is configurable in Settings.
- Meal photos are stored in a private Supabase Storage bucket using the path pattern `{user_id}/{timestamp}.jpg`.
- The OpenAI key only lives in Supabase secrets and is never exposed to the app.
- iOS bundle settings, HealthKit permission text, and a `react-native-health` service adapter are already in place in `src/services/health/ios.ts`. Before a real iOS release, enable HealthKit in the Apple developer portal / Xcode capabilities.
