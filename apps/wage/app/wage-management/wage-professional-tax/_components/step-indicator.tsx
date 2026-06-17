"use client"

import { useRef, useEffect } from "react"

interface StepIndicatorProps {
  currentStep: number
  visibleStepLabel: number | null
  onStepChange: (step: number) => void
  onStepLabelToggle: (step: number) => void
  onStepLabelClose: () => void
  completedSteps?: number[] // Array of completed step numbers
  failedSteps?: number[] // Array of failed step numbers
  steps?: Array<{ number: number; label: string }>
}

const defaultSteps = [
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
  failedSteps = [],
  steps = defaultSteps,
}: StepIndicatorProps) {
  const stepLabelsRef = useRef<HTMLDivElement>(null)

  // Check if a step is accessible (can be clicked)
  const isStepAccessible = (stepNumber: number): boolean => {
    const currentIndex = steps.findIndex((step) => step.number === stepNumber)
    if (currentIndex <= 0) return true
    const previousStepNumber = steps[currentIndex - 1]?.number
    if (!previousStepNumber) return true
    return completedSteps.includes(previousStepNumber)
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

  const getStepTopPosition = (stepNumber: number) => {
    const stepIndex = steps.findIndex((step) => step.number === stepNumber)
    if (stepIndex === -1) return 32
    return 32 + (stepIndex * 56)
  }

  return (
    <>
      {/* Step Indicator - Complete left side, always visible */}
      <div className="w-12 h-full border-r border-gray-200 flex-shrink-0 bg-gray-50 step-indicator-container">
        <div className="p-4 flex flex-col items-center h-full">
          <div className="flex flex-col items-center">
            {/* Show all three steps connected by lines */}
            {steps.map((step, index) => {
              const nextStep = steps[index + 1]
              // Determine step status
              const isCompleted = completedSteps.includes(step.number)
              const isCurrent = step.number === currentStep
              const isAccessible = isStepAccessible(step.number)
              const isFailed = failedSteps.includes(step.number) && !isCompleted

              // Determine line color for segment between this step and the next step.
              const isLineCompleted = Boolean(
                nextStep && (
                  completedSteps.includes(nextStep.number)
                )
              )
              const lineColor = isLineCompleted ? "bg-green-500" : "bg-gray-300"

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
                    title={!isAccessible ? "Complete previous step first" : ''}
                  >
                    {/* Step Circle - Status based colors */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isFailed
                          ? 'bg-red-500 text-white'
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
                  {index < steps.length - 1 && (
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
        const isCompleted = completedSteps.includes(selectedStep.number)
        const isCurrent = selectedStep.number === currentStep
        const isAccessible = isStepAccessible(selectedStep.number)
        const isFailed = failedSteps.includes(selectedStep.number) && !isCompleted

        return (
          <div
            ref={stepLabelsRef}
            className="absolute left-12 z-50 mb-[2px]"
            style={{
              top: `${getStepTopPosition(visibleStepLabel)}px`,
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
                  : isFailed
                  ? 'text-red-600 border-2 border-dashed border-red-600 bg-red-50'
                  : isCurrent
                  ? 'text-blue-600 border-2 border-dashed border-blue-600 bg-blue-50'
                  : !isAccessible
                  ? 'text-gray-400 border border-gray-200 bg-gray-100'
                  : 'text-gray-500 border border-gray-300 bg-gray-50'
              }`}
              title={!isAccessible ? "Complete previous step first" : ''}
            >
              {selectedStep.label}
            </div>
          </div>
        )
      })()}
    </>
  )
}

