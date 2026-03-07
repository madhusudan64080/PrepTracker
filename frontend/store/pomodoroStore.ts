// frontend/store/pomodoroStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type SessionType = "focus" | "short_break" | "long_break";

interface PomodoroState {
  timeRemaining: number;
  isActive: boolean;
  sessionType: SessionType;
  sessionsCompleted: number;
  todayFocusMinutes: number;

  start: () => void;
  pause: () => void;
  reset: () => void;
  tick: () => void;
  completeSession: () => void;
  skipBreak: () => void;
}

const FOCUS = 1500;
const SHORT = 300;
const LONG = 900;

export const pomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      timeRemaining: FOCUS,
      isActive: false,
      sessionType: "focus",
      sessionsCompleted: 0,
      todayFocusMinutes: 0,

      start: () =>
        set({
          isActive: true
        }),

      pause: () =>
        set({
          isActive: false
        }),

      reset: () =>
        set({
          timeRemaining: FOCUS,
          isActive: false,
          sessionType: "focus"
        }),

      tick: () => {
        const { timeRemaining } = get();

        if (timeRemaining <= 0) {
          get().completeSession();
          return;
        }

        set({
          timeRemaining: timeRemaining - 1
        });
      },

      completeSession: () => {
        const { sessionType, sessionsCompleted } = get();

        if (sessionType === "focus") {
          const nextType =
            (sessionsCompleted + 1) % 4 === 0
              ? "long_break"
              : "short_break";

          set({
            sessionType: nextType,
            sessionsCompleted: sessionsCompleted + 1,
            timeRemaining: nextType === "long_break" ? LONG : SHORT,
            isActive: false,
            todayFocusMinutes:
              get().todayFocusMinutes + 25
          });
        } else {
          set({
            sessionType: "focus",
            timeRemaining: FOCUS,
            isActive: false
          });
        }
      },

      skipBreak: () =>
        set({
          sessionType: "focus",
          timeRemaining: FOCUS,
          isActive: false
        })
    }),
    {
      name: "pomodoro-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        timeRemaining: state.timeRemaining,
        isActive: state.isActive
      })
    }
  )
);
