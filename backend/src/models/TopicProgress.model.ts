// backend/src/models/TopicProgress.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

export type LearningMethod =
  | "topic_explanation"
  | "coding_patterns"
  | "example_based"
  | "revision"

export interface ITopicProgress extends Document {
  topicId: mongoose.Types.ObjectId
  userId: mongoose.Types.ObjectId

  sectionsCompleted: {
    concept: boolean
    visual: boolean
    code: boolean
    quiz: boolean
    flashcards: boolean
    interview: boolean
  }

  overallProgress: number
  timeSpentMinutes: number
  completedAt?: Date
  learningMethod: LearningMethod
}

const TopicProgressSchema = new Schema<ITopicProgress>(
  {
    topicId: {
      type: Schema.Types.ObjectId,
      ref: "Topic",
      required: true
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    sectionsCompleted: {
      concept: { type: Boolean, default: false },
      visual: { type: Boolean, default: false },
      code: { type: Boolean, default: false },
      quiz: { type: Boolean, default: false },
      flashcards: { type: Boolean, default: false },
      interview: { type: Boolean, default: false }
    },

    overallProgress: {
      type: Number,
      default: 0
    },

    timeSpentMinutes: {
      type: Number,
      default: 0
    },

    completedAt: {
      type: Date
    },

    learningMethod: {
      type: String,
      enum: ["topic_explanation", "coding_patterns", "example_based", "revision"],
      default: "topic_explanation"
    }
  },
  {
    timestamps: true
  }
)

/**
 * Prevent duplicate progress records for same user + topic
 */
TopicProgressSchema.index(
  { topicId: 1, userId: 1 },
  { unique: true }
)

const TopicProgressModel: Model<ITopicProgress> =
  mongoose.model<ITopicProgress>("TopicProgress", TopicProgressSchema)

export default TopicProgressModel