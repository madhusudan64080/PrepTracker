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
  // FIX: isLoading starts true and is set to false by ClientProviders
  // after the refresh-token check completes. This prevents ProtectedRoute
  // from redirecting to /login before the session is validated.
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
      isLoading: true, // always start loading — ClientProviders resolves this

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
      // Only persist user identity — never persist isLoading or accessToken
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
        // accessToken intentionally NOT persisted (short-lived, refreshed on load)
      }),
      // After hydration from localStorage, always keep isLoading: true
      // so ClientProviders can show a spinner while validating the session
      merge: (persisted: any, current) => ({
        ...current,
        ...persisted,
        isLoading: true,    // override — always validate on startup
        accessToken: null   // always null until refreshed
      })
    }
  )
);

// Named export alias for components using useAuthStore
export const useAuthStore = authStore;
