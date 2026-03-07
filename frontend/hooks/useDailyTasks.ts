// frontend/hooks/useDailyTasks.ts
//
// Fetches and manages Today's Goals task data:
//   - study   (scheduled topics)
//   - revision (spaced repetition)
//   - pending  (carried-forward incomplete tasks)

import { useCallback, useEffect, useState } from "react"
import { dailyTaskService } from "@/lib/apiServices"

export interface TaskTopic {
  topicId:       string
  topicName:     string
  status:        string
  revisionCycle?: string
}

export interface SubjectTaskGroup {
  subjectId:    string
  subjectName:  string
  subjectColor: string
  subjectIcon:  string
  topics:       TaskTopic[]
}

export interface TaskProgress {
  topicsScheduled:    number
  topicsCompleted:    number
  revisionsScheduled: number
  revisionsCompleted: number
  pendingCount:       number
}

export interface TodayTasks {
  study:    SubjectTaskGroup[]
  revision: SubjectTaskGroup[]
  pending:  SubjectTaskGroup[]
  progress: TaskProgress
}

export function useDailyTasks() {
  const [data,      setData]      = useState<TodayTasks | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await dailyTaskService.getToday()
      const payload = res.data?.data ?? res.data
      setData(payload)
    } catch (err) {
      setError("Failed to load today's tasks")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const completeTask = useCallback(
    async (
      topicId:      string,
      taskType:     "study" | "revision" | "pending",
      revisionCycle?: string
    ) => {
      try {
        const res = await dailyTaskService.complete({
          topicId,
          taskType,
          revisionCycle: revisionCycle as any
        })
        const payload = res.data?.data ?? res.data
        setData(payload)
      } catch (err) {
        console.error("Failed to complete task", err)
      }
    },
    []
  )

  const progress = data?.progress ?? {
    topicsScheduled:    0,
    topicsCompleted:    0,
    revisionsScheduled: 0,
    revisionsCompleted: 0,
    pendingCount:       0
  }

  return {
    data,
    isLoading,
    error,
    progress,
    refetch:      fetchTasks,
    completeTask
  }
}