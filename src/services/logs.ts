import { supabase } from "@/lib/supabase";
import type { ManualWorkout, NutritionLog } from "@/types/database";
import { todayISO } from "@/utils/date";
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
) {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from("manual_workouts")
    .insert({
      user_id: userId,
      log_date: todayISO(),
      name,
      target_count: targetCount,
      increment_step: incrementStep,
      score_per_unit: scorePerUnit,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

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
