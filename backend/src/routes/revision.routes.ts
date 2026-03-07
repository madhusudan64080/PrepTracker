// backend/src/routes/revision.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"

import {
  todaysRevisions,
  completeRevision,
  revisionCalendar,
  weeklySummary,
  weeklyQuiz,
  overdueRevisions,
  revisionSchedule
} from "../controllers/revision.controller"

const router = Router()

router.use(authenticateToken)

router.get("/today", todaysRevisions)
router.get("/overdue", overdueRevisions)
router.get("/schedule", revisionSchedule)
router.get("/calendar", revisionCalendar)
router.get("/weekly-summary", weeklySummary)
router.get("/weekly-quiz", weeklyQuiz)
router.post("/:topicId/complete", completeRevision)
router.post("/complete", completeRevision)

export default router
