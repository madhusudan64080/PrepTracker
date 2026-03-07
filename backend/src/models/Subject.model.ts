// backend/src/models/Subject.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

export interface ISubject extends Document {
  userId: mongoose.Types.ObjectId
  name: string
  description?: string
  color: string
  icon: string

  totalTopics: number
  completedTopics: number

  isArchived: boolean
  order: number
}

const SubjectSchema = new Schema<ISubject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    name: { type: String, required: true, trim: true },

    description: { type: String, default: "" },

    color: { type: String, default: "#6366f1" },

    icon: { type: String, default: "📚" },

    totalTopics: { type: Number, default: 0 },

    completedTopics: { type: Number, default: 0 },

    isArchived: { type: Boolean, default: false },

    order: { type: Number, default: 0 }
  },
  { timestamps: true }
)

SubjectSchema.index({ userId: 1 })
SubjectSchema.index({ userId: 1, name: 1 }, { unique: true })

SubjectSchema.virtual("completionPercentage").get(function () {
  if (this.totalTopics === 0) return 0
  return (this.completedTopics / this.totalTopics) * 100
})

const SubjectModel: Model<ISubject> = mongoose.model<ISubject>(
  "Subject",
  SubjectSchema
)

export default SubjectModel