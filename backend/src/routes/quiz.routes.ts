// backend/src/routes/quiz.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"

import {
  getTopicQuiz,
  submitQuizAttempt,
  getQuizHistory,
  generateWeeklyRevisionQuiz
} from "../controllers/quiz.controller"

const router = Router()

router.use(authenticateToken)

// GET /api/quiz/topic/:topicId
router.get("/topic/:topicId", getTopicQuiz)

// POST /api/quiz/attempt
router.post("/attempt", submitQuizAttempt)

// POST /api/quiz/submit (legacy)
router.post("/submit", submitQuizAttempt)

// GET /api/quiz/history/:topicId
router.get("/history/:topicId", getQuizHistory)

// POST /api/quiz/weekly
router.post("/weekly", generateWeeklyRevisionQuiz)

export default router
