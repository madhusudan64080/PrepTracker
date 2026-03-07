// backend/src/routes/project.routes.ts

import { Router } from "express"
import { authenticateToken } from "../middleware/auth.middleware"

import {
createProject,
getProjects,
getProject,
getStageContent,
completeStage,
deleteProject
} from "../controllers/project.controller"

const router = Router()

router.use(authenticateToken)

router.post("/", createProject)
router.get("/", getProjects)
router.get("/:id", getProject)
router.get("/:id/stages/:stageNumber", getStageContent)
router.post("/:id/stages/:stageNumber/complete", completeStage)
router.delete("/:id", deleteProject)

export default router