import { create } from "zustand";

import { readHealthSummary, type HealthSummary } from "@/services/health";
import { upsertDailyLogFromHealth } from "@/services/logs";

type HealthState = {
  summary: HealthSummary | null;
  isSyncing: boolean;
  error: string | null;
  syncHealth: () => Promise<void>;
};

export const useHealthStore = create<HealthState>((set) => ({
  summary: null,
  isSyncing: false,
  error: null,
  syncHealth: async () => {
    set({ isSyncing: true, error: null });
    try {
      const summary = await readHealthSummary();
      await upsertDailyLogFromHealth(summary);
      set({ summary, isSyncing: false });
    } catch (error) {
      set({
        isSyncing: false,
        error: error instanceof Error ? error.message : "Unable to sync health data."
      });
      throw error;
    }
  }
}));

