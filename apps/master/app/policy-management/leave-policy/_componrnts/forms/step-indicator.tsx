"use client"

import { useRef, useEffect } from "react"

interface StepIndicatorProps {
  currentStep: number
  visibleStepLabel: number | null
  onStepChange: (step: number) => void
  onStepLabelToggle: (step: number) => void
  onStepLabelClose: () => void
  completedSteps?: number[]
  failedSteps?: number[]
  steps?: Array<{ number: number; label: string }>
  isAddMode?: boolean // NEW: suppresses green for steps not yet navigated past
}

const defaultSteps = [
  { number: 1, label: "Select Reports" },
  { number: 2, label: "Basic Filter" },
  { number: 3, label: "Basic Information" },
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
  isAddMode = false,
}: StepIndicatorProps) {
  const stepLabelsRef = useRef<HTMLDivElement>(null)

  const isStepAccessible = (stepNumber: number): boolean => {
    if (stepNumber === currentStep) return true

    if (isAddMode) {
      // Add mode is strictly sequential:
      // - always allow going back
      // - allow only immediate next step when current step is completed
      if (stepNumber < currentStep) return true
      if (stepNumber === currentStep + 1) return completedSteps.includes(currentStep)
      return false
    }

    if (completedSteps.includes(stepNumber)) return true

    const targetIndex = steps.findIndex((step) => step.number === stepNumber)
    if (targetIndex === -1) return false

    for (let i = 0; i < targetIndex; i++) {
      const previousStepNumber = steps[i].number
      if (!completedSteps.includes(previousStepNumber)) return false
    }

    return true
  }

  /**
   * In add mode: a step only renders as "completed" (green) if the user has
   * already moved past it — i.e. the step number is less than currentStep AND
   * it is in the completedSteps array.
   *
   * In other modes (edit / view) we keep the original behaviour: any step in
   * completedSteps is green regardless of position.
   */
  const isStepVisuallyCompleted = (stepNumber: number): boolean => {
    if (!completedSteps.includes(stepNumber)) return false
    if (isAddMode) return stepNumber < currentStep
    return true
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stepLabelsRef.current && !stepLabelsRef.current.contains(event.target as Node)) {
        const target = event.target as HTMLElement
        if (!target.closest(".step-indicator-container")) {
          onStepLabelClose()
        }
      }
    }

    if (visibleStepLabel !== null) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [visibleStepLabel, onStepLabelClose])

  const selectedStep = steps.find((s) => s.number === visibleStepLabel)

  const getStepTopPosition = (stepNumber: number) => {
    const stepIndex = steps.findIndex((step) => step.number === stepNumber)
    if (stepIndex === -1) return 32
    return 32 + stepIndex * 56
  }

  return (
    <>
      <div className="w-12 h-full border-r border-gray-200 flex-shrink-0 bg-gray-50 step-indicator-container">
        <div className="p-4 flex flex-col items-center h-full">
          <div className="flex flex-col items-center">
            {steps.map((step, index) => {
              const nextStep = steps[index + 1]
              const isCompleted = isStepVisuallyCompleted(step.number)
              const isCurrent = step.number === currentStep
              const isAccessible = isStepAccessible(step.number)
              const isFailed = failedSteps.includes(step.number)

              // Line turns green only when the NEXT step is also visually completed
              const isLineCompleted = Boolean(nextStep && isStepVisuallyCompleted(nextStep.number))
              const lineColor = isLineCompleted ? "bg-green-500" : "bg-gray-300"

              return (
                <div key={step.number} className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      if (isAccessible) {
                        onStepChange(step.number)
                        onStepLabelToggle(step.number)
                      }
                    }}
                    disabled={!isAccessible}
                    className={`flex items-center justify-center p-0 m-0 border-0 ${
                      isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                    }`}
                    title={!isAccessible ? "Complete previous step first" : ""}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                        isFailed
                          ? "bg-red-500 text-white"
                          : isCompleted
                          ? "bg-green-500 text-white"
                          : isCurrent
                          ? "bg-blue-600 text-white"
                          : !isAccessible
                          ? "bg-gray-200 text-gray-400"
                          : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {step.number}
                    </div>
                  </button>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-0.5 h-6 ${lineColor}`}
                      style={{ marginTop: "0px", marginBottom: "0px" }}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {visibleStepLabel !== null &&
        selectedStep &&
        (() => {
          const isCompleted = isStepVisuallyCompleted(selectedStep.number)
          const isCurrent = selectedStep.number === currentStep
          const isAccessible = isStepAccessible(selectedStep.number)
          const isFailed = failedSteps.includes(selectedStep.number)

          return (
            <div
              ref={stepLabelsRef}
              className="absolute left-12 z-50 mb-[2px]"
              style={{
                top: `${getStepTopPosition(visibleStepLabel)}px`,
                transform: "translateY(-50%)",
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
                  isAccessible ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                } ${
                  isFailed
                    ? "text-red-600 border-2 border-dashed border-red-600 bg-red-50"
                    : isCompleted
                    ? "text-green-600 border-2 border-dashed border-green-600 bg-green-50"
                    : isCurrent
                    ? "text-blue-600 border-2 border-dashed border-blue-600 bg-blue-50"
                    : !isAccessible
                    ? "text-gray-400 border border-gray-200 bg-gray-100"
                    : "text-gray-500 border border-gray-300 bg-gray-50"
                }`}
                title={!isAccessible ? "Complete previous step first" : ""}
              >
                {selectedStep.label}
              </div>
            </div>
          )
        })()}
    </>
  )
}
