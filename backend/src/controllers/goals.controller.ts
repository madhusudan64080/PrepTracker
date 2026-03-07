// backend/src/controllers/goals.controller.ts
//
// FIX (Issue 3 — Dashboard shows all 0%):
//
// Root cause 1: completionPercentage was being saved back to the DB via
//   goal.save() AFTER computing percentages, but `goal` is already a mongoose
//   document fetched with findOne().  Any $inc operations done elsewhere
//   (completeTopic, completeRevision, updateProblem) update the DB but this
//   controller was recalculating from a stale in-memory snapshot.
//   Fix: always re-fetch the goal from DB before computing percentages.
//
// Root cause 2: The percentage object returned to the frontend used key names
//   that didn't match what useDailyGoal.ts reads:
//     returned:  { topics, problems, revision, study, time }
//     hook reads: { topics, problems, revision, time }
//   `study` was duplicated as `time`; the hook uses `time` for studyMinutes.
//   Fix: unify to { topics, problems, revision, time }.
//
// Root cause 3: logStudyTime didn't guard against the DailyGoal not existing
//   (upsert was false), so goals created mid-day would never receive study
//   minutes logged before they existed.
//   Fix: add { upsert: true } to the logStudyTime update.

import { Request, Response, NextFunction } from "express"
import DailyGoal from "../models/DailyGoal.model"
import User from "../models/User.model"
import streakService from "../services/streak.service"

function todayStart(): Date {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function clamp(n: number): number {
  return Math.min(Math.max(n, 0), 100)
}

/* ── GET today's goal ─────────────────────────────────────────────────────── */

export async function getTodayGoal(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user!.userId
    const today  = todayStart()

    // FIX: ensure goal exists (create with user's preferred targets if missing)
    let goal = await DailyGoal.findOne({ userId, date: today })

    if (!goal) {
      const user = await User.findById(userId)

      goal = await DailyGoal.create({
        userId,
        date: today,
        targets: {
          topicsToLearn:   3,
          problemsToSolve: 5,
          revisionTopics:  2,
          studyMinutes:    user?.learningPreferences?.dailyGoalMinutes || 90
        }
      })
    }

    // FIX: Re-fetch to get the latest achieved values (other controllers may
    // have incremented them after this document was first created today).
    const freshGoal = await DailyGoal.findOne({ userId, date: today })!

    // Guard against zero targets to avoid NaN
    const safeTarget = (n: number) => Math.max(n, 1)

    const percentages = {
      topics:   clamp((freshGoal!.achieved.topicsLearned   / safeTarget(freshGoal!.targets.topicsToLearn))   * 100),
      problems: clamp((freshGoal!.achieved.problemsSolved  / safeTarget(freshGoal!.targets.problemsToSolve)) * 100),
      revision: clamp((freshGoal!.achieved.revisionDone    / safeTarget(freshGoal!.targets.revisionTopics))  * 100),
      // FIX: use key "time" consistently (useDailyGoal reads individualPercentages.time)
      time:     clamp((freshGoal!.achieved.studyMinutes    / safeTarget(freshGoal!.targets.studyMinutes))    * 100)
    }

    const completion = (
      percentages.topics +
      percentages.problems +
      percentages.revision +
      percentages.time
    ) / 4

    // Persist the computed completionPercentage
    await DailyGoal.findOneAndUpdate(
      { userId, date: today },
      { $set: { completionPercentage: Math.round(completion) } }
    )

    res.json({
      success: true,
      data: {
        ...freshGoal!.toObject(),
        completionPercentage: Math.round(completion)
      },
      meta: {
        isComplete: completion >= 100,
        percentages       // { topics, problems, revision, time }
      }
    })

  } catch (err) {
    next(err)
  }
}

/* ── SET today's goal targets ─────────────────────────────────────────────── */

export async function setTodayGoal(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const goal = await DailyGoal.findOneAndUpdate(
      { userId: req.user!.userId, date: todayStart() },
      { $set: { targets: req.body.targets } },
      { upsert: true, new: true }
    )

    res.json({ success: true, data: goal })
  } catch (err) {
    next(err)
  }
}

/* ── LOG study time ───────────────────────────────────────────────────────── */

export async function logStudyTime(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { minutes } = req.body

    // FIX: add upsert:true so this works even if the goal doesn't exist yet
    const goal = await DailyGoal.findOneAndUpdate(
      { userId: req.user!.userId, date: todayStart() },
      { $inc: { "achieved.studyMinutes": minutes } },
      { new: true, upsert: true }
    )

    await streakService.updateStreak(req.user!.userId)

    res.json({ success: true, data: goal })
  } catch (err) {
    next(err)
  }
}