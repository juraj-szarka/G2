import type { DailyLog } from "@/types/database";

function ratio(value: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return Math.min(value / target, 1);
}

function calorieTargetScore(calories: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return Math.max(0, 1 - Math.abs(calories - target) / target);
}

export function calculateScores(log: Pick<
  DailyLog,
  | "workout_minutes"
  | "workout_target_minutes"
  | "sleep_minutes"
  | "sleep_target_minutes"
  | "calories"
  | "protein"
  | "carbs"
  | "fat"
  | "target_calories"
  | "target_protein"
  | "target_carbs"
  | "target_fat"
>) {
  const workoutRatio = ratio(log.workout_minutes, log.workout_target_minutes);
  const sleepRatio = ratio(log.sleep_minutes, log.sleep_target_minutes);
  const macroRatio =
    (calorieTargetScore(log.calories, log.target_calories) +
      ratio(log.protein, log.target_protein) +
      ratio(log.carbs, log.target_carbs) +
      ratio(log.fat, log.target_fat)) /
    4;

  return {
    exerciseScore: Math.round(workoutRatio * 100),
    healthScore: Math.round(workoutRatio * 40 + sleepRatio * 40 + macroRatio * 20),
    workoutRatio,
    sleepRatio,
    macroRatio
  };
}

