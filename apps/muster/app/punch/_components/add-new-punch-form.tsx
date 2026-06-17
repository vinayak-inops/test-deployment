"use client"

import { useState, useEffect, useMemo } from "react"
import { X, Save, Clock, User, Building, Calendar, Upload, BarChart3, UserCheck, MessageSquare, AlertCircle, Info } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search"
import { json } from "node:stream/consumers"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ActionButtons from "@/components/common/action-buttons"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"


interface AddNewPunchFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<boolean>
  initialValues?: any
}

export default function AddNewPunchForm({ isOpen, onClose, onSubmit, initialValues }: AddNewPunchFormProps) {
  const  tenantCode  = useGetTenantCode();
  // Role permissions (same as serviceName component)
    // Centralized role-permissions
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "muster",
    screenName: "addNewPunch",
});

  // Get cookie information
  const getCookie = (name: string): string | undefined => {
    if (typeof window === 'undefined') return undefined;
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.startsWith(name + '=')) {
        const value = cookie.substring(name.length + 1);
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }
    }
    return undefined;
  };

  // Get stored role information from cookies
  const storedRoleInfo = useMemo(() => {
    try {
      const keyclockroleinfo = getCookie("keyclockroleinfo");
      if (keyclockroleinfo) {
        return JSON.parse(keyclockroleinfo);
      }
    } catch (error) {
      // ignore parse errors
    }
    return null as any;
  }, []);

  // Check if user can edit Employee ID based on permissions (similar to punch-form-popup)
  const canEditEmployeeId = useMemo(() => {
    if (rolePermissions?.addPunchAll) return true;
    if (!storedRoleInfo?.employeeId) return true;
    return false;
  }, [rolePermissions, storedRoleInfo]);
  const [formData, setFormData] = useState({
    punchedTime: "",
    transactionTime: "",
    inOut: "I",
    typeOfMovement: "P",
    readerSerialNumber: "",
    uploadTime: "",
    attendanceDate: "",
    employeeID: "",
    organizationCode: tenantCode,
    tenantCode: tenantCode,
    isDeleted: false,
    state: "new",
    date: "",
    processed: false,
    remarks: ""
  })

  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{ employeeID?: string; attendanceDate?: string; time?: string; inOut?: string; typeOfMovement?: string }>({})

  useEffect(() => {
    if (isOpen) {
      const now = new Date()
      const currentDate = now.toISOString().split('T')[0]
      const currentTime = now.toISOString().slice(0, 19)
      
      // Set employeeID based on permissions (similar to punch-form-popup)
      const employeeIdValue = canEditEmployeeId 
        ? (initialValues?.employeeID || "") 
        : (storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || initialValues?.employeeID || "");
      
      setFormData({
        punchedTime: currentTime,
        transactionTime: currentTime,
        inOut: "I",
        typeOfMovement: "P",
        readerSerialNumber: "MANUAL",
        uploadTime: currentTime,
        attendanceDate: currentDate,
        employeeID: employeeIdValue,
        organizationCode: tenantCode,
        tenantCode: tenantCode,
        isDeleted: false,
        state: "new",
        date: now.toISOString().slice(0, 19),
        processed: false,
        remarks: ""
      })
    }
  }, [isOpen, initialValues, canEditEmployeeId, storedRoleInfo])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear field error on change
    setFormErrors(prev => ({ ...prev, [field === 'punchedTime' ? 'time' : field]: undefined }))
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

  const submitForm = async () => {
    // Ensure employeeID is set from storedRoleInfo if user doesn't have edit permission
    const finalEmployeeID = !canEditEmployeeId && !formData.employeeID
      ? (storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || '')
      : formData.employeeID;

    // Basic validation
    const errors: { employeeID?: string; attendanceDate?: string; time?: string; inOut?: string; typeOfMovement?: string } = {}
    if (!finalEmployeeID) errors.employeeID = 'Employee is required'
    if (!formData.attendanceDate) errors.attendanceDate = 'Attendance date is required'
    if (!formData.punchedTime) errors.time = 'Time is required'
    if (!formData.inOut) errors.inOut = 'Select In/Out'
    if (!formData.typeOfMovement) errors.typeOfMovement = 'Select movement type'
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) return

    setLoading(true)

    const data = {
      tenant: tenantCode,
      action: "insert",
      id: null,
      event: "save",
      collectionName: "data_check",
      data: {
        ...formData,
        employeeID: finalEmployeeID,
        createdBy: storedRoleInfo?.employeeId ||  ''
      }
    }
    
    postShiftZone(data)
    
    try {
      const success = await onSubmit({
        ...formData,
        employeeID: finalEmployeeID
      })
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

  // Input styles aligned with AttendancePopup
  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"

  if (!isOpen) return null
  


  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 "
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-4xl flex flex-col">
        <Card className="w-full max-h-[90vh] flex flex-col overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">Add New Punch</CardTitle>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          {/* Form Content */}
          <CardContent className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
            
            <form onSubmit={(e) => { e.preventDefault(); void submitForm(); }} className="space-y-6">

              {/* Basic Information */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {canEditEmployeeId ? (
                      <EmployeeSearchField
                        label="Employee"
                        required
                        isOpen={isOpen}
                        errorText={formErrors.employeeID}
                        onSelect={(emp: EmpType) => {
                          setFormData(prev => ({ ...prev, employeeID: emp.employeeID }))
                        }}
                        onClear={() => setFormData(prev => ({ ...prev, employeeID: "" }))}
                      />
                    ) : (
                      <>
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Employee ID <span className="text-red-500 normal-case">*</span>
                        </Label>
                        <Input
                          id="employeeID"
                          type="text"
                          value={formData.employeeID || storedRoleInfo?.employeeId || storedRoleInfo?.employeeID || ''}
                          readOnly
                          className="h-9 border-gray-300 px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-600 w-full cursor-not-allowed"
                          placeholder="e.g., 12345"
                        />
                      </>
                    )}
                    {formErrors.employeeID && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.employeeID}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Attendance Date <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Input
                      id="attendanceDate"
                      type="date"
                      value={formData.attendanceDate}
                      onChange={(e) => handleInputChange('attendanceDate', e.target.value)}
                      className={fieldStyles}
                    />
                    {formErrors.attendanceDate && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.attendanceDate}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timing Details */}
              <div className="space-y-3">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Time <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Input
                      id="time"
                      type="datetime-local"
                      value={formData.punchedTime}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        const fullTimeValue = timeValue.length === 16 ? timeValue + ":00" : timeValue;
                        handleInputChange('punchedTime', fullTimeValue);
                        handleInputChange('transactionTime', fullTimeValue);
                        handleInputChange('uploadTime', fullTimeValue);
                      }}
                      className={fieldStyles}
                    />
                    <p className="text-xs text-gray-500">This time will be used for both Punched Time and Transaction Time</p>
                    {formErrors.time && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.time}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Punch Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      In/Out Status <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <select
                      value={formData.inOut}
                      onChange={(e) => handleInputChange('inOut', e.target.value)}
                      className="h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition w-full"
                    >
                      <option value="">Select One</option>
                      <option value="I">IN</option>
                      <option value="O">OUT</option>
                    </select>
                    {formErrors.inOut && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.inOut}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Type of Movement <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <select
                      value={formData.typeOfMovement}
                      onChange={(e) => handleInputChange('typeOfMovement', e.target.value)}
                      className="h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition w-full"
                    >
                      <option value="">Select One</option>
                      <option value="P">Personal</option>
                      <option value="O">Official</option>
                    </select>
                    {formErrors.typeOfMovement && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.typeOfMovement}</div>
                    )}
                  </div>
                </div>
              </div>



              {/* Additional Information */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Remarks
                  </Label>
                  <textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 shadow-sm resize-none transition mb-0"
                    placeholder="Additional notes or comments..."
                    rows={3}
                  />
                </div>
              </div>

            </form>
          </CardContent>

          {/* Footer */}
          <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
            <ActionButtons
              layout="end"
              secondaryLabel="Cancel"
              onSecondary={onClose}
              primaryLabel="ADD PUNCH"
              onPrimary={submitForm}
              primaryLoading={loading}
              className="w-full"
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
