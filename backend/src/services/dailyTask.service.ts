// backend/src/services/dailyTask.service.ts
//
<<<<<<< HEAD
// Orchestrates all three Today's Goals task types:
//   1. Study tasks   — topics due today per StudyScheduler frequency
//   2. Revision tasks— same-day / 2-day / weekly spaced repetition
//   3. Pending tasks — unfinished study/revision from previous days
=======
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
>>>>>>> 48fc2b9 (Updated full project with new content)

import mongoose from "mongoose"
import DailyTask, { IDailyTask } from "../models/DailyTask.model"
import StudySchedule from "../models/StudySchedule.model"
import Topic from "../models/Topic.model"
import Subject from "../models/Subject.model"
import ActivityLog from "../models/ActivityLog.model"

/* ─── helpers ─────────────────────────────────────────────────────────────── */

<<<<<<< HEAD
/** UTC midnight for a given date (or today) */
=======
>>>>>>> 48fc2b9 (Updated full project with new content)
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

<<<<<<< HEAD
/** Add N calendar days to a date */
=======
>>>>>>> 48fc2b9 (Updated full project with new content)
function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

<<<<<<< HEAD
/** How many full days separate two UTC-midnights */
=======
>>>>>>> 48fc2b9 (Updated full project with new content)
function daysBetween(a: Date, b: Date): number {
  const ms = dayStart(b).getTime() - dayStart(a).getTime()
  return Math.round(ms / 86_400_000)
}

<<<<<<< HEAD
/** Monday of the ISO week containing `date` */
function weekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getUTCDay() // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day  // shift to Monday
=======
function weekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
>>>>>>> 48fc2b9 (Updated full project with new content)
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/* ══════════════════════════════════════════════════════════════════════════
<<<<<<< HEAD
   FREQUENCY CHECK — is today a scheduled study day for this schedule?
=======
   FREQUENCY CHECK
>>>>>>> 48fc2b9 (Updated full project with new content)
══════════════════════════════════════════════════════════════════════════ */

const FREQ_DAYS: Record<string, number> = {
  daily:        1,
  every_2_days: 2,
  every_3_days: 3,
  weekly:       7
}

function isScheduledToday(schedule: any): boolean {
  const intervalDays = FREQ_DAYS[schedule.frequency] ?? 1
<<<<<<< HEAD
  if (intervalDays === 1) return true              // daily — always yes

  const start = dayStart(schedule.startDate ?? schedule.createdAt)
  const today = dayStart()
  const elapsed = daysBetween(start, today)
=======
  if (intervalDays === 1) return true

  // FIX 3: prefer lastTriggered over startDate so the interval is measured
  // from the last actual generation, not the initial schedule creation date.
  const reference = schedule.lastTriggered ?? schedule.startDate ?? schedule.createdAt
  const start     = dayStart(reference)
  const today     = dayStart()
  const elapsed   = daysBetween(start, today)
>>>>>>> 48fc2b9 (Updated full project with new content)

  return elapsed >= 0 && elapsed % intervalDays === 0
}

/* ══════════════════════════════════════════════════════════════════════════
   GENERATE STUDY TASKS for today
══════════════════════════════════════════════════════════════════════════ */

async function generateStudyTasks(userId: string): Promise<void> {
  const today = dayStart()

  const schedules = await StudySchedule.find({ userId, active: true })
<<<<<<< HEAD
=======
  if (!schedules.length) return

  // FIX 1: Idempotent guard — if any study task exists for today, generation
  // already ran. Avoids redundant upserts on every subsequent page load.
  const alreadyGenerated = await DailyTask.exists({
    userId,
    date:     today,
    taskType: "study"
  })
  if (alreadyGenerated) return
>>>>>>> 48fc2b9 (Updated full project with new content)

  for (const sched of schedules) {
    if (!isScheduledToday(sched)) continue

<<<<<<< HEAD
    // Find next N incomplete topics (not_started or in_progress) ordered by `order`
    const topics = await Topic.find({
      subjectId: sched.subjectId,
      userId,
      status: { $in: ["not_started", "in_progress"] }
=======
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
>>>>>>> 48fc2b9 (Updated full project with new content)
    })
      .sort({ order: 1 })
      .limit(sched.topicsPerDay)
      .lean()

<<<<<<< HEAD
=======
    if (!topics.length) continue

>>>>>>> 48fc2b9 (Updated full project with new content)
    for (const topic of topics) {
      try {
        await DailyTask.updateOne(
          {
            userId,
<<<<<<< HEAD
            topicId: topic._id,
            date:    today,
=======
            topicId:  topic._id,
            date:     today,
>>>>>>> 48fc2b9 (Updated full project with new content)
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
<<<<<<< HEAD
        // Ignore duplicate key (task already exists)
        if (e.code !== 11000) throw e
      }
    }
=======
        if (e.code !== 11000) throw e
      }
    }

    // FIX 3: Update lastTriggered so future isScheduledToday() calls measure
    // from this actual run rather than the schedule's creation date.
    await StudySchedule.updateOne(
      { _id: sched._id },
      { $set: { lastTriggered: today } }
    )
>>>>>>> 48fc2b9 (Updated full project with new content)
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   GENERATE REVISION TASKS when a topic is completed
<<<<<<< HEAD
   Called by topic.controller.ts → completeTopic
=======
>>>>>>> 48fc2b9 (Updated full project with new content)
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
<<<<<<< HEAD
            taskType:      "revision",
            revisionCycle,
            originStudyDate: studyDay,
            status:        "pending"
=======
            taskType:        "revision",
            revisionCycle,
            originStudyDate: studyDay,
            status:          "pending"
>>>>>>> 48fc2b9 (Updated full project with new content)
          }
        },
        { upsert: true }
      )
    } catch (e: any) {
      if (e.code !== 11000) throw e
    }
  }

<<<<<<< HEAD
  // 1. Same-day revision — same calendar day
  await safeUpsert(studyDay, "same_day")

  // 2. Two-day revision — 2 days after the study day
  await safeUpsert(dayStart(addDays(studyDay, 2)), "two_day")

  // 3. Weekly revision — Saturday of the same ISO week as study day
  //    (Saturday = Monday + 5 days)
  const weekMon = weekStart(studyDay)
  const weekSat = dayStart(addDays(weekMon, 5))
  // If study day IS Saturday or later, push to next Saturday
=======
  await safeUpsert(studyDay, "same_day")
  await safeUpsert(dayStart(addDays(studyDay, 2)), "two_day")

  const weekMon   = weekStart(studyDay)
  const weekSat   = dayStart(addDays(weekMon, 5))
>>>>>>> 48fc2b9 (Updated full project with new content)
  const targetSat = studyDay >= weekSat
    ? dayStart(addDays(weekSat, 7))
    : weekSat
  await safeUpsert(targetSat, "weekly")
}

/* ══════════════════════════════════════════════════════════════════════════
   GENERATE PENDING TASKS — carry forward yesterday's incomplete tasks
<<<<<<< HEAD
   (run this when fetching today's tasks)
══════════════════════════════════════════════════════════════════════════ */

async function generatePendingTasks(userId: string): Promise<void> {
  const today = dayStart()
  const yesterday = dayStart(addDays(today, -1))

  // Look for all incomplete tasks older than today (up to 30 days back)
  const cutoff = dayStart(addDays(today, -30))

=======
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
>>>>>>> 48fc2b9 (Updated full project with new content)
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
<<<<<<< HEAD
          topicId:      task.topicId,
          date:         today,
          taskType:     "pending",
          // Use revisionCycle as part of identity for revision-sourced pending
          revisionCycle: task.revisionCycle
=======
          topicId:  task.topicId,
          date:     today,
          taskType: "pending",
          // FIX 5: include revisionCycle in the key so two-day and weekly
          // pending revisions for the same topic get separate rows
          ...(task.revisionCycle ? { revisionCycle: task.revisionCycle } : {})
>>>>>>> 48fc2b9 (Updated full project with new content)
        },
        {
          $setOnInsert: {
            userId,
<<<<<<< HEAD
            topicId:        task.topicId,
            subjectId:      task.subjectId,
            date:           today,
            taskType:       "pending",
            revisionCycle:  task.revisionCycle,
            originStudyDate: task.originStudyDate,
            status:         "pending"
=======
            topicId:         task.topicId,
            subjectId:       task.subjectId,
            date:            today,
            taskType:        "pending",
            revisionCycle:   task.revisionCycle,
            originStudyDate: task.originStudyDate,
            status:          "pending"
>>>>>>> 48fc2b9 (Updated full project with new content)
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

<<<<<<< HEAD
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
=======
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
>>>>>>> 48fc2b9 (Updated full project with new content)
      { $set: { status: "completed", completedAt: new Date() } }
    )
  }
}

/* ══════════════════════════════════════════════════════════════════════════
<<<<<<< HEAD
   FETCH TODAY'S TASK DASHBOARD
   Returns grouped-by-subject data for all three sections
══════════════════════════════════════════════════════════════════════════ */

interface TaskTopic {
  topicId:      string
  topicName:    string
  status:       string
=======
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
>>>>>>> 48fc2b9 (Updated full project with new content)
  revisionCycle?: string
}

interface SubjectTaskGroup {
<<<<<<< HEAD
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
=======
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
>>>>>>> 48fc2b9 (Updated full project with new content)
  progress: {
    topicsScheduled:    number
    topicsCompleted:    number
    revisionsScheduled: number
    revisionsCompleted: number
    pendingCount:       number
  }
}

export async function getTodayTasks(userId: string): Promise<TodayTasksResult> {
<<<<<<< HEAD
  // 1. Ensure study tasks are generated for today
  await generateStudyTasks(userId)

  // 2. Carry forward any pending tasks
=======
  // Idempotent — cheap after first run of the day
  await generateStudyTasks(userId)
>>>>>>> 48fc2b9 (Updated full project with new content)
  await generatePendingTasks(userId)

  const today = dayStart()

<<<<<<< HEAD
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
=======
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

>>>>>>> 48fc2b9 (Updated full project with new content)
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
<<<<<<< HEAD
        topicId:      String(t.topicId._id ?? t.topicId),
        topicName:    t.topicId.name ?? "Unknown",
        status:       t.status,
=======
        topicId:       String(t.topicId._id ?? t.topicId),
        topicName:     t.topicId.name ?? "Unknown",
        status:        t.status,
>>>>>>> 48fc2b9 (Updated full project with new content)
        revisionCycle: t.revisionCycle
      })
    }

    return Array.from(map.values())
  }

  const studyTasks    = tasks.filter(t => t.taskType === "study")
  const revisionTasks = tasks.filter(t => t.taskType === "revision")
  const pendingTasks  = tasks.filter(t => t.taskType === "pending")

<<<<<<< HEAD
  // Progress counts
=======
>>>>>>> 48fc2b9 (Updated full project with new content)
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
<<<<<<< HEAD
  generateStudyTasks,
  generatePendingTasks
}
=======
  getOverdueTasks,
  generateStudyTasks,
  generatePendingTasks
}
>>>>>>> 48fc2b9 (Updated full project with new content)
