// backend/src/models/DailyTask.model.ts
//
// Central model for Today's Goals task management.
// Stores exactly which tasks are scheduled for which day,
// their type, and whether they've been completed.
//
// Task types:
//   study    — topics scheduled via StudyScheduler for today
//   revision — spaced-repetition revision (same-day / 2-day / weekly)
//   pending  — carried-over incomplete tasks from previous days

import mongoose, { Schema, Document, Model } from "mongoose"

export type DailyTaskType    = "study" | "revision" | "pending"
export type DailyTaskStatus  = "pending" | "completed" | "skipped"
export type RevisionCycle    = "same_day" | "two_day" | "weekly"

export interface IDailyTask extends Document {
  userId:    mongoose.Types.ObjectId
  topicId:   mongoose.Types.ObjectId
  subjectId: mongoose.Types.ObjectId

  // which day this task belongs to (UTC midnight)
  date: Date

  taskType:  DailyTaskType
  status:    DailyTaskStatus

  // only for revision tasks — which cycle generated this
  revisionCycle?: RevisionCycle

  // ISO date of the original study day that triggered this revision
  originStudyDate?: Date

  completedAt?: Date
}

const DailyTaskSchema = new Schema<IDailyTask>(
  {
    userId:    { type: Schema.Types.ObjectId, ref: "User",    required: true },
    topicId:   { type: Schema.Types.ObjectId, ref: "Topic",   required: true },
    subjectId: { type: Schema.Types.ObjectId, ref: "Subject", required: true },

    date: { type: Date, required: true },

    taskType: {
      type: String,
      enum: ["study", "revision", "pending"],
      required: true
    },

    status: {
      type: String,
      enum: ["pending", "completed", "skipped"],
      default: "pending"
    },

    revisionCycle: {
      type: String,
      enum: ["same_day", "two_day", "weekly"]
    },

    originStudyDate: { type: Date },

    completedAt: { type: Date }
  },
  { timestamps: true }
)

// Unique constraint: one task per (user, topic, date, type, revisionCycle)
// This prevents duplicate tasks when the same generation runs twice.
DailyTaskSchema.index(
  { userId: 1, topicId: 1, date: 1, taskType: 1, revisionCycle: 1 },
  { unique: true, sparse: true }
)

DailyTaskSchema.index({ userId: 1, date: 1, taskType: 1 })
DailyTaskSchema.index({ userId: 1, date: 1, status: 1 })

const DailyTaskModel: Model<IDailyTask> =
  mongoose.model<IDailyTask>("DailyTask", DailyTaskSchema)

export default DailyTaskModel