"use client"

import React from "react"
import { AlertTriangle } from "lucide-react"

type Props = {
  open: boolean
  isReadOnly: boolean
  postLoading: boolean
  title?: string
  description?: string
  body?: string
  onCancel: () => void
  onConfirm: () => void
}

export default function RolePermissionConfirmModal({
  open,
  isReadOnly,
  postLoading,
  title,
  description,
  body,
  onCancel,
  onConfirm,
}: Props) {
  if (!open || isReadOnly) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white border border-red-400 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
          <div className="p-1.5 bg-red-100 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-900">{title || "Confirm Role Change"}</h3>
            <p className="text-[11px] text-red-600 mt-0.5">
              {description ||
                "You are updating role & user entitlement permissions. This can impact access for many users."}
            </p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-gray-700">
            {body || "Please review your changes carefully. Proceed only if you are sure about this update."}
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 text-xs rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              disabled={postLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="px-3 py-1.5 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              disabled={postLoading}
            >
              {postLoading ? "Saving..." : "Yes, Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
