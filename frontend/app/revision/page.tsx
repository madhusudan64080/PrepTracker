// frontend/app/revision/page.tsx

'use client'

import { useRevision } from "@/hooks/useRevision"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import StatCard from "@/components/shared/StatCard"
import { formatDistanceToNow } from "date-fns"
import { quizService } from "@/lib/apiServices"

function OverdueBanner({ count }: { count: number }) {
  if (!count) return null

  return (
    <div className="bg-orange-500/10 border-l-4 border-orange-500 p-4 rounded">
      ⚠️ {count} overdue revision topics — tackle these first!
    </div>
  )
}

function MasteryBar({ score }: { score: number }) {

  const color =
    score < 50
      ? "bg-red-500"
      : score < 70
      ? "bg-amber-500"
      : "bg-green-500"

  return (
    <div className="w-full bg-white/10 h-2 rounded">
      <div
        className={`${color} h-2 rounded`}
        style={{ width: `${score}%` }}
      />
    </div>
  )
}

function RevisionCard({ item }: { item: any }) {

  const router = useRouter()

  return (
    <div
      className={`p-4 rounded-lg border ${
        item.overdue ? "border-red-500/30" : "border-white/10"
      } bg-[#13131f]`}
    >

      <div className="flex justify-between mb-2">

        <div>
          <div className="font-semibold">{item.topicName}</div>
          <div className="text-xs text-[#94a3b8]">
            Studied {formatDistanceToNow(new Date(item.lastStudied))} ago
          </div>
        </div>

        <span className="text-xs bg-indigo-500/10 px-2 py-1 rounded">
          Revision #{item.revisionNumber}
        </span>

      </div>

      <MasteryBar score={item.masteryScore} />

      <div className="flex gap-2 mt-3">

        <button
          onClick={() => router.push(item.quizUrl)}
          className="px-3 py-1 bg-indigo-500 rounded text-xs"
        >
          Take Quiz
        </button>

        <button
          onClick={() => router.push(item.flashcardUrl)}
          className="px-3 py-1 bg-white/10 rounded text-xs"
        >
          Flashcards
        </button>

        <button className="px-3 py-1 bg-green-500/20 rounded text-xs">
          Mark Done
        </button>

      </div>

    </div>
  )
}

function WeekCalendarStrip({ days }: { days: any[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto">

      {days.map((d) => (
        <div
          key={d.date}
          className={`p-3 rounded text-center ${
            d.today ? "bg-indigo-500/20" : "bg-[#13131f]"
          }`}
        >
          <div className="text-sm">{d.day}</div>

          <div className="text-xs text-[#94a3b8]">{d.count}</div>

        </div>
      ))}

    </div>
  )
}

function WeakTopicsPanel({ topics }: { topics: any[] }) {

  return (
    <div className="bg-[#13131f] p-4 rounded-lg">

      <h3 className="font-semibold mb-3">Weak Topics</h3>

      {topics.map((t) => (
        <div key={t.id} className="mb-3">

          <div className="flex justify-between text-sm">
            <span>{t.name}</span>
            <span>{t.score}%</span>
          </div>

          <MasteryBar score={t.score} />

        </div>
      ))}

    </div>
  )
}

export default function RevisionPage() {

  const revision = useRevision()

  const overdue = revision.overdueItems.length

  const weakTopics =
    revision.todayItems.filter((t: any) => t.masteryScore < 60)

  return (
    <div className="p-6 space-y-6">

      <OverdueBanner count={overdue} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <StatCard label="Due Today" value={revision.todayItems.length} />
        <StatCard label="Completed Today" value={4} />
        <StatCard label="Overdue" value={overdue} />
        <StatCard label="This Week" value={revision.weeklySummary?.count ?? 0} />

      </div>

      <h2 className="text-lg font-semibold">Due Today</h2>

      <div className="grid gap-3">

        {revision.todayItems.map((item: any) => (
          <RevisionCard key={item.topicId} item={item} />
        ))}

      </div>

      <WeekCalendarStrip days={revision.upcomingDays ?? []} />

      <WeakTopicsPanel topics={weakTopics} />

    </div>
  )
}