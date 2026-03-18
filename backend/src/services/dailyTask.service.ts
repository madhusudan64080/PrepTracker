// backend/src/services/dailyTask.service.ts
//
// ── FIXES APPLIED ─────────────────────────────────────────────────────────
//
//  FIX 1 (Performance): generateStudyTasks and generatePendingTasks now run
//    at most ONCE per calendar day — they check for existing tasks before
//    running, so repeated calls on every page load are a cheap EXISTS query
//    rather than a full 30-day lookback + N upserts.
//
//  FIX 2 (Critical — double-complete bug): completeTask now includes
//    revisionCycle in the filter for ALL task types that carry one
//    (revision AND pending). Previously, completing one pending revision
//    for a topic would silently mark ALL pending revisions for that topic done.
//
//  FIX 3 (lastTriggered): generateStudyTasks now writes lastTriggered to
//    the StudySchedule after inserting tasks so isScheduledToday measures
//    from the last actual generation, not the original creation date.
//
//  FIX 4 (Topic blocking): generateStudyTasks excludes topics already in
//    today's task list before picking the next N, so a stale in_progress
//    topic can no longer block all subsequent topics from appearing.
//
//  FIX 5 (Pending dedup key): generatePendingTasks includes revisionCycle
//    in the upsert key so each revision cycle gets its own pending row and
//    idempotent re-runs can't collapse two cycles into one document.

import mongoose from "mongoose"
import DailyTask, { IDailyTask } from "../models/DailyTask.model"
import StudySchedule from "../models/StudySchedule.model"
import Topic from "../models/Topic.model"
import Subject from "../models/Subject.model"
import ActivityLog from "../models/ActivityLog.model"

/* ─── helpers ─────────────────────────────────────────────────────────────── */

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

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function daysBetween(a: Date, b: Date): number {
  const ms = dayStart(b).getTime() - dayStart(a).getTime()
  return Math.round(ms / 86_400_000)
}

function weekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/* ══════════════════════════════════════════════════════════════════════════
   FREQUENCY CHECK
══════════════════════════════════════════════════════════════════════════ */

const FREQ_DAYS: Record<string, number> = {
  daily:        1,
  every_2_days: 2,
  every_3_days: 3,
  weekly:       7
}

function isScheduledToday(schedule: any): boolean {
  const intervalDays = FREQ_DAYS[schedule.frequency] ?? 1
  if (intervalDays === 1) return true

  // FIX 3: prefer lastTriggered over startDate so the interval is measured
  // from the last actual generation, not the initial schedule creation date.
  const reference = schedule.lastTriggered ?? schedule.startDate ?? schedule.createdAt
  const start     = dayStart(reference)
  const today     = dayStart()
  const elapsed   = daysBetween(start, today)

  return elapsed >= 0 && elapsed % intervalDays === 0
}

/* ══════════════════════════════════════════════════════════════════════════
   GENERATE STUDY TASKS for today
══════════════════════════════════════════════════════════════════════════ */

async function generateStudyTasks(userId: string): Promise<void> {
  const today = dayStart()

  const schedules = await StudySchedule.find({ userId, active: true })
  if (!schedules.length) return

  // FIX 1: Idempotent guard — if any study task exists for today, generation
  // already ran. Avoids redundant upserts on every subsequent page load.
  const alreadyGenerated = await DailyTask.exists({
    userId,
    date:     today,
    taskType: "study"
  })
  if (alreadyGenerated) return

  for (const sched of schedules) {
    if (!isScheduledToday(sched)) continue

    // FIX 4: Get all topicIds already present in today's list (any type).
    // This prevents a stale in_progress topic from occupying a slot and
    // blocking all topics behind it from ever appearing.
    const alreadyTodayIds = await DailyTask.distinct("topicId", {
      userId,
      date: today
    })

    const topics = await Topic.find({
      subjectId: sched.subjectId,
      userId,
      status:  { $in: ["not_started", "in_progress"] },
      _id:     { $nin: alreadyTodayIds }        // FIX 4: skip already-listed topics
    })
      .sort({ order: 1 })
      .limit(sched.topicsPerDay)
      .lean()

    if (!topics.length) continue

    for (const topic of topics) {
      try {
        await DailyTask.updateOne(
          {
            userId,
            topicId:  topic._id,
            date:     today,
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
        if (e.code !== 11000) throw e
      }
    }

    // FIX 3: Update lastTriggered so future isScheduledToday() calls measure
    // from this actual run rather than the schedule's creation date.
    await StudySchedule.updateOne(
      { _id: sched._id },
      { $set: { lastTriggered: today } }
    )
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   GENERATE REVISION TASKS when a topic is completed
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
            taskType:        "revision",
            revisionCycle,
            originStudyDate: studyDay,
            status:          "pending"
          }
        },
        { upsert: true }
      )
    } catch (e: any) {
      if (e.code !== 11000) throw e
    }
  }

  await safeUpsert(studyDay, "same_day")
  await safeUpsert(dayStart(addDays(studyDay, 2)), "two_day")

  const weekMon   = weekStart(studyDay)
  const weekSat   = dayStart(addDays(weekMon, 5))
  const targetSat = studyDay >= weekSat
    ? dayStart(addDays(weekSat, 7))
    : weekSat
  await safeUpsert(targetSat, "weekly")
}

/* ══════════════════════════════════════════════════════════════════════════
   GENERATE PENDING TASKS — carry forward yesterday's incomplete tasks
══════════════════════════════════════════════════════════════════════════ */

async function generatePendingTasks(userId: string): Promise<void> {
  const today  = dayStart()

  // FIX 1: Idempotent guard — skip if pending tasks already generated today.
  const alreadyGenerated = await DailyTask.exists({
    userId,
    date:     today,
    taskType: "pending"
  })
  if (alreadyGenerated) return

  const cutoff = dayStart(addDays(today, -30))

  // FIX 5: Only carry forward study and revision tasks, never pending ones
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
          topicId:  task.topicId,
          date:     today,
          taskType: "pending",
          // FIX 5: include revisionCycle in the key so two-day and weekly
          // pending revisions for the same topic get separate rows
          ...(task.revisionCycle ? { revisionCycle: task.revisionCycle } : {})
        },
        {
          $setOnInsert: {
            userId,
            topicId:         task.topicId,
            subjectId:       task.subjectId,
            date:            today,
            taskType:        "pending",
            revisionCycle:   task.revisionCycle,
            originStudyDate: task.originStudyDate,
            status:          "pending"
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

  const filter: any = { userId, topicId, taskType, date: today, status: "pending" }

  // FIX 2: apply revisionCycle for BOTH "revision" and "pending" types.
  // A pending-wrapped revision has revisionCycle set; without this guard,
  // completing one cycle would mark all cycles for the same topic as done.
  if (revisionCycle) {
    filter.revisionCycle = revisionCycle
  }

  await DailyTask.updateMany(
    filter,
    { $set: { status: "completed", completedAt: new Date() } }
  )

  // When a study task is completed, also clear any carry-forward pending tasks
  // for this topic that don't have a revisionCycle (i.e. they were study type)
  if (taskType === "study") {
    await DailyTask.updateMany(
      {
        userId,
        topicId,
        date:          today,
        taskType:      "pending",
        status:        "pending",
        revisionCycle: { $exists: false }
      },
      { $set: { status: "completed", completedAt: new Date() } }
    )
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   GET OVERDUE TASKS — for the delay notification system
══════════════════════════════════════════════════════════════════════════ */

export interface OverdueTaskInfo {
  topicName:   string
  subjectName: string
  taskType:    string
  minutesLate: number
}

export async function getOverdueTasks(userId: string): Promise<OverdueTaskInfo[]> {
  const today  = dayStart()
  const cutoff = dayStart(addDays(today, -7))

  const tasks = await DailyTask.find({
    userId,
    date:     { $gte: cutoff, $lt: today },
    status:   "pending",
    taskType: { $in: ["study", "revision"] }
  })
    .populate("topicId",   "name")
    .populate("subjectId", "name")
    .lean()

  const now = Date.now()

  return tasks.map((t: any) => ({
    topicName:   t.topicId?.name   ?? "Unknown topic",
    subjectName: t.subjectId?.name ?? "Unknown subject",
    taskType:    t.taskType,
    minutesLate: Math.round((now - dayEnd(t.date).getTime()) / 60_000)
  }))
}

/* ══════════════════════════════════════════════════════════════════════════
   FETCH TODAY'S TASK DASHBOARD
══════════════════════════════════════════════════════════════════════════ */

interface TaskTopic {
  topicId:       string
  topicName:     string
  status:        string
  revisionCycle?: string
}

interface SubjectTaskGroup {
  subjectId:    string
  subjectName:  string
  subjectColor: string
  subjectIcon:  string
  topics:       TaskTopic[]
}

export interface TodayTasksResult {
  study:    SubjectTaskGroup[]
  revision: SubjectTaskGroup[]
  pending:  SubjectTaskGroup[]
  progress: {
    topicsScheduled:    number
    topicsCompleted:    number
    revisionsScheduled: number
    revisionsCompleted: number
    pendingCount:       number
  }
}

export async function getTodayTasks(userId: string): Promise<TodayTasksResult> {
  // Idempotent — cheap after first run of the day
  await generateStudyTasks(userId)
  await generatePendingTasks(userId)

  const today = dayStart()

  const tasks = await DailyTask.find({ userId, date: today })
    .populate("topicId",   "name status")
    .populate("subjectId", "name color icon")
    .lean()

  function groupBySubject(taskList: any[]): SubjectTaskGroup[] {
    const map        = new Map<string, SubjectTaskGroup>()
    const seenTopics = new Set<string>()

    for (const t of taskList) {
      if (!t.topicId || !t.subjectId) continue

      const subjectId = String(t.subjectId._id ?? t.subjectId)
      // Include revisionCycle in key so same topic can appear for different cycles
      const topicKey  = t.revisionCycle
        ? `${subjectId}:${String(t.topicId._id ?? t.topicId)}:${t.revisionCycle}`
        : `${subjectId}:${String(t.topicId._id ?? t.topicId)}`

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
        topicId:       String(t.topicId._id ?? t.topicId),
        topicName:     t.topicId.name ?? "Unknown",
        status:        t.status,
        revisionCycle: t.revisionCycle
      })
    }

    return Array.from(map.values())
  }

  const studyTasks    = tasks.filter(t => t.taskType === "study")
  const revisionTasks = tasks.filter(t => t.taskType === "revision")
  const pendingTasks  = tasks.filter(t => t.taskType === "pending")

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
  getOverdueTasks,
  generateStudyTasks,
  generatePendingTasks
}
