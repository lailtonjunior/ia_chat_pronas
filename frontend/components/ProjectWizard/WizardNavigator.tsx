'use client'

interface WizardNavigatorProps {
  steps: { id: string; title: string }[]
  currentIndex: number
  onStepSelect?: (index: number) => void
}

export default function WizardNavigator({
  steps,
  currentIndex,
  onStepSelect,
}: WizardNavigatorProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const completed = index < currentIndex
          const active = index === currentIndex

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepSelect?.(index)}
              className="flex-1 group focus:outline-none"
            >
              <div
                className={`flex flex-col items-center gap-2 px-2 ${
                  active ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                    completed
                      ? 'bg-blue-600 text-white'
                      : active
                      ? 'border-2 border-blue-600 text-blue-600'
                      : 'border border-gray-300 text-gray-400'
                  }`}
                >
                  {completed ? '✓' : index + 1}
                </span>
                <span className="text-xs font-medium text-center">{step.title}</span>
              </div>
            </button>
          )
        })}
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-blue-600 transition-all"
          style={{
            width: `${
              steps.length > 1 ? (currentIndex / (steps.length - 1)) * 100 : 100
            }%`,
          }}
        ></div>
      </div>
    </div>
  )
}
