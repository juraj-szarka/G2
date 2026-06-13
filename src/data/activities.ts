import type { ComponentType } from "react";
import {
  ArrowUpDown,
  Bike,
  Dumbbell,
  Footprints,
  Heart,
  Kanban,
  PersonStanding,
  Rabbit,
  StretchHorizontal,
  Sun,
  SwatchBook,
  Waves,
  Waypoints,
  Weight,
  Wheat,
  Wind,
} from "lucide-react-native";

export type ActivityPreset = {
  name: string;
  unit: string;
  scorePerUnit: number;
  icon: ComponentType<{ color?: string; size?: number }>;
  color: string;
  incrementStep: number;
  dailyGoal: number;
  iconName: string;
};

export const ACTIVITY_PRESETS: ActivityPreset[] = [
  { name: "Push-ups", unit: "reps", scorePerUnit: 0.1, icon: ArrowUpDown, color: "#059669", incrementStep: 5, dailyGoal: 100, iconName: "ArrowUpDown" },
  { name: "Pull-ups", unit: "reps", scorePerUnit: 0.25, icon: ArrowUpDown, color: "#D97706", incrementStep: 1, dailyGoal: 20, iconName: "ArrowUpDown" },
  { name: "Running", unit: "km", scorePerUnit: 5.0, icon: Rabbit, color: "#DC2626", incrementStep: 1, dailyGoal: 5, iconName: "Rabbit" },
  { name: "Sit-ups", unit: "reps", scorePerUnit: 0.05, icon: PersonStanding, color: "#7C3AED", incrementStep: 5, dailyGoal: 100, iconName: "PersonStanding" },
  { name: "Squats", unit: "reps", scorePerUnit: 0.05, icon: PersonStanding, color: "#0891B2", incrementStep: 5, dailyGoal: 100, iconName: "PersonStanding" },
  { name: "Jumping Jacks", unit: "reps", scorePerUnit: 0.02, icon: Sun, color: "#DB2777", incrementStep: 10, dailyGoal: 200, iconName: "Sun" },
  { name: "Burpees", unit: "reps", scorePerUnit: 0.2, icon: Wheat, color: "#65A30D", incrementStep: 1, dailyGoal: 30, iconName: "Wheat" },
  { name: "Cycling", unit: "km", scorePerUnit: 1.5, icon: Bike, color: "#E11D48", incrementStep: 1, dailyGoal: 20, iconName: "Bike" },
  { name: "Swimming", unit: "km", scorePerUnit: 20.0, icon: Waves, color: "#0284C7", incrementStep: 1, dailyGoal: 1, iconName: "Waves" },
  { name: "Walking", unit: "km", scorePerUnit: 2.0, icon: Footprints, color: "#4F46E5", incrementStep: 1, dailyGoal: 10, iconName: "Footprints" },
  { name: "Plank", unit: "min", scorePerUnit: 0.5, icon: StretchHorizontal, color: "#0D9488", incrementStep: 1, dailyGoal: 3, iconName: "StretchHorizontal" },
  { name: "Jump Rope", unit: "jumps", scorePerUnit: 0.01, icon: Waypoints, color: "#9333EA", incrementStep: 50, dailyGoal: 1000, iconName: "Waypoints" },
  { name: "Lunges", unit: "reps", scorePerUnit: 0.05, icon: PersonStanding, color: "#CA8A04", incrementStep: 5, dailyGoal: 60, iconName: "PersonStanding" },
  { name: "Dips", unit: "reps", scorePerUnit: 0.15, icon: ArrowUpDown, color: "#EA580C", incrementStep: 1, dailyGoal: 30, iconName: "ArrowUpDown" },
  { name: "Chin-ups", unit: "reps", scorePerUnit: 0.25, icon: ArrowUpDown, color: "#16A34A", incrementStep: 1, dailyGoal: 15, iconName: "ArrowUpDown" },
  { name: "Rowing Machine", unit: "km", scorePerUnit: 4.0, icon: Wind, color: "#2563EB", incrementStep: 1, dailyGoal: 5, iconName: "Wind" },
  { name: "Kettlebell Swings", unit: "reps", scorePerUnit: 0.08, icon: Weight, color: "#7C3AED", incrementStep: 5, dailyGoal: 50, iconName: "Weight" },
  { name: "Mountain Climbers", unit: "reps", scorePerUnit: 0.03, icon: PersonStanding, color: "#BE123C", incrementStep: 10, dailyGoal: 100, iconName: "PersonStanding" },
  { name: "Bicep Curls", unit: "reps", scorePerUnit: 0.05, icon: Dumbbell, color: "#6D28D9", incrementStep: 5, dailyGoal: 60, iconName: "Dumbbell" },
  { name: "Bench Press", unit: "reps", scorePerUnit: 0.08, icon: Weight, color: "#B45309", incrementStep: 1, dailyGoal: 30, iconName: "Weight" },
  { name: "Deadlifts", unit: "reps", scorePerUnit: 0.12, icon: Weight, color: "#1E40AF", incrementStep: 1, dailyGoal: 15, iconName: "Weight" },
  { name: "Shoulder Press", unit: "reps", scorePerUnit: 0.08, icon: Weight, color: "#047857", incrementStep: 1, dailyGoal: 30, iconName: "Weight" },
  { name: "Leg Presses", unit: "reps", scorePerUnit: 0.05, icon: Weight, color: "#6B7280", incrementStep: 5, dailyGoal: 60, iconName: "Weight" },
  { name: "Calf Raises", unit: "reps", scorePerUnit: 0.02, icon: PersonStanding, color: "#A16207", incrementStep: 10, dailyGoal: 100, iconName: "PersonStanding" },
  { name: "Wall Sit", unit: "min", scorePerUnit: 0.4, icon: PersonStanding, color: "#9D174D", incrementStep: 1, dailyGoal: 3, iconName: "PersonStanding" },
  { name: "Box Jumps", unit: "reps", scorePerUnit: 0.15, icon: Rabbit, color: "#E11D48", incrementStep: 1, dailyGoal: 20, iconName: "Rabbit" },
  { name: "Leg Raises", unit: "reps", scorePerUnit: 0.06, icon: PersonStanding, color: "#4C1D95", incrementStep: 5, dailyGoal: 30, iconName: "PersonStanding" },
  { name: "Russian Twists", unit: "reps", scorePerUnit: 0.03, icon: SwatchBook, color: "#A16207", incrementStep: 10, dailyGoal: 100, iconName: "SwatchBook" },
  { name: "Stair Climbing", unit: "flights", scorePerUnit: 0.5, icon: Kanban, color: "#0F766E", incrementStep: 1, dailyGoal: 10, iconName: "Kanban" },
  { name: "Yoga / Stretching", unit: "min", scorePerUnit: 1.0, icon: Heart, color: "#BE185D", incrementStep: 5, dailyGoal: 30, iconName: "Heart" },
];

export function guessActivity(name: string): ActivityPreset | undefined {
  const lower = name.toLowerCase();
  return ACTIVITY_PRESETS.find((a) => a.name.toLowerCase() === lower);
}

export const ICON_NAMES = [
  "ArrowUpDown", "Bike", "Dumbbell", "Footprints", "Heart",
  "Kanban", "PersonStanding", "Rabbit", "StretchHorizontal", "Sun",
  "SwatchBook", "Waves", "Waypoints", "Weight", "Wheat", "Wind",
] as const;

export type IconName = typeof ICON_NAMES[number];

const iconComponents: Record<string, ComponentType<{ color?: string; size?: number }>> = {
  ArrowUpDown, Bike, Dumbbell, Footprints, Heart,
  Kanban, PersonStanding, Rabbit, StretchHorizontal, Sun,
  SwatchBook, Waves, Waypoints, Weight, Wheat, Wind,
};

export function resolveIcon(name: string): ComponentType<{ color?: string; size?: number }> {
  return iconComponents[name] ?? Dumbbell;
}
