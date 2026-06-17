"use client"

import { useMemo, useState } from "react"
import { useForm, type SubmitHandler, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"

import { StepIndicator } from "./step-indicator"
import ContinuousBlockingSubsidiariesTab from "./continuous-blocking-subsidiaries-tab"
import ContinuousBlockingConsiderDaysTab from "./continuous-blocking-consider-days-tab"
import { ContinuousBlockingBasicInformation } from "./continuous-blocking-basic-information"

const subsidiarySchema = z.object({
  subsidiaryCode: z.string().min(1, "Subsidiary code is required"),
  isSyncActive: z.boolean().default(true),
  isBlockingActive: z.boolean().default(true),
})

const continuousBlockingSchema = z.object({
  subsidiaries: z.array(subsidiarySchema).min(1, "At least one subsidiary is required"),
  daysForContinuousPresentBlocking: z.coerce.number().min(0),
  daysForContinuousAbsentBlocking: z.coerce.number().min(0),
  notificationEnabled: z.boolean().default(true),
  blockingEnabled: z.boolean().default(true),
  considerDaysAsPresent: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
})

export type ContinuousBlockingFormValues = z.infer<typeof continuousBlockingSchema>
export type ContinuousBlockingTabProps = {
  form: UseFormReturn<ContinuousBlockingFormValues>
  viewMode: boolean
  showErrors: boolean
}
export interface ContinuousBlockingControllerProps {
  initialValues?: Partial<ContinuousBlockingFormValues>
  onSubmit?: (data: ContinuousBlockingFormValues) => void
  isOpen?: boolean
  onClose?: () => void
  mode?: "add" | "edit" | "view"
}

const steps = [
  { number: 1, label: "Subsidiaries" },
  { number: 2, label: "Consider Days" },
  { number: 3, label: "Basic Information" },
]

export default function ContinuousBlckingController({
  initialValues = {},
  onSubmit,
  isOpen = true,
  onClose,
  mode = "add",
}: ContinuousBlockingControllerProps) {
  const isViewMode = mode === "view"
  const [showErrors, setShowErrors] = useState(false)
  const [showSubmitStepErrors, setShowSubmitStepErrors] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [visibleStepLabel, setVisibleStepLabel] = useState<number | null>(null)

  const form = useForm<ContinuousBlockingFormValues>({
    resolver: zodResolver(continuousBlockingSchema),
    defaultValues: {
      subsidiaries: initialValues.subsidiaries || [],
      daysForContinuousPresentBlocking: initialValues.daysForContinuousPresentBlocking, // No default value
      daysForContinuousAbsentBlocking: initialValues.daysForContinuousAbsentBlocking, // No default value
      notificationEnabled: initialValues.notificationEnabled,
      blockingEnabled: initialValues.blockingEnabled,
      considerDaysAsPresent: initialValues.considerDaysAsPresent || [],
      isActive: initialValues.isActive,
    },
    mode: "onChange",
  })

  const { watch, setValue, handleSubmit, trigger } = form

  const subsidiaries = watch("subsidiaries") || []
  const considerDaysAsPresent = watch("considerDaysAsPresent") || []
  const daysForContinuousPresentBlocking = watch("daysForContinuousPresentBlocking")
  const daysForContinuousAbsentBlocking = watch("daysForContinuousAbsentBlocking")

  const completedSteps = useMemo(() => {
    const completed: number[] = []
    
    // Step 1: Subsidiaries - completed only if at least one subsidiary exists
    if (subsidiaries.length > 0) completed.push(1)
    
    // Step 2: Consider Days - completed only if at least one day is selected
    if (considerDaysAsPresent.length > 0) completed.push(2)
    
    // Step 3: Basic Information - completed only if user has entered valid values
    // Check if values are defined and valid (not undefined, null, or empty)
    if (daysForContinuousPresentBlocking !== undefined && 
        daysForContinuousPresentBlocking !== null &&
        daysForContinuousPresentBlocking >= 0 &&
        daysForContinuousAbsentBlocking !== undefined &&
        daysForContinuousAbsentBlocking !== null &&
        daysForContinuousAbsentBlocking >= 0) {
      completed.push(3)
    }
    
    return completed
  }, [
    subsidiaries.length, 
    considerDaysAsPresent.length, 
    daysForContinuousPresentBlocking, 
    daysForContinuousAbsentBlocking
  ])

  const failedSteps = useMemo(() => {
    if (!showSubmitStepErrors) return []
    const failed: number[] = []
    if (subsidiaries.length === 0) failed.push(1)
    if (considerDaysAsPresent.length === 0) failed.push(2)
    return failed
  }, [showSubmitStepErrors, subsidiaries.length, considerDaysAsPresent.length])

  const onSubmitHandler: SubmitHandler<ContinuousBlockingFormValues> = (data) => {
    onSubmit?.(data)
  }

  const handleSave = async () => {
    setShowSubmitStepErrors(true)
    setShowErrors(true)
    const valid = await trigger()
    if (!valid) return
    await handleSubmit(onSubmitHandler)()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-white shadow-xl border-l border-gray-200 w-full max-w-6xl h-full overflow-hidden flex flex-col rounded-l-lg">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-gray-100 fixed top-4 right-4 z-50 ml-auto">
          <X className="h-4 w-4" />
        </Button>

        <div className="flex-1 overflow-hidden bg-gray-50">
          <div className="flex h-full overflow-hidden relative">
            <StepIndicator
              currentStep={currentStep}
              visibleStepLabel={visibleStepLabel}
              completedSteps={completedSteps}
              failedSteps={failedSteps}
              steps={steps}
              onStepChange={setCurrentStep}
              onStepLabelToggle={(step) => setVisibleStepLabel(visibleStepLabel === step ? null : step)}
              onStepLabelClose={() => setVisibleStepLabel(null)}
            />

            {currentStep === 1 && (
              <div className="flex-1 flex flex-col overflow-y-auto">
                <ContinuousBlockingSubsidiariesTab
                  values={subsidiaries}
                  onChange={(next) => setValue("subsidiaries", next, { shouldDirty: true, shouldValidate: showErrors })}
                  onContinue={isViewMode ? undefined : () => setCurrentStep(2)}
                  showErrors={showErrors}
                  errorMessage="At least one subsidiary is required"
                  viewMode={isViewMode}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex-1 flex flex-col overflow-y-auto">
                <ContinuousBlockingConsiderDaysTab
                  values={considerDaysAsPresent}
                  onChange={(next) => setValue("considerDaysAsPresent", next, { shouldDirty: true, shouldValidate: showErrors })}
                  onSaveAndContinue={isViewMode ? undefined : () => setCurrentStep(3)}
                  continueLabel={isViewMode ? "View Only" : "Continue"}
                  viewMode={isViewMode}
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <ContinuousBlockingBasicInformation
                  daysForContinuousPresentBlocking={daysForContinuousPresentBlocking}
                  daysForContinuousAbsentBlocking={daysForContinuousAbsentBlocking}
                  notificationEnabled={watch("notificationEnabled")}
                  blockingEnabled={watch("blockingEnabled")}
                  isActive={watch("isActive")}
                  onDaysForContinuousPresentBlockingChange={(value) => setValue("daysForContinuousPresentBlocking", value, { shouldDirty: true })}
                  onDaysForContinuousAbsentBlockingChange={(value) => setValue("daysForContinuousAbsentBlocking", value, { shouldDirty: true })}
                  onNotificationEnabledChange={(value) => setValue("notificationEnabled", value, { shouldDirty: true })}
                  onBlockingEnabledChange={(value) => setValue("blockingEnabled", value, { shouldDirty: true })}
                  onIsActiveChange={(value) => setValue("isActive", value, { shouldDirty: true })}
                  onSubmit={() => void handleSave()}
                  submitLabel={mode === "edit" ? "Save Changes" : "Create Config"}
                  viewMode={isViewMode}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
