// backend/src/routes/dailyTask.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"
import { getTodayTasks, completeTask } from "../controllers/dailyTask.controller"

const router = Router()

router.use(authenticateToken)

// GET /api/daily-tasks/today — full dashboard data (study + revision + pending)
router.get("/today", getTodayTasks)

// POST /api/daily-tasks/complete — mark a task completed
router.post("/complete", completeTask)

export default router