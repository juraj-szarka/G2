import type { ReactNode } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/constants/theme";

type Props = {
  title?: string;
  eyebrow?: string;
  children: ReactNode;
  action?: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  accentColor?: string;
  bgColor?: string;
};

export function Screen({ title, eyebrow, children, action, refreshing, onRefresh, accentColor, bgColor }: Props) {
  return (
    <SafeAreaView className="flex-1" edges={["top"]} style={{ backgroundColor: bgColor ?? colors.paper }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-10 pt-4"
        refreshControl={
          onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} /> : undefined
        }
      >
        {title ? (
          <View className="mb-6 flex-row items-end justify-between gap-4">
            <View className="flex-1">
              {eyebrow ? (
                <Text className="mb-2 text-[12px] font-semibold uppercase" style={{ color: accentColor ?? colors.success }}>
                  {eyebrow}
                </Text>
              ) : null}
              <Text className="text-[34px] font-semibold text-ink">{title}</Text>
            </View>
            {action}
          </View>
        ) : null}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

