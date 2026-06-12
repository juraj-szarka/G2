import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { colors } from "@/constants/theme";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const isReady = useAuthStore((state) => state.isReady);
  const session = useAuthStore((state) => state.session);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-paper">
        <ActivityIndicator color={colors.success} />
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/(auth)/sign-in"} />;
}

