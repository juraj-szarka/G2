import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const c = useColors();
  const isReady = useAuthStore((state) => state.isReady);
  const session = useAuthStore((state) => state.session);

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: c.paper }}>
        <ActivityIndicator color={c.success} />
      </View>
    );
  }

  return <Redirect href={session ? "/(tabs)" : "/(auth)/sign-in"} />;
}

