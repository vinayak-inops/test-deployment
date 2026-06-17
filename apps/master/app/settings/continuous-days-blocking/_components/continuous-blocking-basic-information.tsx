"use client"

import { useState } from "react"
import { Info, FileText } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"

interface ContinuousBlockingBasicInformationProps {
  daysForContinuousPresentBlocking: number
  daysForContinuousAbsentBlocking: number
  notificationEnabled: boolean
  blockingEnabled: boolean
  isActive: boolean
  onDaysForContinuousPresentBlockingChange: (value: number) => void
  onDaysForContinuousAbsentBlockingChange: (value: number) => void
  onNotificationEnabledChange: (value: boolean) => void
  onBlockingEnabledChange: (value: boolean) => void
  onIsActiveChange: (value: boolean) => void
  onSubmit: () => void
  isSubmitting?: boolean
  submitLabel?: string
  viewMode?: boolean
}

export function ContinuousBlockingBasicInformation({
  daysForContinuousPresentBlocking,
  daysForContinuousAbsentBlocking,
  notificationEnabled,
  blockingEnabled,
  isActive,
  onDaysForContinuousPresentBlockingChange,
  onDaysForContinuousAbsentBlockingChange,
  onNotificationEnabledChange,
  onBlockingEnabledChange,
  onIsActiveChange,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Changes",
  viewMode = false,
}: ContinuousBlockingBasicInformationProps) {
  const [errors, setErrors] = useState({
    daysForContinuousPresentBlocking: "",
    daysForContinuousAbsentBlocking: "",
  })

  const validateForm = () => {
    const nextErrors = {
      daysForContinuousPresentBlocking: "",
      daysForContinuousAbsentBlocking: "",
    }

    let hasErrors = false

    if (Number.isNaN(daysForContinuousPresentBlocking) || daysForContinuousPresentBlocking < 0) {
      nextErrors.daysForContinuousPresentBlocking = "Value must be 0 or greater"
      hasErrors = true
    }

    if (Number.isNaN(daysForContinuousAbsentBlocking) || daysForContinuousAbsentBlocking < 0) {
      nextErrors.daysForContinuousAbsentBlocking = "Value must be 0 or greater"
      hasErrors = true
    }

    setErrors(nextErrors)
    return !hasErrors
  }

  const handleSubmit = () => {
    if (viewMode) return
    if (validateForm()) onSubmit()
  }

  const isFormValid =
    daysForContinuousPresentBlocking >= 0 &&
    daysForContinuousAbsentBlocking >= 0

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto space-y-6 mt-6 pb-6">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-0">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Blocking Information</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Configure continuous days blocking rules and status.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Blocking Rules</h3>
                  <p className="text-sm text-gray-500 mt-1">Set present and absent continuous day limits</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Continuous Present Blocking Days <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={daysForContinuousPresentBlocking}
                      onChange={(e) => onDaysForContinuousPresentBlockingChange(Number(e.target.value))}
                      disabled={viewMode}
                      className={`h-9 border border-gray-300 ${errors.daysForContinuousPresentBlocking ? "border-red-500" : ""}`}
                    />
                    {errors.daysForContinuousPresentBlocking ? (
                      <p className="text-red-500 text-xs">{errors.daysForContinuousPresentBlocking}</p>
                    ) : (
                      <p className="text-gray-500 text-xs">(Required)</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Continuous Absent Blocking Days <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      value={daysForContinuousAbsentBlocking}
                      onChange={(e) => onDaysForContinuousAbsentBlockingChange(Number(e.target.value))}
                      disabled={viewMode}
                      className={`h-9 border border-gray-300 ${errors.daysForContinuousAbsentBlocking ? "border-red-500" : ""}`}
                    />
                    {errors.daysForContinuousAbsentBlocking ? (
                      <p className="text-red-500 text-xs">{errors.daysForContinuousAbsentBlocking}</p>
                    ) : (
                      <p className="text-gray-500 text-xs">(Required)</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Toggles</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Notification Enabled */}
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="notificationEnabled" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Notification Enabled
                    </Label>
                    <label htmlFor="notificationEnabled" className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        id="notificationEnabled"
                        type="checkbox"
                        checked={notificationEnabled}
                        onChange={(e) => onNotificationEnabledChange(e.target.checked)}
                        disabled={viewMode}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Enable notifications</span>
                    </label>
                  </div>

                  {/* Blocking Enabled */}
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="blockingEnabled" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Blocking Enabled
                    </Label>
                    <label htmlFor="blockingEnabled" className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        id="blockingEnabled"
                        type="checkbox"
                        checked={blockingEnabled}
                        onChange={(e) => onBlockingEnabledChange(e.target.checked)}
                        disabled={viewMode}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Enable blocking</span>
                    </label>
                  </div>

                  {/* Is Active */}
                  <div className="space-y-2 max-w-xs">
                    <Label htmlFor="isActive" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Is Active
                    </Label>
                    <label htmlFor="isActive" className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        id="isActive"
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => onIsActiveChange(e.target.checked)}
                        disabled={viewMode}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Enable this configuration</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 shadow-lg p-6 z-50 mt-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isFormValid || isSubmitting || viewMode}
              className="w-[71%] h-10 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {viewMode ? "View Only" : isSubmitting ? "Submitting..." : submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
