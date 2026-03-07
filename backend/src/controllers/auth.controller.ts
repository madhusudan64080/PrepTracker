// backend/src/controllers/auth.controller.ts

import { Request, Response, NextFunction } from "express"
import User from "../models/User.model"
import DailyGoal from "../models/DailyGoal.model"
import ActivityLog from "../models/ActivityLog.model"

import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setCookieOptions
} from "../utils/jwt.utils"

/* ---------------------------
   REGISTER
--------------------------- */

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password } = req.body

    const existing = await User.findOne({ email })

    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Email already registered"
      })
    }

    const user = new User({
      name,
      email,
      passwordHash: password
    })

    const accessToken = generateAccessToken(user.id, user.email)

    const refreshToken = generateRefreshToken(user.id)

    if (user.refreshTokens.length >= 5) {
      user.refreshTokens.shift()
    }

    user.refreshTokens.push(refreshToken)

    await user.save()

    res.cookie("refreshToken", refreshToken, setCookieOptions())

    const userObj = user.toObject()

    delete (userObj as any).passwordHash
    delete (userObj as any).refreshTokens

    res.status(201).json({
      success: true,
      data: {
        user: userObj,
        accessToken
      }
    })
  } catch (error) {
    next(error)
  }
}

/* ---------------------------
   LOGIN
--------------------------- */

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      })
    }

    const valid = await user.comparePassword(password)

    if (!valid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials"
      })
    }

    const accessToken = generateAccessToken(user.id, user.email)

    const refreshToken = generateRefreshToken(user.id)

    if (user.refreshTokens.length >= 5) {
      user.refreshTokens.shift()
    }

    user.refreshTokens.push(refreshToken)

    await user.save()

    res.cookie("refreshToken", refreshToken, setCookieOptions())

    const userObj = user.toObject()

    delete (userObj as any).passwordHash
    delete (userObj as any).refreshTokens

    res.json({
      success: true,
      data: {
        user: userObj,
        accessToken
      }
    })
  } catch (error) {
    next(error)
  }
}

/* ---------------------------
   LOGOUT
--------------------------- */

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const refreshToken = req.cookies?.refreshToken

    if (refreshToken) {
      const payload = verifyRefreshToken(refreshToken)

      if (payload) {
        const user = await User.findById(payload.userId)

        if (user) {
  await User.findByIdAndUpdate(user.id, {
    $pull: { refreshTokens: refreshToken }
  })
  // no save() needed — findByIdAndUpdate already committed to DB
}
      }
    }

    res.clearCookie("refreshToken")

    res.json({
      success: true,
      message: "Logged out successfully"
    })
  } catch (error) {
    next(error)
  }
}

/* ---------------------------
   REFRESH TOKEN
--------------------------- */

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const oldToken = req.cookies?.refreshToken

    if (!oldToken) {
      return res.status(401).json({ success: false, error: "Missing refresh token" })
    }

    // ADD THIS — guard against missing JWT secret crashing the server
    if (!process.env.JWT_REFRESH_SECRET) {
      return res.status(500).json({ success: false, error: "Server misconfiguration" })
    }

    const payload = verifyRefreshToken(oldToken)

    if (!payload) {
      return res.status(401).json({
        success: false,
        error: "Invalid refresh token"
      })
    }

    const user = await User.findById(payload.userId)

    if (!user || !user.refreshTokens.includes(oldToken)) {
      return res.status(401).json({
        success: false,
        error: "Token reuse detected"
      })
    }

    const newRefresh = generateRefreshToken(user.id)

    await User.findByIdAndUpdate(user.id, {
      $pull: { refreshTokens: oldToken },
      $push: { refreshTokens: newRefresh }
    })

    const accessToken = generateAccessToken(user.id, user.email)

    res.cookie("refreshToken", newRefresh, setCookieOptions())

    res.json({
      success: true,
      data: { accessToken }
    })
  } catch (error) {
    next(error)
  }
}

/* ---------------------------
   GET CURRENT USER
--------------------------- */

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.user!.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      })
    }

    const userObj = user.toObject()

    delete (userObj as any).passwordHash
    delete (userObj as any).refreshTokens

    res.json({
      success: true,
      data: userObj
    })
  } catch (error) {
    next(error)
  }
}

/* ---------------------------
   UPDATE PROFILE
--------------------------- */

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const updates = req.body

    const user = await User.findById(req.user!.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      })
    }

    if (updates.name) user.name = updates.name
    if (updates.avatarUrl) user.avatarUrl = updates.avatarUrl

    if (updates.learningPreferences) {
      if (updates.learningPreferences.reminderTime)
        user.learningPreferences.reminderTime =
          updates.learningPreferences.reminderTime

      if (updates.learningPreferences.dailyGoalMinutes)
        user.learningPreferences.dailyGoalMinutes =
          updates.learningPreferences.dailyGoalMinutes
    }

    await user.save()

    const userObj = user.toObject()

    delete (userObj as any).passwordHash
    delete (userObj as any).refreshTokens

    res.json({
      success: true,
      data: userObj
    })
  } catch (error) {
    next(error)
  }
}

/* ---------------------------
   COMPLETE ONBOARDING
--------------------------- */

export async function completeOnboarding(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { reminderTime, dailyGoalTargets } = req.body

    const user = await User.findById(req.user!.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found"
      })
    }

    user.onboardingCompleted = true

    user.learningPreferences.reminderTime = reminderTime

    await user.save()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await DailyGoal.create({
      userId: user.id,
      date: today,
      targets: dailyGoalTargets
    })

    await ActivityLog.create({
      userId: user.id,
      type: "goal_completed",
      entityName: "onboarding_completed"
    })

    const userObj = user.toObject()

    delete (userObj as any).passwordHash
    delete (userObj as any).refreshTokens

    res.json({
      success: true,
      data: userObj
    })
  } catch (error) {
    next(error)
  }
}