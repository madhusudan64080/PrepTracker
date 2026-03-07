'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, LayoutDashboard, RotateCcw, BarChart2, Code2, Plus, Play } from 'lucide-react'

interface Topic {
  _id: string
  name: string
}

interface Subject {
  _id: string
  name: string
}

interface Props {
  subjects?: Subject[]
  topics?: Topic[]
  recentTopics?: Topic[]
  onCreateSubject?: () => void
  onAddProblem?: () => void
  onStartPomodoro?: () => void
}

const NAV_ACTIONS = [
  { label: 'Dashboard', icon: <LayoutDashboard size={16} />, href: '/dashboard' },
  { label: 'Revision', icon: <RotateCcw size={16} />, href: '/revision' },
  { label: 'Analytics', icon: <BarChart2 size={16} />, href: '/analytics' },
  { label: 'Coding Tracker', icon: <Code2 size={16} />, href: '/coding' },
]

export default function CommandPalette({
  subjects = [],
  topics = [],
  recentTopics = [],
  onCreateSubject,
  onAddProblem,
  onStartPomodoro
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelected(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const allItems = [
    ...NAV_ACTIONS.map(a => ({ type: 'nav', label: a.label, icon: a.icon, action: () => router.push(a.href) })),
    ...recentTopics.slice(0, 5).map(t => ({ type: 'topic', label: t.name, icon: <RotateCcw size={16} />, action: () => router.push(`/subjects`) })),
    { type: 'action', label: 'Log Coding Problem', icon: <Plus size={16} />, action: () => { onAddProblem?.(); setOpen(false) } },
    { type: 'action', label: 'Create New Subject', icon: <Plus size={16} />, action: () => { onCreateSubject?.(); setOpen(false) } },
    { type: 'action', label: 'Start Pomodoro', icon: <Play size={16} />, action: () => { onStartPomodoro?.(); setOpen(false) } },
    ...subjects.map(s => ({ type: 'subject', label: s.name, icon: <LayoutDashboard size={16} />, action: () => router.push('/subjects') })),
  ]

  const filtered = query
    ? allItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && filtered[selected]) {
      filtered[selected].action()
      setOpen(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24"
        >
          <motion.div
            initial={{ y: -40, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-xl"
            onKeyDown={handleKeyDown}
          >
            <div className="bg-[#13131f] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-white/5">
                <Search size={18} className="text-slate-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setSelected(0) }}
                  placeholder="Search commands, subjects, topics..."
                  className="flex-1 bg-transparent outline-none text-white placeholder-slate-500 text-sm"
                />
                <kbd className="text-xs text-slate-500 border border-white/10 rounded px-1">ESC</kbd>
              </div>

              <div className="max-h-[400px] overflow-y-auto py-2">
                {filtered.length === 0 ? (
                  <p className="text-center text-slate-500 text-sm py-8">No results found</p>
                ) : (
                  filtered.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => { item.action(); setOpen(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                        i === selected ? 'bg-indigo-500/20 text-white' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="text-slate-400">{item.icon}</span>
                      <span>{item.label}</span>
                      <span className="ml-auto text-xs text-slate-600 capitalize">{item.type}</span>
                    </button>
                  ))
                )}
              </div>

              <div className="border-t border-white/5 px-4 py-2 flex gap-4 text-xs text-slate-600">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
                <span>ESC close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
