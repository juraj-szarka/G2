import type { HealthRange, HealthSummary } from "./types";

export async function readMockHealthSummary(_range: HealthRange): Promise<HealthSummary> {
  return {
    platform: "web",
    workouts: [],
    workoutMinutes: 0,
    sleepMinutes: 0,
    sleepQuality: null,
    weightKg: null,
    heightCm: null,
    syncedAt: new Date().toISOString()
  };
}

