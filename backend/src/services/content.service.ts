// backend/src/services/content.service.ts
// AI is only called when:
//   1. Topic is accessed for the first time (no stored content in DB)
//   2. Regenerate button is explicitly clicked (controller deletes existing doc first)
// All other requests hit memory cache → DB, never AI.

import TopicContent from "../models/TopicContent.model"
import aiService from "./ai.service"
import { LearningMethod } from "../models/TopicProgress.model"
import Project from "../models/Project.model"
import ProjectStageContent from "../models/ProjectStageContent.model"

// ─── In-process memory cache ────────────────────────────────
const CACHE_TTL_MS = 10 * 60 * 1000

interface CacheEntry { data: any; expiresAt: number }
const contentCache = new Map<string, CacheEntry>()

function cacheGet(key: string): any | null {
  const entry = contentCache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) { contentCache.delete(key); return null }
  return entry.data
}

function cacheSet(key: string, data: any): void {
  if (contentCache.size > 500) {
    const firstKey = contentCache.keys().next().value
    if (firstKey) contentCache.delete(firstKey)
  }
  contentCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS })
}

function cacheInvalidate(topicId: string): void {
  for (const key of Array.from(contentCache.keys())) {
    if (key.startsWith(`${topicId}:`)) contentCache.delete(key)
  }
}

/**
 * Fetch existing content OR generate for the first time.
 * Order: memory cache → MongoDB → AI generation (only if nothing stored)
 */
async function getTopicContentByMethod(
  topicId: string,
  subjectName: string,
  topicName: string,
  learningMethod: LearningMethod
) {
  const cacheKey = `${topicId}:${learningMethod}`

  // 1. Memory cache
  const cached = cacheGet(cacheKey)
  if (cached) return cached

  // 2. MongoDB
  const existing = await TopicContent.findOne({ topicId, learningMethod }).lean()
  if (existing) {
    cacheSet(cacheKey, existing)
    return existing
  }

  // 3. AI generation — only reaches here on first visit
  let generatedData: any

  switch (learningMethod) {
    case "topic_explanation": {
      const data = await aiService.generateTopicContent(subjectName, topicName)
      generatedData = {
        concept: data.concept || {},
        visualExplanation: data.visualExplanation || {},
        codeExamples: data.codeExamples || [],
        flashcards: data.flashcards || [],
        interviewQuestions: data.interviewQuestions || [],
        relatedTopics: data.relatedTopics || []
      }
      break
    }

    case "coding_patterns": {
      const data = await aiService.generateCodingPatterns(subjectName, topicName)
      generatedData = {
        concept: {
          summary: `Coding patterns for ${topicName}`,
          keyPoints: data.tipsTricks || [],
          realWorldAnalogy: "",
          prerequisites: [],
          commonMisconceptions: []
        },
        visualExplanation: { textDiagram: "", stepByStepBreakdown: [], memoryTrick: "" },
        codeExamples: (data.patterns || []).map((p: any) => ({
          language: p.language || "python",
          title: p.name || "",
          code: p.code || "",
          explanation: p.description || "",
          timeComplexity: p.timeComplexity || "",
          spaceComplexity: p.spaceComplexity || ""
        })),
        flashcards: [],
        interviewQuestions: data.interviewQuestions || [],
        relatedTopics: []
      }
      break
    }

    case "example_based": {
      const data = await aiService.generateExampleBasedContent(subjectName, topicName)
      generatedData = {
        concept: {
          summary: `Example-based learning for ${topicName}`,
          keyPoints: data.conceptsCovered || [],
          realWorldAnalogy: "",
          prerequisites: [],
          commonMisconceptions: data.commonMistakes || []
        },
        visualExplanation: {
          textDiagram: "",
          stepByStepBreakdown: (data.examples || []).map((ex: any, i: number) => ({
            step: i + 1,
            title: ex.title || `Example ${i + 1}`,
            description: `${ex.problem}\n\nSolution: ${ex.solution}\n\n${ex.explanation}`
          })),
          memoryTrick: ""
        },
        codeExamples: (data.examples || [])
          .filter((ex: any) => ex.code)
          .map((ex: any) => ({
            language: "python",
            title: ex.title,
            code: ex.code,
            explanation: ex.explanation,
            timeComplexity: "",
            spaceComplexity: ""
          })),
        flashcards: [],
        interviewQuestions: [],
        relatedTopics: []
      }
      break
    }

    case "revision": {
      const data = await aiService.generateRevisionContent(subjectName, topicName)
      generatedData = {
        concept: {
          summary: data.quickSummary || "",
          keyPoints: data.keyFormulas || [],
          realWorldAnalogy: "",
          prerequisites: [],
          commonMisconceptions: []
        },
        visualExplanation: {
          textDiagram: JSON.stringify(data.mindMap || {}),
          stepByStepBreakdown: [],
          memoryTrick: (data.lastMinuteTips || []).join(" | ")
        },
        codeExamples: [],
        flashcards: data.flashcards || [],
        interviewQuestions: [],
        relatedTopics: []
      }
      break
    }

    default:
      throw new Error(`Unknown learning method: ${learningMethod}`)
  }

  // Upsert — safe against concurrent requests
  const content = await TopicContent.findOneAndUpdate(
    { topicId, learningMethod },
    {
      $set: {
        topicId,
        subjectName,
        topicName,
        learningMethod,
        ...generatedData,
        generatedAt: new Date()
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  )

  cacheSet(cacheKey, content)
  return content
}

function invalidateTopicCache(topicId: string): void {
  cacheInvalidate(topicId)
}

async function getProjectStageContent(
  projectId: string,
  stageNumber: number,
  project: any
) {
  const existing = await ProjectStageContent.findOne({ projectId, stageNumber }).lean()
  if (existing) return existing

  
  const data = await aiService.generateProjectStageContent(
  project.title,
  project.description || "",
  project.techStack || [],
  stageNumber,
  `Stage ${stageNumber}`
)
  return ProjectStageContent.create({ projectId, stageNumber, ...data })
}

async function getCodingHints(
  problemId: string,
  title: string,
  topic: string,
  difficulty: string
) {
  if (typeof (aiService as any).generateCodingHints === "function") {
    return (aiService as any).generateCodingHints(title, topic, difficulty)
  }
  return { hints: [`Think about edge cases for ${title}`, `Consider ${difficulty}-level optimisations`] }
}

export default {
  getTopicContentByMethod,
  invalidateTopicCache,
  getProjectStageContent,
  getCodingHints
}