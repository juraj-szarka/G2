import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Activity, Moon, RefreshCw, Target, Utensils } from "lucide-react-native";

import { MetricCard } from "@/components/MetricCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ProgressBar } from "@/components/ProgressBar";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/theme";
import { loadTodayDailyLog } from "@/services/logs";
import { useAuthStore } from "@/store/authStore";
import { useHealthStore } from "@/store/healthStore";
import type { DailyLog } from "@/types/database";
import { formatMinutes } from "@/utils/date";

export default function DashboardScreen() {
  const [log, setLog] = useState<DailyLog | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const syncHealth = useHealthStore((state) => state.syncHealth);
  const isSyncing = useHealthStore((state) => state.isSyncing);
  const healthError = useHealthStore((state) => state.error);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await loadTodayDailyLog();
      setLog(data);
      await refreshProfile();
    } finally {
      setRefreshing(false);
    }
  }, [refreshProfile]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function sync() {
    await syncHealth();
    await load();
  }

  const workoutMinutes = log?.workout_minutes ?? 0;
  const workoutTarget = log?.workout_target_minutes ?? profile?.target_workout_minutes ?? 45;
  const sleepMinutes = log?.sleep_minutes ?? 0;
  const sleepTarget = log?.sleep_target_minutes ?? profile?.target_sleep_minutes ?? 480;
  const calories = log?.calories ?? 0;
  const caloriesTarget = log?.target_calories ?? profile?.target_calories ?? 2200;

  return (
    <Screen
      action={
        <PrimaryButton
          icon={<RefreshCw color="white" size={17} />}
          label="Sync"
          loading={isSyncing}
          onPress={sync}
        />
      }
      eyebrow="Daily operating system"
      onRefresh={load}
      refreshing={refreshing}
      title="Today"
    >
      <View className="gap-4">
        <View className="flex-row gap-3">
          <MetricCard
            accent
            detail="40 training / 40 sleep / 20 macros"
            icon={<Target color={colors.success} size={20} />}
            label="Health score"
            value={log?.health_score ?? profile?.current_health_score ?? 0}
          />
          <MetricCard
            accent
            detail="Workout target"
            icon={<Activity color={colors.success} size={20} />}
            label="Exercise"
            value={log?.exercise_score ?? profile?.current_exercise_score ?? 0}
          />
        </View>

        <View className="gap-5 rounded-md border border-line bg-white p-5">
          <ProgressBar label="Workout" target={workoutTarget} unit="m" value={workoutMinutes} />
          <ProgressBar label="Sleep" target={sleepTarget} unit="m" value={sleepMinutes} />
          <ProgressBar label="Calories" target={caloriesTarget} value={calories} />
        </View>

        <View className="flex-row gap-3">
          <MetricCard
            detail={formatMinutes(sleepTarget)}
            icon={<Moon color={colors.muted} size={20} />}
            label="Sleep"
            value={formatMinutes(sleepMinutes)}
          />
          <MetricCard
            detail={`${Math.round(log?.protein ?? 0)}g protein`}
            icon={<Utensils color={colors.muted} size={20} />}
            label="Macros"
            value={`${Math.round(calories)}`}
          />
        </View>

        {healthError ? <Text className="text-[13px] font-medium text-red-700">{healthError}</Text> : null}
      </View>
    </Screen>
  );
}

