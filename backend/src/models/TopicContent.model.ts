import mongoose, { Schema, Document, Model } from "mongoose"
import { LearningMethod } from "./TopicProgress.model"

export interface ITopicContent extends Document {
  topicId: mongoose.Types.ObjectId
  subjectName: string
  topicName: string
  learningMethod: LearningMethod

  concept: {
    summary: string
    keyPoints: string[]
    realWorldAnalogy: string
    prerequisites: string[]
    commonMisconceptions: string[]
  }

  visualExplanation: {
    textDiagram: string
    stepByStepBreakdown: {
      step: number
      title: string
      description: string
    }[]
    memoryTrick: string
  }

  codeExamples: {
    language: string
    title: string
    code: string
    explanation: string
    timeComplexity: string
    spaceComplexity: string
  }[]

  quizQuestions: any[]
  flashcards: any[]
  interviewQuestions: any[]
  relatedTopics: string[]

  generatedAt: Date
  generationModel: string
}

const TopicContentSchema = new Schema<ITopicContent>(
  {
    topicId: {
  type: Schema.Types.ObjectId,
  ref: "Topic",
  required: true
},

    subjectName: { type: String, default: "" },
    topicName: { type: String, default: "" },

    learningMethod: {
      type: String,
      enum: ["topic_explanation", "coding_patterns", "example_based", "revision"],
      required: true,
    
    },

    concept: {
      summary: { type: String, default: "" },
      keyPoints: { type: [String], default: [] },
      realWorldAnalogy: { type: String, default: "" },
      prerequisites: { type: [String], default: [] },
      commonMisconceptions: { type: [String], default: [] }
    },

    visualExplanation: {
      textDiagram: { type: String, default: "" },
      stepByStepBreakdown: {
        type: [
          {
            step: Number,
            title: String,
            description: String
          }
        ],
        default: []
      },
      memoryTrick: { type: String, default: "" }
    },

    codeExamples: {
      type: [
        {
          language: String,
          title: String,
          code: String,
          explanation: String,
          timeComplexity: String,
          spaceComplexity: String
        }
      ],
      default: []
    },

    quizQuestions: { type: [Object], default: [] },
    flashcards: {
  type: [Object],
  default: []
},
    interviewQuestions: { type: [Object], default: [] },

    relatedTopics: { type: [String], default: [] },

    generatedAt: { type: Date, default: Date.now },

    generationModel: { type: String, default: "openrouter" }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }
  }
)

// One content document per topic per learning method
TopicContentSchema.index(
  { topicId: 1, learningMethod: 1 },
  { unique: true }
)

const TopicContentModel: Model<ITopicContent> =
  mongoose.model<ITopicContent>("TopicContent", TopicContentSchema)

export default TopicContentModel