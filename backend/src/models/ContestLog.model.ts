// backend/src/models/ContestLog.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

export type ContestPlatform =
  | "leetcode"
  | "codeforces"
  | "hackerrank"
  | "atcoder"
  | "other"

export interface IContestLog extends Document {
  userId: mongoose.Types.ObjectId

  platform: ContestPlatform

  contestName: string

  date: Date

  rank: number

  totalParticipants: number

  problemsSolved: number

  totalProblems: number

  ratingChange: number

  notes: string
}

const ContestLogSchema = new Schema<IContestLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  platform: {
    type: String,
    enum: ["leetcode", "codeforces", "hackerrank", "atcoder", "other"]
  },

  contestName: {
    type: String,
    required: true
  },

  date: {
    type: Date,
    required: true
  },

  rank: Number,

  totalParticipants: Number,

  problemsSolved: Number,

  totalProblems: Number,

  ratingChange: Number,

  notes: {
    type: String,
    default: ""
  }
})

ContestLogSchema.index({ userId: 1 })
ContestLogSchema.index({ userId: 1, platform: 1 })

const ContestLogModel: Model<IContestLog> = mongoose.model<IContestLog>(
  "ContestLog",
  ContestLogSchema
)

export default ContestLogModel