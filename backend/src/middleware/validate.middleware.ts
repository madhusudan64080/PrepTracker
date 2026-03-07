// backend/src/middleware/validate.middleware.ts

import { Request, Response, NextFunction } from "express"
import { ZodSchema, ZodError } from "zod"

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body)
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {}

        error.errors.forEach((err) => {
          const field = err.path.join(".")
          fieldErrors[field] = err.message
        })

        return res.status(400).json({
          success: false,
          error: "Validation failed",
          details: fieldErrors
        })
      }

      next(error)
    }
  }
}