import { useCallback, useState } from "react";
import { Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { ChevronRight, LogOut, Moon, Pencil, Sun, Target } from "lucide-react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useThemeStore } from "@/store/themeStore";

export default function SettingsScreen() {
  const c = useColors();
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const signOut = useAuthStore((state) => state.signOut);
  const darkMode = useThemeStore((s) => s.darkMode);
  const toggleDark = useThemeStore((s) => s.toggle);
  const [goal, setGoal] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (profile) {
        setGoal(String(profile.workout_points_goal));
      }
    }, [profile])
  );

  async function saveGoal() {
    const val = parseInt(goal, 10);
    if (isNaN(val) || val <= 0 || !profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ workout_points_goal: val })
      .eq("id", profile.id);

    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await refreshProfile();
    }
    setSaving(false);
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/(auth)/sign-in");
  }

  return (
    <Screen eyebrow="Preferences" title="Settings">
      <View className="gap-6">
        <View className="gap-3 rounded-md border p-5" style={{ borderColor: c.line, backgroundColor: c.surface }}>
          <View className="flex-row items-center gap-2">
            <Target color={c.success} size={20} />
            <Text className="text-[15px] font-semibold" style={{ color: c.ink }}>Daily workout point goal</Text>
          </View>
          <Text className="text-[13px] leading-5" style={{ color: c.muted }}>
            Set how many workout points you want to earn each day. This appears as a goal line in your workout history.
          </Text>
          <View className="flex-row gap-3">
            <TextInput
              className="h-12 flex-1 rounded-md border px-4 text-[16px]"
              style={{ borderColor: c.line, backgroundColor: c.surface, color: c.ink }}
              keyboardType="number-pad"
              onChangeText={(v) => { setGoal(v); setSaved(false); }}
              placeholder="e.g. 10"
              placeholderTextColor={c.muted}
              value={goal}
            />
            <View className="w-22">
              <PrimaryButton label={saved ? "Saved!" : "Save"} onPress={saveGoal} loading={saving} disabled={!goal.trim()} />
            </View>
          </View>
        </View>

        <View className="flex-row items-center gap-3 rounded-md border p-4" style={{ borderColor: c.line, backgroundColor: c.surface }}>
          <View className="h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: c.muted + "18" }}>
            {darkMode ? <Moon color={c.ink} size={18} /> : <Sun color={c.ink} size={18} />}
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-semibold" style={{ color: c.ink }}>Dark mode</Text>
            <Text className="text-[12px]" style={{ color: c.muted }}>Use black background theme</Text>
          </View>
          <Switch
            trackColor={{ false: "#E4EBE5", true: c.success }}
            thumbColor={darkMode ? c.success : "#f4f3f4"}
            onValueChange={toggleDark}
            value={darkMode}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center gap-3 rounded-md border p-4"
          style={{ borderColor: c.line, backgroundColor: c.surface }}
          onPress={() => router.navigate("/edit-workouts")}
        >
          <View className="h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: c.muted + "18" }}>
            <Pencil color={c.ink} size={18} />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-semibold" style={{ color: c.ink }}>Edit workouts</Text>
            <Text className="text-[12px]" style={{ color: c.muted }}>Change icons, colors, or delete workout types</Text>
          </View>
          <ChevronRight color={c.muted} size={18} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center gap-3 rounded-md border p-4"
          style={{ borderColor: "#DC2626" + "40", backgroundColor: c.surface }}
          onPress={handleSignOut}
        >
          <View className="h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: "#DC2626" + "18" }}>
            <LogOut color="#DC2626" size={18} />
          </View>
          <View>
            <Text className="text-[15px] font-semibold" style={{ color: "#DC2626" }}>Log out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
