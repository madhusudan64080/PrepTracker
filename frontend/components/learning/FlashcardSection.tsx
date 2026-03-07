'use client'

export default function FlashcardSection({
  flashcards = []
}: {
  flashcards?: any[]
}) {

  const count = Array.isArray(flashcards) ? flashcards.length : 0
  const preview = count > 0 ? flashcards[0]?.question : null

  return (
    <div className="space-y-4">

      <div>{count} Flashcards</div>

      {preview ? (
        <div className="bg-[#13131f] p-4 rounded">
          {preview}
        </div>
      ) : (
        <div className="bg-[#13131f] p-4 rounded text-sm text-gray-400">
          Flashcards will appear after AI generates them.
        </div>
      )}

      <button
        disabled={count === 0}
        className="px-4 py-2 bg-indigo-500 rounded disabled:opacity-40"
      >
        Start Flashcard Session →
      </button>

    </div>
  )
}