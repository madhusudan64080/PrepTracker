// frontend/lib/notifications.ts
//
// Notification system for PrepTrack:
//   1. Browser push notifications (permission-gated)
//   2. Smart Delay Notification System — alerts when scheduled topics are overdue
//
// Smart Delay System (NEW FEATURE):
//   - Periodic check (every 30 minutes while app is open)
//   - Detects pending tasks whose scheduled date has passed
//   - Shows browser notification + dispatches in-app event
//   - Suggests rescheduling overdue tasks

/* ── Permission ─────────────────────────────────────────────── */

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!("Notification" in window)) return false
  const permission = await Notification.requestPermission()
  return permission === "granted"
}

/* ── Revision Reminder ──────────────────────────────────────── */

export async function scheduleRevisionReminder(
  time: string,
  topicsDue: number = 0
): Promise<void> {
  if (typeof window === "undefined") return
  if (!("serviceWorker" in navigator)) return

  const permission = await requestNotificationPermission()
  if (!permission) return

  const [hour, minute] = parseTime(time)
  const now = new Date()
  const reminder = new Date()
  reminder.setHours(hour)
  reminder.setMinutes(minute)
  reminder.setSeconds(0)

  if (reminder.getTime() < now.getTime()) {
    reminder.setDate(reminder.getDate() + 1)
  }

  const delay = reminder.getTime() - now.getTime()
  const registration = await navigator.serviceWorker.ready

  setTimeout(() => {
    registration.showNotification("PrepTrack Reminder", {
      body: `Time to revise! You have ${topicsDue} topics due today.`,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-72.png",
      tag: "revision-reminder",
      requireInteraction: true
    })
  }, delay)
}

export function cancelScheduledReminder(): void {
  if (typeof window === "undefined") return
  if (!("serviceWorker" in navigator)) return
  navigator.serviceWorker.ready.then((registration) => {
    registration.getNotifications({ tag: "revision-reminder" }).then((notifications) => {
      notifications.forEach((n) => n.close())
    })
  })
}

/* ── Smart Delay Notification System ───────────────────────────
 *
 * Checks for overdue tasks and notifies the user.
 * Call startDelayMonitor() once when the user logs in.
 * Call stopDelayMonitor() on logout.
 */

let delayMonitorInterval: ReturnType<typeof setInterval> | null = null

export interface OverdueTask {
  topicName: string
  subjectName: string
  taskType: "study" | "revision" | "pending"
  minutesLate: number
}

/**
 * Event dispatched to the DOM when overdue tasks are detected.
 * Listen with: window.addEventListener("preptrack:overdue", handler)
 */
export const OVERDUE_EVENT = "preptrack:overdue"

/**
 * Start the smart delay monitor.
 * Polls every 30 minutes and checks for pending tasks whose date has passed.
 *
 * @param fetchOverdue - async function that returns overdue tasks from the API
 */
export function startDelayMonitor(
  fetchOverdue: () => Promise<OverdueTask[]>,
  intervalMs = 30 * 60 * 1000
): void {
  if (typeof window === "undefined") return
  if (delayMonitorInterval) return // already running

  const check = async () => {
    try {
      const overdue = await fetchOverdue()
      if (overdue.length === 0) return

      // Dispatch in-app event for UI components to consume
      window.dispatchEvent(
        new CustomEvent(OVERDUE_EVENT, { detail: overdue })
      )

      // Also show browser notification if permission granted
      if (Notification.permission === "granted" && "serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.ready
        const topNames = overdue
          .slice(0, 3)
          .map((t) => t.topicName)
          .join(", ")
        const extra = overdue.length > 3 ? ` +${overdue.length - 3} more` : ""

        reg.showNotification("PrepTrack — Overdue Tasks", {
          body: `You're behind on: ${topNames}${extra}. Tap to reschedule.`,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-72.png",
          tag: "overdue-tasks",
          requireInteraction: false,
          data: { url: "/dashboard" }
        })
      }
    } catch {
      // Silently fail — non-critical background check
    }
  }

  // Run immediately, then on interval
  check()
  delayMonitorInterval = setInterval(check, intervalMs)
}

export function stopDelayMonitor(): void {
  if (delayMonitorInterval) {
    clearInterval(delayMonitorInterval)
    delayMonitorInterval = null
  }
}

/* ── Helpers ────────────────────────────────────────────────── */

function parseTime(time: string): [number, number] {
  const match = time.match(/(\d+)\s*(AM|PM)/i)
  if (!match) return [21, 0]
  let hour = parseInt(match[1])
  const period = match[2].toUpperCase()
  if (period === "PM" && hour !== 12) hour += 12
  if (period === "AM" && hour === 12) hour = 0
  return [hour, 0]
}
