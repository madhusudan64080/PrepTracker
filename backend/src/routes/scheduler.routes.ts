// backend/src/routes/scheduler.routes.ts
//
// FIX (Issue 2 — Scheduler 400):
//   Added validate(createScheduleSchema) to the POST route so the server
//   returns a clear 400 with field-level errors when the payload is invalid,
//   instead of crashing in the controller with an obscure error.

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"
import { validate } from "../middleware/validate.middleware"
import {
  getSchedules,
  createSchedule,
  deleteSchedule,
  getTodaySchedule
} from "../controllers/scheduler.controller"
import { createScheduleSchema } from "../utils/validation.schemas"

const router = Router()

router.use(authenticateToken)

router.get("/",       getSchedules)
router.get("/today",  getTodaySchedule)
router.post("/",      validate(createScheduleSchema), createSchedule)
router.delete("/:id", deleteSchedule)

export default router