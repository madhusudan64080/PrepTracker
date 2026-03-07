// frontend/app/subjects/page.tsx

'use client'

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

import { subjectStore } from "@/store/subjectStore"
import SubjectCard from "@/components/subject/SubjectCard"
import CreateSubjectModal from "@/components/subject/CreateSubjectModal"
import SkeletonLoader from "@/components/shared/SkeletonLoader"
import EmptyState from "@/components/shared/EmptyState"

export default function SubjectsPage() {
  const { subjects, fetchSubjects, isLoading } = subjectStore()
  const [showModal, setShowModal] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetchSubjects()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonLoader key={i} variant="card" />
        ))}
      </div>
    )
  }

  if (!subjects.length) {
    return (
      <div className="p-6">
        <EmptyState
          icon="📚"
          title="No subjects yet"
          description="Create your first subject to start learning"
          actionLabel="Create Subject"
          onAction={() => setShowModal(true)}
        />

        <CreateSubjectModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Subjects</h1>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-500 rounded text-sm"
        >
          + Add Subject
        </button>
      </div>

      <motion.div
        className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }}
      >
        {subjects.map((subject) => (
          <SubjectCard
            key={subject._id}
            subject={subject}
            onClick={() =>
              router.push(`/subjects/${subject._id}/topics`)
            }
          />
        ))}
      </motion.div>

      <CreateSubjectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  )
}