// frontend/lib/indexeddb.ts
<<<<<<< HEAD
=======
//
// FIX (Critical Bug): topicContentCache previously used `topicId` as the IDB keyPath,
// but useTopicContent.ts stores entries under composite keys like "topicId:method".
// get("abc123:topic_explanation") never matched a record whose .topicId = "abc123:topic_explanation"
// so the cache was ALWAYS a miss and the AI was called on every single page load.
//
// Fix: keyPath changed to `key` (plain string). DB version bumped to 3 to rebuild.
>>>>>>> 48fc2b9 (Updated full project with new content)

import { openDB, DBSchema, IDBPDatabase } from "idb";

interface TopicContent {
<<<<<<< HEAD
  topicId: string;
=======
  key: string;        // FIX: composite key "topicId:method" (was: topicId)
>>>>>>> 48fc2b9 (Updated full project with new content)
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
<<<<<<< HEAD

=======
>>>>>>> 48fc2b9 (Updated full project with new content)
  project_stage_content: {
    key: string;
    value: ProjectStageContent;
  };
<<<<<<< HEAD

=======
>>>>>>> 48fc2b9 (Updated full project with new content)
  flashcard_progress: {
    key: string;
    value: FlashcardProgress;
  };
<<<<<<< HEAD

=======
>>>>>>> 48fc2b9 (Updated full project with new content)
  offline_queue: {
    key: number;
    value: OfflineQueueItem;
  };
}

const dbPromise: Promise<IDBPDatabase<PrepTrackDB>> = openDB<PrepTrackDB>(
  "preptrack_cache",
<<<<<<< HEAD
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
=======
  3, // bumped from 2 to 3 to rebuild the topic_content store
  {
    upgrade(db) {
      // Rebuild with correct keyPath
      if (db.objectStoreNames.contains("topic_content")) {
        db.deleteObjectStore("topic_content");
      }
      db.createObjectStore("topic_content", { keyPath: "key" });

      if (!db.objectStoreNames.contains("project_stage_content")) {
        db.createObjectStore("project_stage_content", { keyPath: "stageKey" });
      }
      if (!db.objectStoreNames.contains("flashcard_progress")) {
        db.createObjectStore("flashcard_progress", { keyPath: "topicId" });
      }
      if (!db.objectStoreNames.contains("offline_queue")) {
        db.createObjectStore("offline_queue", { keyPath: "id", autoIncrement: true });
>>>>>>> 48fc2b9 (Updated full project with new content)
      }
    }
  }
);

<<<<<<< HEAD
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

=======
/* ---------- Topic Content Cache ----------
 * Key format: "topicId:method"  e.g. "abc123:topic_explanation"
 */
export const topicContentCache = {
  async get(key: string): Promise<TopicContent | undefined> {
    const db = await dbPromise;
    return db.get("topic_content", key);
  },
  async set(key: string, content: string): Promise<void> {
    const db = await dbPromise;
    await db.put("topic_content", { key, content, cachedAt: Date.now() });
  },
  async delete(key: string): Promise<void> {
    const db = await dbPromise;
    await db.delete("topic_content", key);
  },
>>>>>>> 48fc2b9 (Updated full project with new content)
  async clear(): Promise<void> {
    const db = await dbPromise;
    await db.clear("topic_content");
  }
};

/* ---------- Project Stage Cache ---------- */
<<<<<<< HEAD

=======
>>>>>>> 48fc2b9 (Updated full project with new content)
export const projectStageCache = {
  key(projectId: string, stageNum: number): string {
    return `${projectId}_${stageNum}`;
  },
<<<<<<< HEAD

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

=======
  async get(projectId: string, stageNum: number): Promise<ProjectStageContent | undefined> {
    const db = await dbPromise;
    return db.get("project_stage_content", `${projectId}_${stageNum}`);
  },
  async set(projectId: string, stageNum: number, content: string): Promise<void> {
    const db = await dbPromise;
>>>>>>> 48fc2b9 (Updated full project with new content)
    await db.put("project_stage_content", {
      stageKey: `${projectId}_${stageNum}`,
      content,
      cachedAt: Date.now()
    });
  },
<<<<<<< HEAD

  async delete(projectId: string, stageNum: number): Promise<void> {
    const db = await dbPromise;
    await db.delete(
      "project_stage_content",
      `${projectId}_${stageNum}`
    );
=======
  async delete(projectId: string, stageNum: number): Promise<void> {
    const db = await dbPromise;
    await db.delete("project_stage_content", `${projectId}_${stageNum}`);
>>>>>>> 48fc2b9 (Updated full project with new content)
  }
};

/* ---------- Flashcard Progress ---------- */
<<<<<<< HEAD

=======
>>>>>>> 48fc2b9 (Updated full project with new content)
export const flashcardProgressCache = {
  async get(topicId: string): Promise<FlashcardProgress | undefined> {
    const db = await dbPromise;
    return db.get("flashcard_progress", topicId);
  },
<<<<<<< HEAD

=======
>>>>>>> 48fc2b9 (Updated full project with new content)
  async set(topicId: string, progress: FlashcardProgress): Promise<void> {
    const db = await dbPromise;
    await db.put("flashcard_progress", progress);
  },
<<<<<<< HEAD

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

=======
  async updateCard(topicId: string, cardId: string, result: "known" | "unknown" | "mastered"): Promise<void> {
    const db = await dbPromise;
    const progress = await db.get("flashcard_progress", topicId);
    if (!progress) return;
    const remove = (arr: string[]) => arr.filter((c) => c !== cardId);
    progress.knownCards    = remove(progress.knownCards);
    progress.unknownCards  = remove(progress.unknownCards);
    progress.masteredCards = remove(progress.masteredCards);
    if (result === "known")    progress.knownCards.push(cardId);
    if (result === "unknown")  progress.unknownCards.push(cardId);
    if (result === "mastered") progress.masteredCards.push(cardId);
    progress.lastReviewed = Date.now();
>>>>>>> 48fc2b9 (Updated full project with new content)
    await db.put("flashcard_progress", progress);
  }
};

/* ---------- Offline Queue ---------- */
<<<<<<< HEAD

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

=======
export const offlineQueue = {
  async push(item: { type: string; payload: unknown }): Promise<number> {
    const db = await dbPromise;
    return db.add("offline_queue", { type: item.type, payload: item.payload, createdAt: Date.now(), synced: false });
  },
>>>>>>> 48fc2b9 (Updated full project with new content)
  async getAll(): Promise<OfflineQueueItem[]> {
    const db = await dbPromise;
    return db.getAll("offline_queue");
  },
<<<<<<< HEAD

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
=======
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
      if (item.synced && item.id) await tx.store.delete(item.id);
    }
    await tx.done;
  }
};
>>>>>>> 48fc2b9 (Updated full project with new content)
