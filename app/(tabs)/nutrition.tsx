import { useCallback, useState } from "react";
import { Image, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Camera, ChevronRight, ImagePlus, Utensils } from "lucide-react-native";

import { MetricCard } from "@/components/MetricCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Screen } from "@/components/Screen";
import { useColors } from "@/hooks/useColors";
import { listTodayNutrition } from "@/services/logs";
import { analyzeAndSaveMeal } from "@/services/nutrition";
import type { NutritionLog } from "@/types/database";

export default function NutritionScreen() {
  const c = useColors();
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setLogs(await listTodayNutrition());
    } catch (caught) {
      setError(String((caught as { message?: string })?.message ?? "Unable to load meals."));
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleAsset(asset: ImagePicker.ImagePickerAsset) {
    setPreviewUri(asset.uri);
    setLoading(true);
    setError(null);

    try {
      await analyzeAndSaveMeal({
        base64: asset.base64,
        mimeType: asset.mimeType
      });
      await load();
    } catch (caught) {
      setError(String((caught as { message?: string })?.message ?? "Unable to analyze meal."));
    } finally {
      setLoading(false);
    }
  }

  async function pickImage(source: "camera" | "library") {
    const permission =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError("Photo permission is required to log a meal.");
      return;
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            base64: true,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.78
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            base64: true,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.78
          });

    if (!result.canceled && result.assets[0]) {
      await handleAsset(result.assets[0]);
    }
  }

  const totals = logs.reduce(
    (sum, log) => ({
      calories: sum.calories + log.calories,
      protein: sum.protein + log.protein,
      carbs: sum.carbs + log.carbs,
      fat: sum.fat + log.fat
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <Screen eyebrow="AI meal logging" onRefresh={load} refreshing={loading} title="Meals">
      <View className="gap-4">
        <View className="flex-row gap-3">
          <MetricCard
            accent
            detail="Estimated today"
            icon={<ImagePlus color={c.success} size={20} />}
            label="Calories"
            value={Math.round(totals.calories)}
          />
          <MetricCard
            detail={`${Math.round(totals.carbs)}g carbs / ${Math.round(totals.fat)}g fat`}
            label="Protein"
            value={`${Math.round(totals.protein)}g`}
          />
        </View>

        <View className="gap-3 rounded-md border p-5" style={{ borderColor: c.line, backgroundColor: c.surface }}>
          {previewUri ? <Image className="h-48 w-full rounded-md" resizeMode="cover" source={{ uri: previewUri }} /> : null}
          <PrimaryButton
            icon={<Camera color="white" size={18} />}
            label="Take meal photo"
            loading={loading}
            onPress={() => pickImage("camera")}
          />
          <PrimaryButton
            icon={<ImagePlus color={c.ink} size={18} />}
            label="Choose from library"
            onPress={() => pickImage("library")}
            variant="quiet"
          />
        </View>

        <View className="gap-3">
          {logs.map((log) => (
            <View key={log.id} className="rounded-md border p-4" style={{ borderColor: c.line, backgroundColor: c.surface }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-[15px] font-semibold" style={{ color: c.ink }}>{log.meal_name ?? "Meal"}</Text>
                <Text className="text-[15px] font-semibold" style={{ color: c.success }}>{Math.round(log.calories)} kcal</Text>
              </View>
              <Text className="mt-1 text-[13px]" style={{ color: c.muted }}>
                {Math.round(log.protein)}g protein / {Math.round(log.carbs)}g carbs / {Math.round(log.fat)}g fat
              </Text>
            </View>
          ))}
        </View>

        {logs.length === 0 && !loading ? (
          <View className="items-center gap-4 py-8">
            <View className="h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "#D97706" + "20" }}>
              <Utensils color="#D97706" size={28} />
            </View>
            <Text className="text-center text-[15px] font-semibold" style={{ color: c.ink }}>No meals logged yet</Text>
            <Text className="text-center text-[13px] leading-5" style={{ color: c.muted }}>
              Take a photo of your meal or pick one from{'\n'}your library to log macros automatically.
            </Text>
          </View>
        ) : null}

        {logs.length > 0 ? (
          <PrimaryButton
            icon={<ChevronRight color="white" size={16} />}
            label="Meal history"
            onPress={() => (router as any).navigate("/meal-history")}
            variant="outline"
          />
        ) : null}

        {error ? <Text className="text-[13px] font-medium text-red-700">{error}</Text> : null}
      </View>
    </Screen>
  );
}

