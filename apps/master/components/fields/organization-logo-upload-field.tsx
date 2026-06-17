"use client"

import { useEffect, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Upload } from "lucide-react"
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload"
import { toast } from "react-toastify"
import OrganizationLogoViewField from "./organization-logo-view-field"

interface OrganizationLogoUploadValue {
  documentPath: string
  documentType: string
}

interface OrganizationLogoUploadFieldProps {
  id: string
  label?: string
  organizationCode?: string
  value: OrganizationLogoUploadValue
  onChange: (doc: OrganizationLogoUploadValue) => void
  disabled?: boolean
  uploadPath?: string
  uploadPrefix?: string
}

const extractServerPath = (res: any): string => {
  if (typeof res?.serverPath === "string") return res.serverPath
  if (typeof res?.data === "string") return res.data
  if (typeof res?.data?.path === "string") return res.data.path
  if (typeof res?.data?.serverPath === "string") return res.data.serverPath
  if (typeof res?.path === "string") return res.path
  return ""
}

export default function OrganizationLogoUploadField({
  id,
  label = "ORGANIZATION LOGO",
  organizationCode,
  value,
  onChange,
  disabled = false,
  uploadPath = "organization",
  uploadPrefix = "logo",
}: OrganizationLogoUploadFieldProps) {
  const { uploadFile } = useFileUpload({ uploadPath })
  const [uploading, setUploading] = useState(false)
  const [currentLogoPath, setCurrentLogoPath] = useState(value?.documentPath || "")

  const isDisabled = disabled

  useEffect(() => {
    if (!uploading) {
      setCurrentLogoPath(value?.documentPath || "")
    }
  }, [value?.documentPath, uploading])

  return (
    <div className="space-y-2">
      <Input
        id={id}
        type="file"
        accept=".jpg,.jpeg,.png,.webp"
        disabled={isDisabled}
        className="hidden"
        onChange={(e) => {
          const inputElement = e.target as HTMLInputElement
          const file = inputElement.files?.[0]
          if (!file) return

          const now = new Date()
          const isoTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
            now.getDate()
          ).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
          const ext = file.name.split(".").pop() || "png"
          const safeCode = organizationCode || "organization"
          const newFileName = `${safeCode}_${uploadPrefix}_${isoTime}.${ext}`
          const renamedFile = new File([file], newFileName, { type: file.type })
          setUploading(true)

          uploadFile(renamedFile, newFileName)
            .then((res: any) => {
              const uploadedPath = extractServerPath(res)
              if (res?.success && uploadedPath) {
                setCurrentLogoPath(uploadedPath)
                onChange({ documentPath: uploadedPath, documentType: file.type })
                return
              }
              setCurrentLogoPath("")
              onChange({ documentPath: "", documentType: file.type })
              toast.error(res?.error || "Logo upload failed")
            })
            .catch(() => {
              setCurrentLogoPath("")
              onChange({ documentPath: "", documentType: file.type })
              toast.error("Logo upload failed")
            })
            .finally(() => {
              setUploading(false)
              inputElement.value = ""
            })
        }}
      />

      <OrganizationLogoViewField
        key={currentLogoPath || "empty-logo"}
        label={label}
        logoPath={currentLogoPath}
        isUploading={uploading}
      />

      <Button
        type="button"
        disabled={isDisabled || uploading}
        onClick={() => document.getElementById(id)?.click()}
        variant="outline"
        className="w-full h-9 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      >
        <Upload className="h-4 w-4 mr-2" />
        {uploading ? "Uploading..." : "Upload logo"}
      </Button>
    </div>
  )
}
