// frontend/hooks/useDelayNotification.ts
//
// Smart Delay Notification System hook.
// Starts the monitor when user logs in, stops it on logout.
// Exposes overdue tasks for in-app notification UI.

import { useEffect, useState, useCallback } from "react"
import {
  startDelayMonitor,
  stopDelayMonitor,
  OVERDUE_EVENT,
  type OverdueTask
} from "@/lib/notifications"
import { dailyTaskService } from "@/lib/apiServices"
import { authStore } from "@/store/authStore"

export function useDelayNotification() {
  const { isAuthenticated } = authStore()
  const [overdueItems, setOverdueItems] = useState<OverdueTask[]>([])
  const [dismissed, setDismissed] = useState(false)

  const fetchOverdue = useCallback(async (): Promise<OverdueTask[]> => {
    try {
      const res = await dailyTaskService.getOverdue()
      const data: any[] = res.data?.data ?? []
      return data.map((t) => ({
        topicName:   t.topicName,
        subjectName: t.subjectName,
        taskType:    t.taskType,
        minutesLate: t.minutesLate
      }))
    } catch {
      return []
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      stopDelayMonitor()
      setOverdueItems([])
      return
    }

    // Listen for the in-app overdue event dispatched by the monitor
    const handleOverdue = (e: Event) => {
      const items = (e as CustomEvent<OverdueTask[]>).detail
      setOverdueItems(items)
      setDismissed(false)
    }

    window.addEventListener(OVERDUE_EVENT, handleOverdue)

    // Start the monitor — checks every 30 min
    startDelayMonitor(fetchOverdue)

    return () => {
      window.removeEventListener(OVERDUE_EVENT, handleOverdue)
      // Keep monitor running on unmount (singleton) — only stop on logout
    }
  }, [isAuthenticated, fetchOverdue])

  const dismiss = useCallback(() => setDismissed(true), [])

  return {
    overdueItems: dismissed ? [] : overdueItems,
    hasOverdue: !dismissed && overdueItems.length > 0,
    dismiss
  }
}
