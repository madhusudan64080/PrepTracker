// backend/src/routes/analytics.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"
import {
  getOverview,
  getHeatmap,
  getSubjectAnalytics,
  getCodingProgress,
  getQuizTrend
} from "../controllers/analytics.controller"

const router = Router()

router.use(authenticateToken)

router.get("/overview", getOverview)
router.get("/heatmap", getHeatmap)
router.get("/subjects", getSubjectAnalytics)
router.get("/coding-progress", getCodingProgress)
router.get("/quiz-trend", getQuizTrend)

export default router
