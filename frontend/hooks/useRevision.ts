// frontend/hooks/useRevision.ts

import { useEffect, useState } from "react";
import { revisionService, quizService } from "@/lib/apiServices";

export function useRevision() {
  const [todayItems, setTodayItems] = useState<any[]>([]);
  const [overdueItems, setOverdueItems] = useState<any[]>([]);
  const [upcomingDays, setUpcomingDays] = useState<any[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [today, overdue, schedule, weekly] = await Promise.allSettled([
        revisionService.getToday(),
        revisionService.getOverdue(),
        revisionService.getSchedule(),
        revisionService.getWeeklySummary()
      ]);

      if (today.status === 'fulfilled') {
        const data = today.value.data?.data || today.value.data || [];
        setTodayItems(Array.isArray(data) ? data : []);
      }
      if (overdue.status === 'fulfilled') {
        const data = overdue.value.data?.data || overdue.value.data || [];
        setOverdueItems(Array.isArray(data) ? data : []);
      }
      if (schedule.status === 'fulfilled') {
        const data = schedule.value.data?.data || schedule.value.data || [];
        setUpcomingDays(Array.isArray(data) ? data : []);
      }
      if (weekly.status === 'fulfilled') {
        setWeeklySummary(weekly.value.data?.data || weekly.value.data);
      }
    } catch (err) {
      setError("Failed to load revision data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const markRevisionDone = async (topicId: string, score: number = 80) => {
    try {
      await revisionService.complete(topicId, score);
      await fetchData();
    } catch (err) {
      console.error("Failed to complete revision", err);
    }
  };

  const skipRevision = async (topicId: string) => {
    try {
      await revisionService.complete(topicId);
      await fetchData();
    } catch (err) {
      console.error("Failed to skip revision", err);
    }
  };

  return {
    todayItems,
    overdueItems,
    upcomingDays,
    weeklySummary,
    isLoading,
    error,
    markRevisionDone,
    skipRevision,
    refetch: fetchData
  };
}
