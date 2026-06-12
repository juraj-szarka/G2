# Gen2

Gen2 is an Expo React Native health and habit tracker. Android is the first target through Health Connect, and iOS is prepared for a future HealthKit build.

## What Is Included

- Expo Router navigation with auth, dashboard, counter, nutrition, social, and profile screens.
- NativeWind styling with a minimal palette and green accents reserved for scores, progress, and success states.
- Zustand stores for auth, health sync, and daily manual counters.
- Supabase Auth, Database, Storage, RLS policies, friend workflow, and signup profile trigger.
- Supabase Edge Function that sends a meal image to OpenAI and requires structured macro JSON.
- Android Health Connect service plus an iOS HealthKit placeholder service.

## 1. Install Tools

Install Node.js 22.13 or newer, Android Studio, Expo CLI, EAS CLI, and Supabase CLI.

```powershell
npm install -g eas-cli supabase
```

## 2. Install App Dependencies

From this folder:

```powershell
npm install
npx expo install --fix
```

## 3. Configure Environment

Copy `.env.example` to `.env` and fill in your Supabase values:

```powershell
Copy-Item .env.example .env
```

Required values:

```text
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 4. Create Supabase Backend

Create a Supabase project, then run the SQL in:

```text
supabase/migrations/0001_gen2.sql
```

You can paste it into the Supabase SQL editor, or run it with Supabase CLI after linking your project.

The migration creates:

- `profiles`
- `friendships`
- `daily_logs`
- `manual_workouts`
- `nutrition_logs`
- private `meal-images` storage bucket policies
- RLS policies
- score calculation triggers
- automatic profile creation on signup
- friend request helper RPC

## 5. Configure Edge Function Secrets

Create `supabase/.env.local` for local function development:

```text
OPENAI_API_KEY=sk-...
OPENAI_VISION_MODEL=gpt-5.5
```

Set the production secret:

```powershell
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set OPENAI_VISION_MODEL=gpt-5.5
```

Deploy:

```powershell
supabase functions deploy analyze-meal
```

## 6. Start Android First

Health Connect requires a native development build, not Expo Go.

```powershell
npx expo prebuild --platform android
npm run android
```

For normal JS development after the dev build is installed:

```powershell
npm run start
```

Press `a` to open Android.

## 7. iOS Infrastructure

iOS bundle settings, HealthKit permission text, and a `react-native-health` service adapter are already in place. Before a real iOS release, enable HealthKit in the Apple developer portal/Xcode capabilities and verify the native health entitlement after prebuild:

```text
src/services/health/ios.ts
```

## Manual QA Checklist

1. Sign up with email/password.
2. Confirm a profile row is created in Supabase.
3. Open Dashboard and tap Health Connect sync on Android.
4. Open Counter and increment the daily push-up goal.
5. Open Nutrition, choose or take a meal photo, and verify macros are saved.
6. Open Social, copy or scan a friend code, send a request, and accept from the other account.
7. Verify friends can read shared profile metrics but cannot read private logs.

## Notes

- Green UI is intentionally limited to scores, progress, and success states.
- The health score formula is stored in the SQL trigger: 40% workout target, 40% sleep target, 20% macro target.
- Meal photos are stored in a private Supabase Storage bucket using the path pattern `{user_id}/{timestamp}.jpg`.
- The OpenAI key only lives in Supabase secrets and is never exposed to the app.
