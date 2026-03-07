'use client'

import { motion } from "framer-motion"
import { Lightbulb, AlertTriangle, CheckCircle2, BookOpen, ChevronRight } from "lucide-react"

interface Props {
  concept: any
  onComplete: () => void
}

export default function ConceptSection({ concept, onComplete }: Props) {

  const summaryText = Array.isArray(concept?.summary)
    ? concept.summary.join("\n\n")
    : concept?.summary ?? ""

  // Split into paragraphs for better reading
  const paragraphs = summaryText
    .split(/\n\n+/)
    .map((p: string) => p.trim())
    .filter(Boolean)

  const keyPoints: string[]          = Array.isArray(concept?.keyPoints) ? concept.keyPoints : []
  const analogy: string              = concept?.realWorldAnalogy ?? ""
  const prerequisites: string[]     = Array.isArray(concept?.prerequisites) ? concept.prerequisites : []
  const misconceptions: string[]    = Array.isArray(concept?.commonMisconceptions) ? concept.commonMisconceptions : []

  return (
    <div className="space-y-8">

      {/* Summary */}
      {paragraphs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-400"/>
            Core Concept
          </h2>
          {paragraphs.map((p: string, i: number) => (
            <p key={i} className="text-slate-300 leading-relaxed text-[15px]">{p}</p>
          ))}
        </div>
      )}

      {/* Prerequisites */}
      {prerequisites.length > 0 && (
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">
            📋 Prerequisites — Know These First
          </h3>
          <div className="flex flex-wrap gap-2">
            {prerequisites.map((p: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-xs text-blue-300">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Key Points */}
      {keyPoints.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-green-400"/>
            Key Points
          </h3>
          <ul className="space-y-2">
            {keyPoints.map((k: string, i: number) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 items-start"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs text-indigo-400 font-medium mt-0.5">
                  {i + 1}
                </span>
                <span className="text-slate-300 text-sm leading-relaxed">{k}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      )}

      {/* Real World Analogy */}
      {analogy && (
        <div className="bg-amber-500/5 border-l-4 border-amber-500 rounded-r-xl p-4">
          <div className="flex gap-2 items-start">
            <Lightbulb size={17} className="text-amber-400 flex-shrink-0 mt-0.5"/>
            <div>
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1.5">
                Real-World Analogy
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">{analogy}</p>
            </div>
          </div>
        </div>
      )}

      {/* Common Misconceptions */}
      {misconceptions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-400"/>
            Common Misconceptions
          </h3>
          <div className="space-y-2">
            {misconceptions.map((m: string, i: number) => {
              // Parse "WRONG: ... | CORRECT: ..." format
              const parts = m.split("|").map(s => s.trim())
              const wrong   = parts[0]?.replace(/^WRONG:\s*/i, "").trim()
              const correct = parts[1]?.replace(/^CORRECT:\s*/i, "").trim()

              if (wrong && correct) {
                return (
                  <div key={i} className="bg-[#1a1a2e] border border-white/5 rounded-lg p-3 space-y-2">
                    <div className="flex gap-2 items-start">
                      <span className="text-red-400 text-xs font-semibold flex-shrink-0">✗ Wrong</span>
                      <span className="text-slate-400 text-sm">{wrong}</span>
                    </div>
                    <div className="flex gap-2 items-start">
                      <span className="text-green-400 text-xs font-semibold flex-shrink-0">✓ Right</span>
                      <span className="text-slate-300 text-sm">{correct}</span>
                    </div>
                  </div>
                )
              }

              return (
                <div key={i} className="flex gap-2 items-start">
                  <span className="text-slate-500 flex-shrink-0 mt-0.5"><ChevronRight size={14}/></span>
                  <span className="text-slate-400 text-sm">{m}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <button
        onClick={onComplete}
        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
      >
        <CheckCircle2 size={15}/>
        Mark Concept Complete
      </button>

    </div>
  )
}