// backend/src/services/dailyTask.service.ts
//
// Orchestrates all three Today's Goals task types:
//   1. Study tasks   — topics due today per StudyScheduler frequency
//   2. Revision tasks— same-day / 2-day / weekly spaced repetition
//   3. Pending tasks — unfinished study/revision from previous days

import mongoose from "mongoose"
import DailyTask, { IDailyTask } from "../models/DailyTask.model"
import StudySchedule from "../models/StudySchedule.model"
import Topic from "../models/Topic.model"
import Subject from "../models/Subject.model"
import ActivityLog from "../models/ActivityLog.model"

/* ─── helpers ─────────────────────────────────────────────────────────────── */

/** UTC midnight for a given date (or today) */
function dayStart(d?: Date): Date {
  const out = d ? new Date(d) : new Date()
  out.setUTCHours(0, 0, 0, 0)
  return out
}

function dayEnd(d?: Date): Date {
  const out = d ? new Date(d) : new Date()
  out.setUTCHours(23, 59, 59, 999)
  return out
}

/** Add N calendar days to a date */
function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** How many full days separate two UTC-midnights */
function daysBetween(a: Date, b: Date): number {
  const ms = dayStart(b).getTime() - dayStart(a).getTime()
  return Math.round(ms / 86_400_000)
}

/** Monday of the ISO week containing `date` */
function weekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getUTCDay() // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day  // shift to Monday
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/* ══════════════════════════════════════════════════════════════════════════
   FREQUENCY CHECK — is today a scheduled study day for this schedule?
══════════════════════════════════════════════════════════════════════════ */

const FREQ_DAYS: Record<string, number> = {
  daily:        1,
  every_2_days: 2,
  every_3_days: 3,
  weekly:       7
}

function isScheduledToday(schedule: any): boolean {
  const intervalDays = FREQ_DAYS[schedule.frequency] ?? 1
  if (intervalDays === 1) return true              // daily — always yes

  const start = dayStart(schedule.startDate ?? schedule.createdAt)
  const today = dayStart()
  const elapsed = daysBetween(start, today)

  return elapsed >= 0 && elapsed % intervalDays === 0
}

/* ══════════════════════════════════════════════════════════════════════════
   GENERATE STUDY TASKS for today
══════════════════════════════════════════════════════════════════════════ */

async function generateStudyTasks(userId: string): Promise<void> {
  const today = dayStart()

  const schedules = await StudySchedule.find({ userId, active: true })

  for (const sched of schedules) {
    if (!isScheduledToday(sched)) continue

    // Find next N incomplete topics (not_started or in_progress) ordered by `order`
    const topics = await Topic.find({
      subjectId: sched.subjectId,
      userId,
      status: { $in: ["not_started", "in_progress"] }
    })
      .sort({ order: 1 })
      .limit(sched.topicsPerDay)
      .lean()

    for (const topic of topics) {
      try {
        await DailyTask.updateOne(
          {
            userId,
            topicId: topic._id,
            date:    today,
            taskType: "study"
          },
          {
            $setOnInsert: {
              userId,
              topicId:   topic._id,
              subjectId: topic.subjectId,
              date:      today,
              taskType:  "study",
              status:    "pending"
            }
          },
          { upsert: true }
        )
      } catch (e: any) {
        // Ignore duplicate key (task already exists)
        if (e.code !== 11000) throw e
      }
    }
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   GENERATE REVISION TASKS when a topic is completed
   Called by topic.controller.ts → completeTopic
══════════════════════════════════════════════════════════════════════════ */

export async function scheduleRevisions(
  userId: string,
  topicId: string,
  subjectId: string,
  studyDate?: Date
): Promise<void> {
  const studyDay = dayStart(studyDate)

  const safeUpsert = async (
    date: Date,
    revisionCycle: "same_day" | "two_day" | "weekly"
  ) => {
    try {
      await DailyTask.updateOne(
        { userId, topicId, date, taskType: "revision", revisionCycle },
        {
          $setOnInsert: {
            userId,
            topicId,
            subjectId,
            date,
            taskType:      "revision",
            revisionCycle,
            originStudyDate: studyDay,
            status:        "pending"
          }
        },
        { upsert: true }
      )
    } catch (e: any) {
      if (e.code !== 11000) throw e
    }
  }

  // 1. Same-day revision — same calendar day
  await safeUpsert(studyDay, "same_day")

  // 2. Two-day revision — 2 days after the study day
  await safeUpsert(dayStart(addDays(studyDay, 2)), "two_day")

  // 3. Weekly revision — Saturday of the same ISO week as study day
  //    (Saturday = Monday + 5 days)
  const weekMon = weekStart(studyDay)
  const weekSat = dayStart(addDays(weekMon, 5))
  // If study day IS Saturday or later, push to next Saturday
  const targetSat = studyDay >= weekSat
    ? dayStart(addDays(weekSat, 7))
    : weekSat
  await safeUpsert(targetSat, "weekly")
}

/* ══════════════════════════════════════════════════════════════════════════
   GENERATE PENDING TASKS — carry forward yesterday's incomplete tasks
   (run this when fetching today's tasks)
══════════════════════════════════════════════════════════════════════════ */

async function generatePendingTasks(userId: string): Promise<void> {
  const today = dayStart()
  const yesterday = dayStart(addDays(today, -1))

  // Look for all incomplete tasks older than today (up to 30 days back)
  const cutoff = dayStart(addDays(today, -30))

  const incomplete = await DailyTask.find({
    userId,
    date:     { $gte: cutoff, $lt: today },
    status:   "pending",
    taskType: { $in: ["study", "revision"] }
  }).lean()

  for (const task of incomplete) {
    try {
      await DailyTask.updateOne(
        {
          userId,
          topicId:      task.topicId,
          date:         today,
          taskType:     "pending",
          // Use revisionCycle as part of identity for revision-sourced pending
          revisionCycle: task.revisionCycle
        },
        {
          $setOnInsert: {
            userId,
            topicId:        task.topicId,
            subjectId:      task.subjectId,
            date:           today,
            taskType:       "pending",
            revisionCycle:  task.revisionCycle,
            originStudyDate: task.originStudyDate,
            status:         "pending"
          }
        },
        { upsert: true }
      )
    } catch (e: any) {
      if (e.code !== 11000) throw e
    }
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   COMPLETE A TASK
══════════════════════════════════════════════════════════════════════════ */

export async function completeTask(
  userId: string,
  topicId: string,
  taskType: string,
  revisionCycle?: string
): Promise<void> {
  const today = dayStart()

  const filter: any = { userId, topicId, taskType }

  // For revision tasks filter by cycle if provided
  if (taskType === "revision" && revisionCycle) {
    filter.revisionCycle = revisionCycle
  }

  // Complete all matching tasks for today that are still pending
  await DailyTask.updateMany(
    { ...filter, date: today, status: "pending" },
    { $set: { status: "completed", completedAt: new Date() } }
  )

  // Also complete the same-day pending task if this is a study completion
  if (taskType === "study") {
    await DailyTask.updateMany(
      { userId, topicId, date: today, taskType: "pending", status: "pending" },
      { $set: { status: "completed", completedAt: new Date() } }
    )
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   FETCH TODAY'S TASK DASHBOARD
   Returns grouped-by-subject data for all three sections
══════════════════════════════════════════════════════════════════════════ */

interface TaskTopic {
  topicId:      string
  topicName:    string
  status:       string
  revisionCycle?: string
}

interface SubjectTaskGroup {
  subjectId:   string
  subjectName: string
  subjectColor: string
  subjectIcon: string
  topics:      TaskTopic[]
}

export interface TodayTasksResult {
  study:   SubjectTaskGroup[]
  revision: SubjectTaskGroup[]
  pending: SubjectTaskGroup[]
  progress: {
    topicsScheduled:    number
    topicsCompleted:    number
    revisionsScheduled: number
    revisionsCompleted: number
    pendingCount:       number
  }
}

export async function getTodayTasks(userId: string): Promise<TodayTasksResult> {
  // 1. Ensure study tasks are generated for today
  await generateStudyTasks(userId)

  // 2. Carry forward any pending tasks
  await generatePendingTasks(userId)

  const today = dayStart()

  // 3. Fetch all tasks for today
  const tasks = await DailyTask.find({ userId, date: today })
    .populate("topicId", "name status")
    .populate("subjectId", "name color icon")
    .lean()

  // Helper: group tasks by subject, dedup by topicId
  function groupBySubject(taskList: any[]): SubjectTaskGroup[] {
    const map = new Map<string, SubjectTaskGroup>()
    const seenTopics = new Set<string>()

    for (const t of taskList) {
      // Skip if topic was deleted
      if (!t.topicId || !t.subjectId) continue

      const subjectId = String(t.subjectId._id ?? t.subjectId)
      const topicKey  = `${subjectId}:${String(t.topicId._id ?? t.topicId)}`

      // De-duplicate: same topic can't appear twice in the same section
      if (seenTopics.has(topicKey)) continue
      seenTopics.add(topicKey)

      if (!map.has(subjectId)) {
        map.set(subjectId, {
          subjectId,
          subjectName:  t.subjectId.name  ?? "Unknown",
          subjectColor: t.subjectId.color ?? "#6366f1",
          subjectIcon:  t.subjectId.icon  ?? "📚",
          topics: []
        })
      }

      map.get(subjectId)!.topics.push({
        topicId:      String(t.topicId._id ?? t.topicId),
        topicName:    t.topicId.name ?? "Unknown",
        status:       t.status,
        revisionCycle: t.revisionCycle
      })
    }

    return Array.from(map.values())
  }

  const studyTasks    = tasks.filter(t => t.taskType === "study")
  const revisionTasks = tasks.filter(t => t.taskType === "revision")
  const pendingTasks  = tasks.filter(t => t.taskType === "pending")

  // Progress counts
  const topicsScheduled    = studyTasks.length
  const topicsCompleted    = studyTasks.filter(t => t.status === "completed").length
  const revisionsScheduled = revisionTasks.length
  const revisionsCompleted = revisionTasks.filter(t => t.status === "completed").length
  const pendingCount       = pendingTasks.filter(t => t.status === "pending").length

  return {
    study:    groupBySubject(studyTasks.filter(t => t.status === "pending")),
    revision: groupBySubject(revisionTasks.filter(t => t.status === "pending")),
    pending:  groupBySubject(pendingTasks.filter(t => t.status === "pending")),
    progress: {
      topicsScheduled,
      topicsCompleted,
      revisionsScheduled,
      revisionsCompleted,
      pendingCount
    }
  }
}

export default {
  getTodayTasks,
  scheduleRevisions,
  completeTask,
  generateStudyTasks,
  generatePendingTasks
}