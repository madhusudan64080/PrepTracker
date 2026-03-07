// backend/src/utils/spacedRepetition.ts

import { IRevisionSchedule } from "../models/RevisionSchedule.model"

export interface SM2Result {
  nextIntervalDays: number
  newEFactor: number
  newRepetition: number
  nextReviewDate: Date
}

export function calculateNextReview(
  eFactor: number,
  repetition: number,
  quality: number
): SM2Result {

  let newEFactor = eFactor
  let newRepetition = repetition
  let nextIntervalDays = 1

  if (quality <= 1) {
    newRepetition = 0
    nextIntervalDays = 1
  }

  else if (quality === 2) {
    newRepetition = 0

    newEFactor =
      eFactor +
      (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    if (newEFactor < 1.3) newEFactor = 1.3

    nextIntervalDays = 1
  }

  else {

    newEFactor =
      eFactor +
      (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

    if (newEFactor < 1.3) newEFactor = 1.3

    newRepetition = repetition + 1

    if (newRepetition === 1) nextIntervalDays = 1
    else if (newRepetition === 2) nextIntervalDays = 3
    else if (newRepetition === 3) nextIntervalDays = 7
    else nextIntervalDays = Math.round(7 * newEFactor)
  }

  if (nextIntervalDays > 30) nextIntervalDays = 30

  const nextReviewDate = new Date()
  nextReviewDate.setDate(nextReviewDate.getDate() + nextIntervalDays)

  return {
    nextIntervalDays,
    newEFactor,
    newRepetition,
    nextReviewDate
  }
}

export function quizScoreToQuality(percentage: number): number {

  if (percentage >= 90) return 5
  if (percentage >= 75) return 4
  if (percentage >= 60) return 3
  if (percentage >= 45) return 2
  return 1
}

export function selfRatingToQuality(
  rating: "nailed" | "partial" | "missed"
): number {

  if (rating === "nailed") return 5
  if (rating === "partial") return 3
  return 1
}

export function getInitialSchedule(
  topicId: string,
  userId: string
): Partial<IRevisionSchedule> {

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  return {
    topicId,
    userId: userId as any,
    efFactor: 2.5,
    repetition: 0,
    nextReviewDate: tomorrow,
    revisionDates: [
      {
        scheduledDate: tomorrow,
        intervalDays: 1,
        status: "pending"
      }
    ]
  }
}