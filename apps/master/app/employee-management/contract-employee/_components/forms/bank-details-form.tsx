"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import { Banknote } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { SuccessPopup } from "@/components/success-popup"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { FormActionsFooter } from "../../../../../components/footer/form-actions-footer"
import { GradientFormHeader } from "../../../../../components/header/form-header"
import { SubFormTitle } from "../../../../../components/header/sub-form-title"
import DocumentUploadField from "../../../../../components/fields/document-upload-field"
import {
  createBankDetailsSchema,
  normalizeBankDetailsConfig,
  type BankDetailsConfig,
  type BankDetailsData,
  type BankDetailsNestedFieldKey,
  type BankDetailsRootFieldKey,
} from "../schemas/bank-details-schema"
import { toast } from "react-toastify"

interface BankDetailsFormProps {
  employeeRecordId?: string | null
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  onSubmit?: (data: any) => void
}

const INPUT_CLASS = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

export function BankDetailsForm({
  employeeRecordId = null,
  onNextTab,
  onPreviousTab,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: BankDetailsFormProps) {
  const defaultValues: BankDetailsData = {
    aadharNumber: "",
    aadharNumberDocumentPath: "",
    panNumber: "",
    panNumberDocumentPath: "",
    bankDetails: {
      bankName: "",
      ifscCode: "",
      branchName: "",
      accountNumber: "",
    },
    esiNumber: "",
    uanNumber: "",
    pfNumber: "",
  }

  const [employeeData, setEmployeeData] = useState<any>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [aadharDocument, setAadharDocument] = useState({ documentPath: "", documentType: "" })
  const [panDocument, setPanDocument] = useState({ documentPath: "", documentType: "" })
  const hydratedForRecordRef = useRef<string | null>(null)
  const tenantCode = useGetTenantCode()
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })

  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const modeParam = searchParams.get("mode")
  const resolvedEmployeeRecordId = employeeRecordId || id
  const currentMode = modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : mode
  const isViewMode = currentMode === "view"
  const bankDetailsConfig = useMemo(
    () =>
      normalizeBankDetailsConfig(
        (formStructure?.bankDetails as BankDetailsConfig | undefined) ?? undefined
      ),
    [formStructure]
  )
  const bankDetailsSchema = useMemo(
    () =>
      createBankDetailsSchema({
        tabRequired: bankDetailsConfig.tabRequired,
        fields: bankDetailsConfig.fields,
        bankDetails: bankDetailsConfig.bankDetails,
      }),
    [bankDetailsConfig]
  )
  const shouldShowConfigLoader = formStructureLoading || !formStructure
  const {
    post: postBankDetails,
    loading: postLoading,
  } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: (response) => {
      const responseData =
        response?.data && typeof response.data === "object" ? response.data : response
      const businessStatus =
        responseData && typeof responseData === "object" ? (responseData as any).status : undefined

      if (businessStatus === false) {
        setShowErrors(true)

        const normalizeServerFieldPath = (fieldName: string) => {
          const normalized = fieldName.trim()
          if (!normalized) return normalized

          const directMap: Record<string, string> = {
            bankName: "bankDetails.bankName",
            branchName: "bankDetails.branchName",
            accountNumber: "bankDetails.accountNumber",
            ifscCode: "bankDetails.ifscCode",
            IFSCCode: "bankDetails.ifscCode",
            aadharNumber: "aadharNumber",
            panNumber: "panNumber",
            esiNumber: "esiNumber",
            uanNumber: "uanNumber",
            pfNumber: "pfNumber",
          }

          return directMap[normalized] || normalized
        }

        const applyFieldError = (fieldName: string, message: string) => {
          const normalized = normalizeServerFieldPath(fieldName)
          if (!normalized || !message.trim()) return
          setError(normalized as any, {
            type: "server",
            message,
          })
        }

        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return

            if (typeof message === "string") {
              applyFieldError(fieldName, message)
              return
            }

            if (message && typeof message === "object") {
              Object.entries(message as Record<string, unknown>).forEach(([childKey, childValue]) => {
                if (typeof childValue !== "string") return
                applyFieldError(`${fieldName}.${childKey}`, childValue)
              })
            }
          })
        }
        return
      }

      toast.success("Employee data saved successfully!");
      hydratedForRecordRef.current = null
      void fetchEmployee()
    },
    onError: (error) => {
      console.error("Error saving bank details:", error)
    },
  })
  const isRootVisible = (field: BankDetailsRootFieldKey) =>
    bankDetailsConfig.fields[field]?.visible ?? true
  const isBankVisible = (field: BankDetailsNestedFieldKey) =>
    bankDetailsConfig.bankDetails.fields[field]?.visible ?? true

  const getRootLabel = (field: BankDetailsRootFieldKey, fallback: string) =>
    bankDetailsConfig.fields[field]?.label || fallback
  const getBankLabel = (field: BankDetailsNestedFieldKey, fallback: string) =>
    bankDetailsConfig.bankDetails.fields[field]?.label || fallback

  const isRequired = (field: BankDetailsRootFieldKey | BankDetailsNestedFieldKey) => {
    if (field === "aadharNumber") return bankDetailsConfig.fields.aadharNumber?.required ?? true
    if (field === "panNumber") return bankDetailsConfig.fields.panNumber?.required ?? false
    if (field === "esiNumber") return bankDetailsConfig.fields.esiNumber?.required ?? false
    if (field === "uanNumber") return bankDetailsConfig.fields.uanNumber?.required ?? false
    if (field === "pfNumber") return bankDetailsConfig.fields.pfNumber?.required ?? false
    if (field === "bankName") return bankDetailsConfig.bankDetails.fields.bankName?.required ?? true
    if (field === "branchName") return bankDetailsConfig.bankDetails.fields.branchName?.required ?? true
    if (field === "accountNumber") return bankDetailsConfig.bankDetails.fields.accountNumber?.required ?? true
    return bankDetailsConfig.bankDetails.fields.ifscCode?.required ?? true
  }

  const showIdentitySection = isRootVisible("aadharNumber") || isRootVisible("panNumber")
  const showBankSection =
    isBankVisible("bankName") ||
    isBankVisible("branchName") ||
    isBankVisible("accountNumber") ||
    isBankVisible("ifscCode")
  const showAdditionalSection =
    isRootVisible("esiNumber") ||
    isRootVisible("uanNumber") ||
    isRootVisible("pfNumber")

  const {
    register,
    formState: { errors, isValid },
    reset,
    setValue,
    getValues,
    setError,
    trigger,
    clearErrors,
  } = useForm<BankDetailsData>({
    resolver: zodResolver(bankDetailsSchema),
    defaultValues,
    mode: "onChange",
  })
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
  const hasFieldErrors = Boolean(
    errors.aadharNumber ||
      errors.panNumber ||
      errors.bankDetails?.bankName ||
      errors.bankDetails?.branchName ||
      errors.bankDetails?.accountNumber ||
      errors.bankDetails?.ifscCode ||
      errors.esiNumber ||
      errors.uanNumber ||
      errors.pfNumber
  )
  const fieldErrorCount =
    Number(Boolean(errors.aadharNumber)) +
    Number(Boolean(errors.panNumber)) +
    Number(Boolean(errors.bankDetails?.bankName)) +
    Number(Boolean(errors.bankDetails?.branchName)) +
    Number(Boolean(errors.bankDetails?.accountNumber)) +
    Number(Boolean(errors.bankDetails?.ifscCode)) +
    Number(Boolean(errors.esiNumber)) +
    Number(Boolean(errors.uanNumber)) +
    Number(Boolean(errors.pfNumber))

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
      console.error("Error fetching employee data:", error)
    },
    dependencies: [resolvedEmployeeRecordId, employeeSearchUrl],
  })

  useEffect(() => {
    if (!resolvedEmployeeRecordId || currentMode === "add") return
    void fetchEmployee()
  }, [resolvedEmployeeRecordId, currentMode, employeeSearchUrl])

  useEffect(() => {
    hydratedForRecordRef.current = null
  }, [resolvedEmployeeRecordId])

  useEffect(() => {
    if (!employeeData || !resolvedEmployeeRecordId) return
    if (hydratedForRecordRef.current === resolvedEmployeeRecordId) return

    reset({
      aadharNumber: employeeData.aadharNumber || "",
      aadharNumberDocumentPath: employeeData.aadharNumberDocumentPath || "",
      panNumber: employeeData.panNumber || "",
      panNumberDocumentPath: employeeData.panNumberDocumentPath || "",
      bankDetails: {
        bankName: employeeData?.bankDetails?.bankName || "",
        ifscCode: employeeData?.bankDetails?.ifscCode || "",
        branchName: employeeData?.bankDetails?.branchName || "",
        accountNumber: employeeData?.bankDetails?.accountNumber || "",
      },
      esiNumber: employeeData.esiNumber || "",
      uanNumber: employeeData.uanNumber || "",
      pfNumber: employeeData.pfNumber || "",
    })

    const resolveDoc = (primary: any, fallbackPath: string) => {
      if (primary && typeof primary === "object") {
        const docPath = primary.documentPath || primary.path || ""
        if (docPath) return { documentPath: docPath, documentType: primary.documentType || primary.type || "" }
      }
      if (typeof primary === "string" && primary) return { documentPath: primary, documentType: "" }
      if (fallbackPath) return { documentPath: fallbackPath, documentType: "" }
      return { documentPath: "", documentType: "" }
    }

    const aadharDoc = resolveDoc(
      employeeData?.aadharDocument || employeeData?.aadharCard || employeeData?.aadharFile,
      employeeData?.aadharNumberDocumentPath || ""
    )
    setAadharDocument(aadharDoc)

    const panDoc = resolveDoc(
      employeeData?.panDocument || employeeData?.panCard || employeeData?.panFile,
      employeeData?.panNumberDocumentPath || ""
    )
    setPanDocument(panDoc)

    hydratedForRecordRef.current = resolvedEmployeeRecordId
    void trigger()
  }, [employeeData, resolvedEmployeeRecordId, reset, trigger])

  const handleSaveAndContinue = async () => {
    if (shouldShowConfigLoader) return
    setShowErrors(true)
    clearErrors()
    const valid = await trigger()
    const formValues = getValues()
    if (!valid) return
    setShowErrors(false)

    const isEditMode = currentMode === "edit" && Boolean(resolvedEmployeeRecordId)
    const shouldSetBankDetailsTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: resolvedEmployeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "contractEmployeeIdentity",
      data: {
        ...formValues,
        aadharNumberDocumentPath: formValues.aadharNumberDocumentPath || aadharDocument.documentPath,
        panNumberDocumentPath: formValues.panNumberDocumentPath || panDocument.documentPath,
        ...(shouldSetBankDetailsTab ? { bankDetailstab: true } : {}),
      },
      audit: auditPayload,
    }

    postBankDetails(payload)
  }

  const handleSave = async () => {
    await handleSaveAndContinue()
  }

  const handleContinue = async () => {
    setShowErrors(true)
    const valid = await trigger()
    if (!valid) return
    if (onNextTab) onNextTab()
  }

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      {postLoading && (
          <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
            <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Saving work orders...</span>
            </div>
          </div>
        )}
      <GradientFormHeader
        icon={Banknote}
        title="Bank & Identity Details"
        description="Bank account information and identity verification details"
      />

      <CardContent className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
        {shouldShowConfigLoader ? (
          <div className="py-12 text-center text-sm text-gray-600">
            Loading form configuration...
          </div>
        ) : (
          <>
        {showErrors && hasFieldErrors && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Please fix highlighted fields before continuing.
          </div>
        )}

        {showIdentitySection && (
          <div className="space-y-3">
            <SubFormTitle title="Identity Information" />
            <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-6 gap-6 items-start">
              {isRootVisible("aadharNumber") && (
                <div className="space-y-2 lg:col-span-3 xl:col-span-4">
                  <Label htmlFor="aadharNumber" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getRootLabel("aadharNumber", "Aadhar Number")} {isRequired("aadharNumber") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="aadharNumber"
                    {...register("aadharNumber")}
                    disabled={isViewMode}
                    maxLength={12}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                      showErrors && errors.aadharNumber ? "border-red-500 focus:border-red-500" : ""
                    }`}
                    placeholder="Enter 12-digit Aadhar number"
                  />
                  {showErrors && errors.aadharNumber && (
                    <p className="text-xs text-red-600">{errors.aadharNumber.message}</p>
                  )}
                </div>
              )}

              {isRootVisible("aadharNumber") && (
                <div className="space-y-2 lg:col-span-2 xl:col-span-2">
                  <DocumentUploadField
                    id="aadharDocumentUpload"
                    label={`${getRootLabel("aadharNumber", "Aadhar")} Document`}
                    isViewMode={isViewMode}
                    employeeID={employeeData?.employeeID || employeeData?.employeeId}
                    value={aadharDocument}
                    onChange={(doc) => { setAadharDocument(doc); setValue("aadharNumberDocumentPath", doc.documentPath) }}
                    uploadPrefix="bankdoc"
                    wrapperClassName="space-y-2"
                    labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                  />
                </div>
              )}

              {isRootVisible("panNumber") && (
                <>
                  <div className="space-y-2 lg:col-span-3 xl:col-span-4">
                    <Label htmlFor="panNumber" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {getRootLabel("panNumber", "PAN Number")} {isRequired("panNumber") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      id="panNumber"
                      {...register("panNumber")}
                      disabled={isViewMode}
                      className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                        showErrors && errors.panNumber ? "border-red-500 focus:border-red-500" : ""
                      }`}
                      placeholder="Enter PAN number (e.g., ABCDE1234F)"
                    />
                    {showErrors && errors.panNumber && (
                      <p className="text-xs text-red-600">{errors.panNumber.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 lg:col-span-2 xl:col-span-2">
                    <DocumentUploadField
                      id="panDocumentUpload"
                      label={`${getRootLabel("panNumber", "PAN")} Document`}
                      isViewMode={isViewMode}
                      employeeID={employeeData?.employeeID || employeeData?.employeeId}
                      value={panDocument}
                      onChange={(doc) => { setPanDocument(doc); setValue("panNumberDocumentPath", doc.documentPath) }}
                      uploadPrefix="pandoc"
                      wrapperClassName="space-y-2"
                      labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showIdentitySection && showBankSection && <Separator />}

        {showBankSection && (
          <div className="space-y-3">
            <SubFormTitle title="Bank Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {isBankVisible("bankName") && (
                <div className="space-y-2">
                  <Label htmlFor="bankName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getBankLabel("bankName", "Bank Name")} {isRequired("bankName") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="bankName"
                    {...register("bankDetails.bankName")}
                    disabled={isViewMode}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                      showErrors && errors.bankDetails?.bankName ? "border-red-500 focus:border-red-500" : ""
                    }`}
                    placeholder="Enter bank name"
                  />
                  {showErrors && errors.bankDetails?.bankName && (
                    <p className="text-xs text-red-600">{errors.bankDetails.bankName.message}</p>
                  )}
                </div>
              )}

              {isBankVisible("branchName") && (
                <div className="space-y-2">
                  <Label htmlFor="branchName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getBankLabel("branchName", "Branch Name")} {isRequired("branchName") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="branchName"
                    {...register("bankDetails.branchName")}
                    disabled={isViewMode}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                      showErrors && errors.bankDetails?.branchName ? "border-red-500 focus:border-red-500" : ""
                    }`}
                    placeholder="Enter branch name"
                  />
                  {showErrors && errors.bankDetails?.branchName && (
                    <p className="text-xs text-red-600">{errors.bankDetails.branchName.message}</p>
                  )}
                </div>
              )}

              {isBankVisible("accountNumber") && (
                <div className="space-y-2">
                  <Label htmlFor="accountNumber" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getBankLabel("accountNumber", "Account Number")} {isRequired("accountNumber") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="accountNumber"
                    {...register("bankDetails.accountNumber")}
                    disabled={isViewMode}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                      showErrors && errors.bankDetails?.accountNumber ? "border-red-500 focus:border-red-500" : ""
                    }`}
                    placeholder="Enter account number"
                  />
                  {showErrors && errors.bankDetails?.accountNumber && (
                    <p className="text-xs text-red-600">{errors.bankDetails.accountNumber.message}</p>
                  )}
                </div>
              )}

              {isBankVisible("ifscCode") && (
                <div className="space-y-2">
                  <Label htmlFor="ifscCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getBankLabel("ifscCode", "IFSC Code")} {isRequired("ifscCode") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="ifscCode"
                    {...register("bankDetails.ifscCode")}
                    disabled={isViewMode}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                      showErrors && errors.bankDetails?.ifscCode ? "border-red-500 focus:border-red-500" : ""
                    }`}
                    placeholder="Enter IFSC code"
                  />
                  {showErrors && errors.bankDetails?.ifscCode && (
                    <p className="text-xs text-red-600">{errors.bankDetails.ifscCode.message}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {showBankSection && showAdditionalSection && <Separator />}

        {showAdditionalSection && (
          <div className="space-y-3">
            <SubFormTitle title="Additional Details" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isRootVisible("esiNumber") && (
                <div className="space-y-2">
                  <Label htmlFor="esiNumber" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getRootLabel("esiNumber", "ESI Number")} {isRequired("esiNumber") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="esiNumber"
                    {...register("esiNumber")}
                    disabled={isViewMode}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                      showErrors && errors.esiNumber ? "border-red-500 focus:border-red-500" : ""
                    }`}
                    placeholder="Enter ESI number"
                  />
                  {showErrors && errors.esiNumber && (
                    <p className="text-xs text-red-600">{errors.esiNumber.message}</p>
                  )}
                </div>
              )}

              {isRootVisible("uanNumber") && (
                <div className="space-y-2">
                  <Label htmlFor="uanNumber" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getRootLabel("uanNumber", "UAN Number")} {isRequired("uanNumber") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="uanNumber"
                    {...register("uanNumber")}
                    disabled={isViewMode}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                      showErrors && errors.uanNumber ? "border-red-500 focus:border-red-500" : ""
                    }`}
                    placeholder="Enter UAN number"
                  />
                  {showErrors && errors.uanNumber && (
                    <p className="text-xs text-red-600">{errors.uanNumber.message}</p>
                  )}
                </div>
              )}

              {isRootVisible("pfNumber") && (
                <div className="space-y-2">
                  <Label htmlFor="pfNumber" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    {getRootLabel("pfNumber", "PF Number")} {isRequired("pfNumber") && <span className="text-red-500">*</span>}
                  </Label>
                  <Input
                    id="pfNumber"
                    {...register("pfNumber")}
                    disabled={isViewMode}
                    className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${
                      showErrors && errors.pfNumber ? "border-red-500 focus:border-red-500" : ""
                    }`}
                    placeholder="Enter PF number"
                  />
                  {showErrors && errors.pfNumber && (
                    <p className="text-xs text-red-600">{errors.pfNumber.message}</p>
                  )}
                </div>
              )}
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
        showErrors={showErrors && hasFieldErrors}
        errorCount={fieldErrorCount}
        postLoading={postLoading || shouldShowConfigLoader}
        onSave={handleSave}
      />
    </Card>
  )
}