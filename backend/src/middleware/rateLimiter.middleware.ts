// backend/src/middleware/rateLimiter.middleware.ts

import rateLimit from "express-rate-limit"
import { Request } from "express"

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many requests",
      retryAfter: Math.ceil(((req as any).rateLimit.resetTime!.getTime() - Date.now()) / 1000)
    })
  }
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many requests",
      retryAfter: 900
    })
  }
})

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req: Request) => req.user?.userId || req.ip || "unknown",
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many requests",
      retryAfter: 60
    })
  }
})
