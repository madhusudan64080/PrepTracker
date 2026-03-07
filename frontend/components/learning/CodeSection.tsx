'use client'

import { useState } from "react"

interface CodeExample {
  language?: string
  code?: string
  time?: string
  space?: string
  explanation?: string
}

export default function CodeSection({
  codeExamples = []
}: {
  codeExamples?: CodeExample[]
}) {

  const [index, setIndex] = useState(0)

  if (!Array.isArray(codeExamples) || codeExamples.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-400 bg-[#0d0d1a] rounded">
        No coding examples available for this topic yet.
      </div>
    )
  }

  const example = codeExamples[index] || {}

  return (
    <div className="space-y-6">

      {/* Code */}
      {example.code && (
        <pre className="bg-[#0d0d1a] p-4 rounded overflow-x-auto font-mono">
          {example.code}
        </pre>
      )}

      {/* Complexity */}
      <div className="flex gap-2 text-xs">

        {example.time && (
          <span className="bg-indigo-500/10 px-2 py-1 rounded">
            Time: {example.time}
          </span>
        )}

        {example.space && (
          <span className="bg-indigo-500/10 px-2 py-1 rounded">
            Space: {example.space}
          </span>
        )}

      </div>

      {/* Explanation */}
      {example.explanation && <p>{example.explanation}</p>}

      {/* Navigation */}
      <div className="flex justify-between items-center">

        <button
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
          className="px-3 py-1 bg-indigo-500/20 rounded disabled:opacity-40"
        >
          Prev
        </button>

        <span className="text-sm">
          Example {index + 1} of {codeExamples.length}
        </span>

        <button
          disabled={index === codeExamples.length - 1}
          onClick={() => setIndex(index + 1)}
          className="px-3 py-1 bg-indigo-500/20 rounded disabled:opacity-40"
        >
          Next
        </button>

      </div>

    </div>
  )
}