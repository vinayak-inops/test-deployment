"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardFooter } from "@repo/ui/components/ui/card"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import { X, BadgeDollarSign, Hash, CalendarDays } from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import SingleSelectField from "@/components/fields/single-select-field"
import { toast } from "react-toastify"
import { Button } from "@repo/ui/components/ui/button"
import {
  defaultEwaContractorOutstandingValues,
  ewaContractorOutstandingSchema,
  type EwaContractorOutstandingFormValues,
} from "./schema/ewa-contractor-outstanding-form.schema"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTH_OPTIONS = [
  { value: "1",  label: "January"   },
  { value: "2",  label: "February"  },
  { value: "3",  label: "March"     },
  { value: "4",  label: "April"     },
  { value: "5",  label: "May"       },
  { value: "6",  label: "June"      },
  { value: "7",  label: "July"      },
  { value: "8",  label: "August"    },
  { value: "9",  label: "September" },
  { value: "10", label: "October"   },
  { value: "11", label: "November"  },
  { value: "12", label: "December"  },
]

const currentYear = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => {
  const y = currentYear - 5 + i
  return { value: String(y), label: String(y) }
})

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  isOpen:    boolean
  mode?:     "add" | "edit" | "view"
  recordId?: string | null
  onClose:   () => void
  onSaved?:  () => Promise<void> | void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EwaContractorOutstandingAddPopup({
  isOpen,
  mode = "add",
  recordId = null,
  onClose,
  onSaved,
}: Props) {
  const tenantCode         = useGetTenantCode()
  const { employeeId }     = useKeyclockRoleInfo()
  const [loading, setLoading]         = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [showErrors, setShowErrors]   = useState(false)
  const [formData, setFormData]       = useState<EwaContractorOutstandingFormValues>(
    defaultEwaContractorOutstandingValues
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const wasOpenRef    = useRef(false)
  const hasFetchedRef = useRef(false)

  const isViewMode = mode === "view"
  const isEditMode = mode === "edit"
  const isAddMode  = mode === "add"

  // ── Fetch single record ────────────────────────────────────────────────────

  const searchApiCriteria = useMemo(() => {
    if (!recordId || (!isEditMode && !isViewMode)) return null
    return [
      { field: "_id",        operator: "eq", value: recordId      },
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
    ]
  }, [recordId, isEditMode, isViewMode, tenantCode])

  const { loading: recordLoading, refetch: fetchRecord } = useRequest<any[]>({
    url:          "EWA_contractor_outstanding/search",
    method:       "POST",
    data:         searchApiCriteria || [],
    dependencies: [searchApiCriteria],
    enabled:      Boolean(searchApiCriteria),
    onSuccess: (data: any[]) => {
      const record = Array.isArray(data) && data.length > 0 ? data[0] : null
      if (record) {
        setFormData({
          contractorCode:   record?.contractorCode   || "",
          month:            typeof record?.month === "number" ? record.month : new Date().getMonth() + 1,
          year:             typeof record?.year  === "number" ? record.year  : new Date().getFullYear(),
          totalOutstanding: typeof record?.totalOutstanding === "number" ? record.totalOutstanding : 0,
          paid:             !!record?.paid,
          paidOn:           record?.paidOn ? record.paidOn.split("T")[0] : null,
        })
      } else if (recordId) {
        toast.error("Record not found")
        onClose()
      }
      setFetchingData(false)
    },
    onError: () => {
      toast.error("Failed to load record data")
      setFetchingData(false)
      onClose()
    },
  })

  // ── Open / close lifecycle ─────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      if ((isEditMode || isViewMode) && recordId && searchApiCriteria) {
        if (!hasFetchedRef.current || !wasOpenRef.current) {
          setFetchingData(true)
          fetchRecord()
          hasFetchedRef.current = true
        }
      } else if (isAddMode) {
        setFormData(defaultEwaContractorOutstandingValues)
        hasFetchedRef.current = false
      }
      setErrors({})
      setShowErrors(false)
    } else {
      hasFetchedRef.current = false
      setFormData(defaultEwaContractorOutstandingValues)
    }
    wasOpenRef.current = isOpen
  }, [isOpen, mode, recordId, isEditMode, isViewMode, isAddMode, searchApiCriteria])

  // ── ESC key handler ────────────────────────────────────────────────────────

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

  // ── POST ───────────────────────────────────────────────────────────────────

  const { post } = usePostRequest<any>({
    url: "EWA_contractor_outstanding",
    onSuccess: async () => {
      toast.success(
        `EWA contractor outstanding record ${isEditMode ? "updated" : "created"} successfully`
      )
      await onSaved?.()
      setLoading(false)
      onClose()
    },
    onError: () => {
      setLoading(false)
    },
  })

  // ── Submit ─────────────────────────────────────────────────────────────────

  const submit = async () => {
    if (isViewMode) return
    setShowErrors(true)
    const parsed = ewaContractorOutstandingSchema.safeParse(formData)
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".")
        if (!nextErrors[key]) nextErrors[key] = issue.message
      }
      setErrors(nextErrors)
      toast.error("Please fix the validation errors before saving")
      return
    }
    setErrors({})
    setLoading(true)
    try {
      await post({
        tenant:         tenantCode,
        action:         isEditMode ? "update" : "insert",
        id:             isEditMode ? recordId : null,
        collectionName: "EWA_contractor_outstanding",
        event:          "ewaContractorOutstanding",
        data: {
          ...parsed.data,
          tenantCode,
          updatedBy: employeeId ?? null,
          updatedOn: new Date().toISOString(),
        },
      })
    } catch (error) {
      console.error("Submit error:", error)
      setLoading(false)
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  const clearError = (key: string) => {
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
    }
  }

  const setField = <K extends keyof EwaContractorOutstandingFormValues>(
    key: K,
    value: EwaContractorOutstandingFormValues[K]
  ) => {
    if (isViewMode) return
    setFormData((prev) => ({ ...prev, [key]: value }))
    clearError(key)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading && !fetchingData) onClose()
  }

  const fieldStyles =
    "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"

  if (!isOpen) return null

  const isLoadingData = fetchingData || recordLoading

  const getTitle = () => {
    if (isViewMode) return "View Record"
    if (isEditMode) return "Edit Record"
    return "Add New Record"
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-2xl max-h-[90vh] flex flex-col">
        <Card className="border border-gray-200 bg-white shadow-sm flex flex-col h-full overflow-hidden">

          {/* Header */}
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center gap-2">
                <BadgeDollarSign className="h-5 w-5 text-blue-600" />
                EWA Contractor Outstanding — {getTitle()}
              </CardTitle>
              <button
                type="button"
                onClick={onClose}
                disabled={loading || isLoadingData}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          {/* Body */}
          <CardContent className="px-6 py-4 overflow-y-auto flex-1">
            {isLoadingData && (
              <div className="py-12 text-center text-sm text-gray-600">
                Loading record data...
              </div>
            )}

            {!isLoadingData && (
              <form
                onSubmit={(e) => { e.preventDefault(); submit() }}
                className="space-y-6"
              >
                {/* ── Contractor & Period ───────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Contractor & Period" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Contractor Code */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        Contractor Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="text"
                        value={formData.contractorCode}
                        onChange={(e) => setField("contractorCode", e.target.value)}
                        className={`${fieldStyles} bg-white ${
                          showErrors && errors.contractorCode ? "border-red-500" : ""
                        } ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        placeholder="e.g. CON001"
                        disabled={isViewMode}
                      />
                      {showErrors && errors.contractorCode && (
                        <p className="text-xs text-red-600 mt-1">{errors.contractorCode}</p>
                      )}
                    </div>

                    {/* Month */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Month"
                        placeholder="Select Month"
                        value={String(formData.month)}
                        onChange={(v) => setField("month", Number(v))}
                        options={MONTH_OPTIONS}
                        required={true}
                        disabled={isViewMode}
                      />
                      {showErrors && errors.month && (
                        <p className="text-xs text-red-600 mt-1">{errors.month}</p>
                      )}
                    </div>

                    {/* Year */}
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Year"
                        placeholder="Select Year"
                        value={String(formData.year)}
                        onChange={(v) => setField("year", Number(v))}
                        options={YEAR_OPTIONS}
                        required={true}
                        disabled={isViewMode}
                      />
                      {showErrors && errors.year && (
                        <p className="text-xs text-red-600 mt-1">{errors.year}</p>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* ── Outstanding & Payment ─────────────────────────────── */}
                <div className="space-y-3">
                  <SubFormTitle title="Outstanding & Payment" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Total Outstanding */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
                        <BadgeDollarSign className="h-3 w-3" />
                        Total Outstanding (₹) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        step={0.01}
                        value={formData.totalOutstanding}
                        onChange={(e) =>
                          setField("totalOutstanding", parseFloat(e.target.value) || 0)
                        }
                        className={`${fieldStyles} bg-white ${
                          showErrors && errors.totalOutstanding ? "border-red-500" : ""
                        } ${isViewMode ? "bg-gray-50 cursor-not-allowed" : ""}`}
                        placeholder="e.g. 50000"
                        disabled={isViewMode}
                      />
                      {showErrors && errors.totalOutstanding && (
                        <p className="text-xs text-red-600 mt-1">{errors.totalOutstanding}</p>
                      )}
                    </div>

                    {/* Paid Toggle */}
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Payment Status <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex items-center gap-3 h-9">
                        <button
                          type="button"
                          disabled={isViewMode}
                          onClick={() => {
                            if (isViewMode) return
                            setField("paid", !formData.paid)
                            if (formData.paid) setField("paidOn", null)
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            formData.paid ? "bg-blue-600" : "bg-gray-300"
                          } ${isViewMode ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.paid ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                        <span className="text-sm text-gray-700">
                          {formData.paid ? "Paid" : "Unpaid"}
                        </span>
                      </div>
                    </div>

                    {/* Paid On — only shown when paid = true */}
                    {formData.paid && (
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          Paid On
                        </Label>
                        <Input
                          type="date"
                          value={formData.paidOn ?? ""}
                          onChange={(e) =>
                            setField("paidOn", e.target.value || null)
                          }
                          className={`${fieldStyles} bg-white ${
                            isViewMode ? "bg-gray-50 cursor-not-allowed" : ""
                          }`}
                          disabled={isViewMode}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </form>
            )}
          </CardContent>

          {/* Footer */}
          <CardFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            {isViewMode ? (
              <Button
                type="button"
                onClick={onClose}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Close
              </Button>
            ) : (
              <ActionButtons
                layout="end"
                gap="gap-3"
                secondaryLabel="Cancel"
                onSecondary={onClose}
                primaryLabel="Save Changes"
                onPrimary={submit}
                primaryLoading={loading}
                primaryDisabled={loading || isLoadingData}
                secondaryDisabled={loading || isLoadingData}
                primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
                secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              />
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}