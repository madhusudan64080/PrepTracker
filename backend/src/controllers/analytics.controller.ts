// backend/src/controllers/analytics.controller.ts

import { Request, Response, NextFunction } from "express"
import analyticsService from "../services/analytics.service"

export async function getOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getOverview(req.user!.userId)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export async function getHeatmap(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getHeatmap(req.user!.userId)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export async function getSubjectAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getSubjectAnalytics(req.user!.userId)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export async function getCodingProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getCodingProgress(req.user!.userId)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}

export async function getQuizTrend(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getQuizTrend(req.user!.userId)
    res.json({ success: true, data })
  } catch (err) { next(err) }
}
