import { useState } from "react";
import { KeyboardAvoidingView, Platform, Text, TextInput, View } from "react-native";
import { Redirect } from "expo-router";
import { LogIn, UserPlus } from "lucide-react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { useColors } from "@/hooks/useColors";
import { useAuthStore } from "@/store/authStore";

export default function SignInScreen() {
  const c = useColors();
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const session = useAuthStore((state) => state.session);
  const isLoading = useAuthStore((state) => state.isLoading);
  const signIn = useAuthStore((state) => state.signIn);
  const signUp = useAuthStore((state) => state.signUp);

  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  async function submit() {
    setLocalError(null);
    try {
      if (mode === "sign-in") {
        await signIn(email.trim(), password);
      } else {
        await signUp(email.trim(), password, displayName.trim() || "Gen2 athlete");
      }
    } catch (error) {
      setLocalError(String((error as { message?: string })?.message ?? "Authentication failed."));
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 px-6" style={{ backgroundColor: c.paper }}
    >
      <View className="flex-1 justify-center">
        <Text className="mb-3 text-[44px] font-semibold" style={{ color: c.ink }}>Gen2</Text>
        <Text className="mb-10 max-w-[300px] text-[16px] leading-6" style={{ color: c.muted }}>
          A quiet daily health system for training, sleep, nutrition, and progress.
        </Text>

        <View className="gap-3">
          {mode === "sign-up" ? (
            <TextInput
              autoCapitalize="words"
              className="h-12 rounded-md border px-4 text-[16px]"
              style={{ borderColor: c.line, backgroundColor: c.surface, color: c.ink }}
              onChangeText={setDisplayName}
              placeholder="Display name"
              placeholderTextColor="#8B948F"
              value={displayName}
            />
          ) : null}
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            className="h-12 rounded-md border px-4 text-[16px]"
            style={{ borderColor: c.line, backgroundColor: c.surface, color: c.ink }}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#8B948F"
            value={email}
          />
          <TextInput
            autoComplete="password"
            className="h-12 rounded-md border px-4 text-[16px]"
            style={{ borderColor: c.line, backgroundColor: c.surface, color: c.ink }}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#8B948F"
            secureTextEntry
            value={password}
          />

          {localError ? <Text className="text-[13px] font-medium text-red-700">{localError}</Text> : null}

          <PrimaryButton
            icon={mode === "sign-in" ? <LogIn color="white" size={18} /> : <UserPlus color="white" size={18} />}
            label={mode === "sign-in" ? "Sign in" : "Create account"}
            loading={isLoading}
            onPress={submit}
          />
          <PrimaryButton
            label={mode === "sign-in" ? "Create a Gen2 account" : "I already have an account"}
            onPress={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}
            variant="quiet"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
