import "../global.css";

import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";

export default function RootLayout() {
  const initialize = useAuthStore((state) => state.initialize);
  const loadTheme = useThemeStore((s) => s.load);
  const darkMode = useThemeStore((s) => s.darkMode);

  useEffect(() => initialize(), [initialize]);
  useEffect(() => { loadTheme(); }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: darkMode ? "#000000" : "#F7FAF7" }}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="friend/[code]" />
        <Stack.Screen name="profile/[id]" />
      </Stack>
    </GestureHandlerRootView>
  );
}
