// frontend/components/shared/Toast.tsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { uiStore } from "@/store/uiStore";
import { useEffect } from "react";

export default function ToastContainer() {
  const { toastQueue, removeToast } = uiStore();

  useEffect(() => {
    toastQueue.forEach((toast) => {
      setTimeout(() => removeToast(toast.id), 4000);
    });
  }, [toastQueue]);

  return (
    <div className="fixed top-5 right-5 space-y-2 z-50">
      <AnimatePresence>
        {toastQueue.slice(0, 3).map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="bg-[#13131f] border border-white/10 px-4 py-3 rounded shadow"
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}