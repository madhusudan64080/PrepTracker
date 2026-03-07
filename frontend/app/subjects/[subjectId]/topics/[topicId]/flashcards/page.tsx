// frontend/app/subjects/[subjectId]/topics/[topicId]/flashcards/page.tsx

'use client'

import { useParams, useRouter } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"

import { useTopicContent } from "@/hooks/useTopicContent"
import { useFlashcards } from "@/hooks/useFlashcards"

export default function FlashcardsPage() {

  const { topicId } = useParams()
  const router = useRouter()

  const { content } = useTopicContent(topicId as string)

  const flash = useFlashcards(content?.flashcards ?? [], topicId as string)

  const {
    currentCard,
    flip,
    isFlipped,
    markKnown,
    markUnknown,
    markKinda,
    knownCards,
    unknownCards,
    deck,
    isComplete
  } = flash

  if (isComplete) {
    return (
      <div className="text-center mt-20 space-y-4">

        <h2 className="text-2xl font-semibold">
          Session Complete! 🎉
        </h2>

        <p>Known: {knownCards.length}</p>
        <p>Unknown: {unknownCards.length}</p>

        {unknownCards.length > 0 && (
          <button className="px-4 py-2 bg-indigo-500 rounded">
            Review Unknown Cards
          </button>
        )}

        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-white/10 rounded"
        >
          Done
        </button>

      </div>
    )
  }

  if (!currentCard) return null

  return (
    <div className="flex flex-col items-center p-6">

      <div className="flex justify-between w-full max-w-xl mb-6 text-sm">
        <div>Known: {knownCards.length}</div>
        <div>Remaining: {deck.length}</div>
        <button onClick={() => router.back()}>Exit</button>
      </div>

      <AnimatePresence mode="wait">

        <motion.div
          key={currentCard.id}
          initial={{ x: 80, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -80, opacity: 0 }}
        >

          <div
            style={{ perspective: "1000px" }}
            className="w-[420px] h-[260px]"
          >

            <div
              onClick={flip}
              style={{
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "",
                transition: "transform 0.6s"
              }}
              className="relative w-full h-full cursor-pointer"
            >

              {/* FRONT */}

              <div className="absolute inset-0 bg-[#13131f] rounded-xl p-6">

                <div className="text-xs text-[#94a3b8] mb-3">
                  QUESTION
                </div>

                <div className="text-lg text-center">
                  {currentCard.question}
                </div>

                <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-[#94a3b8] animate-pulse">
                  Tap to reveal
                </div>

              </div>

              {/* BACK */}

              <div
                style={{
                  transform: "rotateY(180deg)",
                  backfaceVisibility: "hidden"
                }}
                className="absolute inset-0 bg-[#13131f] rounded-xl p-6"
              >

                <div className="text-xs text-green-400 mb-3">
                  ANSWER
                </div>

                <div className="text-lg text-center">
                  {currentCard.answer}
                </div>

                <div className="text-sm mt-4 text-[#94a3b8]">
                  {currentCard.explanation}
                </div>

              </div>

            </div>

          </div>

        </motion.div>

      </AnimatePresence>

      {isFlipped && (

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex gap-3 mt-6"
        >

          <button
            onClick={markUnknown}
            className="px-4 py-2 bg-red-500/20 rounded"
          >
            ✗ Didn't know
          </button>

          <button
            onClick={markKinda}
            className="px-4 py-2 bg-yellow-500/20 rounded"
          >
            ~ Kinda
          </button>

          <button
            onClick={markKnown}
            className="px-4 py-2 bg-green-500/20 rounded"
          >
            ✓ Got it!
          </button>

        </motion.div>

      )}

    </div>
  )
}