'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, X, ArrowLeft, BookOpen, CheckCircle2, Circle, Clock, Check } from "lucide-react"
import { topicService, subjectService } from "@/lib/apiServices"

interface Topic {
  _id: string
  name: string
  status: "not_started" | "in_progress" | "completed"
  difficulty?: string
  estimatedMinutes?: number
}

interface Subject {
  _id: string
  name: string
  icon?: string
}

function AddTopicModal({
  subjectId,
  onClose,
  onAdded
}: {
  subjectId: string
  onClose: () => void
  onAdded: () => void
}) {
  const [topics,  setTopics]  = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const addRow    = () => setTopics(t => [...t, ''])
  const updateRow = (i: number, v: string) => setTopics(t => t.map((x, idx) => idx === i ? v : x))
  const removeRow = (i: number) => setTopics(t => t.filter((_, idx) => idx !== i))

  const submit = async () => {
    const valid = topics.map(t => t.trim()).filter(Boolean)
    if (!valid.length) { setError("Enter at least one topic name"); return }
    setLoading(true)
    try {
      await topicService.createBulk(subjectId, valid.map(name => ({ name })))
      onAdded()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to add topics")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0f0f1a] rounded-2xl border border-white/10 w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold">Add Topics</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={16}/></button>
        </div>

        <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
          {topics.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-5 text-right flex-shrink-0">{i + 1}</span>
              <input
                value={t}
                onChange={e => updateRow(i, e.target.value)}
                placeholder="Topic name (e.g. Arrays, Sorting)"
                onKeyDown={e => e.key === "Enter" && addRow()}
                className="flex-1 p-2.5 bg-black/40 border border-white/10 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors"
              />
              {topics.length > 1 && (
                <button onClick={() => removeRow(i)} className="text-slate-600 hover:text-red-400">
                  <X size={13}/>
                </button>
              )}
            </div>
          ))}
        </div>

        <button onClick={addRow} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-5">
          <Plus size={12}/> Add another
        </button>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium">
            {loading ? "Adding..." : `Add ${topics.filter(t => t.trim()).length || ''} Topics`}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

const STATUS_CONFIG = {
  not_started: { label: "Not Started", color: "text-slate-400", bg: "bg-slate-400/10", icon: Circle },
  in_progress:  { label: "In Progress",  color: "text-yellow-400", bg: "bg-yellow-400/10", icon: Clock },
  completed:    { label: "Completed",    color: "text-green-400",  bg: "bg-green-400/10",  icon: CheckCircle2 }
}

export default function TopicsPage() {
  const params = useParams()
  const router = useRouter()

  const subjectId = Array.isArray(params.subjectId) ? params.subjectId[0] : params.subjectId

  const [subject,    setSubject]    = useState<Subject | null>(null)
  const [topics,     setTopics]     = useState<Topic[]>([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState<string | null>(null)
  const [showModal,  setShowModal]  = useState(false)
  const [filter,     setFilter]     = useState<string>('all')
  const [completing, setCompleting] = useState<Record<string, boolean>>({})

  const loadData = async () => {
    if (!subjectId) return
    setLoading(true)
    try {
      const [subRes, topRes] = await Promise.all([
        subjectService.getById(subjectId),
        topicService.getBySubject(subjectId)
      ])
      setSubject(subRes.data?.data || subRes.data)
      const data = topRes.data?.data || topRes.data || []
      setTopics(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load topics", err)
      setError("Failed to load topics")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (subjectId) loadData() }, [subjectId])

  const handleMarkComplete = async (e: React.MouseEvent, topicId: string) => {
    e.stopPropagation()
    if (completing[topicId]) return
    setCompleting(prev => ({ ...prev, [topicId]: true }))
    try {
      await topicService.complete(topicId)
      // Optimistically update local state
      setTopics(prev => prev.map(t => t._id === topicId ? { ...t, status: "completed" } : t))
    } catch (err) {
      console.error("Failed to mark complete", err)
    } finally {
      setCompleting(prev => ({ ...prev, [topicId]: false }))
    }
  }

  const filtered = filter === "all" ? topics : topics.filter(t => t.status === filter)

  const grouped = {
    not_started: topics.filter(t => t.status === "not_started"),
    in_progress:  topics.filter(t => t.status === "in_progress"),
    completed:    topics.filter(t => t.status === "completed")
  }

  const pct = topics.length
    ? Math.round((grouped.completed.length / topics.length) * 100)
    : 0

  if (loading)
    return (
      <div className="p-6 space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse"/>
        ))}
      </div>
    )

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto">

      {error && (
        <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white">
          <ArrowLeft size={18}/>
        </button>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{subject?.icon ?? "📚"}</span>
            <h1 className="text-xl font-bold truncate">{subject?.name ?? "Topics"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/10 rounded-full max-w-[160px]">
              <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }}/>
            </div>
            <span className="text-xs text-slate-400">
              {grouped.completed.length}/{topics.length} completed ({pct}%)
            </span>
          </div>
        </div>

        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium">
          <Plus size={14}/> Add Topics
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'not_started', 'in_progress', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {f === 'all' ? `All (${topics.length})` :
             f === 'not_started' ? `Not Started (${grouped.not_started.length})` :
             f === 'in_progress' ? `In Progress (${grouped.in_progress.length})` :
             `Completed (${grouped.completed.length})`}
          </button>
        ))}
      </div>

      {/* Topic Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(topic => {
          const cfg = STATUS_CONFIG[topic.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.not_started
          const Icon = cfg.icon
          const isCompleted = topic.status === "completed"
          const isCompleting = completing[topic._id]

          return (
            <motion.div
              key={topic._id}
              layout
              className={`bg-[#13131f] border rounded-xl cursor-pointer group relative transition-all ${
                isCompleted
                  ? 'border-green-500/20 hover:border-green-500/40'
                  : 'border-white/5 hover:border-indigo-500/40'
              }`}
            >
              {/* Main clickable area - navigates to learn page */}
              <div
                className="p-4 pb-3"
                onClick={() => {
                  if (!topic?._id) return
                  router.push(`/subjects/${subjectId}/topics/${topic._id}/learn`)
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={`font-medium text-sm group-hover:text-indigo-300 transition-colors pr-2 ${isCompleted ? 'text-slate-400 line-through' : ''}`}>
                    {topic.name}
                  </div>
                  <Icon size={14} className={`${cfg.color} flex-shrink-0 mt-0.5`}/>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {topic.estimatedMinutes && (
                    <span className="text-xs text-slate-500">{topic.estimatedMinutes}m</span>
                  )}
                </div>
              </div>

              {/* Mark as Complete button — only shown for non-completed topics */}
              {!isCompleted && (
                <div className="px-4 pb-4">
                  <button
                    onClick={(e) => handleMarkComplete(e, topic._id)}
                    disabled={isCompleting}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-white/5 hover:bg-green-500/20 border border-white/10 hover:border-green-500/30 rounded-lg text-xs text-slate-500 hover:text-green-400 transition-all disabled:opacity-50"
                  >
                    {isCompleting ? (
                      <span className="animate-pulse">Marking...</span>
                    ) : (
                      <>
                        <Check size={11}/>
                        Mark as Complete
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Completed checkmark badge */}
              {isCompleted && (
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-green-500">
                    <CheckCircle2 size={11}/>
                    Completed
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30"/>
          <p className="text-sm">
            {filter === 'all' ? 'No topics yet. Add your first topic!' : `No topics with status "${filter.replace('_', ' ')}"`}
          </p>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <AddTopicModal
            subjectId={subjectId as string}
            onClose={() => setShowModal(false)}
            onAdded={loadData}
          />
        )}
      </AnimatePresence>

    </div>
  )
}
