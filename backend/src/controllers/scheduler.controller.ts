// backend/src/controllers/scheduler.controller.ts

import { Request, Response, NextFunction } from "express"
import StudySchedule from "../models/StudySchedule.model"
import Subject from "../models/Subject.model"
import Topic from "../models/Topic.model"
import ActivityLog from "../models/ActivityLog.model"

const FREQ_DAYS: Record<string, number> = {
  daily:        1,
  every_2_days: 2,
  every_3_days: 3,
  weekly:       7
}

function calcNextDue(frequency: string): Date {
  const next = new Date()
  next.setDate(next.getDate() + (FREQ_DAYS[frequency] ?? 1))
  next.setHours(9, 0, 0, 0)
  return next
}

/* ── GET all schedules for user ── */
export async function getSchedules(req: Request, res: Response, next: NextFunction) {
  try {
    const schedules = await StudySchedule.find({ userId: req.user!.userId })
      .sort({ createdAt: -1 })
    res.json({ success: true, data: schedules })
  } catch (err) { next(err) }
}

/* ── CREATE / UPSERT a schedule ── */
export async function createSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const { subjectId, frequency, topicsPerDay } = req.body

    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user!.userId
    })

    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" })
    }

    const existing = await StudySchedule.findOne({
      userId: req.user!.userId,
      subjectId
    })

    const nextDue = calcNextDue(frequency)

    if (existing) {
      existing.frequency    = frequency
      existing.topicsPerDay = topicsPerDay
      existing.active       = true
      existing.nextDue      = nextDue
      await existing.save()
      return res.json({ success: true, data: existing })
    }

    const schedule = await StudySchedule.create({
      userId:      req.user!.userId,
      subjectId,
      subjectName: subject.name,
      frequency,
      topicsPerDay,
      nextDue
    })

    try {
  await ActivityLog.create({
    userId: req.user!.userId,
    type: "schedule_created",
    entityName: subject.name,
    description: `Scheduled ${subject.name} — ${frequency.replace(/_/g, " ")}, ${topicsPerDay} topics/day`
  })
} catch (logErr) {
  console.warn("ActivityLog write failed (non-fatal):", logErr)
}

res.status(201).json({ success: true, data: schedule })
  } catch (err) { next(err) }
}

/* ── DELETE / deactivate a schedule ── */
export async function deleteSchedule(req: Request, res: Response, next: NextFunction) {
  try {
    await StudySchedule.deleteOne({
      _id: req.params.id,
      userId: req.user!.userId
    })
    res.json({ success: true })
  } catch (err) { next(err) }
}

/* ── GET today's scheduled topics across all active schedules ── */
export async function getTodaySchedule(req: Request, res: Response, next: NextFunction) {
  try {
    const schedules = await StudySchedule.find({
      userId: req.user!.userId,
      active: true
    })

    const result = await Promise.all(
      schedules.map(async (sched) => {
        // Get pending/in-progress topics for this subject
        const pending = await Topic.find({
          subjectId: sched.subjectId,
          userId:    req.user!.userId,
          status:    { $in: ["not_started", "in_progress"] }
        })
          .sort({ order: 1 })
          .limit(sched.topicsPerDay)

        const completed = await Topic.find({
          subjectId: sched.subjectId,
          userId:    req.user!.userId,
          status:    "completed"
        }).countDocuments()

        const total = await Topic.find({
          subjectId: sched.subjectId,
          userId:    req.user!.userId
        }).countDocuments()

        return {
          scheduleId:   sched._id,
          subjectId:    sched.subjectId,
          subjectName:  sched.subjectName,
          frequency:    sched.frequency,
          topicsPerDay: sched.topicsPerDay,
          nextDue:      sched.nextDue,
          todayTopics:  pending,
          completed,
          total
        }
      })
    )

    res.json({ success: true, data: result })
  } catch (err) { next(err) }
}
