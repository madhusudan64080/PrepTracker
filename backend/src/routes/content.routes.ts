// backend/src/routes/content.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"
import {
  getTopicContent,
  generateTopicContent,
  getAvailableMethods,
  regenerateTopicContent,
  getProjectStageContent,
  getCodingHints
} from "../controllers/content.controller"

const router = Router()

router.use(authenticateToken)

// Learning method selection + content fetch
router.get("/topic/:id/methods", getAvailableMethods)
router.get("/topic/:id", getTopicContent)                  // ?method=topic_explanation
router.post("/topic/:id/generate", generateTopicContent)   // body: { method }
router.post("/topic/:id/regenerate", regenerateTopicContent)

// Project stage content
router.get("/project/:projectId/stage/:stageNumber", getProjectStageContent)

// Coding hints
router.get("/coding/:id/hints", getCodingHints)

export default router
