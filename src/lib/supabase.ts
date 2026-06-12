import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";
import type { Database } from "@/types/database";

const fallbackUrl = "https://example.supabase.co";
const fallbackKey = "missing-anon-key";

export const supabase = createClient<Database>(
  SUPABASE_URL || fallbackUrl,
  SUPABASE_ANON_KEY || fallbackKey,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false
    }
  }
);

