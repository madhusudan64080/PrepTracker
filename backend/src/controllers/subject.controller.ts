// backend/src/controllers/subject.controller.ts

import { Request, Response, NextFunction } from "express"
import Subject from "../models/Subject.model"
import Topic from "../models/Topic.model"
import TopicContent from "../models/TopicContent.model"
import TopicProgress from "../models/TopicProgress.model"
import QuizAttempt from "../models/QuizAttempt.model"
import RevisionSchedule from "../models/RevisionSchedule.model"
import UserNotes from "../models/UserNotes.model"
import DailyTask from "../models/DailyTask.model" 
export async function getAllSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const subjects = await Subject.find({
      userId: req.user!.userId,
      isArchived: false
    }).sort({ order: 1 })

    const result = subjects.map((s: any) => {
      const obj = s.toObject()
      obj.completionPercentage =
        obj.totalTopics === 0 ? 0 : Math.round((obj.completedTopics / obj.totalTopics) * 100)
      return obj
    })

    res.json({ success: true, data: result })
  } catch (err) {
    next(err)
  }
}

export async function createSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const max = await Subject.findOne({ userId: req.user!.userId }).sort({ order: -1 })

    const order = max ? max.order + 1 : 1

    const subject = await Subject.create({
      ...req.body,
      userId: req.user!.userId,
      order
    })

    res.status(201).json({ success: true, data: subject })
  } catch (err) {
    next(err)
  }
}

export async function getSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user!.userId
    })

    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" })
    }

    const topicCount = await Topic.countDocuments({ subjectId: subject._id })

    const result = subject.toObject()

    res.json({
      success: true,
      data: {
        ...result,
        topicCount
      }
    })
  } catch (err) {
    next(err)
  }
}

export async function updateSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.userId },
      req.body,
      { new: true }
    )

    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" })
    }

    res.json({ success: true, data: subject })
  } catch (err) {
    next(err)
  }
}

export async function deleteSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user!.userId
    })

    if (!subject) {
      return res.status(404).json({ success: false, error: "Subject not found" })
    }

    const topics = await Topic.find({ subjectId: subject._id })
    const topicIds = topics.map((t) => t._id)

    await TopicContent.deleteMany({ topicId: { $in: topicIds } })
    await TopicProgress.deleteMany({ topicId: { $in: topicIds } })
    await QuizAttempt.deleteMany({ topicId: { $in: topicIds } })
    await RevisionSchedule.deleteMany({ topicId: { $in: topicIds } })
    await UserNotes.deleteMany({ topicId: { $in: topicIds } })

    await Topic.deleteMany({ subjectId: subject._id })

    await Subject.deleteOne({ _id: subject._id })
    await DailyTask.deleteMany({ topicId: { $in: topicIds } })
    res.json({
      success: true,
      message: "Subject deleted with all related data"
    })
  } catch (err) {
    next(err)
  }
}

export async function reorderSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const updates = req.body

    const bulkOps = updates.map((u: any) => ({
      updateOne: {
        filter: { _id: u.id, userId: req.user!.userId },
        update: { order: u.order }
      }
    }))

    await Subject.bulkWrite(bulkOps)

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}