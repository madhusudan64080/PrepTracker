// backend/src/services/analytics.service.ts

import mongoose from "mongoose"
import Topic from "../models/Topic.model"
import QuizAttempt from "../models/QuizAttempt.model"
import CodingProblem from "../models/CodingProblem.model"
import Project from "../models/Project.model"
import TopicProgress from "../models/TopicProgress.model"
import ActivityLog from "../models/ActivityLog.model"
import Subject from "../models/Subject.model"
import User from "../models/User.model"

class AnalyticsService {

  calculatePlacementScore(data: any): number {
    const subjectCoverage = (data.topicsCompleted / Math.max(data.totalTopics, 1)) * 30
    const knowledgeQuality = (data.avgQuizScore / 100) * 25
    const codingPractice = Math.min(data.problemsSolved / 100, 1) * 20
    const revisionConsistency = data.revisionRate * 15
    const streakBonus = Math.min(data.currentStreak / 30, 1) * 10
    return Math.round(subjectCoverage + knowledgeQuality + codingPractice + revisionConsistency + streakBonus)
  }

  async getOverview(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId)

    const [topicsCompleted, totalTopics, avgQuizScoreAgg, problemsSolved,
      projectsCompleted, studyMinutes, user, recentActivity] = await Promise.all([
      Topic.countDocuments({ userId, status: "completed" }),
      Topic.countDocuments({ userId }),
      QuizAttempt.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, avg: { $avg: "$percentage" } } }
      ]),
      CodingProblem.countDocuments({ userId, status: "solved" }),
      Project.countDocuments({ userId, status: "completed" }),
      TopicProgress.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, minutes: { $sum: "$timeSpentMinutes" } } }
      ]),
      User.findById(userId),
      ActivityLog.find({ userId }).sort({ date: -1 }).limit(10)
    ])

    const avgQuizScore = avgQuizScoreAgg[0]?.avg || 0
    const totalStudyHours = Math.round((studyMinutes[0]?.minutes || 0) / 60)

    const score = this.calculatePlacementScore({
      topicsCompleted, totalTopics, avgQuizScore, problemsSolved,
      revisionRate: 0.7, currentStreak: user?.streak.currentStreak || 0
    })

    return {
      topics: topicsCompleted,
      totalTopics,
      avgQuizScore: Math.round(avgQuizScore),
      problems: problemsSolved,
      projects: projectsCompleted,
      hours: totalStudyHours,
      streak: user?.streak,
      placementScore: score,
      recentActivity: recentActivity.map((a: any) => ({
        description: `${a.type?.replace(/_/g, ' ')} - ${a.entityName || ''}`,
        date: a.date || new Date()
      }))
    }
  }

  async getHeatmap(userId: string) {
    const days: any[] = []
    const now = new Date()

    for (let i = 364; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      d.setHours(0, 0, 0, 0)
      days.push({ date: d.toISOString().split('T')[0], count: 0 })
    }

    const start = new Date(now)
    start.setDate(now.getDate() - 364)

    const logs = await ActivityLog.find({
      userId,
      date: { $gte: start }
    })

    const countMap: Record<string, number> = {}
    logs.forEach((log: any) => {
      const d = new Date(log.date)
      const key = d.toISOString().split('T')[0]
      countMap[key] = (countMap[key] || 0) + 1
    })

    return days.map(d => ({ ...d, count: countMap[d.date] || 0 }))
  }

  async getSubjectAnalytics(userId: string) {
    const subjects = await Subject.find({ userId })
    const result = await Promise.all(subjects.map(async (s) => {
      const total = await Topic.countDocuments({ subjectId: s._id })
      const completed = await Topic.countDocuments({ subjectId: s._id, status: "completed" })
      return {
        name: s.name,
        color: s.color,
        total,
        completed,
        percentage: total > 0 ? Math.round((completed / total) * 100) : 0
      }
    }))
    return result
  }

  async getCodingProgress(userId: string) {
    const days: any[] = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const start = new Date(d)
      start.setHours(0, 0, 0, 0)
      const end = new Date(d)
      end.setHours(23, 59, 59, 999)

      const count = await CodingProblem.countDocuments({
        userId,
        createdAt: { $gte: start, $lte: end }
      })

      days.push({
        date: d.toISOString().split('T')[0],
        solved: count
      })
    }

    return days
  }

  async getQuizTrend(userId: string) {
    const userObjectId = new mongoose.Types.ObjectId(userId)
    const attempts = await QuizAttempt.find({ userId: userObjectId })
      .sort({ createdAt: -1 })
      .limit(20)

    return attempts.map((a: any) => ({
      date: a.createdAt,
      percentage: a.percentage,
      topicId: a.topicId
    }))
  }
}

export default new AnalyticsService()
