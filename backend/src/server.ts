// backend/src/server.ts
import "dotenv/config"


import http from "http"

import app from "./app"
import { connectDB, connectRedis, redisClient } from "./config/database"
import { initSocket } from "./socket/socket.server"
import { startReminderWorker, stopReminderWorker } from "./workers/reminder.worker"
import { scheduleGlobalReminders } from "./jobs/reminder.scheduler"

const PORT = Number(process.env.PORT) || 5000
const ENV = process.env.NODE_ENV || "development"

let server: http.Server

async function startServer() {
  try {
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
    })
  } catch (error) {
    console.error("Failed to start server:", error)
    process.exit(1)
  }
}

/* -------------------------
   Graceful Shutdown
-------------------------- */

async function shutdown() {
  console.log("Shutting down server...")

  await stopReminderWorker()

  if (server) {
    server.close(async () => {
      try {
        const mongoose = (await import("mongoose")).default
        await mongoose.disconnect()

        await redisClient.quit()

        console.log("Shutdown complete")
        process.exit(0)
      } catch (err) {
        console.error("Shutdown error:", err)
        process.exit(1)
      }
    })
  }
}

process.on("SIGTERM", shutdown)
process.on("SIGINT", shutdown)

startServer()