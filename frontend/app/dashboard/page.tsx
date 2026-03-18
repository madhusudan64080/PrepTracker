// frontend/app/dashboard/page.tsx
'use client'

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import {
  Flame, Play, Pause, RotateCcw, Clock, BookOpen,
  Code2, Target, Plus, CalendarDays, Trash2, X, ChevronRight
} from "lucide-react"

import { useAuth }       from "@/hooks/useAuth"
import { useDailyGoal }  from "@/hooks/useDailyGoal"
import { useRevision }   from "@/hooks/useRevision"
import { useAnalytics }  from "@/hooks/useAnalytics"
import { usePomodoro }   from "@/hooks/usePomodoro"
import { subjectStore }  from "@/store/subjectStore"
import { schedulerService } from "@/lib/apiServices"

import SkeletonLoader        from "@/components/shared/SkeletonLoader"
import StatCard              from "@/components/shared/StatCard"
import CreateSubjectModal    from "@/components/subject/CreateSubjectModal"
import TodayGoals            from "@/components/dashboard/TodayGoals"
import OverdueNotificationBanner from "@/components/shared/OverdueNotificationBanner" 

/* ─── animation helpers ─────────────────────────────────────── */
const fade = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }
const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }

/* ═══════════════════════════════════════════════════════════════
   GOAL RINGS
═══════════════════════════════════════════════════════════════ */
function GoalRing({ label, value, color }: { label: string; value: number; color: string }) {
  const r  = 36
  const c  = 2 * Math.PI * r
  const pct = Math.min(Math.max(value, 0), 100)
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="90" height="90" className="-rotate-90">
        <circle cx="45" cy="45" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="transparent"/>
        <motion.circle cx="45" cy="45" r={r} stroke={color} strokeWidth="8" fill="transparent"
          strokeDasharray={c} initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ duration: 1, ease: "easeOut" }}/>
      </svg>
      <span className="text-xs text-slate-400 -mt-1">{label}</span>
      <span className="text-sm font-semibold">{Math.round(pct)}%</span>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   POMODORO
═══════════════════════════════════════════════════════════════ */
function PomodoroWidget() {
  const { formattedTime, isActive, sessionType, start, pause, reset, sessionsCompleted } = usePomodoro()
  return (
    <div className="bg-[#13131f] rounded-xl p-5 border border-white/5">
      <h3 className="mb-4 text-sm font-semibold flex items-center gap-2">
        <Clock size={14} className="text-indigo-400"/> Pomodoro
      </h3>
      <div className="flex flex-col items-center gap-3">
        <div className="text-4xl font-mono tracking-widest">{formattedTime}</div>
        <div className="text-xs text-slate-400 capitalize">{sessionType.replace("_", " ")}</div>
        <div className="flex gap-2">
          {!isActive
            ? <button onClick={start}  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-sm flex items-center gap-1"><Play size={13}/> Start</button>
            : <button onClick={pause}  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-sm flex items-center gap-1"><Pause size={13}/> Pause</button>
          }
          <button onClick={reset} className="px-4 py-1.5 bg-white/10 hover:bg-white/15 rounded text-sm flex items-center gap-1"><RotateCcw size={13}/> Reset</button>
        </div>
        <div className="text-xs text-slate-500">Sessions today: {sessionsCompleted}</div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PLACEMENT GAUGE
═══════════════════════════════════════════════════════════════ */
function PlacementGauge({ score }: { score: number }) {
  const r = 60; const c = Math.PI * r; const pct = Math.min(score, 100)
  return (
    <div className="bg-[#13131f] rounded-xl p-5 border border-white/5 text-center">
      <h3 className="text-sm font-semibold mb-3">Placement Score</h3>
      <svg width="150" height="90" className="mx-auto">
        <path d="M15 75 A60 60 0 0 1 135 75" stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="transparent"/>
        <motion.path d="M15 75 A60 60 0 0 1 135 75" stroke="#22c55e" strokeWidth="10" fill="transparent"
          strokeDasharray={c} initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (pct / 100) * c }}
          transition={{ duration: 1.2, ease: "easeOut" }}/>
      </svg>
      <div className="text-3xl font-bold -mt-4">{score}</div>
      <div className="text-xs text-slate-500 mt-1">out of 100</div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SUBJECT GRID  (main feature — full width top section)
═══════════════════════════════════════════════════════════════ */
function SubjectGrid({ onAddSubject }: { onAddSubject: () => void }) {
  const { subjects, fetchSubjects, isLoading } = subjectStore()
  const router = useRouter()

  useEffect(() => { fetchSubjects() }, [])

  return (
    <div className="bg-[#13131f] rounded-xl p-5 border border-white/5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2"><BookOpen size={15} className="text-indigo-400"/> Subjects</h3>
        <button onClick={onAddSubject}
          className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors">
          <Plus size={14}/> Add Subject
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse"/>)}
        </div>
      ) : subjects.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-slate-400 text-sm mb-4">No subjects yet. Add your first subject to get started!</p>
          <button onClick={onAddSubject}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors">
            + Add First Subject
          </button>
        </div>
      ) : (
        <OverdueNotificationBanner />
        <motion.div variants={container} initial="hidden" animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {subjects.map(s => {
            const pct = s.totalTopics ? Math.round(((s.completedTopics ?? 0) / s.totalTopics) * 100) : 0
            return (
              <motion.button key={s._id} variants={fade}
                onClick={() => router.push(`/subjects/${s._id}/topics`)}
                className="text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/15 transition-all group">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: s.color ?? "#6366f1" + "33" }}>
                    {s.icon ?? "📚"}
                  </div>
                  <span className="text-sm font-medium truncate">{s.name}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-1">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: s.color ?? "#6366f1" }}/>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">{s.completedTopics ?? 0}/{s.totalTopics ?? 0} topics</span>
                  <ChevronRight size={12} className="text-slate-600 group-hover:text-indigo-400 transition-colors"/>
                </div>
              </motion.button>
            )
          })}
          {/* always show add button as last tile */}
          <motion.button variants={fade} onClick={onAddSubject}
            className="text-center p-3 rounded-xl border-2 border-dashed border-white/10 hover:border-indigo-500/50 transition-colors flex flex-col items-center justify-center gap-1 min-h-[80px]">
            <Plus size={18} className="text-slate-500"/>
            <span className="text-xs text-slate-500">Add Subject</span>
          </motion.button>
        </motion.div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SCHEDULER MODAL
═══════════════════════════════════════════════════════════════ */
// FIXED — value matches backend enum exactly
const FREQ_OPTIONS: {
  label: string
  sub: string
  value: "daily" | "every_2_days" | "every_3_days" | "weekly"
}[] = [
  { label: "Every Day",    sub: "7 days/week",   value: "daily" },
  { label: "Every 2 Days", sub: "3-4 days/week", value: "every_2_days" },
  { label: "Every 3 Days", sub: "2-3 days/week", value: "every_3_days" },
  { label: "Weekly",       sub: "Once a week",   value: "weekly" },
]

function SchedulerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { subjects } = subjectStore()
  const [subjectId,    setSubjectId]    = useState(subjects[0]?._id ?? "")
  const [frequency, setFrequency] = useState<
  "daily" | "every_2_days" | "every_3_days" | "weekly"
>("daily")
  const [topicsPerDay, setTopicsPerDay] = useState(3)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState("")

  const submit = async () => {
    if (!subjectId) { setError("Please select a subject"); return }
    setLoading(true); setError("")
    try {
      await schedulerService.create({ subjectId, frequency, topicsPerDay: Number(topicsPerDay) })
      onCreated()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.error || "Failed to create schedule")
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[#13131f] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold">Set Study Schedule</h2>
            <p className="text-xs text-slate-400 mt-0.5">Automate daily study targets per subject</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18}/></button>
        </div>

        {/* Step 1: Subject */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-400 mb-2 block">1. Select Subject</label>
          {subjects.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No subjects yet — add a subject first.</p>
          ) : (
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)}
              className="w-full p-2.5 bg-black/40 border border-white/10 rounded-lg text-sm outline-none focus:border-indigo-500">
              {subjects.map(s => <option key={s._id} value={s._id}>{s.icon} {s.name}</option>)}
            </select>
          )}
        </div>

        {/* Step 2: Frequency */}
        <div className="mb-4">
          <label className="text-xs font-medium text-slate-400 mb-2 block">2. Study Frequency</label>
          <div className="grid grid-cols-2 gap-2">
            {FREQ_OPTIONS.map(f => (
              <button key={f.value} onClick={() => setFrequency(f.value)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  frequency === f.value
                    ? "border-indigo-500 bg-indigo-500/10"
                    : "border-white/10 hover:border-white/20"}`}>
                <div className="text-sm font-medium">{f.label}</div>
                <div className="text-xs text-slate-500">{f.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Topics per day */}
        <div className="mb-5">
          <label className="text-xs font-medium text-slate-400 mb-2 block">
            3. Topics per session — <span className="text-indigo-400 font-semibold">{topicsPerDay}</span>
          </label>
          <input type="range" min={1} max={10} value={topicsPerDay}
            onChange={e => setTopicsPerDay(Number(e.target.value))}
            className="w-full accent-indigo-500"/>
          <div className="flex justify-between text-xs text-slate-600 mt-1">
            <span>1 topic</span><span>10 topics</span>
          </div>
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        <button onClick={submit} disabled={loading || subjects.length === 0}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg font-medium transition-colors">
          {loading ? "Saving..." : "Activate Schedule 🚀"}
        </button>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   SCHEDULER WIDGET
═══════════════════════════════════════════════════════════════ */
function SchedulerWidget() {
  const [schedules, setSchedules] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)

  const load = async () => {
    try {
      const res = await schedulerService.getAll()
      setSchedules(res.data?.data ?? [])
    } catch {}
  }

  useEffect(() => { load() }, [])

  const remove = async (id: string) => {
    await schedulerService.remove(id)
    setSchedules(s => s.filter(x => x._id !== id))
  }

  const FREQ_LABELS: Record<string, string> = {
    daily: "Daily", every_2_days: "Every 2 days",
    every_3_days: "Every 3 days", weekly: "Weekly"
  }

  return (
    <>
      <div className="bg-[#13131f] rounded-xl p-5 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <CalendarDays size={14} className="text-indigo-400"/> Study Scheduler
          </h3>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs transition-colors">
            <Plus size={12}/> Schedule
          </button>
        </div>

        {schedules.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-xs text-slate-500 mb-3">No schedules yet.<br/>Set targets for each subject.</p>
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 border border-dashed border-indigo-500/40 rounded-lg text-xs text-indigo-400 hover:bg-indigo-500/10 transition-colors">
              + Set Schedule
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {schedules.map(s => (
              <div key={s._id} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg">
                <div>
                  <div className="text-sm font-medium">{s.subjectName}</div>
                  <div className="text-xs text-slate-500">
                    {FREQ_LABELS[s.frequency] ?? s.frequency} · {s.topicsPerDay} topics/session
                  </div>
                </div>
                <button onClick={() => remove(s._id)} className="text-slate-600 hover:text-red-400 transition-colors p-1">
                  <Trash2 size={13}/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <SchedulerModal onClose={() => setShowModal(false)} onCreated={load}/>
        )}
      </AnimatePresence>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DUE REVISIONS
═══════════════════════════════════════════════════════════════ */
function DueRevisions({ items }: { items: any[] }) {
  const router = useRouter()
  if (!items.length) {
    return (
      <div className="bg-[#13131f] rounded-xl p-5 border border-white/5 text-center">
        <div className="text-2xl mb-1">🎉</div>
        <p className="text-xs text-slate-400">All caught up on revisions!</p>
      </div>
    )
  }
  return (
    <div className="bg-[#13131f] rounded-xl p-5 border border-white/5">
      <h3 className="text-sm font-semibold mb-3">Due Revisions</h3>
      <div className="space-y-2">
        {items.slice(0, 4).map((r: any) => (
          <div key={r.topicId} className={`flex items-center justify-between p-2.5 rounded-lg ${r.overdue ? "bg-red-500/10 border border-red-500/20" : "bg-white/5"}`}>
            <span className="text-sm truncate flex-1">{r.topicName}</span>
            <button onClick={() => router.push(`/revision`)}
              className="text-xs text-indigo-400 ml-2 flex-shrink-0 hover:text-indigo-300">
              Revise →
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ACTIVITY FEED
═══════════════════════════════════════════════════════════════ */
function ActivityFeed({ activities }: { activities: any[] }) {
  if (!activities.length) return null
  return (
    <div className="bg-[#13131f] rounded-xl p-5 border border-white/5">
      <h3 className="text-sm font-semibold mb-3">Recent Activity</h3>
      <div className="space-y-2">
        {activities.slice(0, 6).map((a: any, i: number) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-slate-300 truncate flex-1">{a.description}</span>
            <span className="text-slate-500 text-xs ml-3 flex-shrink-0">
              {formatDistanceToNow(new Date(a.date))} ago
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DASHBOARD PAGE
═══════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user }   = useAuth()
  const { goal, individualPercentages, isLoading: goalsLoading } = useDailyGoal()
  const revision   = useRevision()
  const analytics  = useAnalytics()
  const [showAddSubject, setShowAddSubject] = useState(false)
  const { fetchSubjects } = subjectStore()

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"
  const streak   = user?.streak?.currentStreak ?? 0

  if (goalsLoading || analytics.isLoading) {
    return (
      <div className="p-6 space-y-4">
        <SkeletonLoader variant="card"/>
        <SkeletonLoader variant="card"/>
        <SkeletonLoader variant="card"/>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{greeting}, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-slate-400 text-sm mt-0.5">Let's make progress today</p>
        </div>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full">
            <Flame size={15} className="text-orange-400"/>
            <span className="text-sm font-semibold text-orange-400">{streak} day streak</span>
          </div>
        )}
      </div>

      {/* ── Subject Grid (full width, always first) ───── */}
      <SubjectGrid onAddSubject={() => setShowAddSubject(true)}/>

      {/* ── 3-column content area ─────────────────────── */}
      <motion.div variants={container} initial="hidden" animate="show"
        className="grid gap-5 lg:grid-cols-3">

        {/* LEFT */}
        <motion.div variants={fade} className="space-y-5">
          {/* Today's Goals — Topics / Revision / Pending */}
          <TodayGoals />

          <PomodoroWidget/>
          <SchedulerWidget/>
        </motion.div>

        {/* CENTER */}
        <motion.div variants={fade} className="space-y-5">
          <PlacementGauge score={analytics.overview?.placementScore ?? 0}/>

          <div className="grid grid-cols-2 gap-3">
            <StatCard label="Topics Done"  value={analytics.overview?.topics    ?? 0} icon={<BookOpen size={15}/>}/>
            <StatCard label="Problems"     value={analytics.overview?.problems  ?? 0} icon={<Code2    size={15}/>}/>
            <StatCard label="Projects"     value={analytics.overview?.projects  ?? 0} icon={<Target   size={15}/>}/>
            <StatCard label="Study Hours"  value={analytics.overview?.hours     ?? 0} icon={<Clock    size={15}/>}/>
          </div>

          <DueRevisions items={revision.todayItems ?? []}/>
        </motion.div>

        {/* RIGHT */}
        <motion.div variants={fade} className="space-y-5">
          <ActivityFeed activities={analytics.overview?.recentActivity ?? []}/>
        </motion.div>
      </motion.div>

      {/* ── Modals ────────────────────────────────────── */}
      {showAddSubject && (
        <CreateSubjectModal
          isOpen={showAddSubject}
          onClose={() => { setShowAddSubject(false); fetchSubjects(true) }}
        />
      )}
    </div>
  )
}
