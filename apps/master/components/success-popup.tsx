"use client"

import React from "react"
import { createPortal } from "react-dom"
import { CheckCircle } from "lucide-react"

interface SuccessPopupProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  autoCloseDelay?: number
}

export function SuccessPopup({
  isOpen,
  onClose,
  title,
  message,
  autoCloseDelay = 2000
}: SuccessPopupProps) {
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => setMounted(true), [])
  
  React.useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => onClose(), 1000)
    return () => clearTimeout(timer)
  }, [isOpen, onClose])
  
  if (!isOpen || !mounted) return null

  const content = (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] animate-in fade-in duration-200">
      <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-3">{title}</h3>
          <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
