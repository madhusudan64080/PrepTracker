'use client'

import { useRouter } from "next/navigation"

export default function QuizSection({
  quiz
}: {
  quiz?: any
}) {

  const router = useRouter()

  const questions = Array.isArray(quiz?.questions)
    ? quiz.questions
    : []

  return (
    <div className="space-y-4">

      <div className="text-sm">
        {questions.length} Questions
      </div>

      {questions.length > 0 ? (
        questions.slice(0, 3).map((q: any, i: number) => (
          <div
            key={i}
            className="bg-[#13131f] p-3 rounded blur-sm"
          >
            {q?.question}
          </div>
        ))
      ) : (
        <div className="text-sm text-gray-400">
          Quiz will be generated after studying the topic.
        </div>
      )}

      <button
        disabled={questions.length === 0}
        onClick={() => router.push("/quiz")}
        className="px-4 py-2 bg-indigo-500 rounded disabled:opacity-40"
      >
        Take Quiz →
      </button>

    </div>
  )
}