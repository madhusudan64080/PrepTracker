// backend/src/utils/validation.schemas.ts
//
// FIX (Issue 2 — Scheduler 400):
//   The scheduler POST body contains { subjectId, frequency, topicsPerDay }.
//   The original file had NO validation schema for the scheduler endpoint,
//   so any mismatch between frontend payload and controller expectations
//   would silently produce a 400 when the controller did `const { subjectId } = req.body`
//   and found it undefined.
//
//   A createScheduleSchema is now exported and wired into the route.
//   The frequency enum matches the FREQ_DAYS map in the controller exactly.

import { z } from "zod"

/* =========================
   AUTH SCHEMAS
========================= */

export const registerSchema = z.object({
  name: z.string().min(2).max(50),

  email: z.string().email(),

  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain number")
})

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1)
})

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),

  avatarUrl: z.string().url().optional(),

  learningPreferences: z
    .object({
      reminderTime:     z.string().optional(),
      dailyGoalMinutes: z.number().min(10).max(600).optional()
    })
    .optional()
})

export const onboardingSchema = z.object({
  subjects: z.array(z.string()),

  dailyGoalTargets: z.object({
    topicsToLearn:   z.number(),
    problemsToSolve: z.number(),
    revisionTopics:  z.number(),
    studyMinutes:    z.number()
  }),

  reminderTime: z.string()
})

/* =========================
   SUBJECT
========================= */

export const createSubjectSchema = z.object({
  name: z.string().min(2).max(100),

  description: z.string().optional(),

  color: z
    .string()
    .regex(/^#([0-9A-F]{3}){1,2}$/i),

  icon: z.string().optional()
})

export const updateSubjectSchema = createSubjectSchema.partial()

/* =========================
   TOPICS
========================= */

export const createTopicSchema = z.object({
  subjectId: z.string(),

  name: z.string(),

  difficulty: z.enum(["easy", "medium", "hard"]).optional(),

  estimatedMinutes: z.number().optional()
})

export const bulkCreateTopicsSchema = z.object({
  subjectId: z.string(),
  topics: z.array(
    z.object({
      name:       z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]).optional()
    })
  )
})

export const updateProgressSchema = z.object({
  section: z.enum([
    "concept",
    "visual",
    "code",
    "quiz",
    "flashcards",
    "interview",
    // legacy keys kept for backwards compat
    "visualExample",
    "codeExamples",
    "interviewPrep"
  ]),

  completed: z.boolean(),

  timeSpent: z.number().optional()
})

/* =========================
   CODING
========================= */

export const createProblemSchema = z.object({
  title: z.string(),

  platform: z.enum([
    "leetcode",
    "gfg",
    "codeforces",
    "hackerrank",
    "custom"
  ]),

  difficulty: z.enum(["easy", "medium", "hard"]),

  topic: z.string(),

  link: z.string().url().optional(),

  tags: z.array(z.string()).optional()
})

export const addAttemptSchema = z.object({
  notes:      z.string(),
  timeTaken:  z.number(),
  successful: z.boolean()
})

/* =========================
   GOALS
========================= */

export const setGoalSchema = z.object({
  targets: z.object({
    topicsToLearn:   z.number(),
    problemsToSolve: z.number(),
    revisionTopics:  z.number(),
    studyMinutes:    z.number()
  })
})

export const logStudyTimeSchema = z.object({
  minutes: z.number().min(1).max(480)
})

/* =========================
   PROJECTS
========================= */

export const createProjectSchema = z.object({
  name:        z.string(),
  description: z.string(),
  techStack:   z.array(z.string()).min(1),
  type:        z.enum(["web", "mobile", "ml", "system_design", "other"]),
  difficulty:  z.enum(["beginner", "intermediate", "advanced"])
})

/* =========================
   QUIZ
========================= */

export const submitAttemptSchema = z.object({
  topicId: z.string(),

  answers: z.array(
    z.object({
      questionId:     z.string(),
      selectedAnswer: z.string()
    })
  ),

  timeSpent: z.number()
})

/* =========================
   SCHEDULER  ← FIX (Issue 2)
   
   Matches the controller's expected body exactly:
     subjectId    — MongoDB ObjectId string
     frequency    — one of the keys in FREQ_DAYS map
     topicsPerDay — 1 to 20
========================= */

export const createScheduleSchema = z.object({
  subjectId: z
    .string()
    .min(1, "subjectId is required")
    .regex(/^[a-f\d]{24}$/i, "subjectId must be a valid MongoDB ObjectId"),

  frequency: z.enum(
    ["daily", "every_2_days", "every_3_days", "weekly"],
    {
      errorMap: () => ({
        message: "frequency must be one of: daily, every_2_days, every_3_days, weekly"
      })
    }
  ),

  topicsPerDay: z
    .number()
    .int()
    .min(1, "topicsPerDay must be at least 1")
    .max(20, "topicsPerDay cannot exceed 20")
})