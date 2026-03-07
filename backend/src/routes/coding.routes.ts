// backend/src/routes/coding.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"

import {
  getProblems,
  createProblem,
  updateProblem,
  deleteProblem,
  addAttempt,
  getAiHints,
  getStats
} from "../controllers/coding.controller"

const router = Router()

router.use(authenticateToken)

router.get("/stats", getStats)
router.get("/", getProblems)
router.post("/", createProblem)
router.patch("/:id", updateProblem)
router.delete("/:id", deleteProblem)
router.post("/:id/attempt", addAttempt)
router.get("/:id/hints", getAiHints)

export default router
