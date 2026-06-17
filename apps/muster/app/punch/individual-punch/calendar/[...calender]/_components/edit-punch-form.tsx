"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { useSession } from "next-auth/react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Label } from "@repo/ui/components/ui/label"
import { Input } from "@repo/ui/components/ui/input"
import ActionButtons from "@/components/common/action-buttons"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/search/keyclock-role-info"


interface PunchRecord {
  id: string
  _id?: any
  employeeId: string
  name: string
  date: string
  type: "punch-in" | "punch-out" | "default"
  timestamp: string
  punchedTimeISO?: string
  transactionTime: string
  transactionTimeISO?: string
  notes?: string
  typeOfMovement?: string
}

interface EditPunchFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<boolean>
  punchRecord: PunchRecord | null
  employeeId: string
  employeeName?: string
  attendanceDetail?: any
  month:any
  year:any
}

export default function EditPunchForm({
  isOpen,
  onClose,
  onSubmit,
  punchRecord,
  employeeId,
  employeeName,
  attendanceDetail,
  month,
  year
}: EditPunchFormProps) {
  const { data: session } = useSession()
  const [formData, setFormData] = useState({
    newAttendanceDate: "",
    transactionTime: "",
    inOut: "I",
    isDeleted: "false",
    typeOfMovement: "P",
    appliedDate: "",
    remarks: ""
  })
  const [loading, setLoading] = useState(false)
  const [formErrors, setFormErrors] = useState<{ 
    newAttendanceDate?: string
    transactionTime?: string
    inOut?: string
    isDeleted?: string
    typeOfMovement?: string
    appliedDate?: string
    remarks?: string
  }>({})
  const tenantCode = useGetTenantCode();
  const { employeeId: uploadedBy } = useKeyclockRoleInfo();
  const {
    post: postShiftZone,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "editPunchApplication",
    onSuccess: (data) => {
      toast.success("Punch application submitted successfully!")
      setLoading(false)
      onSubmit(data).then(() => {
        onClose()
      })
    },
    onError: (error) => {
      console.error("POST error:", error)
      toast.error("Failed to submit punch application")
      setLoading(false)
    },
  })

  // Helper: normalize ISO string to datetime-local value (YYYY-MM-DDTHH:mm:ss)
  const toDatetimeLocalValue = (iso: string) => {
    if (!iso) return ''
    
    // Remove timezone info and milliseconds if present
    let base = iso.split('.')[0].split('+')[0].split('Z')[0].trim()
    
    // Handle formats like "2024-01-15T14:30:00" or "2024-01-15T14:30"
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(base)) {
      return /:\d{2}$/.test(base) ? base : `${base}:00`
    }
    
    // Handle formats like "2024-01-15 14:30:00" (space instead of T)
    if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/.test(base)) {
      base = base.replace(/\s+/, 'T')
      return /:\d{2}$/.test(base) ? base : `${base}:00`
    }
    
    // Try to parse as Date and convert
    try {
      const date = new Date(iso)
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')
        const seconds = String(date.getSeconds()).padStart(2, '0')
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
      }
    } catch {
      // Ignore parse errors
    }
    
    return ''
  }

  // Helper to extract 24-hour time from various formats
  const extract24HourTime = (timeString: string): string | null => {
    if (!timeString) return null
    const match24 = timeString.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/)
    if (match24) {
      return `${match24[1]}:${match24[2]}`
    }
    const match12 = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (match12) {
      let hours = parseInt(match12[1], 10)
      const minutes = match12[2]
      const period = match12[3].toUpperCase()
      if (period === 'PM' && hours !== 12) {
        hours += 12
      } else if (period === 'AM' && hours === 12) {
        hours = 0
      }
      return `${hours.toString().padStart(2, '0')}:${minutes}`
    }
    return null
  }

  // Build a datetime-local string from either an ISO string or a time string plus date
  const normalizeToDatetimeLocal = (dateStr: string | undefined, value: string | undefined) => {
    if (!value) return ''
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
      return toDatetimeLocalValue(value)
    }
    if (!dateStr) return ''
    const time24 = extract24HourTime(value)
    if (time24) {
      return `${dateStr}T${time24}:00`
    }
    return ''
  }

  // Helper function to format time for display
  const formatTimeForDisplay = (timeString: string) => {
    if (!timeString) return ''
    if (/^\d{2}:\d{2}$/.test(timeString)) {
      return timeString
    }
    if (timeString.includes('AM') || timeString.includes('PM')) {
      const [time, period] = timeString.split(' ')
      const [hours, minutes] = time.split(':')
      let hour = parseInt(hours)
      if (period === 'PM' && hour !== 12) {
        hour += 12
      } else if (period === 'AM' && hour === 12) {
        hour = 0
      }
      return `${hour.toString().padStart(2, '0')}:${minutes}`
    }
    return timeString
  }

  // Utility to parse datetime string without timezone conversion
  function parseLocalDateTime(dateTimeString: string): { year: number; month: number; day: number; hours: number; minutes: number; seconds: number } | null {
    if (!dateTimeString) return null
    const match = dateTimeString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/)
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10),
        day: parseInt(match[3], 10),
        hours: parseInt(match[4], 10),
        minutes: parseInt(match[5], 10),
        seconds: parseInt(match[6] || '0', 10)
      }
    }
    try {
      const date = new Date(dateTimeString)
      if (!isNaN(date.getTime())) {
        return {
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          day: date.getDate(),
          hours: date.getHours(),
          minutes: date.getMinutes(),
          seconds: date.getSeconds()
        }
      }
    } catch {
      // Ignore
    }
    return null
  }

  // Utility to format datetime in a human-readable way
  function formatDateTimeReadable(isoString: string) {
    if (!isoString) return '-'
    try {
      const parsed = parseLocalDateTime(isoString)
      if (parsed) {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December']
        const monthName = monthNames[parsed.month - 1]
        const day = parsed.day
        const year = parsed.year
        let hours = parsed.hours
        const minutes = String(parsed.minutes).padStart(2, '0')
        const seconds = String(parsed.seconds).padStart(2, '0')
        const ampm = hours >= 12 ? 'PM' : 'AM'
        hours = hours % 12 || 12
        const hoursStr = String(hours).padStart(2, '0')
        return `${monthName} ${day}, ${year} at ${hoursStr}:${minutes}:${seconds} ${ampm}`
      }
      const cleaned = isoString.split('.')[0].replace('T', ' ')
      return cleaned || isoString
    } catch {
      const cleaned = isoString.split('.')[0].replace('T', ' ')
      return cleaned || isoString
    }
  }

  // Initialize form when punch record changes
  useEffect(() => {
    if (isOpen && punchRecord) {
      // Set transaction time value - use raw ISO value if available
      let transactionTimeValue = ""
      if (punchRecord.transactionTimeISO) {
        const normalized = toDatetimeLocalValue(punchRecord.transactionTimeISO)
        if (normalized) {
          transactionTimeValue = normalized
        }
      }
      
      if (!transactionTimeValue && punchRecord.punchedTimeISO) {
        const normalized = toDatetimeLocalValue(punchRecord.punchedTimeISO)
        if (normalized) {
          transactionTimeValue = normalized
        }
      }
      
      if (!transactionTimeValue) {
        const existingTransactionTime = normalizeToDatetimeLocal(punchRecord.date, punchRecord.transactionTime)
        const punchedTimeValue = normalizeToDatetimeLocal(punchRecord.date, punchRecord.timestamp)
        transactionTimeValue = existingTransactionTime || punchedTimeValue
      }
      
      // Final fallback: use current date/time if still empty
      if (!transactionTimeValue && punchRecord.date) {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        const seconds = String(now.getSeconds()).padStart(2, '0')
        transactionTimeValue = `${punchRecord.date}T${hours}:${minutes}:${seconds}`
      }

      const typeOfMovement = (
        (punchRecord as any)?.typeOfMovement ?? 
        (attendanceDetail as any)?.typeOfMovement ?? 
        "P"
      ).toString().trim().toUpperCase()

      setFormData({
        newAttendanceDate: punchRecord.date,
        transactionTime: transactionTimeValue,
        inOut: punchRecord.type === "punch-in" ? "I" : "O",
        isDeleted: "false",
        typeOfMovement: typeOfMovement,
        appliedDate: punchRecord.date,
        remarks: punchRecord.notes || ""
      })
      setFormErrors({})
    }
  }, [isOpen, punchRecord, attendanceDetail])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear field error on change
    setFormErrors(prev => ({ ...prev, [field]: undefined }))
  }

  const handleSubmit = async () => {
    // Validation
    const errors: {
      newAttendanceDate?: string
      transactionTime?: string
      inOut?: string
      isDeleted?: string
      typeOfMovement?: string
      appliedDate?: string
      remarks?: string
    } = {}
    if (!formData.newAttendanceDate) errors.newAttendanceDate = 'New attendance date is required'
    if (!formData.transactionTime) errors.transactionTime = 'Transaction time is required'
    if (!formData.inOut) errors.inOut = 'Swipe mode is required'
    if (!formData.isDeleted) errors.isDeleted = 'Is deleted is required'
    if (!formData.typeOfMovement) errors.typeOfMovement = 'Type of movement is required'
    if (!formData.appliedDate) errors.appliedDate = 'Applied date is required'
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      toast.error('Please fill all required fields')
      return
    }

    setLoading(true)

    // Helper functions for date formatting
    const pad = (n: number) => n < 10 ? `0${n}` : n
    
    // Get current time in Indian Standard Time (IST)
    const now = new Date()
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }))
    
    const yyyy = istTime.getFullYear()
    const mm = pad(istTime.getMonth() + 1)
    const dd = pad(istTime.getDate())
    const hh = pad(istTime.getHours())
    const min = pad(istTime.getMinutes())
    const ss = pad(istTime.getSeconds())
    const ms = pad(istTime.getMilliseconds())
    
    // Normalize various inputs to ISO with seconds (YYYY-MM-DDTHH:mm:ss)
    const toIsoSeconds = (input: string, fallbackDate?: string) => {
      if (!input) return ''
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(input)) {
        const base = input.split('.')[0]
        return /:\d{2}$/.test(base) ? base : `${base}:00`
      }
      if (!fallbackDate) return ''
      const parts = input.split(':')
      const hh = pad(parseInt(parts[0] || '0'))
      const mm = pad(parseInt(parts[1] || '0'))
      const ss = pad(parseInt(parts[2] || '0'))
      return `${fallbackDate}T${hh}:${mm}:${ss}`
    }

    // Derive ISO strings
    const punchedTimeISO = toIsoSeconds(
      formatTimeForDisplay(punchRecord?.timestamp || ''),
      punchRecord?.date || ''
    )
    const transactionTimeISO = toIsoSeconds(formData.transactionTime)
    
    // Validate that times are in correct format
    if (!punchedTimeISO || !transactionTimeISO) {
      toast.error('Invalid time format. Please check your inputs.')
      setLoading(false)
      return
    }
    
    // createdOn: 'YYYY-MM-DDTHH:mm:ss.sss+05:30' (IST timezone offset)
    const createdOn = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}.${ms}+05:30`
    // uploadTime: 'YYYY-MM-DDTHH:mm:ss'
    const uploadTime = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`
    
    
    // Create the merged object with edited and non-edited values
    const mergedData = {
      employeeID: employeeId,
      punchedTime: punchedTimeISO,
      transactionTime: transactionTimeISO,
      inOut: formData.inOut,
      typeOfMovement: formData.typeOfMovement,
      newAttendanceDate: formData.newAttendanceDate,
      attendanceDate: punchRecord?.date,
      isDeleted: formData.isDeleted === 'true',
      appliedDate: formData.appliedDate,
      remarks: formData.remarks,
      tenantCode: tenantCode,
      workflowName: "EditPunch Application",
      organizationCode: tenantCode,
      stateEvent: "NEXT",
      state: "new",
      uploadedBy: uploadedBy,
      createdOn: createdOn,
      uploadTime: uploadTime,
      year: year,
      month: month,
      createdBy: uploadedBy,
      workflowState: "INITIATED",
      punchID: punchRecord?._id || null,
    }

    const postData = {
      tenant: tenantCode,
      action: "insert",
      id: null,
      event: "application",
      collectionName: "editPunchApplication",
      data: mergedData,
    }
    postShiftZone(postData)
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
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  // Input styles aligned with AddNewPunchForm
  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"

  if (!isOpen || !punchRecord) return null

  const punchedTimeDisplay = punchRecord.punchedTimeISO
    ? formatDateTimeReadable(punchRecord.punchedTimeISO)
    : (punchRecord.timestamp && punchRecord.date
        ? formatDateTimeReadable(`${punchRecord.date}T${formatTimeForDisplay(punchRecord.timestamp)}:00`)
        : '')

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-4xl flex flex-col">
        <Card className="w-full max-h-[80vh] flex flex-col overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">Edit Punch Record</CardTitle>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {employeeName && (
              <p className="text-sm text-gray-500 mt-1">
                {employeeName} ({employeeId}) - {punchRecord.type}
              </p>
            )}
          </CardHeader>

          {/* Form Content */}
          <CardContent className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
            <form onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Employee ID <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Input
                      type="text"
                      value={employeeId}
                      readOnly
                      className="h-9 border-gray-300 px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-600 w-full cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Attendance Date
                    </Label>
                    <Input
                      type="date"
                      value={punchRecord.date}
                      readOnly
                      className="h-9 border-gray-300 px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-600 w-full cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      New Attendance Date <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.newAttendanceDate}
                      onChange={(e) => handleInputChange('newAttendanceDate', e.target.value)}
                      className={fieldStyles}
                    />
                    {formErrors.newAttendanceDate && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.newAttendanceDate}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Timing Details */}
              <div className="space-y-3">
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Punched Time
                    </Label>
                    <Input
                      type="text"
                      value={punchedTimeDisplay}
                      readOnly
                      className="h-9 border-gray-300 px-3 py-1.5 text-sm rounded-md bg-gray-100 text-gray-600 w-full cursor-not-allowed"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Transaction Time <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      step="1"
                      value={formData.transactionTime}
                      onChange={(e) => handleInputChange('transactionTime', e.target.value)}
                      className={fieldStyles}
                    />
                    {formErrors.transactionTime && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.transactionTime}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Punch Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Swipe Mode <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <select
                      value={formData.inOut}
                      onChange={(e) => handleInputChange('inOut', e.target.value)}
                      className="h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition w-full"
                    >
                      <option value="">Select One</option>
                      <option value="I">In</option>
                      <option value="O">Out</option>
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
                      <option value="O">Official(Authorization)</option>
                      <option value="B">Break</option>
                    </select>
                    {formErrors.typeOfMovement && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.typeOfMovement}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Is Deleted <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <select
                      value={formData.isDeleted}
                      onChange={(e) => handleInputChange('isDeleted', e.target.value)}
                      className="h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition w-full"
                    >
                      <option value="">Select One</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                    {formErrors.isDeleted && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.isDeleted}</div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Applied Date <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={formData.appliedDate}
                      onChange={(e) => handleInputChange('appliedDate', e.target.value)}
                      className={fieldStyles}
                    />
                    {formErrors.appliedDate && (
                      <div className="text-red-500 text-xs mt-1">{formErrors.appliedDate}</div>
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
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 shadow-sm resize-none transition mb-0"
                    placeholder="Enter remarks"
                    rows={3}
                  />
                  {formErrors.remarks && (
                    <div className="text-red-500 text-xs mt-1">{formErrors.remarks}</div>
                  )}
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
              primaryLabel="Save Changes"
              onPrimary={handleSubmit}
              primaryLoading={loading || postLoading}
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

