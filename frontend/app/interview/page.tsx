// frontend/app/interview/page.tsx
'use client'

import { useState } from "react"
import { interviewService } from "@/lib/apiServices"
import { motion } from "framer-motion"

function InterviewQuestionCard({
  q,
  onPractice
}: {
  q: any
  onPractice: () => void
}) {

  const [showAnswer, setShowAnswer] = useState(false)

  return (
    <div className="bg-[#13131f] p-4 rounded-lg">

      <div className="font-medium line-clamp-2">{q.question}</div>

      <div className="flex gap-2 mt-3">

        <button
          onClick={onPractice}
          className="px-3 py-1 bg-indigo-500 rounded text-xs"
        >
          Practice
        </button>

        <button
          onClick={async () => {
            await interviewService.revealAnswer(q.id)
            setShowAnswer(true)
          }}
          className="px-3 py-1 bg-white/10 rounded text-xs"
        >
          Quick Answer
        </button>

      </div>

      {showAnswer && (
        <div className="mt-2 text-sm text-[#94a3b8]">
          {q.answer}
        </div>
      )}

    </div>
  )
}

export default function InterviewPage() {

  const [questions, setQuestions] = useState<any[]>([])
  const [active, setActive] = useState<any>(null)

  return (
    <div className="p-6 space-y-4">

      <h1 className="text-xl font-semibold">Interview Practice</h1>

      <div className="grid gap-3">

        {questions.map((q) => (
          <InterviewQuestionCard
            key={q.id}
            q={q}
            onPractice={() => setActive(q)}
          />
        ))}

      </div>

      {active && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">

          <div className="bg-[#13131f] p-6 rounded-lg w-[600px]">

            <h2 className="text-lg font-semibold">
              {active.question}
            </h2>

            <button
              onClick={() => setActive(null)}
              className="mt-4 px-3 py-1 bg-indigo-500 rounded"
            >
              End Session
            </button>

          </div>

        </div>
      )}

    </div>
  )
}