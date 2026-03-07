// backend/src/middleware/ownership.middleware.ts

import { Request, Response, NextFunction } from "express"
import Subject from "../models/Subject.model"
import Topic from "../models/Topic.model"
import Project from "../models/Project.model"
import CodingProblem from "../models/CodingProblem.model"

export async function checkSubjectOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const subject = await Subject.findById(req.params.id)

  if (!subject) {
    return res.status(404).json({ success: false, error: "Subject not found" })
  }

  if (subject.userId.toString() !== req.user!.userId) {
    return res.status(403).json({ success: false, error: "Forbidden" })
  }

  next()
}

export async function checkTopicOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const topic = await Topic.findById(req.params.id)

  if (!topic) {
    return res.status(404).json({ success: false, error: "Topic not found" })
  }

  if (topic.userId.toString() !== req.user!.userId) {
    return res.status(403).json({ success: false, error: "Forbidden" })
  }

  next()
}

export async function checkProjectOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const project = await Project.findById(req.params.id)

  if (!project) {
    return res.status(404).json({ success: false, error: "Project not found" })
  }

  if (project.userId.toString() !== req.user!.userId) {
    return res.status(403).json({ success: false, error: "Forbidden" })
  }

  next()
}

export async function checkCodingProblemOwnership(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const problem = await CodingProblem.findById(req.params.id)

  if (!problem) {
    return res.status(404).json({
      success: false,
      error: "Coding problem not found"
    })
  }

  if (problem.userId.toString() !== req.user!.userId) {
    return res.status(403).json({
      success: false,
      error: "Forbidden"
    })
  }

  next()
}
