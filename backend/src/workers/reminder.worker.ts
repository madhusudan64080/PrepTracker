// backend/src/workers/reminder.worker.ts
// BullMQ worker — processes scheduled reminder jobs

import { Worker, Job } from "bullmq"
import { redisClient } from "../config/database"
import RevisionSchedule from "../models/RevisionSchedule.model"
import DailyGoal from "../models/DailyGoal.model"
import User from "../models/User.model"
import ActivityLog from "../models/ActivityLog.model"

export const REMINDER_QUEUE = "preptrack_reminders"

export interface ReminderJob {
  type: "daily_summary" | "revision_due" | "streak_warning" | "goal_nudge"
  userId: string       // concrete userId  OR  "ALL" (cron sentinel)
  payload?: Record<string, unknown>
}

async function processReminder(job: Job<ReminderJob>): Promise<void> {
  const { type, userId, payload } = job.data

  // FIX: cron jobs fire with userId="ALL" — fan-out to every active user
  if (userId === "ALL") {
    const { fanOutToActiveUsers } = await import("../jobs/reminder.scheduler")
    await fanOutToActiveUsers(type)
    return
  }

  switch (type) {
    case "daily_summary":   await processDailySummary(userId);         break
    case "revision_due":    await processRevisionDue(userId);          break
    case "streak_warning":  await processStreakWarning(userId);         break
    case "goal_nudge":      await processGoalNudge(userId, payload);   break
  }
}

// ── Daily Summary ──────────────────────────────────────────────
async function processDailySummary(userId: string): Promise<void> {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const [goal, dueRevisions] = await Promise.all([
    DailyGoal.findOne({ userId, date: { $gte: today } }),
    RevisionSchedule.find({
      userId,
      nextReviewDate: { $lte: new Date() }
    }).populate("topicId", "name")
  ])

  const achieved = goal?.achieved
  const targets  = goal?.targets

  const summary = {
    topicsCompleted:    achieved?.topicsLearned  ?? 0,
    topicsTarget:       targets?.topicsToLearn   ?? 3,
    problemsSolved:     achieved?.problemsSolved ?? 0,
    problemsTarget:     targets?.problemsToSolve ?? 5,
    revisionsCompleted: achieved?.revisionDone   ?? 0,
    revisionsTarget:    targets?.revisionTopics  ?? 2,
    dueRevisionCount:   dueRevisions.length,
    dueTopics: dueRevisions
      .slice(0, 5)
      .map((r: any) => r.topicId?.name ?? "Unknown topic")
  }

  await ActivityLog.create({
    userId,
    type: "reminder",
    description: buildDailySummaryMessage(summary),
    metadata: { reminderType: "daily_summary", summary },
    date: new Date()
  })
}

// ── Revision Due ───────────────────────────────────────────────
async function processRevisionDue(userId: string): Promise<void> {
  const overdueSchedules = await RevisionSchedule.find({
    userId,
    nextReviewDate: { $lte: new Date() }
  })
    .populate("topicId", "name")
    .limit(10)

  if (!overdueSchedules.length) return

  const topicNames = overdueSchedules.map((s: any) => s.topicId?.name ?? "Unknown")

  await ActivityLog.create({
    userId,
    type: "reminder",
    description: `📚 ${overdueSchedules.length} topic${overdueSchedules.length > 1 ? "s" : ""} due for revision: ${topicNames.slice(0, 3).join(", ")}${topicNames.length > 3 ? "…" : ""}`,
    metadata: { reminderType: "revision_due", count: overdueSchedules.length, topics: topicNames },
    date: new Date()
  })
}

// ── Streak Warning ─────────────────────────────────────────────
async function processStreakWarning(userId: string): Promise<void> {
  const user = await User.findById(userId)
  if (!user) return

  const streak = user.streak.currentStreak
  if (streak < 1) return

  await ActivityLog.create({
    userId,
    type: "reminder",
    description: `🔥 Don't break your ${streak}-day streak! Study something today.`,
    metadata: { reminderType: "streak_warning", currentStreak: streak },
    date: new Date()
  })
}

// ── Goal Nudge ─────────────────────────────────────────────────
async function processGoalNudge(
  userId: string,
  payload?: Record<string, unknown>
): Promise<void> {
  await ActivityLog.create({
    userId,
    type: "reminder",
    description: "🎯 Halfway through the day — check your daily goals and keep the momentum!",
    metadata: { reminderType: "goal_nudge", ...payload },
    date: new Date()
  })
}

// ── Message Builder ────────────────────────────────────────────
function buildDailySummaryMessage(s: {
  topicsCompleted: number
  topicsTarget:    number
  problemsSolved:  number
  problemsTarget:  number
  dueRevisionCount: number
}): string {
  const topicStr    = `${s.topicsCompleted}/${s.topicsTarget} topics`
  const problemStr  = `${s.problemsSolved}/${s.problemsTarget} problems`
  const revisionStr = s.dueRevisionCount > 0
    ? ` · ${s.dueRevisionCount} revision${s.dueRevisionCount > 1 ? "s" : ""} still due`
    : " · All revisions done ✅"

  return `📊 Daily recap: ${topicStr} · ${problemStr}${revisionStr}`
}

// ── Worker Bootstrap ───────────────────────────────────────────
let reminderWorker: Worker | null = null

export function startReminderWorker(): void {
  reminderWorker = new Worker<ReminderJob>(
    REMINDER_QUEUE,
    processReminder,
    {
      connection: new (require("ioredis"))(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        // FIX: Upstash requires TLS with rejectUnauthorized:false for rediss:// URLs.
        // Empty `{}` was insufficient — the TLS handshake would fail silently.
        tls: process.env.REDIS_URL?.startsWith("rediss://")
          ? { rejectUnauthorized: false }
          : undefined
      }),
      concurrency: 5
    }
  )

  reminderWorker.on("completed", (job) => {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[ReminderWorker] Job ${job.id} (${job.data.type}) completed`)
    }
  })

  reminderWorker.on("failed", (job, err) => {
    console.error(`[ReminderWorker] Job ${job?.id} failed:`, err.message)
  })

  console.log("[ReminderWorker] Started")
}

export async function stopReminderWorker(): Promise<void> {
  if (reminderWorker) {
    await reminderWorker.close()
    console.log("[ReminderWorker] Stopped")
  }
}
