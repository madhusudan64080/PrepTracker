// backend/src/models/ActivityLog.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

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


export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId
  type: ActivityType

  entityId?: mongoose.Types.ObjectId
  entityName?: string

  metadata?: any

  date: Date
}

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  type: {
    type: String,
    enum: [
      "topic_started",
      "topic_completed",
      "quiz_completed",
      "flashcard_done",
      "revision_done",
      "problem_solved",
      "project_stage_done",
      "streak_milestone",
      "goal_completed",
      "interview_done",
      "schedule_created"
    ]
  },

  entityId: Schema.Types.ObjectId,

  entityName: String,

  metadata: Schema.Types.Mixed,

  date: {
    type: Date,
    default: Date.now
  }
})

ActivityLogSchema.index({ userId: 1, date: 1 })
ActivityLogSchema.index({ userId: 1, type: 1 })

const ActivityLogModel: Model<IActivityLog> = mongoose.model<IActivityLog>(
  "ActivityLog",
  ActivityLogSchema
)

export default ActivityLogModel