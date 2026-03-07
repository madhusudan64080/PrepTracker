// frontend/hooks/useQuiz.ts

import { useState } from "react";
import { quizService } from "@/lib/apiServices";

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface QuizResult {
  score: number;
  total: number;
  percentage: number;
}

interface UseQuizReturn {
  currentQuestion: QuizQuestion | null;
  currentIndex: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  hasSubmittedAnswer: boolean;
  isCorrect: boolean | null;
  answers: Record<string, string>;
  result: QuizResult | null;
  isComplete: boolean;
  selectAnswer: (answer: string) => void;
  submitAnswer: () => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  resetQuiz: () => void;
}

export function useQuiz(
  questions: QuizQuestion[],
  topicId: string,
  isRevisionQuiz?: boolean
): UseQuizReturn {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const currentQuestion = questions[currentIndex] ?? null;

  const selectAnswer = (answer: string) => {
    if (hasSubmittedAnswer) return;
    setSelectedAnswer(answer);
  };

  const submitAnswer = () => {
    if (!currentQuestion || !selectedAnswer) return;

    const correct = selectedAnswer === currentQuestion.correctAnswer;

    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: selectedAnswer
    }));

    setIsCorrect(correct);
    setHasSubmittedAnswer(true);
  };

  const nextQuestion = async () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setHasSubmittedAnswer(false);
      setIsCorrect(null);
    } else {
      const total = questions.length;

      const correctCount = questions.filter(
        (q) => answers[q.id] === q.correctAnswer
      ).length;

      const res: QuizResult = {
        score: correctCount,
        total,
        percentage: Math.round((correctCount / total) * 100)
      };

      setResult(res);
      setIsComplete(true);

      await quizService.submitAttempt({
        topicId,
        answers: questions.map(q => ({
          questionId: q.id,
          selectedAnswer: answers[q.id] || ''
        })),
        timeSpent: 0,
        isRevisionQuiz
      });
    }
  };

  const previousQuestion = () => {
    if (currentIndex === 0) return;

    setCurrentIndex((i) => i - 1);

    const prevQ = questions[currentIndex - 1];

    const prevAnswer = answers[prevQ.id] ?? null;

    setSelectedAnswer(prevAnswer);
    setHasSubmittedAnswer(false);
    setIsCorrect(null);
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setAnswers({});
    setSelectedAnswer(null);
    setHasSubmittedAnswer(false);
    setIsCorrect(null);
    setResult(null);
    setIsComplete(false);
  };

  return {
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
    selectedAnswer,
    hasSubmittedAnswer,
    isCorrect,
    answers,
    result,
    isComplete,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    previousQuestion,
    resetQuiz
  };
}