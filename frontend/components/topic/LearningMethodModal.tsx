'use client'

import { motion, AnimatePresence } from "framer-motion"
<<<<<<< HEAD
import { useState } from "react"
=======
import { useState, useEffect } from "react"
>>>>>>> 48fc2b9 (Updated full project with new content)
import { X, ArrowRight } from "lucide-react"

interface Props {
  isOpen: boolean
  onClose: () => void
  onSelect: (method: string) => void
  topicName: string
  hasAttempted: boolean
<<<<<<< HEAD
=======
  // FIX: pass the current method so the modal pre-selects it on re-open
  currentMethod?: string | null
>>>>>>> 48fc2b9 (Updated full project with new content)
}

const methods = [
  {
    key: "topic_explanation",
    emoji: "📖",
    name: "Topic Explanation",
    desc: "Deep explanation — concepts, analogies, step-by-step breakdown, code examples, flashcards, and interview questions.",
    time: "20–30 min",
    best: "Best for: First-time learning"
  },
  {
    key: "coding_patterns",
    emoji: "💻",
    name: "Coding Patterns",
    desc: "Implementation-focused — all coding patterns, complexity analysis, and interview-level questions for this topic.",
    time: "20–30 min",
    best: "Best for: DSA and programming topics"
  },
  {
    key: "example_based",
    emoji: "🧩",
    name: "Example Based",
    desc: "Learn by doing — worked examples from easy to interview-hard, with practice problems and common mistakes.",
    time: "15–25 min",
    best: "Best for: Applied topics and problem-solving"
  },
  {
    key: "revision",
    emoji: "⚡",
    name: "Quick Revision",
    desc: "High-density revision — TL;DR summary, key formulas, mind map, flashcards, and last-minute tips.",
    time: "5–10 min",
    best: "Best for: Pre-exam or pre-interview review"
  }
]

export default function LearningMethodModal({
  isOpen,
  onClose,
  onSelect,
  topicName,
<<<<<<< HEAD
  hasAttempted
}: Props) {
  const [selected, setSelected] = useState<string | null>(null)
=======
  hasAttempted,
  currentMethod
}: Props) {
  // FIX: initialise with currentMethod so re-opening pre-selects the last used method
  const [selected, setSelected] = useState<string | null>(currentMethod ?? null)

  // Sync selection when currentMethod changes (e.g. switching topics)
  useEffect(() => {
    setSelected(currentMethod ?? null)
  }, [currentMethod, isOpen])

  const handleSelect = (key: string) => {
    setSelected(key)
  }

  const handleStart = () => {
    if (!selected) return
    onSelect(selected)
    // FIX: close the modal after confirming selection (prevents double-fire)
    onClose()
  }
>>>>>>> 48fc2b9 (Updated full project with new content)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-lg p-6"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-base font-bold">How do you want to learn?</h2>
              <p className="text-sm text-slate-500 mt-0.5 truncate max-w-[300px]">
                {hasAttempted ? `Switch method for: ${topicName}` : topicName}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white p-1">
              <X size={16}/>
            </button>
          </div>

          {/* Method cards */}
          <div className="space-y-2">
            {methods.map(m => (
              <motion.button
                key={m.key}
                whileTap={{ scale: 0.99 }}
<<<<<<< HEAD
                onClick={() => setSelected(m.key)}
=======
                onClick={() => handleSelect(m.key)}
>>>>>>> 48fc2b9 (Updated full project with new content)
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  selected === m.key
                    ? "bg-indigo-500/15 border-indigo-500/50"
                    : "bg-white/[0.02] border-white/8 hover:bg-white/[0.04] hover:border-white/15"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{m.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm">{m.name}</span>
                      <span className="text-xs text-slate-500 flex-shrink-0">{m.time}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{m.desc}</p>
                    <p className="text-xs text-indigo-400 mt-1">{m.best}</p>
                  </div>
                  <div className={`flex-shrink-0 w-4 h-4 rounded-full border mt-0.5 transition-all ${
                    selected === m.key
                      ? "bg-indigo-500 border-indigo-500"
                      : "border-white/20"
                  }`}/>
                </div>
              </motion.button>
            ))}
          </div>

          {/* CTA */}
          <button
            disabled={!selected}
<<<<<<< HEAD
            onClick={() => selected && onSelect(selected)}
=======
            onClick={handleStart}
>>>>>>> 48fc2b9 (Updated full project with new content)
            className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors"
          >
            Start Learning
            <ArrowRight size={15}/>
          </button>

          {!hasAttempted && (
            <p className="text-center text-xs text-slate-600 mt-3">
              Content is generated once and saved — no API calls on future visits
            </p>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
<<<<<<< HEAD
}
=======
}
>>>>>>> 48fc2b9 (Updated full project with new content)
