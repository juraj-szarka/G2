import { useCallback, useRef, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, ChevronRight, Minus, Plus, Trash2 } from "lucide-react-native";

import { MetricCard } from "@/components/MetricCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ProgressBar } from "@/components/ProgressBar";
import { Screen } from "@/components/Screen";
import { WorkoutChart } from "@/components/WorkoutChart";
import { colors } from "@/constants/theme";
import {
  createManualWorkout,
  deleteManualWorkout,
  listManualWorkouts,
  syncManualWorkoutPoints,
  updateManualWorkoutCount,
} from "@/services/logs";
import { getWorkoutHistory } from "@/services/logs";
import type { ManualWorkout } from "@/types/database";
import type { WorkoutDay } from "@/services/logs";

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState<ManualWorkout[]>([]);
  const [selected, setSelected] = useState<ManualWorkout | null>(null);
  const [history, setHistory] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const inputRef = useRef<TextInput>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wData, hData] = await Promise.all([
        listManualWorkouts(),
        getWorkoutHistory(7),
      ]);
      setWorkouts(wData);
      setHistory(hData);
    } catch (caught) {
      setError(String((caught as { message?: string })?.message ?? "Unable to load workout."));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function doSync() {
    try {
      await syncManualWorkoutPoints();
    } catch {}
  }

  async function increment(delta: number) {
    if (!selected) return;
    const previous = selected;
    const next = { ...selected, current_count: Math.max(0, selected.current_count + delta) };
    setSelected(next);
    setWorkouts((prev) => prev.map((w) => (w.id === next.id ? next : w)));
    try {
      const updated = await updateManualWorkoutCount(selected, delta);
      setSelected(updated);
      setWorkouts((prev) => prev.map((w) => (w.id === updated.id ? updated : w)));
      await doSync();
    } catch (caught) {
      setSelected(previous);
      setWorkouts((prev) => prev.map((w) => (w.id === previous.id ? previous : w)));
      setError(String((caught as { message?: string })?.message ?? "Unable to update."));
    }
  }

  function addCustom() {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    setCustomAmount("");
    increment(amount);
  }

  async function removeSelected() {
    if (!selected) return;
    Alert.alert("Delete activity", `Remove "${selected.name}" for today?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteManualWorkout(selected.id);
            setWorkouts((prev) => prev.filter((w) => w.id !== selected.id));
            setSelected(null);
            await doSync();
          } catch (caught) {
            setError(String((caught as { message?: string })?.message ?? "Unable to delete."));
          }
        },
      },
    ]);
  }

  const totalScore = workouts.reduce((sum, w) => {
    return sum + Math.round(w.current_count * w.score_per_unit * 10) / 10;
  }, 0);

  if (selected) {
    const pct = selected.target_count > 0
      ? Math.round(Math.min(selected.current_count / selected.target_count, 1) * 100)
      : 0;
    const activityScore = Math.round(selected.current_count * selected.score_per_unit * 10) / 10;

    return (
      <Screen eyebrow={selected.name} onRefresh={load} refreshing={loading} title={selected.name}>
        <View className="gap-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              activeOpacity={0.7}
              className="h-10 w-10 items-center justify-center rounded-md bg-[#EEF3EF]"
              onPress={() => setSelected(null)}
            >
              <ArrowLeft color={colors.ink} size={20} />
            </TouchableOpacity>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-muted">Back to list</Text>
              <Text className="text-[12px] text-muted">
                {selected.score_per_unit} pts / {selected.unit}
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              className="h-10 w-10 items-center justify-center rounded-md bg-red-50"
              onPress={removeSelected}
            >
              <Trash2 color="#DC2626" size={18} />
            </TouchableOpacity>
          </View>

          <MetricCard
            accent
            detail={`${activityScore} pts · ${pct}% of ${selected.target_count}`}
            label={selected.name}
            value={selected.current_count}
          />

          <View className="gap-5 rounded-md border border-line bg-white p-5">
            <ProgressBar label="Progress" target={selected.target_count} unit={` ${selected.unit}`} value={selected.current_count} />

            <View className="flex-row gap-3">
              <View className="flex-1">
                <PrimaryButton label={`+${selected.increment_step}`} onPress={() => increment(selected.increment_step)} variant="outline" />
              </View>
              <View className="flex-1">
                <PrimaryButton label={`+${selected.increment_step * 5}`} onPress={() => increment(selected.increment_step * 5)} />
              </View>
            </View>

            <View className="flex-row gap-3">
              <TextInput
                ref={inputRef}
                className="h-12 flex-1 rounded-md border border-line bg-white px-4 text-[16px] text-ink"
                keyboardType="number-pad"
                onChangeText={setCustomAmount}
                placeholder="Custom amount"
                placeholderTextColor="#8B948F"
                value={customAmount}
              />
              <View className="w-20">
                <PrimaryButton label="Add" onPress={addCustom} disabled={!customAmount.trim()} />
              </View>
            </View>

            <PrimaryButton
              icon={<Minus color="#111812" size={18} />}
              label="Undo"
              onPress={() => increment(-selected.increment_step)}
              variant="quiet"
            />
          </View>

          {error ? <Text className="text-[13px] font-medium text-red-700">{error}</Text> : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen eyebrow="Manual tracker" onRefresh={load} refreshing={loading} title="Workout">
      <View className="gap-4">
        <View className="rounded-md border border-line bg-white p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Today's total</Text>
            <Text className="text-[22px] font-semibold text-emerald-700">{totalScore} pts</Text>
          </View>
        </View>

        <WorkoutChart data={history} />

        <PrimaryButton
          icon={<ChevronRight color="white" size={16} />}
          label="Show more history"
          onPress={() => router.navigate("/workout-history")}
          variant="outline"
        />

        {workouts.map((w) => {
          const wpct = w.target_count > 0
            ? Math.round(Math.min(w.current_count / w.target_count, 1) * 100)
            : 0;
          const wScore = Math.round(w.current_count * w.score_per_unit * 10) / 10;

          return (
            <TouchableOpacity
              key={w.id}
              activeOpacity={0.7}
              className="rounded-md border border-line bg-white p-4"
              onPress={() => setSelected(w)}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[15px] font-semibold text-ink">{w.name}</Text>
                <View className="flex-row items-baseline gap-1">
                  <Text className="text-[22px] font-semibold text-emerald-700">{w.current_count}</Text>
                  <Text className="text-[13px] text-muted">
                    / {w.target_count} {w.unit}
                  </Text>
                </View>
              </View>
              <ProgressBar label="Progress" target={w.target_count} unit={` ${w.unit}`} value={w.current_count} />
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-[12px] font-medium text-emerald-600">{wScore} pts</Text>
                {wpct === 100 ? (
                  <Text className="text-[12px] font-semibold text-emerald-600">Complete!</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}

        <PrimaryButton
          icon={<Plus color="white" size={18} />}
          label="Add activity"
          onPress={() => router.navigate("/add-activity")}
        />

        {workouts.length === 0 && !loading ? (
          <Text className="text-center text-[14px] text-muted">
            No activities yet. Tap "Add activity" to start tracking.
          </Text>
        ) : null}

        {error ? <Text className="text-[13px] font-medium text-red-700">{error}</Text> : null}
      </View>
    </Screen>
  );
}
