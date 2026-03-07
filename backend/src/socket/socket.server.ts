// backend/src/socket/socket.server.ts
// Real-time multi-device synchronization via Socket.io

import { Server as HttpServer } from "http"
import { Server as SocketServer, Socket } from "socket.io"
import { verifyAccessToken } from "../utils/jwt.utils"

export type SyncEventType =
  | "topic:complete"
  | "topic:progress"
  | "revision:complete"
  | "goal:update"
  | "streak:update"
  | "subject:create"
  | "subject:delete"
  | "coding:log"

export interface SyncPayload {
  event: SyncEventType
  data: Record<string, unknown>
  timestamp: number
}

let io: SocketServer

/**
 * Bootstraps Socket.io on the given HTTP server.
 * Each authenticated user is placed in their own room (userId).
 * Any server-side change can broadcast to that room so all open
 * tabs/devices receive it immediately.
 */
export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true
    },
    // Use polling as fallback when WebSocket is blocked
    transports: ["websocket", "polling"],
    // Heartbeat / keep-alive
    pingTimeout: 20000,
    pingInterval: 25000
  })

  // ── Authentication middleware ─────────────────────────────────
  io.use((socket: Socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "")

    if (!token) {
      return next(new Error("Authentication required"))
    }

    try {
      const payload = verifyAccessToken(token)
      if (!payload) {
        return next(new Error("Invalid token"))
      }
      // Attach userId to socket for later use
      ;(socket as any).userId = payload.userId
      next()
    } catch {
      next(new Error("Invalid token"))
    }
  })

  // ── Connection handler ────────────────────────────────────────
  io.on("connection", (socket: Socket) => {
    const userId: string = (socket as any).userId

    // Each user gets a private room so broadcasts are isolated
    socket.join(`user:${userId}`)

    if (process.env.NODE_ENV !== "production") {
      console.log(`Socket connected: ${socket.id} → user:${userId}`)
    }

    // Client can send its own changes (offline-first sync)
    socket.on("client:sync", (payload: SyncPayload) => {
      // Re-broadcast to every OTHER device/tab of the same user
      socket.to(`user:${userId}`).emit("server:sync", {
        ...payload,
        origin: socket.id
      })
    })

    // Explicit request to join a subject room for granular updates
    socket.on("join:subject", (subjectId: string) => {
      socket.join(`subject:${subjectId}`)
    })

    socket.on("leave:subject", (subjectId: string) => {
      socket.leave(`subject:${subjectId}`)
    })

    socket.on("disconnect", (reason) => {
      if (process.env.NODE_ENV !== "production") {
        console.log(`Socket disconnected: ${socket.id} reason=${reason}`)
      }
    })
  })

  return io
}

/**
 * Broadcast a sync event to ALL devices belonging to a user.
 * Call this from any controller after a successful mutation.
 *
 * @example
 *   broadcastToUser(userId, "topic:complete", { topicId, status })
 */
export function broadcastToUser(
  userId: string,
  event: SyncEventType,
  data: Record<string, unknown>
): void {
  if (!io) return

  const payload: SyncPayload = {
    event,
    data,
    timestamp: Date.now()
  }

  io.to(`user:${userId}`).emit("server:sync", payload)
}

export function getSocketServer(): SocketServer {
  return io
}
