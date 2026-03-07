// backend/src/controllers/topic.controller.ts

import { Request, Response, NextFunction } from "express"
import DailyTask from "../models/DailyTask.model" 
import Topic from "../models/Topic.model"
import TopicProgress from "../models/TopicProgress.model"
import TopicContent from "../models/TopicContent.model"
import QuizAttempt from "../models/QuizAttempt.model"
import RevisionSchedule from "../models/RevisionSchedule.model"
import UserNotes from "../models/UserNotes.model"
import Subject from "../models/Subject.model"
import DailyGoal from "../models/DailyGoal.model"
import ActivityLog from "../models/ActivityLog.model"

import revisionService from "../services/revision.service"
import dailyTaskService from "../services/dailyTask.service"
import streakService from "../services/streak.service"
import contentService from "../services/content.service"

import { broadcastToUser } from "../socket/socket.server"

export async function getTopicContent(req: Request, res: Response, next: NextFunction) {
  try {

    const topicId = req.params.id
    const { learningMethod } = req.body

    if (!learningMethod) {
      return res.status(400).json({
        success: false,
        error: "learningMethod is required"
      })
    }

    const topic = await Topic.findOne({
      _id: topicId,
      userId: req.user!.userId
    }).lean()

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: "Topic not found"
      })
    }
    const subject = await Subject.findById(topic.subjectId).lean()

if (!subject) {
  return res.status(404).json({
    success: false,
    error: "Subject not found"
  })
}
    const content = await contentService.getTopicContentByMethod(
      topicId,
      subject.name,
      topic.name,
      learningMethod
    )

    res.json({
      success: true,
      data: content
    })

  } catch (err) {
    next(err)
  }
}

export async function getTopicsBySubject(req: Request, res: Response, next: NextFunction) {
  try {

    const { subjectId } = req.query

    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user!.userId
    })

    if (!subject) {
      return res.status(403).json({ success: false, error: "Forbidden" })
    }

    const topics = await Topic.find({
      subjectId,
      userId: req.user!.userId
    })
      .sort({ order: 1 })
      .lean()

    const progress = await TopicProgress.find({
      userId: req.user!.userId
    }).lean()

    const progressMap = new Map(
      progress.map(p => [String(p.topicId), p])
    )

    const topicsWithProgress = topics.map(topic => ({
      ...topic,
      progress: progressMap.get(String(topic._id)) || null
    }))

    res.json({
      success: true,
      data: topicsWithProgress
    })

  } catch (err) {
    next(err)
  }
}

export async function getTopicById(req: Request, res: Response, next: NextFunction) {
  try {

    const topic = await Topic.findOne({
      _id: req.params.id,
      userId: req.user!.userId
    }).lean()

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: "Topic not found"
      })
    }

    const progress = await TopicProgress.findOne({
      topicId: topic._id,
      userId: req.user!.userId
    }).lean()

    res.json({
      success: true,
      data: {
        ...topic,
        progress
      }
    })

  } catch (err) {
    next(err)
  }
}
export async function createTopic(req: Request, res: Response, next: NextFunction) {
  
  try {
    const { subjectId } = req.body
    const subject = await Subject.findOne({
  _id: subjectId,
  userId: req.user!.userId
})
if (!subject) {
  return res.status(403).json({ success: false, error: "Forbidden" })
}
    const max = await Topic.findOne({ subjectId }).sort({ order: -1 })

    const order = max ? max.order + 1 : 1

    const topic = await Topic.create({
      ...req.body,
      order,
      userId: req.user!.userId
    })

    await Subject.findByIdAndUpdate(subjectId, {
      $inc: { totalTopics: 1 }
    })

    res.status(201).json({ success: true, data: topic })
  } catch (err) {
    next(err)
  }
}

export async function bulkCreateTopics(req: Request, res: Response, next: NextFunction) {
  try {
    const { subjectId, topics } = req.body

    const subject = await Subject.findOne({
      _id: subjectId,
      userId: req.user!.userId
    })

    if (!subject) {
      return res.status(403).json({ success: false, error: "Forbidden" })
    }

    const max = await Topic.findOne({ subjectId }).sort({ order: -1 })

    let startOrder = max ? max.order + 1 : 1

    const docs = topics.map((t: any, index: number) => ({
      name: t.name,
      difficulty: t.difficulty || "medium",
      subjectId,
      userId: req.user!.userId,
      order: startOrder + index
    }))

    const created = await Topic.insertMany(docs)

    await Subject.findByIdAndUpdate(subjectId, {
      $inc: { totalTopics: created.length }
    })

    res.json({ success: true, data: created })
  } catch (err) {
    next(err)
  }
}

export async function updateTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const topic = await Topic.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      req.body,
      { new: true }
    ).lean()

    if (!topic) {
      return res.status(404).json({ success: false, error: "Topic not found" })
    }

    res.json({ success: true, data: topic })
  } catch (err) {
    next(err)
  }
}

export async function reorderTopics(req: Request, res: Response, next: NextFunction) {
  try {
    const updates = req.body

    const bulk = updates.map((u: any) => ({
      updateOne: {
        filter: { _id: u.id, userId: req.user!.userId },
        update: { order: u.order }
      }
    }))

    await Topic.bulkWrite(bulk)

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function deleteTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const topic = await Topic.findOne({
      _id: req.params.id,
      userId: req.user!.userId
    }).lean()

    if (!topic) {
      return res.status(404).json({ success: false, error: "Topic not found" })
    }

    await TopicContent.deleteMany({ topicId: topic._id })
    await TopicProgress.deleteMany({ topicId: topic._id })
    await QuizAttempt.deleteMany({ topicId: topic._id })
    await RevisionSchedule.deleteMany({ topicId: topic._id })
    await UserNotes.deleteMany({ topicId: topic._id })
    await DailyTask.deleteMany({ topicId: topic._id })
    await Topic.deleteOne({ _id: topic._id })

    await Subject.findByIdAndUpdate(topic.subjectId, {
      $inc: {
        totalTopics: -1,
        completedTopics: topic.status === "completed" ? -1 : 0
      }
    })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function updateTopicProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const { section, completed, timeSpent } = req.body
    const topicId = req.params.id

    let progress = await TopicProgress.findOne({
      topicId,
      userId: req.user!.userId
    })

    if (!progress) {
      progress = await TopicProgress.create({
        topicId,
        userId: req.user!.userId
      })
    }

    progress.sectionsCompleted[section] = completed

    const completedSections = Object.values(progress.sectionsCompleted).filter(Boolean).length

    const totalSections = Object.keys(progress.sectionsCompleted).length || 6
progress.overallProgress = Math.round((completedSections * 100) / totalSections)

    if (timeSpent) {
      progress.timeSpentMinutes += timeSpent
    }

    await progress.save()

    const topic = await Topic.findOne({ _id: topicId, userId: req.user!.userId })

    if (topic && topic.status === "not_started" && completedSections > 0) {
      topic.status = "in_progress"
      await topic.save()
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await DailyGoal.findOneAndUpdate(
      { userId: req.user!.userId, date: today },
      { $inc: { "achieved.studyMinutes": timeSpent || 0 } }
    )

    await streakService.updateStreak(req.user!.userId)

    res.json({ success: true, data: progress })
  } catch (err) {
    next(err)
  }
}

export async function completeTopic(req: Request, res: Response, next: NextFunction) {
  try {
    const { quizScore, learningMethod, timeSpent } = req.body
    const topicId = req.params.id

    const topic = await Topic.findOne({ _id: topicId, userId: req.user!.userId })

    if (!topic) {
      return res.status(404).json({ success: false, error: "Topic not found" })
    }

    topic.status = "completed"
    topic.masteryScore = quizScore
    topic.lastStudiedAt = new Date()
    topic.revisionCount += 1

    await topic.save()

    const progress = await TopicProgress.findOneAndUpdate(
      { topicId, userId: req.user!.userId },
      {
        overallProgress: 100,
        completedAt: new Date(),
        learningMethod
      },
      { new: true, upsert: true }
    )

    await Subject.findByIdAndUpdate(topic.subjectId, {
      $inc: { completedTopics: 1 }
    })

    const revisionSchedule = await revisionService.scheduleFirstRevision(
      req.user!.userId,
      topicId
    )

    // Schedule the three spaced-repetition revision tasks
    // (same-day, 2-day, weekly) in DailyTask collection
    await dailyTaskService.scheduleRevisions(
      req.user!.userId,
      topicId,
      String(topic.subjectId)
    )

    // Mark study task as completed in DailyTask
    await dailyTaskService.completeTask(
      req.user!.userId,
      topicId,
      "study"
    )

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await DailyGoal.findOneAndUpdate(
      { userId: req.user!.userId, date: today },
      { $inc: { "achieved.topicsLearned": 1 } }
    )

    await streakService.updateStreak(req.user!.userId)

    await ActivityLog.create({
      userId: req.user!.userId,
      type: "topic_completed",
      entityId: topicId,
      entityName: topic.name
    })

    // Broadcast to all other devices of this user in real-time
    broadcastToUser(req.user!.userId, "topic:complete", {
      topicId,
      topicName: topic.name,
      subjectId: String(topic.subjectId),
      nextRevisionDate: revisionSchedule.nextReviewDate
    })

    res.json({
      success: true,
      data: {
        topic,
        progress,
        revisionSchedule,
        nextRevisionDate: revisionSchedule.nextReviewDate
      }
    })
  } catch (err) {
    next(err)
  }
}