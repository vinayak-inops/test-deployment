"use client"

import React from "react"
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"

interface BeautifulModalProps {
  isOpen: boolean
  onClose: () => void
  type?: "success" | "warning" | "error" | "info"
  title: string
  message: string
  showCloseButton?: boolean
  autoClose?: boolean
  autoCloseDelay?: number
}

export function BeautifulModal({
  isOpen,
  onClose,
  type = "success",
  title,
  message,
  showCloseButton = true,
  autoClose = true,
  autoCloseDelay = 3000
}: BeautifulModalProps) {
  
  React.useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)
      
      return () => clearTimeout(timer)
    }
  }, [isOpen, autoClose, autoCloseDelay, onClose])

  if (!isOpen) return null

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          titleColor: "text-green-800",
          messageColor: "text-green-700",
          icon: CheckCircle
        }
      case "warning":
        return {
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          iconColor: "text-yellow-600",
          titleColor: "text-yellow-800",
          messageColor: "text-yellow-700",
          icon: AlertTriangle
        }
      case "error":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconColor: "text-red-600",
          titleColor: "text-red-800",
          messageColor: "text-red-700",
          icon: XCircle
        }
      case "info":
        return {
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          iconColor: "text-blue-600",
          titleColor: "text-blue-800",
          messageColor: "text-blue-700",
          icon: Info
        }
      default:
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconColor: "text-green-600",
          titleColor: "text-green-800",
          messageColor: "text-green-700",
          icon: CheckCircle
        }
    }
  }

  const styles = getTypeStyles()
  const IconComponent = styles.icon

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative transform transition-all duration-300 ease-out scale-100 opacity-100 max-w-md w-full mx-auto`}>
        <div className={`${styles.bgColor} ${styles.borderColor} border-2 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300`}>
          {/* Header with Icon */}
          <div className="relative p-6 pb-4">
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-200 transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            )}
            
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-full ${styles.bgColor} border ${styles.borderColor}`}>
                <IconComponent className={`h-8 w-8 ${styles.iconColor}`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-xl font-bold ${styles.titleColor}`}>
                  {title}
                </h3>
              </div>
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 pb-6">
            <p className={`text-sm leading-relaxed ${styles.messageColor}`}>
              {message}
            </p>
          </div>
          
          {/* Footer */}
          <div className="px-6 pb-6 flex justify-end space-x-3">
            <Button
              onClick={onClose}
              variant="outline"
              className={`border-2 ${styles.borderColor} ${styles.titleColor} hover:${styles.bgColor} transition-colors duration-200`}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
