// frontend/lib/indexeddb.ts

import { openDB, DBSchema, IDBPDatabase } from "idb";

interface TopicContent {
  topicId: string;
  content: string;
  cachedAt: number;
}

interface ProjectStageContent {
  stageKey: string;
  content: string;
  cachedAt: number;
}

interface FlashcardProgress {
  topicId: string;
  knownCards: string[];
  unknownCards: string[];
  masteredCards: string[];
  sessionCount: number;
  lastReviewed: number;
}

interface OfflineQueueItem {
  id?: number;
  type: string;
  payload: unknown;
  createdAt: number;
  synced: boolean;
}

interface PrepTrackDB extends DBSchema {
  topic_content: {
    key: string;
    value: TopicContent;
  };

  project_stage_content: {
    key: string;
    value: ProjectStageContent;
  };

  flashcard_progress: {
    key: string;
    value: FlashcardProgress;
  };

  offline_queue: {
    key: number;
    value: OfflineQueueItem;
  };
}

const dbPromise: Promise<IDBPDatabase<PrepTrackDB>> = openDB<PrepTrackDB>(
  "preptrack_cache",
  2,
  {
    upgrade(db) {
      if (!db.objectStoreNames.contains("topic_content")) {
        db.createObjectStore("topic_content", { keyPath: "topicId" });
      }

      if (!db.objectStoreNames.contains("project_stage_content")) {
        db.createObjectStore("project_stage_content", {
          keyPath: "stageKey"
        });
      }

      if (!db.objectStoreNames.contains("flashcard_progress")) {
        db.createObjectStore("flashcard_progress", {
          keyPath: "topicId"
        });
      }

      if (!db.objectStoreNames.contains("offline_queue")) {
        db.createObjectStore("offline_queue", {
          keyPath: "id",
          autoIncrement: true
        });
      }
    }
  }
);

/* ---------- Topic Content Cache ---------- */

export const topicContentCache = {
  async get(topicId: string): Promise<TopicContent | undefined> {
    const db = await dbPromise;
    return db.get("topic_content", topicId);
  },

  async set(topicId: string, content: string): Promise<void> {
    const db = await dbPromise;

    await db.put("topic_content", {
      topicId,
      content,
      cachedAt: Date.now()
    });
  },

  async delete(topicId: string): Promise<void> {
    const db = await dbPromise;
    await db.delete("topic_content", topicId);
  },

  async clear(): Promise<void> {
    const db = await dbPromise;
    await db.clear("topic_content");
  }
};

/* ---------- Project Stage Cache ---------- */

export const projectStageCache = {
  key(projectId: string, stageNum: number): string {
    return `${projectId}_${stageNum}`;
  },

  async get(
    projectId: string,
    stageNum: number
  ): Promise<ProjectStageContent | undefined> {
    const db = await dbPromise;
    return db.get(
      "project_stage_content",
      `${projectId}_${stageNum}`
    );
  },

  async set(
    projectId: string,
    stageNum: number,
    content: string
  ): Promise<void> {
    const db = await dbPromise;

    await db.put("project_stage_content", {
      stageKey: `${projectId}_${stageNum}`,
      content,
      cachedAt: Date.now()
    });
  },

  async delete(projectId: string, stageNum: number): Promise<void> {
    const db = await dbPromise;
    await db.delete(
      "project_stage_content",
      `${projectId}_${stageNum}`
    );
  }
};

/* ---------- Flashcard Progress ---------- */

export const flashcardProgressCache = {
  async get(topicId: string): Promise<FlashcardProgress | undefined> {
    const db = await dbPromise;
    return db.get("flashcard_progress", topicId);
  },

  async set(topicId: string, progress: FlashcardProgress): Promise<void> {
    const db = await dbPromise;
    await db.put("flashcard_progress", progress);
  },

  async updateCard(
    topicId: string,
    cardId: string,
    result: "known" | "unknown" | "mastered"
  ): Promise<void> {
    const db = await dbPromise;
    const progress = await db.get("flashcard_progress", topicId);

    if (!progress) return;

    const remove = (arr: string[]) => arr.filter((c) => c !== cardId);

    progress.knownCards = remove(progress.knownCards);
    progress.unknownCards = remove(progress.unknownCards);
    progress.masteredCards = remove(progress.masteredCards);

    if (result === "known") progress.knownCards.push(cardId);
    if (result === "unknown") progress.unknownCards.push(cardId);
    if (result === "mastered") progress.masteredCards.push(cardId);

    progress.lastReviewed = Date.now();

    await db.put("flashcard_progress", progress);
  }
};

/* ---------- Offline Queue ---------- */

export const offlineQueue = {
  async push(item: {
    type: string;
    payload: unknown;
  }): Promise<number> {
    const db = await dbPromise;

    return db.add("offline_queue", {
      type: item.type,
      payload: item.payload,
      createdAt: Date.now(),
      synced: false
    });
  },

  async getAll(): Promise<OfflineQueueItem[]> {
    const db = await dbPromise;
    return db.getAll("offline_queue");
  },

  async markSynced(id: number): Promise<void> {
    const db = await dbPromise;
    const item = await db.get("offline_queue", id);

    if (!item) return;

    item.synced = true;

    await db.put("offline_queue", item);
  },

  async clearSynced(): Promise<void> {
    const db = await dbPromise;

    const all = await db.getAll("offline_queue");

    const tx = db.transaction("offline_queue", "readwrite");

    for (const item of all) {
      if (item.synced && item.id) {
        await tx.store.delete(item.id);
      }
    }

    await tx.done;
  }
};