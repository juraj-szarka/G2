import type { DimensionValue } from "react-native";
import { Text, View } from "react-native";

type Props = {
  label: string;
  value: number;
  target: number;
  unit?: string;
};

export function ProgressBar({ label, value, target, unit = "" }: Props) {
  const percent = target > 0 ? Math.min(value / target, 1) : 0;
  const width = `${Math.max(percent * 100, value > 0 ? 4 : 0)}%` as DimensionValue;

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between">
        <Text className="text-[13px] font-medium text-muted">{label}</Text>
        <Text className="text-[13px] font-semibold text-ink">
          {Math.round(value)}
          {unit} / {Math.round(target)}
          {unit}
        </Text>
      </View>
      <View className="h-2 overflow-hidden rounded-sm bg-[#E8EEE9]">
        <View className="h-full rounded-sm bg-emerald-600" style={{ width }} />
      </View>
    </View>
  );
}
