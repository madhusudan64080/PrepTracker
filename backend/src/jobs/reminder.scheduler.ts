// backend/src/jobs/reminder.scheduler.ts
// Schedules recurring reminder jobs for all active users

// NOTE: QueueScheduler was removed in BullMQ v4+. Queue now handles scheduling internally.
import { Queue } from "bullmq"
import { redisClient } from "../config/database"
import User from "../models/User.model"
import { REMINDER_QUEUE, ReminderJob } from "../workers/reminder.worker"

let reminderQueue: Queue<ReminderJob>

export function getReminderQueue(): Queue<ReminderJob> {
  if (!reminderQueue) {
    reminderQueue = new Queue<ReminderJob>(REMINDER_QUEUE, {
      connection: new (require("ioredis"))(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        // FIX: Upstash rediss:// requires explicit TLS with rejectUnauthorized:false
        tls: process.env.REDIS_URL?.startsWith("rediss://")
          ? { rejectUnauthorized: false }
          : undefined
      }),
      defaultJobOptions: {
        removeOnComplete: 50,
        removeOnFail: 20,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 }
      }
    })
  }
  return reminderQueue
}

/**
 * Queue a reminder immediately for a specific user.
 * Call from any controller after a significant user action.
 */
export async function enqueueUserReminder(
  userId: string,
  type: ReminderJob["type"],
  payload?: Record<string, unknown>
): Promise<void> {
  const q = getReminderQueue()
  await q.add(
    `${type}:${userId}`,
    { type, userId, payload },
    { jobId: `${type}_${userId}_${Date.now()}_${Math.random()}` }
  )
}

/**
 * Bootstrap global cron jobs. Called once at server startup.
 *
 * Cron schedules (UTC):
 *   09:00  revision_due   — morning revision nudge
 *   12:00  goal_nudge     — midday check-in
 *   18:00  streak_warning — afternoon streak warning
 *   21:00  daily_summary  — evening recap
 *
 * Each cron job uses userId:"ALL" as a sentinel.
 * The worker detects this and calls fanOutToActiveUsers() to
 * spawn individual per-user jobs.
 */
export async function scheduleGlobalReminders(): Promise<void> {
  const q = getReminderQueue()

  // Remove stale repeatable jobs before re-registering
  const repeatables = await q.getRepeatableJobs()
  for (const job of repeatables) {
    await q.removeRepeatableByKey(job.key)
  }

  const cronJobs: { name: string; type: ReminderJob["type"]; cron: string }[] = [
    { name: "revision-nudge",  type: "revision_due",   cron: "0 9  * * *" },
    { name: "goal-nudge",      type: "goal_nudge",     cron: "0 12 * * *" },
    { name: "streak-warn",     type: "streak_warning", cron: "0 18 * * *" },
    { name: "daily-summary",   type: "daily_summary",  cron: "0 21 * * *" }
  ]

  for (const job of cronJobs) {
    await q.add(
      job.name,
      { type: job.type, userId: "ALL" },
      { repeat: { pattern: job.cron }, jobId: job.name }
    )
  }

  console.log("[Scheduler] Global reminder crons registered:", cronJobs.map(j => j.name).join(", "))
}

/**
 * Fan-out: finds all users active in the last 30 days and enqueues
 * individual reminder jobs for each one via BullMQ bulk-add.
 * Called by the worker whenever it receives userId === "ALL".
 */
export async function fanOutToActiveUsers(
  type: ReminderJob["type"]
): Promise<void> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const users = await User.find(
    { updatedAt: { $gte: cutoff } },
    { _id: 1 }
  ).lean()

  if (!users.length) return

  const q = getReminderQueue()

  const jobs = users.map((u) => ({
    name: `${type}:${u._id}`,
    data: { type, userId: String(u._id) } as ReminderJob,
    opts: { jobId: `${type}:${u._id}:${Date.now()}` }
  }))

  await q.addBulk(jobs)

  console.log(`[Scheduler] Fanned out ${type} to ${users.length} users`)
}
