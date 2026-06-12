import { decode } from "base64-arraybuffer";

import { supabase } from "@/lib/supabase";
import type { NutritionLog } from "@/types/database";
import { todayISO } from "@/utils/date";
import { addNutritionLog } from "./logs";

type MealImageInput = {
  base64?: string | null;
  mimeType?: string | null;
};

type MacroResult = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("You must be signed in.");
  }

  return data.user.id;
}

function extensionForMimeType(mimeType: string) {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}

function normalizeMacros(value: unknown): MacroResult {
  const macros = (value as { macros?: MacroResult })?.macros ?? (value as MacroResult);
  const required: (keyof MacroResult)[] = ["calories", "protein", "carbs", "fat"];

  for (const key of required) {
    if (!Number.isFinite(Number(macros[key]))) {
      throw new Error(`Missing macro field: ${key}`);
    }
  }

  return {
    calories: Math.round(Number(macros.calories)),
    protein: Math.round(Number(macros.protein)),
    carbs: Math.round(Number(macros.carbs)),
    fat: Math.round(Number(macros.fat))
  };
}

export async function analyzeAndSaveMeal(input: MealImageInput) {
  if (!input.base64) {
    throw new Error("Image picker did not return base64 data.");
  }

  const userId = await requireUserId();
  const mimeType = input.mimeType ?? "image/jpeg";
  const imagePath = `${userId}/${Date.now()}.${extensionForMimeType(mimeType)}`;

  const { error: uploadError } = await supabase.storage
    .from("meal-images")
    .upload(imagePath, decode(input.base64), {
      contentType: mimeType,
      upsert: false
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase.functions.invoke("analyze-meal", {
    body: {
      image_base64: input.base64,
      mime_type: mimeType
    }
  });

  if (error) {
    throw error;
  }

  const macros = normalizeMacros(data);
  return addNutritionLog({
    user_id: userId,
    log_date: todayISO(),
    meal_name: "Meal photo",
    image_path: imagePath,
    ...macros,
    raw_response: data as NutritionLog["raw_response"]
  });
}

