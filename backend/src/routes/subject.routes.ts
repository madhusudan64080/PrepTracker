// backend/src/routes/subject.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"
import { validate } from "../middleware/validate.middleware"

import {
  createSubjectSchema,
  updateSubjectSchema
} from "../utils/validation.schemas"

import {
  getAllSubjects,
  createSubject,
  getSubject,
  updateSubject,
  deleteSubject,
  reorderSubjects
} from "../controllers/subject.controller"

const router = Router()

router.use(authenticateToken)

router.get("/", getAllSubjects)

// Specific routes before parameterized ones
router.post("/reorder", reorderSubjects)

router.post("/", validate(createSubjectSchema), createSubject)

router.get("/:id", getSubject)

router.patch("/:id", validate(updateSubjectSchema), updateSubject)

router.delete("/:id", deleteSubject)

export default router
