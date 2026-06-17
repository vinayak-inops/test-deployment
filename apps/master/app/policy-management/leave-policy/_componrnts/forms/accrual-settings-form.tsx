"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { Separator } from "@repo/ui/components/ui/separator"
import { Button } from "@repo/ui/components/ui/button"
import { Clock, X, Filter, Search as SearchIcon, Trash2 } from "lucide-react"
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

export function AccrualSettingsForm({
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
  const excluded = (watched.leaveAccrual?.excludedDaysForAccrual || []).filter(
    (item: any) => typeof item === "string",
  )
  const [excludedAddOpen, setExcludedAddOpen] = useState(false)
  const [excludedSearch, setExcludedSearch] = useState("")
  const [excludedSearchField, setExcludedSearchField] = useState<"day">("day")
  const [excludedFormDay, setExcludedFormDay] = useState("WeekOff")

  const filteredExcludedRows = useMemo(() => {
    const q = excludedSearch.toLowerCase().trim()
    if (!q) return excluded
    return excluded.filter((row: string) => row.toLowerCase().includes(q))
  }, [excluded, excludedSearch])

  // Check if current step is valid
  const isStepValid = useMemo(() => {
    // Check accrual configuration - only Accrual Type is required
    const hasAccrualType = watched.leaveAccrual?.accrualType && 
      watched.leaveAccrual.accrualType.trim() !== ""
    
    return !!hasAccrualType
  }, [watched.leaveAccrual?.accrualType])

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
              icon={Clock}
              title="Accrual Settings"
              description="Configure leave accrual rules, reminder frequencies, and excluded days for leave accrual calculations."
            />
            <CardContent className="px-6 py-4 space-y-6">
              {showErrors && hasStepErrors && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Please fix highlighted fields before saving.
                </div>
              )}

              <div className="space-y-3">
                <SubFormTitle title="Alert Settings" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">Alert Approver</p>
                      <p className="text-xs text-[#64748b]">Enable alert notifications to approver.</p>
                    </div>
                    <Switch
                      checked={Boolean(watched.alertApprover)}
                      onCheckedChange={(checked) =>
                        setValue("alertApprover", checked, { shouldValidate: true, shouldDirty: true })
                      }
                      disabled={isViewMode}
                      className="h-6 w-10 bg-[#dfe7f2] data-[state=checked]:bg-[#1e3a8a]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Reminder Frequency To Approver
                    </Label>
                    <Input
                      {...register("reminderFrequencyToApprover", { 
                        valueAsNumber: true,
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    />
                    {showErrors && errors.reminderFrequencyToApprover && (
                      <p className="text-xs text-red-600">{errors.reminderFrequencyToApprover.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Accrual Configuration" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Accrual Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={watched.leaveAccrual?.accrualType || ""}
                      onValueChange={(value) =>
                        setValue(
                          "leaveAccrual",
                          { ...(watched.leaveAccrual || {}), accrualType: value },
                          { shouldValidate: true, shouldDirty: true },
                        )
                      }
                      disabled={isViewMode}
                    >
                      <SelectTrigger 
                        className={`h-9 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${
                          showErrors && (!watched.leaveAccrual?.accrualType || watched.leaveAccrual?.accrualType === "") 
                            ? "border-red-500 ring-red-500 bg-red-50" 
                            : ""
                        }`}
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    {showErrors && (!watched.leaveAccrual?.accrualType || watched.leaveAccrual?.accrualType === "") && (
                      <p className="text-xs text-red-600">Accrual type is required</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Day ID
                    </Label>
                    <Input
                      {...register("leaveAccrual.dayId", { 
                        valueAsNumber: true,
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    />
                    {showErrors && errors.leaveAccrual?.dayId && (
                      <p className="text-xs text-red-600">{errors.leaveAccrual.dayId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Accrual Days
                    </Label>
                    <Input
                      {...register("leaveAccrual.accrualPolicy.accrualDays", { 
                        valueAsNumber: true,
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    />
                    {showErrors && errors.leaveAccrual?.accrualPolicy?.accrualDays && (
                      <p className="text-xs text-red-600">{errors.leaveAccrual.accrualPolicy.accrualDays.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Working Days
                    </Label>
                    <Input
                      {...register("leaveAccrual.accrualPolicy.workingDays", { 
                        valueAsNumber: true,
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    />
                    {showErrors && errors.leaveAccrual?.accrualPolicy?.workingDays && (
                      <p className="text-xs text-red-600">{errors.leaveAccrual.accrualPolicy.workingDays.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Maximum Balance Carried Forward
                    </Label>
                    <Input
                      {...register("leaveAccrual.maximumBalanceCarriedForward", { 
                        valueAsNumber: true,
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    />
                    {showErrors && errors.leaveAccrual?.maximumBalanceCarriedForward && (
                      <p className="text-xs text-red-600">{errors.leaveAccrual.maximumBalanceCarriedForward.message}</p>
                    )}
                  </div>

                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">Accrual In Advance</p>
                      <p className="text-xs text-[#64748b]">Credit leave before it is earned.</p>
                    </div>

                    <Switch
                      checked={Boolean(watched.leaveAccrual?.accrualInAdvance)}
                      onCheckedChange={(checked) =>
                        setValue(
                          "leaveAccrual",
                          {
                            ...(watched.leaveAccrual || {}),
                            accrualInAdvance: checked,
                          },
                          { shouldValidate: true, shouldDirty: true },
                        )
                      }
                      disabled={isViewMode}
                      className="h-6 w-10 bg-[#dfe7f2] data-[state=checked]:bg-[#1e3a8a]"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Excluded Days For Accrual" />
                <div className="space-y-2 md:col-span-3">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Select Excluded Days</Label>
                  <div className="relative rounded-lg border p-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900">Excluded Days ({excluded.length})</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <div className="flex bg-muted/50 rounded-lg border flex-1">
                          <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                            <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                            <Select value={excludedSearchField} onValueChange={() => setExcludedSearchField("day")}>
                              <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium focus:ring-0 bg-transparent shadow-none">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="day">Day</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1 flex items-center bg-background rounded-r-lg">
                            <div className="relative flex-1">
                              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="text"
                                autoComplete="off"
                                placeholder="Search excluded day..."
                                value={excludedSearch}
                                onChange={(e) => setExcludedSearch(e.target.value)}
                                className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      {!isViewMode && (
                        <Button type="button" className="h-10 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setExcludedAddOpen(true)}>
                          Add Day
                        </Button>
                      )}
                    </div>
                    {excludedAddOpen && (
                      <div className="absolute z-[1000] left-3 top-[92px] w-[min(520px,calc(100%-24px))]">
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-3 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-800">Add Excluded Day</span>
                            <button type="button" onClick={() => setExcludedAddOpen(false)} className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="Close">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="space-y-2">
                            <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Day</Label>
                            <Select value={excludedFormDay} onValueChange={setExcludedFormDay}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="WeekOff">WeekOff</SelectItem>
                                <SelectItem value="Paid leaves">Paid leaves</SelectItem>
                                <SelectItem value="Holiday">Holiday</SelectItem>
                                <SelectItem value="Absent">Absent</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setExcludedAddOpen(false)}>Cancel</Button>
                            <Button
                              type="button"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => {
                                if (!excluded.includes(excludedFormDay)) {
                                  setValue("leaveAccrual.excludedDaysForAccrual", [...excluded, excludedFormDay], {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  })
                                }
                                setExcludedFormDay("WeekOff")
                                setExcludedAddOpen(false)
                              }}
                            >
                              Save
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="py-2 pl-4 text-[11px] font-semibold uppercase tracking-wide w-10">SL</TableHead>
                          <TableHead className="py-2 text-[11px] font-semibold uppercase tracking-wide">Excluded Day</TableHead>
                          {!isViewMode && (
                            <TableHead className="py-2 pr-4 text-[11px] font-semibold uppercase tracking-wide text-right">Action</TableHead>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredExcludedRows.length > 0 ? (
                          filteredExcludedRows.map((row: string, idx: number) => {
                            const rowIndex = excluded.indexOf(row)
                            return (
                              <TableRow key={`exd-${rowIndex}-${idx}`} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60">
                                <TableCell className="py-1.5 pl-4 text-xs text-gray-900">{idx + 1}</TableCell>
                                <TableCell className="py-1.5 text-sm text-gray-900">{row}</TableCell>
                                {!isViewMode && (
                                  <TableCell className="py-1.5 pr-4 text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                                      onClick={() => {
                                        const next = excluded.filter((_: string, i: number) => i !== rowIndex)
                                        setValue("leaveAccrual.excludedDaysForAccrual", next, {
                                          shouldValidate: true,
                                          shouldDirty: true,
                                        })
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TableCell>
                                )}
                              </TableRow>
                            )
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={isViewMode ? 2 : 3} className="py-8 text-center text-sm text-gray-500">
                              No excluded days found. Click "Add Day" to add one.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
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
              {isViewMode ? "View Only" : postLoading ? "Loading..." : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
