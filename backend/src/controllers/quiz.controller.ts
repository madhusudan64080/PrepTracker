// backend/src/controllers/quiz.controller.ts

import { Request, Response, NextFunction } from "express"
import Topic from "../models/Topic.model"
import TopicContent from "../models/TopicContent.model"
import TopicProgress from "../models/TopicProgress.model"
import QuizAttempt from "../models/QuizAttempt.model"
import DailyGoal from "../models/DailyGoal.model"
import ActivityLog from "../models/ActivityLog.model"

import revisionService from "../services/revision.service"
import aiService from "../services/ai.service"
import streakService from "../services/streak.service"

/* -----------------------
   Fisher-Yates Shuffle
----------------------- */

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array]

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return arr
}

/* -----------------------
   Get Quiz for Topic
----------------------- */

export async function getTopicQuiz(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { topicId } = req.params

    const topic = await Topic.findById(topicId)

    if (!topic || topic.userId.toString() !== req.user!.userId) {
      return res.status(403).json({ success: false, error: "Forbidden" })
    }

    const content = await TopicContent.findOne({ topicId })

    if (!content) {
      return res.status(404).json({
        success: false,
        error: "Content not generated. Please load the topic first."
      })
    }

    const questions = shuffleArray(content.quizQuestions).map((q: any) => {
      const options = shuffleArray(q.options)

      return {
        id: q.id,
        question: q.question,
        options,
        difficulty: q.difficulty
      }
    })

    res.json({ success: true, data: questions })
  } catch (err) {
    next(err)
  }
}

/* -----------------------
   Submit Quiz Attempt
----------------------- */

export async function submitQuizAttempt(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { topicId, answers, timeSpent, isRevisionQuiz } = req.body

    const content = await TopicContent.findOne({ topicId })

    if (!content) {
      return res.status(404).json({ success: false, error: "Content missing" })
    }

    const questionMap: Record<string, any> = {}

    content.quizQuestions.forEach((q: any) => {
      questionMap[q.id] = q
    })

    let correct = 0
    const breakdown = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    }

    const wrongAnswers: any[] = []

    const attemptQuestions = answers.map((a: any) => {
      const q = questionMap[a.questionId]

      const isCorrect = a.selectedAnswer === q.correctAnswer

      breakdown[q.difficulty].total++

      if (isCorrect) {
        correct++
        breakdown[q.difficulty].correct++
      } else {
        wrongAnswers.push({
          question: q.question,
          yourAnswer: a.selectedAnswer,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation
        })
      }

      return {
        questionId: q.id,
        question: q.question,
        selectedAnswer: a.selectedAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect,
        difficulty: q.difficulty
      }
    })

    const score = correct
    const percentage = Math.round((correct / content.quizQuestions.length) * 100)

    const attempt = await QuizAttempt.create({
      userId: req.user!.userId,
      topicId,
      questions: attemptQuestions,
      score,
      percentage,
      timeSpent,
      isRevisionQuiz,
      breakdown
    })

    const progress = await TopicProgress.findOneAndUpdate(
      { userId: req.user!.userId, topicId },
      {
        $max: { quizScore: percentage }
      },
      { upsert: true, new: true }
    )

    await Topic.findByIdAndUpdate(topicId, {
      masteryScore: percentage
    })

    let nextRevisionDate = null

    if (isRevisionQuiz) {
      const result = await revisionService.completeRevision(
        req.user!.userId,
        topicId,
        percentage
      )
      nextRevisionDate = result.nextReviewDate
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await DailyGoal.findOneAndUpdate(
      { userId: req.user!.userId, date: today },
      { $inc: { "achieved.studyMinutes": timeSpent || 0 } }
    )

    await streakService.updateStreak(req.user!.userId)

    await ActivityLog.create({
      userId: req.user!.userId,
      type: "quiz_completed",
      entityId: topicId
    })

    res.json({
      success: true,
      data: {
        score,
        percentage,
        breakdown,
        wrongAnswers,
        nextRevisionDate
      }
    })
  } catch (err) {
    next(err)
  }
}

/* -----------------------
   Quiz History
----------------------- */

export async function getQuizHistory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const attempts = await QuizAttempt.find({
      userId: req.user!.userId,
      topicId: req.params.topicId
    })
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({ success: true, data: attempts })
  } catch (err) {
    next(err)
  }
}

/* -----------------------
   Weekly Revision Quiz
----------------------- */

export async function generateWeeklyRevisionQuiz(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const topics = await Topic.find({
      userId: req.user!.userId,
      lastStudiedAt: { $gte: new Date(Date.now() - 7 * 86400000) }
    })

    const topicNames = topics.map((t) => t.name)

    const weakTopics = topics
      .filter((t) => t.masteryScore < 60)
      .map((t) => t.name)

    const quiz = await aiService.generateWeeklyRevisionQuiz(
      topicNames,
      weakTopics
    )

    res.json({ success: true, data: quiz })
  } catch (err) {
    next(err)
  }
}