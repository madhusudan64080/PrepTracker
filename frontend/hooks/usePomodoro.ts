// frontend/hooks/usePomodoro.ts

import { useEffect } from "react";
import { pomodoroStore } from "@/store/pomodoroStore";
import { goalService } from "@/lib/apiServices";

export function usePomodoro() {
  const {
    timeRemaining,
    isActive,
    sessionType,
    sessionsCompleted,
    start,
    pause,
    reset,
    tick,
    completeSession
  } = pomodoroStore();

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive]);

  useEffect(() => {
    if (timeRemaining === 0) {
      completeSession();

      if (sessionType === "focus") {
        goalService.logStudyTime(25);
      }

      if (Notification.permission === "granted") {
        new Notification("Pomodoro session finished");
      }
    }
  }, [timeRemaining]);

  const formattedTime = `${Math.floor(timeRemaining / 60)
    .toString()
    .padStart(2, "0")}:${(timeRemaining % 60)
    .toString()
    .padStart(2, "0")}`;

  const skipToNext = () => {
    completeSession();
  };

  return {
    timeRemaining,
    formattedTime,
    isActive,
    sessionType,
    sessionsCompleted,
    start,
    pause,
    reset,
    skipToNext
  };
}