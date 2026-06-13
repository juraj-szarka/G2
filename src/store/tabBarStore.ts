import { create } from "zustand";

type TabBarState = {
  accentColor: string;
  setAccentColor: (color: string) => void;
};

export const useTabBarStore = create<TabBarState>((set) => ({
  accentColor: "",
  setAccentColor: (color: string) => set({ accentColor: color }),
}));
