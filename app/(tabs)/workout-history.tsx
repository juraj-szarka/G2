import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";

import { colors } from "@/constants/theme";
import { getWorkoutHistory } from "@/services/logs";
import { useAuthStore } from "@/store/authStore";
import type { WorkoutDay } from "@/services/logs";
import { SafeAreaView } from "react-native-safe-area-context";

const palette = [
  "#059669", "#D97706", "#7C3AED", "#DC2626",
  "#0891B2", "#DB2777", "#65A30D", "#E11D48",
  "#0284C7", "#4F46E5", "#0D9488", "#9333EA",
];

const CHART_HEIGHT = 200;
const ITEM_W = 32;
const GAP = 6;
const Y_LABEL_W = 32;
const PAD_TOP = 8;
const Y_TICK_COUNT = 4;

export default function WorkoutHistoryScreen() {
  const profile = useAuthStore((state) => state.profile);
  const [history, setHistory] = useState<WorkoutDay[]>([]);
  const [days, setDays] = useState(7);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setHistory(await getWorkoutHistory(days));
    } catch {}
  }, [days]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const goal = profile?.workout_points_goal ?? 10;

  const { chartWidth, maxScore, activityColors, yLabels, labelInterval } = useMemo(() => {
    const names = new Set<string>();
    let mx = 0;
    for (const day of history) {
      let total = 0;
      for (const a of day.activities) {
        names.add(a.name);
        total += a.score;
      }
      if (total > mx) mx = total;
    }
    const roundedMax = Math.max(Math.ceil(mx / 5) * 5, Math.ceil(goal / 5) * 5);
    const ac: Record<string, string> = {};
    let ci = 0;
    for (const n of names) {
      ac[n] = palette[ci % palette.length];
      ci++;
    }
    const w = history.length * (ITEM_W + GAP) + 20;
    const yLabels = Array.from({ length: Y_TICK_COUNT }, (_, i) =>
      Math.round((roundedMax * (i + 1)) / Y_TICK_COUNT)
    );
    const labelInterval = days <= 7 ? 1 : Math.ceil(days / 7);
    return { chartWidth: Math.max(w, 200), maxScore: Math.max(roundedMax, 1), activityColors: ac, yLabels, labelInterval };
  }, [history, goal, days]);

  const barH = (s: number) => (s / maxScore) * (CHART_HEIGHT - PAD_TOP);

  const selectedData = selectedDay
    ? history.find((d) => d.date === selectedDay)
    : null;

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
      <View className="px-5 pb-4 pt-2">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            className="h-10 w-10 items-center justify-center rounded-md bg-[#EEF3EF]"
            onPress={() => router.back()}
          >
            <ArrowLeft color={colors.ink} size={20} />
          </TouchableOpacity>
          <Text className="text-[22px] font-semibold text-ink">Workout history</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5">
        <View className="mb-4 rounded-md border border-line bg-white p-4">
          <Text className="mb-3 text-[13px] font-semibold text-muted">
            Points per day (tap a bar for details)
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Svg height={CHART_HEIGHT + 40} width={chartWidth + Y_LABEL_W}>
              <G>
                {yLabels.map((v) => {
                  const y = PAD_TOP + (CHART_HEIGHT - PAD_TOP) - (v / maxScore) * (CHART_HEIGHT - PAD_TOP);
                  return (
                    <G key={v}>
                      <SvgText
                        x={Y_LABEL_W - 6}
                        y={y + 4}
                        fontSize={10}
                        fill={colors.muted}
                        textAnchor="end"
                      >
                        {v}
                      </SvgText>
                      <Line
                        x1={Y_LABEL_W}
                        y1={y}
                        x2={chartWidth + Y_LABEL_W}
                        y2={y}
                        stroke="#E5E7EB"
                        strokeWidth={1}
                      />
                    </G>
                  );
                })}

                <Line
                  x1={Y_LABEL_W}
                  y1={PAD_TOP}
                  x2={Y_LABEL_W}
                  y2={CHART_HEIGHT}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                />
                <Line
                  x1={Y_LABEL_W}
                  y1={CHART_HEIGHT}
                  x2={chartWidth + Y_LABEL_W}
                  y2={CHART_HEIGHT}
                  stroke="#E5E7EB"
                  strokeWidth={1}
                />

                {goal > 0 && (
                  <G>
                    <Line
                      x1={Y_LABEL_W}
                      y1={PAD_TOP + (CHART_HEIGHT - PAD_TOP) - (goal / maxScore) * (CHART_HEIGHT - PAD_TOP)}
                      x2={chartWidth + Y_LABEL_W}
                      y2={PAD_TOP + (CHART_HEIGHT - PAD_TOP) - (goal / maxScore) * (CHART_HEIGHT - PAD_TOP)}
                      stroke={colors.success}
                      strokeWidth={1.5}
                      strokeDasharray="5,3"
                    />
                    <SvgText
                      x={chartWidth + Y_LABEL_W - 4}
                      y={PAD_TOP + (CHART_HEIGHT - PAD_TOP) - (goal / maxScore) * (CHART_HEIGHT - PAD_TOP) - 4}
                      fontSize={9}
                      fill={colors.success}
                      textAnchor="end"
                    >
                      Goal: {goal}
                    </SvgText>
                  </G>
                )}

                {history.map((day, di) => {
                  const x = Y_LABEL_W + di * (ITEM_W + GAP);
                  let accum = 0;
                  const isSelected = day.date === selectedDay;
                  const showLabel = di % labelInterval === 0 || di === history.length - 1;

                  const date = new Date(day.date + "T12:00:00");
                  const label = days <= 7
                    ? date.toLocaleDateString("en-US", { weekday: "short" })
                    : date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                  return (
                    <G key={day.date}>
                      {day.activities.map((a) => {
                        const h = barH(a.score);
                        const y = CHART_HEIGHT - accum - h;
                        accum += h;
                        return (
                          <Rect
                            key={a.name}
                            x={x}
                            y={y}
                            width={ITEM_W}
                            height={Math.max(h, a.score > 0 ? 2 : 0)}
                            fill={activityColors[a.name] ?? "#ccc"}
                            rx={3}
                            opacity={!selectedDay || isSelected ? 1 : 0.4}
                          />
                        );
                      })}

                      {isSelected ? (
                        <Rect x={x - 2} y={PAD_TOP} width={ITEM_W + 4} height={CHART_HEIGHT - PAD_TOP} fill="none" stroke={colors.ink} strokeWidth={1.5} rx={4} />
                      ) : null}

                      {showLabel && (
                        <SvgText
                          x={x + ITEM_W / 2}
                          y={CHART_HEIGHT + 14}
                          fontSize={10}
                          fill={isSelected ? colors.ink : colors.muted}
                          textAnchor="middle"
                          fontWeight={isSelected ? "bold" : "normal"}
                        >
                          {label}
                        </SvgText>
                      )}

                      <Rect
                        x={x}
                        y={PAD_TOP}
                        width={ITEM_W}
                        height={CHART_HEIGHT - PAD_TOP}
                        fill="transparent"
                        onPress={() => setSelectedDay(selectedDay === day.date ? null : day.date)}
                      />
                    </G>
                  );
                })}
              </G>
            </Svg>
          </ScrollView>

          {activityColors && Object.keys(activityColors).length > 1 ? (
            <View className="mt-6 flex-row flex-wrap gap-x-3 gap-y-1">
              {Object.entries(activityColors).map(([name, color]) => (
                <View key={name} className="flex-row items-center gap-1">
                  <View className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                  <Text className="text-[11px] text-muted">{name}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>

        {selectedData ? (
          <View className="mb-4 rounded-md border border-line bg-white p-4">
            <Text className="mb-2 text-[15px] font-semibold text-ink">
              {new Date(selectedData.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </Text>
            <View className="gap-3">
              {selectedData.activities.map((a) => (
                <View key={a.name} className="flex-row items-center justify-between border-b border-line pb-2">
                  <View className="flex-row items-center gap-2">
                    <View className="h-3 w-3 rounded-sm" style={{ backgroundColor: activityColors[a.name] ?? "#ccc" }} />
                    <Text className="text-[14px] text-ink">{a.name}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[14px] font-semibold text-ink">
                      {a.count} {a.unit}
                    </Text>
                    <Text className="text-[12px] text-emerald-600">{a.score} pts</Text>
                  </View>
                </View>
              ))}
            </View>
            <View className="mt-2 flex-row items-center justify-between">
              <Text className="text-[13px] font-semibold text-muted">Total</Text>
              <Text className="text-[18px] font-semibold text-emerald-700">{selectedData.totalScore} pts</Text>
            </View>
          </View>
        ) : null}

        <View className="mb-8 flex-row items-center justify-center gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            className={`rounded-md px-5 py-2.5 ${days === 7 ? "bg-emerald-600" : "bg-[#EEF3EF]"}`}
            onPress={() => { setDays(7); setSelectedDay(null); }}
          >
            <Text className={`text-[13px] font-semibold ${days === 7 ? "text-white" : "text-muted"}`}>
              Past 7 days
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            className={`rounded-md px-5 py-2.5 ${days === 30 ? "bg-emerald-600" : "bg-[#EEF3EF]"}`}
            onPress={() => { setDays(30); setSelectedDay(null); }}
          >
            <Text className={`text-[13px] font-semibold ${days === 30 ? "text-white" : "text-muted"}`}>
              Past month
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
