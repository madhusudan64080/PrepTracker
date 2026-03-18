// frontend/hooks/useOfflineSync.ts
// Flushes the IndexedDB offline queue back to the server when connectivity returns.

import { useEffect, useRef } from "react"
import { offlineQueue } from "@/lib/indexeddb"
import { api } from "@/lib/api"
import { authStore } from "@/store/authStore"

interface QueuedAction {
  type: string
  payload: Record<string, unknown>
}

/**
 * Maps an offline action type to its API call.
 * Add new action types here as the app grows.
 */
async function replayAction(action: QueuedAction): Promise<void> {
  const { type, payload } = action

  switch (type) {
    case "topic:complete":
      await api.post(`/api/topics/${payload.topicId}/complete`, payload)
      break

    case "topic:progress":
      await api.patch(`/api/topics/${payload.topicId}/progress`, payload)
      break

    case "revision:complete":
      await api.post(`/api/revision/${payload.topicId}/complete`, {
        topicId: payload.topicId,
        score: payload.score ?? 70
      })
      break

    case "coding:log":
      await api.post("/api/coding", payload)
      break

    case "goal:studyTime":
<<<<<<< HEAD
      await api.post("/api/goals/log-time", { minutes: payload.minutes })
=======
      // FIX: was "/api/goals/log-time" which doesn't exist.
      // The actual endpoint defined in apiServices.ts is "/api/goals/log".
      await api.post("/api/goals/log", { minutes: payload.minutes })
>>>>>>> 48fc2b9 (Updated full project with new content)
      break

    default:
      console.warn("[OfflineSync] Unknown action type, skipping:", type)
  }
}

/**
 * Drains the IndexedDB offline queue, replaying each pending action against the API.
 * Unrecognised or failed items are left in the queue (marked unsynced) for the next attempt.
 */
async function flushQueue(): Promise<void> {
  const items = await offlineQueue.getAll()
  const pending = items.filter((i) => !i.synced)

  if (!pending.length) return

  console.log(`[OfflineSync] Flushing ${pending.length} queued action(s)`)

  for (const item of pending) {
    try {
      await replayAction(item as any)
      if (item.id !== undefined) {
        await offlineQueue.markSynced(item.id)
      }
    } catch (err: any) {
      console.warn(`[OfflineSync] Failed to replay ${item.type}:`, err?.message)
      // Leave it as unsynced — will retry on next reconnect
    }
  }

  // Clean up successfully synced items
  await offlineQueue.clearSynced()
}

/**
 * useOfflineSync — auto-flushes queued offline actions when the browser
 * comes back online or when a valid auth token is available after a refresh.
 *
 * Place this hook once near the top of the app (e.g. in ClientProviders or AppShell).
 */
export function useOfflineSync(): void {
  const { isAuthenticated } = authStore()
  const isFlushing = useRef(false)

  const tryFlush = async () => {
    if (!navigator.onLine) return
    if (!isAuthenticated) return
    if (isFlushing.current) return

    isFlushing.current = true
    try {
      await flushQueue()
    } finally {
      isFlushing.current = false
    }
  }

  useEffect(() => {
    // Flush immediately if we're online and authenticated
    tryFlush()

    // Flush every time the browser regains connectivity
    window.addEventListener("online", tryFlush)

    // Also flush on a slower interval as fallback (every 60 s)
    const interval = setInterval(tryFlush, 60_000)

    return () => {
      window.removeEventListener("online", tryFlush)
      clearInterval(interval)
    }
  }, [isAuthenticated])
}

/**
 * Convenience: enqueue an action while offline.
 * Call this from any hook/component when an API call fails due to no connectivity.
 *
 * @example
 *   try {
 *     await api.post(...)
 *   } catch (err) {
 *     if (!navigator.onLine) {
 *       await enqueueOfflineAction("topic:complete", { topicId })
 *     }
 *   }
 */
export async function enqueueOfflineAction(
  type: string,
  payload: Record<string, unknown>
): Promise<void> {
  await offlineQueue.push({ type, payload })
}
