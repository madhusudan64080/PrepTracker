// backend/src/server.ts
import "dotenv/config"
<<<<<<< HEAD


import http from "http"

import app from "./app"
import { connectDB, connectRedis, redisClient } from "./config/database"
=======
import http from "http"
import app from "./app"
import { connectDB } from "./config/database"
>>>>>>> 48fc2b9 (Updated full project with new content)
import { initSocket } from "./socket/socket.server"
import { startReminderWorker, stopReminderWorker } from "./workers/reminder.worker"
import { scheduleGlobalReminders } from "./jobs/reminder.scheduler"

const PORT = Number(process.env.PORT) || 5000
<<<<<<< HEAD
const ENV = process.env.NODE_ENV || "development"
=======
const ENV  = process.env.NODE_ENV || "development"
>>>>>>> 48fc2b9 (Updated full project with new content)

let server: http.Server

async function startServer() {
  try {
<<<<<<< HEAD
    // 1. Connect persistence layer
    await connectDB()
    await connectRedis()

    const ping = await redisClient.ping()
    console.log("Redis ping:", ping)

    // 2. Create HTTP server
    server = http.createServer(app)

    // 3. Bootstrap Socket.io (must be before server.listen)
    initSocket(server)
    console.log("[Socket.io] WebSocket server initialized")

    // 4. Start BullMQ reminder worker
    startReminderWorker()

    // 5. Register global cron reminder jobs
    await scheduleGlobalReminders()

    // 6. Start listening
    server.listen(PORT, () => {
      console.log(
        `PrepTrack API running on port ${PORT} in ${ENV} environment`
      )
=======
    // 0. Validate required environment variables — fail fast before any I/O
    const REQUIRED_ENV = [
      "MONGO_URI",
      "JWT_ACCESS_SECRET",
      "JWT_REFRESH_SECRET",
      "OPENROUTER_API_KEY",
    ]
    const missing = REQUIRED_ENV.filter((k) => !process.env[k])
    if (missing.length) {
      console.error(`[Startup] Missing required env vars: ${missing.join(", ")}`)
      process.exit(1)
    }

    // 1. Connect MongoDB (required — fail fast if unavailable)
    await connectDB()

    // 2. Connect Redis (optional — graceful degradation if unavailable)
    let redisAvailable = false
    if (process.env.REDIS_URL) {
      try {
        const { connectRedis, redisClient } = await import("./config/database")
        await connectRedis()
        const ping = await redisClient.ping()
        console.log("[Redis] ping:", ping)
        redisAvailable = true
      } catch (redisErr) {
        // FIX: Don't crash when Redis is unavailable.
        // BullMQ workers will simply not start; cron reminders are skipped.
        console.warn("[Redis] Connection failed — running without queue/reminders:", (redisErr as Error).message)
      }
    } else {
      console.warn("[Redis] REDIS_URL not set — running without queue/reminders")
    }

    // 3. Create HTTP server
    server = http.createServer(app)

    // 4. Bootstrap Socket.io
    initSocket(server)
    console.log("[Socket.io] WebSocket server initialized")

    // 5. Start BullMQ reminder worker (only if Redis available)
    if (redisAvailable) {
      try {
        startReminderWorker()
        await scheduleGlobalReminders()
      } catch (workerErr) {
        console.warn("[Reminder] Worker/scheduler failed to start:", (workerErr as Error).message)
      }
    }

    // 6. Start listening
    server.listen(PORT, () => {
      console.log(`PrepTrack API running on port ${PORT} in ${ENV} environment`)
>>>>>>> 48fc2b9 (Updated full project with new content)
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

<<<<<<< HEAD
/* -------------------------
   Graceful Shutdown
-------------------------- */

async function shutdown() {
  console.log("Shutting down server...")

  await stopReminderWorker()
=======
/* ── Graceful Shutdown ─────────────────────────────────────── */
async function shutdown() {
  console.log("Shutting down server...")

  try {
    await stopReminderWorker()
  } catch { /* ignore */ }
>>>>>>> 48fc2b9 (Updated full project with new content)

  if (server) {
    server.close(async () => {
      try {
        const mongoose = (await import("mongoose")).default
        await mongoose.disconnect()

<<<<<<< HEAD
        await redisClient.quit()
=======
        try {
          const { redisClient } = await import("./config/database")
          await redisClient?.quit()
        } catch { /* redis may not be connected */ }
>>>>>>> 48fc2b9 (Updated full project with new content)

        console.log("Shutdown complete")
        process.exit(0)
      } catch (err) {
        console.error("Shutdown error:", err)
        process.exit(1)
      }
    })
<<<<<<< HEAD
=======
  } else {
    process.exit(0)
>>>>>>> 48fc2b9 (Updated full project with new content)
  }
}

process.on("SIGTERM", shutdown)
<<<<<<< HEAD
process.on("SIGINT", shutdown)

startServer()
=======
process.on("SIGINT",  shutdown)

startServer()
>>>>>>> 48fc2b9 (Updated full project with new content)
