// backend/src/routes/contest.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"

import {
  getContests,
  createContest,
  updateContest,
  deleteContest,
  getContestStats
} from "../controllers/contest.controller"

const router = Router()

router.use(authenticateToken)

/**
 * Contest CRUD
 */

router.get("/", getContests)

router.post("/", createContest)

router.put("/:id", updateContest)

router.delete("/:id", deleteContest)

/**
 * Contest stats
 */

router.get("/stats/overview", getContestStats)

export default router