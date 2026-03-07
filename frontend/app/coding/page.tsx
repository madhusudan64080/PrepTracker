// frontend/app/coding/page.tsx

'use client'

import { useEffect, useState } from "react"
import { codingService } from "@/lib/apiServices"
import { Pencil, Trash } from "lucide-react"

function ProblemTable({
  problems,
  onSelect
}: {
  problems: any[]
  onSelect: (p: any) => void
}) {

  return (
    <table className="w-full text-sm">

      <thead>
        <tr className="text-left text-[#94a3b8]">
          <th>Title</th>
          <th>Difficulty</th>
          <th>Platform</th>
          <th>Status</th>
          <th>Attempts</th>
          <th />
        </tr>
      </thead>

      <tbody>

        {problems.map((p) => (
          <tr
            key={p.id}
            className="border-t border-white/10 cursor-pointer"
            onClick={() => onSelect(p)}
          >

            <td>{p.title}</td>

            <td>
              <span className="px-2 py-1 rounded bg-indigo-500/10">
                {p.difficulty}
              </span>
            </td>

            <td>{p.platform}</td>

            <td>{p.status}</td>

            <td>{p.attempts}</td>

            <td className="flex gap-2">
              <Pencil size={14} />
              <Trash size={14} />
            </td>

          </tr>
        ))}

      </tbody>

    </table>
  )
}

function ProblemDetailPanel({
  problem,
  onClose
}: {
  problem: any
  onClose: () => void
}) {

  if (!problem) return null

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] bg-[#13131f] p-6">

      <button onClick={onClose}>Close</button>

      <h2 className="text-lg font-semibold mt-2">
        {problem.title}
      </h2>

      <textarea
        className="w-full h-40 bg-black/30 rounded mt-4 p-2"
        placeholder="My solution..."
      />

      <div className="mt-6">
        <h3 className="font-semibold mb-2">Attempts</h3>

        {problem.history?.map((h: any) => (
          <div key={h.id} className="text-sm">
            {h.result} — {h.date}
          </div>
        ))}

      </div>

    </div>
  )
}

export default function CodingPage() {

  const [problems, setProblems] = useState<any[]>([])
  const [selected, setSelected] = useState<any>(null)

  useEffect(() => {

    codingService.getAll().then((res) => {
      setProblems(res.data)
    })

  }, [])

  return (
    <div className="p-6">

      <h1 className="text-xl font-semibold mb-4">
        Coding Tracker
      </h1>

      <ProblemTable
        problems={problems}
        onSelect={(p) => setSelected(p)}
      />

      <ProblemDetailPanel
        problem={selected}
        onClose={() => setSelected(null)}
      />

    </div>
  )
}