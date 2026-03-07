// backend/src/routes/interview.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"

import {
getInterviewQuestions,
revealAnswer,
submitInterviewSession,
getInterviewHistory
} from "../controllers/interview.controller"

const router = Router()

router.use(authenticateToken)

router.get("/questions", getInterviewQuestions)
router.get("/questions/:questionId/answer", revealAnswer)
router.post("/session", submitInterviewSession)
router.get("/history", getInterviewHistory)

export default router