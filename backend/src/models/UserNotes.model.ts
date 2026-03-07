// backend/src/models/UserNotes.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"

export interface IUserNotes extends Document {
  userId: mongoose.Types.ObjectId
  topicId: mongoose.Types.ObjectId

  content: string

  lastSavedAt: Date
}

const UserNotesSchema = new Schema<IUserNotes>({
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

  content: {
    type: String,
    default: ""
  },

  lastSavedAt: {
    type: Date,
    default: Date.now
  }
})

UserNotesSchema.index({ userId: 1, topicId: 1 }, { unique: true })

const UserNotesModel: Model<IUserNotes> = mongoose.model<IUserNotes>(
  "UserNotes",
  UserNotesSchema
)

export default UserNotesModel