import { useCallback, useMemo, useRef, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { router } from "expo-router";
import { ArrowLeft, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";

import { useColors } from "@/hooks/useColors";
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
const ITEM_WIDE = 32;
const ITEM_COMPACT = 8;
const GAP_WIDE = 6;
const GAP_COMPACT = 2;
const Y_LABEL_W = 28;
const PAD_TOP = 8;
const Y_TICK_COUNT = 4;

export default function WorkoutHistoryScreen() {
  const c = useColors();
  const profile = useAuthStore((state) => state.profile);
  const [history, setHistory] = useState<WorkoutDay[]>([]);
  const [days, setDays] = useState(30);
  const [offset, setOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [filterActivity, setFilterActivity] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    try {
      const totalDays = days + offset;
      setHistory(await getWorkoutHistory(totalDays));
      setSelectedDay(null);
    } catch {}
  }, [days, offset]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const goal = profile?.workout_points_goal ?? 10;

  const visibleHistory = useMemo(() => {
    if (history.length <= days) return history;
    return history.slice(0, days);
  }, [history, days]);

  const filteredHistory = useMemo(() => {
    if (!filterActivity) return visibleHistory;
    return visibleHistory.map((day) => ({
      ...day,
      activities: day.activities.filter((a) => a.name === filterActivity),
      totalScore: day.activities
        .filter((a) => a.name === filterActivity)
        .reduce((s, a) => s + a.score, 0),
    }));
  }, [visibleHistory, filterActivity]);

  const isCompact = days > 7;
  const ITEM_W = isCompact ? ITEM_COMPACT : ITEM_WIDE;
  const GAP = isCompact ? GAP_COMPACT : GAP_WIDE;

  const { chartWidth, maxScore, activityColors, yLabels, labelInterval } = useMemo(() => {
    const names = new Set<string>();
    let mx = 0;
    for (const day of filteredHistory) {
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
    const w = filteredHistory.length * (ITEM_W + GAP) + 20;
    const yLabels = Array.from({ length: Y_TICK_COUNT }, (_, i) =>
      Math.round((roundedMax * (i + 1)) / Y_TICK_COUNT)
    );
    const labelInterval = isCompact ? Math.ceil(days / 6) : 1;
    return { chartWidth: Math.max(w, 200), maxScore: Math.max(roundedMax, 1), activityColors: ac, yLabels, labelInterval };
  }, [filteredHistory, goal, days, isCompact, ITEM_W, GAP]);

  const barH = (s: number) => (s / maxScore) * (CHART_HEIGHT - PAD_TOP);

  const firstDate = filteredHistory.length > 0 ? filteredHistory[0].date : null;
  const lastDate = filteredHistory.length > 0 ? filteredHistory[filteredHistory.length - 1].date : null;

  function shiftWindow(dir: number) {
    const newOffset = Math.max(0, offset + dir * days);
    setOffset(newOffset);
  }

  return (
    <SafeAreaView className="flex-1" edges={["top"]} style={{ backgroundColor: c.paper }}>
      <View className="px-5 pb-4 pt-2">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            className="h-10 w-10 items-center justify-center rounded-md"
            style={{ backgroundColor: c.muted + "18" }}
            onPress={() => router.navigate("/workout")}
          >
            <ArrowLeft color={c.ink} size={20} />
          </TouchableOpacity>
          <Text className="text-[22px] font-semibold" style={{ color: c.ink }}>Workout history</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" ref={scrollRef}>
        <View className="mb-4 rounded-md border p-4" style={{ borderColor: c.line, backgroundColor: c.surface }}>
          <Text className="mb-3 text-[13px] font-semibold" style={{ color: c.muted }}>
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
                        fill={c.muted}
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
                      stroke={c.success}
                      strokeWidth={1.5}
                      strokeDasharray="5,3"
                    />
                    <SvgText
                      x={chartWidth + Y_LABEL_W - 4}
                      y={PAD_TOP + (CHART_HEIGHT - PAD_TOP) - (goal / maxScore) * (CHART_HEIGHT - PAD_TOP) - 4}
                      fontSize={9}
                      fill={c.success}
                      textAnchor="end"
                    >
                      Goal: {goal}
                    </SvgText>
                  </G>
                )}

                {filteredHistory.map((day, di) => {
                  const x = Y_LABEL_W + di * (ITEM_W + GAP);
                  let accum = 0;
                  const isSelected = day.date === selectedDay;
                  const showLabel = di % labelInterval === 0 || di === filteredHistory.length - 1;

                  const date = new Date(day.date + "T12:00:00");
                  const label = isCompact
                    ? date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : date.toLocaleDateString("en-US", { weekday: "short" });

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
                        <Rect x={x - 2} y={PAD_TOP} width={ITEM_W + 4} height={CHART_HEIGHT - PAD_TOP} fill="none" stroke={c.ink} strokeWidth={1.5} rx={4} />
                      ) : null}

                      {showLabel && (
                        <SvgText
                          x={x + ITEM_W / 2}
                          y={CHART_HEIGHT + 14}
                          fontSize={isCompact ? 7 : 10}
                          fill={isSelected ? c.ink : c.muted}
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

          {Object.keys(activityColors).length > 0 ? (
            <View className="mt-6 flex-row flex-wrap gap-x-3 gap-y-1">
              {Object.entries(activityColors).map(([name, color]) => {
                const isActive = !filterActivity || filterActivity === name;
                return (
                  <TouchableOpacity
                    key={name}
                    activeOpacity={0.7}
                    className={`flex-row items-center gap-1 rounded-md px-2 py-1 ${isActive ? "" : "opacity-40"}`}
                    onPress={() => setFilterActivity(filterActivity === name ? null : name)}
                  >
                    <View className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                    <Text className="text-[11px]" style={{ color: c.muted }}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
                  {filterActivity ? (
                <TouchableOpacity activeOpacity={0.7} onPress={() => setFilterActivity(null)}>
                  <Text className="text-[11px] font-medium" style={{ color: c.success }}>Clear filter</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>

        {filteredHistory.length > 0 ? (
          <View className="mb-4 flex-row gap-3">
            <View className="flex-1 rounded-md border p-3" style={{ borderColor: c.line, backgroundColor: c.surface }}>
              <Text className="text-[11px] font-medium" style={{ color: c.muted }}>{days}-day total</Text>
              <Text className="text-[20px] font-semibold" style={{ color: c.success }}>
                {filteredHistory.reduce((s, d) => s + d.totalScore, 0)} pts
              </Text>
            </View>
            <View className="flex-1 rounded-md border p-3" style={{ borderColor: c.line, backgroundColor: c.surface }}>
              <Text className="text-[11px] font-medium" style={{ color: c.muted }}>Daily avg</Text>
              <View className="flex-row items-center gap-1">
                <TrendingUp color={c.success} size={14} />
                <Text className="text-[20px] font-semibold" style={{ color: c.success }}>
                  {Math.round((filteredHistory.reduce((s, d) => s + d.totalScore, 0) / filteredHistory.length) * 10) / 10}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {selectedDay ? (() => {
          const day = filteredHistory.find((d) => d.date === selectedDay);
          if (!day) return null;
          return (
            <View className="mb-4 rounded-md border p-4" style={{ borderColor: c.line, backgroundColor: c.surface }}>
              <Text className="mb-2 text-[15px] font-semibold" style={{ color: c.ink }}>
                {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </Text>
              <View className="gap-3">
                {day.activities.map((a) => (
                  <View key={a.name} className="flex-row items-center justify-between border-b pb-2" style={{ borderColor: c.line }}>
                    <View className="flex-row items-center gap-2">
                      <View className="h-3 w-3 rounded-sm" style={{ backgroundColor: activityColors[a.name] ?? "#ccc" }} />
                      <Text className="text-[14px]" style={{ color: c.ink }}>{a.name}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-[14px] font-semibold" style={{ color: c.ink }}>
                        {a.count} {a.unit}
                      </Text>
                      <Text className="text-[12px]" style={{ color: c.success }}>{a.score} pts</Text>
                    </View>
                  </View>
                ))}
              </View>
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold" style={{ color: c.muted }}>Total</Text>
                <Text className="text-[18px] font-semibold" style={{ color: c.success }}>{day.totalScore} pts</Text>
              </View>
            </View>
          );
        })() : null}

        <View className="mb-8 flex-row items-center justify-center gap-4">
          <TouchableOpacity
            activeOpacity={0.7}
            className="h-10 w-10 items-center justify-center rounded-md"
            style={{ backgroundColor: c.muted + "18" }}
            onPress={() => shiftWindow(-1)}
          >
            <ChevronLeft color={c.ink} size={20} />
          </TouchableOpacity>

          <View className="flex-row gap-2">
            <TouchableOpacity
              activeOpacity={0.7}
              className="rounded-md px-4 py-2"
              style={{ backgroundColor: days === 7 ? c.success : c.muted + "18" }}
              onPress={() => { setDays(7); setOffset(0); }}
            >
              <Text className="text-[13px] font-semibold" style={{ color: days === 7 ? "#FFFFFF" : c.muted }}>
                7 days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              className="rounded-md px-4 py-2"
              style={{ backgroundColor: days === 30 ? c.success : c.muted + "18" }}
              onPress={() => { setDays(30); setOffset(0); }}
            >
              <Text className="text-[13px] font-semibold" style={{ color: days === 30 ? "#FFFFFF" : c.muted }}>
                30 days
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.7}
            className="h-10 w-10 items-center justify-center rounded-md"
            style={{ backgroundColor: c.muted + "18" }}
            onPress={() => shiftWindow(1)}
          >
            <ChevronRight color={c.ink} size={20} />
          </TouchableOpacity>
        </View>

        {firstDate && lastDate ? (
          <Text className="mb-8 text-center text-[12px]" style={{ color: c.muted }}>
            {new Date(firstDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            {" — "}
            {new Date(lastDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: lastDate?.slice(0, 4) !== firstDate?.slice(0, 4) ? "numeric" : undefined })}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
