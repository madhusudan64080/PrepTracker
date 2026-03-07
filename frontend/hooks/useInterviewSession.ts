// frontend/hooks/useInterviewSession.ts

import { useEffect, useState } from "react";
import { interviewService } from "@/lib/apiServices";

export interface InterviewQuestion {
  id: string;
  question: string;
  answer: string;
}

export function useInterviewSession(questions: InterviewQuestion[]) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  const currentQuestion = questions[currentIndex] ?? null;

  useEffect(() => {
    if (!timerActive) return;

    const t = setInterval(() => {
      setTimeRemaining((t) => t - 1);
    }, 1000);

    return () => clearInterval(t);
  }, [timerActive]);

  const startInterview = () => {
    setTimerActive(true);
  };

  const revealAnswer = () => {
    setIsAnswerRevealed(true);
  };

  const rateAnswer = (rating: number) => {
    if (!currentQuestion) return;

    setRatings((r) => ({
      ...r,
      [currentQuestion.id]: rating
    }));
  };

  const nextQuestion = () => {
    setCurrentIndex((i) => i + 1);
    setIsAnswerRevealed(false);
    setTimeRemaining(120);
  };

  const endSession = async () => {
    const questionsPayload = questions.map((q) => {
      const rating = ratings[q.id] ?? 0;
      let selfRating: "nailed" | "partial" | "missed" = "missed";
      if (rating >= 4) selfRating = "nailed";
      else if (rating >= 2) selfRating = "partial";
      return { id: q.id, selfRating };
    });

    await interviewService.submitSession({
      questions: questionsPayload,
      totalTime: 0
    });

    setTimerActive(false);
  };

  return {
    currentQuestion,
    timeRemaining,
    timerActive,
    isAnswerRevealed,
    ratings,
    startInterview,
    revealAnswer,
    rateAnswer,
    nextQuestion,
    endSession
  };
}