"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useSession } from "next-auth/react"

interface PredefinedProperty {
  id?: string
  _id?: string
  prop: string
  description: string
  tenantCode?: string
  organizationCode?: string
}

interface PredefinedPropertiesPopupProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: PredefinedProperty) => Promise<boolean> | boolean
  initialValues?: PredefinedProperty | null
}

export default function PredefinedPropertiesPopup({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
}: PredefinedPropertiesPopupProps) {
  const [formData, setFormData] = useState({
    prop: "",
    description: "",
  })
  const tenantCode = useGetTenantCode()
  const { data: session } = useSession()

  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{
    prop?: string
    description?: string
  }>({})

  useEffect(() => {
    if (isOpen) {
      if (initialValues) {
        setFormData({
          prop: initialValues.prop || "",
          description: initialValues.description || "",
        })
      } else {
        setFormData({
          prop: "",
          description: "",
        })
      }
      setFormErrors({})
    }
  }, [isOpen, initialValues])

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Clear field error on change
    setFormErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const {
    post: postPredefinedProperty,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: "preDefinedProps",
    onSuccess: (data) => {
    },
    onError: (error) => {
    },
  })

  const submitForm = async () => {
    // Basic validation
    const errors: { prop?: string; description?: string } = {}
    if (!formData.prop.trim()) errors.prop = "Property name is required"
    if (!formData.description.trim()) errors.description = "Description is required"

    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)

    // When adding, don't include id - use _id instead
    // When editing, include _id in propertyData
    const propertyData: any = {
      ...(initialValues ? { _id: initialValues._id || initialValues.id } : {}), // Include _id when editing
      prop: formData.prop.trim(),
      description: formData.description.trim(),
      tenantCode: tenantCode,
      organizationCode: tenantCode,
    }

    // Add createdOn and createdBy only when creating (not editing)
    if (!initialValues) {
      propertyData.createdBy = session?.user?.name || ""
      propertyData.createdOn = new Date().toISOString()
    }

    const data = {
      tenant: tenantCode,
      action: initialValues ? "insert" : "insert",
      _id: initialValues?._id || initialValues?.id || null, // Use _id instead of id
      event: "save",
      collectionName: "preDefinedProps",
      data: propertyData,
    }

    postPredefinedProperty(data)

    try {
      const success = await onSubmit(propertyData)
      if (success) {
        onClose()
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden" // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  // Input styles aligned with reference design
  const fieldStyles =
    "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition rounded-md"

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4 pb-4 pt-0"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-2xl flex flex-col">
        <div className="bg-white rounded-lg shadow-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-700">
                {initialValues ? "Edit AI Chat Property" : "Add New AI Chat Property"}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void submitForm()
              }}
              className="space-y-6"
            >
              {/* Property Name */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Property Name <span className="text-red-500 normal-case">*</span>
                </label>
                <Input
                  id="prop"
                  type="text"
                  value={formData.prop}
                  onChange={(e) => handleInputChange("prop", e.target.value)}
                  className={fieldStyles}
                  placeholder="e.g., temperature, max_tokens"
                />
                {formErrors.prop && (
                  <div className="text-red-500 text-xs mt-1">{formErrors.prop}</div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Description <span className="text-red-500 normal-case">*</span>
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 shadow-sm resize-none transition"
                  placeholder="Enter a detailed description of the property..."
                  rows={6}
                />
                {formErrors.description && (
                  <div className="text-red-500 text-xs mt-1">{formErrors.description}</div>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-800 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitForm}
              disabled={loading || postLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-md hover:from-blue-700 hover:to-blue-800 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700"
            >
              {(loading || postLoading) ? "Saving..." : initialValues ? "Update Property" : "Add Property"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

