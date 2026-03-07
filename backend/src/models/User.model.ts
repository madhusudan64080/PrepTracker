// backend/src/models/User.model.ts

import mongoose, { Schema, Document, Model } from "mongoose"
import bcrypt from "bcryptjs"

export interface IUserStreak {
  currentStreak: number
  longestStreak: number
  lastActiveDate?: Date
}

export interface ILearningPreferences {
  preferredMethods: string[]
  dailyGoalMinutes: number
  reminderTime: string
}

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  avatarUrl?: string
  onboardingCompleted: boolean

  streak: IUserStreak
  learningPreferences: ILearningPreferences

  refreshTokens: string[]

  comparePassword(candidatePassword: string): Promise<boolean>
}

const StreakSchema = new Schema<IUserStreak>(
  {
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastActiveDate: { type: Date }
  },
  { _id: false }
)

const LearningPreferencesSchema = new Schema<ILearningPreferences>(
  {
    preferredMethods: { type: [String], default: [] },
    dailyGoalMinutes: { type: Number, default: 90 },
    reminderTime: { type: String, default: "21:00" }
  },
  { _id: false }
)

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    passwordHash: { type: String, required: true },

    avatarUrl: { type: String },

    onboardingCompleted: {
      type: Boolean,
      default: false
    },

    streak: {
      type: StreakSchema,
      default: () => ({})
    },

    learningPreferences: {
      type: LearningPreferencesSchema,
      default: () => ({})
    },

    refreshTokens: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
)

UserSchema.index({ email: 1 }, { unique: true })

UserSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("passwordHash")) return next()

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10

  const salt = await bcrypt.genSalt(saltRounds)

  this.passwordHash = await bcrypt.hash(this.passwordHash, salt)

  next()
})

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash)
}

const UserModel: Model<IUser> = mongoose.model<IUser>("User", UserSchema)

export default UserModel