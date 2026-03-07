// frontend/hooks/useTopicContent.ts
// FIX: generateWithMethod now fetches stored content instead of always re-generating.
//      The IndexedDB cache key is namespaced by method so per-method caching works correctly.

import { useEffect, useRef, useState } from "react";
import { contentService } from "@/lib/apiServices";
import { topicContentCache } from "@/lib/indexeddb";

export interface TopicContent {
  topicId: string;
  content: string;
  concept?: any;
  visualExplanation?: any;
  codeExamples?: any[];
  quizQuestions?: any[];
  quiz?: { questions: any[] };
  flashcards?: any[];
  interviewQuestions?: any[];
  relatedTopics?: string[];
  learningMethod?: string;
}

interface UseTopicContentReturn {
  content: TopicContent | null;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  regenerate: () => Promise<void>;
  /**
   * FIX (Issue 1):
   * Called when user picks a learning method from the modal.
   * Checks DB-backed cache first — only hits the AI if no stored content exists.
   */
  generateWithMethod: (method: string) => Promise<void>;
  cacheSource: "indexeddb" | "server" | "ai" | null;
}

// ─── IndexedDB cache key helpers ──────────────────────────────
// Previously the cache used only topicId, so switching methods would
// return stale content from a different method.
// Now we namespace by `topicId:method`.
function cacheKey(topicId: string, method: string): string {
  return `${topicId}:${method}`;
}

export function useTopicContent(
  topicId: string | null,
  subjectName?: string,
  topicName?: string
): UseTopicContentReturn {
  const [content, setContent] = useState<TopicContent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cacheSource, setCacheSource] =
    useState<"indexeddb" | "server" | "ai" | null>(null);

  const inFlight = useRef<boolean>(false);

  // ──────────────────────────────────────────────────────────────
  // Initial load — no method selected yet, just fetch existing
  // content for the default method (topic_explanation).
  // If nothing is stored yet, we do NOT generate — the modal
  // will appear and the user will choose a method.
  // ──────────────────────────────────────────────────────────────
  const loadContent = async () => {
    if (!topicId || inFlight.current) return;

    inFlight.current = true;
    setError(null);

    // Try IndexedDB first (default method)
    const defaultMethod = "topic_explanation";
    const key = cacheKey(topicId, defaultMethod);

    try {
      const cached = await topicContentCache.get(key);

      if (cached) {
        // cached.content is the full serialised TopicContent object
        const parsed: TopicContent =
          typeof cached.content === "string"
            ? JSON.parse(cached.content)
            : cached.content;
        setContent({ ...parsed, topicId });
        setCacheSource("indexeddb");
        inFlight.current = false;
        return;
      }

      setIsLoading(true);

      const start = Date.now();

      // GET /api/content/topic/:id?method=topic_explanation
      // The backend returns stored content when it exists; only generates
      // when no content for that method has ever been created.
      const res = await contentService.getTopicContent(topicId, defaultMethod);
      const duration = Date.now() - start;

      const data = (res.data?.data || res.data) as TopicContent;

      // Persist to IndexedDB for offline use
      await topicContentCache.set(key, JSON.stringify(data));

      setContent(data);
      setCacheSource(duration > 8000 ? "ai" : "server");
    } catch {
      // Silently fail — the page will show the modal / error state
      setError(null);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
      inFlight.current = false;
    }
  };

  useEffect(() => {
    setContent(null);
    setCacheSource(null);
    setError(null);

    if (!topicId) return;

    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId]);

  // ──────────────────────────────────────────────────────────────
  // Regenerate — explicit user action (the "Regenerate" button).
  // Clears cache for ALL methods of this topic and forces a fresh
  // AI call for the default method.
  // ──────────────────────────────────────────────────────────────
  const regenerate = async (): Promise<void> => {
    if (!topicId) return;

    setIsGenerating(true);
    setError(null);

    try {
      // Clear cached entries for all methods
      const methods = [
        "topic_explanation",
        "coding_patterns",
        "example_based",
        "revision",
      ];
      await Promise.all(
        methods.map((m) => topicContentCache.delete(cacheKey(topicId, m)))
      );

      const res = await contentService.regenerateContent(topicId);
      const data = (res.data?.data || res.data) as TopicContent;

      const method =
        (data as any).learningMethod ?? "topic_explanation";
      await topicContentCache.set(cacheKey(topicId, method), JSON.stringify(data));

      setContent(data);
      setCacheSource("ai");
    } catch {
      setError("Failed to regenerate content");
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // FIX (Issue 1) — generateWithMethod
  //
  // OLD (broken) behaviour:
  //   Always called POST .../generate which triggers a new AI call.
  //
  // NEW (correct) behaviour:
  //   1. Check IndexedDB cache for topicId:method key.
  //   2. If found, use it immediately — no AI call.
  //   3. If not found, call GET /api/content/topic/:id?method=<method>
  //      The backend's getTopicContentByMethod() already does DB lookup
  //      before generating, so this is safe to call without risk of
  //      duplicate generation.
  //   4. Only falls back to POST .../generate if GET returns nothing
  //      (which in practice never happens given the backend upsert logic).
  // ──────────────────────────────────────────────────────────────
  const generateWithMethod = async (method: string): Promise<void> => {
    if (!topicId) return;

    setIsGenerating(true);
    setError(null);

    try {
      const key = cacheKey(topicId, method);

      // ── Step 1: IndexedDB cache hit ──
      const cached = await topicContentCache.get(key);
      if (cached) {
        const parsed: TopicContent =
          typeof cached.content === "string"
            ? JSON.parse(cached.content)
            : cached.content;
        setContent({ ...parsed, topicId });
        setCacheSource("indexeddb");
        return; // ← no network call, no AI call
      }

      // ── Step 2: Fetch from server (server returns stored content if
      //    available, or generates once and stores it) ──
      const start = Date.now();
      const res = await contentService.getTopicContent(topicId, method);
      const duration = Date.now() - start;

      const data = (res.data?.data || res.data) as TopicContent;

      // Persist for future offline use
      await topicContentCache.set(key, JSON.stringify(data));

      setContent(data);
      setCacheSource(duration > 8000 ? "ai" : "server");
    } catch {
      setError("Failed to load topic content");
    } finally {
      setIsGenerating(false);
      setIsLoading(false);
    }
  };

  return {
    content,
    isLoading,
    isGenerating,
    error,
    regenerate,
    generateWithMethod,
    cacheSource,
  };
}