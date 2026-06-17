"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Camera } from "lucide-react"
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken"
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64"

const getFileName = (path: string): string => {
  const clean = path.split("?")[0].split("#")[0]
  const parts = clean.split("/")
  return parts[parts.length - 1] || clean
}

function PreviewOfEmp({ path }: { path: string }) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false)
  const [lastObjectUrl, setLastObjectUrl] = useState("")
  const { token } = useAuthToken()
  const { fetchByteArray, loading, result, reset } = useByteToBase64()

  const normalizedPath = path.trim()
  const hasFile = Boolean(normalizedPath)

  const fileName = useMemo(() => {
    if (!normalizedPath) return ""
    return getFileName(normalizedPath)
  }, [normalizedPath])

  const getMime = useCallback((p: string) => {
    const lower = p.toLowerCase()
    if (lower.endsWith(".png")) return "image/png"
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
    if (lower.endsWith(".webp")) return "image/webp"
    if (lower.endsWith(".svg")) return "image/svg+xml"
    return "application/octet-stream"
  }, [])

  useEffect(() => {
    if (!normalizedPath || !token) {
      reset()
      return
    }
    fetchByteArray(normalizedPath, getMime(normalizedPath)).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [normalizedPath, token])

  // Cache last successful objectUrl so image doesn't flash during re-fetches
  useEffect(() => {
    if (result?.objectUrl) {
      setLastObjectUrl(result.objectUrl)
      setImageLoadFailed(false)
    }
  }, [result?.objectUrl])

  // Clear cache only when path is explicitly removed (remove button)
  useEffect(() => {
    if (!normalizedPath) {
      setLastObjectUrl("")
    }
  }, [normalizedPath])

  useEffect(() => {
    setImageLoadFailed(false)
  }, [normalizedPath])

  const resolvedSrc = result?.objectUrl || lastObjectUrl || (loading ? "" : fileName ? `/uploads/${fileName}` : "")
  const isLoading = hasFile && loading && !result?.objectUrl && !lastObjectUrl
  const shouldShowImage = hasFile && resolvedSrc && !imageLoadFailed

  if (!hasFile) {
    return (
      <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
        <Camera className="h-12 w-12 text-gray-400" />
      </div>
    )
  }

  if (isLoading) {
    return <div className="w-32 h-32 rounded-full bg-gray-100 animate-pulse" />
  }

  if (shouldShowImage) {
    return (
      <div className="relative">
        <img
          src={resolvedSrc}
          alt="Contractor preview"
          className="w-32 h-32 rounded-full object-cover border-2 border-gray-200 shadow-lg"
          onError={() => setImageLoadFailed(true)}
        />
      </div>
    )
  }

  return (
    <div className="w-32 h-32 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
      <Camera className="h-12 w-12 text-gray-400" />
    </div>
  )
}

export default PreviewOfEmp
