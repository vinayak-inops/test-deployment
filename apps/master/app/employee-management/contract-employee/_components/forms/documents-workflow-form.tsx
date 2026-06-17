"use client"

import { useSearchParams } from "next/navigation"
import { CardContent } from "@repo/ui/components/ui/card"
import { Separator } from "@repo/ui/components/ui/separator"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import { DocumentsVerificationForm } from "./documents-form/documents-verification-form"
import { UploadedDocumentsSectionForm } from "./uploaded-documents/uploaded-documents-table"

interface DocumentsWorkflowFormProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  onNextTab?: () => void
  onPreviousTab?: () => void
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  showDocumentsVerification?: boolean
  showUploadedDocuments?: boolean
}

export function DocumentsWorkflowForm({
  employeeRecordId = null,
  mode = "add",
  onNextTab,
  onPreviousTab,
  employeeSearchUrl,
  employeeCollectionUrl="contract_employee",
  showDocumentsVerification = true,
  showUploadedDocuments = true,
}: DocumentsWorkflowFormProps) {
  const searchParams = useSearchParams()
  const modeParam = searchParams.get("mode")
  const currentMode =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : mode
  const isViewMode = currentMode === "view"

  const { uploadFile: uploadDocument } = useFileUpload({
    uploadPath: "contract_employee",
  })
  if (!showDocumentsVerification && !showUploadedDocuments) {
    return null
  }

  return (
    <div>
      <CardContent className="p-0">
        <div className="space-y-8">
          {showDocumentsVerification && (
            <DocumentsVerificationForm
              mode={currentMode as "add" | "edit" | "view"}
              employeeRecordId={employeeRecordId}
              onNextTab={onNextTab}
              onPreviousTab={onPreviousTab}
              employeeSearchUrl={employeeSearchUrl}
              employeeCollectionUrl={employeeCollectionUrl}
            />
          )}
          {showDocumentsVerification && showUploadedDocuments && <Separator />}
          {showUploadedDocuments && (
            <UploadedDocumentsSectionForm
              isViewMode={isViewMode}
              employeeID={employeeRecordId || undefined}
              uploadDocument={uploadDocument}
              employeeSearchUrl={employeeSearchUrl}
              employeeCollectionUrl={employeeCollectionUrl}
            />
          )}
        </div>
      </CardContent>
    </div>
  )
}

export default function DocumentsWorkflowFormWithPreview(props: any) {
  return <DocumentsWorkflowForm {...props} />
}
