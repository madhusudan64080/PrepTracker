// backend/src/routes/notes.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"

import {
  getNote,
  saveNote
} from "../controllers/notes.controller"

const router = Router()

router.use(authenticateToken)

/**
 * GET note for topic
 */
router.get("/:topicId", getNote)

/**
 * Save note
 */
router.put("/:topicId", saveNote)

export default router
