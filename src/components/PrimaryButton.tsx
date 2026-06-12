import type { ReactNode } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

type Props = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "quiet" | "outline";
};

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  loading,
  variant = "primary"
}: Props) {
  const base = "h-12 flex-row items-center justify-center rounded-md px-4";
  const style =
    variant === "primary"
      ? "bg-emerald-600"
      : variant === "outline"
        ? "border border-line bg-white"
        : "bg-[#EEF3EF]";
  const textStyle = variant === "primary" ? "text-white" : "text-ink";

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.82}
      className={`${base} ${style} ${disabled ? "opacity-50" : ""}`}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "white" : "#111812"} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text className={`text-[15px] font-semibold ${textStyle}`}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

