// frontend/app/ClientProviders.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { uiStore } from "@/store/uiStore";
import { authStore } from "@/store/authStore";
import { authService } from "@/lib/apiServices";
import ToastContainer from "@/components/shared/Toast";

function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme } = uiStore();
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return <>{children}</>;
}

function AuthProvider({ children }: { children: ReactNode }) {
  const { setUser, setAccessToken, logout, setLoading } = authStore();

  useEffect(() => {
    const validateSession = async () => {
      // FIX (Auto-logout bug):
      // OLD: setLoading(true) was called first, which cleared the persisted
      //      isAuthenticated flag from localStorage, causing ProtectedRoute to
      //      redirect to /login before the refresh completed.
      //
      // NEW: We DON'T call setLoading(true) here. The store initialises with
      //      isLoading: true already. We just resolve it after the refresh attempt.
      //      If a persisted user exists, they stay visible during the async check.
      try {
        const res = await authService.refreshToken();
        const token = res?.data?.data?.accessToken ?? res?.data?.accessToken;
        if (token) {
          setAccessToken(token);
          // Fetch fresh user profile to sync any server-side changes
          try {
            const meRes = await authService.getMe();
            const user = meRes?.data?.data ?? meRes?.data;
            if (user) setUser(user);
          } catch {
            // getMe failed — keep persisted user, access token is still fresh
          }
        } else {
          // Refresh returned no token — session truly expired
          logout();
        }
      } catch {
        // No refresh cookie or network error — clear auth state
        logout();
      } finally {
        setLoading(false);
      }
    };

    validateSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        {children}
        <ToastContainer />
      </AuthProvider>
    </ThemeProvider>
  );
}
