// frontend/hooks/useAuth.ts

import { authService } from "@/lib/apiServices";
import { authStore } from "@/store/authStore";
import { disconnectSync } from "@/hooks/useSync";

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    setUser,
    setAccessToken,
    logout,
    setLoading,
    updateUser
  } = authStore();

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.login({ email, password });
      const data = res.data?.data || res.data;
      setUser(data.user);
      setAccessToken(data.accessToken);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await authService.register({ name, email, password });
      const data = res.data?.data || res.data;
      setUser(data.user);
      setAccessToken(data.accessToken);
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout errors
    } finally {
      disconnectSync(); // close WebSocket connection on logout
      logout();
    }
  };

  const updateProfile = async (data: { name?: string; avatarUrl?: string }) => {
    const res = await authService.updateProfile(data);
    const updated = res.data?.data || res.data;
    if (updated) updateUser(updated);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout: logoutUser,
    updateProfile
  };
}
