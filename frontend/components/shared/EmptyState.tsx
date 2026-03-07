// frontend/components/shared/EmptyState.tsx

"use client";

import { motion } from "framer-motion";

interface Props {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="border border-dashed border-white/10 p-10 rounded-lg text-center"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-[#94a3b8]">{description}</p>

      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-indigo-500 rounded text-sm"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}