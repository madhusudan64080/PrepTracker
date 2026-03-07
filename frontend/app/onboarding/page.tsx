'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { authService, subjectService, topicService } from '@/lib/apiServices'
import { authStore } from '@/store/authStore'
import { useRouter } from 'next/navigation'

const SUBJECT_LIST = [
  'Data Structures','Algorithms','Operating Systems','DBMS','Computer Networks',
  'System Design','OOP','SOLID Principles','Web Development','React/Next.js',
  'Node.js','SQL','NoSQL','ML Basics','Aptitude','Verbal Reasoning',
  'Logical Reasoning','HR Questions','Core Java','Python','C++'
]

export default function OnboardingPage() {
  const router = useRouter()
  const { updateUser } = authStore()

  const [step, setStep] = useState(1)
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([])
  const [topicsPerDay, setTopicsPerDay] = useState(3)
  const [problems, setProblems] = useState(5)
  const [studyTime, setStudyTime] = useState(90)
  const [revision, setRevision] = useState(2)
  const [reminderTime, setReminderTime] = useState('21:00')
  const [subjectName, setSubjectName] = useState('')
  const [topics, setTopics] = useState('Arrays\nLinked Lists\nStacks\nQueues')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleSubject = (s: string) => {
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    )
  }

  const finish = async () => {
    setLoading(true)
    setError(null)
    try {
      // Complete onboarding
      await authService.completeOnboarding({
        subjects: selectedSubjects,
        dailyGoalTargets: {
          topicsToLearn: topicsPerDay,
          problemsToSolve: problems,
          revisionTopics: revision,
          studyMinutes: studyTime
        },
        reminderTime
      })

      updateUser({ onboardingCompleted: true })

      // Create first subject if provided
      if (subjectName.trim()) {
        const subRes = await subjectService.create({ name: subjectName.trim(), color: '#6366f1' })
        const subjectId = subRes.data?.data?._id || subRes.data?._id

        if (subjectId) {
          const topicList = topics
            .split('\n')
            .map(t => t.trim())
            .filter(Boolean)
            .map(name => ({ name }))

          if (topicList.length > 0) {
            await topicService.createBulk(subjectId, topicList)
          }
        }
      }

      router.push('/dashboard')
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center px-4">
      <div className="w-full max-w-3xl">

        {/* Progress Dots */}
        <div className="flex justify-center mb-10 gap-2">
          {[1,2,3,4].map(n => (
            <div key={n}
              className={`w-3 h-3 rounded-full transition-colors ${step >= n ? 'bg-indigo-500' : 'bg-neutral-700'}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">

          {step === 1 && (
            <motion.div key="1" initial={{x:100,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-100,opacity:0}}>
              <h2 className="text-2xl font-bold mb-2">What are you preparing for?</h2>
              <p className="text-gray-400 mb-6 text-sm">Select all subjects you want to master</p>
              <div className="flex flex-wrap gap-3">
                {SUBJECT_LIST.map(s => (
                  <button key={s} onClick={() => toggleSubject(s)}
                    className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                      selectedSubjects.includes(s)
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-neutral-700 hover:border-indigo-500'
                    }`}
                  >{s}</button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="2" initial={{x:100,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-100,opacity:0}}>
              <h2 className="text-2xl font-bold mb-2">Set your daily targets</h2>
              <p className="text-gray-400 mb-6 text-sm">These help track your daily progress</p>
              <div className="space-y-6 bg-neutral-900 p-6 rounded-xl">
                {[
                  { label: 'Topics per day', value: topicsPerDay, setter: setTopicsPerDay, min: 1, max: 10 },
                  { label: 'Problems per day', value: problems, setter: setProblems, min: 0, max: 20 },
                  { label: `Study time: ${studyTime} min`, value: studyTime, setter: setStudyTime, min: 30, max: 240 },
                  { label: 'Revisions per day', value: revision, setter: setRevision, min: 0, max: 10 },
                ].map(({ label, value, setter, min, max }) => (
                  <div key={label}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{label}</span>
                      <span className="text-indigo-400 font-semibold">{value}</span>
                    </div>
                    <input type="range" min={min} max={max} value={value}
                      onChange={e => setter(Number(e.target.value))}
                      className="w-full accent-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="3" initial={{x:100,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-100,opacity:0}}>
              <h2 className="text-2xl font-bold mb-2">Set a daily reminder</h2>
              <p className="text-gray-400 mb-6 text-sm">When do you usually study in the evening?</p>
              <div className="flex gap-3 flex-wrap">
                {['18:00','19:00','20:00','21:00','22:00','23:00'].map(t => (
                  <button key={t} onClick={() => setReminderTime(t)}
                    className={`px-5 py-3 rounded-lg transition-colors ${
                      reminderTime === t ? 'bg-indigo-600' : 'bg-neutral-800 hover:bg-neutral-700'
                    }`}
                  >
                    {t.replace(':00', ' ').replace('18', '6 PM').replace('19', '7 PM')
                      .replace('20', '8 PM').replace('21', '9 PM').replace('22', '10 PM').replace('23', '11 PM')}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="4" initial={{x:100,opacity:0}} animate={{x:0,opacity:1}} exit={{x:-100,opacity:0}}>
              <h2 className="text-2xl font-bold mb-2">Create your first subject</h2>
              <p className="text-gray-400 mb-6 text-sm">You can add more subjects later from the dashboard</p>
              <input
                placeholder="Subject name (e.g. Data Structures)"
                value={subjectName}
                onChange={e => setSubjectName(e.target.value)}
                className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg outline-none focus:border-indigo-500"
              />
              {subjectName && (
                <>
                  <p className="text-sm text-gray-400 mt-4 mb-2">Topics (one per line):</p>
                  <textarea rows={6} value={topics}
                    onChange={e => setTopics(e.target.value)}
                    className="w-full p-3 bg-neutral-900 border border-neutral-700 rounded-lg outline-none focus:border-indigo-500 resize-none font-mono text-sm"
                  />
                </>
              )}
              {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
              <button onClick={finish} disabled={loading}
                className="mt-6 bg-indigo-600 hover:bg-indigo-500 px-8 py-3 rounded-lg w-full disabled:opacity-60 font-semibold"
              >
                {loading ? 'Setting up your workspace...' : 'Finish Setup & Go to Dashboard 🚀'}
              </button>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <button disabled={step === 1} onClick={() => setStep(step - 1)}
            className="px-4 py-2 text-gray-400 disabled:opacity-30 hover:text-white"
          >← Back</button>
          {step < 4 && (
            <button onClick={() => setStep(step + 1)}
              className="bg-indigo-600 hover:bg-indigo-500 px-6 py-2 rounded-lg"
            >Next →</button>
          )}
        </div>

      </div>
    </div>
  )
}
