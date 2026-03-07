// backend/src/controllers/contest.controller.ts

import { Request, Response, NextFunction } from "express"
import ContestLog from "../models/ContestLog.model"

/**
 * GET /api/contests
 */
export async function getContests(req: Request, res: Response, next: NextFunction) {
  try {

    const contests = await ContestLog.find({
      userId: req.user!.userId
    }).sort({ date: -1 })

    res.json({
      success: true,
      data: contests
    })

  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/contests
 */
export async function createContest(req: Request, res: Response, next: NextFunction) {
  try {

    const contest = await ContestLog.create({
      ...req.body,
      userId: req.user!.userId
    })

    res.status(201).json({
      success: true,
      data: contest
    })

  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/contests/:id
 */
export async function updateContest(req: Request, res: Response, next: NextFunction) {
  try {

    const contest = await ContestLog.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user!.userId
      },
      req.body,
      { new: true }
    )

    if (!contest) {
      return res.status(404).json({
        success: false,
        error: "Contest not found"
      })
    }

    res.json({
      success: true,
      data: contest
    })

  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/contests/:id
 */
export async function deleteContest(req: Request, res: Response, next: NextFunction) {
  try {

    await ContestLog.deleteOne({
      _id: req.params.id,
      userId: req.user!.userId
    })

    res.json({
      success: true,
      message: "Contest deleted"
    })

  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/contests/stats
 */
export async function getContestStats(req: Request, res: Response, next: NextFunction) {
  try {

    const contests = await ContestLog.find({
      userId: req.user!.userId
    })

    const total = contests.length

    const avgRank =
      contests.reduce((sum, c) => sum + (c.rank || 0), 0) /
      Math.max(total, 1)

    const bestRank = Math.min(...contests.map(c => c.rank || Infinity))

    const ratingTrend = contests.map(c => ({
      date: c.date,
      ratingChange: c.ratingChange || 0
    }))

    res.json({
      success: true,
      data: {
        total,
        avgRank: Math.round(avgRank),
        bestRank,
        ratingTrend
      }
    })

  } catch (err) {
    next(err)
  }
}