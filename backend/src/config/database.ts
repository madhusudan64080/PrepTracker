// backend/src/config/database.ts

import mongoose from "mongoose"
import Redis from "ioredis"

const MONGO_URI = process.env.MONGO_URI as string

export let redisClient: Redis

export async function connectDB() {
  let retries = 3

  while (retries > 0) {
    try {
      await mongoose.connect(MONGO_URI)

      console.log("MongoDB connected")

      mongoose.connection.on("error", (err) => {
        console.error("MongoDB error:", err)
      })

      mongoose.connection.on("disconnected", () => {
        console.warn("MongoDB disconnected")
      })

      return
    } catch (error) {
      retries--

      console.error("MongoDB connection failed. Retries left:", retries)

      if (retries === 0) {
        throw error
      }

      await new Promise((res) => setTimeout(res, 5000))
    }
  }
}

export async function connectRedis() {
<<<<<<< HEAD

  redisClient = new Redis(process.env.REDIS_URL as string)
=======
  // FIX: Upstash uses rediss:// (TLS). The plain `new Redis(url)` call
  // doesn't pass rejectUnauthorized:false, causing the TLS handshake to
  // fail silently. Add explicit TLS options when the URL uses rediss://.
  redisClient = new Redis(process.env.REDIS_URL as string, {
    maxRetriesPerRequest: null,
    tls: process.env.REDIS_URL?.startsWith("rediss://")
      ? { rejectUnauthorized: false }
      : undefined
  })
>>>>>>> 48fc2b9 (Updated full project with new content)

  redisClient.on("connect", () => {
    console.log("Redis connected")
  })

  redisClient.on("error", (err) => {
    console.error("Redis error:", err)
  })
}