"use client"

import { useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Landmark, X } from "lucide-react"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/serach/use-aggregate-array-fetch"
import { toast } from "react-toastify"
import SingleSelectField from "@/components/fields/single-select-field"
import {
  createEmptyLWFContribution,
  lwfContributionItemSchema,
  type LWFContributionCollection,
  type LWFContributionItem,
} from "../../schemas/lwf-contribution.schema"

type Mode = "add" | "edit" | "view"

type LWFFormField = "contribution" | "country" | "state" | "effectiveFrom"

type Props = {
  open: boolean
  isViewMode?: boolean
  initialValue: LWFContributionItem | null
  mode?: Mode
  rowId?: string | null
  tenantCode?: string
  lwf: LWFContributionCollection
  editIndex: number | null
  refetchLwf?: () => Promise<void> | void
  onSaved?: () => Promise<void> | void
  onClose: () => void
  onSubmit: (nextRows: LWFContributionItem[]) => void
}

const INPUT_CLASS = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export default function EmployeeLWFContributionsFormPopup({
  open,
  isViewMode,
  initialValue,
  mode = "add",
  rowId = null,
  tenantCode: propTenantCode,
  lwf,
  editIndex,
  refetchLwf,
  onSaved,
  onClose,
  onSubmit,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode
  const pendingRowsRef = useRef<LWFContributionItem[] | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
    setValue,
    watch,
  } = useForm<LWFContributionItem>({
    resolver: zodResolver(lwfContributionItemSchema),
    defaultValues: createEmptyLWFContribution("employee"),
  })

  const selectedCountry = watch("country")

  // Fetch country and state options from organization
  const organizationCriteria = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode],
  )

  const { arrayData: countryArray } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteria,
    arrayField: "country",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: stateArray } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteria,
    arrayField: "state",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const countryOptions = useMemo(
    () =>
      (countryArray || []).map((c: any) => ({
        value: c.countryCode,
        label: c.countryName,
      })),
    [countryArray],
  )

  const stateOptions = useMemo(() => {
    if (!selectedCountry) return []
    const seen = new Set<string>()
    return (stateArray || [])
      .filter(
        (s: any) =>
          s.countryCode === selectedCountry ||
          s.countryCode === selectedCountry.substring(0, 2) ||
          selectedCountry.startsWith(s.countryCode),
      )
      .filter((s: any) => {
        if (seen.has(s.stateCode)) return false
        seen.add(s.stateCode)
        return true
      })
      .map((s: any) => ({
        value: s.stateCode,
        label: s.region ? `${s.stateName} - ${s.region}` : s.stateName,
      }))
  }, [stateArray, selectedCountry])

  const { post, loading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, LWFFormField> = {
          contribution: "contribution",
          country: "country",
          state: "state",
          effectiveFrom: "effectiveFrom",
        }
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField = fieldMap[fieldName] ?? fieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField as any, { type: "server", message })
        })
        pendingRowsRef.current = null
        return
      }
      toast.success(`Employee LWF contribution ${initialValue ? "updated" : "saved"} successfully`)
      if (pendingRowsRef.current) {
        onSubmit(pendingRowsRef.current)
        pendingRowsRef.current = null
      }
      await refetchLwf?.()
      await onSaved?.()
    },
    onError: () => {
      pendingRowsRef.current = null
      toast.error("Failed to save employee LWF contribution")
    },
  })

  useEffect(() => {
    if (!open) return
    if (initialValue) {
      reset({
        parseID: initialValue.parseID,
        contributionType: "employee",
        contribution: initialValue.contribution,
        country: initialValue.country,
        state: initialValue.state,
        effectiveFrom: initialValue.effectiveFrom,
      })
    } else {
      reset(createEmptyLWFContribution("employee"))
    }
  }, [open, initialValue, reset])

  if (!open) return null

  const handleFormSubmit = (data: LWFContributionItem) => {
    clearErrors()

    const item: LWFContributionItem = {
      ...data,
      contributionType: "employee",
      parseID: data.parseID || initialValue?.parseID || crypto.randomUUID(),
    }

    // Build the full updated employee rows — EDIT replaces at index, ADD appends
    const existingRows = (lwf.employee || []).map((row, index) => ({
      ...row,
      contributionType: "employee" as const,
      parseID: `employee-${row.state || "state"}-${row.effectiveFrom || "date"}-${index}`,
    }))

    const nextRows =
      editIndex !== null
        ? existingRows.map((row, index) => (index === editIndex ? item : row))
        : [...existingRows, item]

    // For the item being submitted: include parseID if editing, strip if new
    const { parseID: _parseID, contributionType: _ct, ...itemWithoutParseID } = item
    const itemServerPayload = initialValue ? { parseID: item.parseID, ...itemWithoutParseID } : itemWithoutParseID

    // Build server rows: use determined payload for current item, strip client IDs from unchanged rows
    const serverEmployeeRows = nextRows.map((row, idx) => {
      const isCurrentItem = editIndex !== null ? idx === editIndex : idx === nextRows.length - 1
      if (isCurrentItem) return itemServerPayload
      const { parseID: _p, contributionType: _c, ...serverRow } = row
      return serverRow
    })

    pendingRowsRef.current = nextRows

    post?.({
      tenant: tenantCode,
      action: mode === "edit" && rowId ? "update" : "insert",
      ...(mode === "edit" && rowId ? { id: rowId } : {}),
      collectionName: "wageEmployerContributions",
      event: "validate",
      ruleId: "wageEmployerContributionsLWFEmployeeValidator",
      data: {
        lwf: {
          employee: serverEmployeeRows,
        },
        tenantCode,
        organizationCode: tenantCode,
        updatedOn: new Date().toISOString(),
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="w-full h-full flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Landmark className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {initialValue ? "Edit Employee LWF Contribution" : "Add Employee LWF Contribution"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Fill Labour Welfare Fund contribution details.</p>
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

          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-3">
              <SubFormTitle title="Employee LWF Contribution Information" />

              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Contribution (Rs.) <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("contribution", { valueAsNumber: true })}
                  className={`${INPUT_CLASS} ${errors.contribution ? "border-red-500" : ""}`}
                  type="number"
                  min={0}
                  disabled={isViewMode}
                />
                {errors.contribution?.message && (
                  <p className="text-red-500 text-xs">{errors.contribution.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <SingleSelectField
                    label="Country"
                    required
                    placeholder="Select Country"
                    value={selectedCountry || ""}
                    disabled={isViewMode}
                    onChange={(value) => {
                      setValue("country", value, { shouldValidate: true })
                      setValue("state", "", { shouldValidate: false })
                    }}
                    options={countryOptions}
                  />
                  {errors.country?.message && (
                    <p className="text-red-500 text-xs">{errors.country.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <SingleSelectField
                    label="State"
                    required
                    placeholder={selectedCountry ? "Select State" : "Select a country first"}
                    value={watch("state") || ""}
                    disabled={isViewMode || !selectedCountry}
                    onChange={(value) => setValue("state", value, { shouldValidate: true })}
                    options={stateOptions}
                  />
                  {errors.state?.message && (
                    <p className="text-red-500 text-xs">{errors.state.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Effective From <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("effectiveFrom")}
                  className={`${INPUT_CLASS} ${errors.effectiveFrom ? "border-red-500" : ""}`}
                  type="date"
                  disabled={isViewMode}
                />
                {errors.effectiveFrom?.message && (
                  <p className="text-red-500 text-xs">{errors.effectiveFrom.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              onClick={onClose}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={Boolean(isViewMode) || isSubmitting || loading}
            >
              {loading ? "Saving..." : initialValue ? "Save" : "Add Employee LWF"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
