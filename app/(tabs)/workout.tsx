import { useCallback, useRef, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { ArrowLeft, ChevronRight, Minus, Plus } from "lucide-react-native";

import { MetricCard } from "@/components/MetricCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ProgressBar } from "@/components/ProgressBar";
import { Screen } from "@/components/Screen";
import { WorkoutChart } from "@/components/WorkoutChart";
import { colors } from "@/constants/theme";
import {
  createManualWorkout,
  getWorkoutHistory,
  listManualWorkouts,
  updateManualWorkoutCount,
} from "@/services/logs";
import type { ManualWorkout } from "@/types/database";
import type { WorkoutDay } from "@/services/logs";

const SCORE_PRESETS: Record<string, number> = {
  "Push-ups": 0.1,
  "Pull-ups": 0.5,
  "Squats": 0.15,
  "Sit-ups": 0.1,
  "Run": 5,
  "Running": 5,
  "Walk": 2,
  "Walking": 2,
  "Swim": 3,
  "Swimming": 3,
  "Cycle": 2,
  "Cycling": 2,
};

function guessScorePerUnit(name: string) {
  return SCORE_PRESETS[name] ?? 0.2;
}

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState<ManualWorkout[]>([]);
  const [selected, setSelected] = useState<ManualWorkout | null>(null);
  const [history, setHistory] = useState<WorkoutDay[]>([]);
  const [historyDays, setHistoryDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [newName, setNewName] = useState("");
  const [newScore, setNewScore] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [wData, hData] = await Promise.all([
        listManualWorkouts(),
        getWorkoutHistory(historyDays),
      ]);
      setWorkouts(wData);
      setHistory(hData);
    } catch (caught) {
      setError(String((caught as { message?: string })?.message ?? "Unable to load workout."));
    } finally {
      setLoading(false);
    }
  }, [historyDays]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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

  async function addActivity() {
    const name = newName.trim();
    if (!name) return;
    const scorePerUnit = parseFloat(newScore) || guessScorePerUnit(name);
    try {
      const created = await createManualWorkout(name, 200, 10, scorePerUnit);
      setWorkouts((prev) => [...prev, created]);
      setNewName("");
      setNewScore("");
      setShowAddForm(false);
      setSelected(created);
    } catch (caught) {
      setError(String((caught as { message?: string })?.message ?? "Unable to create activity."));
    }
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
            <View>
              <Text className="text-[15px] font-semibold text-muted">Back to list</Text>
              <Text className="text-[12px] text-muted">
                {selected.score_per_unit} pts / {selected.unit.slice(0, -1) || "unit"}
              </Text>
            </View>
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
                <PrimaryButton label="+1" onPress={() => increment(1)} variant="outline" />
              </View>
              <View className="flex-1">
                <PrimaryButton label="+5" onPress={() => increment(5)} />
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

        {historyDays <= 7 ? (
          <PrimaryButton
            icon={<ChevronRight color="white" size={16} />}
            label="Show more history"
            onPress={() => setHistoryDays(30)}
            variant="outline"
          />
        ) : null}

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

        {showAddForm ? (
          <View className="gap-3 rounded-md border border-line bg-white p-5">
            <TextInput
              className="h-12 rounded-md border border-line bg-white px-4 text-[16px] text-ink"
              onChangeText={setNewName}
              placeholder="Activity name (e.g. Push-ups)"
              placeholderTextColor="#8B948F"
              value={newName}
            />
            <TextInput
              className="h-12 rounded-md border border-line bg-white px-4 text-[16px] text-ink"
              keyboardType="decimal-pad"
              onChangeText={setNewScore}
              placeholder={`Score per unit (default: ${guessScorePerUnit(newName || "Push-ups")})`}
              placeholderTextColor="#8B948F"
              value={newScore}
            />
            <PrimaryButton
              icon={<Plus color="white" size={18} />}
              label="Add activity"
              onPress={addActivity}
              disabled={!newName.trim()}
            />
            <PrimaryButton label="Cancel" onPress={() => setShowAddForm(false)} variant="quiet" />
          </View>
        ) : (
          <PrimaryButton
            icon={<Plus color="white" size={18} />}
            label="Add activity"
            onPress={() => setShowAddForm(true)}
          />
        )}

        {workouts.length === 0 && !loading ? (
          <Text className="text-center text-[14px] text-muted">
            No activities yet. Add one to start tracking.
          </Text>
        ) : null}

        {error ? <Text className="text-[13px] font-medium text-red-700">{error}</Text> : null}
      </View>
    </Screen>
  );
}
