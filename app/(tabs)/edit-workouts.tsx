import { useCallback, useState } from "react";
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { router } from "expo-router";
import { ArrowLeft, Check, Trash2 } from "lucide-react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";
import { ICON_NAMES, resolveIcon } from "@/data/activities";
import { listUserWorkoutTypes, updateWorkoutType, deleteWorkoutType } from "@/services/logs";
import type { WorkoutTypeInfo } from "@/services/logs";
import { SafeAreaView } from "react-native-safe-area-context";

const COLOR_OPTIONS = [
  "#059669", "#D97706", "#7C3AED", "#DC2626", "#0891B2",
  "#DB2777", "#65A30D", "#E11D48", "#0284C7", "#4F46E5",
  "#0D9488", "#9333EA", "#CA8A04", "#EA580C", "#16A34A",
  "#2563EB", "#B45309", "#1E40AF", "#047857", "#6B7280",
  "#A16207", "#9D174D", "#4C1D95", "#0F766E", "#BE185D",
];

export default function EditWorkoutsScreen() {
  const c = useColors();
  const [types, setTypes] = useState<WorkoutTypeInfo[]>([]);
  const [edits, setEdits] = useState<Record<string, { icon_name: string; color: string }>>({});
  const [changed, setChanged] = useState(false);

  useFocusEffect(
    useCallback(() => {
      listUserWorkoutTypes().then(setTypes);
    }, [])
  );

  function setEdit(name: string, field: "icon_name" | "color", value: string) {
    setEdits((prev) => ({
      ...prev,
      [name]: { ...(prev[name] ?? { icon_name: "", color: "" }), [field]: value },
    }));
    setChanged(true);
  }

  function getCurrent(name: string, field: "icon_name" | "color"): string {
    const t = types.find((t) => t.name === name);
    const edit = edits[name];
    if (edit && edit[field]) return edit[field];
    if (t) return field === "icon_name" ? t.icon_name : t.color;
    return field === "icon_name" ? "Dumbbell" : "#059669";
  }

  async function saveChanges() {
    for (const [name, edit] of Object.entries(edits)) {
      if (edit.icon_name || edit.color) {
        try {
          const t = types.find((t) => t.name === name);
          await updateWorkoutType(
            name,
            edit.icon_name || t?.icon_name || "Dumbbell",
            edit.color || t?.color || "#059669",
          );
        } catch {}
      }
    }
    setEdits({});
    setChanged(false);
    setTypes(await listUserWorkoutTypes());
  }

  function confirmDelete(name: string) {
    Alert.alert(
      `Delete "${name}"?`,
      "This will permanently remove all history for this workout type.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWorkoutType(name);
              setTypes(await listUserWorkoutTypes());
            } catch {}
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={["top"]} style={{ backgroundColor: c.paper }}>
      <View className="px-5 pb-4 pt-2">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            activeOpacity={0.7}
            className="h-10 w-10 items-center justify-center rounded-md"
            style={{ backgroundColor: c.muted + "18" }}
            onPress={() => router.back()}
          >
            <ArrowLeft color={c.ink} size={20} />
          </TouchableOpacity>
          <Text className="text-[22px] font-semibold" style={{ color: c.ink }}>Edit workouts</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-5">
        <View className="gap-3 pb-8">
          {types.map((type) => {
            const iconName = getCurrent(type.name, "icon_name");
            const color = getCurrent(type.name, "color");
            const IconComp = resolveIcon(iconName);
            const isEdited = !!edits[type.name];

            return (
              <View key={type.name} className="rounded-md border p-4" style={{ borderColor: isEdited ? c.success : c.line, backgroundColor: c.surface }}>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    className="h-10 w-10 items-center justify-center rounded-md"
                    style={{ backgroundColor: color + "20" }}
                    onPress={() => {
                      const currentIdx = ICON_NAMES.indexOf(iconName as typeof ICON_NAMES[number]);
                      const nextIdx = (currentIdx + 1) % ICON_NAMES.length;
                      setEdit(type.name, "icon_name", ICON_NAMES[nextIdx]);
                    }}
                  >
                    <IconComp color={color} size={20} />
                  </TouchableOpacity>
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold" style={{ color: c.ink }}>{type.name}</Text>
                    <Text className="text-[12px]" style={{ color: c.muted }}>{type.unit}</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    className="h-9 w-9 items-center justify-center rounded-md"
                    style={{ backgroundColor: "#DC2626" + "18" }}
                    onPress={() => confirmDelete(type.name)}
                  >
                    <Trash2 color="#DC2626" size={16} />
                  </TouchableOpacity>
                </View>

                <View className="mt-3 flex-row flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      activeOpacity={0.7}
                      className={`h-7 w-7 rounded-sm ${color === c ? "border-2 border-ink" : ""}`}
                      style={{ backgroundColor: c }}
                      onPress={() => setEdit(type.name, "color", c)}
                    />
                  ))}
                </View>
              </View>
            );
          })}

          {types.length === 0 ? (
            <Text className="text-center text-[14px]" style={{ color: c.muted }}>No workout types found.</Text>
          ) : null}

          {changed ? (
            <PrimaryButton
              icon={<Check color="white" size={18} />}
              label="Submit changes"
              onPress={saveChanges}
            />
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
