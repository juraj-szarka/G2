import { Platform } from "react-native";

import { dateDaysAgo } from "@/utils/date";
import { readAndroidHealthSummary } from "./android";
import { readIosHealthSummary } from "./ios";
import { readMockHealthSummary } from "./mock";
import type { HealthRange } from "./types";

export async function readHealthSummary(range?: Partial<HealthRange>) {
  const resolvedRange: HealthRange = {
    startDate: range?.startDate ?? `${dateDaysAgo(1)}T00:00:00.000Z`,
    endDate: range?.endDate ?? new Date().toISOString()
  };

  if (Platform.OS === "android") {
    return readAndroidHealthSummary(resolvedRange);
  }

  if (Platform.OS === "ios") {
    return readIosHealthSummary(resolvedRange);
  }

  return readMockHealthSummary(resolvedRange);
}

export type { HealthSummary } from "./types";

