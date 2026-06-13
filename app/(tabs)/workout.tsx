import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, ChevronRight, Copy, Dumbbell, Minus, Plus, Trash2 } from "lucide-react-native";
import Svg, { G, Rect, Text as SvgText } from "react-native-svg";

import { MetricCard } from "@/components/MetricCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ProgressBar } from "@/components/ProgressBar";
import { Screen } from "@/components/Screen";
import { WorkoutChart } from "@/components/WorkoutChart";
import { resolveIcon } from "@/data/activities";
import { colors } from "@/constants/theme";
import {
  cacheManualWorkouts,
  createManualWorkout,
  deleteManualWorkout,
  getActivityHistory,
  getYesterdayWorkouts,
  getWorkoutHistory,
  listManualWorkouts,
  syncManualWorkoutPoints,
  updateManualWorkoutCount,
} from "@/services/logs";
import { useTabBarStore } from "@/store/tabBarStore";
import { supabase } from "@/lib/supabase";
import { todayISO } from "@/utils/date";
import type { ManualWorkout } from "@/types/database";
import type { WorkoutDay } from "@/services/logs";

export default function WorkoutScreen() {
  const [workouts, setWorkouts] = useState<ManualWorkout[]>([]);
  const [selected, setSelected] = useState<ManualWorkout | null>(null);
  const setTabAccent = useTabBarStore((s) => s.setAccentColor);
  const [history, setHistory] = useState<WorkoutDay[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [copying, setCopying] = useState(false);
  const [activityHistory, setActivityHistory] = useState<{ count: number; score: number; unit: string }[]>([]);
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
      cacheManualWorkouts(wData);
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

  useEffect(() => {
    if (selected) {
      setTabAccent(selected.color || colors.success);
      getActivityHistory(selected.name, 30).then(setActivityHistory).catch(() => {});
    } else {
      setTabAccent("");
      setActivityHistory([]);
    }
    return () => setTabAccent("");
  }, [selected?.id]);

  const totalScore = workouts.reduce((sum, w) => {
    return sum + Math.round(w.current_count * w.score_per_unit * 10) / 10;
  }, 0);

  if (selected) {
    const pct = selected.target_count > 0
      ? Math.round(Math.min(selected.current_count / selected.target_count, 1) * 100)
      : 0;
    const activityScore = Math.round(selected.current_count * selected.score_per_unit * 10) / 10;
    const IconComp = resolveIcon(selected.icon_name);
    const activityColor = selected.color || colors.success;
    const step = selected.increment_step;
    const quickBtns = [step, step * 5, step * 10].filter((v) => v > 0);

    const maxHistScore = Math.max(...activityHistory.map((h) => h.score), 1);
    const histBarH = (s: number) => (s / maxHistScore) * 60;
    const histItemW = 8;
    const histGap = 4;

    return (
      <Screen accentColor={activityColor} bgColor={activityColor + "06"} eyebrow={selected.name} onRefresh={load} refreshing={loading} title={selected.name}>
        <View className="gap-4">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              activeOpacity={0.7}
              className="h-10 w-10 items-center justify-center rounded-md bg-[#EEF3EF]"
              onPress={() => { setTabAccent(""); setSelected(null); }}
            >
              <ArrowLeft color={colors.ink} size={20} />
            </TouchableOpacity>
            <View className="h-10 w-10 items-center justify-center rounded-md" style={{ backgroundColor: activityColor + "20" }}>
              <IconComp color={activityColor} size={20} />
            </View>
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
            accentColor={activityColor}
          />

          <View className="gap-4 rounded-md border border-line bg-white p-5">
            <ProgressBar
              barColor={activityColor}
              label="Progress"
              target={selected.target_count}
              unit={` ${selected.unit}`}
              value={selected.current_count}
            />

            <View className="flex-row gap-2">
              {quickBtns.map((amt) => (
                <View key={amt} className="flex-1">
                  <PrimaryButton
                    label={`+${amt}`}
                    onPress={() => increment(amt)}
                    color={activityColor}
                  />
                </View>
              ))}
            </View>

            <View className="flex-row gap-3">
              <TextInput
                ref={inputRef}
                className="h-12 flex-1 rounded-md border border-line bg-white px-4 text-[16px] text-ink"
                keyboardType="number-pad"
                onChangeText={setCustomAmount}
                onSubmitEditing={addCustom}
                placeholder="Custom amount"
                placeholderTextColor="#8B948F"
                returnKeyType="done"
                value={customAmount}
              />
              <View className="w-20">
                <PrimaryButton label="Add" onPress={addCustom} disabled={!customAmount.trim()} color={activityColor} />
              </View>
            </View>

            <PrimaryButton
              icon={<Minus color={activityColor} size={18} />}
              label="Undo"
              onPress={() => increment(-step)}
              variant="quiet"
            />
          </View>

          {activityHistory.length > 0 ? (
            <View className="rounded-md border border-line bg-white p-4">
              <Text className="mb-2 text-[13px] font-semibold text-muted">Last 30 days ({selected.unit})</Text>
              <Svg height={80} width={activityHistory.length * (histItemW + histGap) + 20}>
                <G>
                  {activityHistory.map((h, i) => {
                    const x = 10 + i * (histItemW + histGap);
                    const bh = histBarH(h.score);
                    return (
                      <Rect
                        key={i}
                        x={x}
                        y={60 - bh}
                        width={histItemW}
                        height={Math.max(bh, h.score > 0 ? 1 : 0)}
                        fill={activityColor}
                        rx={2}
                        opacity={h.score > 0 ? 0.8 : 0.1}
                      />
                    );
                  })}
                </G>
              </Svg>
            </View>
          ) : null}

          {error ? <Text className="text-[13px] font-medium text-red-700">{error}</Text> : null}
        </View>
      </Screen>
    );
  }

  return (
    <Screen eyebrow="Manual tracker" onRefresh={load} refreshing={loading} title="Workout">
      <View className="gap-4">
        <View className="rounded-md border border-line p-4" style={{ backgroundColor: colors.successSoft }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-[13px] text-muted">Today's total</Text>
            <Text className="text-[22px] font-semibold" style={{ color: colors.success }}>{totalScore} pts</Text>
          </View>
        </View>

        <WorkoutChart data={history} />

        <PrimaryButton
          icon={<ChevronRight color="white" size={16} />}
          label="Show more history"
          onPress={() => router.navigate("/workout-history")}
          variant="outline"
        />

        {workouts.length > 0 ? (
          <PrimaryButton
            icon={<Copy color="#111812" size={16} />}
            label="Copy yesterday's activities"
            loading={copying}
            onPress={async () => {
              setCopying(true);
              try {
                const yesterday = await getYesterdayWorkouts();
                const existingNames = new Set(workouts.map((w) => w.name));
                for (const yw of yesterday) {
                  if (existingNames.has(yw.name)) continue;
                  await supabase.from("manual_workouts").insert({
                    user_id: yw.user_id,
                    log_date: todayISO(),
                    name: yw.name,
                    unit: yw.unit,
                    target_count: yw.target_count,
                    increment_step: yw.increment_step,
                    score_per_unit: yw.score_per_unit,
                    current_count: yw.current_count,
                    icon_name: yw.icon_name,
                    color: yw.color,
                  });
                }
                await load();
              } catch (caught) {
                setError(String((caught as { message?: string })?.message ?? "Unable to copy."));
              } finally {
                setCopying(false);
              }
            }}
            variant="quiet"
          />
        ) : null}

        {workouts.map((w) => {
          const wpct = w.target_count > 0
            ? Math.round(Math.min(w.current_count / w.target_count, 1) * 100)
            : 0;
          const wScore = Math.round(w.current_count * w.score_per_unit * 10) / 10;
          const IconComp = resolveIcon(w.icon_name);
          const activityColor = w.color;

          return (
            <TouchableOpacity
              key={w.id}
              activeOpacity={0.7}
              className="rounded-md border border-line bg-white p-4"
              onPress={() => setSelected(w)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2 flex-1">
                  <View className="h-8 w-8 items-center justify-center rounded-md" style={{ backgroundColor: activityColor + "20" }}>
                    <IconComp color={activityColor} size={16} />
                  </View>
                  <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>{w.name}</Text>
                </View>
                <View className="flex-row items-baseline gap-1">
                  <Text className="text-[22px] font-semibold" style={{ color: activityColor }}>{w.current_count}</Text>
                  <Text className="text-[13px] text-muted">
                    / {w.target_count} {w.unit}
                  </Text>
                </View>
              </View>
              <ProgressBar barColor={activityColor} label="Progress" target={w.target_count} unit={` ${w.unit}`} value={w.current_count} />
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-[12px] font-medium" style={{ color: activityColor }}>{wScore} pts</Text>
                {wpct === 100 ? (
                  <Text className="text-[12px] font-semibold" style={{ color: activityColor }}>Complete!</Text>
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
          <View className="items-center gap-4 py-8">
            <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: colors.successSoft }}>
              <Dumbbell color={colors.success} size={28} />
            </View>
            <Text className="text-center text-[15px] font-semibold text-ink">No activities today</Text>
            <Text className="text-center text-[13px] leading-5 text-muted">
              Tap "Add activity" to start tracking push-ups,{'\n'}running, jump rope, or any exercise.
            </Text>
          </View>
        ) : null}

        {error ? <Text className="text-[13px] font-medium text-red-700">{error}</Text> : null}
      </View>
    </Screen>
  );
}
