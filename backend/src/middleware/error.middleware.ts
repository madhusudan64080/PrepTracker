// backend/src/middleware/error.middleware.ts

import { Request, Response, NextFunction } from "express"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import { ZodError } from "zod"

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isDev = process.env.NODE_ENV !== "production"

  if (isDev) {
    console.error(err)
  }

  /* Mongoose Validation */
  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string> = {}

    Object.values(err.errors).forEach((e) => {
      errors[e.path] = e.message
    })

    return res.status(400).json({
      success: false,
      error: "Validation error",
      details: errors
    })
  }

  /* Invalid ObjectId */
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({
      success: false,
      error: "Invalid ID format"
    })
  }

  /* Duplicate key */
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]

    return res.status(409).json({
      success: false,
      error: `${field} already exists`
    })
  }

  /* JWT Errors */

  if (err instanceof jwt.TokenExpiredError) {
    return res.status(401).json({
      success: false,
      error: "Token expired"
    })
  }

  if (err instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({
      success: false,
      error: "Invalid token"
    })
  }

  /* Zod */

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: "Validation error"
    })
  }

  /* Unknown */

  return res.status(500).json({
    success: false,
    error: isDev ? err.message : "Internal server error"
  })
}