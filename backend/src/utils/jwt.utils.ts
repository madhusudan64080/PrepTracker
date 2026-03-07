// backend/src/utils/jwt.utils.ts
//
// FIX (Issue 4 — Auth refresh cookie not sent):
//   The original setCookieOptions() used sameSite: "strict".
//   In cross-origin deployments (frontend on Vercel, backend on Railway)
//   "strict" means the browser will NOT send the refreshToken cookie on the
//   POST /api/auth/refresh call, because it originates from a different domain.
//
//   Fix: use sameSite: "none" in production (requires secure: true, which is
//   already set for prod) so the cookie is sent cross-origin.
//   In development keep sameSite: "lax" (localhost same-site requests work fine).

import jwt from "jsonwebtoken"
import { CookieOptions } from "express"

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  as string
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string

const ACCESS_EXPIRES  = process.env.JWT_ACCESS_EXPIRES_IN  || "15m"
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || "7d"

interface AccessPayload {
  userId: string
  email:  string
  type:   "access"
}

interface RefreshPayload {
  userId: string
  type:   "refresh"
}

/* ── Generate Access Token ───────────────────────────────────────────────── */

export function generateAccessToken(userId: string, email: string): string {
  const payload: AccessPayload = { userId, email, type: "access" }
  return jwt.sign(payload, ACCESS_SECRET as jwt.Secret, {
  expiresIn: ACCESS_EXPIRES as jwt.SignOptions["expiresIn"]
})
}
/* ── Generate Refresh Token ─────────────────────────────────────────────── */

export function generateRefreshToken(userId: string): string {
  const payload: RefreshPayload = { userId, type: "refresh" }
  return jwt.sign(payload, REFRESH_SECRET as jwt.Secret, {
  expiresIn: REFRESH_EXPIRES as jwt.SignOptions["expiresIn"]
})
}

/* ── Verify Access Token ────────────────────────────────────────────────── */

export function verifyAccessToken(token: string): { userId: string; email: string } | null {
  try {
    if (!ACCESS_SECRET) return null           // ← ADD THIS LINE
    const decoded = jwt.verify(token, ACCESS_SECRET) as AccessPayload
    if (decoded.type !== "access") return null
    return { userId: decoded.userId, email: decoded.email }
  } catch {
    return null
  }
}

/* ── Verify Refresh Token ───────────────────────────────────────────────── */

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    if (!REFRESH_SECRET) return null          // ← ADD THIS LINE
    const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshPayload
    if (decoded.type !== "refresh") return null
    return { userId: decoded.userId }
  } catch {
    return null
  }
}

/* ── Cookie Options ─────────────────────────────────────────────────────── */

export function setCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production"

  return {
    httpOnly: true,
    // FIX: "none" in prod allows cross-origin cookie on auth/refresh.
    //      "lax"  in dev is sufficient for localhost same-site requests.
    sameSite: isProd ? "none" : "lax",
    secure:   isProd,             // must be true when sameSite="none"
    maxAge:   7 * 24 * 60 * 60 * 1000  // 7 days in ms
  }
}