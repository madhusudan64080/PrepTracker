// backend/src/models/InterviewSession.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

export type SelfRating = "nailed" | "partial" | "missed"

export interface IInterviewQuestion {
  questionId: string
  question: string
  selfRating: SelfRating
  timeSpent: number
}

export interface IInterviewSession extends Document {
  userId: mongoose.Types.ObjectId
  topicId: mongoose.Types.ObjectId
  company?: string

  questions: IInterviewQuestion[]

  overallRating: number

  totalTime: number

  completedAt: Date
}

const QuestionSchema = new Schema<IInterviewQuestion>(
  {
    questionId: String,
    question: String,
    selfRating: {
      type: String,
      enum: ["nailed", "partial", "missed"]
    },
    timeSpent: Number
  },
  { _id: false }
)

const InterviewSessionSchema = new Schema<IInterviewSession>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  topicId: {
    type: Schema.Types.ObjectId,
    ref: "Topic",
    required: true
  },

  company: String,

  questions: [QuestionSchema],

  overallRating: {
    type: Number,
    min: 0,
    max: 100
  },

  totalTime: Number,

  completedAt: {
    type: Date,
    default: Date.now
  }
})

InterviewSessionSchema.index({ userId: 1 })
InterviewSessionSchema.index({ userId: 1, topicId: 1 })

const InterviewSessionModel: Model<IInterviewSession> =
  mongoose.model<IInterviewSession>(
    "InterviewSession",
    InterviewSessionSchema
  )

export default InterviewSessionModel