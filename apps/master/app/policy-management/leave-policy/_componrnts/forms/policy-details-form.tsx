"use client"

import { useMemo, useState } from "react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { Filter, Search as SearchIcon, Trash2, X, CalendarCheck } from "lucide-react"
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

export default function PolicyDetailsForm({
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
  const v = watch()
  const [maxLeaveAddOpen, setMaxLeaveAddOpen] = useState(false)
  const [maxLeaveSearch, setMaxLeaveSearch] = useState("")
  const [maxLeaveSearchField, setMaxLeaveSearchField] = useState<"type" | "daysAllowed">("type")
  const [maxLeaveFormType, setMaxLeaveFormType] = useState("once")
  const [maxLeaveFormDays, setMaxLeaveFormDays] = useState<number>(0)

  const [maxApplicationAddOpen, setMaxApplicationAddOpen] = useState(false)
  const [maxApplicationSearch, setMaxApplicationSearch] = useState("")
  const [maxApplicationSearchField, setMaxApplicationSearchField] = useState<"type" | "count">("type")
  const [maxApplicationFormType, setMaxApplicationFormType] = useState("once")
  const [maxApplicationFormCount, setMaxApplicationFormCount] = useState<number>(0)

  const maxLeaveAllowedRows = Array.isArray(v.maximumLeaveAllowed) ? v.maximumLeaveAllowed : []
  const maxApplicationAllowedRows = Array.isArray(v.maximumApplicationAllowed) ? v.maximumApplicationAllowed : []
  
  const filteredMaxLeaveRows = useMemo(() => {
    const q = maxLeaveSearch.toLowerCase().trim()
    if (!q) return maxLeaveAllowedRows
    return maxLeaveAllowedRows.filter((row: any) => {
      if (maxLeaveSearchField === "daysAllowed") return String(row?.daysAllowed ?? "").includes(q)
      return String(row?.type ?? "").toLowerCase().includes(q)
    })
  }, [maxLeaveAllowedRows, maxLeaveSearch, maxLeaveSearchField])
  
  const filteredMaxApplicationRows = useMemo(() => {
    const q = maxApplicationSearch.toLowerCase().trim()
    if (!q) return maxApplicationAllowedRows
    return maxApplicationAllowedRows.filter((row: any) => {
      if (maxApplicationSearchField === "count") return String(row?.count ?? "").includes(q)
      return String(row?.type ?? "").toLowerCase().includes(q)
    })
  }, [maxApplicationAllowedRows, maxApplicationSearch, maxApplicationSearchField])

  // Check if current step is valid
  const isStepValid = useMemo(() => {
    const hasEffectiveFrom = v.effectiveFrom && v.effectiveFrom.trim() !== ""
    const hasGenderAllowed = !!v.genderAllowed
    const hasLeaveType = !!v.leaveType
    const hasLeaveCategory = !!v.leaveCategory
    const hasMaritalStatus = v.maritalStatus && Array.isArray(v.maritalStatus) && v.maritalStatus.length > 0
    const hasMinServicePeriod = v.minimumServicePeriodRequired !== undefined && v.minimumServicePeriodRequired >= 0
    const hasMinDaysPerApp = v.minimumDaysPerApplication !== undefined && v.minimumDaysPerApplication >= 1
    const hasMaxDaysPerApp = v.maximumDaysPerApplication !== undefined && v.maximumDaysPerApplication >= 0
    
    return !!(hasEffectiveFrom && hasGenderAllowed && hasLeaveType && hasLeaveCategory && 
      hasMaritalStatus && hasMinServicePeriod && hasMinDaysPerApp && hasMaxDaysPerApp)
  }, [
    v.effectiveFrom, 
    v.genderAllowed, 
    v.leaveType, 
    v.leaveCategory,
    v.maritalStatus,
    v.minimumServicePeriodRequired,
    v.minimumDaysPerApplication,
    v.maximumDaysPerApplication
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
              icon={CalendarCheck}
              title="Leave Policy Details"
              description="Define the effective date, eligibility criteria, leave limits, and application rules for this leave policy."
            />
            <CardContent className="px-6 py-4 space-y-6">
              {showErrors && hasStepErrors && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Please fix highlighted fields before saving.
                </div>
              )}

              <div className="space-y-3">
                <SubFormTitle title="Basic Information" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Effective From <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("effectiveFrom", { required: "Effective from date is required" })}
                      type="date"
                      disabled={isViewMode}
                      className={`h-9 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.effectiveFrom ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.effectiveFrom && <p className="text-xs text-red-600">{errors.effectiveFrom.message}</p>}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Eligibility Criteria" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Gender Allowed <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={v.genderAllowed}
                      onValueChange={(value) => setValue("genderAllowed", value, { shouldValidate: true, shouldDirty: true })}
                      disabled={isViewMode}
                    >
                      <SelectTrigger className={`h-9 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${
                        showErrors && !v.genderAllowed ? "border-red-500 ring-red-500" : ""
                      }`}>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All</SelectItem>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    {showErrors && !v.genderAllowed && <p className="text-xs text-red-600">Gender allowed is required</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Leave Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={v.leaveType}
                      onValueChange={(value) => setValue("leaveType", value, { shouldValidate: true, shouldDirty: true })}
                      disabled={isViewMode}
                    >
                      <SelectTrigger className={`h-9 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${
                        showErrors && !v.leaveType ? "border-red-500 ring-red-500" : ""
                      }`}>
                        <SelectValue placeholder="Select leave type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                    {showErrors && !v.leaveType && <p className="text-xs text-red-600">Leave type is required</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Leave Category <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={v.leaveCategory}
                      onValueChange={(value) => setValue("leaveCategory", value, { shouldValidate: true, shouldDirty: true })}
                      disabled={isViewMode}
                    >
                      <SelectTrigger className={`h-9 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${
                        showErrors && !v.leaveCategory ? "border-red-500 ring-red-500" : ""
                      }`}>
                        <SelectValue placeholder="Select leave category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Time Away">Time Away</SelectItem>
                        <SelectItem value="Leave of Absence">Leave of Absence</SelectItem>
                      </SelectContent>
                    </Select>
                    {showErrors && !v.leaveCategory && <p className="text-xs text-red-600">Leave category is required</p>}
                  </div>

                  <div className="space-y-2 md:col-span-3">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Marital Status <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={Array.isArray(v.maritalStatus) && v.maritalStatus.length > 0 ? v.maritalStatus[0] : ""}
                      onValueChange={(value) =>
                        setValue("maritalStatus", [value], {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      disabled={isViewMode}
                    >
                      <SelectTrigger 
                        className={`h-9 w-full md:w-[280px] ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${
                          showErrors && (!v.maritalStatus || v.maritalStatus.length === 0) ? "border-red-500 ring-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select marital status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="unmarried">Unmarried</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                      </SelectContent>
                    </Select>
                    {showErrors && (!v.maritalStatus || v.maritalStatus.length === 0) && (
                      <p className="text-xs text-red-600">Marital status is required</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Leave Limits And Applications" />
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Min Service Period (months) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("minimumServicePeriodRequired", { 
                        valueAsNumber: true,
                        required: "Minimum service period is required"
                      })}
                      type="number"
                      disabled={isViewMode}
                      className={`h-9 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.minimumServicePeriodRequired ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.minimumServicePeriodRequired && (
                      <p className="text-xs text-red-600">{errors.minimumServicePeriodRequired.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Min Days Per Application <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("minimumDaysPerApplication", { 
                        valueAsNumber: true,
                        required: "Minimum days per application is required",
                        min: { value: 1, message: "Minimum days must be at least 1" }
                      })}
                      type="number"
                      disabled={isViewMode}
                      className={`h-9 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.minimumDaysPerApplication ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.minimumDaysPerApplication && (
                      <p className="text-xs text-red-600">{errors.minimumDaysPerApplication.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Max Days Per Application <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("maximumDaysPerApplication", { 
                        valueAsNumber: true,
                        required: "Maximum days per application is required"
                      })}
                      type="number"
                      disabled={isViewMode}
                      className={`h-9 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.maximumDaysPerApplication ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.maximumDaysPerApplication && (
                      <p className="text-xs text-red-600">{errors.maximumDaysPerApplication.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Alert Manager Days Before Leave Start</Label>
                    <Input
                      {...register("alertManagerDaysBeforeLeaveStart", { valueAsNumber: true })}
                      type="number"
                      disabled={isViewMode}
                      className={`h-9 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                    />
                  </div>

                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">Half Day Allowed</p>
                      <p className="text-xs text-[#64748b]">Allow employees to apply half-day leave.</p>
                    </div>

                    <Switch
                      checked={Boolean(v.halfDayAllowed)}
                      onCheckedChange={(checked) =>
                        setValue("halfDayAllowed", checked, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      disabled={isViewMode}
                      className="h-6 w-10 bg-[#dfe7f2] data-[state=checked]:bg-[#1e40af]"
                    />
                  </div>

                  <div className="space-y-2 md:col-span-3">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Maximum Leave Allowed</Label>
                    <div className="relative rounded-lg border p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-900">Maximum Leave Allowed ({maxLeaveAllowedRows.length})</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <div className="flex bg-muted/50 rounded-lg border flex-1">
                            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                              <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                              <Select value={maxLeaveSearchField} onValueChange={(val: "type" | "daysAllowed") => setMaxLeaveSearchField(val)}>
                                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium focus:ring-0 bg-transparent shadow-none">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="type">Type</SelectItem>
                                  <SelectItem value="daysAllowed">Days</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1 flex items-center bg-background rounded-r-lg">
                              <div className="relative flex-1">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  type="text"
                                  autoComplete="off"
                                  placeholder={`Search by ${maxLeaveSearchField === "type" ? "type" : "days"}...`}
                                  value={maxLeaveSearch}
                                  onChange={(e) => setMaxLeaveSearch(e.target.value)}
                                  className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        {!isViewMode && (
                          <Button type="button" className="h-10 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setMaxLeaveAddOpen(true)}>
                            Add Rule
                          </Button>
                        )}
                      </div>
                      {maxLeaveAddOpen && (
                        <div className="absolute z-30 left-3 top-[92px] w-[min(520px,calc(100%-24px))]">
                          <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-3 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-800">Add Maximum Leave Allowed</span>
                              <button
                                type="button"
                                onClick={() => setMaxLeaveAddOpen(false)}
                                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                aria-label="Close"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="space-y-2">
                              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Type</Label>
                              <Select value={maxLeaveFormType} onValueChange={setMaxLeaveFormType}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="once">Once</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Days Allowed</Label>
                              <Input
                                type="number"
                                min={0}
                                value={maxLeaveFormDays}
                                onChange={(e) => setMaxLeaveFormDays(Number(e.target.value) || 0)}
                                className="h-9"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => setMaxLeaveAddOpen(false)}>Cancel</Button>
                              <Button
                                type="button"
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => {
                                  setValue("maximumLeaveAllowed", [...maxLeaveAllowedRows, { type: maxLeaveFormType, daysAllowed: maxLeaveFormDays }], {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  })
                                  setMaxLeaveFormType("once")
                                  setMaxLeaveFormDays(0)
                                  setMaxLeaveAddOpen(false)
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
                            <TableHead className="py-2 text-[11px] font-semibold uppercase tracking-wide">Type</TableHead>
                            <TableHead className="py-2 text-[11px] font-semibold uppercase tracking-wide">Days Allowed</TableHead>
                            {!isViewMode && (
                              <TableHead className="py-2 pr-4 text-[11px] font-semibold uppercase tracking-wide text-right">Action</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMaxLeaveRows.length > 0 ? (
                            filteredMaxLeaveRows.map((row: any, idx: number) => {
                              const rowIndex = maxLeaveAllowedRows.indexOf(row)
                              return (
                                <TableRow key={`mla-${rowIndex}-${idx}`} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60">
                                  <TableCell className="py-1.5 pl-4 text-xs text-gray-900">{idx + 1}</TableCell>
                                  <TableCell className="py-1.5 text-sm text-gray-900 capitalize">{row?.type}</TableCell>
                                  <TableCell className="py-1.5 text-sm text-gray-900">{row?.daysAllowed ?? 0}</TableCell>
                                  {!isViewMode && (
                                    <TableCell className="py-1.5 pr-4 text-right">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                                        onClick={() => {
                                          const next = maxLeaveAllowedRows.filter((_: any, i: number) => i !== rowIndex)
                                          setValue("maximumLeaveAllowed", next, {
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
                              <TableCell colSpan={isViewMode ? 3 : 4} className="py-8 text-center text-sm text-gray-500">
                                No rules found. Click "Add Rule" to add one.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="space-y-2 md:col-span-3">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Maximum Application Allowed</Label>
                    <div className="relative rounded-lg border p-3 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-gray-900">Maximum Application Allowed ({maxApplicationAllowedRows.length})</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <div className="flex bg-muted/50 rounded-lg border flex-1">
                            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                              <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                              <Select
                                value={maxApplicationSearchField}
                                onValueChange={(val: "type" | "count") => setMaxApplicationSearchField(val)}
                              >
                                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium focus:ring-0 bg-transparent shadow-none">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="type">Type</SelectItem>
                                  <SelectItem value="count">Count</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex-1 flex items-center bg-background rounded-r-lg">
                              <div className="relative flex-1">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  type="text"
                                  autoComplete="off"
                                  placeholder={`Search by ${maxApplicationSearchField === "type" ? "type" : "count"}...`}
                                  value={maxApplicationSearch}
                                  onChange={(e) => setMaxApplicationSearch(e.target.value)}
                                  className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                        {!isViewMode && (
                          <Button type="button" className="h-10 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setMaxApplicationAddOpen(true)}>
                            Add Rule
                          </Button>
                        )}
                      </div>
                      {maxApplicationAddOpen && (
                        <div className="absolute z-[1000] left-3 top-[92px] w-[min(520px,calc(100%-24px))]">
                          <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-3 p-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-800">Add Maximum Application Allowed</span>
                              <button
                                type="button"
                                onClick={() => setMaxApplicationAddOpen(false)}
                                className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                                aria-label="Close"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="space-y-2">
                              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Type</Label>
                              <Select value={maxApplicationFormType} onValueChange={setMaxApplicationFormType}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="once">Once</SelectItem>
                                  <SelectItem value="monthly">Monthly</SelectItem>
                                  <SelectItem value="yearly">Yearly</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Count</Label>
                              <Input
                                type="number"
                                min={0}
                                value={maxApplicationFormCount}
                                onChange={(e) => setMaxApplicationFormCount(Number(e.target.value) || 0)}
                                className="h-9"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" size="sm" onClick={() => setMaxApplicationAddOpen(false)}>Cancel</Button>
                              <Button
                                type="button"
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                onClick={() => {
                                  setValue("maximumApplicationAllowed", [...maxApplicationAllowedRows, { type: maxApplicationFormType, count: maxApplicationFormCount }], {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  })
                                  setMaxApplicationFormType("once")
                                  setMaxApplicationFormCount(0)
                                  setMaxApplicationAddOpen(false)
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
                            <TableHead className="py-2 text-[11px] font-semibold uppercase tracking-wide">Type</TableHead>
                            <TableHead className="py-2 text-[11px] font-semibold uppercase tracking-wide">Count</TableHead>
                            {!isViewMode && (
                              <TableHead className="py-2 pr-4 text-[11px] font-semibold uppercase tracking-wide text-right">Action</TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMaxApplicationRows.length > 0 ? (
                            filteredMaxApplicationRows.map((row: any, idx: number) => {
                              const rowIndex = maxApplicationAllowedRows.indexOf(row)
                              return (
                                <TableRow key={`maa-${rowIndex}-${idx}`} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60">
                                  <TableCell className="py-1.5 pl-4 text-xs text-gray-900">{idx + 1}</TableCell>
                                  <TableCell className="py-1.5 text-sm text-gray-900 capitalize">{row?.type}</TableCell>
                                  <TableCell className="py-1.5 text-sm text-gray-900">{row?.count ?? 0}</TableCell>
                                  {!isViewMode && (
                                    <TableCell className="py-1.5 pr-4 text-right">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                                        onClick={() => {
                                          const next = maxApplicationAllowedRows.filter((_: any, i: number) => i !== rowIndex)
                                          setValue("maximumApplicationAllowed", next, {
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
                              <TableCell colSpan={isViewMode ? 3 : 4} className="py-8 text-center text-sm text-gray-500">
                                No rules found. Click "Add Rule" to add one.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
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