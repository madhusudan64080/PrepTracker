// backend/src/controllers/content.controller.ts
//
// FIXES applied:
//   Issue 5 — AI optimisation: each method already maps to a single focused AI call
//             via contentService.getTopicContentByMethod(). Documented clearly.
//   Issue 6 — 409 conflict: getTopicContent and generateTopicContent now catch
//             duplicate-key errors (E11000) and return the existing document
//             instead of propagating a 500/409.

import { Request, Response, NextFunction } from "express"
import contentService from "../services/content.service"
import Topic from "../models/Topic.model"
import Subject from "../models/Subject.model"
import Project from "../models/Project.model"
import CodingProblem from "../models/CodingProblem.model"
import TopicContent from "../models/TopicContent.model"
import { LearningMethod } from "../models/TopicProgress.model"

const VALID_METHODS: LearningMethod[] = [
  "topic_explanation",
  "coding_patterns",
  "example_based",
  "revision"
]

/**
 * GET /api/content/topic/:id?method=topic_explanation
 *
 * Returns content for a specific learning method.
 * The service layer checks the DB first — AI is only called when no stored
 * content exists for that (topicId, learningMethod) pair.
 *
 * FIX (Issue 6): If a duplicate-key race-condition occurs, we catch it and
 * return the already-stored document instead of a 409/500.
 */
export async function getTopicContent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const topic = await Topic.findById(req.params.id)
    if (!topic) {
      return res.status(404).json({ success: false, error: "Topic not found" })
    }

    const subject = await Subject.findById(topic.subjectId).lean()
    const subjectName = subject?.name ?? ""

    const method = (req.query.method as LearningMethod) || "topic_explanation"

    if (!VALID_METHODS.includes(method)) {
      return res.status(400).json({
        success: false,
        error: `Invalid learning method. Valid options: ${VALID_METHODS.join(", ")}`
      })
    }

    let content
    try {
      content = await contentService.getTopicContentByMethod(
        topic.id,
        subjectName,
        topic.name,
        method
      )
    } catch (err: any) {
      // FIX (Issue 6): duplicate key on concurrent requests — return existing doc
      if (err?.code === 11000) {
        content = await TopicContent.findOne({ topicId: topic.id, learningMethod: method }).lean()
        if (!content) throw err
      } else {
        throw err
      }
    }

    res.json({ success: true, data: content })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/content/topic/:id/generate
 * Body: { method }
 *
 * FIX (Issue 1 + 6):
 *   This endpoint is now only used by the explicit "Regenerate" button or
 *   on first-ever generation.  It will NOT create duplicate content because
 *   getTopicContentByMethod() uses findOneAndUpdate with upsert:true.
 *   If concurrent requests arrive, the E11000 is caught and the stored doc
 *   is returned.
 */
export async function generateTopicContent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const topic = await Topic.findById(req.params.id)
    if (!topic) {
      return res.status(404).json({ success: false, error: "Topic not found" })
    }

    const subject = await Subject.findById(topic.subjectId).lean()
    const subjectName = subject?.name ?? ""

    const { method } = req.body as { method: LearningMethod }

    if (!method || !VALID_METHODS.includes(method)) {
      return res.status(400).json({
        success: false,
        error: `method is required. Valid options: ${VALID_METHODS.join(", ")}`,
        validMethods: VALID_METHODS.map((m) => ({
          id: m,
          label: methodLabel(m),
          description: methodDescription(m)
        }))
      })
    }

    let content
    try {
      content = await contentService.getTopicContentByMethod(
        topic.id,
        subjectName,
        topic.name,
        method
      )
    } catch (err: any) {
      // FIX (Issue 6): race-condition duplicate key — return existing doc
      if (err?.code === 11000) {
        content = await TopicContent.findOne({ topicId: topic.id, learningMethod: method }).lean()
        if (!content) throw err
      } else {
        throw err
      }
    }

    res.json({ success: true, data: content })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/content/topic/:id/methods
 * Returns the list of available learning methods.
 */
export async function getAvailableMethods(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const methods = VALID_METHODS.map((m) => ({
      id: m,
      label: methodLabel(m),
      description: methodDescription(m),
      icon: methodIcon(m)
    }))
    res.json({ success: true, data: methods })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/content/topic/:id/regenerate
 * Body: { method }  — optional; defaults to topic_explanation.
 *
 * FIX: method is now optional (defaults to "topic_explanation") so that the
 * frontend's regenerate() call doesn't need to track the current method.
 * The service uses upsert so this always overwrites the existing record.
 */
export async function regenerateTopicContent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const topic = await Topic.findById(req.params.id)
    if (!topic) {
      return res.status(404).json({ success: false, error: "Topic not found" })
    }

    const subject = await Subject.findById(topic.subjectId).lean()
    const subjectName = subject?.name ?? ""

    // Default to topic_explanation if caller omits method
    const method: LearningMethod =
      (req.body?.method as LearningMethod) || "topic_explanation"

    if (!VALID_METHODS.includes(method)) {
      return res.status(400).json({
        success: false,
        error: `Invalid method. Valid options: ${VALID_METHODS.join(", ")}`
      })
    }

    // Delete existing doc so the service generates a fresh one
    await TopicContent.deleteOne({ topicId: topic.id, learningMethod: method })

    const content = await contentService.getTopicContentByMethod(
      topic.id,
      subjectName,
      topic.name,
      method
    )

    res.json({ success: true, data: content })
  } catch (err) {
    next(err)
  }
}

export async function getProjectStageContent(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { projectId, stageNumber } = req.params
    const project = await Project.findById(projectId)
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" })
    }

    const content = await contentService.getProjectStageContent(
      projectId,
      Number(stageNumber),
      project
    )
    res.json({ success: true, data: content })
  } catch (err) {
    next(err)
  }
}

export async function getCodingHints(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const problem = await CodingProblem.findById(req.params.id)
    if (!problem) {
      return res.status(404).json({ success: false, error: "Problem not found" })
    }

    const hints = await contentService.getCodingHints(
      problem.id,
      problem.title,
      problem.topic,
      problem.difficulty
    )
    res.json({ success: true, data: hints })
  } catch (err) {
    next(err)
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function methodLabel(method: LearningMethod): string {
  const labels: Record<LearningMethod, string> = {
    topic_explanation: "Topic Explanation",
    coding_patterns:   "Coding Patterns",
    example_based:     "Example-Based Learning",
    revision:          "Quick Revision"
  }
  return labels[method]
}

function methodDescription(method: LearningMethod): string {
  const descriptions: Record<LearningMethod, string> = {
    topic_explanation:
      "Understand the theory — simple explanation, key concepts, analogies, and step-by-step breakdown.",
    coding_patterns:
      "For programming topics — all patterns, code examples, complexity analysis, and interview-expected questions.",
    example_based:
      "Learn through examples — varied examples with solutions from easy to hard, covering interview-level problems.",
    revision:
      "Quick revision mode — flashcards, quiz questions, mind map, key formulas, and last-minute tips."
  }
  return descriptions[method]
}

function methodIcon(method: LearningMethod): string {
  const icons: Record<LearningMethod, string> = {
    topic_explanation: "📖",
    coding_patterns:   "💻",
    example_based:     "🧩",
    revision:          "⚡"
  }
  return icons[method]
}