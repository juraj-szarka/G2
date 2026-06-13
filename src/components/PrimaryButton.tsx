import type { ReactNode } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

type Props = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "quiet" | "outline";
  color?: string;
};

export function PrimaryButton({
  label,
  onPress,
  icon,
  disabled,
  loading,
  variant = "primary",
  color
}: Props) {
  const c = useColors();
  const base = "h-12 flex-row items-center justify-center rounded-md px-4";
  const bgColor = color && variant === "primary" ? color : undefined;
  const borderColor = color && variant === "outline" ? color : undefined;
  const txtColor = color && variant === "primary" ? "#FFFFFF" : color && variant === "outline" ? color : undefined;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      activeOpacity={0.82}
      className={`${base} ${disabled ? "opacity-50" : ""}`}
      style={{
        backgroundColor: bgColor || (variant === "quiet" ? c.muted + "18" : variant === "outline" ? c.surface : c.success),
        borderWidth: variant === "outline" ? 1 : 0,
        borderColor: borderColor || (variant === "outline" ? c.line : undefined),
      }}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={txtColor ?? (variant === "primary" ? "white" : c.ink)} />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text
            className="text-[15px] font-semibold"
            style={{ color: txtColor ?? (variant === "primary" ? "white" : c.ink) }}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

