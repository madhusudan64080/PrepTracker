// frontend/hooks/useDailyGoal.ts
//
// FIX (Progress rings always 0%):
//   The goals controller returns:
//     { success, data: { ...goalDocument, completionPercentage }, meta: { percentages } }
//   Previously the hook did `setGoal(res.data?.data)` — storing only the `data`
//   object — then read `goal?.meta?.percentages`. But `meta` is a sibling of
//   `data` at the top response level, NOT nested inside the goal document.
//   So `goal.meta` was always undefined and all progress rings showed 0%.
//
//   Fix: store `meta` in its own state field so percentages are read correctly.

import { useEffect, useState } from "react";
import { goalService } from "@/lib/apiServices";

interface GoalPercentages {
  topics:   number;
  problems: number;
  revision: number;
  time:     number;
}

export function useDailyGoal() {
  const [goal,      setGoal]      = useState<any>(null);
  const [meta,      setMeta]      = useState<{ isComplete: boolean; percentages: GoalPercentages } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  const fetchGoal = async () => {
    try {
      const res = await goalService.getToday();

      // FIX: The API response shape is:
      //   { success, data: { ...goalDoc, completionPercentage }, meta: { isComplete, percentages } }
      // Store data and meta separately so percentages aren't lost.
      const payload = res.data;
      setGoal(payload?.data   ?? payload);
      setMeta(payload?.meta   ?? null);
    } catch (err) {
      setError("Failed to load goal");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoal();
    // Don't poll when the tab is hidden — avoids unnecessary API calls
    // and prevents waking the Render free-tier server from cold sleep.
    const interval = setInterval(() => {
      if (!document.hidden) fetchGoal();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateTargets = async (targets: any) => {
    try {
      await goalService.setGoal(targets);
      await fetchGoal();
    } catch (err) {
      console.error("Failed to update goal", err);
    }
  };

  const logStudyTime = async (minutes: number) => {
    try {
      await goalService.logStudyTime(minutes);
      await fetchGoal();
    } catch (err) {
      console.error("Failed to log study time", err);
    }
  };

  // FIX: read from the dedicated meta state, not from goal.meta (which is undefined)
  const individualPercentages: GoalPercentages = meta?.percentages ?? {
    topics:   0,
    problems: 0,
    revision: 0,
    time:     0
  };

  const completionPercentage = goal?.completionPercentage ?? 0;
  const isComplete           = meta?.isComplete ?? completionPercentage >= 100;

  return {
    goal,
    completionPercentage,
    individualPercentages,
    isComplete,
    isLoading,
    error,
    updateTargets,
    logStudyTime,
    refetch: fetchGoal
  };
}
