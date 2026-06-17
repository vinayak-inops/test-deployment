"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { X, Download } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64"

interface DocumentPreviewProps {
  isOpen: boolean
  onClose: () => void
  documentPath: string | undefined
  mimeType?: string
  title?: string
}

const guessMimeFromPath = (path: string): string => {
  const lower = path.toLowerCase()
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
  if (lower.endsWith('.png')) return 'image/png'
  if (lower.endsWith('.gif')) return 'image/gif'
  if (lower.endsWith('.webp')) return 'image/webp'
  if (lower.endsWith('.pdf')) return 'application/pdf'
  return 'application/octet-stream'
}

export default function DocumentPreview({ isOpen, onClose, documentPath, mimeType, title }: DocumentPreviewProps) {
  const { fetchByteArray } = useByteToBase64()
  const [objectUrl, setObjectUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const currentUrlRef = useRef<string | null>(null)
  const lastLoadedKeyRef = useRef<string>("")

  const effectiveMime = useMemo(() => {
    if (mimeType) return mimeType
    if (documentPath) return guessMimeFromPath(documentPath)
    return 'application/octet-stream'
  }, [documentPath, mimeType])

  useEffect(() => {
    if (!isOpen) return

    const key = `${documentPath || ""}|${effectiveMime}`
    if (!documentPath || lastLoadedKeyRef.current === key) return

    let cancelled = false
    setError("")
    setLoading(true)

    const load = async () => {
      try {
        const res:any = await fetchByteArray(documentPath, effectiveMime)
        if (cancelled) return
        if (res.success && res.objectUrl) {
          if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current)
          currentUrlRef.current = res.objectUrl
          lastLoadedKeyRef.current = key
          setObjectUrl(res.objectUrl)
        } else {
          throw new Error(res.error || 'Failed to load document')
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load document')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [isOpen, documentPath, effectiveMime])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return
    const original = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = original
    }
  }, [isOpen])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current)
    }
  }, [])

  if (!isOpen) return null

  const isImage = effectiveMime.startsWith('image/')
  const isPdf = effectiveMime === 'application/pdf'

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-lg overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title || 'Document Preview'}</h3>
          <div className="flex items-center gap-2">
            {objectUrl && (
              <a href={objectUrl} download className="mr-2">
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </a>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        <div className="p-4 overflow-auto max-h-[calc(90vh-56px)] bg-gray-50">
          {loading && (
            <div className="text-center text-gray-500 py-20">Loading...</div>
          )}
          {!loading && error && (
            <div className="text-center text-red-600 py-20">{error}</div>
          )}
          {!loading && !error && objectUrl && (
            <div className="flex justify-center">
              {isImage ? (
                <img src={objectUrl} alt={title || 'Preview'} className="max-w-full max-h-[80vh] object-contain rounded" />
              ) : isPdf ? (
                <iframe src={objectUrl} title={title || 'PDF'} className="w-full h-[80vh] border-0 rounded" />
              ) : (
                <div className="text-center text-gray-600">
                  <p className="mb-2">Preview not available for this file type.</p>
                  <a href={objectUrl} download className="underline text-blue-600">Download file</a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return isOpen ? createPortal(content, document.body) : null
}


