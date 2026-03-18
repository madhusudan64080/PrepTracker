// backend/src/app.ts

import express, { Application, Request, Response, NextFunction } from "express"
import compression from "compression"
import helmet from "helmet"
import cors from "cors"
import cookieParser from "cookie-parser"
import morgan from "morgan"

import { errorHandler } from "./middleware/error.middleware"

import authRoutes from "./routes/auth.routes"
import subjectRoutes from "./routes/subject.routes"
import topicRoutes from "./routes/topic.routes"
import contentRoutes from "./routes/content.routes"
import quizRoutes from "./routes/quiz.routes"
import revisionRoutes from "./routes/revision.routes"
import goalRoutes from "./routes/goal.routes"
import codingRoutes from "./routes/coding.routes"
import projectRoutes from "./routes/project.routes"
import analyticsRoutes from "./routes/analytics.routes"
import interviewRoutes from "./routes/interview.routes"
import notesRoutes from "./routes/notes.routes"
import contestRoutes from "./routes/contest.routes"
import schedulerRoutes from "./routes/scheduler.routes"
import dailyTaskRoutes from "./routes/dailyTask.routes"

const app: Application = express()

/* -----------------------------
   Core Middleware
------------------------------ */

app.use(helmet())
app.use(compression())

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  /\.vercel\.app$/,  // allow all Vercel preview URLs
].filter(Boolean)

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true) // allow server-to-server
      const allowed = ALLOWED_ORIGINS.some(o =>
        typeof o === "string" ? o === origin : (o as RegExp).test(origin)
      )
      callback(allowed ? null : new Error("Not allowed by CORS"), allowed)
    },
    credentials: true
  })
)

app.use(express.json({ limit: "2mb" }))
app.use(cookieParser())

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"))
}

/* -----------------------------
   Health Check
------------------------------ */

app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV
  })
})

/* -----------------------------
   API Routes
------------------------------ */

app.use("/api/auth", authRoutes)
app.use("/api/subjects", subjectRoutes)
app.use("/api/topics", topicRoutes)
app.use("/api/content", contentRoutes)
app.use("/api/quiz", quizRoutes)
app.use("/api/revision", revisionRoutes)
app.use("/api/goals", goalRoutes)
app.use("/api/coding", codingRoutes)
app.use("/api/projects", projectRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/interview", interviewRoutes)
app.use("/api/notes", notesRoutes)
app.use("/api/contest", contestRoutes)
app.use("/api/scheduler", schedulerRoutes)
app.use("/api/daily-tasks", dailyTaskRoutes)

/* -----------------------------
   404 Handler
------------------------------ */

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  })
})

/* -----------------------------
   Global Error Handler
------------------------------ */

app.use(errorHandler)

export default app