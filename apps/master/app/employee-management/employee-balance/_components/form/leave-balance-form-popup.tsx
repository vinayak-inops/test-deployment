"use client"

import { useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQuery, gql } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { X, BookOpen } from "lucide-react"
import SingleSelectField from "@/components/fields/single-select-field"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { toast } from "react-toastify"

const LEAVE_POLICY_QUERY = gql`
  query FetchLeavePolicy($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchLeavePolicy(criteriaRequests: $criteriaRequests, collection: $collection) {
      leavePolicy {
        leaveCode
        leaveTitle
      }
      employeeCategory
    }
  }
`

export type LeaveBalanceItem = {
  parseID?: string
  leaveTitle: string
  leaveCode: string
  unitOfTime: string
  beginningYearBalance: number
  carryoverBalance: number
  absencePaidYearToDate: number
  absencePaidInPeriod: number
  beginningPeriodBalance: number
  accruedInPeriod: number
  carryoverForfeitedInPeriod: number
  encashed: number
  includeEventsAwaitingApproval: number
  asOfPeriod: string
  balance: number
  encashable: number
}

type LeaveBalanceFormField = keyof Omit<LeaveBalanceItem, "parseID">

const leaveBalanceItemSchema = z.object({
  parseID: z.string().optional(),
  leaveTitle: z.string().min(1, "Leave title is required"),
  leaveCode: z.string().min(1, "Leave code is required"),
  unitOfTime: z.string().min(1, "Unit of time is required"),
  beginningYearBalance: z.number().min(0, "Must be 0 or greater"),
  carryoverBalance: z.number().min(0, "Must be 0 or greater"),
  absencePaidYearToDate: z.number().min(0, "Must be 0 or greater"),
  absencePaidInPeriod: z.number().min(0, "Must be 0 or greater"),
  beginningPeriodBalance: z.number().min(0, "Must be 0 or greater"),
  accruedInPeriod: z.number().min(0, "Must be 0 or greater"),
  carryoverForfeitedInPeriod: z.number().min(0, "Must be 0 or greater"),
  encashed: z.number().min(0, "Must be 0 or greater"),
  includeEventsAwaitingApproval: z.number().min(0, "Must be 0 or greater"),
  asOfPeriod: z.string().min(1, "As of period is required"),
  balance: z.number().min(0, "Must be 0 or greater"),
  encashable: z.number().min(0, "Must be 0 or greater"),
})

type FormData = z.infer<typeof leaveBalanceItemSchema>

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"

type Props = {
  open: boolean
  isViewMode?: boolean
  initialItem: LeaveBalanceItem | null
  onClose: () => void
  onSubmit: (item: LeaveBalanceItem) => void
  tenantCode?: string
  rowId?: string | null
  subsidiaryCode?: string | null
  locationCode?: string | null
  designationCode?: string | null
  employeeCategory?: string | null
}

const fieldMap: Record<string, LeaveBalanceFormField> = {
  leaveTitle: "leaveTitle",
  leaveCode: "leaveCode",
  unitOfTime: "unitOfTime",
  beginningYearBalance: "beginningYearBalance",
  carryoverBalance: "carryoverBalance",
  absencePaidYearToDate: "absencePaidYearToDate",
  absencePaidInPeriod: "absencePaidInPeriod",
  beginningPeriodBalance: "beginningPeriodBalance",
  accruedInPeriod: "accruedInPeriod",
  carryoverForfeitedInPeriod: "carryoverForfeitedInPeriod",
  encashed: "encashed",
  includeEventsAwaitingApproval: "includeEventsAwaitingApproval",
  asOfPeriod: "asOfPeriod",
  balance: "balance",
  encashable: "encashable",
}

const DEFAULT_VALUES: FormData = {
  leaveTitle: "",
  leaveCode: "",
  unitOfTime: "",
  beginningYearBalance: 0,
  carryoverBalance: 0,
  absencePaidYearToDate: 0,
  absencePaidInPeriod: 0,
  beginningPeriodBalance: 0,
  accruedInPeriod: 0,
  carryoverForfeitedInPeriod: 0,
  encashed: 0,
  includeEventsAwaitingApproval: 0,
  asOfPeriod: "",
  balance: 0,
  encashable: 0,
}

export default function LeaveBalanceFormPopup({
  open,
  isViewMode,
  initialItem,
  onClose,
  onSubmit,
  tenantCode: propTenantCode,
  rowId,
  subsidiaryCode,
  locationCode,
  designationCode,
  employeeCategory,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode
  const pendingItemRef = useRef<LeaveBalanceItem | null>(null)

  const leaveCriteria = useMemo(() => {
    const criteria: any[] = []
    if (tenantCode) criteria.push({ field: "tenantCode", operator: "is", value: tenantCode })
    if (subsidiaryCode) criteria.push({ field: "subsidiary.subsidiaryCode", operator: "eq", value: subsidiaryCode })
    if (locationCode) criteria.push({ field: "location.locationCode", operator: "eq", value: locationCode })
    if (designationCode) criteria.push({ field: "designation.designationCode", operator: "eq", value: designationCode })
    if (employeeCategory) criteria.push({ field: "employeeCategory", operator: "in", value: [employeeCategory] })
    return criteria
  }, [tenantCode, subsidiaryCode, locationCode, designationCode, employeeCategory])

  const { data: leavePolicyData, loading: leaveLoading } = useQuery(LEAVE_POLICY_QUERY, {
    client,
    skip: !tenantCode || !open,
    variables: { criteriaRequests: leaveCriteria, collection: "leave_policy" },
    fetchPolicy: "network-only",
  })

  const leaveOptions = useMemo(() => {
    const list = Array.isArray(leavePolicyData?.fetchLeavePolicy)
      ? leavePolicyData.fetchLeavePolicy
      : []
    return list.flatMap((item: any) => {
      const policy = item?.leavePolicy
      if (Array.isArray(policy)) {
        return policy
          .filter((p: any) => (p?.leaveCode || p?.levcode) && (p?.leaveTitle || p?.leavetitle))
          .map((p: any) => ({
            leaveCode: p.leaveCode || p.levcode,
            leaveTitle: p.leaveTitle || p.leavetitle,
          }))
      }
      if (policy && (policy.leaveCode || policy.levcode) && (policy.leaveTitle || policy.leavetitle)) {
        return [{ leaveCode: policy.leaveCode || policy.levcode, leaveTitle: policy.leaveTitle || policy.leavetitle }]
      }
      return []
    }) as Array<{ leaveCode: string; leaveTitle: string }>
  }, [leavePolicyData])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(leaveBalanceItemSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const { post: postBalance, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField =
            fieldMap[fieldName] ?? fieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField, { type: "server", message })
        })
        return
      }
      if (pendingItemRef.current) {
        onSubmit(pendingItemRef.current)
        pendingItemRef.current = null
      }
    },
    onError: () => {
      toast.error("Leave balance submission failed!")
    },
  })

  useEffect(() => {
    if (!open) return
    reset(
      initialItem
        ? { ...initialItem }
        : { ...DEFAULT_VALUES, parseID: crypto.randomUUID() }
    )
  }, [open, initialItem, reset])

  if (!open) return null

  const handleFormSubmit = (data: FormData) => {
    clearErrors()
    const item: LeaveBalanceItem = {
      parseID: data.parseID || initialItem?.parseID || crypto.randomUUID(),
      leaveTitle: data.leaveTitle,
      leaveCode: data.leaveCode,
      unitOfTime: data.unitOfTime,
      beginningYearBalance: data.beginningYearBalance,
      carryoverBalance: data.carryoverBalance,
      absencePaidYearToDate: data.absencePaidYearToDate,
      absencePaidInPeriod: data.absencePaidInPeriod,
      beginningPeriodBalance: data.beginningPeriodBalance,
      accruedInPeriod: data.accruedInPeriod,
      carryoverForfeitedInPeriod: data.carryoverForfeitedInPeriod,
      encashed: data.encashed,
      includeEventsAwaitingApproval: data.includeEventsAwaitingApproval,
      asOfPeriod: data.asOfPeriod,
      balance: data.balance,
      encashable: data.encashable,
    }
    pendingItemRef.current = item
    const { parseID: _parseID, ...payloadWithoutParseID } = item
    const serverPayload = initialItem ? item : payloadWithoutParseID
    postBalance({
      tenant: tenantCode,
      action: "update",
      collectionName: "leaveBalance",
      event: "validate",
      id: rowId,
      ruleId: "leaveBalanceBalancesValidator",
      data: { balances: [serverPayload] },
    })
  }

  const currentCode = watch("leaveCode")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="w-full h-full flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <BookOpen className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {initialItem ? "Edit Balance" : "Add Balance"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Fill leave balance details.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1 min-h-0">

            {/* Leave Identity */}
            <div className="space-y-4">
              <SubFormTitle title="Leave Identity" />
              <div className="grid grid-cols-2 gap-4">

                {/* Leave Code (sets both code + title) */}
                <SingleSelectField
                  id="leaveCode"
                  label="Leave Code"
                  required
                  placeholder={leaveLoading ? "Loading..." : "Select leave code"}
                  disabled={isViewMode}
                  value={currentCode}
                  onChange={(val) => {
                    const match = leaveOptions.find((o) => o.leaveCode === val)
                    setValue("leaveCode", val, { shouldValidate: true })
                    setValue("leaveTitle", match?.leaveTitle || "", { shouldValidate: true })
                  }}
                  options={leaveOptions.map((o) => ({
                    value: o.leaveCode,
                    label: `${o.leaveCode} — ${o.leaveTitle}`,
                    tooltip: o.leaveTitle,
                  }))}
                  showOnlyValueInTrigger
                  isLoading={leaveLoading}
                  errorMessage={errors.leaveCode?.message ?? errors.leaveTitle?.message}
                  allowOnlyProvidedOptions
                  className="space-y-2"
                />

                {/* Unit of Time */}
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Unit of Time <span className="text-red-500">*</span>
                  </Label>
                  <select
                    {...register("unitOfTime")}
                    disabled={isViewMode}
                    className={`w-full h-9 rounded-md border px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${errors.unitOfTime ? "border-red-500" : "border-gray-300"}`}
                  >
                    <option value="">Select unit</option>
                    <option value="Days">Days</option>
                    <option value="Hours">Hours</option>
                  </select>
                  {errors.unitOfTime?.message && (
                    <p className="text-red-500 text-xs">{errors.unitOfTime.message}</p>
                  )}
                </div>

                {/* As of Period */}
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    As of Period <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("asOfPeriod")}
                    type="date"
                    className={`${INPUT_CLASS} ${errors.asOfPeriod ? "border-red-500" : ""}`}
                    disabled={isViewMode}
                  />
                  {errors.asOfPeriod?.message && (
                    <p className="text-red-500 text-xs">{errors.asOfPeriod.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Year Balances */}
            <div className="space-y-4">
              <SubFormTitle title="Year Balances" />
              <div className="grid grid-cols-3 gap-4">
                {(
                  [
                    { name: "beginningYearBalance", label: "Beginning Year Balance" },
                    { name: "carryoverBalance", label: "Carryover Balance" },
                    { name: "absencePaidYearToDate", label: "Absence Paid YTD" },
                  ] as { name: LeaveBalanceFormField; label: string }[]
                ).map(({ name, label }) => (
                  <div key={name} className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {label}
                    </Label>
                    <Input
                      {...register(name, { valueAsNumber: true })}
                      type="number"
                      min={0}
                      step="0.01"
                      className={`${INPUT_CLASS} ${errors[name] ? "border-red-500" : ""}`}
                      disabled={isViewMode}
                    />
                    {errors[name]?.message && (
                      <p className="text-red-500 text-xs">{errors[name]?.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Period Balances */}
            <div className="space-y-4">
              <SubFormTitle title="Period Balances" />
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { name: "beginningPeriodBalance", label: "Beginning Period Balance" },
                    { name: "accruedInPeriod", label: "Accrued in Period" },
                    { name: "absencePaidInPeriod", label: "Absence Paid in Period" },
                    { name: "carryoverForfeitedInPeriod", label: "Carryover Forfeited in Period" },
                  ] as { name: LeaveBalanceFormField; label: string }[]
                ).map(({ name, label }) => (
                  <div key={name} className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {label}
                    </Label>
                    <Input
                      {...register(name, { valueAsNumber: true })}
                      type="number"
                      min={0}
                      step="0.01"
                      className={`${INPUT_CLASS} ${errors[name] ? "border-red-500" : ""}`}
                      disabled={isViewMode}
                    />
                    {errors[name]?.message && (
                      <p className="text-red-500 text-xs">{errors[name]?.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="space-y-4">
              <SubFormTitle title="Summary" />
              <div className="grid grid-cols-2 gap-4">
                {(
                  [
                    { name: "encashed", label: "Encashed" },
                    { name: "includeEventsAwaitingApproval", label: "Awaiting Approval" },
                    { name: "balance", label: "Balance" },
                    { name: "encashable", label: "Encashable" },
                  ] as { name: LeaveBalanceFormField; label: string }[]
                ).map(({ name, label }) => (
                  <div key={name} className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {label}
                    </Label>
                    <Input
                      {...register(name, { valueAsNumber: true })}
                      type="number"
                      min={0}
                      step="0.01"
                      className={`${INPUT_CLASS} ${errors[name] ? "border-red-500" : ""}`}
                      disabled={isViewMode}
                    />
                    {errors[name]?.message && (
                      <p className="text-red-500 text-xs">{errors[name]?.message}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              onClick={onClose}
              disabled={isSubmitting || postLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={Boolean(isViewMode) || isSubmitting || postLoading}
            >
              {postLoading ? "Saving..." : initialItem ? "Save" : "Add Row"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
