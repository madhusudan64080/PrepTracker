// backend/src/models/DailyGoal.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

export type Mood = "great" | "good" | "okay" | "bad"

export interface IDailyGoalTargets {
  topicsToLearn: number
  problemsToSolve: number
  revisionTopics: number
  studyMinutes: number
}

export interface IDailyGoalAchieved {
  topicsLearned: number
  problemsSolved: number
  revisionDone: number
  studyMinutes: number
}

export interface IDailyGoal extends Document {
  userId: mongoose.Types.ObjectId
  date: Date

  targets: IDailyGoalTargets
  achieved: IDailyGoalAchieved

  completionPercentage: number

  mood?: Mood

  notes: string
}

const TargetsSchema = new Schema<IDailyGoalTargets>(
  {
    topicsToLearn: { type: Number, default: 3 },
    problemsToSolve: { type: Number, default: 5 },
    revisionTopics: { type: Number, default: 2 },
    studyMinutes: { type: Number, default: 90 }
  },
  { _id: false }
)

const AchievedSchema = new Schema<IDailyGoalAchieved>(
  {
    topicsLearned: { type: Number, default: 0 },
    problemsSolved: { type: Number, default: 0 },
    revisionDone: { type: Number, default: 0 },
    studyMinutes: { type: Number, default: 0 }
  },
  { _id: false }
)

const DailyGoalSchema = new Schema<IDailyGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    date: { type: Date, required: true },

    targets: { type: TargetsSchema, default: () => ({}) },

    achieved: { type: AchievedSchema, default: () => ({}) },

    completionPercentage: { type: Number, default: 0 },

    mood: {
      type: String,
      enum: ["great", "good", "okay", "bad"]
    },

    notes: { type: String, default: "" }
  },
  { timestamps: true }
)

DailyGoalSchema.index({ userId: 1, date: 1 }, { unique: true })

const DailyGoalModel: Model<IDailyGoal> = mongoose.model<IDailyGoal>(
  "DailyGoal",
  DailyGoalSchema
)

export default DailyGoalModel