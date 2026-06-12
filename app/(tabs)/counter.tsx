import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Minus, Plus } from "lucide-react-native";

import { MetricCard } from "@/components/MetricCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { ProgressBar } from "@/components/ProgressBar";
import { Screen } from "@/components/Screen";
import { colors } from "@/constants/theme";
import { getOrCreateManualWorkout, updateManualWorkoutCount } from "@/services/logs";
import type { ManualWorkout } from "@/types/database";

export default function CounterScreen() {
  const [workout, setWorkout] = useState<ManualWorkout | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setWorkout(await getOrCreateManualWorkout());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load counter.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function change(delta: number) {
    if (!workout) {
      return;
    }

    const previous = workout;
    setWorkout({ ...workout, current_count: Math.max(0, workout.current_count + delta) });
    try {
      setWorkout(await updateManualWorkoutCount(workout, delta));
    } catch (caught) {
      setWorkout(previous);
      setError(caught instanceof Error ? caught.message : "Unable to update counter.");
    }
  }

  const count = workout?.current_count ?? 0;
  const target = workout?.target_count ?? 200;
  const percent = Math.round(Math.min(count / target, 1) * 100);

  return (
    <Screen eyebrow="Manual tracker" onRefresh={load} refreshing={loading} title="Counter">
      <View className="gap-4">
        <MetricCard
          accent
          detail={`${percent}% of daily target`}
          icon={<Plus color={colors.success} size={20} />}
          label={workout?.name ?? "Push-ups"}
          value={count}
        />

        <View className="gap-5 rounded-md border border-line bg-white p-5">
          <ProgressBar label="Daily progress" target={target} unit={workout?.unit ?? " reps"} value={count} />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PrimaryButton label="+5" onPress={() => change(5)} variant="outline" />
            </View>
            <View className="flex-1">
              <PrimaryButton label="+10" onPress={() => change(10)} />
            </View>
            <View className="flex-1">
              <PrimaryButton label="+25" onPress={() => change(25)} variant="outline" />
            </View>
          </View>
          <PrimaryButton
            icon={<Minus color="#111812" size={18} />}
            label="Undo 10"
            onPress={() => change(-10)}
            variant="quiet"
          />
        </View>

        {error ? <Text className="text-[13px] font-medium text-red-700">{error}</Text> : null}
      </View>
    </Screen>
  );
}

