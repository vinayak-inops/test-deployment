"use client"

import { useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { X, RotateCcw } from "lucide-react"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { toast } from "react-toastify"

export type OtRoundingItem = {
  parseID?: string
  from: number
  to: number
  roundOffTo: number
}

type OtRoundingFormField = "from" | "to" | "roundOffTo"

const roundingItemSchema = z
  .object({
    from: z.number().min(0, "From must be 0 or greater"),
    to: z.number().min(0, "To must be 0 or greater"),
    roundOffTo: z.number().min(0, "Round off to must be 0 or greater"),
    parseID: z.string().optional(),
  })
  .refine((v) => v.to >= v.from, {
    message: "To must be greater than or equal to From",
    path: ["to"],
  })

type FormData = z.infer<typeof roundingItemSchema>

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"

type Props = {
  open: boolean
  isViewMode?: boolean
  initialItem: OtRoundingItem | null
  onClose: () => void
  onSubmit: (item: OtRoundingItem) => void
  tenantCode?: string
  rowId?: string | null
}

const FIELDS: { name: OtRoundingFormField; label: string }[] = [
  { name: "from", label: "From" },
  { name: "to", label: "To" },
  { name: "roundOffTo", label: "Round Off To" },
]

const fieldMap: Record<string, OtRoundingFormField> = {
  from: "from",
  to: "to",
  roundOffTo: "roundOffTo",
}

export default function OtRoundingFormPopup({
  open,
  isViewMode,
  initialItem,
  onClose,
  onSubmit,
  tenantCode: propTenantCode,
  rowId,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode
  const pendingItemRef = useRef<OtRoundingItem | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors,
  } = useForm<FormData>({
    resolver: zodResolver(roundingItemSchema),
    defaultValues: { from: 0, to: 0, roundOffTo: 0 },
  })

  const { post: postRounding, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: (response) => {
      console.log("Validation response:", response)
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
    onError: (error) => {
      toast.error("OT rounding submission failed!")
      console.error("POST error:", error)
    },
  })

  useEffect(() => {
    if (!open) return
    reset(initialItem ?? { from: 0, to: 0, roundOffTo: 0, parseID: crypto.randomUUID() })
  }, [open, initialItem, reset])

  if (!open) return null

  const handleFormSubmit = (data: FormData) => {
    clearErrors()
    const item: OtRoundingItem = {
      parseID: data.parseID || initialItem?.parseID || crypto.randomUUID(),
      from: data.from,
      to: data.to,
      roundOffTo: data.roundOffTo,
    }
    pendingItemRef.current = item
    const { parseID: _parseID, ...payloadWithoutParseID } = item
    const serverPayload = initialItem ? item : payloadWithoutParseID
    console.log("Submitting OT rounding item:", {
      tenant: tenantCode,
      action: "update",
      collectionName: "ot_policy",
      event: "validate",
      id: rowId,
      ruleId: "otPolicyRoundingValidator",
      data: {
        otPolicy: {
          rounding: [serverPayload],
        },
      },
    })
    postRounding({
      tenant: tenantCode,
      action: "update",
      collectionName: "ot_policy",
      event: "validate",
      id: rowId,
      ruleId: "otPolicyRoundingValidator",
      data: {
        otPolicy: {
          rounding: [serverPayload],
        },
      },
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="w-full h-full flex flex-col overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <RotateCcw className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {initialItem ? "Edit Rounding" : "Add Rounding"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Fill rounding details.</p>
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
            <SubFormTitle title="Rounding Information" />
            <div className="space-y-4">
              {FIELDS.map(({ name, label }) => (
                <div key={name} className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {label} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    {...register(name, { valueAsNumber: true })}
                    className={`${INPUT_CLASS} ${errors[name] ? "border-red-500" : ""}`}
                    type="number"
                    min={0}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    disabled={isViewMode}
                  />
                  {errors[name]?.message && (
                    <p className="text-red-500 text-xs">{errors[name]?.message}</p>
                  )}
                </div>
              ))}
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
              {postLoading ? "Saving..." : initialItem ? "Save" : "Add Row"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
