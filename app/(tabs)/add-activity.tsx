import { useState } from "react";
import { FlatList, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Plus, Search } from "lucide-react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { ACTIVITY_PRESETS, guessActivity } from "@/data/activities";
import { colors } from "@/constants/theme";
import { createManualWorkout } from "@/services/logs";

export default function AddActivityScreen() {
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customScore, setCustomScore] = useState("");

  const filtered = search
    ? ACTIVITY_PRESETS.filter((a: { name: string }) => a.name.toLowerCase().includes(search.toLowerCase()))
    : ACTIVITY_PRESETS;

  async function pickPreset(name: string, dailyGoal: number, scorePerUnit: number, incrementStep: number) {
    try {
      await createManualWorkout(name, dailyGoal, incrementStep, scorePerUnit);
      router.back();
    } catch (e) {
      router.back();
    }
  }

  async function addCustom() {
    const name = customName.trim();
    if (!name) return;
    const guessed = guessActivity(name);
    const scorePerUnit = parseFloat(customScore) || (guessed?.scorePerUnit ?? 0.2);
    const dailyGoal = guessed?.dailyGoal ?? 100;
    const incrementStep = guessed?.incrementStep ?? 5;
    try {
      await createManualWorkout(name, dailyGoal, incrementStep, scorePerUnit);
      router.back();
    } catch (e) {
      router.back();
    }
  }

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
          <Text className="text-[22px] font-semibold text-ink">Add activity</Text>
        </View>
      </View>

      <View className="mb-3 px-5">
        <View className="flex-row items-center gap-2 rounded-md border border-line bg-white px-3">
          <Search color="#8B948F" size={18} />
          <TextInput
            className="h-11 flex-1 text-[15px] text-ink"
            onChangeText={setSearch}
            placeholder="Search activities..."
            placeholderTextColor="#8B948F"
            value={search}
          />
        </View>
      </View>

      <FlatList
        className="flex-1 px-5"
        contentContainerClassName="pb-6 gap-2"
        data={filtered}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              className="flex-row items-center gap-3 rounded-md border border-line bg-white p-4"
              onPress={() => pickPreset(item.name, item.dailyGoal, item.scorePerUnit, item.incrementStep)}
            >
            <View className="h-9 w-9 items-center justify-center rounded-md" style={{ backgroundColor: item.color + "20" }}>
              <item.icon color={item.color} size={20} />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-semibold text-ink">{item.name}</Text>
              <Text className="text-[12px] text-muted">
                {item.scorePerUnit} pts / {item.unit}
              </Text>
            </View>
            <Plus color={colors.muted} size={18} />
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          !search ? (
            <Text className="mb-1 text-[13px] font-semibold uppercase text-muted">Presets</Text>
          ) : null
        }
        ListFooterComponent={
          <View className="mt-4 gap-3 rounded-md border border-line bg-white p-4">
            <Text className="mb-1 text-[13px] font-semibold uppercase text-muted">Custom</Text>
            <TextInput
              className="h-11 rounded-md border border-line bg-white px-3 text-[15px] text-ink"
              onChangeText={setCustomName}
              placeholder="Activity name"
              placeholderTextColor="#8B948F"
              value={customName}
            />
            <TextInput
              className="h-11 rounded-md border border-line bg-white px-3 text-[15px] text-ink"
              keyboardType="decimal-pad"
              onChangeText={setCustomScore}
              placeholder="Score per unit (e.g. 0.5)"
              placeholderTextColor="#8B948F"
              value={customScore}
            />
            <PrimaryButton label="Add custom" onPress={addCustom} disabled={!customName.trim()} />
          </View>
        }
      />
    </SafeAreaView>
  );
}
