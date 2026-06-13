import { Tabs } from "expo-router";
import { Dumbbell, Home, Settings, Users, Utensils } from "lucide-react-native";

import { colors } from "@/constants/theme";
import { useTabBarStore } from "@/store/tabBarStore";

export default function TabsLayout() {
  const tabAccent = useTabBarStore((s) => s.accentColor);
  const activeColor = tabAccent || colors.success;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: tabAccent ? activeColor + "99" : colors.muted,
        tabBarStyle: {
          borderTopWidth: tabAccent ? 2.5 : 1,
          borderTopColor: activeColor,
          backgroundColor: "#FFFFFF"
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600"
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: "Workout",
          tabBarIcon: ({ color, size }) => <Dumbbell color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="add-activity"
        options={{
          href: null,
          title: "Add activity"
        }}
      />
      <Tabs.Screen
        name="workout-history"
        options={{
          href: null,
          title: "Workout history"
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: "Meals",
          tabBarIcon: ({ color, size }) => <Utensils color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="edit-workouts"
        options={{
          href: null,
          title: "Edit workouts"
        }}
      />
      <Tabs.Screen
        name="meal-history"
        options={{
          href: null,
          title: "Meal history"
        }}
      />
    </Tabs>
  );
}
