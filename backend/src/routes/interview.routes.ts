// backend/src/routes/interview.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"

import {
  getInterviewQuestions,
  revealAnswer,
  generateCompanyInterviewQuestions,
  submitInterviewSession,
  getInterviewHistory
} from "../controllers/interview.controller"

const router = Router()

router.use(authenticateToken)

router.get("/questions", getInterviewQuestions)
router.get("/questions/:questionId/answer", revealAnswer)
// FIX: generateCompanyInterviewQuestions existed in the controller but was
// never registered on a route. Frontend calls POST /api/interview/company-questions
// which was returning 404 every time the Interview page tried to fetch
// company-specific questions.
router.post("/company-questions", generateCompanyInterviewQuestions)
router.post("/session", submitInterviewSession)
router.get("/history", getInterviewHistory)

export default router
