// frontend/hooks/useProjectStage.ts

import { useEffect, useRef, useState } from "react";
import { projectService } from "@/lib/apiServices";
import { projectStageCache } from "@/lib/indexeddb";

export function useProjectStage(
  projectId: string | null,
  stageNumber: number
) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const inFlight = useRef(false);

  const load = async () => {
    if (!projectId || inFlight.current) return;

    inFlight.current = true;

    const cached = await projectStageCache.get(projectId, stageNumber);

    if (cached) {
      setContent(cached.content);
      inFlight.current = false;
      return;
    }

    setIsLoading(true);

    const res = await projectService.getStageContent(
      projectId,
      stageNumber
    );

    const data = res.data.content;

    await projectStageCache.set(projectId, stageNumber, data);

    setContent(data);
    setIsLoading(false);

    inFlight.current = false;
  };

  useEffect(() => {
    load();
  }, [projectId, stageNumber]);

  return { content, isLoading };
}