"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import { Switch } from "@repo/ui/components/ui/switch"
import { Button } from "@repo/ui/components/ui/button"
import { GradientFormHeader } from "../../../../../components/header/form-header"
import { SubFormTitle } from "../../../../../components/header/sub-form-title"
import { BarChart3 } from "lucide-react"

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

export function EncashmentForm({
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

  // Check if current step is valid
  const isStepValid = useMemo(() => {
    // Encashment Allowed can be true or false (always valid)
    // Check minimum balance required (must be >= 0)
    const hasMinimumBalanceRequired = watched.encashment?.minimumBalanceRequired !== undefined && 
      watched.encashment.minimumBalanceRequired !== null && 
      watched.encashment.minimumBalanceRequired >= 0
    
    // Check maximum allowed encashment (must be >= 0)
    const hasMaximumAllowedEncashment = watched.encashment?.maximumAllowedEncashment !== undefined && 
      watched.encashment.maximumAllowedEncashment !== null && 
      watched.encashment.maximumAllowedEncashment >= 0
    
    // Check maximum application allowed yearly (must be >= 0)
    const hasMaxApplicationYearly = watched.encashment?.maximumApplicationAllowedYearly !== undefined && 
      watched.encashment.maximumApplicationAllowedYearly !== null && 
      watched.encashment.maximumApplicationAllowedYearly >= 0
    
    // Check maximum encashment per application (must be >= 0)
    const hasMaxEncashmentPerApp = watched.encashment?.maximumEncashmentPerApplication !== undefined && 
      watched.encashment.maximumEncashmentPerApplication !== null && 
      watched.encashment.maximumEncashmentPerApplication >= 0
    
    return !!(hasMinimumBalanceRequired && hasMaximumAllowedEncashment && 
      hasMaxApplicationYearly && hasMaxEncashmentPerApp)
  }, [
    watched.encashment?.minimumBalanceRequired,
    watched.encashment?.maximumAllowedEncashment,
    watched.encashment?.maximumApplicationAllowedYearly,
    watched.encashment?.maximumEncashmentPerApplication
  ])

  // Handle continue button click (this will submit the form)
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
              icon={BarChart3}
              title="Encashment Settings"
              description="Configure encashment rules, limits, and application settings for unused leave balances."
            />
            <CardContent className="px-6 py-4 space-y-6">
              {showErrors && hasStepErrors && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Please fix highlighted fields before saving.
                </div>
              )}

              <div className="space-y-3">
                <SubFormTitle title="Encashment Configuration" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">Encashment Allowed</p>
                      <p className="text-xs text-[#64748b]">Allow employees to encash unused leave.</p>
                    </div>

                    <Switch
                      checked={Boolean(watched.encashment?.encashmentAllowed)}
                      onCheckedChange={(checked) =>
                        setValue("encashment", {
                          ...(watched.encashment || {}),
                          encashmentAllowed: checked,
                        }, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      disabled={isViewMode}
                      className="h-6 w-10 bg-[#dfe7f2] data-[state=checked]:bg-[#1e3a8a]"
                    />
                  </div>
                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">Auto Encashment</p>
                      <p className="text-xs text-[#64748b]">Automatically encash eligible leave balance.</p>
                    </div>

                    <Switch
                      checked={Boolean(watched.encashment?.autoEncashment)}
                      onCheckedChange={(checked) =>
                        setValue("encashment", {
                          ...(watched.encashment || {}),
                          autoEncashment: checked,
                        }, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      disabled={isViewMode}
                      className="h-6 w-10 bg-[#dfe7f2] data-[state=checked]:bg-[#1e40af]"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Encashment Limits" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Minimum Balance Required <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("encashment.minimumBalanceRequired", { 
                        valueAsNumber: true,
                        required: "Minimum balance required is required",
                        min: { value: 0, message: "Minimum balance required must be 0 or greater" }
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.encashment?.minimumBalanceRequired ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.encashment?.minimumBalanceRequired && (
                      <p className="text-xs text-red-600">{errors.encashment.minimumBalanceRequired.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Maximum Allowed Encashment <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("encashment.maximumAllowedEncashment", { 
                        valueAsNumber: true,
                        required: "Maximum allowed encashment is required",
                        min: { value: 0, message: "Maximum allowed encashment must be 0 or greater" }
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.encashment?.maximumAllowedEncashment ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.encashment?.maximumAllowedEncashment && (
                      <p className="text-xs text-red-600">{errors.encashment.maximumAllowedEncashment.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Application Settings" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">Application Required</p>
                      <p className="text-xs text-[#64748b]">Require leave application before approval.</p>
                    </div>

                    <Switch
                      checked={Boolean(watched.encashment?.applicationRequired)}
                      onCheckedChange={(checked) =>
                        setValue("encashment", {
                          ...(watched.encashment || {}),
                          applicationRequired: checked,
                        }, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      disabled={isViewMode}
                      className="h-6 w-10 bg-[#dfe7f2] data-[state=checked]:bg-[#1e40af]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Maximum Application Allowed Yearly <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("encashment.maximumApplicationAllowedYearly", { 
                        valueAsNumber: true,
                        required: "Maximum application allowed yearly is required",
                        min: { value: 0, message: "Maximum application allowed yearly must be 0 or greater" }
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.encashment?.maximumApplicationAllowedYearly ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.encashment?.maximumApplicationAllowedYearly && (
                      <p className="text-xs text-red-600">{errors.encashment.maximumApplicationAllowedYearly.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Maximum Encashment Per Application <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("encashment.maximumEncashmentPerApplication", { 
                        valueAsNumber: true,
                        required: "Maximum encashment per application is required",
                        min: { value: 0, message: "Maximum encashment per application must be 0 or greater" }
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.encashment?.maximumEncashmentPerApplication ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.encashment?.maximumEncashmentPerApplication && (
                      <p className="text-xs text-red-600">{errors.encashment.maximumEncashmentPerApplication.message}</p>
                    )}
                  </div>
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
              {isViewMode ? "View Only" : postLoading ? "Loading..." : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
