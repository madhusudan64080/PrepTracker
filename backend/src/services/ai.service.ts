// backend/src/services/AIService.ts

import axios from "axios";
import {
  buildConceptPrompt,
  buildFlashcardsAndInterviewPrompt,
  buildCodingPatternsPrompt,
  buildExampleBasedPrompt,
  buildRevisionPrompt,
  buildProjectSingleStagePrompt,
  buildCodingHintsPrompt,
  buildWeeklyRevisionQuizPrompt,
  buildCompanyInterviewPrompt
} from "../utils/promptBuilder";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const JSON_MODE_MODELS = new Set([
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "openai/gpt-3.5-turbo"
]);

class AIService {

  private readonly PRIMARY_MODEL = "google/gemini-2.0-flash-001";
  private readonly FALLBACK_MODEL = "openai/gpt-4o-mini";
 
  private selectModel(prompt: string): string {

  const len = prompt.length

  if (len > 2200) return "google/gemini-2.0-flash-001"

  if (len > 900) return "openai/gpt-4o-mini"

  return "google/gemini-2.0-flash-001"
}
  private axiosInstance = axios.create({
    baseURL: OPENROUTER_URL,
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.FRONTEND_URL || "http://localhost:3000",
      "X-Title": "PrepTrack"
    },
    timeout: 60000
  });

  private wait(ms: number) {
    return new Promise(res => setTimeout(res, ms));
  }

  private stripFences(text: string) {
    return text.replace(/```json|```/gi, "").trim();
  }

  private repair(s: string) {
    return s
      .replace(/,(\s*[}\]])/g, "$1")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2018\u2019\u0060]/g, "'")
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "");
  }

  private parseOutput(raw: string) {
    const cleaned = this.stripFences(raw);

    try {
      return JSON.parse(cleaned);
    } catch {
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");

      if (start !== -1 && end > start) {
        const slice = this.repair(cleaned.slice(start, end + 1));
        return JSON.parse(slice);
      }

      throw new Error("AI returned invalid JSON");
    }
  }

  private async generate(prompt: string, maxTokens = 1500, retries = 3): Promise<any> {

    const primary = this.selectModel(prompt)

const models = [
  primary,
  this.FALLBACK_MODEL
]

    let lastError: any;

    for (let i = 0; i < retries; i++) {

      const model = models[i % models.length]

      try {

        const body: any = {
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.1,
          max_tokens: maxTokens
        };

        if (JSON_MODE_MODELS.has(model)) {
          body.response_format = { type: "json_object" };
        }

        const res = await this.axiosInstance.post("", body);

        return this.parseOutput(res.data.choices[0].message.content);

      } catch (err: any) {

        lastError = err;

        const status = err.response?.status;

        if (status === 429 || status >= 500) {
          await this.wait(Math.pow(2, i + 1) * 1000);
          continue;
        }

        if (i === retries - 1) throw err;
      }
    }

    throw lastError;
  }

  async generateTopicContent(subjectName: string, topicName: string) {

    const results = await Promise.allSettled([
      this.generate(buildConceptPrompt(subjectName, topicName), 1800),
      this.generate(buildFlashcardsAndInterviewPrompt(subjectName, topicName), 1500)
    ]);

    const part1 = results[0].status === "fulfilled" ? results[0].value : {};
    const part2 = results[1].status === "fulfilled" ? results[1].value : {};

    return {
      concept: part1.concept ?? {},
      visualExplanation: part1.visualExplanation ?? {},
      codeExamples: part1.codeExamples ?? [],
      relatedTopics: part1.relatedTopics ?? [],
      flashcards: part2.flashcards ?? [],
      interviewQuestions: part2.interviewQuestions ?? []
    };
  }

  async generateCodingPatterns(subject: string, topic: string) {
    return this.generate(buildCodingPatternsPrompt(subject, topic), 1600);
  }

  async generateExampleBasedContent(subject: string, topic: string) {
    return this.generate(buildExampleBasedPrompt(subject, topic), 1600);
  }

  async generateRevisionContent(subject: string, topic: string) {
    return this.generate(buildRevisionPrompt(subject, topic), 1200);
  }

  async generateProjectStageContent(pName: string, desc: string, stack: string[], sNum: number, sName: string) {
    return this.generate(buildProjectSingleStagePrompt(pName, desc, stack, sNum, sName), 1000);
  }

  async generateCodingHints(title: string, topic: string, diff: string) {
    return this.generate(buildCodingHintsPrompt(title, topic, diff), 500);
  }

  async generateWeeklyRevisionQuiz(topics: string[], weak: string[]) {
    return this.generate(buildWeeklyRevisionQuizPrompt(topics, weak), 1500);
  }

  async generateCompanyInterviewQuestions(company: string, topics: string[]) {
    return this.generate(buildCompanyInterviewPrompt(company, topics), 1200);
  }
}

export default new AIService();