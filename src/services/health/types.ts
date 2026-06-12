export type HealthWorkout = {
  source?: string;
  activityType: string;
  start: string;
  end: string;
  durationMinutes: number;
};

export type HealthSummary = {
  platform: "android" | "ios" | "web";
  workouts: HealthWorkout[];
  workoutMinutes: number;
  sleepMinutes: number;
  sleepQuality: number | null;
  weightKg: number | null;
  heightCm: number | null;
  syncedAt: string;
};

export type HealthRange = {
  startDate: string;
  endDate: string;
};

