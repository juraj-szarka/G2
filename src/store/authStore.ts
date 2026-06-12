import type { Session } from "@supabase/supabase-js";
import { create } from "zustand";

import { assertSupabaseConfig } from "@/lib/env";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@/types/database";

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  initialize: () => () => void;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
};

let disposeAuthListener: (() => void) | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  isReady: false,
  isLoading: false,
  error: null,
  initialize: () => {
    if (disposeAuthListener) {
      return disposeAuthListener;
    }

    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, isReady: true });
      if (data.session) {
        get().refreshProfile();
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, isReady: true });
      if (session) {
        get().refreshProfile();
      } else {
        set({ profile: null });
      }
    });

    disposeAuthListener = () => data.subscription.unsubscribe();
    return disposeAuthListener;
  },
  refreshProfile: async () => {
    const userId = get().session?.user.id;
    if (!userId) {
      set({ profile: null });
      return;
    }

    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) {
      set({ error: error.message });
      return;
    }

    set({ profile: data, error: null });
  },
  signIn: async (email, password) => {
    assertSupabaseConfig();
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ isLoading: false, error: error?.message ?? null });

    if (error) {
      throw error;
    }
  },
  signUp: async (email, password, displayName) => {
    assertSupabaseConfig();
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    });
    set({ isLoading: false, error: error?.message ?? null });

    if (error) {
      throw error;
    }
  },
  signOut: async () => {
    set({ isLoading: true, error: null });
    const { error } = await supabase.auth.signOut();
    set({ isLoading: false, error: error?.message ?? null });

    if (error) {
      throw error;
    }
  }
}));

