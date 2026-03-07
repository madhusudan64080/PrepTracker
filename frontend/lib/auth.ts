// frontend/lib/auth.ts
import { authService } from '@/lib/apiServices'
import { authStore } from '@/store/authStore'

export async function initAuth() {
  const { setUser, logout } = authStore.getState()

  try {
    const res = await authService.getMe()
    const user = res.data?.data || res.data
    if (user) {
      setUser(user)
      return true
    }
  } catch (err: any) {
    if (err?.response?.status === 401) {
      logout()
      return false
    }
  }

  return false
}
