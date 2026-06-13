import { supabase } from "@/lib/supabase";
import type { ManualWorkout, NutritionLog } from "@/types/database";
import { dateDaysAgo, todayISO } from "@/utils/date";
import type { HealthSummary } from "./health";

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("You must be signed in.");
  }

  return data.user.id;
}

export async function loadTodayDailyLog() {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", todayISO())
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function upsertDailyLogFromHealth(summary: HealthSummary) {
  const userId = await requireUserId();
  const { data: profile } = await supabase
    .from("profiles")
    .select("target_workout_minutes,target_sleep_minutes,target_calories,target_protein,target_carbs,target_fat")
    .eq("id", userId)
    .single();

  const payload = {
    user_id: userId,
    log_date: todayISO(),
    workout_minutes: Math.round(summary.workoutMinutes),
    workout_target_minutes: profile?.target_workout_minutes ?? 45,
    sleep_minutes: Math.round(summary.sleepMinutes),
    sleep_target_minutes: profile?.target_sleep_minutes ?? 480,
    sleep_quality: summary.sleepQuality,
    target_calories: profile?.target_calories ?? 2200,
    target_protein: profile?.target_protein ?? 150,
    target_carbs: profile?.target_carbs ?? 220,
    target_fat: profile?.target_fat ?? 70,
    synced_at: summary.syncedAt
  };

  const { data, error } = await supabase
    .from("daily_logs")
    .upsert(payload, { onConflict: "user_id,log_date" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listManualWorkouts() {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("manual_workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", todayISO())
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function getOrCreateManualWorkout(name = "Push-ups") {
  const userId = await requireUserId();
  const logDate = todayISO();
  const { data: existing, error: readError } = await supabase
    .from("manual_workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", logDate)
    .eq("name", name)
    .maybeSingle();

  if (readError) {
    throw readError;
  }

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("manual_workouts")
    .insert({ user_id: userId, log_date: logDate, name, target_count: 200, increment_step: 10 })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function createManualWorkout(
  name: string,
  targetCount = 200,
  incrementStep = 10,
  scorePerUnit = 0.1,
  iconName = "Dumbbell",
  color = "#059669",
  unit = "",
) {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("manual_workouts")
    .insert({
      user_id: userId,
      log_date: todayISO(),
      name,
      unit,
      target_count: targetCount,
      increment_step: incrementStep,
      score_per_unit: scorePerUnit,
    } as any)
    .select()
    .single();

  if (error) throw error;

  try {
    await supabase
      .from("manual_workouts")
      .update({ icon_name: iconName, color } as any)
      .eq("id", data.id);
  } catch {}

  return data;
}

export type WorkoutDay = {
  date: string;
  activities: Array<{
    name: string;
    count: number;
    score_per_unit: number;
    score: number;
    unit: string;
    icon_name: string;
    color: string;
  }>;
  totalScore: number;
};

export async function getWorkoutHistory(days = 7) {
  const userId = await requireUserId();
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(todayISO(d));
  }

  const { data, error } = await supabase
    .from("manual_workouts")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", dates[0])
    .lte("log_date", dates[dates.length - 1])
    .order("log_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const byDate = new Map<string, WorkoutDay>();
  for (const date of dates) {
    byDate.set(date, { date, activities: [], totalScore: 0 });
  }

  for (const w of data ?? []) {
    const entry = byDate.get(w.log_date);
    if (!entry) continue;
    const score = Math.round(w.current_count * w.score_per_unit * 10) / 10;
    entry.activities.push({
      name: w.name,
      count: w.current_count,
      score_per_unit: w.score_per_unit,
      score,
      unit: w.unit,
      icon_name: w.icon_name,
      color: w.color,
    });
    entry.totalScore = Math.round((entry.totalScore + score) * 10) / 10;
  }

  return Array.from(byDate.values());
}

export async function updateManualWorkoutCount(workout: ManualWorkout, delta: number) {
  const nextCount = Math.max(0, workout.current_count + delta);
  const { data, error } = await supabase
    .from("manual_workouts")
    .update({ current_count: nextCount })
    .eq("id", workout.id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function listTodayNutrition() {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("nutrition_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", todayISO())
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteManualWorkout(id: string) {
  const { error } = await supabase.from("manual_workouts").delete().eq("id", id);

  if (error) {
    throw error;
  }
}

export async function syncManualWorkoutPoints() {
  const userId = await requireUserId();
  const { error } = await supabase.rpc("sync_manual_workout_points", {
    p_user_id: userId,
    p_log_date: todayISO(),
  });

  if (error) {
    throw error;
  }
}

export async function addNutritionLog(input: Omit<NutritionLog, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase.from("nutrition_logs").insert(input).select().single();

  if (error) {
    throw error;
  }

  return data;
}

export type WorkoutTypeInfo = {
  name: string;
  icon_name: string;
  color: string;
  unit: string;
};

export async function listUserWorkoutTypes() {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("manual_workouts")
    .select("name, icon_name, color, unit")
    .eq("user_id", userId)
    .order("name", { ascending: true });

  if (error) throw error;

  const seen = new Set<string>();
  const types: WorkoutTypeInfo[] = [];
  for (const row of data ?? []) {
    if (!seen.has(row.name)) {
      seen.add(row.name);
      types.push({ name: row.name, icon_name: row.icon_name, color: row.color, unit: row.unit });
    }
  }
  return types;
}

export async function updateWorkoutType(name: string, iconName: string, color: string) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("manual_workouts")
    .update({ icon_name: iconName, color })
    .eq("user_id", userId)
    .eq("name", name);

  if (error) throw error;
}

export async function deleteWorkoutType(name: string) {
  const userId = await requireUserId();
  const { error } = await supabase
    .from("manual_workouts")
    .delete()
    .eq("user_id", userId)
    .eq("name", name);

  if (error) throw error;
}

export async function loadTodaysWorkoutPoints() {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("manual_workouts")
    .select("current_count, score_per_unit")
    .eq("user_id", userId)
    .eq("log_date", todayISO());

  if (error) throw error;

  return (data ?? []).reduce(
    (sum, w) => sum + Math.round(w.current_count * w.score_per_unit * 10) / 10,
    0,
  );
}

export async function getYesterdayWorkouts() {
  const userId = await requireUserId();
  const yesterday = dateDaysAgo(1);
  const { data, error } = await supabase
    .from("manual_workouts")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", yesterday);

  if (error) throw error;
  return data ?? [];
}

export type MealDay = {
  date: string;
  meals: NutritionLog[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
};

export async function getMealHistory(days = 7) {
  const userId = await requireUserId();
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(todayISO(d));
  }

  const { data, error } = await supabase
    .from("nutrition_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", dates[0])
    .lte("log_date", dates[dates.length - 1])
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  const byDate = new Map<string, MealDay>();
  for (const date of dates) {
    byDate.set(date, { date, meals: [], totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });
  }

  for (const meal of data ?? []) {
    const entry = byDate.get(meal.log_date);
    if (!entry) continue;
    entry.meals.push(meal);
    entry.totalCalories += meal.calories;
    entry.totalProtein += meal.protein;
    entry.totalCarbs += meal.carbs;
    entry.totalFat += meal.fat;
  }

  return Array.from(byDate.values()).filter((d) => d.meals.length > 0);
}

import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "manual_workouts_cache";

export async function listManualWorkoutsCached() {
  try {
    return await listManualWorkouts();
  } catch {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      return JSON.parse(cached) as ManualWorkout[];
    }
    throw new Error("Unable to load workouts.");
  }
}

export async function cacheManualWorkouts(workouts: ManualWorkout[]) {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(workouts));
}

export async function getWorkoutWeekComparison() {
  const userId = await requireUserId();
  const today = todayISO();
  const thisWeekStart = dateDaysAgo(6);
  const lastWeekStart = dateDaysAgo(13);
  const lastWeekEnd = dateDaysAgo(7);

  const { data, error } = await supabase
    .from("manual_workouts")
    .select("current_count, score_per_unit, log_date")
    .eq("user_id", userId)
    .gte("log_date", lastWeekStart)
    .lte("log_date", today);

  if (error) throw error;

  let thisWeek = 0;
  let lastWeek = 0;
  for (const w of data ?? []) {
    const pts = Math.round(w.current_count * w.score_per_unit * 10) / 10;
    if (w.log_date >= thisWeekStart) {
      thisWeek += pts;
    } else {
      lastWeek += pts;
    }
  }

  return { thisWeek: Math.round(thisWeek * 10) / 10, lastWeek: Math.round(lastWeek * 10) / 10 };
}

export async function getActivityHistory(name: string, days = 30) {
  const userId = await requireUserId();
  const dates: string[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(todayISO(d));
  }

  const { data, error } = await supabase
    .from("manual_workouts")
    .select("current_count, score_per_unit, unit, log_date")
    .eq("user_id", userId)
    .eq("name", name)
    .gte("log_date", dates[0])
    .lte("log_date", dates[dates.length - 1])
    .order("log_date", { ascending: true });

  if (error) throw error;

  const byDate = new Map<string, { count: number; score: number; unit: string }>();
  for (const date of dates) {
    byDate.set(date, { count: 0, score: 0, unit: "" });
  }

  for (const w of data ?? []) {
    const entry = byDate.get(w.log_date);
    if (!entry) continue;
    entry.count += w.current_count;
    entry.score += Math.round(w.current_count * w.score_per_unit * 10) / 10;
    entry.unit = w.unit;
  }

  return Array.from(byDate.values());
}
