// backend/src/routes/goal.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"
import {
  getTodayGoal,
  setTodayGoal,
  logStudyTime
} from "../controllers/goals.controller"

const router = Router()

router.use(authenticateToken)

router.get("/today", getTodayGoal)

router.post("/set", setTodayGoal)

router.post("/log", logStudyTime)

export default router
