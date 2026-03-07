'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authStore } from '@/store/authStore'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { user, isLoading } = authStore()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
    // onboarding redirect removed — users go directly to dashboard after login
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#08080f] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400">Loading PrepTrack...</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
