// backend/src/models/Topic.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

export type TopicStatus = "not_started" | "in_progress" | "completed"
export type TopicDifficulty = "easy" | "medium" | "hard"

export interface ITopic extends Document {
  subjectId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId

  name: string
  description: string

  order: number

  status: TopicStatus
  difficulty: TopicDifficulty

  estimatedMinutes: number

  tags: string[]

  revisionCount: number

  lastStudiedAt?: Date

  masteryScore: number

  contentGenerated: boolean
}

const TopicSchema = new Schema<ITopic>(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: { type: String, required: true },

    description: { type: String, default: "" },

    order: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["not_started", "in_progress", "completed"],
      default: "not_started"
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium"
    },

    estimatedMinutes: { type: Number, default: 30 },

    tags: { type: [String], default: [] },

    revisionCount: { type: Number, default: 0 },

    lastStudiedAt: { type: Date },

    masteryScore: { type: Number, default: 0 },

    contentGenerated: { type: Boolean, default: false }
  },
  { timestamps: true }
)

TopicSchema.index({ subjectId: 1, order: 1 })
TopicSchema.index({ userId: 1, status: 1 })
TopicSchema.index({ userId: 1 })

const TopicModel: Model<ITopic> = mongoose.model<ITopic>("Topic", TopicSchema)

export default TopicModel