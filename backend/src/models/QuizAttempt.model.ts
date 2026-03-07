// backend/src/models/QuizAttempt.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

export interface IQuizQuestionAttempt {
  questionId: string
  question: string
  selectedAnswer: string
  correctAnswer: string
  isCorrect: boolean
  difficulty: "easy" | "medium" | "hard"
}

export interface IQuizBreakdown {
  easy: { correct: number; total: number }
  medium: { correct: number; total: number }
  hard: { correct: number; total: number }
}

export interface IQuizAttempt extends Document {
  userId: mongoose.Types.ObjectId
  topicId: mongoose.Types.ObjectId

  isRevisionQuiz: boolean

  questions: IQuizQuestionAttempt[]

  score: number
  percentage: number
  timeSpent: number

  breakdown: IQuizBreakdown
}

const QuestionSchema = new Schema<IQuizQuestionAttempt>(
  {
    questionId: String,
    question: String,
    selectedAnswer: String,
    correctAnswer: String,
    isCorrect: Boolean,
    difficulty: { type: String, enum: ["easy", "medium", "hard"] }
  },
  { _id: false }
)

const BreakdownSchema = new Schema<IQuizBreakdown>(
  {
    easy: { correct: Number, total: Number },
    medium: { correct: Number, total: Number },
    hard: { correct: Number, total: Number }
  },
  { _id: false }
)

const QuizAttemptSchema = new Schema<IQuizAttempt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    topicId: { type: Schema.Types.ObjectId, ref: "Topic", required: true },

    isRevisionQuiz: { type: Boolean, default: false },

    questions: { type: [QuestionSchema], default: [] },

    score: { type: Number, default: 0 },

    percentage: { type: Number, default: 0 },

    timeSpent: { type: Number, default: 0 },

    breakdown: { type: BreakdownSchema }
  },
  { timestamps: true }
)

QuizAttemptSchema.index({ userId: 1, topicId: 1 })
QuizAttemptSchema.index({ userId: 1, createdAt: -1 })

const QuizAttemptModel: Model<IQuizAttempt> = mongoose.model<IQuizAttempt>(
  "QuizAttempt",
  QuizAttemptSchema
)

export default QuizAttemptModel