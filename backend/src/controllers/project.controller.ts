// backend/src/controllers/project.controller.ts

import { Request, Response, NextFunction } from "express"
import Project from "../models/Project.model"
import ProjectStageContent from "../models/ProjectStageContent.model"
import DailyGoal from "../models/DailyGoal.model"
import ActivityLog from "../models/ActivityLog.model"

import contentService from "../services/content.service"
import streakService from "../services/streak.service"

const stageTemplate = [
  "Problem Understanding",
  "System Architecture Design",
  "Feature & Module Breakdown",
  "Database Schema Design",
  "UI/UX Design Breakdown",
  "Step-by-Step Implementation",
  "Testing Strategy",
  "Deployment Guide",
  "Interview Preparation"
]

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {

    const stages = stageTemplate.map((name, i) => ({
      stageNumber: i + 1,
      stageName: name,
      description: "",
      estimatedHours: 4,
      status: i === 0 ? "available" : "locked"
    }))

    const project = await Project.create({
      ...req.body,
      userId: req.user!.userId,
      stages,
      aiContentGenerated: false
    })

    setImmediate(() =>
      contentService.getProjectStageContent(
        project._id.toString(),
        1,
        project
      )
    )

    res.status(201).json({ success: true, data: project })

  } catch (err) {
    next(err)
  }
}

export async function getProjects(req: Request, res: Response, next: NextFunction) {
  try {

    const projects = await Project.find({ userId: req.user!.userId }).sort({ updatedAt: -1 })

    const formatted = projects.map((p: any) => {

      const completed = p.stages.filter((s: any) => s.status === "completed").length
      const completionPercentage = Math.round((completed / 9) * 100)

      return {
        ...p.toObject(),
        completionPercentage
      }
    })

    res.json({ success: true, data: formatted })

  } catch (err) {
    next(err)
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {

    const project = await Project.findOne({
      _id: req.params.id,
      userId: req.user!.userId
    })

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" })
    }

    const stageContents = await ProjectStageContent.find({
      projectId: project._id
    })

    const stageMap = new Map(stageContents.map(s => [s.stageNumber, true]))

    const stages = project.stages.map((s: any) => ({
      ...s.toObject(),
      contentCached: stageMap.has(s.stageNumber)
    }))

    res.json({
      success: true,
      data: {
        ...project.toObject(),
        stages
      }
    })

  } catch (err) {
    next(err)
  }
}

export async function getStageContent(req: Request, res: Response, next: NextFunction) {
  try {

    const { id, stageNumber } = req.params

    const project = await Project.findOne({
      _id: id,
      userId: req.user!.userId
    })

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" })
    }

    const stage = project.stages.find((s: any) => s.stageNumber === Number(stageNumber))

    if (!stage || stage.status === "locked") {
      return res.status(403).json({ success: false, error: "Stage locked" })
    }

    const content = await contentService.getProjectStageContent(
      id,
      Number(stageNumber),
      project
    )

    res.json({ success: true, data: content })

  } catch (err) {
    next(err)
  }
}

export async function completeStage(req: Request, res: Response, next: NextFunction) {
  try {

    const { id, stageNumber } = req.params

    const project = await Project.findOne({
      _id: id,
      userId: req.user!.userId
    })

    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" })
    }

    const stage = project.stages.find((s: any) => s.stageNumber === Number(stageNumber))
    if (!stage) return res.status(404).json({ message: "Stage not found" })

    stage.status = "completed"
    stage.completedAt = new Date()

    const nextStage = project.stages.find(
      (s: any) => s.stageNumber === Number(stageNumber) + 1
    )

    if (nextStage && nextStage.status === "locked") {
      nextStage.status = "available"

      setImmediate(() =>
        contentService.getProjectStageContent(
          project._id.toString(),
          nextStage.stageNumber,
          project
        )
      )
    }

    const completed = project.stages.filter((s: any) => s.status === "completed").length
    project.completionPercentage = Math.round((completed / 9) * 100)

    if (completed === 9) {
      project.status = "completed"
    }

    await project.save()

    await streakService.updateStreak(req.user!.userId)

    await ActivityLog.create({
      userId: req.user!.userId,
      type: "project_stage_done",
      entityId: project._id
    })

    res.json({ success: true, data: project })

  } catch (err) {
    next(err)
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {

    await ProjectStageContent.deleteMany({ projectId: req.params.id })

    await Project.deleteOne({
      _id: req.params.id,
      userId: req.user!.userId
    })

    res.json({ success: true, message: "Project deleted" })

  } catch (err) {
    next(err)
  }
}