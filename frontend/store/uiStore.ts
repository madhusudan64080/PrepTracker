// frontend/store/uiStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type Theme = "dark" | "light";

interface Toast {
  id: string;
  message: string;
}

interface UIState {
  sidebarCollapsed: boolean;
  theme: Theme;
  commandPaletteOpen: boolean;
  activeModal: string | null;
  toastQueue: Toast[];

  toggleSidebar: () => void;
  toggleTheme: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  openModal: (id: string) => void;
  closeModal: () => void;
  addToast: (message: string) => void;
  removeToast: (id: string) => void;
}

export const uiStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: "dark",
      commandPaletteOpen: false,
      activeModal: null,
      toastQueue: [],

      toggleSidebar: () =>
        set({
          sidebarCollapsed: !get().sidebarCollapsed
        }),

      toggleTheme: () =>
        set({
          theme: get().theme === "dark" ? "light" : "dark"
        }),

      openCommandPalette: () =>
        set({ commandPaletteOpen: true }),

      closeCommandPalette: () =>
        set({ commandPaletteOpen: false }),

      openModal: (id) =>
        set({
          activeModal: id
        }),

      closeModal: () =>
        set({
          activeModal: null
        }),

      addToast: (message) => {
        const id = `toast-${Date.now()}`;

        set({
          toastQueue: [...get().toastQueue, { id, message }]
        });
      },

      removeToast: (id) =>
        set({
          toastQueue: get().toastQueue.filter((t) => t.id !== id)
        })
    }),
    {
      name: "ui-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed
      })
    }
  )
);