// frontend/hooks/useAnalytics.ts

import { useEffect, useState } from "react";
import { analyticsService } from "@/lib/apiServices";

export function useAnalytics(timeRange: "7d" | "30d" | "all" = "30d") {
  const [overview, setOverview] = useState<any>(null);
  const [heatmapData, setHeatmap] = useState<any[]>([]);
  const [subjectData, setSubjectData] = useState<any[]>([]);
  const [codingWeekly, setCodingWeekly] = useState<any[]>([]);
  const [quizTrend, setQuizTrend] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [o, h, s, c, q] = await Promise.allSettled([
        analyticsService.getOverview(),
        analyticsService.getHeatmap(),
        analyticsService.getSubjects(),
        analyticsService.getCodingProgress(),
        analyticsService.getQuizTrend()
      ]);

      if (o.status === 'fulfilled') setOverview(o.value.data?.data || o.value.data);
      if (h.status === 'fulfilled') {
        const d = h.value.data?.data || h.value.data || [];
        setHeatmap(Array.isArray(d) ? d : []);
      }
      if (s.status === 'fulfilled') {
        const d = s.value.data?.data || s.value.data || [];
        setSubjectData(Array.isArray(d) ? d : []);
      }
      if (c.status === 'fulfilled') {
        const d = c.value.data?.data || c.value.data || [];
        setCodingWeekly(Array.isArray(d) ? d : []);
      }
      if (q.status === 'fulfilled') {
        const d = q.value.data?.data || q.value.data || [];
        setQuizTrend(Array.isArray(d) ? d : []);
      }
    } catch (err) {
      setError("Failed to load analytics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  return {
    overview,
    heatmapData,
    subjectData,
    codingWeekly,
    quizTrend,
    isLoading,
    error,
    refetch: fetchAnalytics
  };
}
