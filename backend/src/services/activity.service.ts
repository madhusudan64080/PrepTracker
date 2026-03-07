// backend/src/services/activity.service.ts

import ActivityLog from "../models/ActivityLog.model"
import DailyGoal from "../models/DailyGoal.model"
import User from "../models/User.model"

export type ActivityType =
  | "topic_started"
  | "topic_completed"
  | "quiz_completed"
  | "flashcard_done"
  | "revision_done"
  | "problem_solved"
  | "project_stage_done"
  | "streak_milestone"
  | "goal_completed"
  | "interview_done"

interface LogActivityParams {
  userId: string
  type: ActivityType
  entityId?: string
  entityName?: string
  metadata?: Record<string, any>
}

class ActivityService {

  /**
   * Fire-and-forget activity logging
   */
  async logActivity(params: LogActivityParams): Promise<void> {

    try {

      await ActivityLog.create({
        userId: params.userId,
        type: params.type,
        entityId: params.entityId,
        entityName: params.entityName,
        metadata: params.metadata || {},
        date: new Date()
      })

      const today = new Date()
      today.setUTCHours(0, 0, 0, 0)

      await DailyGoal.findOneAndUpdate(
        { userId: params.userId, date: today },
        {},
        { upsert: true }
      )

    } catch (err) {

      if (process.env.NODE_ENV !== "production") {
        console.error("Activity log failed:", err)
      }

    }
  }

  /**
   * Get recent activity feed
   */
  async getRecentActivity(userId: string, limit: number = 10) {

    const logs = await ActivityLog.find({ userId })
      .sort({ date: -1 })
      .limit(limit)

    const formatted = logs.map(log => {

      let description = ""

      switch (log.type) {

        case "topic_completed":
          description = `Completed topic ${log.entityName || ""}`
          break

        case "quiz_completed":
          description = `Completed quiz`
          break

        case "revision_done":
          description = `Completed revision`
          break

        case "problem_solved":
          description = `Solved coding problem`
          break

        case "project_stage_done":
          description = `Completed project stage`
          break

        case "interview_done":
          description = `Completed interview practice`
          break

        default:
          description = log.type
      }

      return {
        id: log._id,
        type: log.type,
        description,
        date: log.date
      }
    })

    return formatted
  }
}

export default new ActivityService()