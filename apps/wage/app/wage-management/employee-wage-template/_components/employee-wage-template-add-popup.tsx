"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { X } from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"
import { toast } from "react-toastify"
import EmployeeSearchField from "@/components/fields/employee-search"
import {
  employeeWageTemplateSchema,
  type EmployeeWageTemplateFormValues,
} from "./schemas/employee-wage-template-form.schema"

interface Props {
  isOpen: boolean
  mode?: "add" | "edit"
  recordId?: string | null
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

const createEmptyFormValues = (): EmployeeWageTemplateFormValues => ({
  employeeID: "",
  effectiveFrom: "",
  effectiveTo: "",
  remark: "",
  dependentSalaryHeads: [],
  independentSalaryHeads: [],
})

const getDocumentId = (id: EmployeeWageTemplateFormValues["_id"] | string | null | undefined) => {
  if (!id) return null
  if (typeof id === "string") return id
  return id.$oid
}

const serverFieldMap: Record<string, string> = {
  employeeID: "employeeID",
  effectiveFrom: "effectiveFrom",
  effectiveTo: "effectiveTo",
  remark: "remark",
  dependentSalaryHeads: "dependentSalaryHeads",
}

export default function EmployeeWageTemplateAddPopup({
  isOpen,
  mode = "add",
  recordId = null,
  onClose,
  onSaved,
}: Props) {
  const router = useRouter()
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()

  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [formData, setFormData] = useState<EmployeeWageTemplateFormValues>(createEmptyFormValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalErrors, setGeneralErrors] = useState<string[]>([])

  const wasOpenRef = useRef(false)
  const hasFetchedRef = useRef(false)

  const { refetch: fetchRecord, loading: recordLoading } = useRequest<any>({
    url: recordId && mode === "edit" ? `employeeWageTemplate/${recordId}` : "",
    method: "GET",
    onSuccess: (data: any) => {
      if (data) {
        setFormData({
          _id: data?._id,
          tenantCode: data?.tenantCode ?? "",
          organizationCode: data?.organizationCode ?? "",
          employeeID: data?.employeeID ?? "",
          effectiveFrom: data?.effectiveFrom ?? "",
          effectiveTo: data?.effectiveTo ?? "",
          remark: data?.remark ?? "",
          dependentSalaryHeads: Array.isArray(data?.dependentSalaryHeads) ? data.dependentSalaryHeads : [],
          independentSalaryHeads: [],
        })
      }
      setFetchingData(false)
    },
    onError: () => {
      setFetchingData(false)
    },
  })

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && recordId) {
        if (!hasFetchedRef.current || wasOpenRef.current === false) {
          setFetchingData(true)
          fetchRecord()
          hasFetchedRef.current = true
        }
      } else if (mode === "add") {
        setFormData(createEmptyFormValues())
        hasFetchedRef.current = false
      }
      setErrors({})
      setShowErrors(false)
    } else {
      hasFetchedRef.current = false
      setFormData(createEmptyFormValues())
    }
    wasOpenRef.current = isOpen
  }, [isOpen, mode, recordId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading && !fetchingData) onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, loading, fetchingData])

  const { post } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const nextErrors: Record<string, string> = {}
        const unmapped: string[] = []
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const mapped = serverFieldMap[fieldName] ?? serverFieldMap[fieldName.split(".").pop() || ""]
          if (!mapped) { unmapped.push(message); return }
          nextErrors[mapped] = message
        })
        setErrors((prev) => ({ ...prev, ...nextErrors }))
        if (unmapped.length > 0) setGeneralErrors(unmapped)
        setLoading(false)
        return
      }

      toast.success(`Employee Wage Template ${mode === "edit" ? "updated" : "created"} successfully`)
      await onSaved?.()
      setLoading(false)

      const createdId = response?.data?._id ?? response?.data?.id ?? response?._id ?? response?.id
      if (createdId && mode !== "edit") {
        router.push(
          `/wage-management/employee-wage-template?mode=edit&id=${encodeURIComponent(String(createdId))}`
        )
      } else {
        onClose()
      }
    },
    onError: () => {
      toast.error(`Failed to ${mode === "edit" ? "update" : "create"} employee wage template`)
      setLoading(false)
    },
  })

  const submit = async () => {
    setShowErrors(true)

    const parsed = employeeWageTemplateSchema.safeParse(formData)
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".")
        if (!nextErrors[path]) nextErrors[path] = issue.message
      }
      setErrors(nextErrors)
      toast.error("Please fix the validation errors before saving")
      return
    }

    setErrors({})
    setGeneralErrors([])
    setLoading(true)

    const { _id, tenantCode: parsedTenantCode, organizationCode: parsedOrganizationCode, ...rest } = parsed.data
    const resolvedTenantCode = parsedTenantCode ?? tenantCode
    const resolvedOrganizationCode = parsedOrganizationCode ?? resolvedTenantCode
    const resolvedRecordId = mode === "edit" ? recordId ?? getDocumentId(_id) : null

    await post({
      tenant: resolvedTenantCode,
      action: mode === "edit" ? "update" : "insert",
      id: resolvedRecordId,
      collectionName: "employeeWageTemplate",
      event: "validate",
      ruleId: "employeeWageTemplateValidator",
      data: {
        ...rest,
        tenantCode: resolvedTenantCode,
        organizationCode: resolvedOrganizationCode,
        updatedBy: employeeId ?? null,
        updatedOn: new Date().toISOString(),
      },
    })
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading && !fetchingData) onClose()
  }

  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
  const labelStyles = "block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1"
  const errorTextStyles = "text-xs text-red-600 mt-1"

  const DATE_CROSS_FIELDS = new Set(["effectiveTo"])
  const getFieldError = (key: string) =>
    errors[key] && (showErrors || DATE_CROSS_FIELDS.has(key)) ? errors[key] : undefined
  const getFieldStyles = (key: string) =>
    `${fieldStyles} ${getFieldError(key) ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`
  const renderFieldError = (key: string) => {
    const msg = getFieldError(key)
    return msg ? <p className={errorTextStyles}>{msg}</p> : null
  }

  if (!isOpen) return null

  const isLoadingData = fetchingData || recordLoading

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-2xl flex flex-col">
        <Card className="w-full max-h-[90vh] flex flex-col overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">
                Employee Wage Template — {mode === "edit" ? "Edit" : "Add New"}
              </CardTitle>
              <button
                type="button"
                onClick={onClose}
                disabled={loading || isLoadingData}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
            {isLoadingData ? (
              <div className="py-12 text-center text-sm text-gray-600">Loading template data...</div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); submit() }} className="space-y-5">
                {generalErrors.length > 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 space-y-1">
                    {generalErrors.map((msg, i) => <p key={i}>{msg}</p>)}
                  </div>
                )}
                {showErrors && Object.keys(errors).length > 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    Please correct the highlighted fields before saving.
                  </div>
                )}

                {/* Employee Search */}
                <EmployeeSearchField
                  label="Employee"
                  required
                  isOpen={isOpen}
                  preSelectedEmployeeId={formData.employeeID || undefined}
                  errorText={showErrors ? errors.employeeID : undefined}
                  onSelect={(emp) => {
                    setFormData((prev) => ({ ...prev, employeeID: emp.employeeID }))
                    setErrors((prev) => { const n = { ...prev }; delete n.employeeID; return n })
                  }}
                  onClear={() => setFormData((prev) => ({ ...prev, employeeID: "" }))}
                />

                {/* Effective Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className={labelStyles}>Effective From <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      value={formData.effectiveFrom}
                      onChange={(e) => {
                        const from = e.target.value
                        setFormData((prev) => {
                          const to = prev.effectiveTo
                          if (from && to) {
                            if (to < from) {
                              setErrors((err) => ({ ...err, effectiveTo: "Effective To must be on or after Effective From" }))
                            } else {
                              setErrors((err) => { const n = { ...err }; delete n.effectiveTo; return n })
                            }
                          }
                          return { ...prev, effectiveFrom: from }
                        })
                        setErrors((err) => { const n = { ...err }; delete n.effectiveFrom; return n })
                      }}
                      className={getFieldStyles("effectiveFrom")}
                    />
                    {renderFieldError("effectiveFrom")}
                  </div>
                  <div className="space-y-1">
                    <Label className={labelStyles}>Effective To <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      value={formData.effectiveTo}
                      onChange={(e) => {
                        const to = e.target.value
                        setFormData((prev) => {
                          const from = prev.effectiveFrom
                          if (from && to) {
                            if (to < from) {
                              setErrors((err) => ({ ...err, effectiveTo: "Effective To must be on or after Effective From" }))
                            } else {
                              setErrors((err) => { const n = { ...err }; delete n.effectiveTo; return n })
                            }
                          }
                          return { ...prev, effectiveTo: to }
                        })
                      }}
                      className={getFieldStyles("effectiveTo")}
                    />
                    {renderFieldError("effectiveTo")}
                  </div>
                </div>

                {/* Remark */}
                <div className="space-y-1">
                  <Label className={labelStyles}>Remark</Label>
                  <Input
                    value={formData.remark ?? ""}
                    onChange={(e) => setFormData((prev) => ({ ...prev, remark: e.target.value }))}
                    className={fieldStyles}
                    placeholder="Optional remark"
                  />
                </div>
              </form>
            )}
          </CardContent>

          <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
            <ActionButtons
              layout="end"
              secondaryLabel="Cancel"
              onSecondary={onClose}
              primaryLabel="Save"
              onPrimary={submit}
              primaryLoading={loading}
              primaryDisabled={loading || isLoadingData}
              secondaryDisabled={loading || isLoadingData}
              className="w-full"
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
