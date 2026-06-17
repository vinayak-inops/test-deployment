"use client"

import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@repo/ui/components/ui/button"
import { Link2, X } from "lucide-react"
import { SubFormTitle } from "@/components/header/sub-form-title"
import SingleSelectField from "@/components/fields/single-select-field"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { dependentSalaryHeadItemSchema, type DependentSalaryHeadFormValues } from "./dependent-salary-heads.schema"
import { toast } from "react-toastify"

type Props = {
  open: boolean
  initialValue: string | null
  rowId?: string | null
  tenantCode?: string
  existingRows: string[]
  editIndex: number | null
  refetchRows?: () => Promise<void> | void
  onClose: () => void
  onSubmit: (value: string) => void
}

export default function DependentSalaryHeadsFormPopup({
  open,
  initialValue,
  rowId,
  tenantCode: propTenantCode,
  existingRows,
  editIndex,
  refetchRows,
  onClose,
  onSubmit,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const resolvedTenantCode = propTenantCode || hookTenantCode

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<DependentSalaryHeadFormValues>({
    resolver: zodResolver(dependentSalaryHeadItemSchema),
    defaultValues: { value: "" },
  })

  const selectedValue = watch("value")

  const salaryHeadCriteria = useMemo(
    () =>
      resolvedTenantCode
        ? [{ field: "tenantCode", operator: "eq", value: resolvedTenantCode }]
        : [],
    [resolvedTenantCode],
  )

  const { data: salaryHeadData, loading: salaryHeadLoading } = useRequest<any[]>({
    url: "wageSalaryHeads/search",
    method: "POST",
    data: salaryHeadCriteria,
    dependencies: [resolvedTenantCode],
  })

  const salaryHeadOptions = useMemo(
    () =>
      (Array.isArray(salaryHeadData) ? salaryHeadData : []).map((item: any) => ({
        value: item?.name || "",
        label: `${item?.name || ""} `,
      })),
    [salaryHeadData],
  )

  const { post, loading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          if (fieldName.includes("dependentSalaryHead") || fieldName === "value") {
            setError("value", { type: "server", message })
          }
        })
        return
      }
      toast.success(initialValue ? "Dependent salary head updated successfully!" : "Dependent salary head added successfully!")
      onSubmit(selectedValue)
      await refetchRows?.()
    },
    onError: () => {
      toast.error("Failed to save dependent salary head!")
    },
  })

  useEffect(() => {
    if (!open) return
    reset({ value: initialValue || "" })
  }, [open, initialValue, reset])

  if (!open) return null

  const handleFormSubmit = (data: DependentSalaryHeadFormValues) => {
    clearErrors()
    const isDuplicate = existingRows.some(
      (row, i) => row.toLowerCase() === data.value.toLowerCase() && i !== editIndex,
    )
    if (isDuplicate) {
      toast.error("This dependent salary head has already been added")
      return
    }

    const nextRows =
      editIndex !== null
        ? existingRows.map((r, i) => (i === editIndex ? data.value : r))
        : [...existingRows, data.value]

    post?.({
      tenant: resolvedTenantCode,
      action: "update",
      id: rowId,
      collectionName: "employeeWageTemplate",
      event: "validate",
      ruleId: "employeeWageTemplateDependentSalaryHeadsValidator",
      data: {
        dependentSalaryHeads: nextRows,
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
                <Link2 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {initialValue ? "Edit Dependent Salary Head" : "Add Dependent Salary Head"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {initialValue ? "Update dependent salary head." : "Select a dependent salary head to add."}
                </p>
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
              <SubFormTitle title="Dependent Salary Head Information" />
              <div className="space-y-2">
                <SingleSelectField
                  label="Dependent Salary Head"
                  placeholder={salaryHeadLoading ? "Loading..." : "Select Dependent Salary Head"}
                  value={selectedValue}
                  disabled={Boolean(initialValue)}
                  onChange={(value) => setValue("value", value, { shouldValidate: true })}
                  options={salaryHeadOptions}
                  required
                  errorMessage={errors.value?.message}
                />
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
              disabled={isSubmitting || loading}
            >
              {loading ? "Saving..." : initialValue ? "Update" : "Add Dependent Salary Head"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
