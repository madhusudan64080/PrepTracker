// frontend/components/dashboard/TodayGoals.tsx
//
// Renders the Today's Goals panel with three tabs:
//   Topics   — scheduled study tasks
//   Revision — spaced repetition tasks
//   Pending  — incomplete past tasks
//
// Drill-down flow:
//   Tab → Subject list → Topic list → navigate to /subjects/:subjectId/topics/:topicId/learn

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  BookOpen, RotateCcw, Clock, ChevronRight,
  ChevronLeft, CheckCircle, Circle, ArrowRight
} from "lucide-react"
import { useDailyTasks, SubjectTaskGroup, TaskTopic } from "@/hooks/useDailyTasks"

/* ─── types ──────────────────────────────────────────────────────────────── */

type Section = "study" | "revision" | "pending"

/* ─── progress bar ───────────────────────────────────────────────────────── */

function MiniProgress({
  done, total, color
}: {
  done: number; total: number; color: string
}) {
  const pct = total === 0 ? 0 : Math.min(100, Math.round((done / total) * 100))
  return (
    <div className="flex items-center gap-2 text-xs text-slate-400">
      <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <span className="shrink-0 tabular-nums">{done}/{total}</span>
    </div>
  )
}

/* ─── tab button ─────────────────────────────────────────────────────────── */

function TabBtn({
  active, onClick, icon, label, count, color
}: {
  active: boolean; onClick: () => void;
  icon: React.ReactNode; label: string; count: number; color: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
        active ? "text-white" : "text-slate-500 hover:text-slate-300"
      }`}
      style={active ? { background: color + "22", border: `1px solid ${color}44` } : {
        border: "1px solid transparent"
      }}
    >
      <span className={active ? "" : "opacity-50"}>{icon}</span>
      <span>{label}</span>
      {count > 0 && (
        <span
          className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
          style={active ? { background: color, color: "#fff" } : { background: "rgba(255,255,255,0.08)" }}
        >
          {count}
        </span>
      )}
    </button>
  )
}

/* ─── subject list view ──────────────────────────────────────────────────── */

function SubjectListView({
  groups,
  onSelect,
  emptyMsg
}: {
  groups: SubjectTaskGroup[]
  onSelect: (g: SubjectTaskGroup) => void
  emptyMsg: string
}) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="text-3xl mb-2">🎉</div>
        <p className="text-sm text-slate-400">{emptyMsg}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {groups.map(g => (
        <button
          key={g.subjectId}
          onClick={() => onSelect(g)}
          className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
              style={{ background: (g.subjectColor ?? "#6366f1") + "33" }}
            >
              {g.subjectIcon ?? "📚"}
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">{g.subjectName}</div>
              <div className="text-xs text-slate-500">
                {g.topics.length} topic{g.topics.length !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
        </button>
      ))}
    </div>
  )
}

/* ─── topic list view ────────────────────────────────────────────────────── */

function TopicListView({
  group,
  section,
  onBack,
  onNavigate,
  onComplete
}: {
  group:      SubjectTaskGroup
  section:    Section
  onBack:     () => void
  onNavigate: (subjectId: string, topicId: string) => void
  onComplete: (topicId: string, revisionCycle?: string) => void
}) {
  const cycleLabel: Record<string, string> = {
    same_day: "Same-day",
    two_day:  "2-day",
    weekly:   "Weekly"
  }

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition-colors"
      >
        <ChevronLeft size={14} /> Back to subjects
      </button>

      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{ background: (group.subjectColor ?? "#6366f1") + "33" }}
        >
          {group.subjectIcon}
        </div>
        <span className="text-sm font-semibold">{group.subjectName}</span>
      </div>

      <div className="space-y-2">
        {group.topics.map(t => (
          <div
            key={`${t.topicId}-${t.revisionCycle ?? "study"}`}
            className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-all"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => onComplete(t.topicId, t.revisionCycle)}
                className="shrink-0 text-slate-500 hover:text-emerald-400 transition-colors"
                title="Mark complete"
              >
                {t.status === "completed"
                  ? <CheckCircle size={16} className="text-emerald-400" />
                  : <Circle size={16} />
                }
              </button>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{t.topicName}</div>
                {t.revisionCycle && (
                  <div className="text-xs text-slate-500">
                    {cycleLabel[t.revisionCycle] ?? t.revisionCycle} revision
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => onNavigate(group.subjectId, t.topicId)}
              className="ml-3 shrink-0 flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Learn <ArrowRight size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════════════ */

export default function TodayGoals() {
  const router = useRouter()
  const { data, isLoading, progress, completeTask } = useDailyTasks()

  const [activeSection,   setActiveSection]   = useState<Section>("study")
  const [selectedSubject, setSelectedSubject] = useState<SubjectTaskGroup | null>(null)

  // When switching tabs, reset drill-down
  const switchSection = (s: Section) => {
    setActiveSection(s)
    setSelectedSubject(null)
  }

  // FIX 6: Keep the drill-down view in sync when task data refreshes.
  // After a completion the server returns fresh data; we find the updated
  // group for the currently selected subject and update it in place,
  // so the checkmark flips without collapsing back to the subject list.
  // If the subject's topic list becomes empty (all done), then reset.
  useEffect(() => {
    if (!selectedSubject || !data) return
    const groups: SubjectTaskGroup[] =
      activeSection === "study"    ? (data.study    ?? []) :
      activeSection === "revision" ? (data.revision ?? []) :
                                     (data.pending  ?? [])
    const updated = groups.find(g => g.subjectId === selectedSubject.subjectId)
    if (!updated || updated.topics.length === 0) {
      setSelectedSubject(null)
    } else {
      setSelectedSubject(updated)
    }
  }, [data, activeSection])

  const handleNavigate = (subjectId: string, topicId: string) => {
    router.push(`/subjects/${subjectId}/topics/${topicId}/learn`)
  }

  const handleComplete = async (
    topicId:      string,
    revisionCycle?: string
  ) => {
    await completeTask(topicId, activeSection, revisionCycle)
    // FIX 6: After completing a task, stay inside the subject drill-down view
    // so the user can tick off the next topic without navigating back each time.
    // We update selectedSubject from the fresh data returned by completeTask
    // so the completed topic's status updates in place.
    // setSelectedSubject(null) is intentionally NOT called here.
  }

  /* counts for tab badges */
  const studyCount    = data?.study?.reduce((s, g) => s + g.topics.length, 0)    ?? 0
  const revisionCount = data?.revision?.reduce((s, g) => s + g.topics.length, 0) ?? 0
  const pendingCount  = data?.pending?.reduce((s, g) => s + g.topics.length, 0)  ?? 0

  const SECTIONS: { key: Section; label: string; icon: React.ReactNode; color: string; count: number }[] = [
    { key: "study",    label: "Topics",   icon: <BookOpen  size={15}/>, color: "#6366f1", count: studyCount    },
    { key: "revision", label: "Revision", icon: <RotateCcw size={15}/>, color: "#22c55e", count: revisionCount },
    { key: "pending",  label: "Pending",  icon: <Clock     size={15}/>, color: "#f59e0b", count: pendingCount  }
  ]

  const activeGroups: SubjectTaskGroup[] =
    activeSection === "study"    ? (data?.study    ?? []) :
    activeSection === "revision" ? (data?.revision ?? []) :
                                   (data?.pending  ?? [])

  const emptyMessages: Record<Section, string> = {
    study:    "No topics scheduled for today 🎉",
    revision: "No revisions due today!",
    pending:  "All caught up — nothing pending!"
  }

  return (
    <div className="bg-[#13131f] rounded-xl p-5 border border-white/5 flex flex-col gap-4">

      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Today's Goals</h3>

        {/* Progress bars */}
        <div className="space-y-1.5">
          <MiniProgress
            done={progress.topicsCompleted}
            total={progress.topicsScheduled}
            color="#6366f1"
          />
          <MiniProgress
            done={progress.revisionsCompleted}
            total={progress.revisionsScheduled}
            color="#22c55e"
          />
          {progress.pendingCount > 0 && (
            <div className="text-xs text-amber-400">
              {progress.pendingCount} pending task{progress.pendingCount !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {SECTIONS.map(s => (
          <TabBtn
            key={s.key}
            active={activeSection === s.key}
            onClick={() => switchSection(s.key)}
            icon={s.icon}
            label={s.label}
            count={s.count}
            color={s.color}
          />
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[160px]">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection + (selectedSubject?.subjectId ?? "")}
              initial={{ opacity: 0, x: selectedSubject ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {selectedSubject ? (
                <TopicListView
                  group={selectedSubject}
                  section={activeSection}
                  onBack={() => setSelectedSubject(null)}
                  onNavigate={handleNavigate}
                  onComplete={handleComplete}
                />
              ) : (
                <SubjectListView
                  groups={activeGroups}
                  onSelect={setSelectedSubject}
                  emptyMsg={emptyMessages[activeSection]}
                />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
