"use client"

import { useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { FileText, Upload } from "lucide-react"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import DocumentPreview from "@/components/popup/document-preview"

interface UploadedDocumentValue {
  documentPath: string
  documentType: string
}

interface DocumentUploadFieldProps {
  id: string
  label: string
  isViewMode: boolean
  employeeID?: string
  value: UploadedDocumentValue
  onChange: (doc: UploadedDocumentValue) => void
  disabled?: boolean
  uploadPrefix?: string
  uploadButtonText?: string
  successTitle?: string
  successSubtitle?: string
  wrapperClassName?: string
  labelClassName?: string
}

const guessMimeFromPath = (path: string): string => {
  const lower = path.toLowerCase()
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".gif")) return "image/gif"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".pdf")) return "application/pdf"
  if (lower.endsWith(".doc")) return "application/msword"
  if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  return "application/octet-stream"
}

export default function DocumentUploadField({
  id,
  label,
  isViewMode,
  employeeID,
  value,
  onChange,
  disabled = false,
  uploadPrefix = "document",
  uploadButtonText = "Upload Document",
  successTitle,
  successSubtitle = "Document uploaded",
  wrapperClassName = "space-y-2",
  labelClassName = "block text-xs font-medium text-gray-700 uppercase tracking-wide",
}: DocumentUploadFieldProps) {
  const { uploadFile } = useFileUpload({ uploadPath: "contract_employee" })
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({})

  const hasFile = Boolean(value?.documentPath?.trim())
  const isDisabled = isViewMode || disabled

  return (
    <div className={wrapperClassName}>
      <Label className={labelClassName}>{label}</Label>
      <div className="relative mt-1">
        <Input
          id={id}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          disabled={isDisabled}
          className="hidden"
          onChange={(e) => {
            const inputElement = e.target as HTMLInputElement
            const file = inputElement.files?.[0]
            if (!file) return

            const now = new Date()
            const isoTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
            const ext = file.name.split(".").pop()
            const safeEmployeeId = employeeID || "unknown"
            const newFileName = `${safeEmployeeId}_${uploadPrefix}_${isoTime}.${ext}`
            const renamedFile = new File([file], newFileName, { type: file.type })

            uploadFile(renamedFile, newFileName)
              .then((res: any) => {
                if (res?.success && res?.serverPath) {
                  onChange({ documentPath: res.serverPath, documentType: file.type })
                } else {
                  onChange({ documentPath: file.name, documentType: file.type })
                }
              })
              .catch(() => {
                onChange({ documentPath: file.name, documentType: file.type })
              })
              .finally(() => {
                inputElement.value = ""
              })
          }}
        />

        {hasFile ? (
          <div className="flex items-center gap-3 p-2 bg-green-50 border border-green-200 rounded-md">
            <FileText className="h-4 w-4 text-green-600" />
            <div className="flex-1">
              <p className="text-xs font-medium text-green-800">{successTitle || label}</p>
              <p className="text-[11px] text-green-600">{successSubtitle}</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
                onClick={() => {
                  setPreviewDoc({
                    path: value.documentPath,
                    mime: value.documentType || guessMimeFromPath(value.documentPath),
                    title: label,
                  })
                  setPreviewOpen(true)
                }}
              >
                Preview
              </Button>
              {!isViewMode && !disabled && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                  onClick={() => onChange({ documentPath: "", documentType: "" })}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Button
            type="button"
            disabled={isDisabled}
            onClick={() => document.getElementById(id)?.click()}
            className="w-full h-9 flex items-center justify-center gap-2 border border-dashed border-gray-300 rounded-md hover:border-blue-400 hover:bg-blue-50 bg-gray-50 text-gray-700"
          >
            <Upload className="h-4 w-4" />
            <span className="text-xs font-medium">{uploadButtonText}</span>
          </Button>
        )}
      </div>

      <DocumentPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentPath={previewDoc.path}
        mimeType={previewDoc.mime}
        title={previewDoc.title}
      />
    </div>
  )
}
