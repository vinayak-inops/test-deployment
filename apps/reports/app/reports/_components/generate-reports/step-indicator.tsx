"use client"

import { useRef, useEffect } from "react"

interface StepIndicatorProps {
  currentStep: number
  visibleStepLabel: number | null
  onStepChange: (step: number) => void
  onStepLabelToggle: (step: number) => void
  onStepLabelClose: () => void
  completedSteps?: number[] // Array of completed step numbers
}

const steps = [
  { number: 1, label: 'Select Reports' },
  { number: 2, label: 'Basic Filter' },
  { number: 3, label: 'Basic Information' },
]

export function StepIndicator({
  currentStep,
  visibleStepLabel,
  onStepChange,
  onStepLabelToggle,
  onStepLabelClose,
  completedSteps = [],
}: StepIndicatorProps) {
  const stepLabelsRef = useRef<HTMLDivElement>(null)

  // Check if a step is accessible (can be clicked)
  const isStepAccessible = (stepNumber: number): boolean => {
    if (stepNumber === 1) return true // Step 1 is always accessible
    // A step is accessible if the previous step is completed
    return completedSteps.includes(stepNumber - 1)
  }

  // Close step label when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stepLabelsRef.current && !stepLabelsRef.current.contains(event.target as Node)) {
        // Check if click is not on step indicator
        const target = event.target as HTMLElement
        if (!target.closest('.step-indicator-container')) {
          onStepLabelClose()
        }
      }
    }

    if (visibleStepLabel !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visibleStepLabel, onStepLabelClose])

  const selectedStep = steps.find(s => s.number === visibleStepLabel)

  // Calculate top position to align label center with step circle center
  const stepPositions = {
    1: 16 + 16 + 0, // 32px - step 1 circle center
    2: 16 + 32 + 24 + 16 + 0, // 88px - step 2 circle center
    3: 16 + 32 + 24 + 32 + 24 + 16 + 0, // 144px - step 3 circle center
  }

  return (
    <>
      {/* Step Indicator - Complete left side, always visible */}
      <div className="w-12 h-full border-r border-gray-200 flex-shrink-0 bg-gray-50 step-indicator-container">
        <div className="p-4 flex flex-col items-center h-full">
          <div className="flex flex-col items-center">
            {/* Show all three steps connected by lines */}
            {steps.map((step, index) => {
              // Determine step status
              const isCompleted = completedSteps.includes(step.number) || step.number < currentStep
              const isCurrent = step.number === currentStep
              const isFuture = step.number > currentStep
              const isAccessible = isStepAccessible(step.number)

              // Determine line color (line connects current step to next step)
              const lineColor = isCompleted 
                ? 'bg-green-500' 
                : isCurrent 
                ? 'bg-green-500' 
                : 'bg-gray-300'

              return (
                <div key={step.number} className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      if (isAccessible) {
                        onStepChange(step.number)
                        // Show only the clicked step's label, toggle if same step clicked
                        onStepLabelToggle(step.number)
                      }
                    }}
                    disabled={!isAccessible}
                    className={`flex items-center justify-center p-0 m-0 border-0 ${
                      isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                    }`}
                    title={!isAccessible ? `Complete step ${step.number - 1} first` : ''}
                  >
                    {/* Step Circle - Status based colors */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isCurrent
                          ? 'bg-blue-600 text-white'
                          : !isAccessible
                          ? 'bg-gray-200 text-gray-400'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {step.number}
                    </div>
                  </button>
                  {/* Connecting Line - Color based on status */}
                  {index < 2 && (
                    <div
                      className={`w-0.5 h-6 ${lineColor}`}
                      style={{ marginTop: '0px', marginBottom: '0px' }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Step Label - Absolutely positioned, in straight line with step number */}
      {visibleStepLabel !== null && selectedStep && (() => {
        const isCompleted = completedSteps.includes(selectedStep.number) || selectedStep.number < currentStep
        const isCurrent = selectedStep.number === currentStep
        const isFuture = selectedStep.number > currentStep
        const isAccessible = isStepAccessible(selectedStep.number)

        return (
          <div
            ref={stepLabelsRef}
            className="absolute left-12 z-50 mb-[2px]"
            style={{
              top: `${stepPositions[visibleStepLabel as keyof typeof stepPositions] || 32}px`,
              transform: 'translateY(-50%)',
            }}
          >
            <div
              onClick={() => {
                if (isAccessible) {
                  onStepChange(selectedStep.number)
                  onStepLabelClose()
                }
              }}
              className={`text-sm font-medium px-3 py-1 mb-[1px] rounded ${
                isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              } ${
                isCompleted
                  ? 'text-green-600 border-2 border-dashed border-green-600 bg-green-50'
                  : isCurrent
                  ? 'text-blue-600 border-2 border-dashed border-blue-600 bg-blue-50'
                  : !isAccessible
                  ? 'text-gray-400 border border-gray-200 bg-gray-100'
                  : 'text-gray-500 border border-gray-300 bg-gray-50'
              }`}
              title={!isAccessible ? `Complete step ${selectedStep.number - 1} first` : ''}
            >
              {selectedStep.label}
            </div>
          </div>
        )
      })()}
    </>
  )
}

