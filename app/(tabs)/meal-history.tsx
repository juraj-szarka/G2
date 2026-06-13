import { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { router } from "expo-router";
import { ArrowLeft, Utensils } from "lucide-react-native";

import { colors } from "@/constants/theme";
import { getMealHistory } from "@/services/logs";
import type { MealDay } from "@/services/logs";
import { SafeAreaView } from "react-native-safe-area-context";

export default function MealHistoryScreen() {
  const [history, setHistory] = useState<MealDay[]>([]);
  const [days, setDays] = useState(7);

  const load = useCallback(async () => {
    try {
      setHistory(await getMealHistory(days));
    } catch {}
  }, [days]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const totalCals = useMemo(
    () => history.reduce((s, d) => s + d.totalCalories, 0),
    [history],
  );

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top"]}>
      <View className="px-5 pb-4 pt-2">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            className="h-10 w-10 items-center justify-center rounded-md bg-[#EEF3EF]"
            onPress={() => router.back()}
          >
            <ArrowLeft color={colors.ink} size={20} />
          </TouchableOpacity>
          <Text className="text-[22px] font-semibold text-ink">Meal history</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5">
        <View className="mb-4 flex-row items-center justify-center gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setDays(7)}
          >
            <View className="rounded-md px-5 py-2.5" style={{ backgroundColor: days === 7 ? colors.success : "#EEF3EF" }}>
              <Text className="text-[13px] font-semibold" style={{ color: days === 7 ? "#FFFFFF" : colors.muted }}>
                Last 7 days
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setDays(30)}
          >
            <View className="rounded-md px-5 py-2.5" style={{ backgroundColor: days === 30 ? colors.success : "#EEF3EF" }}>
              <Text className="text-[13px] font-semibold" style={{ color: days === 30 ? "#FFFFFF" : colors.muted }}>
                Last 30 days
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {history.length === 0 ? (
          <View className="items-center gap-4 py-12">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-amber-50">
              <Utensils color="#D97706" size={28} />
            </View>
            <Text className="text-[15px] font-semibold text-ink">No meals in this period</Text>
          </View>
        ) : (
          <View className="gap-4 pb-8">
            <View className="flex-row items-center justify-between rounded-md border border-line bg-white p-4">
              <Text className="text-[13px] text-muted">Total calories</Text>
              <Text className="text-[22px] font-semibold" style={{ color: colors.success }}>{Math.round(totalCals)}</Text>
            </View>

            {history.map((day) => (
              <View key={day.date} className="rounded-md border border-line bg-white p-4">
                <Text className="mb-2 text-[15px] font-semibold text-ink">
                  {new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </Text>
                <View className="gap-2">
                  {day.meals.map((meal) => (
                    <View key={meal.id} className="flex-row items-center justify-between border-b border-line pb-2">
                      <Text className="flex-1 text-[14px] text-ink">{meal.meal_name ?? "Meal"}</Text>
                      <Text className="text-[14px] font-semibold" style={{ color: colors.success }}>{Math.round(meal.calories)} kcal</Text>
                    </View>
                  ))}
                </View>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-[12px] text-muted">
                    {Math.round(day.totalProtein)}g protein / {Math.round(day.totalCarbs)}g carbs / {Math.round(day.totalFat)}g fat
                  </Text>
                  <Text className="text-[15px] font-semibold" style={{ color: colors.success }}>{Math.round(day.totalCalories)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
