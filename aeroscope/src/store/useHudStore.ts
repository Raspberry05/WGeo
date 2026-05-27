import { create } from "zustand";

export type HudPanelId =
  | "airport-picker"
  | "airport-type-filter"
  | "class-filter"
  | "wake-filter"
  | "aircraft-list"
  | "aircraft-inspector";

interface HudStore {
  mobileDrawerOpen: boolean;
  minimizedPanels: Partial<Record<HudPanelId, boolean>>;
  statusBarHeight: number;
  setMobileDrawerOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;
  setPanelMinimized: (panelId: HudPanelId, minimized: boolean) => void;
  togglePanelMinimized: (panelId: HudPanelId) => void;
  setStatusBarHeight: (height: number) => void;
}

export const useHudStore = create<HudStore>((set) => ({
  mobileDrawerOpen: false,
  minimizedPanels: {},
  statusBarHeight: 52,
  setMobileDrawerOpen: (mobileDrawerOpen) => set({ mobileDrawerOpen }),
  toggleMobileDrawer: () =>
    set((s) => ({ mobileDrawerOpen: !s.mobileDrawerOpen })),
  setPanelMinimized: (panelId, minimized) =>
    set((s) => ({
      minimizedPanels: { ...s.minimizedPanels, [panelId]: minimized },
    })),
  togglePanelMinimized: (panelId) =>
    set((s) => ({
      minimizedPanels: {
        ...s.minimizedPanels,
        [panelId]: !s.minimizedPanels[panelId],
      },
    })),
  setStatusBarHeight: (height) => set({ statusBarHeight: height }),
}));
