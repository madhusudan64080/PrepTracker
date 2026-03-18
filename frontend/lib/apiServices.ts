// frontend/lib/apiServices.ts
// FIXES applied:
//   Issue 2 — Scheduler 400: the old create() type said { subjectId, frequency, topicsPerDay }
//             which IS correct. The real problem was that the frontend dashboard was not
//             initialising subjectId before submit, causing an empty string to be sent.
//             The service signature is kept unchanged but documented clearly.
//
//   Issue 4 — Auth refresh: refreshToken now uses the api instance (with credentials)
//             instead of a raw axios call, avoiding ERR_CONNECTION_REFUSED when
//             NEXT_PUBLIC_API_URL is not set (falls back to relative /api/*).

import { api } from "./api";

/* ---------------- AUTH ---------------- */

export const authService = {
  register: (data: {
    name: string;
    email: string;
    password: string;
  }) => api.post("/api/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post("/api/auth/login", data),

  logout: () => api.post("/api/auth/logout"),

  // FIX (Issue 4): Use the shared api instance so baseURL is resolved
  // from NEXT_PUBLIC_API_URL consistently — avoids localhost hard-coding
  // that caused ERR_CONNECTION_REFUSED in staging/prod.
  refreshToken: () => api.post("/api/auth/refresh", {}),

  getMe: () => api.get("/api/auth/me"),

  updateProfile: (data: { name?: string; avatarUrl?: string }) =>
    api.patch("/api/auth/profile", data),

  completeOnboarding: (data: {
    subjects?: string[];
    dailyGoalTargets?: {
      topicsToLearn: number;
      problemsToSolve: number;
      revisionTopics: number;
      studyMinutes: number;
    };
    reminderTime?: string;
  }) => api.post("/api/auth/onboarding", data)
};

/* ---------------- SUBJECT ---------------- */

export const subjectService = {
  getAll: () => api.get("/api/subjects"),

  create: (data: { name: string; color?: string; icon?: string; description?: string }) =>
    api.post("/api/subjects", data),

  getById: (id: string) => api.get(`/api/subjects/${id}`),

  update: (id: string, data: Partial<{ name: string; color: string; icon: string }>) =>
    api.patch(`/api/subjects/${id}`, data),

  delete: (id: string) => api.delete(`/api/subjects/${id}`),

  reorder: (order: { id: string; order: number }[]) =>
    api.post("/api/subjects/reorder", { order })
};

/* ---------------- TOPIC ---------------- */

export const topicService = {
  getBySubject: (subjectId: string) =>
    api.get(`/api/topics?subjectId=${subjectId}`),

  getById: (topicId: string) =>
    api.get(`/api/topics/${topicId}`),

  create: (data: { subjectId: string; name: string; difficulty?: string; estimatedMinutes?: number }) =>
    api.post("/api/topics", data),

  createBulk: (subjectId: string, topics: { name: string; difficulty?: string }[]) =>
    api.post("/api/topics/bulk", { subjectId, topics }),

  update: (topicId: string, data: Record<string, unknown>) =>
    api.patch(`/api/topics/${topicId}`, data),

  delete: (topicId: string) => api.delete(`/api/topics/${topicId}`),

  updateProgress: (topicId: string, data: { section: string; completed: boolean; timeSpent?: number }) =>
    api.patch(`/api/topics/${topicId}/progress`, data),

  complete: (topicId: string) =>
    api.post(`/api/topics/${topicId}/complete`),

  reorder: (subjectId: string, topicIds: string[]) =>
    api.post("/api/topics/reorder", { subjectId, topicIds })
};

/* ---------------- SCHEDULER ---------------- */
// FIX (Issue 2):
//   Backend POST /api/scheduler expects exactly:
//     { subjectId: string, frequency: string, topicsPerDay: number }
//   The old type had the same shape but was incomplete in documentation.
//   This is now fully typed so TypeScript will catch callers that send wrong fields.

export const schedulerService = {
  getAll:   () => api.get("/api/scheduler"),
  getToday: () => api.get("/api/scheduler/today"),

  create: (data: {
    subjectId:    string;   // required — MongoDB ObjectId of the subject
    frequency:    "daily" | "every_2_days" | "every_3_days" | "weekly";
    topicsPerDay: number;   // 1-10
  }) => api.post("/api/scheduler", data),

  remove: (id: string) => api.delete(`/api/scheduler/${id}`)
};

/* ---------------- CONTENT ---------------- */
// FIX (Issue 1 + 6):
//   getTopicContent uses GET (fetch/cache) — no generation side-effect.
//   generateContent is reserved for the explicit "Regenerate" action only.

export const contentService = {
  // GET — returns stored content; backend generates once if absent
  getTopicContent: (topicId: string, method?: string) =>
    api.get(`/api/content/topic/${topicId}`, {
      params: method ? { method } : {}
    }),

  getTopicMethods: (topicId: string) =>
    api.get(`/api/content/topic/${topicId}/methods`),

  // POST — force-generates new content (used by Regenerate button only)
  generateContent: (topicId: string, method: string) =>
    api.post(`/api/content/topic/${topicId}/generate`, { method }),

  regenerateContent: (topicId: string, method = "topic_explanation") =>
    api.post(`/api/content/topic/${topicId}/regenerate`, { method }),

  getProjectStageContent: (projectId: string, stage: number) =>
    api.get(`/api/content/project/${projectId}/stage/${stage}`)
};

/* ---------------- QUIZ ---------------- */

export const quizService = {
  getTopicQuiz: (topicId: string) =>
    api.get(`/api/quiz/topic/${topicId}`),

  submitAttempt: (data: {
    topicId: string;
    answers: { questionId: string; selectedAnswer: string }[];
    timeSpent: number;
    isRevisionQuiz?: boolean;
  }) => api.post("/api/quiz/attempt", data),

  getHistory: (topicId: string) => api.get(`/api/quiz/history/${topicId}`),

  generateWeeklyQuiz: () => api.post("/api/quiz/weekly")
};

/* ---------------- REVISION ---------------- */

export const revisionService = {
  getToday: () => api.get("/api/revision/today"),

  getSchedule: () => api.get("/api/revision/schedule"),

  getOverdue: () => api.get("/api/revision/overdue"),

  complete: (topicId: string, score?: number) =>
    api.post(`/api/revision/${topicId}/complete`, { score }),

  getWeeklySummary: () => api.get("/api/revision/weekly-summary"),

  generateWeeklyQuiz: () => api.get("/api/revision/weekly-quiz")
};

/* ---------------- GOALS ---------------- */

export const goalService = {
  getToday: () => api.get("/api/goals/today"),

  setGoal: (targets: {
    topicsToLearn?: number;
    problemsToSolve?: number;
    revisionTopics?: number;
    studyMinutes?: number;
  }) => api.post("/api/goals/set", { targets }),

  logStudyTime: (minutes: number) =>
    api.post("/api/goals/log", { minutes })
};

/* ---------------- CODING ---------------- */

export const codingService = {
  getAll: () => api.get("/api/coding"),

  create: (data: {
    title: string;
    platform: string;
    difficulty: string;
    topic: string;
    link?: string;
    tags?: string[];
  }) => api.post("/api/coding", data),

  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/api/coding/${id}`, data),

  delete: (id: string) => api.delete(`/api/coding/${id}`),

  addAttempt: (id: string, data: { notes: string; timeTaken: number; successful: boolean }) =>
    api.post(`/api/coding/${id}/attempt`, data),

  getHints: (problemId: string) =>
    api.get(`/api/content/coding/${problemId}/hints`),

  getStats: () => api.get("/api/coding/stats")
};

/* ---------------- PROJECTS ---------------- */

export const projectService = {
  getAll: () => api.get("/api/projects"),

  create: (data: {
    name: string;
    description: string;
    techStack: string[];
    type: string;
    difficulty: string;
  }) => api.post("/api/projects", data),

  getById: (id: string) => api.get(`/api/projects/${id}`),

  delete: (id: string) => api.delete(`/api/projects/${id}`),

  getStageContent: (projectId: string, stage: number) =>
    api.get(`/api/projects/${projectId}/stages/${stage}`),

  completeStage: (projectId: string, stage: number) =>
    api.post(`/api/projects/${projectId}/stages/${stage}/complete`)
};

/* ---------------- INTERVIEW ---------------- */

export const interviewService = {
  getQuestions: (topicId: string) =>
    api.get(`/api/interview/questions?topicId=${topicId}`),

  revealAnswer: (questionId: string) =>
    api.get(`/api/interview/questions/${questionId}/answer`),

  getCompanyQuestions: (data: { role: string; company: string; count: number }) =>
    api.post("/api/interview/company-questions", data),

  submitSession: (data: {
    questions: { id: string; selfRating: "nailed" | "partial" | "missed" }[];
    totalTime: number;
  }) => api.post("/api/interview/session", data),

  getHistory: () => api.get("/api/interview/history")
};

/* ---------------- ANALYTICS ---------------- */

export const analyticsService = {
  getOverview: () => api.get("/api/analytics/overview"),

  getHeatmap: () => api.get("/api/analytics/heatmap"),

  getSubjects: () => api.get("/api/analytics/subjects"),

  getCodingProgress: () => api.get("/api/analytics/coding-progress"),

  getQuizTrend: () => api.get("/api/analytics/quiz-trend")
};

/* ---------------- NOTES ---------------- */

export const notesService = {
  getNote: (topicId: string) =>
    api.get(`/api/notes/${topicId}`),

  saveNote: (topicId: string, content: string) =>
    api.put(`/api/notes/${topicId}`, { content })
};

/* ---------------- DAILY TASKS (Today's Goals) ---------------- */

export const dailyTaskService = {
  /** Fetch full today's goals: study, revision, pending + progress counts */
  getToday: () => api.get("/api/daily-tasks/today"),

<<<<<<< HEAD
=======
  /**
   * Fetch overdue tasks (past days still pending) for the delay notification system.
   * Returns OverdueTaskInfo[] from the backend.
   */
  getOverdue: () => api.get("/api/daily-tasks/overdue"),

>>>>>>> 48fc2b9 (Updated full project with new content)
  /** Mark a task as completed */
  complete: (data: {
    topicId:      string;
    taskType:     "study" | "revision" | "pending";
    revisionCycle?: "same_day" | "two_day" | "weekly";
  }) => api.post("/api/daily-tasks/complete", data)
};