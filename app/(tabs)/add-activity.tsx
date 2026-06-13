import { useState } from "react";
import { FlatList, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Plus, Search } from "lucide-react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { SafeAreaView } from "react-native-safe-area-context";
import { ACTIVITY_PRESETS, ICON_NAMES, guessActivity, resolveIcon } from "@/data/activities";
import { colors } from "@/constants/theme";
import { createManualWorkout } from "@/services/logs";

const COLOR_OPTIONS = [
  "#059669", "#D97706", "#7C3AED", "#DC2626", "#0891B2",
  "#DB2777", "#65A30D", "#E11D48", "#0284C7", "#4F46E5",
  "#0D9488", "#9333EA", "#CA8A04", "#EA580C", "#16A34A",
  "#2563EB", "#B45309", "#1E40AF", "#047857", "#6B7280",
  "#A16207", "#9D174D", "#4C1D95", "#0F766E", "#BE185D",
];

const UNIT_OPTIONS = ["reps", "km", "min", "jumps", "flights", "sets", "laps", "rounds"];

export default function AddActivityScreen() {
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customScore, setCustomScore] = useState("");
  const [customUnit, setCustomUnit] = useState("reps");
  const [selectedIcon, setSelectedIcon] = useState("Dumbbell");
  const [selectedColor, setSelectedColor] = useState("#059669");

  const filtered = search
    ? ACTIVITY_PRESETS.filter((a: { name: string }) => a.name.toLowerCase().includes(search.toLowerCase()))
    : ACTIVITY_PRESETS;

  async function pickPreset(name: string, dailyGoal: number, scorePerUnit: number, incrementStep: number, iconName: string, color: string, unit: string) {
    try {
      await createManualWorkout(name, dailyGoal, incrementStep, scorePerUnit, iconName, color, unit);
      router.navigate("/workout");
    } catch (e) {
      router.navigate("/workout");
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
      await createManualWorkout(name, dailyGoal, incrementStep, scorePerUnit, selectedIcon, selectedColor, customUnit);
      router.navigate("/workout");
    } catch (e) {
      router.navigate("/workout");
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
            onPress={() => pickPreset(item.name, item.dailyGoal, item.scorePerUnit, item.incrementStep, item.iconName, item.color, item.unit)}
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

            <Text className="text-[13px] font-semibold text-muted">Unit</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              <View className="flex-row gap-2">
                {UNIT_OPTIONS.map((u) => {
                  const isActive = customUnit === u;
                  return (
                    <TouchableOpacity
                      key={u}
                      activeOpacity={0.7}
                      className={`rounded-md px-3 py-1.5 ${isActive ? "" : "bg-[#EEF3EF]"}`}
                      style={isActive ? { backgroundColor: colors.successSoft } : undefined}
                      onPress={() => setCustomUnit(u)}
                    >
                      <Text className="text-[13px]" style={{ color: isActive ? colors.success : colors.muted, fontWeight: isActive ? "600" : "400" }}>{u}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text className="text-[13px] font-semibold text-muted">Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              <View className="flex-row gap-2">
                {ICON_NAMES.map((name) => {
                  const IconComp = resolveIcon(name);
                  const isActive = selectedIcon === name;
                  return (
                    <TouchableOpacity
                      key={name}
                      activeOpacity={0.7}
                      className="h-10 w-10 items-center justify-center rounded-md"
                      style={{ backgroundColor: isActive ? colors.successSoft : "#EEF3EF" }}
                      onPress={() => setSelectedIcon(name)}
                    >
                      <IconComp color={isActive ? colors.success : colors.muted} size={20} />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text className="text-[13px] font-semibold text-muted">Color</Text>
            <View className="flex-row flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <TouchableOpacity
                  key={c}
                  activeOpacity={0.7}
                  className={`h-8 w-8 rounded-md ${selectedColor === c ? "border-2 border-ink" : ""}`}
                  style={{ backgroundColor: c }}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>

            <PrimaryButton label="Add custom" onPress={addCustom} disabled={!customName.trim()} />
          </View>
        }
      />
    </SafeAreaView>
  );
}
