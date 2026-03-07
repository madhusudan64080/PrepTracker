// backend/src/models/StudySchedule.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

export type StudyFrequency = "daily" | "every_2_days" | "every_3_days" | "weekly"

export interface IStudySchedule extends Document {
  userId: mongoose.Types.ObjectId
  subjectId: mongoose.Types.ObjectId
  subjectName: string
  frequency: StudyFrequency
  topicsPerDay: number
  active: boolean
  startDate: Date
  lastTriggered?: Date
  nextDue?: Date
}

const StudyScheduleSchema = new Schema<IStudySchedule>(
  {
    userId:      { type: Schema.Types.ObjectId, ref: "User",    required: true },
    subjectId:   { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    subjectName: { type: String, required: true },

    frequency: {
      type: String,
      enum: ["daily", "every_2_days", "every_3_days", "weekly"],
      default: "daily"
    },

    topicsPerDay: { type: Number, default: 3, min: 1, max: 20 },

    active:        { type: Boolean, default: true },
    startDate:     { type: Date,    default: Date.now },
    lastTriggered: { type: Date },
    nextDue:       { type: Date }
  },
  { timestamps: true }
)

StudyScheduleSchema.index({ userId: 1 })
StudyScheduleSchema.index({ userId: 1, subjectId: 1 }, { unique: true })

const StudyScheduleModel: Model<IStudySchedule> =
  mongoose.model<IStudySchedule>("StudySchedule", StudyScheduleSchema)

export default StudyScheduleModel
