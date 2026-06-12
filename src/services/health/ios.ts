import type { HealthRange, HealthSummary } from "./types";

type AppleHealthKitModule = {
  Constants?: {
    Permissions?: Record<string, string>;
  };
  initHealthKit?: (permissions: unknown, callback: (error?: string) => void) => void;
  getSamples?: (options: Record<string, unknown>, callback: (error: string | null, results?: unknown[]) => void) => void;
  getSleepSamples?: (
    options: Record<string, unknown>,
    callback: (error: string | null, results?: unknown[]) => void
  ) => void;
  getLatestWeight?: (
    options: Record<string, unknown>,
    callback: (error: string | null, result?: { value?: number }) => void
  ) => void;
  getLatestHeight?: (
    options: Record<string, unknown>,
    callback: (error: string | null, result?: { value?: number }) => void
  ) => void;
};

function callbackList(
  appleHealthKit: AppleHealthKitModule,
  method: "getSamples" | "getSleepSamples",
  options: Record<string, unknown>
) {
  return new Promise<unknown[]>((resolve, reject) => {
    appleHealthKit[method]?.(options, (error, results) => {
      if (error) {
        reject(new Error(error));
        return;
      }

      resolve(results ?? []);
    });
  });
}

function callbackLatest(
  appleHealthKit: AppleHealthKitModule,
  method: "getLatestWeight" | "getLatestHeight",
  options: Record<string, unknown>
) {
  return new Promise<number | null>((resolve, reject) => {
    appleHealthKit[method]?.(options, (error, result) => {
      if (error) {
        reject(new Error(error));
        return;
      }

      resolve(typeof result?.value === "number" ? result.value : null);
    });
  });
}

function minutesBetween(start?: unknown, end?: unknown) {
  if (typeof start !== "string" || typeof end !== "string") {
    return 0;
  }

  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60_000);
}

export async function readIosHealthSummary(range: HealthRange): Promise<HealthSummary> {
  const healthModule = (await import("react-native-health")) as {
    default?: AppleHealthKitModule;
  } & AppleHealthKitModule;
  const appleHealthKit = healthModule.default ?? healthModule;
  const permissions = appleHealthKit.Constants?.Permissions ?? {};

  if (!appleHealthKit.initHealthKit) {
    throw new Error("react-native-health is not configured.");
  }

  await new Promise<void>((resolve, reject) => {
    appleHealthKit.initHealthKit?.(
      {
        permissions: {
          read: [permissions.Workout, permissions.SleepAnalysis, permissions.Weight, permissions.Height].filter(Boolean),
          write: []
        }
      },
      (error) => {
        if (error) {
          reject(new Error(error));
          return;
        }

        resolve();
      }
    );
  });

  const options = {
    startDate: range.startDate,
    endDate: range.endDate
  };

  const [workoutRecords, sleepRecords, weightKg, heightCm] = await Promise.all([
    callbackList(appleHealthKit, "getSamples", { ...options, type: "Workout" }),
    callbackList(appleHealthKit, "getSleepSamples", options),
    callbackLatest(appleHealthKit, "getLatestWeight", { unit: "kg" }),
    callbackLatest(appleHealthKit, "getLatestHeight", { unit: "cm" })
  ]);

  const workouts = workoutRecords.map((item) => {
    const record = item as Record<string, unknown>;
    const start = typeof record.startDate === "string" ? record.startDate : range.startDate;
    const end = typeof record.endDate === "string" ? record.endDate : range.endDate;

    return {
      activityType: typeof record.activityName === "string" ? record.activityName : "Workout",
      start,
      end,
      durationMinutes: typeof record.duration === "number" ? record.duration / 60 : minutesBetween(start, end)
    };
  });

  const sleepMinutes = sleepRecords.reduce<number>((total, item) => {
    const record = item as Record<string, unknown>;
    return total + minutesBetween(record.startDate, record.endDate);
  }, 0);

  return {
    platform: "ios",
    workouts,
    workoutMinutes: workouts.reduce<number>((total, workout) => total + workout.durationMinutes, 0),
    sleepMinutes,
    sleepQuality: sleepMinutes > 0 ? Math.min(sleepMinutes / 480, 1) : null,
    weightKg,
    heightCm,
    syncedAt: new Date().toISOString()
  };
}
