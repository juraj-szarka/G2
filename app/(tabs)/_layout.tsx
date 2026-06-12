import { Tabs } from "expo-router";
import { Dumbbell, Home, Users, Utensils } from "lucide-react-native";

import { colors } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.success,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          borderTopColor: colors.line,
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
    </Tabs>
  );
}
