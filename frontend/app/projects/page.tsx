// frontend/app/projects/page.tsx
'use client'

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { projectService } from "@/lib/apiServices"
import { useRouter } from "next/navigation"
import { Plus, X, FolderKanban } from "lucide-react"

const TECH_OPTIONS = ["React","Next.js","Node.js","Express","MongoDB","PostgreSQL","Redis","TypeScript",
  "Python","Django","FastAPI","Flutter","React Native","AWS","Docker","GraphQL","REST API","Socket.io"]

function AddProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [techStack,   setTechStack]   = useState<string[]>([])
  const [customTech,  setCustomTech]  = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  const toggleTech = (t: string) =>
    setTechStack(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])

  const addCustom = () => {
    const t = customTech.trim()
    if (t && !techStack.includes(t)) setTechStack(p => [...p, t])
    setCustomTech('')
  }

  const submit = async () => {
    if (!name.trim()) { setError('Project name is required'); return }
    setLoading(true); setError('')
    try {
      await projectService.create({
        name: name.trim(),
        description: description.trim(),
        techStack: techStack.length > 0 ? techStack : ['Not specified'],
        type: 'web',
        difficulty: 'intermediate'
      })
      onCreated()
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to create project')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0f0f1a] rounded-2xl border border-white/10 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-lg">Add Project</h2>
            <p className="text-xs text-slate-400 mt-0.5">AI will generate documentation & interview prep</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={18}/></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Project Name *</label>
            <input value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. E-Commerce Platform, Chat App, LMS"
              className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors" autoFocus/>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              placeholder="Brief description of what the project does..."
              className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none transition-colors"/>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-400 mb-2 block">Tech Stack</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {TECH_OPTIONS.map(t => (
                <button key={t} onClick={() => toggleTech(t)}
                  className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                    techStack.includes(t)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={customTech} onChange={e => setCustomTech(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCustom()}
                placeholder="Custom tech (press Enter)"
                className="flex-1 p-2 bg-black/40 border border-white/10 rounded-lg text-xs outline-none focus:border-indigo-500 transition-colors"/>
              <button onClick={addCustom} className="px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg text-xs transition-colors">Add</button>
            </div>
            {techStack.length > 0 && (
              <div className="mt-2 text-xs text-slate-400">Selected: {techStack.join(', ')}</div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
            {loading ? 'Creating...' : 'Create Project 🚀'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function ProjectCard({ project }: { project: any }) {
  const router = useRouter()
  const completed = project.stages?.filter((s: any) => s.status === 'completed').length ?? project.completedStages ?? 0
  const pct = Math.round((completed / 9) * 100)

  return (
    <motion.div whileHover={{ scale: 1.02, y: -2 }}
      className="bg-[#13131f] p-5 rounded-xl border border-white/5 hover:border-indigo-500/30 cursor-pointer transition-all"
      onClick={() => router.push(`/projects/${project._id}`)}>
      <div className="text-3xl mb-3">{project.emoji ?? '🚀'}</div>
      <h3 className="font-semibold mb-1">{project.name}</h3>
      {project.description && <p className="text-xs text-slate-400 mb-3 line-clamp-2">{project.description}</p>}

      <div className="flex flex-wrap gap-1 mb-4">
        {(project.techStack ?? []).slice(0, 4).map((t: string) => (
          <span key={t} className="text-xs px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded">{t}</span>
        ))}
        {(project.techStack ?? []).length > 4 && (
          <span className="text-xs px-2 py-0.5 bg-white/5 text-slate-400 rounded">+{project.techStack.length - 4}</span>
        )}
      </div>

      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full ${i < completed ? 'bg-green-500' : i === completed ? 'bg-indigo-500' : 'bg-white/10'}`}/>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{completed}/9 stages</span>
        <span className="text-indigo-400">{pct}% complete</span>
      </div>
    </motion.div>
  )
}

export default function ProjectsPage() {
  const [projects,   setProjects]   = useState<any[]>([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)

  const load = () => {
    setLoading(true)
    projectService.getAll()
      .then(res => setProjects(res.data?.data || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><FolderKanban size={20} className="text-indigo-400"/> Projects</h1>
          <p className="text-slate-400 text-sm mt-0.5">AI-powered project documentation & interview prep</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors">
          <Plus size={14}/> Add Project
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <div key={i} className="h-48 bg-white/5 rounded-xl animate-pulse"/>)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <FolderKanban size={48} className="text-slate-600 mx-auto mb-3"/>
          <h3 className="font-semibold mb-1">No projects yet</h3>
          <p className="text-slate-400 text-sm mb-5">Add a project to get AI-generated documentation and interview prep</p>
          <button onClick={() => setShowModal(true)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors">
            + Add First Project
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map(p => <ProjectCard key={p._id} project={p}/>)}
        </div>
      )}

      <AnimatePresence>
        {showModal && <AddProjectModal onClose={() => setShowModal(false)} onCreated={load}/>}
      </AnimatePresence>
    </div>
  )
}
