"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import { X, TrendingUp } from "lucide-react"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "react-toastify"
import { 
  wageEmployerContributionsSchema, 
  type WageEmployerContributionsFormValues
} from "./schemas/wage-employer-contributions-form.schema"

interface Props {
  isOpen: boolean
  mode?: "add" | "edit"
  recordId?: string | null
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

const salaryHeadOptions = [
  { value: "Basic", label: "Basic" },
  { value: "DA", label: "Dearness Allowance (DA)" },
  { value: "HRA", label: "House Rent Allowance (HRA)" },
  { value: "Conveyance", label: "Conveyance" },
  { value: "Special Allowance", label: "Special Allowance" },
]

// Use null or undefined for empty values instead of 0
const createEmptyFormValues = (): WageEmployerContributionsFormValues => ({
  _id: undefined,
  organizationCode: "",
  tenantCode: "",
  pf: {
    enabled: false,
    applicableSalaryHeads: [],
    maxWageLimit: undefined as any,
    employee: {
      contributionRate: undefined as any,
    },
    employer: {
      totalContributionRate: undefined as any,
      breakdown: {
        eps: {
          rate: undefined as any,
        },
        epf: {
          rate: undefined as any,
          description: "",
        },
      },
      adminCharges: {
        rate: undefined as any,
        appliedOn: "",
      },
    },
    edli: {
      enabled: false,
      contributionRate: undefined as any,
      maxWages: undefined as any,
      maxContribution: undefined as any,
      adminCharges: {
        rate: undefined as any,
      },
    },
  },
  esi: {
    enabled: false,
    maxGrossSalaryLimit: undefined as any,
    employee: {
      contributionRate: undefined as any,
    },
    employer: {
      contributionRate: undefined as any,
    },
    applicableSalaryHeads: [],
  },
  lwf: {
    employer: [],
    employee: [],
  },
})

const cloneFormValues = (values: WageEmployerContributionsFormValues): WageEmployerContributionsFormValues =>
  JSON.parse(JSON.stringify(values))

const updateNestedValue = (source: any, path: string[], value: any): any => {
  if (path.length === 0) return value

  const [key, ...rest] = path
  return {
    ...source,
    [key]: updateNestedValue(source?.[key] ?? {}, rest, value),
  }
}

const getDocumentId = (id: WageEmployerContributionsFormValues["_id"] | string | null | undefined) => {
  if (!id) return null
  if (typeof id === "string") return id
  return id.$oid
}

// Helper to format value for display (empty string for undefined/null/0)
const formatValue = (value: any): string => {
  if (value === undefined || value === null || value === 0) return ""
  return value.toString()
}

// Helper to parse number from input
const parseNumber = (value: string): number | undefined => {
  if (!value || value.trim() === "") return undefined
  const num = parseFloat(value)
  return isNaN(num) ? undefined : num
}

export default function WageEmployerContributionsAddPopup({
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
  const [formData, setFormData] = useState<WageEmployerContributionsFormValues>(() =>
    createEmptyFormValues()
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalErrors, setGeneralErrors] = useState<string[]>([])
  const wasOpenRef = useRef(false)
  const hasFetchedRef = useRef(false)

  // Fetch single record for edit mode
  const { refetch: fetchRecord, loading: recordLoading } = useRequest<any>({
    url: recordId && mode === "edit" ? `wageEmployerContributions/${recordId}` : "",
    method: "GET",
    onSuccess: (data: any) => {
      if (data) {
        const mappedData: WageEmployerContributionsFormValues = {
          _id: data?._id,
          organizationCode: data?.organizationCode ?? "",
          tenantCode: data?.tenantCode ?? "",
          pf: {
            enabled: data?.pf?.enabled ?? false,
            applicableSalaryHeads: data?.pf?.applicableSalaryHeads ?? [],
            maxWageLimit: data?.pf?.maxWageLimit ?? undefined,
            employee: {
              contributionRate: data?.pf?.employee?.contributionRate ?? undefined,
            },
            employer: {
              totalContributionRate: data?.pf?.employer?.totalContributionRate ?? undefined,
              breakdown: {
                eps: {
                  rate: data?.pf?.employer?.breakdown?.eps?.rate ?? undefined,
                },
                epf: {
                  rate: data?.pf?.employer?.breakdown?.epf?.rate ?? undefined,
                  description: data?.pf?.employer?.breakdown?.epf?.description ?? "",
                },
              },
              adminCharges: {
                rate: data?.pf?.employer?.adminCharges?.rate ?? undefined,
                appliedOn: data?.pf?.employer?.adminCharges?.appliedOn ?? "",
              },
            },
            edli: {
              enabled: data?.pf?.edli?.enabled ?? false,
              contributionRate: data?.pf?.edli?.contributionRate ?? undefined,
              maxWages: data?.pf?.edli?.maxWages ?? undefined,
              maxContribution: data?.pf?.edli?.maxContribution ?? undefined,
              adminCharges: {
                rate: data?.pf?.edli?.adminCharges?.rate ?? undefined,
              },
            },
          },
          esi: {
            enabled: data?.esi?.enabled ?? false,
            maxGrossSalaryLimit: data?.esi?.maxGrossSalaryLimit ?? undefined,
            employee: {
              contributionRate: data?.esi?.employee?.contributionRate ?? undefined,
            },
            employer: {
              contributionRate: data?.esi?.employer?.contributionRate ?? undefined,
            },
            applicableSalaryHeads: data?.esi?.applicableSalaryHeads ?? [],
          },
          lwf: {
            employer: [],
            employee: [],
          },
        }
        setFormData(mappedData)
      }
      setFetchingData(false)
    },
    onError: (error: any) => {
      console.error("Error fetching record:", error)
      setFetchingData(false)
    },
  })

  // Reset form and fetch data when opening
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

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading && !fetchingData) {
        onClose()
      }
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

  const serverFieldMap: Record<string, string> = {
    "pf.maxWageLimit": "pf.maxWageLimit",
    "pf.applicableSalaryHeads": "pf.applicableSalaryHeads",
    "pf.employee.contributionRate": "pf.employee.contributionRate",
    "pf.employer.totalContributionRate": "pf.employer.totalContributionRate",
    "pf.employer.breakdown.eps.rate": "pf.employer.breakdown.eps.rate",
    "pf.employer.breakdown.epf.rate": "pf.employer.breakdown.epf.rate",
    "pf.employer.adminCharges.rate": "pf.employer.adminCharges.rate",
    "pf.employer.adminCharges.appliedOn": "pf.employer.adminCharges.appliedOn",
    "pf.edli.contributionRate": "pf.edli.contributionRate",
    "pf.edli.maxWages": "pf.edli.maxWages",
    "pf.edli.maxContribution": "pf.edli.maxContribution",
    "pf.edli.adminCharges.rate": "pf.edli.adminCharges.rate",
    "esi.maxGrossSalaryLimit": "esi.maxGrossSalaryLimit",
    "esi.applicableSalaryHeads": "esi.applicableSalaryHeads",
    "esi.employee.contributionRate": "esi.employee.contributionRate",
    "esi.employer.contributionRate": "esi.employer.contributionRate",
  }

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

          const normalizedField =
            serverFieldMap[fieldName] ??
            serverFieldMap[fieldName.split(".").slice(-2).join(".")] ??
            serverFieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) {
            unmapped.push(message)
            return
          }
          nextErrors[normalizedField] = message
        })
        setErrors((prev) => ({ ...prev, ...nextErrors }))
        if (unmapped.length > 0) setGeneralErrors(unmapped)
        setLoading(false)
        return
      }

      toast.success(`Wage Employer Contributions ${mode === "edit" ? "updated" : "created"} successfully`)
      await onSaved?.()
      setLoading(false)

      const createdId = response?.data?._id ?? response?.data?.id ?? response?._id ?? response?.id
      if (createdId && mode !== "edit") {
        router.push(`/wage-management/wage-employer-contributions?mode=edit&id=${encodeURIComponent(String(createdId))}`)
      } else {
        onClose()
      }
    },
    onError: () => {
      toast.error(`Failed to ${mode === "edit" ? "update" : "create"} wage employer contributions`)
      setLoading(false)
    },
  })

  const submit = async () => {
    setShowErrors(true)
    
    // Clean up data: convert undefined to 0 for validation
    const cleanedData = JSON.parse(JSON.stringify(formData))
    
    // Helper to convert undefined to 0 for number fields
    const cleanNumbers = (obj: any) => {
      for (const key in obj) {
        if (obj[key] && typeof obj[key] === "object") {
          cleanNumbers(obj[key])
        } else if (typeof obj[key] === "undefined" && key !== "description" && key !== "appliedOn") {
          obj[key] = 0
        }
      }
    }
    cleanNumbers(cleanedData)
    
    const submitData: WageEmployerContributionsFormValues = {
      ...cleanedData,
      lwf: {
        employer: [],
        employee: [],
      },
    }

    const parsed = wageEmployerContributionsSchema.safeParse(submitData)
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const path = issue.path.join(".")
        if (!nextErrors[path]) {
          nextErrors[path] = issue.message
        }
      }
      setErrors(nextErrors)
      toast.error("Please fix the validation errors before saving")
      return
    }
    setErrors({})
    setGeneralErrors([])
    setLoading(true)

    const { _id, tenantCode: parsedTenantCode, organizationCode: parsedOrganizationCode, ...contributionData } = parsed.data
    const resolvedTenantCode = parsedTenantCode ?? tenantCode
    const resolvedOrganizationCode = parsedOrganizationCode ?? resolvedTenantCode
    const resolvedRecordId = mode === "edit" ? recordId ?? getDocumentId(_id) : null

    await post({
      tenant: resolvedTenantCode,
      action: mode === "edit" ? "update" : "insert",
      id: resolvedRecordId,
      collectionName: "wageEmployerContributions",
      event: "validate",
      ruleId: "wageEmployerContributionsPFAndESIValidator",
      data: {
        ...contributionData,
        tenantCode: resolvedTenantCode,
        organizationCode: resolvedOrganizationCode,
        updatedBy: employeeId ?? null,
        updatedOn: new Date().toISOString(),
      },
    })
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading && !fetchingData) {
      onClose()
    }
  }

  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
  const labelStyles = "block text-xs font-medium text-gray-700 uppercase tracking-wide mb-1"
  const subsectionTitleStyles = "text-sm font-semibold text-gray-700"
  const errorTextStyles = "text-xs text-red-600 mt-1"

  const getFieldError = (key: string) => (showErrors ? errors[key] : undefined)
  const getFieldStyles = (key: string) =>
    `${fieldStyles} ${getFieldError(key) ? "border-red-500 focus:border-red-500 focus:ring-red-500" : ""}`
  const validationSummaryMessage =
    errors["pf.enabled"] && errors["esi.enabled"]
      ? errors["pf.enabled"]
      : "Please correct the highlighted fields before saving."
  const renderFieldError = (key: string) => {
    const message = getFieldError(key)
    return message ? <p className={errorTextStyles}>{message}</p> : null
  }

  // PF Helper Functions
  const updatePfField = (path: string[], value: any) => {
    setFormData((prev: any) => {
      const newPf = updateNestedValue(prev.pf, path, value)
      return { ...prev, pf: newPf }
    })
    
    const errorKey = `pf.${path.join(".")}`
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  // ESI Helper Functions
  const updateEsiField = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      esi: {
        ...prev.esi,
        [field]: value,
      },
    }))
    
    const errorKey = `esi.${field}`
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  const updateEsiNestedField = (path: string[], value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      esi: updateNestedValue(prev.esi, path, value),
    }))
    
    const errorKey = `esi.${path.join(".")}`
    if (errors[errorKey]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[errorKey]
        return newErrors
      })
    }
  }

  const totalEmployerContribution = useMemo(() => {
    const pfRate = formData.pf.enabled ? (formData.pf.employer.totalContributionRate || 0) : 0
    const esiRate = formData.esi.enabled ? (formData.esi.employer.contributionRate || 0) : 0
    return pfRate + esiRate
  }, [formData.pf.enabled, formData.pf.employer.totalContributionRate, formData.esi.enabled, formData.esi.employer.contributionRate])
  
  const formatRate = (value: number) => Number(value.toFixed(2)).toString()

  if (!isOpen) return null

  const isLoadingData = fetchingData || recordLoading

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-4xl flex flex-col">
        <Card className="w-full max-h-[90vh] flex flex-col overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">
                Wage Employer Contributions - {mode === "edit" ? "Edit" : "Add New"}
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

          <CardContent className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
            {isLoadingData && isOpen && (
              <div className="py-12 text-center text-sm text-gray-600">
                Loading configuration data...
              </div>
            )}
            
            {!isLoadingData && (
              <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-6">
                {generalErrors.length > 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 space-y-1">
                    {generalErrors.map((msg, i) => (
                      <p key={i}>{msg}</p>
                    ))}
                  </div>
                )}
                {showErrors && Object.keys(errors).length > 0 && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {validationSummaryMessage}
                  </div>
                )}
                
                {/* PF Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SubFormTitle title="Provident Fund (PF)" />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="pf-enabled"
                        checked={formData.pf.enabled}
                        onCheckedChange={(checked: any) => updatePfField(["enabled"], checked)}
                      />
                      <Label htmlFor="pf-enabled" className="text-sm text-gray-600">Enable PF</Label>
                    </div>
                  </div>

                  {formData.pf.enabled && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className={labelStyles}>Max Wage Limit (Rs.)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formatValue(formData.pf.maxWageLimit)}
                            onChange={(e) => updatePfField(["maxWageLimit"], parseNumber(e.target.value))}
                            className={getFieldStyles("pf.maxWageLimit")}
                            placeholder="Enter max wage limit"
                          />
                          {renderFieldError("pf.maxWageLimit")}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className={labelStyles}>Applicable Salary Heads</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border bg-slate-50/40 p-3">
                            {salaryHeadOptions.map((head) => (
                              <div key={head.value} className="flex items-center gap-2">
                                <Checkbox
                                  checked={formData.pf.applicableSalaryHeads.includes(head.value)}
                                  onCheckedChange={(checked) => {
                                    const current = formData.pf.applicableSalaryHeads
                                    const updated = checked
                                      ? [...current, head.value]
                                      : current.filter((h: string) => h !== head.value)
                                    updatePfField(["applicableSalaryHeads"], updated)
                                  }}
                                />
                                <Label className="text-sm">{head.label}</Label>
                              </div>
                            ))}
                          </div>
                          {renderFieldError("pf.applicableSalaryHeads")}
                        </div>
                      </div>

                      <Separator className="my-2" />

                      <div className="space-y-3">
                        <Label className={subsectionTitleStyles}>Employee Contribution</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className={labelStyles}>Contribution Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formatValue(formData.pf.employee.contributionRate)}
                              onChange={(e) => updatePfField(["employee", "contributionRate"], parseNumber(e.target.value))}
                              className={getFieldStyles("pf.employee.contributionRate")}
                              placeholder="Enter contribution rate"
                            />
                            {renderFieldError("pf.employee.contributionRate")}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className={subsectionTitleStyles}>Employer Contribution</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className={labelStyles}>Total Contribution Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formatValue(formData.pf.employer.totalContributionRate)}
                              onChange={(e) => updatePfField(["employer", "totalContributionRate"], parseNumber(e.target.value))}
                              className={getFieldStyles("pf.employer.totalContributionRate")}
                              placeholder="Enter total contribution rate"
                            />
                            {renderFieldError("pf.employer.totalContributionRate")}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className={labelStyles}>EPS Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formatValue(formData.pf.employer.breakdown.eps.rate)}
                              onChange={(e) => updatePfField(["employer", "breakdown", "eps", "rate"], parseNumber(e.target.value))}
                              className={getFieldStyles("pf.employer.breakdown.eps.rate")}
                              placeholder="Enter EPS rate"
                            />
                            {renderFieldError("pf.employer.breakdown.eps.rate")}
                          </div>
                          <div className="space-y-2">
                            <Label className={labelStyles}>EPF Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formatValue(formData.pf.employer.breakdown.epf.rate)}
                              onChange={(e) => updatePfField(["employer", "breakdown", "epf", "rate"], parseNumber(e.target.value))}
                              className={getFieldStyles("pf.employer.breakdown.epf.rate")}
                              placeholder="Enter EPF rate"
                            />
                            {renderFieldError("pf.employer.breakdown.epf.rate")}
                          </div>
                          <div className="space-y-2">
                            <Label className={labelStyles}>EPF Description</Label>
                            <Input
                              placeholder="Description"
                              value={formData.pf.employer.breakdown.epf.description}
                              onChange={(e) => updatePfField(["employer", "breakdown", "epf", "description"], e.target.value)}
                              className={fieldStyles}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className={labelStyles}>Admin Charges Rate (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={formatValue(formData.pf.employer.adminCharges.rate)}
                              onChange={(e) => updatePfField(["employer", "adminCharges", "rate"], parseNumber(e.target.value))}
                              className={getFieldStyles("pf.employer.adminCharges.rate")}
                              placeholder="Enter admin charges rate"
                            />
                            {renderFieldError("pf.employer.adminCharges.rate")}
                          </div>
                          <div className="space-y-2">
                            <Label className={labelStyles}>Applied On</Label>
                            <Input
                              value={formData.pf.employer.adminCharges.appliedOn}
                              onChange={(e) => updatePfField(["employer", "adminCharges", "appliedOn"], e.target.value)}
                              className={getFieldStyles("pf.employer.adminCharges.appliedOn")}
                              placeholder="employer_total_contribution"
                            />
                            {renderFieldError("pf.employer.adminCharges.appliedOn")}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className={subsectionTitleStyles}>EDLI (Employee Deposit Linked Insurance)</Label>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="edli-enabled"
                              checked={formData.pf.edli.enabled}
                              onCheckedChange={(checked: any) => updatePfField(["edli", "enabled"], checked)}
                            />
                            <Label htmlFor="edli-enabled" className="text-sm text-gray-600">Enable EDLI</Label>
                          </div>
                        </div>
                        
                        {formData.pf.edli.enabled && (
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label className={labelStyles}>Contribution Rate (%)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formatValue(formData.pf.edli.contributionRate)}
                                onChange={(e) => updatePfField(["edli", "contributionRate"], parseNumber(e.target.value))}
                                className={getFieldStyles("pf.edli.contributionRate")}
                                placeholder="Enter contribution rate"
                              />
                              {renderFieldError("pf.edli.contributionRate")}
                            </div>
                            <div className="space-y-2">
                              <Label className={labelStyles}>Max Wages (Rs.)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={formatValue(formData.pf.edli.maxWages)}
                                onChange={(e) => updatePfField(["edli", "maxWages"], parseNumber(e.target.value))}
                                className={getFieldStyles("pf.edli.maxWages")}
                                placeholder="Enter max wages"
                              />
                              {renderFieldError("pf.edli.maxWages")}
                            </div>
                            <div className="space-y-2">
                              <Label className={labelStyles}>Max Contribution (Rs.)</Label>
                              <Input
                                type="number"
                                min="0"
                                value={formatValue(formData.pf.edli.maxContribution)}
                                onChange={(e) => updatePfField(["edli", "maxContribution"], parseNumber(e.target.value))}
                                className={getFieldStyles("pf.edli.maxContribution")}
                                placeholder="Enter max contribution"
                              />
                              {renderFieldError("pf.edli.maxContribution")}
                            </div>
                            <div className="space-y-2">
                              <Label className={labelStyles}>Admin Charges Rate (%)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formatValue(formData.pf.edli.adminCharges.rate)}
                                onChange={(e) => updatePfField(["edli", "adminCharges", "rate"], parseNumber(e.target.value))}
                                className={getFieldStyles("pf.edli.adminCharges.rate")}
                                placeholder="Enter admin charges rate"
                              />
                              {renderFieldError("pf.edli.adminCharges.rate")}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* ESI Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <SubFormTitle title="Employee State Insurance (ESI)" />
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="esi-enabled"
                        checked={formData.esi.enabled}
                        onCheckedChange={(checked: any) => updateEsiField("enabled", checked)}
                      />
                      <Label htmlFor="esi-enabled" className="text-sm text-gray-600">Enable ESI</Label>
                    </div>
                  </div>

                  {formData.esi.enabled && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className={labelStyles}>Max Gross Salary Limit (Rs.)</Label>
                          <Input
                            type="number"
                            min="0"
                            value={formatValue(formData.esi.maxGrossSalaryLimit)}
                            onChange={(e) => updateEsiField("maxGrossSalaryLimit", parseNumber(e.target.value))}
                            className={getFieldStyles("esi.maxGrossSalaryLimit")}
                            placeholder="Enter max gross salary limit"
                          />
                          {renderFieldError("esi.maxGrossSalaryLimit")}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className={labelStyles}>Applicable Salary Heads</Label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-lg border bg-slate-50/40 p-3">
                            {salaryHeadOptions.map((head) => (
                              <div key={head.value} className="flex items-center gap-2">
                                <Checkbox
                                  checked={formData.esi.applicableSalaryHeads.includes(head.value)}
                                  onCheckedChange={(checked) => {
                                    const current = formData.esi.applicableSalaryHeads
                                    const updated = checked
                                      ? [...current, head.value]
                                      : current.filter((h: string) => h !== head.value)
                                    updateEsiField("applicableSalaryHeads", updated)
                                  }}
                                />
                                <Label className="text-sm">{head.label}</Label>
                              </div>
                            ))}
                          </div>
                          {renderFieldError("esi.applicableSalaryHeads")}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className={labelStyles}>Employee Contribution Rate (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formatValue(formData.esi.employee.contributionRate)}
                            onChange={(e) => updateEsiNestedField(["employee", "contributionRate"], parseNumber(e.target.value))}
                            className={getFieldStyles("esi.employee.contributionRate")}
                            placeholder="Enter employee contribution rate"
                          />
                          {renderFieldError("esi.employee.contributionRate")}
                        </div>
                        <div className="space-y-2">
                          <Label className={labelStyles}>Employer Contribution Rate (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={formatValue(formData.esi.employer.contributionRate)}
                            onChange={(e) => updateEsiNestedField(["employer", "contributionRate"], parseNumber(e.target.value))}
                            className={getFieldStyles("esi.employer.contributionRate")}
                            placeholder="Enter employer contribution rate"
                          />
                          {renderFieldError("esi.employer.contributionRate")}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary Section */}
                <div className="flex items-center justify-between px-4 py-2.5 rounded-lg border border-blue-100 bg-blue-50">
                  <span className="text-sm font-semibold text-gray-700">Employer Contribution Summary</span>
                  <span className="inline-flex items-center gap-1.5 border border-blue-200 bg-white text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-md">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {formatRate(totalEmployerContribution)}% Total
                  </span>
                </div>

              </form>
            )}
          </CardContent>

          <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
            <ActionButtons
              layout="end"
              secondaryLabel="Cancel"
              onSecondary={onClose}
              primaryLabel="Save Changes"
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
