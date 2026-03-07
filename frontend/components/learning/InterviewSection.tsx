'use client'

import { useState } from "react"
import { ChevronDown, ChevronUp, Eye, EyeOff, Clock, Target } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface InterviewQuestion {
  id: string
  question: string
  type: string
  difficulty: string
  idealAnswer: string
  keyPointsToMention: string[]
  followUpQuestions: string[]
  timeToAnswer: number
}

const difficultyConfig: Record<string, { label: string; color: string; bg: string }> = {
  fresher: { label: "Fresher",  color: "text-green-400",  bg: "bg-green-400/10" },
  mid:     { label: "Mid-Level", color: "text-yellow-400", bg: "bg-yellow-400/10" },
  senior:  { label: "Senior",    color: "text-red-400",    bg: "bg-red-400/10" }
}

const typeConfig: Record<string, { label: string; color: string }> = {
  conceptual: { label: "Conceptual", color: "text-indigo-400" },
  coding:     { label: "Coding",     color: "text-purple-400" },
  design:     { label: "Design",     color: "text-blue-400" }
}

function QuestionCard({ q, index }: { q: InterviewQuestion; index: number }) {
  const [expanded,   setExpanded]   = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selfRating, setSelfRating] = useState<"nailed" | "partial" | "missed" | null>(null)

  const diff = difficultyConfig[q.difficulty] ?? difficultyConfig.fresher
  const type = typeConfig[q.type] ?? typeConfig.conceptual
  const mins = Math.round(q.timeToAnswer / 60)
  const secs = q.timeToAnswer % 60

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="bg-[#13131f] border border-white/5 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 mt-0.5">
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium leading-snug">{q.question}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${diff.bg} ${diff.color}`}>
              {diff.label}
            </span>
            <span className={`text-xs ${type.color}`}>{type.label}</span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={10}/>
              {mins > 0 ? `${mins}m ${secs > 0 ? secs + 's' : ''}` : `${secs}s`}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0 text-slate-500 mt-0.5">
          {expanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 border-t border-white/5 pt-4 space-y-4">

              {/* Key Points to Mention */}
              {(q.keyPointsToMention?.length ?? 0) > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={13} className="text-amber-400"/>
                    <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      Key Points Interviewer Wants to Hear
                    </h4>
                  </div>
                  <ul className="space-y-1.5">
                    {q.keyPointsToMention.map((pt, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-300">
                        <span className="text-amber-400 flex-shrink-0 mt-0.5">✓</span>
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Model Answer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Model Answer
                  </h4>
                  <button
                    onClick={() => setShowAnswer(a => !a)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 rounded-lg text-indigo-300 transition-colors"
                  >
                    {showAnswer ? <><EyeOff size={11}/> Hide</> : <><Eye size={11}/> Reveal Answer</>}
                  </button>
                </div>

                <AnimatePresence>
                  {showAnswer ? (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-sm text-slate-300 leading-relaxed bg-black/20 rounded-lg p-4 border border-white/5 whitespace-pre-wrap"
                    >
                      {q.idealAnswer}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-16 bg-black/20 rounded-lg border border-white/5 flex items-center justify-center"
                    >
                      <span className="text-xs text-slate-600">Try answering first, then reveal</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Follow-up Questions */}
              {(q.followUpQuestions?.length ?? 0) > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Likely Follow-ups
                  </h4>
                  <ul className="space-y-1">
                    {q.followUpQuestions.map((fq, i) => (
                      <li key={i} className="text-xs text-slate-400 flex gap-2">
                        <span className="text-slate-600 flex-shrink-0">→</span>
                        {fq}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Self-rating */}
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  How did you do?
                </h4>
                <div className="flex gap-2">
                  {([
                    { key: "nailed",  label: "Nailed it",  cls: "bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30" },
                    { key: "partial", label: "Got some",   cls: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/30" },
                    { key: "missed",  label: "Missed it",  cls: "bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30" }
                  ] as const).map(r => (
                    <button
                      key={r.key}
                      onClick={() => setSelfRating(r.key)}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${r.cls} ${
                        selfRating === r.key ? "ring-1 ring-offset-1 ring-offset-[#13131f] ring-current" : ""
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function InterviewSection({ questions = [] }: { questions?: any[] }) {
  const list = Array.isArray(questions) ? questions : []

  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="text-4xl">🎤</div>
        <p className="text-slate-400 text-sm">Interview questions will appear once AI generates them.</p>
        <p className="text-slate-600 text-xs">Use the Regenerate button to fetch fresh content.</p>
      </div>
    )
  }

  const fresherQs = list.filter(q => q.difficulty === "fresher")
  const midQs     = list.filter(q => q.difficulty === "mid")
  const seniorQs  = list.filter(q => q.difficulty === "senior")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-1">Interview Questions</h2>
        <p className="text-sm text-slate-400">
          {list.length} questions across {fresherQs.length > 0 ? "fresher" : ""}{midQs.length > 0 ? ", mid-level" : ""}{seniorQs.length > 0 ? ", senior" : ""} levels.
          Try to answer each question before revealing the model answer.
        </p>
      </div>

      {fresherQs.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-3">
            🟢 Fresher Level
          </h3>
          <div className="space-y-3">
            {fresherQs.map((q, i) => <QuestionCard key={q.id ?? i} q={q} index={i}/>)}
          </div>
        </section>
      )}

      {midQs.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-3">
            🟡 Mid-Level
          </h3>
          <div className="space-y-3">
            {midQs.map((q, i) => <QuestionCard key={q.id ?? i} q={q} index={fresherQs.length + i}/>)}
          </div>
        </section>
      )}

      {seniorQs.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">
            🔴 Senior Level
          </h3>
          <div className="space-y-3">
            {seniorQs.map((q, i) => <QuestionCard key={q.id ?? i} q={q} index={fresherQs.length + midQs.length + i}/>)}
          </div>
        </section>
      )}
    </div>
  )
}