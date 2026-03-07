// backend/src/models/CodingProblem.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

export type ProblemDifficulty = "easy" | "medium" | "hard"
export type Platform =
  | "leetcode"
  | "gfg"
  | "codeforces"
  | "hackerrank"
  | "custom"

export type ProblemStatus = "todo" | "attempted" | "solved"

export interface IAttempt {
  date: Date
  notes: string
  timeTaken: number
  successful: boolean
}

export interface IAiHint {
  level: 1 | 2 | 3
  hint: string
}

export interface ICodingProblem extends Document {
  userId: mongoose.Types.ObjectId

  title: string
  description: string

  difficulty: ProblemDifficulty
  platform: Platform

  topic: string

  tags: string[]

  link: string

  status: ProblemStatus

  attempts: IAttempt[]

  solution: {
    code: string
    language: string
    notes: string
  }

  aiHints: IAiHint[]

  timeComplexity: string
  spaceComplexity: string
}

const AttemptSchema = new Schema<IAttempt>(
  {
    date: Date,
    notes: String,
    timeTaken: Number,
    successful: Boolean
  },
  { _id: false }
)

const HintSchema = new Schema<IAiHint>(
  {
    level: { type: Number, enum: [1, 2, 3] },
    hint: String
  },
  { _id: false }
)

const CodingProblemSchema = new Schema<ICodingProblem>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true },

    description: { type: String, default: "" },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"]
    },

    platform: {
      type: String,
      enum: ["leetcode", "gfg", "codeforces", "hackerrank", "custom"]
    },

    topic: String,

    tags: { type: [String], default: [] },

    link: String,

    status: {
      type: String,
      enum: ["todo", "attempted", "solved"],
      default: "todo"
    },

    attempts: { type: [AttemptSchema], default: [] },

    solution: {
      code: { type: String, default: "" },
      language: { type: String, default: "python" },
      notes: { type: String, default: "" }
    },

    aiHints: { type: [HintSchema], default: [] },

    timeComplexity: String,
    spaceComplexity: String
  },
  { timestamps: true }
)

CodingProblemSchema.index({ userId: 1, status: 1 })
CodingProblemSchema.index({ userId: 1, topic: 1 })
CodingProblemSchema.index({ userId: 1, difficulty: 1 })

const CodingProblemModel: Model<ICodingProblem> =
  mongoose.model<ICodingProblem>("CodingProblem", CodingProblemSchema)

export default CodingProblemModel