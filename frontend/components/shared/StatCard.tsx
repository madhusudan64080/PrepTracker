// frontend/components/shared/StatCard.tsx

"use client";

import { motion, useMotionValue, animate } from "framer-motion";
import { useEffect } from "react";

interface Props {
  label: string;
  value: number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number;
  color?: string;
  isLoading?: boolean;
}

export default function StatCard({
  label,
  value,
  subtitle,
  icon,
  trend
}: Props) {
  const motionValue = useMotionValue(0);

  useEffect(() => {
    const controls = animate(motionValue, value, { duration: 1 });
    return controls.stop;
  }, [value]);

  return (
    <div className="bg-[#13131f] p-5 rounded-lg border border-white/5">
      <div className="flex justify-between">
        <p className="text-sm text-[#94a3b8]">{label}</p>
        {icon}
      </div>

      <motion.p className="text-2xl font-semibold">
        {motionValue}
      </motion.p>

      {subtitle && (
        <p className="text-xs text-[#94a3b8]">{subtitle}</p>
      )}

      {trend !== undefined && (
        <p
          className={`text-xs ${
            trend >= 0 ? "text-green-400" : "text-red-400"
          }`}
        >
          {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
        </p>
      )}
    </div>
  );
}