'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/apiServices'
import { authStore } from '@/store/authStore'

export default function RegisterPage() {
  const router = useRouter()
  const { setUser, setAccessToken } = authStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasLength = password.length >= 8

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name || name.length < 2) errs.name = 'Name must be at least 2 characters'
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Valid email required'
    if (!hasLength) errs.password = 'Password must be 8+ characters'
    if (!hasUpper) errs.password = 'Password must have an uppercase letter'
    if (!hasNumber) errs.password = 'Password must have a number'
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords must match'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setApiError(null)

    try {
      const res = await authService.register({ name, email, password })
      const data = res.data?.data || res.data

      setUser(data.user)
      setAccessToken(data.accessToken)

      // Go straight to dashboard — user sets up subjects/schedule there
      router.push('/dashboard')
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Registration failed'
      setApiError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-6 py-12">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-5">
        <div>
          <h1 className="text-3xl text-white font-bold">Create Account</h1>
          <p className="text-gray-400 text-sm mt-1">Start your placement prep journey</p>
        </div>

        <div>
          <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)}
            className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white outline-none focus:border-indigo-500 transition-colors"/>
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white outline-none focus:border-indigo-500 transition-colors"/>
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white outline-none focus:border-indigo-500 transition-colors"/>
          {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
        </div>

        <div>
          <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
            className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-lg text-white outline-none focus:border-indigo-500 transition-colors"/>
          {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>

        <div className="text-sm text-gray-400 space-y-1 bg-neutral-900 p-3 rounded-lg">
          <div className={hasLength ? 'text-green-400' : ''}>✓ 8+ characters</div>
          <div className={hasUpper  ? 'text-green-400' : ''}>✓ Uppercase letter</div>
          <div className={hasNumber ? 'text-green-400' : ''}>✓ Number</div>
        </div>

        {apiError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{apiError}</div>}

        <button type="submit" disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 p-3 rounded-lg text-white font-medium disabled:opacity-60 transition-colors">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-400 hover:text-indigo-300">Sign in →</a>
        </p>
      </form>
    </div>
  )
}
