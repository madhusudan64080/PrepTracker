'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function GlobalKeyboardShortcuts({
  onOpenCommandPalette,
  onCloseActive
}: {
  onOpenCommandPalette: () => void
  onCloseActive: () => void
}) {

  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {

    const handler = (e: KeyboardEvent) => {

      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        onOpenCommandPalette()
      }

      if (e.ctrlKey && e.key === '/') {
        e.preventDefault()
        setShowHelp(true)
      }

      if (e.key === 'Escape') {
        onCloseActive()
        setShowHelp(false)
      }
    }

    window.addEventListener('keydown', handler)

    return () => window.removeEventListener('keydown', handler)

  }, [])

  if (!showHelp) return null

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur flex items-center justify-center z-50">

      <div className="bg-neutral-900 rounded-xl p-8 w-full max-w-lg text-white">

        <h2 className="text-xl font-bold mb-6">
          Keyboard Shortcuts
        </h2>

        <div className="space-y-3 text-sm">

          <div>Ctrl + K → Command Palette</div>

          <div>Ctrl + / → Show Shortcuts</div>

          <div>Esc → Close Modal / Overlay</div>

          <hr className="border-neutral-700 my-4" />

          <div>Quiz:</div>
          <div>Space → Select focused option</div>
          <div>1 / 2 / 3 / 4 → Choose option A / B / C / D</div>

          <hr className="border-neutral-700 my-4" />

          <div>Flashcards:</div>
          <div>Arrow Left → Unknown</div>
          <div>Arrow Right → Known</div>
          <div>Space → Flip card</div>

          <hr className="border-neutral-700 my-4" />

          <div>Topic Page:</div>
          <div>F → Start flashcard session</div>

        </div>

        <button
          onClick={() => setShowHelp(false)}
          className="mt-6 bg-indigo-600 px-4 py-2 rounded"
        >
          Close
        </button>

      </div>

    </div>,
    document.body
  )
}