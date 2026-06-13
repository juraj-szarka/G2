import type { ReactNode } from "react";
import { Text, View } from "react-native";

type Props = {
  label: string;
  value: string | number;
  detail?: string;
  accent?: boolean;
  icon?: ReactNode;
  accentColor?: string;
};

export function MetricCard({ label, value, detail, accent, icon, accentColor }: Props) {
  return (
    <View className="min-h-[112px] flex-1 justify-between rounded-md border border-line bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-[13px] font-medium text-muted">{label}</Text>
        {icon}
      </View>
      <View>
        <Text
          className={`text-[30px] font-semibold ${accent && !accentColor ? "text-emerald-700" : !accent ? "text-ink" : ""}`}
          style={accentColor ? { color: accentColor } : undefined}
        >
          {value}
        </Text>
        {detail ? <Text className="mt-1 text-[13px] text-muted">{detail}</Text> : null}
      </View>
    </View>
  );
}

