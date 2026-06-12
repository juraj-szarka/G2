# Setup Guide — Gen2

This guide walks you through getting the app running **from a fresh GitHub clone**, step by step. No prior knowledge of Expo, Supabase, or React Native is assumed — each step explains what you're doing and why.

---

## Prerequisites

Before you start, install these on your computer:

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

Open a terminal (PowerShell, Terminal, or Command Prompt) and run:

```powershell
git clone https://github.com/YOUR-ORG/gen2.git
cd gen2
```

> If you don't have the URL, ask whoever gave you access to the repo.

---

## Step 2 — Install dependencies

Dependencies are listed in `package.json`. This command downloads them into `node_modules/`:

```powershell
npm install
```

Then fix any Expo-specific mismatches:

```powershell
npx expo install --fix
```

---

## Step 3 — Create a Supabase project

Supabase is your backend (database, authentication, storage). You need to create your own project.

1. Go to https://supabase.com and sign up (free tier is fine).
2. Click **New project**.
3. Fill in:
   - **Name**: `gen2` (or anything)
   - **Database password**: generate a strong one and save it somewhere safe
   - **Region**: pick one close to you
4. Wait ~2 minutes for the project to spin up.

After creation, go to **Project Settings > API** and find:
- **Project URL** (looks like `https://xxxxx.supabase.co`)
- **anon public key** (a long base64 string)

Keep this page open — you'll need both values in the next step.

---

## Step 4 — Configure environment variables

Create your local `.env` file by copying the template:

```powershell
Copy-Item .env.example .env
```

Open `.env` in any text editor and fill in the values from the Supabase project settings page:

```text
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

Only these two values are required to get the app running. Leave `EXPO_PUBLIC_EAS_PROJECT_ID` blank for now.

> **Why `.env`?** The app reads these at build time. They let `@supabase/supabase-js` connect to your backend. `.env` is listed in `.gitignore` so your keys never get committed.

---

## Step 5 — Run the database migrations

Migrations are SQL files that create tables, triggers, and security policies. You need to apply them in order.

### Option A — Supabase SQL Editor (easiest)

1. In your Supabase dashboard, go to **SQL Editor**.
2. Open each file from `supabase/migrations/` **in order**:
   - `0001_gen2.sql` — main schema (profiles, daily_logs, manual_workouts, nutrition_logs, RLS, triggers)
   - `0002_workout_scores.sql` — adds score_per_unit to manual_workouts
   - `0003_manual_score_sync.sql` — syncs manual workout points into daily_logs health score
   - `0004_workout_goal.sql` — adds workout_points_goal to profiles
3. Copy the entire file content, paste it into the SQL Editor, and click **Run**.
4. After all four are done, refresh the schema cache:

```sql
NOTIFY pgrst, 'reload schema';
```

### Option B — Supabase CLI (if you prefer the command line)

First, link your local project to your Supabase project:

```powershell
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
```

The project ref is the part of the URL between `https://` and `.supabase.co`.

Then push migrations:

```powershell
npx supabase db push
```

---

## Step 6 — Set up authentication

The app uses Supabase Auth (email + password). In your Supabase dashboard:

1. Go to **Authentication > Providers**.
2. Make sure **Email** is enabled.
3. Under **Email > Disable email confirmation** (optional — for development, turn off email confirmation so you can sign up without verifying).

> **Why?** The signup form at `app/(auth)/sign-up.tsx` calls `supabase.auth.signUp()` which creates a user in Supabase Auth. A database trigger automatically creates a matching row in the `profiles` table.

---

## Step 7 — Enable native Android builds (required)

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

### First run — install the dev build on a device/emulator

Make sure you have an Android emulator running (from Android Studio's Device Manager) or a physical Android device connected via USB with USB debugging enabled.

```powershell
npm run android
```

This compiles a native `.apk` / `.aab`, installs it on your device, and launches the app. It takes a few minutes the first time.

### Subsequent runs — fast reload

Once the dev build is installed, you can just start the Metro bundler:

```powershell
npm run start
```

Then press `a` to open it on Android. Changes to JS/TS files will hot-reload instantly.

---

## Step 9 — TypeScript check (optional but recommended)

Verify your code has no type errors:

```powershell
npm run typecheck
```

This runs `tsc --noEmit`. Fix any errors before committing.

---

## Step 10 — (Optional) Edge function for meal analysis

The app has a Supabase Edge Function (`supabase/functions/analyze-meal/`) that sends a meal photo to OpenAI and parses the macro response.

### Deploy the function

First, set your OpenAI key as a Supabase secret:

```powershell
npx supabase secrets set OPENAI_API_KEY=sk-your-key-here
npx supabase secrets set OPENAI_VISION_MODEL=gpt-4o
```

Then deploy:

```powershell
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

## Project structure at a glance

```
gen2/
├── app/                     # Expo Router pages (file-based routing)
│   ├── (auth)/              # sign-in, sign-up
│   ├── (tabs)/              # main tab screens: index, workout, nutrition, social, settings
│   └── _layout.tsx          # root layout (auth guard + providers)
├── src/
│   ├── components/          # reusable UI components (MetricCard, ProgressBar, etc.)
│   ├── constants/           # colors, theme tokens
│   ├── data/                # static data (activity presets)
│   ├── lib/                 # Supabase client singleton
│   ├── services/            # API calls (logs, health, etc.)
│   ├── store/               # Zustand state stores (auth, health, etc.)
│   └── types/               # TypeScript types (database, health)
├── supabase/
│   ├── migrations/          # SQL migrations (run in order)
│   └── functions/           # Supabase Edge Functions
├── .env                     # your local env vars (gitignored)
├── .env.example             # template for .env
├── app.config.ts            # Expo app config
├── tailwind.config.js       # NativeWind / Tailwind theme
├── tsconfig.json            # TypeScript config
└── GUIDE.md                 # you are here
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
