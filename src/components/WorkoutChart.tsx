import { useMemo } from "react";
import { Text, View } from "react-native";
import Svg, { G, Rect, Text as SvgText } from "react-native-svg";

import type { WorkoutDay } from "@/services/logs";
import { colors } from "@/constants/theme";

const CHART_HEIGHT = 140;
const BAR_WIDTH = 12;
const BAR_GAP = 16;
const LABEL_HEIGHT = 28;
const PADDING_LEFT = 28;
const PADDING_RIGHT = 12;

const palette = [
  "#059669", "#D97706", "#7C3AED", "#DC2626",
  "#0891B2", "#DB2777", "#65A30D", "#E11D48",
];

type Props = {
  data: WorkoutDay[];
};

export function WorkoutChart({ data }: Props) {
  const { activityColors, maxScore, chartWidth } = useMemo(() => {
    const names = new Set<string>();
    let mx = 0;
    for (const day of data ?? []) {
      let total = 0;
      for (const a of day.activities) {
        names.add(a.name);
        total += a.score;
      }
      if (total > mx) mx = total;
    }
    const ac: Record<string, string> = {};
    let ci = 0;
    for (const n of names) {
      ac[n] = palette[ci % palette.length];
      ci++;
    }
    const w = data.length > 0 ? data.length * (BAR_WIDTH + BAR_GAP) + PADDING_LEFT + PADDING_RIGHT : 100;
    return { activityColors: ac, maxScore: Math.max(mx, 1), chartWidth: Math.max(w, 200) };
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <View className="items-center rounded-md border border-line bg-white p-5">
        <Text className="text-[13px] text-muted">No workout history yet.</Text>
      </View>
    );
  }

  const dayLabels = data.map((d) => {
    const date = new Date(d.date + "T12:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short" });
  });

  const barHeight = (score: number) => (score / maxScore) * CHART_HEIGHT;

  const bars: React.ReactElement[] = [];

  for (let di = 0; di < data.length; di++) {
    const day = data[di];
    const barX = PADDING_LEFT + di * (BAR_WIDTH + BAR_GAP);
    let accumulatedHeight = 0;

    for (const a of day.activities) {
      const h = barHeight(a.score);
      const y = CHART_HEIGHT - accumulatedHeight - h;
      accumulatedHeight += h;
      bars.push(
        <Rect
          key={`${di}-${a.name}`}
          x={barX}
          y={y}
          width={BAR_WIDTH}
          height={Math.max(h, a.score > 0 ? 2 : 0)}
          fill={activityColors[a.name] ?? colors.muted}
          rx={2}
        />,
      );
    }

    bars.push(
      <SvgText
        key={`label-${di}`}
        x={barX + BAR_WIDTH / 2}
        y={CHART_HEIGHT + 14}
        fontSize={10}
        fill={colors.muted}
        textAnchor="middle"
      >
        {dayLabels[di]}
      </SvgText>,
    );
    bars.push(
      <SvgText
        key={`val-${di}`}
        x={barX + BAR_WIDTH / 2}
        y={CHART_HEIGHT + 26}
        fontSize={9}
        fill="#9CA3AF"
        textAnchor="middle"
      >
        {day.totalScore}
      </SvgText>,
    );
  }

  return (
    <View className="rounded-md border border-line bg-white p-4">
      <Text className="mb-3 text-[13px] font-semibold text-muted">Workout points</Text>

      <Svg height={CHART_HEIGHT + LABEL_HEIGHT + 8} width={chartWidth}>
        <G>{bars}</G>
      </Svg>

      {Object.keys(activityColors).length > 1 ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {Object.entries(activityColors).map(([name, color]) => (
            <View key={name} className="flex-row items-center gap-1">
              <View className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
              <Text className="text-[11px] text-muted">{name}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
