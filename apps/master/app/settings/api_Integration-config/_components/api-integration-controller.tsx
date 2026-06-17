"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import ApiIntegrationBasicInformation from "./api-integration-basic-information"
import ApiIntegrationRequestBodyFieldsTab from "./api-integration-request-body-fields-tab"
import ApiIntegrationPathParametersTab from "./api-integration-path-parameters-tab"
import { StepIndicator } from "./step-indicator"

type FieldMapping = {
  fieldName: string
  internalField: string
  internalDataType: string
  dataType: string
  required: boolean
}

export type ApiIntegrationFormValues = {
  apiName: string
  server: string
  method: string
  url: string
  headers: { "Content-Type": string }
  isActive: boolean
  requestBodyType: string
  requestBodyFields: FieldMapping[]
  pathParameters: FieldMapping[]
}

interface Props {
  isOpen?: boolean
  onClose?: () => void
  onSubmit?: (data: ApiIntegrationFormValues) => void
  initialValues?: Partial<ApiIntegrationFormValues>
  mode?: "add" | "edit" | "view"
}

const emptyField = (): FieldMapping => ({
  fieldName: "",
  internalField: "",
  internalDataType: "",
  dataType: "",
  required: true,
})

const isValidFieldMapping = (item: FieldMapping) =>
  item.fieldName.trim().length > 0 &&
  item.internalField.trim().length > 0

export default function ApiIntegrationController({
  isOpen = true,
  onClose,
  onSubmit,
  initialValues,
  mode = "add",
}: Props) {
  const [step, setStep] = useState(1)
  const [visibleStepLabel, setVisibleStepLabel] = useState<number | null>(null)
  const [showSubmitStepErrors, setShowSubmitStepErrors] = useState(false)
  const [form, setForm] = useState<ApiIntegrationFormValues>({
    apiName: initialValues?.apiName || "",
    server: initialValues?.server || "",
    method: initialValues?.method || "",
    url: initialValues?.url || "",
    headers: { "Content-Type": initialValues?.headers?.["Content-Type"] || "" },
    isActive: initialValues?.isActive ?? true,
    requestBodyType: initialValues?.requestBodyType || "",
    requestBodyFields: Array.isArray(initialValues?.requestBodyFields) ? initialValues.requestBodyFields : [],
    pathParameters: Array.isArray(initialValues?.pathParameters) ? initialValues.pathParameters : [],
  })

  useEffect(() => {
    setForm({
      apiName: initialValues?.apiName || "",
      server: initialValues?.server || "",
      method: initialValues?.method || "",
      url: initialValues?.url || "",
      headers: { "Content-Type": initialValues?.headers?.["Content-Type"] || "" },
      isActive: initialValues?.isActive ?? true,
      requestBodyType: initialValues?.requestBodyType || "",
      requestBodyFields: Array.isArray(initialValues?.requestBodyFields) ? initialValues.requestBodyFields : [],
      pathParameters: Array.isArray(initialValues?.pathParameters) ? initialValues.pathParameters : [],
    })
  }, [initialValues])

  const updateField = <K extends keyof ApiIntegrationFormValues>(key: K, value: ApiIntegrationFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const completedSteps = useMemo(() => {
    const completed: number[] = []
    const isBasicCompleted =
      form.apiName.trim().length > 0 &&
      form.server.trim().length > 0 &&
      form.method.trim().length > 0 &&
      form.url.trim().length > 0 &&
      form.headers["Content-Type"].trim().length > 0 &&
      form.requestBodyType.trim().length > 0
    const isRequestBodyCompleted =
      form.requestBodyFields.length > 0 &&
      form.requestBodyFields.every(isValidFieldMapping)
    const isPathParamsCompleted =
      form.pathParameters.length > 0 &&
      form.pathParameters.every(isValidFieldMapping)

    if (isBasicCompleted) completed.push(1)
    if (isRequestBodyCompleted) completed.push(2)
    if (isPathParamsCompleted) completed.push(3)
    return completed
  }, [form])

  const failedSteps = useMemo(() => {
    if (!showSubmitStepErrors) return []
    const failed: number[] = []
    if (!completedSteps.includes(1)) failed.push(1)
    if (!completedSteps.includes(2)) failed.push(2)
    if (!completedSteps.includes(3)) failed.push(3)
    return failed
  }, [completedSteps, showSubmitStepErrors])

  const isViewMode = mode === "view"

  const handleSave = () => {
    if (isViewMode) return
    setShowSubmitStepErrors(true)
    if (completedSteps.length < 3) return
    onSubmit?.(form)
  }

  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl h-full overflow-hidden flex flex-col border-l border-gray-200 rounded-l-lg">
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-gray-100 fixed top-4 right-4 z-50 ml-auto">
          <X className="h-4 w-4" />
        </Button>
        <div className="flex-1 overflow-hidden bg-gray-50">
          <div className="flex h-full overflow-hidden relative">
            <StepIndicator
              currentStep={step}
              visibleStepLabel={visibleStepLabel}
              completedSteps={completedSteps}
              failedSteps={failedSteps}
              steps={[
                { number: 1, label: "Basic Information" },
                { number: 2, label: "Request Body Fields" },
                { number: 3, label: "Path Parameters" },
              ]}
              onStepChange={setStep}
              onStepLabelToggle={(targetStep) => setVisibleStepLabel(visibleStepLabel === targetStep ? null : targetStep)}
              onStepLabelClose={() => setVisibleStepLabel(null)}
            />
            <div className="flex-1 overflow-y-auto space-y-4">
              {step === 1 && (
                <ApiIntegrationBasicInformation
                  apiName={form.apiName}
                  server={form.server}
                  method={form.method}
                  url={form.url}
                  contentType={form.headers["Content-Type"]}
                  requestBodyType={form.requestBodyType}
                  isActive={form.isActive}
                  onApiNameChange={(value) => updateField("apiName", value)}
                  onServerChange={(value) => updateField("server", value)}
                  onMethodChange={(value) => updateField("method", value)}
                  onUrlChange={(value) => updateField("url", value)}
                  onContentTypeChange={(value) => updateField("headers", { "Content-Type": value })}
                  onRequestBodyTypeChange={(value) => updateField("requestBodyType", value)}
                  onIsActiveChange={(value) => updateField("isActive", value)}
                  onContinue={() => setStep(2)}
                  viewMode={isViewMode}
                />
              )}
              {step === 2 && (
                <ApiIntegrationRequestBodyFieldsTab
                  values={form.requestBodyFields}
                  onChange={(next) => updateField("requestBodyFields", next)}
                  onContinue={() => setStep(3)}
                  viewMode={isViewMode}
                />
              )}
              {step === 3 && (
                <ApiIntegrationPathParametersTab
                  values={form.pathParameters}
                  onChange={(next) => updateField("pathParameters", next)}
                  onContinue={handleSave}
                  showErrors={showSubmitStepErrors}
                  errorMessage="Add at least one path parameter to save"
                  submitLabel={mode === "edit" ? "Save Changes" : "Create Config"}
                  viewMode={isViewMode}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
