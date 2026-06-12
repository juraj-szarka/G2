import Constants from "expo-constants";

declare const process: {
  env?: Record<string, string | undefined>;
};

type ExpoExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExpoExtra;

export const SUPABASE_URL = extra.supabaseUrl ?? process.env?.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  extra.supabaseAnonKey ?? process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const hasSupabaseConfig = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function assertSupabaseConfig() {
  if (!hasSupabaseConfig) {
    throw new Error("Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY.");
  }
}

