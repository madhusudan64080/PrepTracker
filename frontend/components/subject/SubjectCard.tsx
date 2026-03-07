// frontend/components/subject/SubjectCard.tsx

'use client'

import { motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"

interface Subject {
  _id: string
  name: string
  emoji?: string
  color?: string
  completedTopics?: number
  totalTopics?: number
  lastStudied?: string
}

interface Props {
  subject: Subject
  onClick: () => void
}

export default function SubjectCard({ subject, onClick }: Props) {

  const progress =
    subject.totalTopics && subject.completedTopics
      ? (subject.completedTopics / subject.totalTopics) * 100
      : 0

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="cursor-pointer bg-[#13131f] p-5 rounded-xl border border-white/5 relative overflow-hidden"
      style={{
        borderLeft: `4px solid ${subject.color ?? "#6366f1"}`
      }}
    >
      <div className="absolute right-4 top-4 text-3xl opacity-80">
        {subject.emoji ?? "📘"}
      </div>

      <h3 className="font-semibold mb-2">{subject.name}</h3>

      <div className="text-xs text-[#94a3b8] mb-3">
        {subject.completedTopics ?? 0}/{subject.totalTopics ?? 0} topics
      </div>

      <div className="w-full h-2 bg-white/10 rounded mb-3">
        <motion.div
          className="h-2 rounded"
          style={{
            background: subject.color ?? "#6366f1"
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>

      {subject.lastStudied && (
        <div className="text-xs text-[#94a3b8]">
          Last studied{" "}
          {formatDistanceToNow(new Date(subject.lastStudied))} ago
        </div>
      )}

      <button className="mt-3 text-indigo-400 text-sm">
        Continue →
      </button>
    </motion.div>
  )
}