// backend/src/routes/dailyTask.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"
import { getTodayTasks, completeTask, getOverdueTasks } from "../controllers/dailyTask.controller"

const router = Router()

router.use(authenticateToken)

// GET /api/daily-tasks/today — full dashboard data (study + revision + pending)
router.get("/today", getTodayTasks)

// GET /api/daily-tasks/overdue — overdue tasks for delay notification system
router.get("/overdue", getOverdueTasks)

// POST /api/daily-tasks/complete — mark a task completed
router.post("/complete", completeTask)

export default router
