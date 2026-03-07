// frontend/app/subjects/[subjectId]/topics/[topicId]/quiz/page.tsx

'use client'

import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { useTopicContent } from "@/hooks/useTopicContent"
import { useQuiz } from "@/hooks/useQuiz"
import AiThinkingLoader from "@/components/shared/AiThinkingLoader"

function TopBar({
  current,
  total,
  onExit
}: {
  current: number
  total: number
  onExit: () => void
}) {
  const progress = ((current + 1) / total) * 100

  return (
    <div className="w-full mb-6">

      <div className="flex justify-between text-sm mb-2">
        <span>Question {current + 1} / {total}</span>
        <button onClick={onExit}>Exit</button>
      </div>

      <div className="h-2 bg-white/10 rounded">
        <motion.div
          className="h-2 bg-indigo-500 rounded"
          animate={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function QuestionDots({
  total,
  index,
  answers
}: {
  total: number
  index: number
  answers: Record<string, string>
}) {
  return (
    <div className="flex justify-center gap-2 mt-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full ${
            i === index
              ? "bg-indigo-500"
              : "bg-white/20"
          }`}
        />
      ))}
    </div>
  )
}

function QuizResultScreen({
  result,
  onBack
}: {
  result: any
  onBack: () => void
}) {

  const percentage = Math.round((result.score / result.total) * 100)

  return (
    <div className="text-center max-w-xl mx-auto space-y-6">

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="text-4xl font-bold"
      >
        {percentage}%
      </motion.div>

      <div className="text-lg">
        {percentage >= 80 ? "🔥 Excellent!" :
         percentage >= 60 ? "👍 Good job" :
         "💡 Keep practicing"}
      </div>

      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td>Easy</td>
            <td>{result.breakdown?.easy ?? "-"}</td>
          </tr>
          <tr>
            <td>Medium</td>
            <td>{result.breakdown?.medium ?? "-"}</td>
          </tr>
          <tr>
            <td>Hard</td>
            <td>{result.breakdown?.hard ?? "-"}</td>
          </tr>
        </tbody>
      </table>

      <button
        onClick={onBack}
        className="px-4 py-2 bg-indigo-500 rounded"
      >
        Back to Topic
      </button>

    </div>
  )
}

export default function QuizPage() {

  const { topicId } = useParams()
  const router = useRouter()

  const { content, isGenerating } = useTopicContent(topicId as string)

  if (isGenerating || !content) {
    return <AiThinkingLoader />
  }

  const quizHook = useQuiz(content.quiz?.questions ?? [], topicId as string)

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    selectedAnswer,
    hasSubmittedAnswer,
    isCorrect,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    answers,
    result,
    isComplete
  } = quizHook

  if (isComplete && result) {
    return (
      <QuizResultScreen
        result={result}
        onBack={() => router.back()}
      />
    )
  }

  return (
    <div className="p-6 flex flex-col items-center">

      <TopBar
        current={currentIndex}
        total={totalQuestions}
        onExit={() => router.back()}
      />

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full bg-[#13131f] p-6 rounded-xl"
      >

        {currentQuestion && (
          <h2 className="text-xl mb-4 font-semibold">
            {currentQuestion.question}
          </h2>
        )}

        {currentQuestion && (
          <div className="grid gap-3">

          {currentQuestion.options.map((opt: string) => {

            const correct = opt === currentQuestion.correctAnswer

            let style = "bg-black/30"

            if (hasSubmittedAnswer) {
              if (correct) style = "bg-green-500/20"
              if (selectedAnswer === opt && !correct) style = "bg-red-500/20"
            }

            return (
              <button
                key={opt}
                onClick={() => selectAnswer(opt)}
                className={`p-3 rounded border border-white/10 text-left ${style}`}
              >
                {opt}
              </button>
            )
          })}

        </div>
        )}

        <AnimatePresence>

          {hasSubmittedAnswer && currentQuestion && (

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`mt-4 p-4 rounded ${
                isCorrect ? "bg-green-500/10" : "bg-red-500/10"
              }`}
            >

              <div className="font-semibold">
                {isCorrect ? "✓ Correct!" : "✗ Not quite"}
              </div>

              <p className="text-sm mt-2">
                {currentQuestion.explanation}
              </p>

              <button
                onClick={nextQuestion}
                className="mt-3 px-4 py-2 bg-indigo-500 rounded"
              >
                Next Question →
              </button>

            </motion.div>

          )}

        </AnimatePresence>

        {!hasSubmittedAnswer && (
          <button
            onClick={submitAnswer}
            disabled={!selectedAnswer}
            className="mt-4 px-4 py-2 bg-indigo-500 rounded"
          >
            Submit Answer
          </button>
        )}

      </motion.div>

      <QuestionDots
        total={totalQuestions}
        index={currentIndex}
        answers={answers}
      />

    </div>
  )
}