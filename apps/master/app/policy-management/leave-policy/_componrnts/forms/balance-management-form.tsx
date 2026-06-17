"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import { Button } from "@repo/ui/components/ui/button"
import { Wallet } from "lucide-react"
import { Switch } from "@repo/ui/components/ui/switch"
import { GradientFormHeader } from "../../../../../components/header/form-header"
import { SubFormTitle } from "../../../../../components/header/sub-form-title"

interface Props {
  register: any
  watch: any
  setValue: any
  errors: any
  isValid: boolean
  isViewMode: boolean
  onSave: () => void
  onPreviousTab?: () => void
  postLoading?: boolean
  showErrors?: boolean
  hasStepErrors?: boolean
}

export function BalanceManagementForm({
  register,
  watch,
  setValue,
  errors,
  isValid,
  isViewMode,
  onSave,
  onPreviousTab,
  postLoading,
  showErrors = false,
  hasStepErrors = false,
}: Props) {
  const watched = watch()

  // Check if current step is valid - using nested balance object
  const isStepValid = useMemo(() => {
    // Check allowed negative balance from balance object
    const hasAllowedNegativeBalance = watched.balance?.allowedNegativeBalance !== undefined && 
      watched.balance.allowedNegativeBalance !== null && 
      watched.balance.allowedNegativeBalance >= 0
    
    // Check min service period required from balance object
    const hasMinServicePeriod = watched.balance?.minServicePeriodRequired !== undefined && 
      watched.balance.minServicePeriodRequired !== null && 
      watched.balance.minServicePeriodRequired >= 0
    
    // Check maximum balance allowed from balance object
    const hasMaxBalanceAllowed = watched.balance?.maximumBalanceAllowed !== undefined && 
      watched.balance.maximumBalanceAllowed !== null && 
      watched.balance.maximumBalanceAllowed >= 0
    
    // Check lapse leave balance at year end from balance object (can be empty string)
    const hasLapseLeaveBalance = watched.balance?.lapseLeaveBalanceAtYearEnd !== undefined
    
    return !!(hasAllowedNegativeBalance && hasMinServicePeriod && hasMaxBalanceAllowed && hasLapseLeaveBalance)
  }, [
    watched.balance?.allowedNegativeBalance,
    watched.balance?.minServicePeriodRequired,
    watched.balance?.maximumBalanceAllowed,
    watched.balance?.lapseLeaveBalanceAtYearEnd,
    watched.balance
  ])

  // Handle continue button click
  const handleContinue = () => {
    if (isViewMode) return
    if (!isStepValid) return
    onSave()
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto space-y-6 mt-6 pb-28">
          <Card className="w-full border border-gray-200 bg-white shadow-sm">
            <GradientFormHeader
              icon={Wallet}
              title="Balance Management"
              description="Configure balance validation rules, service period requirements, and year-end lapse settings for leave balances."
            />
            <CardContent className="px-6 py-4 space-y-6">
              {showErrors && hasStepErrors && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Please fix highlighted fields before saving.
                </div>
              )}

              <div className="space-y-3">
                <SubFormTitle title="Balance Validation Settings" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">Balance Validation</p>
                      <p className="text-xs text-[#64748b]">Validate leave balance before approval.</p>
                    </div>

                    <Switch
                      checked={Boolean(watched.balance?.balanceValidation)}
                      onCheckedChange={(checked) =>
                        setValue("balance", {
                          ...(watched.balance || {}),
                          balanceValidation: checked,
                        }, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      disabled={isViewMode}
                      className="h-6 w-10 bg-[#dfe7f2] data-[state=checked]:bg-[#1e3a8a]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Allowed Negative Balance <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("balance.allowedNegativeBalance", { 
                        valueAsNumber: true,
                        required: "Allowed negative balance is required",
                        min: { value: 0, message: "Allowed negative balance must be 0 or greater" }
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.balance?.allowedNegativeBalance ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.balance?.allowedNegativeBalance && (
                      <p className="text-xs text-red-600">{errors.balance.allowedNegativeBalance.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Service Period And Limits" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Minimum Service Period Required (Days) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("balance.minServicePeriodRequired", { 
                        valueAsNumber: true,
                        required: "Minimum service period is required",
                        min: { value: 0, message: "Minimum service period must be 0 or greater" }
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.balance?.minServicePeriodRequired ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.balance?.minServicePeriodRequired && (
                      <p className="text-xs text-red-600">{errors.balance.minServicePeriodRequired.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Maximum Balance Allowed (Days) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("balance.maximumBalanceAllowed", { 
                        valueAsNumber: true,
                        required: "Maximum balance allowed is required",
                        min: { value: 0, message: "Maximum balance allowed must be 0 or greater" }
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.balance?.maximumBalanceAllowed ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.balance?.maximumBalanceAllowed && (
                      <p className="text-xs text-red-600">{errors.balance.maximumBalanceAllowed.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Year End Lapse" />
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Lapse Leave Balance At Year End <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("balance.lapseLeaveBalanceAtYearEnd")}
                    type="text"
                    placeholder="e.g., 25%, 50%, 100%"
                    disabled={isViewMode}
                    className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                      showErrors && errors.balance?.lapseLeaveBalanceAtYearEnd ? "border-red-500 ring-red-500" : ""
                    }`}
                  />
                  {showErrors && errors.balance?.lapseLeaveBalanceAtYearEnd && (
                    <p className="text-xs text-red-600">{errors.balance.lapseLeaveBalanceAtYearEnd.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 shadow-lg p-6 z-50">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleContinue}
              disabled={isViewMode || postLoading || !isStepValid}
              className={`w-[71%] h-10 text-white disabled:bg-gray-300 disabled:cursor-not-allowed ${
                !isStepValid && !isViewMode && !postLoading
                  ? "bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isViewMode ? "View Only" : postLoading ? "Loading..." : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
