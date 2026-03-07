// frontend/app/goals/page.tsx

'use client'

import { useDailyGoal } from "@/hooks/useDailyGoal"
import { usePomodoro } from "@/hooks/usePomodoro"
import { motion } from "framer-motion"

function GoalRing({ value, target }: { value: number; target: number }) {

  const radius = 40
  const circumference = 2 * Math.PI * radius
  const percent = Math.min(value / target, 1)

  return (
    <svg width="100" height="100">

      <circle
        cx="50"
        cy="50"
        r={radius}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="8"
        fill="transparent"
      />

      <motion.circle
        cx="50"
        cy="50"
        r={radius}
        stroke="#6366f1"
        strokeWidth="8"
        fill="transparent"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{
          strokeDashoffset: circumference - percent * circumference
        }}
      />

    </svg>
  )
}

function GoalCard({
  label,
  value,
  target
}: {
  label: string
  value: number
  target: number
}) {

  return (
    <div className="bg-[#13131f] p-5 rounded-lg text-center">

      <GoalRing value={value} target={target} />

      <div className="mt-3 text-sm">{label}</div>

      <div className="font-semibold">
        {value}/{target}
      </div>

    </div>
  )
}

function PomodoroSection() {

  const pomodoro = usePomodoro()

  return (
    <div className="bg-[#13131f] p-6 rounded-lg text-center">

      <div className="text-4xl font-mono mb-4">
        {pomodoro.formattedTime}
      </div>

      <div className="flex justify-center gap-3">

        <button onClick={pomodoro.start} className="px-3 py-1 bg-indigo-500 rounded">
          Start
        </button>

        <button onClick={pomodoro.pause} className="px-3 py-1 bg-white/10 rounded">
          Pause
        </button>

        <button onClick={pomodoro.reset} className="px-3 py-1 bg-white/10 rounded">
          Reset
        </button>

      </div>

    </div>
  )
}

export default function GoalsPage() {

  const goal = useDailyGoal()

  return (
    <div className="p-6 space-y-6">

      <div className="grid grid-cols-2 gap-4">

        <GoalCard label="Topics" value={goal.goal?.topics ?? 0} target={5} />
        <GoalCard label="Problems" value={goal.goal?.problems ?? 0} target={5} />
        <GoalCard label="Revision" value={goal.goal?.revision ?? 0} target={5} />
        <GoalCard label="Study Time" value={goal.goal?.minutes ?? 0} target={120} />

      </div>

      <PomodoroSection />

    </div>
  )
}