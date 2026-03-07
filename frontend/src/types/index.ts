// frontend/src/types/index.ts

/* =====================================================
   ENUMS
===================================================== */

export enum TopicStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed"
}

export enum TopicDifficulty {
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard"
}

export enum CodingPlatform {
  LEETCODE = "leetcode",
  CODEFORCES = "codeforces",
  HACKERRANK = "hackerrank",
  CODECHEF = "codechef",
  GEEKSFORGEEKS = "geeksforgeeks",
  OTHER = "other"
}

export enum CodingProblemStatus {
  UNSOLVED = "unsolved",
  ATTEMPTED = "attempted",
  SOLVED = "solved"
}

export enum QuizQuestionType {
  MULTIPLE_CHOICE = "multiple_choice",
  TRUE_FALSE = "true_false",
  SHORT_ANSWER = "short_answer"
}

export enum InterviewQuestionType {
  CONCEPTUAL = "conceptual",
  CODING = "coding",
  SYSTEM_DESIGN = "system_design",
  BEHAVIORAL = "behavioral"
}

export enum ActivityType {
  STUDY_TOPIC = "study_topic",
  COMPLETE_TOPIC = "complete_topic",
  QUIZ_ATTEMPT = "quiz_attempt",
  REVISION_DONE = "revision_done",
  CODING_PROBLEM_SOLVED = "coding_problem_solved",
  PROJECT_STAGE_COMPLETED = "project_stage_completed",
  LOGIN = "login",
  STREAK_UPDATE = "streak_update"
}

/* =====================================================
   USER
===================================================== */

export interface UserStreak {
  currentStreak: number
  longestStreak: number
  lastActiveDate: string
}

export interface LearningPreferences {
  preferredMethods: string[]
  dailyGoalMinutes: number
  reminderTime: string
}

export interface User {
  _id: string
  name: string
  email: string
  avatarUrl: string | null
  onboardingCompleted: boolean

  streak: UserStreak

  learningPreferences: LearningPreferences

  createdAt: string
  updatedAt: string
}

/* =====================================================
   SUBJECT
===================================================== */

export interface Subject {
  _id: string
  name: string
  description: string
  color: string
  icon: string

  totalTopics: number
  completedTopics: number

  createdAt: string
  updatedAt: string
}

/* =====================================================
   TOPIC
===================================================== */

export interface Topic {
  _id: string

  subjectId: string
  name: string
  description: string

  status: TopicStatus
  difficulty: TopicDifficulty

  masteryScore: number

  contentGenerated: boolean

  lastStudiedAt: string | null

  revisionCount: number

  estimatedMinutes: number

  tags: string[]

  createdAt: string
  updatedAt: string
}

/* =====================================================
   AI GENERATED TOPIC CONTENT
===================================================== */

export interface ConceptSection {
  summary: string
  keyPoints: string[]
  realWorldAnalogy: string
  prerequisites: string[]
  commonMisconceptions: string[]
}

export interface VisualExplanation {
  textDiagram: string
  stepByStepBreakdown: string[]
  memoryTrick: string
}

export interface CodeExample {
  language: string
  title: string
  code: string
  explanation: string
  timeComplexity: string
  spaceComplexity: string
}

export interface QuizQuestion {
  id: string
  question: string
  type: QuizQuestionType
  options?: string[]
  correctAnswer: string
  explanation: string
  difficulty: TopicDifficulty
}

export interface Flashcard {
  id: string
  front: string
  back: string
  hint: string
}

export interface InterviewQuestion {
  id: string
  question: string
  type: InterviewQuestionType
  difficulty: TopicDifficulty
  idealAnswer: string
  keyPointsToMention: string[]
  followUpQuestions: string[]
  timeToAnswer: number
}

export interface TopicContent {
  _id: string

  topicId: string

  concept: ConceptSection

  visualExplanation: VisualExplanation

  codeExamples: CodeExample[]

  quizQuestions: QuizQuestion[]

  flashcards: Flashcard[]

  interviewQuestions: InterviewQuestion[]

  relatedTopics: string[]

  generatedAt: string

  generationModel: string
}

/* =====================================================
   TOPIC PROGRESS
===================================================== */

export interface TopicSectionsCompleted {
  concept: boolean
  visualExplanation: boolean
  codeExamples: boolean
  quiz: boolean
  flashcards: boolean
  interviewQuestions: boolean
}

export interface TopicProgress {
  _id: string

  userId: string
  topicId: string

  sectionsCompleted: TopicSectionsCompleted

  quizScore: number | null

  masteryScore: number

  lastStudiedAt: string

  createdAt: string
  updatedAt: string
}

/* =====================================================
   REVISION SYSTEM (SM-2)
===================================================== */

export interface RevisionItem {
  _id: string
  userId: string
  topicId: string

  efFactor: number
  repetition: number

  nextReviewDate: string

  revisionDates: string[]

  lastQualityScore: number

  createdAt: string
  updatedAt: string
}

export interface RevisionSchedule {
  userId: string
  items: RevisionItem[]
}

/* =====================================================
   DAILY GOALS
===================================================== */

export interface DailyGoalTargets {
  studyMinutes: number
  topicsCompleted: number
  quizzesTaken: number
  codingProblemsSolved: number
}

export interface DailyGoalAchieved {
  studyMinutes: number
  topicsCompleted: number
  quizzesTaken: number
  codingProblemsSolved: number
}

export interface DailyGoal {
  _id: string
  userId: string

  date: string

  targets: DailyGoalTargets
  achieved: DailyGoalAchieved

  createdAt: string
  updatedAt: string
}

/* =====================================================
   CODING PRACTICE
===================================================== */

export interface CodingAttempt {
  attemptId: string
  attemptedAt: string
  codeSubmitted: string
  result: "accepted" | "wrong_answer" | "time_limit_exceeded" | "runtime_error"
}

export interface CodingSolution {
  code: string
  explanation: string
  timeComplexity: string
  spaceComplexity: string
}

export interface AIHint {
  id: string
  hint: string
  createdAt: string
}

export interface CodingProblem {
  _id: string

  title: string
  description: string

  platform: CodingPlatform

  difficulty: TopicDifficulty

  status: CodingProblemStatus

  attempts: CodingAttempt[]

  solution: CodingSolution | null

  aiHints: AIHint[]

  tags: string[]

  createdAt: string
  updatedAt: string
}

/* =====================================================
   PROJECT BASED LEARNING
===================================================== */

export interface ProjectStage {
  stageNumber: number
  title: string
  description: string
  locked: boolean
  completed: boolean
}

export interface Project {
  _id: string
  name: string
  description: string

  difficulty: TopicDifficulty

  stages: ProjectStage[]

  createdAt: string
  updatedAt: string
}

export interface ProjectStageContent {
  _id: string
  projectId: string
  stageNumber: number

  title: string

  content: {
    explanation: string
    objectives: string[]
    tasks: string[]
    resources: string[]
    codeTemplates: string[]
  }

  createdAt: string
}

/* =====================================================
   ACTIVITY LOG
===================================================== */

export interface ActivityLog {
  _id: string
  userId: string

  type: ActivityType

  metadata: {
    topicId?: string
    subjectId?: string
    quizId?: string
    codingProblemId?: string
    projectId?: string
    stageNumber?: number
  }

  createdAt: string
}

/* =====================================================
   ANALYTICS
===================================================== */

export interface HeatmapData {
  date: string
  value: number
}

export interface SubjectAnalytics {
  subjectId: string
  subjectName: string

  totalTopics: number
  completedTopics: number

  masteryAverage: number

  studyMinutes: number
}

export interface AnalyticsOverview {
  totalStudyMinutes: number
  topicsCompleted: number
  quizzesTaken: number
  codingProblemsSolved: number

  currentStreak: number

  heatmap: HeatmapData[]

  subjectAnalytics: SubjectAnalytics[]
}

/* =====================================================
   QUIZ SYSTEM
===================================================== */

export interface QuizAttempt {
  attemptId: string
  topicId: string

  answers: {
    questionId: string
    selectedAnswer: string
  }[]

  startedAt: string
  completedAt: string
}

export interface QuizBreakdown {
  questionId: string
  correct: boolean
  selectedAnswer: string
  correctAnswer: string
}

export interface QuizResult {
  attemptId: string

  score: number

  totalQuestions: number
  correctAnswers: number

  breakdown: QuizBreakdown[]

  completedAt: string
}

/* =====================================================
   API RESPONSE WRAPPERS
===================================================== */

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  message: string
  errorCode?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
}

/* =====================================================
   FORM INPUT TYPES
===================================================== */

export interface LoginFormInput {
  email: string
  password: string
}

export interface RegisterFormInput {
  name: string
  email: string
  password: string
}

export interface OnboardingFormInput {
  preferredMethods: string[]
  dailyGoalMinutes: number
  reminderTime: string
}

export interface TopicSearchInput {
  query: string
  difficulty?: TopicDifficulty
  subjectId?: string
}

export interface CodingProblemSubmitInput {
  problemId: string
  code: string
}

export interface QuizSubmitInput {
  topicId: string
  answers: {
    questionId: string
    selectedAnswer: string
  }[]
}