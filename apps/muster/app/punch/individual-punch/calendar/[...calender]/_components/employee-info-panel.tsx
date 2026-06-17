"use client"

import React, { useEffect, useState } from "react"
import { FlipVertical, User } from "lucide-react"
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64"

interface EmployeeCardProps {
  name: string
  department: string
  id: string
  managerId: string
  workOrderNumber: string
  gender: string
  avatarUrl?: string // can be direct URL / base64 / server path
}

// Guess mime from file extension (same logic as in personal info form)
const guessMimeFromPath = (path: string): string => {
  const lower = path.toLowerCase()
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".gif")) return "image/gif"
  if (lower.endsWith(".webp")) return "image/webp"
  return "application/octet-stream"
}

export default function EmployeeCard({
  name,
  department,
  id,
  managerId,
  workOrderNumber,
  gender,
  avatarUrl,
}: EmployeeCardProps) {
  const [resolvedAvatar, setResolvedAvatar] = useState<string | null>(null)
  const { fetchByteArray } = useByteToBase64()

  useEffect(() => {
    let currentObjectUrl: string | null = null

    const run = async () => {
      if (!avatarUrl) {
        setResolvedAvatar(null)
        return
      }

      // If it's a server path (like /app/documents/...), fetch bytes via hook
      if (avatarUrl.startsWith("/app/documents/")) {
        const mime = guessMimeFromPath(avatarUrl)
        try {
          const res: any = await fetchByteArray(avatarUrl, mime)
          if (res.success && res.objectUrl) {
            currentObjectUrl = res.objectUrl
            setResolvedAvatar(res.objectUrl)
          } else {
            setResolvedAvatar(null)
          }
        } catch {
          setResolvedAvatar(null)
        }
      } else {
        // Otherwise, use it directly (could be normal URL or data URL)
        setResolvedAvatar(avatarUrl)
      }
    }

    void run()

    return () => {
      if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl)
    }
  }, [avatarUrl])

  return (
    <div className="w-full mx-auto my-4">
      <div className="rounded-2xl shadow-sm border bg-gray-50 border-gray-200 p-3 hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md overflow-hidden">
                {/* {resolvedAvatar ? (
                  <img
                    src={resolvedAvatar}
                    alt={name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : ( */}
                  <User className="w-8 h-8 text-white" />
                 {/* )} */}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            {/* Details */}
            <div className="flex flex-col">
              <div className="flex gap-2 items-center">
                <h2 className="text-sm font-semibold text-gray-900">{name}</h2>

                {/* Employee ID immediately after the name */}
                <span className="text-xs text-gray-600 -mt-0.5">
                  (Employee ID: <span className="font-medium text-gray-900">{id}</span>)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {department}
                </span>

                <span className="text-sm text-gray-600">
                  MGR: <span className="font-medium text-gray-900">{managerId}</span>
                </span>

                <span className="text-sm text-gray-600">
                  WO: <span className="font-medium text-gray-900">{workOrderNumber}</span>
                </span>

                <span className="text-sm text-gray-600">
                  Gender: <span className="font-medium text-gray-900">{gender}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Actions button: vertical triple dot */}
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 
                       hover:bg-gray-100 hover:shadow-sm border border-transparent hover:border-gray-200"
            aria-label="More actions"
          >
            <FlipVertical className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  )
}