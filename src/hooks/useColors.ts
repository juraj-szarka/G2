import { lightColors, darkColors } from "@/constants/theme";
import { useThemeStore } from "@/store/themeStore";

export function useColors() {
  const darkMode = useThemeStore((s) => s.darkMode);
  return darkMode ? darkColors : lightColors;
}
