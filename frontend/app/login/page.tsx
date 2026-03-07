'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/apiServices'
import { authStore } from '@/store/authStore'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setAccessToken } = authStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validate = () => {
    const errs: typeof errors = {}
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email'
    if (!password || password.length < 6) errs.password = 'Password required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    try {
      setLoading(true)
      setApiError(null)

      const res = await authService.login({ email, password })
      const data = res.data?.data || res.data

      setUser(data.user)
      setAccessToken(data.accessToken)

      // Always go straight to dashboard — onboarding is removed
      router.push('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Invalid credentials'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-black relative items-center justify-center text-white">
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg,#444 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        <div className="relative text-center px-12">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-black mx-auto mb-6 shadow-[0_0_40px_#6366f1]">PT</div>
          <h2 className="text-3xl font-bold mt-4">PrepTrack OS</h2>
          <p className="mt-3 text-gray-300">Your AI-Powered Placement Preparation Platform</p>
          <ul className="mt-10 space-y-3 text-left text-sm">
            <li className="flex items-center gap-3"><span className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">🚀</span> Structured learning roadmap</li>
            <li className="flex items-center gap-3"><span className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">🤖</span> AI-generated topic content</li>
            <li className="flex items-center gap-3"><span className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">📊</span> Smart progress analytics</li>
            <li className="flex items-center gap-3"><span className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">🎯</span> Daily study scheduler</li>
            <li className="flex items-center gap-3"><span className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center">🔁</span> Spaced revision reminders</li>
          </ul>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex flex-1 items-center justify-center bg-neutral-950 px-6">
        <form onSubmit={onSubmit} className="w-full max-w-md space-y-5">
          <div>
            <h1 className="text-3xl font-bold text-white">Welcome back</h1>
            <p className="text-gray-400 text-sm mt-1">Sign in to continue your prep journey</p>
          </div>

          <div>
            <input placeholder="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white outline-none focus:border-indigo-500 transition-colors"/>
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white outline-none focus:border-indigo-500 transition-colors"/>
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-white">
              {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
          </div>

          {apiError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{apiError}</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 p-3 rounded-lg text-white font-medium flex justify-center items-center gap-2 disabled:opacity-60 transition-colors">
            {loading ? <span className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"/> : 'Sign In'}
          </button>

          <p className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <a href="/register" className="text-indigo-400 hover:text-indigo-300">Create account →</a>
          </p>
        </form>
      </div>
    </div>
  )
}
