import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { Redirect, useLocalSearchParams } from "expo-router";

import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";
import { createFriendshipByCode } from "@/services/friends";
import { useAuthStore } from "@/store/authStore";

export default function FriendInviteScreen() {
  const c = useColors();
  const { code } = useLocalSearchParams<{ code: string }>();
  const session = useAuthStore((state) => state.session);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || !code) {
      return;
    }

    createFriendshipByCode(code)
      .then(() => setDone(true))
      .catch((caught) => setError(String((caught as { message?: string })?.message ?? "Unable to use invite.")));
  }, [code, session]);

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (done) {
    return <Redirect href="/(tabs)/social" />;
  }

  return (
    <View className="flex-1 items-center justify-center px-6" style={{ backgroundColor: c.paper }}>
      {error ? (
        <View className="w-full gap-4">
          <Text className="text-center text-[16px] font-medium text-red-700">{error}</Text>
          <PrimaryButton label="Back to social" onPress={() => setDone(true)} />
        </View>
      ) : (
        <>
          <ActivityIndicator color={c.success} />
          <Text className="mt-4 text-[15px]" style={{ color: c.muted }}>Adding friend...</Text>
        </>
      )}
    </View>
  );
}

