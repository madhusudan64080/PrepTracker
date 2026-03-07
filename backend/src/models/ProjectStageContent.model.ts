// backend/src/models/ProjectStageContent.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

export interface ICodeSnippet {
  title: string
  language: string
  code: string
  explanation: string
}

export interface IResource {
  title: string
  url: string
  type: "article" | "video" | "docs" | "tool"
}

export interface IQuizQuestion {
  question: string
  options: string[]
  answer: string
  explanation: string
}

export interface IProjectStageContent extends Document {
  projectId: mongoose.Types.ObjectId
  stageNumber: number
  stageName: string

  content: {
    explanation: string
    keyPoints: string[]
    textDiagram: string
    codeSnippets: ICodeSnippet[]
    checklistItems: string[]
    resources: IResource[]
    quizQuestions: IQuizQuestion[]
    tips: string[]
  }

  generatedAt: Date
}

const CodeSnippetSchema = new Schema<ICodeSnippet>(
  {
    title: String,
    language: String,
    code: String,
    explanation: String
  },
  { _id: false }
)

const ResourceSchema = new Schema<IResource>(
  {
    title: String,
    url: String,
    type: {
      type: String,
      enum: ["article", "video", "docs", "tool"]
    }
  },
  { _id: false }
)

const QuizSchema = new Schema<IQuizQuestion>(
  {
    question: String,
    options: [String],
    answer: String,
    explanation: String
  },
  { _id: false }
)

const ProjectStageContentSchema = new Schema<IProjectStageContent>({
  projectId: {
    type: Schema.Types.ObjectId,
    ref: "Project",
    required: true
  },

  stageNumber: {
    type: Number,
    min: 1,
    max: 9
  },

  stageName: String,

  content: {
    explanation: String,
    keyPoints: [String],
    textDiagram: String,
    codeSnippets: [CodeSnippetSchema],
    checklistItems: [String],
    resources: [ResourceSchema],
    quizQuestions: [QuizSchema],
    tips: [String]
  },

  generatedAt: {
    type: Date,
    default: Date.now
  }
})

ProjectStageContentSchema.index(
  { projectId: 1, stageNumber: 1 },
  { unique: true }
)

const ProjectStageContentModel: Model<IProjectStageContent> =
  mongoose.model<IProjectStageContent>(
    "ProjectStageContent",
    ProjectStageContentSchema
  )

export default ProjectStageContentModel