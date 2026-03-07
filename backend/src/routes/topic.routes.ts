// backend/src/routes/topic.routes.ts

import { Router } from "express"

import { authenticateToken } from "../middleware/auth.middleware"
import { validate } from "../middleware/validate.middleware"

import {
  createTopicSchema,
  bulkCreateTopicsSchema,
  updateProgressSchema
} from "../utils/validation.schemas"

import {
  getTopicsBySubject,
  createTopic,
  bulkCreateTopics,
  updateTopic,
  reorderTopics,
  deleteTopic,
  updateTopicProgress,
  completeTopic,
  getTopicById,
  getTopicContent
} from "../controllers/topic.controller"

const router = Router()

// Protect all routes
router.use(authenticateToken)

router.post("/bulk", validate(bulkCreateTopicsSchema), bulkCreateTopics)
router.post("/reorder", reorderTopics)

router.get("/", getTopicsBySubject)
router.post("/", validate(createTopicSchema), createTopic)

router.get("/:id", getTopicById)

/*
This route triggers AI ONLY after the user selects the learning method
*/
router.post("/:id/content", getTopicContent)

router.patch("/:id", updateTopic)
router.delete("/:id", deleteTopic)

router.patch("/:id/progress", validate(updateProgressSchema), updateTopicProgress)

router.post("/:id/complete", completeTopic)

export default router