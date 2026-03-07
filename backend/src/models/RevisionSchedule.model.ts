// backend/src/models/RevisionSchedule.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

export type RevisionStatus = "pending" | "completed" | "skipped" | "overdue"

export interface IRevisionDate {
  scheduledDate: Date
  intervalDays: number
  status: RevisionStatus
  completedAt?: Date
  score?: number
}

export interface IRevisionSchedule extends Document {
  userId: mongoose.Types.ObjectId
  topicId: mongoose.Types.ObjectId

  revisionDates: IRevisionDate[]

  efFactor: number
  repetition: number

  nextReviewDate?: Date
  lastReviewDate?: Date
}

const RevisionDateSchema = new Schema<IRevisionDate>(
  {
    scheduledDate: Date,
    intervalDays: Number,
    status: {
      type: String,
      enum: ["pending", "completed", "skipped", "overdue"],
      default: "pending"
    },
    completedAt: Date,
    score: Number
  },
  { _id: false }
)

const RevisionScheduleSchema = new Schema<IRevisionSchedule>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true },

    revisionDates: { type: [RevisionDateSchema], default: [] },

    efFactor: { type: Number, default: 2.5 },

    repetition: { type: Number, default: 0 },

    nextReviewDate: Date,

    lastReviewDate: Date
  },
  { timestamps: true }
)

RevisionScheduleSchema.index({ userId: 1, nextReviewDate: 1 })
RevisionScheduleSchema.index({ userId: 1, topicId: 1 }, { unique: true })

const RevisionScheduleModel: Model<IRevisionSchedule> =
  mongoose.model<IRevisionSchedule>(
    "RevisionSchedule",
    RevisionScheduleSchema
  )

export default RevisionScheduleModel