'use client'

import { motion } from 'framer-motion'

interface Props {
  value: number
  color?: string
  height?: number
  label?: string
  showPercent?: boolean
  animated?: boolean
}

export default function ProgressBar({
  value,
  color = '#6366f1',
  height = 8,
  label,
  showPercent = false,
  animated = true
}: Props) {

  return (
    <div className="w-full">

      {(label || showPercent) && (
        <div className="flex justify-between text-sm mb-2 text-gray-400">
          <span>{label}</span>
          {showPercent && <span>{value}%</span>}
        </div>
      )}

      <div
        className="w-full bg-neutral-800 rounded-full overflow-hidden"
        style={{ height }}
      >

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={
            animated
              ? { type: 'spring', stiffness: 120 }
              : { duration: 0 }
          }
          style={{
            background: color,
            height: '100%'
          }}
        />

      </div>

    </div>
  )
}