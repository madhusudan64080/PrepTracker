// frontend/components/shared/OverdueNotificationBanner.tsx
//
// In-app notification banner for the Smart Delay Notification System.
// Appears at the top of the dashboard when tasks are overdue.
// Dismissable per session.

'use client'

import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, Clock } from "lucide-react"
import { useDelayNotification } from "@/hooks/useDelayNotification"
import { useRouter } from "next/navigation"

export default function OverdueNotificationBanner() {
  const { overdueItems, hasOverdue, dismiss } = useDelayNotification()
  const router = useRouter()

  if (!hasOverdue) return null

  const count = overdueItems.length
  const mostLate = overdueItems.reduce((a, b) => a.minutesLate > b.minutesLate ? a : b)
  const hoursLate = Math.floor(mostLate.minutesLate / 60)
  const lateStr = hoursLate > 0
    ? `${hoursLate}h ${mostLate.minutesLate % 60}m late`
    : `${mostLate.minutesLate}m late`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2 }}
        className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3"
      >
        <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-300">
            {count} overdue task{count !== 1 ? "s" : ""}
          </p>
          <p className="text-xs text-amber-400/80 mt-0.5">
            <strong>{mostLate.topicName}</strong> ({mostLate.subjectName}) is {lateStr}.
            {count > 1 && ` +${count - 1} more.`}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-2 text-xs text-amber-300 underline underline-offset-2 hover:text-amber-200"
          >
            View &amp; reschedule →
          </button>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-amber-500 hover:text-amber-300 p-1 transition-colors"
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </motion.div>
    </AnimatePresence>
  )
}
