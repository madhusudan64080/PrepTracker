// backend/src/middleware/auth.middleware.ts

import { Request, Response, NextFunction } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"

interface AuthPayload extends JwtPayload {
  userId: string
  email: string
}

export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      error: "No token",
      code: "NO_TOKEN"
    })
  }

  const token = authHeader.split(" ")[1]

  try {
    const decoded = jwt.verify(
      token,
      (process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET) as string
    ) as AuthPayload

    req.user = {
      userId: decoded.userId,
      email: decoded.email
    }

    next()
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expired",
        code: "TOKEN_EXPIRED"
      })
    }

    return res.status(401).json({
      success: false,
      error: "Invalid token",
      code: "INVALID_TOKEN"
    })
  }
}

/* -------------------------
   Extend Express Request
-------------------------- */

declare module "express-serve-static-core" {
  interface Request {
    user?: {
      userId: string
      email: string
    }
  }
}