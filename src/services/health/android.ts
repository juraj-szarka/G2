import type { HealthRange, HealthSummary } from "./types";

type HealthConnectModule = {
  initialize: () => Promise<boolean>;
  requestPermission: (permissions: { accessType: "read"; recordType: string }[]) => Promise<unknown>;
  readRecords: (recordType: string, options: Record<string, unknown>) => Promise<{ records?: unknown[] } | unknown[]>;
};

function getRecords(result: { records?: unknown[] } | unknown[]) {
  return Array.isArray(result) ? result : result.records ?? [];
}

function recordTime(record: Record<string, unknown>, key: "start" | "end") {
  const direct = record[`${key}Time`] ?? record[`${key}Date`] ?? record[key];
  return typeof direct === "string" ? direct : null;
}

function minutesBetween(start: string | null, end: string | null) {
  if (!start || !end) {
    return 0;
  }

  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60_000);
}

function numericNested(record: Record<string, unknown>, keys: string[]) {
  let current: unknown = record;
  for (const key of keys) {
    if (!current || typeof current !== "object") {
      return null;
    }

    current = (current as Record<string, unknown>)[key];
  }

  const amount = Number(current);
  return Number.isFinite(amount) ? amount : null;
}

export async function readAndroidHealthSummary(range: HealthRange): Promise<HealthSummary> {
  const healthConnect = (await import("react-native-health-connect")) as unknown as HealthConnectModule;
  const initialized = await healthConnect.initialize();

  if (!initialized) {
    throw new Error("Health Connect is not available on this device.");
  }

  await healthConnect.requestPermission([
    { accessType: "read", recordType: "ExerciseSession" },
    { accessType: "read", recordType: "SleepSession" },
    { accessType: "read", recordType: "Weight" },
    { accessType: "read", recordType: "Height" }
  ]);

  const timeRangeFilter = {
    operator: "between",
    startTime: range.startDate,
    endTime: range.endDate
  };

  const [exerciseResult, sleepResult, weightResult, heightResult] = await Promise.all([
    healthConnect.readRecords("ExerciseSession", { timeRangeFilter }),
    healthConnect.readRecords("SleepSession", { timeRangeFilter }),
    healthConnect.readRecords("Weight", { timeRangeFilter }),
    healthConnect.readRecords("Height", { timeRangeFilter })
  ]);

  const workouts = getRecords(exerciseResult).map((item) => {
    const record = item as Record<string, unknown>;
    const start = recordTime(record, "start") ?? range.startDate;
    const end = recordTime(record, "end") ?? range.endDate;

    return {
      source: typeof record.sourcePackageName === "string" ? record.sourcePackageName : undefined,
      activityType: typeof record.exerciseType === "string" ? record.exerciseType : "Workout",
      start,
      end,
      durationMinutes: minutesBetween(start, end)
    };
  });

  const sleepMinutes = getRecords(sleepResult).reduce<number>((total, item) => {
    const record = item as Record<string, unknown>;
    return total + minutesBetween(recordTime(record, "start"), recordTime(record, "end"));
  }, 0);

  const latestWeight = getRecords(weightResult).at(-1) as Record<string, unknown> | undefined;
  const latestHeight = getRecords(heightResult).at(-1) as Record<string, unknown> | undefined;
  const weightKg = latestWeight ? numericNested(latestWeight, ["weight", "inKilograms"]) : null;
  const heightMeters = latestHeight ? numericNested(latestHeight, ["height", "inMeters"]) : null;

  return {
    platform: "android",
    workouts,
    workoutMinutes: workouts.reduce<number>((total, workout) => total + workout.durationMinutes, 0),
    sleepMinutes,
    sleepQuality: sleepMinutes > 0 ? Math.min(sleepMinutes / 480, 1) : null,
    weightKg,
    heightCm: heightMeters ? heightMeters * 100 : null,
    syncedAt: new Date().toISOString()
  };
}
