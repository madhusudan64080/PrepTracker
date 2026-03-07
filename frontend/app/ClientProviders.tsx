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
      setLoading(true);
      try {
        const res = await authService.refreshToken();
        if (res?.data?.accessToken) {
          setAccessToken(res.data.accessToken);
          const meRes = await authService.getMe();
          if (meRes?.data) {
            setUser(meRes.data);
          }
        }
      } catch {
        // Not logged in or token expired - clear auth state
        logout();
      } finally {
        setLoading(false);
      }
    };

    validateSession();
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
