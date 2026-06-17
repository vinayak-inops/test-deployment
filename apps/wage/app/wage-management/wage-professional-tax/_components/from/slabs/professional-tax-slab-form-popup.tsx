"use client"

import { useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { X, FileText } from "lucide-react"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { toast } from "react-toastify"
import { professionalTaxSlabItemSchema, EMPTY_PROFESSIONAL_TAX_SLAB, type ProfessionalTaxSlabItem } from "../../schemas/professional-tax-slab.schema"

type SlabFormField = "from" | "to" | "amount"

type SlabFormData = {
  parseID?: string
  from: number
  to: number
  amount: number
}

type Props = {
  open: boolean
  isViewMode?: boolean
  initialSlab: ProfessionalTaxSlabItem | null
  onClose: () => void
  onSubmit: (item: ProfessionalTaxSlabItem) => void
  tenantCode?: string
  rowId?: string | null
}

const INPUT_CLASS = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"

export default function ProfessionalTaxSlabFormPopup({
  open,
  isViewMode,
  initialSlab,
  onClose,
  onSubmit,
  tenantCode: propTenantCode,
  rowId,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode
  const pendingItemRef = useRef<ProfessionalTaxSlabItem | null>(null)

  const schema = useMemo(() => professionalTaxSlabItemSchema, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
  } = useForm<SlabFormData>({
    resolver: zodResolver(schema),
    defaultValues: { from: 0, to: 0, amount: 0, parseID: "" },
  })

  const { post: postSlab, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, SlabFormField> = {
          from: "from",
          to: "to",
          amount: "amount",
        }
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField = fieldMap[fieldName] ?? fieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField as any, { type: "server", message })
        })
        return
      }
      if (pendingItemRef.current) {
        onSubmit(pendingItemRef.current)
        pendingItemRef.current = null
      }
    },
    onError: (error) => {
      toast.error("Slab submission failed!")
      console.error("POST error:", error)
    },
  })

  useEffect(() => {
    if (!open) return
    if (initialSlab) {
      reset({
        parseID: initialSlab.parseID,
        from: initialSlab.from,
        to: initialSlab.to,
        amount: initialSlab.amount,
      })
    } else {
      reset({ from: 0, to: 0, amount: 0, parseID: crypto.randomUUID() })
    }
  }, [open, initialSlab, reset])

  if (!open) return null

  const handleFormSubmit = (data: SlabFormData) => {
    clearErrors()
    const item: ProfessionalTaxSlabItem = {
      parseID: data.parseID || initialSlab?.parseID || crypto.randomUUID(),
      from: data.from,
      to: data.to,
      amount: data.amount,
    }
    pendingItemRef.current = item
    const { parseID: _parseID, ...payloadWithoutParseID } = item
    const serverPayload = initialSlab ? item : payloadWithoutParseID
    postSlab({
      tenant: tenantCode,
      action: "update",
      collectionName: "wageProfessionalTax",
      event: "validate",
      id: rowId,
      ruleId: "wageProfessionalTaxSlabValidator",
      data: {
        slabs: [serverPayload],
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
                  {initialSlab ? "Edit Slab" : "Add Slab"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Fill slab details.</p>
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
              <SubFormTitle title="Slab Information" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    From <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("from", { valueAsNumber: true })}
                    className={`${INPUT_CLASS} ${errors.from ? "border-red-500" : ""}`}
                    type="number"
                    min={0}
                    placeholder="Enter starting value"
                    disabled={isViewMode}
                  />
                  {errors.from?.message && <p className="text-red-500 text-xs">{errors.from.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    To <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register("to", { valueAsNumber: true })}
                    className={`${INPUT_CLASS} ${errors.to ? "border-red-500" : ""}`}
                    type="number"
                    min={0}
                    placeholder="Enter ending value"
                    disabled={isViewMode}
                  />
                  {errors.to?.message && <p className="text-red-500 text-xs">{errors.to.message}</p>}
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
                    placeholder="Enter tax amount"
                    disabled={isViewMode}
                  />
                  {errors.amount?.message && <p className="text-red-500 text-xs">{errors.amount.message}</p>}
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
              {postLoading ? "Saving..." : initialSlab ? "Save" : "Add Row"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
