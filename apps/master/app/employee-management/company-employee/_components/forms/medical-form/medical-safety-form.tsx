"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Label } from "@repo/ui/components/ui/label"
import { Switch } from "@repo/ui/components/ui/switch"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Heart } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { SuccessPopup } from "@/components/success-popup"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { FormActionsFooter } from "../../../../../../components/footer/form-actions-footer"
import { GradientFormHeader } from "../../../../../../components/header/form-header"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import DocumentUploadField from "../../../../../../components/fields/document-upload-field"
import {
  createCovidVaccineSchema,
  EMPTY_COVID_VACCINE,
  normalizeMedicalSafetyConfig,
  type MedicalSafetyConfig,
  type CovidVaccine,
  type MedicalSafetyFieldKey,
} from "../../schemas/medical-safety-form-schema"
import { toast } from "react-toastify"

interface MedicalSafetyFormProps {
  employeeRecordId?: string | null
  onPreviousTab?: () => void
  onNextTab?: () => void
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (payload: any) => void
}

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

const SECTION_CARD_CLASS =
  "rounded-lg border border-gray-200 bg-gray-50/30 p-4 space-y-3"

export function MedicalSafetyForm({
  employeeRecordId = null,
  onPreviousTab,
  onNextTab,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: MedicalSafetyFormProps) {
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const [medicalVerificationRemark, setMedicalVerificationRemark] = useState("")
  const [covidVaccine, setCovidVaccine] = useState<CovidVaccine>({ ...EMPTY_COVID_VACCINE })
  const hydratedForRecordRef = useRef<string | null>(null)

  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const resolvedEmployeeRecordId = employeeRecordId || id
  const modeParam = searchParams.get("mode")
  const currentMode =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : mode
  const isViewMode = currentMode === "view"
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee"
  const tenantCode = useGetTenantCode()
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const medicalSafetyConfig = useMemo(
    () =>
      normalizeMedicalSafetyConfig(
        formStructure?.medicalSafety as MedicalSafetyConfig | undefined
      ),
    [formStructure]
  )
  const dynamicCovidVaccineSchema = useMemo(
    () => createCovidVaccineSchema(medicalSafetyConfig),
    [medicalSafetyConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure

  type MedicalSafetyFieldPath =
    | "vaccine1"
    | "vaccine2"
    | "vaccine3"
    | "vaccine1Certificate"
    | "vaccine2Certificate"
    | "vaccine3Certificate"
    | "medicalVerificationRemark"

  const isRequired = useMemo(() => {
    const fields = medicalSafetyConfig.fields
    return (field: MedicalSafetyFieldPath): boolean => {
      if (field === "vaccine1" || field === "vaccine2" || field === "vaccine3") {
        return fields[field]?.required ?? true
      }
      return Boolean(fields[field]?.required)
    }
  }, [medicalSafetyConfig])
  const isVisible = useMemo(() => {
    const fields = medicalSafetyConfig.fields
    return (field: MedicalSafetyFieldPath): boolean => fields[field]?.visible ?? true
  }, [medicalSafetyConfig])
  const getLabel = useMemo(() => {
    const fields = medicalSafetyConfig.fields
    return (field: MedicalSafetyFieldPath, fallback: string): string =>
      fields[field]?.label || fallback
  }, [medicalSafetyConfig])
  const showVaccinationSection =
    isVisible("vaccine1") ||
    isVisible("vaccine2") ||
    isVisible("vaccine3") ||
    isVisible("vaccine1Certificate") ||
    isVisible("vaccine2Certificate") ||
    isVisible("vaccine3Certificate")
  const showRemarkSection = isVisible("medicalVerificationRemark")

  const { post: postMedicalSafety, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        setShowErrors(true)
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const messages: string[] = []

        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return

            if (typeof message === "string" && message.trim()) {
              messages.push(message.trim())
              return
            }

            if (message && typeof message === "object") {
              Object.values(message as Record<string, unknown>).forEach((childValue) => {
                if (typeof childValue === "string" && childValue.trim()) {
                  messages.push(childValue.trim())
                }
              })
            }
          })
        }

        setServerErrors(messages)
        return
      }

      setServerErrors([])
      toast.success("Employee data saved successfully!")
      void fetchEmployee()
    },
    onError: (error) => {
      setServerErrors([error?.message || "Error saving medical safety"])
      console.error("Error saving medical safety:", error)
    },
  })

  const { refetch: fetchEmployee } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [{ field: "_id", value: resolvedEmployeeRecordId, operator: "eq" }],
    onSuccess: (data) => {
      if (Array.isArray(data) && data[0] && data[0].isDeleted !== true) {
        setEmployeeData(data[0])
      }
    },
    onError: (error) => {
      console.error("Error fetching employee medical safety data:", error)
    },
    dependencies: [resolvedEmployeeRecordId],
  })

  useEffect(() => {
    if (!resolvedEmployeeRecordId || currentMode === "add") return
    void fetchEmployee()
  }, [resolvedEmployeeRecordId, currentMode])

  useEffect(() => {
    hydratedForRecordRef.current = null
  }, [resolvedEmployeeRecordId])

  useEffect(() => {
    if (!employeeData || !resolvedEmployeeRecordId) {
      setMedicalVerificationRemark("")
      setCovidVaccine({ ...EMPTY_COVID_VACCINE })
      return
    }
    if (hydratedForRecordRef.current === resolvedEmployeeRecordId) return

    setMedicalVerificationRemark(employeeData.medicalVerificationRemark || "")
    setCovidVaccine(
      employeeData.covidVaccine
        ? { ...EMPTY_COVID_VACCINE, ...employeeData.covidVaccine }
        : { ...EMPTY_COVID_VACCINE }
    )
    hydratedForRecordRef.current = resolvedEmployeeRecordId
  }, [employeeData, resolvedEmployeeRecordId])

  const isValid = dynamicCovidVaccineSchema.safeParse(covidVaccine).success
  const validationErrorCount = showErrors ? (!isValid ? 1 : 0) + serverErrors.length : 0
  const auditEntityId = String(
    resolvedEmployeeRecordId ||
      employeeData?._id ||
      employeeData?.employeeID ||
      employeeData?.employeeId ||
      "",
  )
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })

  const handleSave = async () => {
    if (shouldShowConfigLoader) return
    setShowErrors(true)
    setServerErrors([])
    if (!isValid) return

    const flatData = {
      medicalVerificationRemark,
      covidVaccine,
    }

    const isEditMode = currentMode === "edit" && Boolean(resolvedEmployeeRecordId)
    const shouldSetMedicalSafetyTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: resolvedEmployeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        ...flatData,
        ...(shouldSetMedicalSafetyTab ? { medicalSafetytab: true } : {}),
      },
      audit: auditPayload,
    }

    postMedicalSafety(payload)
  }

  const handleContinue = () => {
    setShowErrors(true)
    if (!isValid || !onNextTab) return
    onNextTab()
  }

  const employeeCodeForUpload = employeeData?.employeeID || employeeData?.employeeId

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      {postLoading && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Saving permissions...</span>
          </div>
        </div>
      )}
      <GradientFormHeader
        icon={Heart}
        title="Medical & Safety"
        description="Vaccination status and medical verification remarks"
      />

      <CardContent className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
        {shouldShowConfigLoader ? (
          <div className="py-12 text-center text-sm text-gray-600">
            Loading form configuration...
          </div>
        ) : (
          <>
            {showErrors && validationErrorCount > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Please review medical information before continuing.
                {serverErrors.length > 0 && (
                  <ul className="mt-2 list-disc pl-5">
                    {serverErrors.map((msg, idx) => (
                      <li key={`${msg}-${idx}`}>{msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

        {showVaccinationSection && (
        <div className={SECTION_CARD_CLASS}>
          <SubFormTitle title="COVID-19 Vaccination Status" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isVisible("vaccine1") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("vaccine1", "First Dose")} {isRequired("vaccine1") && <span className="text-red-500">*</span>}
              </Label>
              <div className={`${INPUT_CLASS} flex items-center justify-between rounded-md bg-white px-3`}>
                <span className="text-sm text-gray-700">Vaccinated</span>
                <Switch
                  checked={!!covidVaccine.vaccine1}
                  disabled={isViewMode}
                  onCheckedChange={(checked) => {
                    setCovidVaccine((prev) => ({ ...prev, vaccine1: checked }))
                  }}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200"
                />
              </div>
            </div>
            )}

            {isVisible("vaccine2") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("vaccine2", "Second Dose")} {isRequired("vaccine2") && <span className="text-red-500">*</span>}
              </Label>
              <div className={`${INPUT_CLASS} flex items-center justify-between rounded-md bg-white px-3`}>
                <span className="text-sm text-gray-700">Vaccinated</span>
                <Switch
                  checked={!!covidVaccine.vaccine2}
                  disabled={isViewMode}
                  onCheckedChange={(checked) => {
                    setCovidVaccine((prev) => ({ ...prev, vaccine2: checked }))
                  }}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200"
                />
              </div>
            </div>
            )}

            {isVisible("vaccine3") && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                {getLabel("vaccine3", "Booster Dose")} {isRequired("vaccine3") && <span className="text-red-500">*</span>}
              </Label>
              <div className={`${INPUT_CLASS} flex items-center justify-between rounded-md bg-white px-3`}>
                <span className="text-sm text-gray-700">Vaccinated</span>
                <Switch
                  checked={!!covidVaccine.vaccine3}
                  disabled={isViewMode}
                  onCheckedChange={(checked) => {
                    setCovidVaccine((prev) => ({ ...prev, vaccine3: checked }))
                  }}
                  className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200"
                />
              </div>
            </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-1">
            {isVisible("vaccine1Certificate") && (
            <DocumentUploadField
              id="vaccine1Certificate"
              label={`${getLabel("vaccine1Certificate", "First Dose Certificate")}${isRequired("vaccine1Certificate") ? " *" : ""}`}
              isViewMode={isViewMode}
              employeeID={employeeCodeForUpload}
              value={{
                documentPath: covidVaccine.vaccine1Certificate || "",
                documentType: "",
              }}
              onChange={(doc) => {
                setCovidVaccine((prev) => ({
                  ...prev,
                  vaccine1Certificate: doc.documentPath || "",
                }))
              }}
              uploadPrefix="vaccine1"
              uploadButtonText="Upload First Dose Certificate"
              successTitle="First Dose Certificate"
              successSubtitle="Document uploaded successfully"
              wrapperClassName="space-y-2"
              labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
            />
            )}

            {isVisible("vaccine2Certificate") && (
            <DocumentUploadField
              id="vaccine2Certificate"
              label={`${getLabel("vaccine2Certificate", "Second Dose Certificate")}${isRequired("vaccine2Certificate") ? " *" : ""}`}
              isViewMode={isViewMode}
              employeeID={employeeCodeForUpload}
              value={{
                documentPath: covidVaccine.vaccine2Certificate || "",
                documentType: "",
              }}
              onChange={(doc) => {
                setCovidVaccine((prev) => ({
                  ...prev,
                  vaccine2Certificate: doc.documentPath || "",
                }))
              }}
              uploadPrefix="vaccine2"
              uploadButtonText="Upload Second Dose Certificate"
              successTitle="Second Dose Certificate"
              successSubtitle="Document uploaded successfully"
              wrapperClassName="space-y-2"
              labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
            />
            )}

            {isVisible("vaccine3Certificate") && (
            <DocumentUploadField
              id="vaccine3Certificate"
              label={`${getLabel("vaccine3Certificate", "Booster Dose Certificate")}${isRequired("vaccine3Certificate") ? " *" : ""}`}
              isViewMode={isViewMode}
              employeeID={employeeCodeForUpload}
              value={{
                documentPath: covidVaccine.vaccine3Certificate || "",
                documentType: "",
              }}
              onChange={(doc) => {
                setCovidVaccine((prev) => ({
                  ...prev,
                  vaccine3Certificate: doc.documentPath || "",
                }))
              }}
              uploadPrefix="vaccine3"
              uploadButtonText="Upload Booster Dose Certificate"
              successTitle="Booster Dose Certificate"
              successSubtitle="Document uploaded successfully"
              wrapperClassName="space-y-2"
              labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
            />
            )}
          </div>
        </div>
        )}

        {showRemarkSection && (
        <div className={SECTION_CARD_CLASS}>
          <SubFormTitle title="Medical Verification Remarks" />
          <div className="space-y-2">
            <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
              {getLabel("medicalVerificationRemark", "Remarks")}
              {isRequired("medicalVerificationRemark") && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              value={medicalVerificationRemark}
              onChange={(e) => {
                setMedicalVerificationRemark(e.target.value)
              }}
              disabled={isViewMode}
              className={`min-h-[90px] border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
              placeholder="Enter medical verification remarks"
              rows={4}
            />
          </div>
        </div>
        )}
          </>
        )}
      </CardContent>

      <FormActionsFooter
        onPreviousTab={onPreviousTab}
        isViewMode={isViewMode}
        isValid={isValid}
        showErrors={showErrors}
        errorCount={validationErrorCount}
        postLoading={postLoading || shouldShowConfigLoader}
        onSave={handleSave}
      />

    </Card>
  )
}
