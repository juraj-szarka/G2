import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck } from "lucide-react-native";

import { MetricCard } from "@/components/MetricCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { useColors } from "@/hooks/useColors";
import { loadProfile } from "@/services/friends";
import type { Profile } from "@/types/database";

export default function ProfileScreen() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      return;
    }

    loadProfile(id)
      .then(setProfile)
      .catch((caught) => setError(String((caught as { message?: string })?.message ?? "Unable to load profile.")));
  }, [id]);

  if (!profile && !error) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: c.paper }}>
        <ActivityIndicator color={c.success} />
      </View>
    );
  }

  return (
    <Screen
      action={
        <PrimaryButton
          icon={<ArrowLeft color={c.ink} size={18} />}
          label="Back"
          onPress={() => router.back()}
          variant="quiet"
        />
      }
      eyebrow="Shared profile"
      title={profile?.display_name ?? "Profile"}
    >
      {error ? (
        <Text className="text-[14px] font-medium text-red-700">{error}</Text>
      ) : (
        <View className="gap-4">
          <View className="rounded-md border p-5" style={{ borderColor: c.line, backgroundColor: c.surface }}>
            <View className="flex-row items-center gap-2">
              <ShieldCheck color={c.success} size={20} />
              <Text className="text-[14px] font-semibold" style={{ color: c.ink }}>
                {profile?.share_metrics ? "Metrics shared with friends" : "Metrics private"}
              </Text>
            </View>
            {profile?.bio ? <Text className="mt-3 text-[14px] leading-5" style={{ color: c.muted }}>{profile.bio}</Text> : null}
          </View>

          <View className="flex-row gap-3">
            <MetricCard accent detail="Today" label="Health" value={profile?.current_health_score ?? 0} />
            <MetricCard accent detail="Workout" label="Exercise" value={profile?.current_exercise_score ?? 0} />
          </View>
          <MetricCard detail="Consecutive days above 70" label="Streak" value={profile?.streak_days ?? 0} />
        </View>
      )}
    </Screen>
  );
}

