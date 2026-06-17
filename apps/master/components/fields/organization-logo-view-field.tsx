"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Label } from "@repo/ui/components/ui/label"
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken"
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64"

interface OrganizationLogoViewFieldProps {
  label?: string
  logoPath?: string
  isUploading?: boolean
}

const getFileName = (path: string): string => {
  const clean = path.split("?")[0].split("#")[0]
  const parts = clean.split("/")
  return parts[parts.length - 1] || clean
}

export default function OrganizationLogoViewField({
  label = "ORGANIZATION LOGO",
  logoPath = "",
  isUploading = false,
}: OrganizationLogoViewFieldProps) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false)
  const { token } = useAuthToken()
  const {
    fetchByteArray: fetchLogoBytes,
    loading: logoLoading,
    result: logoResult,
    reset: resetLogoFetch,
  } = useByteToBase64()

  const normalizedPath = logoPath.trim()
  const hasFile = Boolean(normalizedPath)

  const fileName = useMemo(() => {
    if (!normalizedPath) return ""
    return getFileName(normalizedPath)
  }, [normalizedPath])

  const getLogoMime = useCallback((path: string) => {
    const lower = path.toLowerCase()
    if (lower.endsWith(".png")) return "image/png"
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
    if (lower.endsWith(".webp")) return "image/webp"
    if (lower.endsWith(".svg")) return "image/svg+xml"
    return "application/octet-stream"
  }, [])

  useEffect(() => {
    if (!normalizedPath || !token) {
      resetLogoFetch()
      return
    }

    fetchLogoBytes(normalizedPath, getLogoMime(normalizedPath)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedPath, token])

  const resolvedLogoSrc = logoResult?.objectUrl || (fileName ? `/uploads/${fileName}` : "")
  const isLoading = isUploading || (hasFile && logoLoading && !logoResult?.objectUrl)
  const shouldShowImage = hasFile && resolvedLogoSrc && !imageLoadFailed

  // Reset error when src changes
  useEffect(() => {
    setImageLoadFailed(false)
  }, [resolvedLogoSrc])

  return (
    <div className="space-y-2">
      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
        {label}
      </Label>
      <div className="w-full h-[126px] rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span className="h-3 w-3 rounded-full border-2 border-gray-400 border-t-transparent animate-spin" />
            Loading logo...
          </div>
        ) : shouldShowImage ? (
          <img
            src={resolvedLogoSrc}
            alt="Organization logo"
            className="max-h-full max-w-full object-contain"
            onError={() => setImageLoadFailed(true)}
          />
        ) : (
          <span className="text-sm text-gray-400">No logo uploaded</span>
        )}
      </div>
    </div>
  )
}
