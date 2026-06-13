import { useCallback, useMemo, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Activity, Dumbbell, Flame, Moon, RefreshCw, Target, TrendingUp, Utensils } from "lucide-react-native";

import { MetricCard } from "@/components/MetricCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ProgressBar } from "@/components/ProgressBar";
import { Screen } from "@/components/Screen";
import { useColors } from "@/hooks/useColors";
import { getWorkoutWeekComparison, listManualWorkouts, loadTodayDailyLog, loadTodaysWorkoutPoints } from "@/services/logs";
import { useAuthStore } from "@/store/authStore";
import { useHealthStore } from "@/store/healthStore";
import type { DailyLog } from "@/types/database";
import type { ManualWorkout } from "@/types/database";
import { formatMinutes } from "@/utils/date";

export default function DashboardScreen() {
  const c = useColors();
  const [log, setLog] = useState<DailyLog | null>(null);
  const [manualWorkouts, setManualWorkouts] = useState<ManualWorkout[]>([]);
  const [todaysPoints, setTodaysPoints] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [weekComp, setWeekComp] = useState<{ thisWeek: number; lastWeek: number } | null>(null);
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const syncHealth = useHealthStore((state) => state.syncHealth);
  const isSyncing = useHealthStore((state) => state.isSyncing);
  const healthError = useHealthStore((state) => state.error);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [data, mw, pts, wc] = await Promise.all([
        loadTodayDailyLog(),
        listManualWorkouts(),
        loadTodaysWorkoutPoints(),
        getWorkoutWeekComparison().catch(() => null),
      ]);
      setLog(data);
      setManualWorkouts(mw);
      setTodaysPoints(pts);
      setWeekComp(wc);
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

  const manualScore = log?.manual_workout_points ?? todaysPoints;
  const pointsGoal = profile?.workout_points_goal ?? 10;
  const streak = profile?.streak_days ?? 0;

  const trendPct = weekComp && weekComp.lastWeek > 0
    ? Math.round(((weekComp.thisWeek - weekComp.lastWeek) / weekComp.lastWeek) * 100)
    : null;

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
            icon={<Target color={c.success} size={20} />}
            label="Health score"
            value={log?.health_score ?? profile?.current_health_score ?? 0}
          />
          <MetricCard
            accent
            detail="Workout target"
            icon={<Activity color={c.success} size={20} />}
            label="Exercise"
            value={log?.exercise_score ?? profile?.current_exercise_score ?? 0}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.navigate("/workout")}
        >
          <View className="overflow-hidden rounded-md" style={{ backgroundColor: c.successSoft }}>
            <MetricCard
              detail={`Goal: ${pointsGoal} pts · Included in health score`}
              icon={<Dumbbell color={c.success} size={20} />}
              label="Workout points"
              value={`${manualScore} / ${pointsGoal}`}
            />
          </View>
        </TouchableOpacity>

        <View className="gap-5 rounded-md border p-5" style={{ borderColor: c.line, backgroundColor: c.surface }}>
          <ProgressBar label="Workout points" target={pointsGoal} value={manualScore} />
          <ProgressBar label="Sleep" target={sleepTarget} unit="m" value={sleepMinutes} />
          <ProgressBar label="Calories" target={caloriesTarget} value={calories} />
        </View>

        <View className="flex-row gap-3">
          <MetricCard
            detail={formatMinutes(sleepTarget)}
            icon={<Moon color={c.muted} size={20} />}
            label="Sleep"
            value={formatMinutes(sleepMinutes)}
          />
          <MetricCard
            detail={`${Math.round(log?.protein ?? 0)}g protein`}
            icon={<Utensils color={c.muted} size={20} />}
            label="Macros"
            value={`${Math.round(calories)}`}
          />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <MetricCard
              detail="Consecutive days"
              icon={<Flame color="#EA580C" size={20} />}
              label="Streak"
              value={`${streak} ${streak === 1 ? "day" : "days"}`}
            />
          </View>
          {trendPct !== null ? (
            <View className="flex-1">
              <MetricCard
                detail={trendPct >= 0 ? "vs last week" : "vs last week"}
                icon={<TrendingUp color={trendPct >= 0 ? c.success : "#DC2626"} size={20} />}
                label="Weekly trend"
                value={`${trendPct >= 0 ? "+" : ""}${trendPct}%`}
              />
            </View>
          ) : null}
        </View>

        {healthError ? <Text className="text-[13px] font-medium text-red-700">{healthError}</Text> : null}
      </View>
    </Screen>
  );
}
