// frontend/app/projects/[projectId]/page.tsx
'use client'

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, CheckCircle, Lock, Cpu, GitBranch, Database, Server, Layout, Shield, Rocket, Zap, Star, MessageSquare, RefreshCw } from "lucide-react"
import { projectService, interviewService } from "@/lib/apiServices"
import AiThinkingLoader from "@/components/shared/AiThinkingLoader"

const STAGE_META = [
  { name: "Problem Understanding",      icon: Star,          color: "#6366f1" },
  { name: "System Architecture",        icon: Cpu,           color: "#8b5cf6" },
  { name: "Feature & Module Breakdown", icon: GitBranch,     color: "#ec4899" },
  { name: "Database Schema Design",     icon: Database,      color: "#f97316" },
  { name: "UI/UX Design Breakdown",     icon: Layout,        color: "#22c55e" },
  { name: "Step-by-Step Implementation",icon: Server,        color: "#14b8a6" },
  { name: "Testing Strategy",           icon: CheckCircle,   color: "#0ea5e9" },
  { name: "Deployment Guide",           icon: Rocket,        color: "#eab308" },
  { name: "Interview Preparation",      icon: MessageSquare, color: "#e11d48" },
]

function InterviewPrepPanel({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading]     = useState(false)
  const [answers, setAnswers]     = useState<Record<number, string>>({})
  const [revealed, setRevealed]   = useState<Record<number, any>>({})
  const [genLoading, setGenLoading] = useState(false)

  const generate = async () => {
    setGenLoading(true)
    try {
      const res = await interviewService.getCompanyQuestions({ role: projectName, company: 'General', count: 8 })
      const data = res.data?.data || res.data
      setQuestions(Array.isArray(data) ? data : data?.questions ?? [])
    } catch (e) {
      console.error(e)
    } finally { setGenLoading(false) }
  }

  const reveal = async (q: any, i: number) => {
    if (revealed[i]) return
    try {
      const res = await interviewService.revealAnswer(q.id)
      setRevealed(r => ({ ...r, [i]: res.data?.data || res.data }))
    } catch {}
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Interview Questions</h3>
        <button onClick={generate} disabled={genLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-xs font-medium transition-colors">
          {genLoading ? <><RefreshCw size={12} className="animate-spin"/> Generating...</>
            : <><MessageSquare size={12}/> Generate Questions</>}
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8 bg-white/5 rounded-xl">
          <MessageSquare size={32} className="text-slate-600 mx-auto mb-2"/>
          <p className="text-slate-400 text-sm">Click "Generate Questions" to get project-specific interview questions</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q: any, i: number) => (
            <div key={i} className="bg-white/5 rounded-xl p-4 border border-white/5">
              <div className="flex items-start gap-3 mb-3">
                <span className="w-6 h-6 bg-indigo-600 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                <p className="text-sm font-medium">{q.question}</p>
              </div>
              <textarea
                value={answers[i] ?? ''}
                onChange={e => setAnswers(a => ({ ...a, [i]: e.target.value }))}
                placeholder="Write your answer here..."
                rows={3}
                className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none transition-colors mb-3"/>
              <div className="flex gap-2">
                <button onClick={() => reveal(q, i)}
                  className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 text-green-400 rounded-lg text-xs transition-colors">
                  {revealed[i] ? 'Answer Shown ✓' : 'Check Answer'}
                </button>
              </div>
              {revealed[i] && (
                <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <p className="text-xs text-green-300 font-medium mb-1">Ideal Answer:</p>
                  <p className="text-xs text-slate-300">{revealed[i].idealAnswer}</p>
                  {revealed[i].keyPointsToMention?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-slate-400 font-medium mb-1">Key points to mention:</p>
                      <ul className="space-y-0.5">
                        {revealed[i].keyPointsToMention.map((pt: string, j: number) => (
                          <li key={j} className="text-xs text-slate-400 flex items-start gap-1">
                            <span className="text-green-400 mt-0.5">•</span>{pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const router = useRouter()

  const [project,      setProject]      = useState<any>(null)
  const [currentStage, setCurrentStage] = useState(1)
  const [stageContent, setStageContent] = useState<any>(null)
  const [loadingStage, setLoadingStage] = useState(false)
  const [activeTab,    setActiveTab]    = useState<'content' | 'interview'>('content')

  const loadProject = async () => {
    try {
      const res = await projectService.getById(projectId as string)
      const data = res.data?.data || res.data
      setProject(data)
    } catch (e) { console.error(e) }
  }

  const loadStage = async (stageNum: number) => {
    setLoadingStage(true)
    setStageContent(null)
    try {
      const res = await projectService.getStageContent(projectId as string, stageNum)
      setStageContent(res.data?.data || res.data)
    } catch (e) {
      console.error(e)
    } finally { setLoadingStage(false) }
  }

  useEffect(() => { loadProject() }, [projectId])
  useEffect(() => { if (projectId) loadStage(currentStage) }, [currentStage, projectId])

  const completeStage = async () => {
    await projectService.completeStage(projectId as string, currentStage)
    await loadProject()
    if (currentStage < 9) setCurrentStage(currentStage + 1)
  }

  if (!project) return (
    <div className="min-h-screen flex items-center justify-center"><AiThinkingLoader/></div>
  )

  const stages = project.stages ?? []
  const completed = stages.filter((s: any) => s.status === 'completed').length

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Stage Sidebar */}
      <aside className="hidden lg:flex w-[240px] flex-col border-r border-white/10 bg-[#0a0a14] flex-shrink-0">
        <div className="p-4 border-b border-white/10">
          <button onClick={() => router.push('/projects')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft size={14}/> Projects
          </button>
          <h2 className="font-semibold text-sm truncate">{project.name}</h2>
          <div className="flex gap-0.5 mt-2">
            {Array.from({length: 9}).map((_,i) => (
              <div key={i} className={`flex-1 h-1 rounded-full ${i < completed ? 'bg-green-500' : 'bg-white/10'}`}/>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-1">{completed}/9 stages complete</p>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {STAGE_META.map((s, i) => {
            const stageNum   = i + 1
            const stageData  = stages[i]
            const isCompleted = stageData?.status === 'completed'
            const isActive   = currentStage === stageNum
            const isLocked   = stageData?.status === 'locked'
            const Icon = s.icon

            return (
              <button key={stageNum}
                onClick={() => !isLocked && setCurrentStage(stageNum)}
                disabled={isLocked}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm mb-1 transition-all ${
                  isActive ? 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-300'
                  : isLocked ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}>
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${isActive ? 'opacity-100' : 'opacity-60'}`}
                  style={{ background: s.color + '22' }}>
                  {isLocked ? <Lock size={10} className="text-slate-600"/>
                    : isCompleted ? <CheckCircle size={12} className="text-green-400"/>
                    : <Icon size={11} style={{ color: s.color }}/>}
                </div>
                <span className="text-xs leading-snug">{stageNum}. {s.name}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
          {/* Mobile header */}
          <div className="flex items-center gap-3 lg:hidden">
            <button onClick={() => router.push('/projects')} className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft size={18}/>
            </button>
            <h1 className="font-semibold">{project.name}</h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-white/10 pb-0">
            {(['content','interview'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                  activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-white'
                }`}>
                {tab === 'content' ? 'Stage Content' : '🎤 Interview Prep'}
              </button>
            ))}
          </div>

          {activeTab === 'content' ? (
            <>
              {/* Stage header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {(() => { const meta = STAGE_META[currentStage-1]; const Icon = meta.icon; return <Icon size={18} style={{ color: meta.color }}/>; })()}
                    <h2 className="text-lg font-bold">Stage {currentStage}: {STAGE_META[currentStage-1].name}</h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    {stages[currentStage-1]?.status === 'completed' ? '✅ Completed' : 'In progress'}
                  </p>
                </div>
                {stages[currentStage-1]?.status !== 'completed' && stages[currentStage-1]?.status !== 'locked' && (
                  <button onClick={completeStage}
                    className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors flex-shrink-0">
                    <CheckCircle size={14}/> Mark Done
                  </button>
                )}
              </div>

              {/* Content */}
              {loadingStage ? (
                <div className="flex flex-col items-center py-16 gap-3">
                  <AiThinkingLoader/>
                  <p className="text-slate-400 text-sm">Generating stage content with AI...</p>
                </div>
              ) : stageContent ? (
                <div className="space-y-6">
                  {stageContent.explanation && (
                    <div className="bg-[#13131f] rounded-xl p-5 border border-white/5">
                      <h3 className="font-semibold mb-3 text-sm text-indigo-300">Overview</h3>
                      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{stageContent.explanation}</p>
                    </div>
                  )}
                  {stageContent.diagram && (
                    <div className="bg-[#0a0a14] rounded-xl p-5 border border-white/10">
                      <h3 className="font-semibold mb-3 text-sm text-indigo-300">Diagram</h3>
                      <pre className="text-xs font-mono text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">{stageContent.diagram}</pre>
                    </div>
                  )}
                  {stageContent.implementation?.length > 0 && (
                    <div className="bg-[#13131f] rounded-xl p-5 border border-white/5">
                      <h3 className="font-semibold mb-3 text-sm text-indigo-300">Implementation Steps</h3>
                      <ol className="space-y-2">
                        {stageContent.implementation.map((step: string, i: number) => (
                          <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                            <span className="w-5 h-5 bg-indigo-600 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {stageContent.keyPoints?.length > 0 && (
                    <div className="bg-[#13131f] rounded-xl p-5 border border-white/5">
                      <h3 className="font-semibold mb-3 text-sm text-indigo-300">Key Points</h3>
                      <ul className="space-y-1.5">
                        {stageContent.keyPoints.map((pt: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-indigo-400 mt-1 flex-shrink-0">•</span>{pt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <p>This stage is locked. Complete previous stages first.</p>
                </div>
              )}
            </>
          ) : (
            <InterviewPrepPanel projectId={projectId as string} projectName={project.name}/>
          )}
        </div>
      </main>
    </div>
  )
}
