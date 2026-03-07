// frontend/hooks/useFlashcards.ts

import { useEffect, useState } from "react";
import { flashcardProgressCache } from "@/lib/indexeddb";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string;
  explanation?: string;
}

interface CardProgress {
  knownCount: number;
}

export function useFlashcards(flashcards: Flashcard[], topicId: string) {
  const [deck, setDeck] = useState<Flashcard[]>(flashcards);
  const [knownCards, setKnownCards] = useState<string[]>([]);
  const [unknownCards, setUnknownCards] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [progressMap, setProgressMap] = useState<Record<string, CardProgress>>(
    {}
  );

  const currentCard = deck[currentIndex] ?? null;

  useEffect(() => {
    flashcardProgressCache.get(topicId).then((data) => {
      if (!data) return;

      setKnownCards(data.knownCards);
      setUnknownCards(data.unknownCards);
    });
  }, [topicId]);

  const saveProgress = async () => {
    await flashcardProgressCache.set(topicId, {
      topicId,
      knownCards,
      unknownCards,
      masteredCards: [],
      sessionCount: currentRound,
      lastReviewed: Date.now()
    });
  };

  const advance = () => {
    setIsFlipped(false);

    if (currentIndex + 1 < deck.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      setIsComplete(true);
    }
  };

  const flip = () => {
    setIsFlipped((v) => !v);
  };

  const showHint = () => {
    setIsFlipped(false);
  };

  const markKnown = async () => {
    if (!currentCard) return;

    const id = currentCard.id;

    const prev = progressMap[id]?.knownCount ?? 0;

    const next = prev + 1;

    setProgressMap((p) => ({
      ...p,
      [id]: { knownCount: next }
    }));

    if (next >= 3) {
      setKnownCards((k) => [...k, id]);
    }

    await saveProgress();
    advance();
  };

  const markUnknown = async () => {
    if (!currentCard) return;

    const id = currentCard.id;

    setUnknownCards((u) => [...u, id]);

    setDeck((d) => [...d.slice(0, currentIndex + 1), currentCard, ...d.slice(currentIndex + 1)]);

    await saveProgress();

    advance();
  };

  const markKinda = () => {
    advance();
  };

  const restartWithUnknown = () => {
    const filtered = flashcards.filter((c) => unknownCards.includes(c.id));

    setDeck(filtered);
    setCurrentIndex(0);
    setIsComplete(false);
    setCurrentRound((r) => r + 1);
  };

  const endSession = async () => {
    await saveProgress();
  };

  return {
    deck,
    knownCards,
    unknownCards,
    currentCard,
    isFlipped,
    isComplete,
    currentRound,
    flip,
    showHint,
    markKnown,
    markUnknown,
    markKinda,
    restartWithUnknown,
    endSession
  };
}