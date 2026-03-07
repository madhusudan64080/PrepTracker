'use client'

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  ArrowLeft, RefreshCw, CheckCircle, BookOpen,
  Code2, Brain, MessageSquare, Layers, Eye
} from "lucide-react"

import { useTopicContent } from "@/hooks/useTopicContent"
import { notesService, topicService } from "@/lib/apiServices"

import AiThinkingLoader from "@/components/shared/AiThinkingLoader"
import LearningMethodModal from "@/components/topic/LearningMethodModal"
import ConceptSection from "@/components/learning/ConceptSection"
import VisualSection from "@/components/learning/VisualSection"
import CodeSection from "@/components/learning/CodeSection"
import FlashcardSection from "@/components/learning/FlashcardSection"
import InterviewSection from "@/components/learning/InterviewSection"

interface Topic {
  _id: string
  name: string
  subjectName?: string
  contentGenerated?: boolean
}

// Quiz section removed completely
const SECTIONS = [
  { key: "concept",    label: "Concept",    icon: BookOpen },
  { key: "visual",     label: "Visual",     icon: Eye },
  { key: "code",       label: "Code",       icon: Code2 },
  { key: "flashcards", label: "Flashcards", icon: Layers },
  { key: "interview",  label: "Interview",  icon: MessageSquare }
]

export default function TopicLearnPage() {

  const params   = useParams()
  const router   = useRouter()

  const subjectId = Array.isArray(params.subjectId) ? params.subjectId[0] : params.subjectId
  const topicId   = Array.isArray(params.topicId)   ? params.topicId[0]   : params.topicId

  const [topic,           setTopic]           = useState<Topic | null>(null)
  const [activeSection,   setActiveSection]   = useState("concept")
  const [progress,        setProgress]        = useState<Record<string, boolean>>({})
  const [showMethodModal, setShowMethodModal] = useState(false)
  const [notes,           setNotes]           = useState("")
  const [notesSaved,      setNotesSaved]      = useState(false)
  const [selectedMethod,  setSelectedMethod]  = useState<string | null>(null)

  const startTime = useRef<number>(Date.now())

  const {
    content,
    isGenerating,
    regenerate,
    generateWithMethod,
    cacheSource
  } = useTopicContent(topicId as string, topic?.subjectName, topic?.name)

  /* ─── INIT ─── */
  useEffect(() => {
    if (!topicId) return

    async function init() {
      try {
        const res  = await topicService.getById(topicId)
        const data = res.data?.data || res.data
        const t    = data?.topic ?? data

        setTopic(t)

        // Show method modal only when no content has been generated yet
        if (!t?.contentGenerated) {
          setShowMethodModal(true)
        }

        const noteRes = await notesService.getNote(topicId).catch(() => null)
        setNotes(noteRes?.data?.data?.content ?? noteRes?.data?.content ?? "")

      } catch (err) {
        console.error("Topic init failed", err)
      }
    }

    init()
  }, [topicId])

  /* ─── NOTES AUTOSAVE ─── */
  useEffect(() => {
    if (!topicId) return
    const interval = setInterval(async () => {
      try {
        await notesService.saveNote(topicId, notes)
        setNotesSaved(true)
        setTimeout(() => setNotesSaved(false), 2000)
      } catch {}
    }, 30000)
    return () => clearInterval(interval)
  }, [notes, topicId])

  /* ─── MARK SECTION COMPLETE ─── */
  const markComplete = async (section: string) => {
    setProgress(p => ({ ...p, [section]: true }))
    try {
      await topicService.updateProgress(topicId, { section, completed: true })
    } catch {}
    const idx = SECTIONS.findIndex(s => s.key === section)
    if (SECTIONS[idx + 1]) {
      setTimeout(() => setActiveSection(SECTIONS[idx + 1].key), 800)
    }
  }

  /* ─── COMPLETE TOPIC ─── */
  const completeTopic = async () => {
    try {
      await topicService.complete(topicId)
    } catch {}
    router.push(`/subjects/${subjectId}/topics`)
  }

  /* ─── LOADING STATE ─── */
  if (isGenerating || (!content && !showMethodModal && topic)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <AiThinkingLoader />
        <p className="text-slate-400 text-sm">
          Generating AI content for <strong>{topic?.name ?? "..."}</strong>
        </p>
        <p className="text-slate-600 text-xs">This only happens once — content is saved for future visits</p>
      </div>
    )
  }

  /* ─── NO CONTENT YET / FIRST VISIT ─── */
  if (!content || showMethodModal) {
    return (
      <>
        {!content && (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-slate-400 mb-4">Choose how you want to learn this topic</p>
              <button
                onClick={() => setShowMethodModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm"
              >
                Choose Learning Method
              </button>
            </div>
          </div>
        )}

        <LearningMethodModal
          isOpen={showMethodModal}
          topicName={topic?.name ?? ""}
          hasAttempted={!!content}
          onClose={() => {
            setShowMethodModal(false)
            // If there's no content and user closes without selecting, go back
            if (!content) router.push(`/subjects/${subjectId}/topics`)
          }}
          onSelect={async (method) => {
            setShowMethodModal(false)
            setSelectedMethod(method)
            await generateWithMethod(method)
          }}
        />
      </>
    )
  }

  const allDone        = SECTIONS.every(s => progress[s.key])
  const completedCount = Object.values(progress).filter(Boolean).length

  /* ─── SECTION RENDERER ─── */
  const renderSection = () => {
    switch (activeSection) {
      case "concept":
        return <ConceptSection concept={content?.concept ?? {}} onComplete={() => markComplete("concept")} />
      case "visual":
        return <VisualSection visual={content?.visualExplanation ?? {}} onComplete={() => markComplete("visual")} />
      case "code":
        return <CodeSection codeExamples={content?.codeExamples ?? []} />
      case "flashcards":
        return <FlashcardSection flashcards={content?.flashcards ?? []} />
      case "interview":
        return <InterviewSection questions={content?.interviewQuestions ?? []} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 flex-shrink-0 bg-[#08080f]">
        <button onClick={() => router.push(`/subjects/${subjectId}/topics`)}
          className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft size={16}/>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">{topic?.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <div className="flex gap-0.5">
              {SECTIONS.map(s => (
                <div key={s.key}
                  className={`h-1 w-4 rounded-full transition-colors ${progress[s.key] ? 'bg-green-400' : 'bg-white/10'}`}/>
              ))}
            </div>
            <span className="text-xs text-slate-500">{completedCount}/{SECTIONS.length} sections</span>
            {cacheSource && (
              <span className="text-xs text-slate-600">
                {cacheSource === 'indexeddb' ? '💾 cached' : cacheSource === 'ai' ? '✨ generated' : ''}
              </span>
            )}
          </div>
        </div>
        <button onClick={regenerate}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-slate-400 hover:text-white transition-colors">
          <RefreshCw size={12}/> Regenerate
        </button>
        {allDone && (
          <button onClick={completeTopic}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs font-medium transition-colors">
            <CheckCircle size={12}/> Mark Complete
          </button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="hidden lg:flex w-[200px] flex-col border-r border-white/10 flex-shrink-0 bg-[#0a0a14] overflow-y-auto">
          {SECTIONS.map(s => {
            const Icon = s.icon
            const done   = progress[s.key]
            const active = activeSection === s.key
            return (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-l-2 ${
                  active
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border-transparent'
                }`}>
                <Icon size={15}/>
                <span className="flex-1">{s.label}</span>
                {done && <CheckCircle size={12} className="text-green-400 flex-shrink-0"/>}
              </button>
            )
          })}
        </aside>

        {/* Mobile Section Tabs */}
        <div className="lg:hidden fixed bottom-[60px] left-0 right-0 bg-[#08080f] border-t border-white/10 flex overflow-x-auto z-10 scrollbar-hide">
          {SECTIONS.map(s => {
            const Icon   = s.icon
            const done   = progress[s.key]
            const active = activeSection === s.key
            return (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className={`flex flex-col items-center px-4 py-2 text-xs flex-shrink-0 relative transition-colors ${
                  active ? 'text-indigo-400' : 'text-slate-500'
                }`}>
                <Icon size={16}/>
                <span className="mt-0.5">{s.label}</span>
                {done && <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-green-400 rounded-full"/>}
              </button>
            )
          })}
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-28 lg:pb-6">
            {renderSection()}
          </div>
        </main>

        {/* Right Panel - Notes */}
        <aside className="hidden xl:flex w-[260px] flex-col border-l border-white/10 flex-shrink-0 p-4 bg-[#0a0a14] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-slate-400">Notes</h4>
            {notesSaved && <span className="text-xs text-green-400">Saved ✓</span>}
          </div>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            className="flex-1 bg-black/30 rounded-lg p-3 text-sm resize-none outline-none border border-white/5 focus:border-indigo-500 transition-colors min-h-[150px]"
            placeholder="Take notes while you learn..."/>

          {(content.relatedTopics ?? []).length > 0 && (
            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-400 mb-2">Related Topics</h4>
              <div className="flex flex-wrap gap-1.5">
                {(content.relatedTopics ?? []).map((t: string) => (
                  <span key={t} className="px-2 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded text-xs text-indigo-300">{t}</span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
