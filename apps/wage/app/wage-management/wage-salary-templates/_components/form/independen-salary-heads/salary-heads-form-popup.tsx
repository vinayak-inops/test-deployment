"use client"

import { useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { X, FileText } from "lucide-react"
import { SubFormTitle } from "@/components/header/sub-form-title"
import SingleSelectField from "@/components/fields/single-select-field"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { salaryHeadItemSchema, type SalaryHeadItem } from "../../schemas/salary-head.schema"
import { toast } from "react-toastify"

type Props = {
  open: boolean
  initialValue: SalaryHeadItem | null
  wageSalaryHeadId?: string | null
  tenantCode?: string
  existingRows: SalaryHeadItem[]
  editIndex: number | null
  refetchRows?: () => Promise<void> | void
  onClose: () => void
  onSubmit: (item: SalaryHeadItem) => void
}

const INPUT_CLASS = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export default function SalaryHeadsFormPopup({
  open,
  initialValue,
  wageSalaryHeadId,
  tenantCode,
  existingRows,
  editIndex,
  refetchRows,
  onClose,
  onSubmit,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const resolvedTenantCode = tenantCode || hookTenantCode
  const pendingItemRef = useRef<SalaryHeadItem | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
  } = useForm<SalaryHeadItem>({
    resolver: zodResolver(salaryHeadItemSchema),
    defaultValues: { salaryHeadCode: "", salaryHeadName: "", amount: 0, parseID: "" },
  })

  const salaryHeadCode = watch("salaryHeadCode")

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
        value: item?.code || "",
        label: item?.name || item?.code || "",
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
        const fieldMap: Record<string, keyof SalaryHeadItem> = {
          salaryHeadCode: "salaryHeadCode",
          salaryHeadName: "salaryHeadName",
          amount: "amount",
        }
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField = fieldMap[fieldName] ?? fieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField as any, { type: "server", message })
        })
        pendingItemRef.current = null
        return
      }
      toast.success(initialValue ? "Salary head updated successfully!" : "Salary head added successfully!")
      if (pendingItemRef.current) {
        onSubmit(pendingItemRef.current)
        pendingItemRef.current = null
      }
      await refetchRows?.()
    },
    onError: () => {
      pendingItemRef.current = null
      toast.error("Failed to save salary head!")
    },
  })

  useEffect(() => {
    if (!open) return
    if (initialValue) {
      reset({
        salaryHeadCode: initialValue.salaryHeadCode,
        salaryHeadName: initialValue.salaryHeadName,
        amount: initialValue.amount,
        parseID: initialValue.parseID,
      })
    } else {
      reset({ salaryHeadCode: "", salaryHeadName: "", amount: 0, parseID: crypto.randomUUID() })
    }
  }, [open, initialValue, reset])

  if (!open) return null

  const handleFormSubmit = (data: SalaryHeadItem) => {
    clearErrors()
    const isDuplicate = existingRows.some(
      (row, i) => row.salaryHeadCode === data.salaryHeadCode && i !== editIndex,
    )
    if (isDuplicate) {
      toast.error("This salary head has already been added")
      return
    }

    const item: SalaryHeadItem = {
      parseID: data.parseID || initialValue?.parseID || crypto.randomUUID(),
      salaryHeadCode: data.salaryHeadCode,
      salaryHeadName: data.salaryHeadName,
      amount: data.amount,
    }

    pendingItemRef.current = item

    const { parseID: _parseID, ...itemWithoutParseID } = item
    const serverItem = initialValue ? item : itemWithoutParseID

    const nextRows =
      editIndex !== null
        ? existingRows.map((r, i) => (i === editIndex ? serverItem : r))
        : [...existingRows, serverItem]

    post?.({
      tenant: resolvedTenantCode,
      action: "update",
      id: wageSalaryHeadId,
      collectionName: "wageSalaryTemplates",
      event: "validate",
      ruleId: "wageSalaryTemplatesIndependentSalaryHeadsValidator",
      data: {
        independentSalaryHeads: nextRows,
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
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {initialValue ? "Edit Salary Head" : "Add Salary Head"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {initialValue ? "Update salary head information." : "Select a salary head and enter amount."}
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
              <SubFormTitle title="Salary Head Information" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <SingleSelectField
                    label="Salary Head"
                    placeholder={salaryHeadLoading ? "Loading..." : "Select Salary Head"}
                    value={salaryHeadCode}
                    disabled={Boolean(initialValue)}
                    onChange={(value) => {
                      const selected = (Array.isArray(salaryHeadData) ? salaryHeadData : []).find(
                        (x: any) => (x?.code || "") === value,
                      )
                      setValue("salaryHeadCode", value, { shouldValidate: true })
                      setValue("salaryHeadName", selected?.name || "", { shouldValidate: true })
                    }}
                    options={salaryHeadOptions}
                    required
                    errorMessage={errors.salaryHeadCode?.message}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Amount <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("amount", { valueAsNumber: true })}
                    className={`${INPUT_CLASS} ${errors.amount ? "border-red-500" : ""}`}
                    type="number"
                    min={0}
                    placeholder="Enter amount"
                  />
                  {errors.amount?.message && (
                    <p className="text-red-500 text-xs">{errors.amount.message}</p>
                  )}
                </div>
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
              {loading ? "Saving..." : initialValue ? "Update" : "Add Salary Head"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
