// backend/src/controllers/dailyTask.controller.ts

import { Request, Response, NextFunction } from "express"
import dailyTaskService from "../services/dailyTask.service"

/* ── GET today's full task breakdown ──────────────────────────────────────── */

export async function getTodayTasks(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await dailyTaskService.getTodayTasks(req.user!.userId)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

/* ── COMPLETE a specific task ─────────────────────────────────────────────── */

export async function completeTask(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { topicId, taskType, revisionCycle } = req.body

    if (!topicId || !taskType) {
      return res
        .status(400)
        .json({ success: false, error: "topicId and taskType are required" })
    }

    await dailyTaskService.completeTask(
      req.user!.userId,
      topicId,
      taskType,
      revisionCycle
    )

    // Return fresh task data so client can update immediately
    const data = await dailyTaskService.getTodayTasks(req.user!.userId)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}

/* ── GET overdue tasks — used by the delay notification system ────────────── */

export async function getOverdueTasks(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const data = await dailyTaskService.getOverdueTasks(req.user!.userId)
    res.json({ success: true, data })
  } catch (err) {
    next(err)
  }
}
