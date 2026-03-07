// frontend/components/shared/AiThinkingLoader.tsx

"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const messages = [
  "🧠 Analyzing topic...",
  "✍️ Writing explanation...",
  "💡 Creating code examples...",
  "❓ Building quiz questions...",
  "🃏 Preparing flashcards...",
  "🎤 Writing interview questions...",
  "✨ Almost ready..."
];

export default function AiThinkingLoader() {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 2000);

    const progressTimer = setInterval(() => {
      setProgress((p) => Math.min(p + 1, 95));
    }, 220);

    return () => {
      clearInterval(msgTimer);
      clearInterval(progressTimer);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 text-center space-y-6"
    >
      <div className="mx-auto w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center animate-pulse">
        🧠
      </div>

      <p className="text-lg font-medium">{messages[index]}</p>

      <div className="w-full bg-white/10 h-2 rounded">
        <div
          className="h-2 bg-indigo-500 rounded transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="text-sm text-[#94a3b8]">
        This usually takes 15-25 seconds on first visit
      </p>

      <p className="text-xs text-[#94a3b8]">
        Content is permanently cached after this
      </p>
    </motion.div>
  );
}