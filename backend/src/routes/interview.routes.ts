// backend/src/routes/interview.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"

import {
<<<<<<< HEAD
getInterviewQuestions,
revealAnswer,
submitInterviewSession,
getInterviewHistory
=======
  getInterviewQuestions,
  revealAnswer,
  generateCompanyInterviewQuestions,
  submitInterviewSession,
  getInterviewHistory
>>>>>>> 48fc2b9 (Updated full project with new content)
} from "../controllers/interview.controller"

const router = Router()

router.use(authenticateToken)

router.get("/questions", getInterviewQuestions)
router.get("/questions/:questionId/answer", revealAnswer)
<<<<<<< HEAD
router.post("/session", submitInterviewSession)
router.get("/history", getInterviewHistory)

export default router
=======
// FIX: generateCompanyInterviewQuestions existed in the controller but was
// never registered on a route. Frontend calls POST /api/interview/company-questions
// which was returning 404 every time the Interview page tried to fetch
// company-specific questions.
router.post("/company-questions", generateCompanyInterviewQuestions)
router.post("/session", submitInterviewSession)
router.get("/history", getInterviewHistory)

export default router
>>>>>>> 48fc2b9 (Updated full project with new content)
