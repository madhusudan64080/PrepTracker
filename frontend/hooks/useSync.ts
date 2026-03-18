// frontend/hooks/useSync.ts
// Real-time multi-device synchronization via Socket.io

import { useEffect, useRef, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { authStore } from "@/store/authStore"
import { subjectStore } from "@/store/subjectStore"

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
  origin?: string
}

type SyncHandler = (payload: SyncPayload) => void

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:5000" : "")

// Singleton socket so multiple hook consumers share one connection
let socketInstance: Socket | null = null
const handlers = new Map<SyncEventType, Set<SyncHandler>>()

function getSocket(token: string): Socket {
  if (!WS_URL) {
    throw new Error(
      "[Sync] Missing NEXT_PUBLIC_WS_URL/NEXT_PUBLIC_API_URL in production; refusing to connect to localhost."
    )
  }
  if (socketInstance?.connected) return socketInstance

  if (socketInstance) {
    socketInstance.disconnect()
  }

  socketInstance = io(WS_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000
  })

  // Dispatch to registered handlers on any server sync
  socketInstance.on("server:sync", (payload: SyncPayload) => {
    const set = handlers.get(payload.event)
    if (set) {
      set.forEach((fn) => fn(payload))
    }

    // Built-in cross-store reactions
    handleStoreUpdate(payload)
  })

  socketInstance.on("connect_error", (err) => {
    console.warn("[Sync] WebSocket connect error:", err.message)
  })

  return socketInstance
}

/** Apply server sync events directly to Zustand stores */
function handleStoreUpdate(payload: SyncPayload) {
  const { event, data } = payload

  switch (event) {
    case "subject:create":
    case "subject:delete":
      // Trigger a refetch of subjects in the subject store
      subjectStore.getState().fetchSubjects?.()
      break

    case "streak:update":
      if (data.streak) {
        authStore.getState().updateUser({ streak: data.streak as any })
      }
      break

    default:
      break
  }
}

/**
 * useSync — subscribes to real-time sync events.
 *
 * @example
 * const { emit } = useSync({
 *   "topic:complete": ({ data }) => refetchTopics(),
 * })
 *
 * // After completing a topic locally:
 * emit("topic:complete", { topicId, status: "completed" })
 */
export function useSync(
  subscriptions?: Partial<Record<SyncEventType, SyncHandler>>
): {
  emit: (event: SyncEventType, data: Record<string, unknown>) => void
  isConnected: boolean
} {
  const { accessToken } = authStore()
  const socketRef = useRef<Socket | null>(null)

  // Register subscriptions
  useEffect(() => {
    if (!subscriptions) return

    const entries = Object.entries(subscriptions) as [SyncEventType, SyncHandler][]

    entries.forEach(([event, handler]) => {
      if (!handlers.has(event)) {
        handlers.set(event, new Set())
      }
      handlers.get(event)!.add(handler)
    })

    return () => {
      entries.forEach(([event, handler]) => {
        handlers.get(event)?.delete(handler)
      })
    }
  }, []) // intentionally no deps — handlers are stable refs

  // Connect socket when token available
  useEffect(() => {
    if (!accessToken) return

    try {
      const socket = getSocket(accessToken)
      socketRef.current = socket
    } catch (e) {
      console.warn((e as Error)?.message ?? e)
    }

    return () => {
      // Don't disconnect on unmount — socket is a singleton
    }
  }, [accessToken])

  const emit = useCallback(
    (event: SyncEventType, data: Record<string, unknown>) => {
      socketRef.current?.emit("client:sync", {
        event,
        data,
        timestamp: Date.now()
      })
    },
    []
  )

  return {
    emit,
    isConnected: socketInstance?.connected ?? false
  }
}

/** Disconnect the socket (call on logout) */
export function disconnectSync(): void {
  socketInstance?.disconnect()
  socketInstance = null
  handlers.clear()
}
