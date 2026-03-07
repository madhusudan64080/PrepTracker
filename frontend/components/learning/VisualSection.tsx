'use client'

interface Props {
  visual: any
  onComplete: () => void
}

export default function VisualSection({ visual, onComplete }: Props) {

  const diagram = visual?.textDiagram || ""

  const steps = Array.isArray(visual?.steps)
    ? visual.steps
    : Array.isArray(visual?.stepByStepBreakdown)
      ? visual.stepByStepBreakdown
      : []

  const memoryTrick = visual?.memoryTrick || ""

  return (
    <div className="space-y-6">

      {/* Diagram */}
      {diagram && (
        <pre className="bg-[#0d0d1a] p-4 rounded overflow-x-auto font-mono">
          {diagram}
        </pre>
      )}

      {/* Steps */}
      <div>
        {steps.map((s: any, i: number) => (
          <div key={i} className="flex gap-3 mb-3">

            <div className="w-6 h-6 bg-indigo-500 rounded-full text-xs flex items-center justify-center">
              {i + 1}
            </div>

            <div>
              <div className="font-semibold">{s?.title}</div>

              <div className="text-sm text-[#94a3b8]">
                {s?.description}
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Memory Trick */}
      {memoryTrick && (
        <div className="bg-purple-500/10 p-4 rounded">
          🧠 {memoryTrick}
        </div>
      )}

      <button
        onClick={onComplete}
        className="px-4 py-2 bg-indigo-500 rounded"
      >
        Mark Complete
      </button>

    </div>
  )
}