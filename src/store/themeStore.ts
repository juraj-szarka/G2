import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ThemeState = {
  darkMode: boolean;
  loaded: boolean;
  toggle: () => void;
  setDarkMode: (v: boolean) => void;
  load: () => Promise<void>;
};

const STORAGE_KEY = "dark_mode";

export const useThemeStore = create<ThemeState>((set, get) => ({
  darkMode: false,
  loaded: false,
  toggle: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    AsyncStorage.setItem(STORAGE_KEY, String(next));
  },
  setDarkMode: (v: boolean) => {
    set({ darkMode: v });
    AsyncStorage.setItem(STORAGE_KEY, String(v));
  },
  load: async () => {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEY);
      set({ darkMode: val === "true", loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));
