'use client'

export default function OfflinePage() {

  const retry = () => {
    window.location.reload()
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-neutral-950 text-white text-center px-6">

      <h1 className="text-5xl font-bold mb-4">
        PrepTrack
      </h1>

      <h2 className="text-2xl mb-6">
        You're offline
      </h2>

      <p className="text-gray-400 mb-8">
        Some features are still available:
      </p>

      <ul className="space-y-2 mb-10 text-gray-300">
        <li>✔ Cached topics accessible</li>
        <li>✔ Flashcard review works offline</li>
      </ul>

      <button
        onClick={retry}
        className="bg-indigo-600 px-6 py-3 rounded"
      >
        Try Again
      </button>

    </div>
  )
}