// backend/src/controllers/interview.controller.ts

import { Request, Response, NextFunction } from "express"
import TopicContent from "../models/TopicContent.model"
import InterviewSession from "../models/InterviewSession.model"
import ActivityLog from "../models/ActivityLog.model"
import aiService from "../services/ai.service"

export async function getInterviewQuestions(req: Request, res: Response, next: NextFunction) {

  try {

    const { topicId } = req.query

    if (topicId) {

      const content = await TopicContent.findOne({ topicId })

      const questions = content?.interviewQuestions.map((q: any) => ({
        id: q.id,
        question: q.question,
        difficulty: q.difficulty,
        type: q.type
      }))

      return res.json({ success: true, data: questions })
    }

    res.json({ success: true, data: [] })

  } catch (err) {
    next(err)
  }
}

export async function generateCompanyInterviewQuestions(req: Request, res: Response, next: NextFunction) {

  try {

    const { company, role, topics, count } = req.body

    const topicList: string[] = Array.isArray(topics)
      ? topics
      : role
        ? [role]
        : []

    const questions = await aiService.generateCompanyInterviewQuestions(
      company || "General",
      topicList
    )

    res.json({
      success: true,
      data: questions
    })

  } catch (err) {
    next(err)
  }
}

export async function revealAnswer(req: Request, res: Response, next: NextFunction) {

  try {

    const { questionId } = req.params

    const content = await TopicContent.findOne({
      "interviewQuestions.id": questionId
    })

    const q = content?.interviewQuestions.find((x: any) => x.id === questionId)

    await ActivityLog.create({
      userId: req.user!.userId,
      type: "interview_done",
      entityId: questionId
    })

    res.json({
      success: true,
      data: {
        idealAnswer: q?.idealAnswer,
        keyPointsToMention: q?.keyPointsToMention
      }
    })

  } catch (err) {
    next(err)
  }
}

export async function submitInterviewSession(req: Request, res: Response, next: NextFunction) {

  try {

    const { questions, totalTime } = req.body

    let total = 0

    questions.forEach((q: any) => {
      if (q.selfRating === "nailed") total += 100
      else if (q.selfRating === "partial") total += 60
    })

    const score = Math.round(total / questions.length)

    const session = await InterviewSession.create({
      userId: req.user!.userId,
      questions,
      totalTime,
      overallRating: score
    })

    await ActivityLog.create({
      userId: req.user!.userId,
      type: "interview_done",
      entityId: session._id
    })

    res.json({ success: true, data: session })

  } catch (err) {
    next(err)
  }
}

export async function getInterviewHistory(req: Request, res: Response, next: NextFunction) {

  try {

    const sessions = await InterviewSession.find({
      userId: req.user!.userId
    })
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({ success: true, data: sessions })

  } catch (err) {
    next(err)
  }
}