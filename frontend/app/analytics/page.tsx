// frontend/app/analytics/page.tsx
'use client'

import { useAnalytics } from "@/hooks/useAnalytics"
import StatCard from "@/components/shared/StatCard"
import { motion } from "framer-motion"

function Heatmap({ data }: { data: number[] }) {

  return (
    <div className="grid grid-cols-52 gap-[2px]">

      {data.map((v, i) => {

        const level = Math.min(v, 4)

        return (
          <div
            key={i}
            className={`w-3 h-3 rounded level-${level}`}
          />
        )
      })}

    </div>
  )
}

function InsightCard({ text }: { text: string }) {

  return (
    <div className="bg-[#13131f] p-4 rounded-lg text-sm">
      💡 {text}
    </div>
  )
}

export default function AnalyticsPage() {

  const analytics = useAnalytics()

  if (analytics.isLoading) return null

  return (
    <div className="p-6 space-y-6">

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

        <StatCard
          label="Topics Completed"
          value={analytics.overview?.topics ?? 0}
        />

        <StatCard
          label="Quiz Accuracy"
          value={analytics.overview?.accuracy ?? 0}
        />

        <StatCard
          label="Coding Problems"
          value={analytics.overview?.problems ?? 0}
        />

        <StatCard
          label="Study Hours"
          value={analytics.overview?.hours ?? 0}
        />

      </div>

      <Heatmap data={analytics.heatmapData ?? []} />

      <div className="grid md:grid-cols-3 gap-4">

        <InsightCard text="Focus more on Graph algorithms." />
        <InsightCard text="Your quiz accuracy improved 12%." />
        <InsightCard text="Practice dynamic programming next." />

      </div>

    </div>
  )
}