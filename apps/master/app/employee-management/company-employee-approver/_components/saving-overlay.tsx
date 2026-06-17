"use client"

import React from "react"

interface SavingOverlayProps {
  isVisible: boolean
  message?: string
}

export default function SavingOverlay({ isVisible, message = "Saving…" }: SavingOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
      <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
        <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  )
}

