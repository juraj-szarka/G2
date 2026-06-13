import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  label: string;
  value: string | number;
  detail?: string;
  accent?: boolean;
  icon?: ReactNode;
  accentColor?: string;
};

export function MetricCard({ label, value, detail, accent, icon, accentColor }: Props) {
  const c = useColors();

  return (
    <View className="min-h-[112px] flex-1 justify-between rounded-md border p-4" style={{ borderColor: c.line, backgroundColor: c.surface }}>
      <View className="flex-row items-center justify-between">
        <Text className="text-[13px] font-medium" style={{ color: c.muted }}>{label}</Text>
        {icon}
      </View>
      <View>
        <Text
          className="text-[30px] font-semibold"
          style={{ color: accentColor || (accent ? c.success : c.ink) }}
        >
          {value}
        </Text>
        {detail ? <Text className="mt-1 text-[13px]" style={{ color: c.muted }}>{detail}</Text> : null}
      </View>
    </View>
  );
}

