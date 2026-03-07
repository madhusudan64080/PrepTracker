// frontend/hooks/useDailyGoal.ts

import { useEffect, useState } from "react";
import { goalService } from "@/lib/apiServices";

export function useDailyGoal() {
  const [goal, setGoal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoal = async () => {
    try {
      const res = await goalService.getToday();
      const data = res.data?.data || res.data;
      setGoal(data);
    } catch (err) {
      setError("Failed to load goal");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoal();
    const interval = setInterval(fetchGoal, 30000);
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

  // goal.meta.percentages or fallback
  const individualPercentages = goal?.meta?.percentages || {
    topics: 0,
    problems: 0,
    revision: 0,
    time: 0
  };

  const completionPercentage = goal?.completionPercentage ?? 0;
  const isComplete = completionPercentage >= 100;

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
