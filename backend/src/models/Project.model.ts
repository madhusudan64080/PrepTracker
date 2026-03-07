// backend/src/models/Project.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

export type ProjectType = "web" | "mobile" | "ml" | "system_design" | "other"
export type ProjectDifficulty = "beginner" | "intermediate" | "advanced"
export type ProjectStatus = "planning" | "in_progress" | "completed"
export type StageStatus = "locked" | "available" | "in_progress" | "completed"

export interface IProjectStage {
  stageNumber: number
  stageName: string
  description: string
  estimatedHours: number
  status: StageStatus
  completedAt?: Date
}

export interface IProject extends Document {
  userId: mongoose.Types.ObjectId

  name: string
  description: string
  techStack: string[]

  type: ProjectType
  difficulty: ProjectDifficulty
  status: ProjectStatus

  stages: IProjectStage[]

  completionPercentage: number

  thumbnail: string

  aiContentGenerated: boolean
}

const StageSchema = new Schema<IProjectStage>(
  {
    stageNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 9
    },

    stageName: {
      type: String,
      required: true
    },

    description: {
      type: String,
      default: ""
    },

    estimatedHours: {
      type: Number,
      default: 1
    },

    status: {
      type: String,
      enum: ["locked", "available", "in_progress", "completed"],
      default: "locked"
    },

    completedAt: {
      type: Date
    }
  },
  { _id: false }
)

const ProjectSchema = new Schema<IProject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      default: ""
    },

    techStack: {
      type: [String],
      default: []
    },

    type: {
      type: String,
      enum: ["web", "mobile", "ml", "system_design", "other"],
      required: true
    },

    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true
    },

    status: {
      type: String,
      enum: ["planning", "in_progress", "completed"],
      default: "planning"
    },

    stages: {
      type: [StageSchema],
      default: []
    },

    completionPercentage: {
      type: Number,
      default: 0
    },

    thumbnail: {
      type: String,
      default: "🚀"
    },

    aiContentGenerated: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

ProjectSchema.index({ userId: 1 })
ProjectSchema.index({ userId: 1, status: 1 })

const ProjectModel: Model<IProject> = mongoose.model<IProject>(
  "Project",
  ProjectSchema
)

export default ProjectModel