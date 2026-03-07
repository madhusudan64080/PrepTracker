// backend/src/routes/auth.routes.ts

import { Router } from "express"

import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  completeOnboarding
} from "../controllers/auth.controller"

import { validate } from "../middleware/validate.middleware"
import { authenticateToken } from "../middleware/auth.middleware"
import { authLimiter } from "../middleware/rateLimiter.middleware"

import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  onboardingSchema
} from "../utils/validation.schemas"

const router = Router()

/**
 * POST /api/auth/register
 * Register new user
 */
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  register
)

/**
 * POST /api/auth/login
 * Login existing user
 */
router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  login
)

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post(
  "/logout",
  authenticateToken,
  logout
)

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post("/refresh", refreshToken)

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get(
  "/me",
  authenticateToken,
  getMe
)

/**
 * PATCH /api/auth/profile
 * Update profile
 */
router.patch(
  "/profile",
  authenticateToken,
  validate(updateProfileSchema),
  updateProfile
)

/**
 * POST /api/auth/onboarding
 * Complete onboarding
 */
router.post(
  "/onboarding",
  authenticateToken,
  validate(onboardingSchema),
  completeOnboarding
)

export default router