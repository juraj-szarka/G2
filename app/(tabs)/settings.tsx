import { useCallback, useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { ChevronRight, LogOut, Pencil, Target } from "lucide-react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export default function SettingsScreen() {
  const profile = useAuthStore((state) => state.profile);
  const refreshProfile = useAuthStore((state) => state.refreshProfile);
  const signOut = useAuthStore((state) => state.signOut);
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
        <View className="gap-3 rounded-md border border-line bg-white p-5">
          <View className="flex-row items-center gap-2">
            <Target color={colors.success} size={20} />
            <Text className="text-[15px] font-semibold text-ink">Daily workout point goal</Text>
          </View>
          <Text className="text-[13px] leading-5 text-muted">
            Set how many workout points you want to earn each day. This appears as a goal line in your workout history.
          </Text>
          <View className="flex-row gap-3">
            <TextInput
              className="h-12 flex-1 rounded-md border border-line bg-white px-4 text-[16px] text-ink"
              keyboardType="number-pad"
              onChangeText={(v) => { setGoal(v); setSaved(false); }}
              placeholder="e.g. 10"
              placeholderTextColor="#8B948F"
              value={goal}
            />
            <View className="w-22">
              <PrimaryButton label={saved ? "Saved!" : "Save"} onPress={saveGoal} loading={saving} disabled={!goal.trim()} />
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center gap-3 rounded-md border border-line bg-white p-4"
          onPress={() => router.navigate("/edit-workouts")}
        >
          <View className="h-9 w-9 items-center justify-center rounded-md bg-[#EEF3EF]">
            <Pencil color={colors.ink} size={18} />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-semibold text-ink">Edit workouts</Text>
            <Text className="text-[12px] text-muted">Change icons, colors, or delete workout types</Text>
          </View>
          <ChevronRight color={colors.muted} size={18} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          className="flex-row items-center gap-3 rounded-md border border-red-200 bg-white p-4"
          onPress={handleSignOut}
        >
          <View className="h-9 w-9 items-center justify-center rounded-md bg-red-50">
            <LogOut color="#DC2626" size={18} />
          </View>
          <View>
            <Text className="text-[15px] font-semibold text-red-700">Log out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}
