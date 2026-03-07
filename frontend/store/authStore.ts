// frontend/store/authStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface User {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  onboardingCompleted?: boolean;
  streak?: {
    currentStreak: number;
    longestStreak: number;
  };
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (state: boolean) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

export const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user
        }),

      setAccessToken: (token) =>
        set({
          accessToken: token
        }),

      setLoading: (state) =>
        set({
          isLoading: state
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false
        }),

      updateUser: (data) => {
        const user = get().user;
        if (!user) return;
        set({ user: { ...user, ...data } });
      }
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Named export alias for components using useAuthStore
export const useAuthStore = authStore;
