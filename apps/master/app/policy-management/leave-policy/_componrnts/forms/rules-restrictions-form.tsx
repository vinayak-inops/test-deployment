"use client"

import { useMemo, useState } from "react"
import { gql, useQuery } from "@apollo/client"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Badge } from "@repo/ui/components/ui/badge"
import { Separator } from "@repo/ui/components/ui/separator"
import { Switch } from "@repo/ui/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select"
import { Shield } from "lucide-react"
import { Check, Filter, Search as SearchIcon, Trash2, X } from "lucide-react"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { GradientFormHeader } from "../../../../../components/header/form-header"
import { SubFormTitle } from "../../../../../components/header/sub-form-title"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@repo/ui/components/ui/command"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"

const LEAVE_POLICY_QUERY = gql`
  query FetchLeavePolicy($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchLeavePolicy(criteriaRequests: $criteriaRequests, collection: $collection) {
      leavePolicy {
        leaveCode
        leaveTitle
      }
    }
  }
`

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

export function RulesRestrictionsForm({
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
  const tenantCode = useGetTenantCode()
  const [leaveOptions, setLeaveOptions] = useState<Array<{ leaveCode: string; leaveTitle: string }>>([])
  const [prefixSearchField, setPrefixSearchField] = useState<"code" | "name">("code")
  const [postfixSearchField, setPostfixSearchField] = useState<"code" | "name">("code")
  const [prefixSearchTerm, setPrefixSearchTerm] = useState("")
  const [postfixSearchTerm, setPostfixSearchTerm] = useState("")
  const [addPrefixSearchTerm, setAddPrefixSearchTerm] = useState("")
  const [addPostfixSearchTerm, setAddPostfixSearchTerm] = useState("")
  const [addPrefixOpen, setAddPrefixOpen] = useState(false)
  const [addPostfixOpen, setAddPostfixOpen] = useState(false)
  
  // Pagination states
  const [prefixPage, setPrefixPage] = useState(1)
  const [postfixPage, setPostfixPage] = useState(1)
  const pageSize = 5

  useQuery(LEAVE_POLICY_QUERY, {
    client,
    variables: {
      criteriaRequests: [
        {
          field: "tenantCode",
          operator: "eq",
          value: tenantCode,
        },
      ],
      collection: "leave_policy",
    },
    errorPolicy: "all",
    onCompleted: (data) => {
      const list = Array.isArray(data?.fetchLeavePolicy) ? data.fetchLeavePolicy : []
      const options = list
        .map((item: any) => {
          const policy = item?.leavePolicy
          const leaveCode = policy?.leaveCode || policy?.levcode
          const leaveTitle = policy?.leaveTitle || policy?.leavetitle
          if (!leaveCode || !leaveTitle) return null
          return { leaveCode, leaveTitle }
        })
        .filter(Boolean) as Array<{ leaveCode: string; leaveTitle: string }>
      setLeaveOptions(options)
    },
    onError: (error) => {
      console.error("GraphQL error loading leave policy options:", error)
    },
  })

  const watched = watch()
  const prefixSelected = watched.cannotCombineWith?.prefix || []
  const postfixSelected = watched.cannotCombineWith?.postfix || []

  const availablePrefixOptions = useMemo(
    () => leaveOptions.filter((item) => !prefixSelected.includes(item.leaveCode)),
    [leaveOptions, prefixSelected],
  )
  const availablePostfixOptions = useMemo(
    () => leaveOptions.filter((item) => !postfixSelected.includes(item.leaveCode)),
    [leaveOptions, postfixSelected],
  )
  
  const filteredPrefixSelected = useMemo(
    () =>
      leaveOptions.filter((i) => prefixSelected.includes(i.leaveCode)).filter((i) => {
        const q = prefixSearchTerm.toLowerCase().trim()
        if (!q) return true
        return prefixSearchField === "code"
          ? i.leaveCode.toLowerCase().includes(q)
          : i.leaveTitle.toLowerCase().includes(q)
      }),
    [leaveOptions, prefixSelected, prefixSearchField, prefixSearchTerm],
  )
  
  const filteredPostfixSelected = useMemo(
    () =>
      leaveOptions.filter((i) => postfixSelected.includes(i.leaveCode)).filter((i) => {
        const q = postfixSearchTerm.toLowerCase().trim()
        if (!q) return true
        return postfixSearchField === "code"
          ? i.leaveCode.toLowerCase().includes(q)
          : i.leaveTitle.toLowerCase().includes(q)
      }),
    [leaveOptions, postfixSelected, postfixSearchField, postfixSearchTerm],
  )
  
  // Paginated data
  const paginatedPrefixSelected = useMemo(() => {
    const start = (prefixPage - 1) * pageSize
    return filteredPrefixSelected.slice(start, start + pageSize)
  }, [filteredPrefixSelected, prefixPage])
  
  const paginatedPostfixSelected = useMemo(() => {
    const start = (postfixPage - 1) * pageSize
    return filteredPostfixSelected.slice(start, start + pageSize)
  }, [filteredPostfixSelected, postfixPage])
  
  // Reset page when search changes
  useMemo(() => {
    setPrefixPage(1)
  }, [prefixSearchTerm, prefixSearchField])
  
  useMemo(() => {
    setPostfixPage(1)
  }, [postfixSearchTerm, postfixSearchField])
  
  const addFilteredPrefixOptions = useMemo(() => {
    const q = addPrefixSearchTerm.toLowerCase().trim()
    return availablePrefixOptions.filter((i) => {
      if (!q) return true
      return prefixSearchField === "code"
        ? i.leaveCode.toLowerCase().includes(q)
        : i.leaveTitle.toLowerCase().includes(q)
    })
  }, [availablePrefixOptions, addPrefixSearchTerm, prefixSearchField])
  
  const addFilteredPostfixOptions = useMemo(() => {
    const q = addPostfixSearchTerm.toLowerCase().trim()
    return availablePostfixOptions.filter((i) => {
      if (!q) return true
      return postfixSearchField === "code"
        ? i.leaveCode.toLowerCase().includes(q)
        : i.leaveTitle.toLowerCase().includes(q)
    })
  }, [availablePostfixOptions, addPostfixSearchTerm, postfixSearchField])
  
  const allAddPrefixFilteredSelected =
    addFilteredPrefixOptions.length > 0 &&
    addFilteredPrefixOptions.every((option) => prefixSelected.includes(option.leaveCode))
  const allAddPostfixFilteredSelected =
    addFilteredPostfixOptions.length > 0 &&
    addFilteredPostfixOptions.every((option) => postfixSelected.includes(option.leaveCode))

  const topErrorFields = useMemo(() => {
    const fields: string[] = []
    if (errors.preApplication?.leaveDaysMoreThan) fields.push("Leave Days More Than")
    if (errors.preApplication?.applyBeforeDays) fields.push("Apply Before Days")
    if (errors.autoApproval?.daysForAutoApproval) fields.push("Days For Auto Approval")
    if (errors.reminderFrequencyToApprover) fields.push("Reminder Frequency To Approver")
    if (errors.alertManagerDaysBeforeLeaveStart) fields.push("Alert Manager Days Before Leave Start")
    if (errors.maximumBackDaysApplicationAllowed) fields.push("Maximum Back Days Application Allowed")
    if (errors.maximumFutureDaysApplicationAllowed) fields.push("Maximum Future Days Application Allowed")
    if (errors.requireDocsIfLeaveDaysExceeds) fields.push("Require Docs If Leave Days Exceeds")
    return fields
  }, [
    errors.preApplication?.leaveDaysMoreThan,
    errors.preApplication?.applyBeforeDays,
    errors.autoApproval?.daysForAutoApproval,
    errors.reminderFrequencyToApprover,
    errors.alertManagerDaysBeforeLeaveStart,
    errors.maximumBackDaysApplicationAllowed,
    errors.maximumFutureDaysApplicationAllowed,
    errors.requireDocsIfLeaveDaysExceeds,
  ])

  // Check if current step is valid
  const isStepValid = useMemo(() => {
    // Check pre-application fields
    const hasLeaveDaysMoreThan = watched.preApplication?.leaveDaysMoreThan !== undefined && 
      watched.preApplication.leaveDaysMoreThan >= 0
    const hasApplyBeforeDays = watched.preApplication?.applyBeforeDays !== undefined && 
      watched.preApplication.applyBeforeDays >= 0
    
    // Check auto approval fields
    const hasDaysForAutoApproval = watched.autoApproval?.daysForAutoApproval !== undefined && 
      watched.autoApproval.daysForAutoApproval >= 0
    
    // Check additional settings
    const hasReminderFrequency = watched.reminderFrequencyToApprover !== undefined && 
      watched.reminderFrequencyToApprover >= 0
    const hasAlertManagerDays = watched.alertManagerDaysBeforeLeaveStart !== undefined && 
      watched.alertManagerDaysBeforeLeaveStart >= 0
    const hasMaxBackDays = watched.maximumBackDaysApplicationAllowed !== undefined && 
      watched.maximumBackDaysApplicationAllowed >= 0
    const hasMaxFutureDays = watched.maximumFutureDaysApplicationAllowed !== undefined && 
      watched.maximumFutureDaysApplicationAllowed >= 0
    const hasRequireDocs = watched.requireDocsIfLeaveDaysExceeds !== undefined && 
      watched.requireDocsIfLeaveDaysExceeds >= 0
    
    return !!(hasLeaveDaysMoreThan && hasApplyBeforeDays && hasDaysForAutoApproval && 
      hasReminderFrequency && hasAlertManagerDays && hasMaxBackDays && 
      hasMaxFutureDays && hasRequireDocs)
  }, [
    watched.preApplication?.leaveDaysMoreThan,
    watched.preApplication?.applyBeforeDays,
    watched.autoApproval?.daysForAutoApproval,
    watched.reminderFrequencyToApprover,
    watched.alertManagerDaysBeforeLeaveStart,
    watched.maximumBackDaysApplicationAllowed,
    watched.maximumFutureDaysApplicationAllowed,
    watched.requireDocsIfLeaveDaysExceeds
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
          <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
            <GradientFormHeader
              icon={Shield}
              title="Rules & Restrictions"
              description="Configure leave eligibility, approval, combination and policy restriction rules."
            />

            <CardContent className="px-6 py-4 space-y-6">
              {showErrors && hasStepErrors && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <p className="font-medium">Please fix highlighted fields before saving.</p>
                  {topErrorFields.length > 0 && (
                    <p className="mt-1">
                      Missing/invalid: {topErrorFields.join(", ")}.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <SubFormTitle title="Holiday And Weekend Rules" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f8fafc] p-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                        Sandwich Holiday As Leave
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Count holidays inside a leave stretch as leave days after a minimum threshold.
                      </p>
                    </div>

                    <div className="flex items-center justify-between bg-white border rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Enable holiday sandwich rule</p>
                        <p className="text-xs text-gray-500">When enabled, holidays between leave dates can be included.</p>
                      </div>

                      <Switch
                        checked={Boolean(watched.sandwichHolidayAsLeave?.countAsLeave)}
                        onCheckedChange={(checked) =>
                          setValue(
                            "sandwichHolidayAsLeave",
                            {
                              ...(watched.sandwichHolidayAsLeave || {
                                countAsLeave: false,
                                minimumLeaveDays: 0,
                              }),
                              countAsLeave: checked,
                            },
                            { shouldValidate: true, shouldDirty: true },
                          )
                        }
                        disabled={isViewMode}
                      />
                    </div>

                    <Input
                      {...register("sandwichHolidayAsLeave.minimumLeaveDays", {
                        valueAsNumber: true,
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className="h-12 rounded-xl border-gray-300 bg-white"
                    />
                  </div>

                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f8fafc] p-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">
                        Sandwich Week Off As Leave
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        Count weekly offs inside a leave stretch as leave days after a minimum threshold.
                      </p>
                    </div>

                    <div className="flex items-center justify-between bg-white border rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-800">Enable week off sandwich rule</p>
                        <p className="text-xs text-gray-500">When enabled, week offs between leave dates can be included.</p>
                      </div>

                      <Switch
                        checked={Boolean(watched.sandwichWeekOffAsLeave?.countAsLeave)}
                        onCheckedChange={(checked) =>
                          setValue(
                            "sandwichWeekOffAsLeave",
                            {
                              ...(watched.sandwichWeekOffAsLeave || {
                                countAsLeave: false,
                                minimumLeaveDays: 0,
                              }),
                              countAsLeave: checked,
                            },
                            { shouldValidate: true, shouldDirty: true },
                          )
                        }
                        disabled={isViewMode}
                      />
                    </div>

                    <Input
                      {...register("sandwichWeekOffAsLeave.minimumLeaveDays", {
                        valueAsNumber: true,
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className="h-12 rounded-xl border-gray-300 bg-white"
                    />
                  </div>

                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f8fafc] p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Can Start Or End On Holiday</p>
                      <p className="text-xs text-gray-500">Allow requests to begin or finish on an official holiday.</p>
                    </div>

                    <Switch
                      checked={Boolean(watched.canStartOrEndOnHoliday)}
                      onCheckedChange={(checked) =>
                        setValue("canStartOrEndOnHoliday", checked, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      disabled={isViewMode}
                    />
                  </div>

                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f8fafc] p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Can Start Or End On Week Off</p>
                      <p className="text-xs text-gray-500">Allow requests to begin or finish on a week off or rest day.</p>
                    </div>

                    <Switch
                      checked={Boolean(watched.canStartOrEndOnWeekOff)}
                      onCheckedChange={(checked) =>
                        setValue("canStartOrEndOnWeekOff", checked, {
                          shouldValidate: true,
                          shouldDirty: true,
                        })
                      }
                      disabled={isViewMode}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Application Timing Rules" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Leave Days More Than <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("preApplication.leaveDaysMoreThan", { 
                        valueAsNumber: true,
                        required: "Leave days more than is required"
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.preApplication?.leaveDaysMoreThan ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.preApplication?.leaveDaysMoreThan && (
                      <p className="text-xs text-red-600">{errors.preApplication.leaveDaysMoreThan.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Apply Before Days <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("preApplication.applyBeforeDays", { 
                        valueAsNumber: true,
                        required: "Apply before days is required"
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.preApplication?.applyBeforeDays ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.preApplication?.applyBeforeDays && (
                      <p className="text-xs text-red-600">{errors.preApplication.applyBeforeDays.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <SubFormTitle title="Approval Settings" />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">Auto Approval Allowed</p>
                      <p className="text-xs text-[#64748b]">Auto-approve leave requests</p>
                    </div>

                    <Switch
                      checked={Boolean(watched.autoApproval?.autoApprovalAllowed)}
                      onCheckedChange={(checked) =>
                        setValue(
                          "autoApproval",
                          {
                            ...(watched.autoApproval || {
                              autoApprovalAllowed: false,
                              autoApproveIfDateCrossed: false,
                              daysForAutoApproval: 0,
                            }),
                            autoApprovalAllowed: checked,
                          },
                          { shouldValidate: true, shouldDirty: true },
                        )
                      }
                      disabled={isViewMode}
                      className="h-6 w-10 bg-[#dfe7f2] data-[state=checked]:bg-[#1e3a8a]"
                    />
                  </div>

                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">Auto Approve If Date Crossed</p>
                      <p className="text-xs text-[#64748b]">Auto-approve if delayed past date.</p>
                    </div>

                    <Switch
                      checked={Boolean(watched.autoApproval?.autoApproveIfDateCrossed)}
                      onCheckedChange={(checked) =>
                        setValue(
                          "autoApproval",
                          {
                            ...(watched.autoApproval || {
                              autoApprovalAllowed: false,
                              autoApproveIfDateCrossed: false,
                              daysForAutoApproval: 0,
                            }),
                            autoApproveIfDateCrossed: checked,
                          },
                          { shouldValidate: true, shouldDirty: true },
                        )
                      }
                      disabled={isViewMode}
                      className="h-6 w-10 bg-[#dfe7f2] data-[state=checked]:bg-[#1e3a8a]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-semibold uppercase tracking-wide text-[#64748b]">
                      Days For Auto Approval <span className="text-red-500">*</span>
                    </Label>

                    <Input
                      {...register("autoApproval.daysForAutoApproval", { 
                        valueAsNumber: true,
                        required: "Days for auto approval is required"
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.autoApproval?.daysForAutoApproval ? "border-red-500 ring-red-500" : ""
                      }`}
                    />

                    {showErrors && errors.autoApproval?.daysForAutoApproval && (
                      <p className="text-xs text-red-600">{errors.autoApproval.daysForAutoApproval.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Leave Combination Rules" />
                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  {/* Cannot Combine With (Prefix) */}
                  <div className="space-y-3">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Cannot Combine With (Prefix)
                    </Label>
                    
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <div className="flex bg-muted/50 rounded-lg border">
                          <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-32">
                            <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                            <Select value={prefixSearchField} onValueChange={(v: "code" | "name") => setPrefixSearchField(v)}>
                              <SelectTrigger className="w-full h-6 border-none p-0 text-sm focus:ring-0 bg-transparent shadow-none">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="code">Code</SelectItem>
                                <SelectItem value="name">Name</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1 flex items-center bg-background rounded-r-lg">
                            <div className="relative flex-1">
                              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                value={prefixSearchTerm}
                                onChange={(e) => setPrefixSearchTerm(e.target.value)}
                                className="pl-10 h-10 border-none bg-transparent"
                                placeholder="Search..."
                              />
                            </div>
                          </div>
                        </div>
                        
                        {addPrefixOpen && !isViewMode && (
                          <div className="absolute z-30 left-0 top-full mt-3 w-[min(720px,100%)]">
                            <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3">
                              <div className="flex bg-muted/50 rounded-lg border">
                                <div className="flex-1 flex items-center bg-background rounded-l-lg">
                                  <div className="relative flex-1">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                      value={addPrefixSearchTerm}
                                      onChange={(e) => setAddPrefixSearchTerm(e.target.value)}
                                      className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                                      placeholder={`Search by ${prefixSearchField === "code" ? "code" : "name"}...`}
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setAddPrefixOpen(false)}
                                  className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                                  aria-label="Close"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              
                              <div className="border rounded-lg bg-white">
                                <Command shouldFilter={false} className="rounded-lg">
                                  {addFilteredPrefixOptions.length > 0 && (
                                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (allAddPrefixFilteredSelected) {
                                            setValue("cannotCombineWith", { 
                                              ...(watched.cannotCombineWith || { prefix: [], postfix: [] }), 
                                              prefix: prefixSelected.filter((code: string) => !addFilteredPrefixOptions.some((option) => option.leaveCode === code)) 
                                            }, { shouldValidate: true, shouldDirty: true })
                                          } else {
                                            const merged = [...prefixSelected]
                                            addFilteredPrefixOptions.forEach((option) => {
                                              if (!merged.includes(option.leaveCode)) merged.push(option.leaveCode)
                                            })
                                            setValue("cannotCombineWith", { 
                                              ...(watched.cannotCombineWith || { prefix: [], postfix: [] }), 
                                              prefix: merged 
                                            }, { shouldValidate: true, shouldDirty: true })
                                          }
                                        }}
                                        className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                                      >
                                        <Check className={`h-4 w-4 rounded-sm border ${allAddPrefixFilteredSelected ? "opacity-100 text-green-600 border-green-500" : "opacity-70 text-transparent border-gray-300"}`} />
                                        <span>Select all ({addFilteredPrefixOptions.length})</span>
                                      </button>
                                    </div>
                                  )}
                                  <CommandList className="max-h-[200px]">
                                    <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                                      No leave types found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {addFilteredPrefixOptions.map((item) => {
                                        const isSelected = prefixSelected.includes(item.leaveCode)
                                        return (
                                          <CommandItem
                                            key={item.leaveCode}
                                            value={`${item.leaveCode}-${item.leaveTitle}`}
                                            onSelect={() => {
                                              if (isSelected) {
                                                setValue("cannotCombineWith", { 
                                                  ...(watched.cannotCombineWith || { prefix: [], postfix: [] }), 
                                                  prefix: prefixSelected.filter((code: string) => code !== item.leaveCode) 
                                                }, { shouldValidate: true, shouldDirty: true })
                                              } else {
                                                setValue("cannotCombineWith", { 
                                                  ...(watched.cannotCombineWith || { prefix: [], postfix: [] }), 
                                                  prefix: [...prefixSelected, item.leaveCode] 
                                                }, { shouldValidate: true, shouldDirty: true })
                                              }
                                            }}
                                            className="cursor-pointer"
                                          >
                                            <Check className={`mr-2 h-4 w-4 rounded-sm border ${isSelected ? "opacity-100 text-green-600 border-green-500" : "opacity-70 text-transparent border-gray-300"}`} />
                                            <div className="flex-1">
                                              <div className="font-medium text-sm">{item.leaveTitle || "N/A"}</div>
                                              <div className="text-xs text-gray-500">Code: {item.leaveCode}</div>
                                            </div>
                                          </CommandItem>
                                        )
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {!isViewMode && (
                        <Button
                          type="button"
                          onClick={() => setAddPrefixOpen((p) => !p)}
                          className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                        >
                          Add
                        </Button>
                      )}
                    </div>

                    <div className="border rounded-lg bg-slate-50/40">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                              Code
                            </TableHead>
                            <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                              Name
                            </TableHead>
                            {!isViewMode && (
                              <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                                Action
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedPrefixSelected.length > 0 ? (
                            paginatedPrefixSelected.map((item) => (
                              <TableRow key={item.leaveCode} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                                <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                                  {item.leaveCode}
                                </TableCell>
                                <TableCell className="py-1.5 text-sm text-gray-900">
                                  {item.leaveTitle}
                                </TableCell>
                                {!isViewMode && (
                                  <TableCell className="py-1.5 pr-4 text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                                      onClick={() => setValue("cannotCombineWith", { 
                                        ...(watched.cannotCombineWith || { prefix: [], postfix: [] }), 
                                        prefix: prefixSelected.filter((c: string) => c !== item.leaveCode) 
                                      }, { shouldValidate: true, shouldDirty: true })}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={isViewMode ? 2 : 3} className="py-8 text-center text-sm text-gray-500">
                                No leave types selected.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      
                      {filteredPrefixSelected.length > pageSize && (
                        <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                          <p className="text-[11px] text-gray-500">
                            Showing{" "}
                            <span className="font-semibold">
                              {Math.min((prefixPage - 1) * pageSize + 1, filteredPrefixSelected.length)}-
                              {Math.min(prefixPage * pageSize, filteredPrefixSelected.length)}
                            </span>{" "}
                            of <span className="font-semibold">{filteredPrefixSelected.length}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[11px]"
                              disabled={prefixPage === 1}
                              onClick={() => setPrefixPage((p) => Math.max(1, p - 1))}
                            >
                              Prev
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[11px]"
                              disabled={prefixPage * pageSize >= filteredPrefixSelected.length}
                              onClick={() => setPrefixPage((p) => p + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cannot Combine With (Postfix) */}
                  <div className="space-y-3">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Cannot Combine With (Postfix)
                    </Label>
                    
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <div className="flex bg-muted/50 rounded-lg border">
                          <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-32">
                            <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                            <Select value={postfixSearchField} onValueChange={(v: "code" | "name") => setPostfixSearchField(v)}>
                              <SelectTrigger className="w-full h-6 border-none p-0 text-sm focus:ring-0 bg-transparent shadow-none">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="code">Code</SelectItem>
                                <SelectItem value="name">Name</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex-1 flex items-center bg-background rounded-r-lg">
                            <div className="relative flex-1">
                              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                value={postfixSearchTerm}
                                onChange={(e) => setPostfixSearchTerm(e.target.value)}
                                className="pl-10 h-10 border-none bg-transparent"
                                placeholder="Search..."
                              />
                            </div>
                          </div>
                        </div>
                        
                        {addPostfixOpen && !isViewMode && (
                          <div className="absolute z-30 left-0 top-full mt-3 w-[min(720px,100%)]">
                            <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3">
                              <div className="flex bg-muted/50 rounded-lg border">
                                <div className="flex-1 flex items-center bg-background rounded-l-lg">
                                  <div className="relative flex-1">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                      value={addPostfixSearchTerm}
                                      onChange={(e) => setAddPostfixSearchTerm(e.target.value)}
                                      className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                                      placeholder={`Search by ${postfixSearchField === "code" ? "code" : "name"}...`}
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setAddPostfixOpen(false)}
                                  className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                                  aria-label="Close"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              
                              <div className="border rounded-lg bg-white">
                                <Command shouldFilter={false} className="rounded-lg">
                                  {addFilteredPostfixOptions.length > 0 && (
                                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (allAddPostfixFilteredSelected) {
                                            setValue("cannotCombineWith", { 
                                              ...(watched.cannotCombineWith || { prefix: [], postfix: [] }), 
                                              postfix: postfixSelected.filter((code: string) => !addFilteredPostfixOptions.some((option) => option.leaveCode === code)) 
                                            }, { shouldValidate: true, shouldDirty: true })
                                          } else {
                                            const merged = [...postfixSelected]
                                            addFilteredPostfixOptions.forEach((option) => {
                                              if (!merged.includes(option.leaveCode)) merged.push(option.leaveCode)
                                            })
                                            setValue("cannotCombineWith", { 
                                              ...(watched.cannotCombineWith || { prefix: [], postfix: [] }), 
                                              postfix: merged 
                                            }, { shouldValidate: true, shouldDirty: true })
                                          }
                                        }}
                                        className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                                      >
                                        <Check className={`h-4 w-4 rounded-sm border ${allAddPostfixFilteredSelected ? "opacity-100 text-green-600 border-green-500" : "opacity-70 text-transparent border-gray-300"}`} />
                                        <span>Select all ({addFilteredPostfixOptions.length})</span>
                                      </button>
                                    </div>
                                  )}
                                  <CommandList className="max-h-[200px]">
                                    <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                                      No leave types found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {addFilteredPostfixOptions.map((item) => {
                                        const isSelected = postfixSelected.includes(item.leaveCode)
                                        return (
                                          <CommandItem
                                            key={item.leaveCode}
                                            value={`${item.leaveCode}-${item.leaveTitle}`}
                                            onSelect={() => {
                                              if (isSelected) {
                                                setValue("cannotCombineWith", { 
                                                  ...(watched.cannotCombineWith || { prefix: [], postfix: [] }), 
                                                  postfix: postfixSelected.filter((code: string) => code !== item.leaveCode) 
                                                }, { shouldValidate: true, shouldDirty: true })
                                              } else {
                                                setValue("cannotCombineWith", { 
                                                  ...(watched.cannotCombineWith || { prefix: [], postfix: [] }), 
                                                  postfix: [...postfixSelected, item.leaveCode] 
                                                }, { shouldValidate: true, shouldDirty: true })
                                              }
                                            }}
                                            className="cursor-pointer"
                                          >
                                            <Check className={`mr-2 h-4 w-4 rounded-sm border ${isSelected ? "opacity-100 text-green-600 border-green-500" : "opacity-70 text-transparent border-gray-300"}`} />
                                            <div className="flex-1">
                                              <div className="font-medium text-sm">{item.leaveTitle || "N/A"}</div>
                                              <div className="text-xs text-gray-500">Code: {item.leaveCode}</div>
                                            </div>
                                          </CommandItem>
                                        )
                                      })}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {!isViewMode && (
                        <Button
                          type="button"
                          onClick={() => setAddPostfixOpen((p) => !p)}
                          className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                        >
                          Add
                        </Button>
                      )}
                    </div>

                    <div className="border rounded-lg bg-slate-50/40">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                              Code
                            </TableHead>
                            <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                              Name
                            </TableHead>
                            {!isViewMode && (
                              <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                                Action
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedPostfixSelected.length > 0 ? (
                            paginatedPostfixSelected.map((item) => (
                              <TableRow key={item.leaveCode} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                                <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                                  {item.leaveCode}
                                </TableCell>
                                <TableCell className="py-1.5 text-sm text-gray-900">
                                  {item.leaveTitle}
                                </TableCell>
                                {!isViewMode && (
                                  <TableCell className="py-1.5 pr-4 text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                                      onClick={() => setValue("cannotCombineWith", { 
                                        ...(watched.cannotCombineWith || { prefix: [], postfix: [] }), 
                                        postfix: postfixSelected.filter((c: string) => c !== item.leaveCode) 
                                      }, { shouldValidate: true, shouldDirty: true })}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={isViewMode ? 2 : 3} className="py-8 text-center text-sm text-gray-500">
                                No leave types selected.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      
                      {filteredPostfixSelected.length > pageSize && (
                        <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                          <p className="text-[11px] text-gray-500">
                            Showing{" "}
                            <span className="font-semibold">
                              {Math.min((postfixPage - 1) * pageSize + 1, filteredPostfixSelected.length)}-
                              {Math.min(postfixPage * pageSize, filteredPostfixSelected.length)}
                            </span>{" "}
                            of <span className="font-semibold">{filteredPostfixSelected.length}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[11px]"
                              disabled={postfixPage === 1}
                              onClick={() => setPostfixPage((p) => Math.max(1, p - 1))}
                            >
                              Prev
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[11px]"
                              disabled={postfixPage * pageSize >= filteredPostfixSelected.length}
                              onClick={() => setPostfixPage((p) => p + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <SubFormTitle title="Additional Policy Settings" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">Allowed In Notice Period</p>
                      <p className="text-xs text-[#64748b]">Allow leave during notice period.</p>
                    </div>

                    <Switch
                      checked={Boolean(watched.allowedInNoticePeriod)}
                      onCheckedChange={(checked) =>
                        setValue("allowedInNoticePeriod", checked, { shouldValidate: true, shouldDirty: true })
                      }
                      disabled={isViewMode}
                      className="h-6 w-10 bg-[#dfe7f2] data-[state=checked]:bg-[#1e3a8a]"
                    />
                  </div>

                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">Delegate Applicable</p>
                      <p className="text-xs text-[#64748b]">Allow approval delegation.</p>
                    </div>

                    <Switch
                      checked={Boolean(watched.delegateApplicable)}
                      onCheckedChange={(checked) =>
                        setValue("delegateApplicable", checked, { shouldValidate: true, shouldDirty: true })
                      }
                      disabled={isViewMode}
                      className="h-6 w-10 bg-[#dfe7f2] data-[state=checked]:bg-[#1e3a8a]"
                    />
                  </div>

                  <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">Alert Manager After Approval</p>
                      <p className="text-xs text-[#64748b]">Notify manager after leave is approved.</p>
                    </div>

                    <Switch
                      checked={Boolean(watched.alertManagerAfterApproval)}
                      onCheckedChange={(checked) =>
                        setValue("alertManagerAfterApproval", checked, { shouldValidate: true, shouldDirty: true })
                      }
                      disabled={isViewMode}
                      className="h-6 w-10 bg-[#dfe7f2] data-[state=checked]:bg-[#1e3a8a]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Reminder Frequency To Approver <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("reminderFrequencyToApprover", { 
                        valueAsNumber: true,
                        required: "Reminder frequency is required"
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.reminderFrequencyToApprover ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.reminderFrequencyToApprover && (
                      <p className="text-xs text-red-600">{errors.reminderFrequencyToApprover.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Alert Manager Days Before Leave Start <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("alertManagerDaysBeforeLeaveStart", { 
                        valueAsNumber: true,
                        required: "Alert manager days is required"
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.alertManagerDaysBeforeLeaveStart ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.alertManagerDaysBeforeLeaveStart && (
                      <p className="text-xs text-red-600">{errors.alertManagerDaysBeforeLeaveStart.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Maximum Back Days Application Allowed <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("maximumBackDaysApplicationAllowed", { 
                        valueAsNumber: true,
                        required: "Maximum back days is required"
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.maximumBackDaysApplicationAllowed ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.maximumBackDaysApplicationAllowed && (
                      <p className="text-xs text-red-600">{errors.maximumBackDaysApplicationAllowed.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Maximum Future Days Application Allowed <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("maximumFutureDaysApplicationAllowed", { 
                        valueAsNumber: true,
                        required: "Maximum future days is required"
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.maximumFutureDaysApplicationAllowed ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.maximumFutureDaysApplicationAllowed && (
                      <p className="text-xs text-red-600">{errors.maximumFutureDaysApplicationAllowed.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Require Docs If Leave Days Exceeds <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("requireDocsIfLeaveDaysExceeds", { 
                        valueAsNumber: true,
                        required: "Require docs threshold is required"
                      })}
                      type="number"
                      min={0}
                      disabled={isViewMode}
                      className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.requireDocsIfLeaveDaysExceeds ? "border-red-500 ring-red-500" : ""
                      }`}
                    />
                    {showErrors && errors.requireDocsIfLeaveDaysExceeds && (
                      <p className="text-xs text-red-600">{errors.requireDocsIfLeaveDaysExceeds.message}</p>
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
              {isViewMode ? "View Only" : postLoading ? "Submitting..." : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}