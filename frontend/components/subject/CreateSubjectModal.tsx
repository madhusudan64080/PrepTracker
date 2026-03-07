// frontend/components/subject/CreateSubjectModal.tsx
'use client'

import { useState } from "react"
import { motion } from "framer-motion"
import { X, Plus, Trash2 } from "lucide-react"
import { subjectStore } from "@/store/subjectStore"
import { topicService } from "@/lib/apiServices"

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#f97316","#22c55e","#14b8a6","#0ea5e9","#eab308"]
const ICONS  = ["📘","💻","📊","⚙️","📡","🧠","📱","🔬","🧮","📚","🎯","🧪","📈","🛰","🔐","🤖"]

const TOPIC_PRESETS: Record<string, string[]> = {
  "Data Structures":   ["Arrays","Linked Lists","Stacks","Queues","Trees","Graphs","Hash Tables","Heaps"],
  "Algorithms":        ["Sorting","Searching","Dynamic Programming","Greedy","Backtracking","Divide & Conquer"],
  "Operating Systems": ["Processes","Threads","Memory Management","File Systems","Scheduling","Deadlocks"],
  "DBMS":              ["SQL Basics","Normalization","Transactions","Indexing","ER Models","NoSQL"],
  "System Design":     ["Load Balancing","Caching","Database Sharding","Microservices","CAP Theorem","API Design"],
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function CreateSubjectModal({ isOpen, onClose }: Props) {
  const { addSubject } = subjectStore()

  const [step,        setStep]        = useState<1 | 2>(1)
  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')
  const [color,       setColor]       = useState(COLORS[0])
  const [icon,        setIcon]        = useState(ICONS[0])
  const [topics,      setTopics]      = useState<string[]>([''])
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')

  const addTopic    = () => setTopics(t => [...t, ''])
  const removeTopic = (i: number) => setTopics(t => t.filter((_, idx) => idx !== i))
  const updateTopic = (i: number, v: string) => setTopics(t => t.map((x, idx) => idx === i ? v : x))

  const applyPreset = (preset: string[]) => setTopics(preset.map(p => p))

  const handleNext = () => {
    if (!name.trim() || name.length < 2) { setError('Name must be at least 2 characters'); return }
    setError('')
    setStep(2)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const created = await addSubject({ name: name.trim(), description, color, icon })
      if (created?._id) {
        const validTopics = topics.map(t => t.trim()).filter(Boolean)
        if (validTopics.length > 0) {
          await topicService.createBulk(created._id, validTopics.map(name => ({ name })))
        }
      }
      // Reset and close
      setName(''); setDescription(''); setColor(COLORS[0]); setIcon(ICONS[0])
      setTopics(['']); setStep(1)
      onClose()
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Failed to create subject')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      onClick={onClose}>
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        className="bg-[#0f0f1a] w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-white/10 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold">
              {step === 1 ? 'New Subject' : `Topics for "${name}"`}
            </h2>
            <div className="flex gap-1 mt-1.5">
              {[1,2].map(n => (
                <div key={n} className={`h-1 w-8 rounded-full transition-colors ${step >= n ? 'bg-indigo-500' : 'bg-white/10'}`}/>
              ))}
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"><X size={18}/></button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {step === 1 ? (
            <>
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Subject Name *</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="e.g. Data Structures, DBMS, System Design"
                  className="w-full p-3 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-indigo-500 transition-colors text-sm"
                  autoFocus/>
                {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Description (optional)</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="What will you study in this subject?"
                  rows={2}
                  className="w-full p-3 bg-black/40 border border-white/10 rounded-lg outline-none focus:border-indigo-500 resize-none text-sm transition-colors"/>
              </div>

              {/* Color */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0f0f1a] scale-110' : 'hover:scale-105'}`}
                      style={{ background: c }}/>
                  ))}
                </div>
              </div>

              {/* Icon */}
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Icon</label>
                <div className="grid grid-cols-8 gap-1.5">
                  {ICONS.map(e => (
                    <button key={e} type="button" onClick={() => setIcon(e)}
                      className={`text-xl p-1.5 rounded-lg transition-all ${icon === e ? 'bg-white/15 scale-110' : 'hover:bg-white/5'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: color + '33', border: `2px solid ${color}44` }}>
                  {icon}
                </div>
                <div>
                  <div className="font-medium text-sm">{name || 'Subject Preview'}</div>
                  <div className="text-xs text-slate-500">0 topics</div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Quick presets */}
              {TOPIC_PRESETS[name] && (
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-2 block">Quick Add Preset Topics</label>
                  <button onClick={() => applyPreset(TOPIC_PRESETS[name])}
                    className="px-3 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-lg text-xs text-indigo-400 hover:bg-indigo-500/30 transition-colors">
                    Load {name} syllabus ({TOPIC_PRESETS[name].length} topics)
                  </button>
                </div>
              )}

              {/* Topics list */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400">Topics to Study</label>
                  <span className="text-xs text-slate-500">{topics.filter(t => t.trim()).length} topics</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {topics.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-xs flex-shrink-0 text-slate-500">
                        {i + 1}
                      </div>
                      <input value={t} onChange={e => updateTopic(i, e.target.value)}
                        placeholder={`Topic ${i + 1} (e.g. Arrays, Sorting, SQL)`}
                        className="flex-1 p-2 bg-black/40 border border-white/10 rounded-lg text-sm outline-none focus:border-indigo-500 transition-colors"/>
                      {topics.length > 1 && (
                        <button onClick={() => removeTopic(i)} className="text-slate-600 hover:text-red-400 flex-shrink-0 transition-colors">
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={addTopic}
                  className="mt-2 flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors px-2 py-1.5">
                  <Plus size={13}/> Add another topic
                </button>
              </div>

              <p className="text-xs text-slate-500 bg-white/5 rounded-lg p-3">
                💡 You can always add more topics later from the subject page.
              </p>

              {error && <p className="text-xs text-red-400">{error}</p>}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/5 flex gap-3 flex-shrink-0">
          {step === 2 && (
            <button onClick={() => setStep(1)}
              className="px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors">
              ← Back
            </button>
          )}
          {step === 1 ? (
            <button onClick={handleNext}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors">
              Next: Add Topics →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors">
              {loading ? 'Creating...' : `Create Subject${topics.filter(t=>t.trim()).length > 0 ? ` + ${topics.filter(t=>t.trim()).length} Topics` : ''} 🚀`}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
