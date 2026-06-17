"use client"

import { useState, useEffect } from "react"
import { X, Save, Clock, User, Building, Calendar, Upload, BarChart3, UserCheck, MessageSquare, AlertCircle } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { json } from "node:stream/consumers"
import {useGetTenantCode} from "@/hooks/useGetTenantCode"


interface AddNewPunchFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<boolean>
  initialValues?: any
}

export default function AddNewPunchForm({ isOpen, onClose, onSubmit, initialValues }: AddNewPunchFormProps) {
  const tenantCode = useGetTenantCode();
  const [formData, setFormData] = useState({
    punchedTime: "",
    transactionTime: "",
    inOut: "I",
    typeOfMovement: "P",
    readerSerialNumber: "",
    uploadTime: "",
    attendanceDate: "",
    employeeID: "",
    organizationCode: "ALL",
    tenantCode: tenantCode,
    isDeleted: "false",
    state: "new",
    date: "",
    processed: false,
    remarks: ""
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      const currentDate = now.toISOString().split('T')[0]
      const currentTime = now.toISOString().slice(0, 16)
      
      setFormData({
        punchedTime: currentTime,
        transactionTime: currentTime,
        inOut: "I",
        typeOfMovement: "P",
        readerSerialNumber: "MANUAL",
        uploadTime: currentTime,
        attendanceDate: currentDate,
        employeeID: initialValues?.employeeID || "",
        organizationCode: tenantCode,
        tenantCode: tenantCode,
        isDeleted: "false",
        state: "new",
        date: now.toISOString(),
        processed: false,
        remarks: ""
      })
    }
  }, [isOpen, initialValues])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const {
    post: postShiftZone,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: "muster/data_check",
    onSuccess: (data) => {
    },
    onError: (error) => {
      // Optionally handle error (e.g., show a toast)
      console.error("POST error:", error);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const data = {
      tenant: tenantCode,
      action: "insert",
      id: null,
      event: "save",
      collectionName: "data_check",
      data: {
        ...formData,
        _class:"com.inops.rule.engine.collection.PunchRecord"
      }
    }
    
    postShiftZone(data)
    
    try {
      const success = await onSubmit(formData)
      if (success) {
        onClose()
      }
    } catch (error) {
      console.error('Error submitting form:', error)
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

  // Common field styles for consistent height
  const fieldStyles = "w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm transition hover:border-blue-400"

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 -mt-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: "90vh" }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-6 w-6" />
              Add New Punch
            </h2>
            <p className="text-blue-100 text-sm mt-1">Create a new punch record for attendance tracking</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                  <p className="text-sm text-blue-800 font-medium">
                    Fill in the details below to create a new punch record
                  </p>
                </div>
              </div>

              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Basic Information
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Employee ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="employeeID"
                      type="text"
                      value={formData.employeeID}
                      readOnly
                      className="w-full h-10 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-600 cursor-not-allowed"
                      placeholder="e.g., 12345"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Attendance Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="attendanceDate"
                      type="date"
                      value={formData.attendanceDate}
                      onChange={(e) => handleInputChange('attendanceDate', e.target.value)}
                      className={fieldStyles}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Timing Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Timing Details
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="time"
                      type="datetime-local"
                      value={formData.punchedTime}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        handleInputChange('punchedTime', timeValue);
                        handleInputChange('transactionTime', timeValue);
                      }}
                      className={fieldStyles}
                      required
                    />
                    <p className="text-xs text-gray-500">This time will be used for both Punched Time and Transaction Time</p>
                  </div>
                </div>
              </div>

              {/* Punch Details Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2">
                  <UserCheck className="h-5 w-5 text-blue-600" />
                  Punch Details
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      In/Out Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.inOut}
                      onChange={(e) => handleInputChange('inOut', e.target.value)}
                      className={fieldStyles}
                      required
                    >
                      <option value="">Select One</option>
                      <option value="I">IN</option>
                      <option value="O">OUT</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Type of Movement <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.typeOfMovement}
                      onChange={(e) => handleInputChange('typeOfMovement', e.target.value)}
                      className={fieldStyles}
                      required
                    >
                      <option value="">Select One</option>
                      <option value="P">Personal</option>
                      <option value="O">Official</option>
                    </select>
                  </div>
                </div>
              </div>



              {/* Remarks Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-800 border-b border-blue-200 pb-2">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  Additional Information
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Remarks
                  </label>
                  <textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:shadow-lg shadow-sm resize-none transition hover:border-blue-400"
                    placeholder="Additional notes or comments..."
                    rows={4}
                  />
                </div>
              </div>

              

              {/* Bottom padding for scroll */}
              <div className="pb-4"></div>
            </form>
          </div>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 flex-shrink-0 rounded-b-xl">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2 h-10 rounded-md font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-2 h-10 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Inserting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>ADD PUNCH</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
