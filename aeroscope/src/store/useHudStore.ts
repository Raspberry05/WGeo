import { create } from "zustand";

interface HudStore {
  mobileDrawerOpen: boolean;
  setMobileDrawerOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;
}

export const useHudStore = create<HudStore>((set) => ({
  mobileDrawerOpen: false,
  setMobileDrawerOpen: (mobileDrawerOpen) => set({ mobileDrawerOpen }),
  toggleMobileDrawer: () =>
    set((s) => ({ mobileDrawerOpen: !s.mobileDrawerOpen })),
}));
