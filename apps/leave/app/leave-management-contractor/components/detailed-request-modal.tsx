"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { ArrowLeft, ChevronRight, ChevronDown, Trash2, ChevronUp, Upload, File, X } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@repo/ui/components/ui/dialog"
import { Badge } from "@repo/ui/components/ui/badge"
import { cn } from "@repo/ui/lib/utils"
import { useSession } from "next-auth/react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useLeaveCodes } from "../../../hooks/useLeaveCodes"
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useKeyclockRoleInfo } from '@/hooks/search/keyclock-role-info'
import { useEmployeeDetails } from "@/hooks/search/useEmployeeDetails"

// Removed: import { useMessage } from "../hooks/useMessage";

// Transformed leave type for dropdown
interface LeaveType {
  id: string
  label: string
  leaveCode: string
  leaveTitle: string
}

interface DetailedRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onBack?: () => void
  selectedDates: number[]
  selectedFullDates?: Date[]
  currentDate: Date
  selectedLeaveType?: string
  selectedEmployeeId: string
  onDateDelete?: (dateToDelete: number) => void
  preferredMultiDateMode?: "all" | "individual"
}

export function DetailedRequestModal({ isOpen, onClose, onBack, selectedDates, selectedFullDates, currentDate, selectedLeaveType, onDateDelete, selectedEmployeeId, preferredMultiDateMode }: DetailedRequestModalProps) {
  const [selectedDateIndex, setSelectedDateIndex] = useState(0) // Default to first date
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false)
  const [showAbsenceDropdown, setShowAbsenceDropdown] = useState(false)
  const [remarks, setRemarks] = useState("")
  const [absenceTypes, setAbsenceTypes] = useState<{ [key: number]: string }>({})
  const [days, setDays] = useState<{ [key: number]: string }>({})
  const [isEditIndividualDaysMode, setIsEditIndividualDaysMode] = useState(false)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const { data: session } = useSession()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const tenantCode = useGetTenantCode()
  
  // Get logged-in employee ID from hook
  const { employeeId } = useKeyclockRoleInfo()
  
  // Get cookie information for fallback
  const getCookie = (name: string): string | undefined => {
    if (typeof window === 'undefined') return undefined
    const cookies = document.cookie.split(';')
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim()
      if (cookie.startsWith(name + '=')) {
        const value = cookie.substring(name.length + 1)
        try {
          return decodeURIComponent(value)
        } catch {
          return value
        }
      }
    }
    return undefined
  }

  // Get stored role information from cookies
  const storedRoleInfo = useMemo(() => {
    try {
      const raw = getCookie('keyclockroleinfo')
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }, [])
  
  // Get authentication token
  const { token, loading: tokenLoading, error: tokenError } = useAuthToken()
  
    const { employee:selectedEmp, loading: empLoading, error: empError } =
      useEmployeeDetails(selectedEmployeeId);
  
    // Use the leave codes hook - only pass token when available
    const { leaveCodes, loading:leaveCodesLoading, error:leaveCodesError,  } = useLeaveCodes(selectedEmp)
  // Transform leave codes to match the expected format
  const leaveTypes: LeaveType[] = leaveCodes
    .filter(code => code.leaveCategory === "Time Away") // Only show Time Away leave types in detailed modal
    .map(code => ({
      id: code.leaveCode,
      label: code.leaveCodeWithTitle,
      leaveCode: code.leaveCode,
      leaveTitle: code.leaveTitle
    }))
  
  // Removed: const { showMessage } = useMessage();


  const {
    post: postLeaveApplication,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: "leaveApplication",
    onSuccess: (data) => {
      // Show success message with more details
      toast.success("✅ Leave request submitted successfully! Your application is now pending approval.", {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      // Delay closing the modal to allow user to see the message
      setTimeout(() => {
        onClose();
      }, 1000);
    },
    onError: (error) => {
      console.error("Leave application submission failed:", error);
      let errorMessage = "Failed to submit leave request. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network error: Unable to connect to the server. Please check your internet connection.";
        } else if (error.message.includes('CORS')) {
          errorMessage = "CORS error: The server is not allowing requests from this origin.";
        } else if (error.message.includes('401')) {
          errorMessage = "Authentication error: Your session may have expired. Please log in again.";
        } else if (error.message.includes('403')) {
          errorMessage = "Authorization error: You don't have permission to perform this action.";
        } else if (error.message.includes('500')) {
          errorMessage = "Server error: The server encountered an internal error. Please try again later.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast.error(`❌ ${errorMessage}`, {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    },
  });

  // Reset all state when modal opens or closes
  const resetState = () => {
    setSelectedDateIndex(0)
    setShowAdditionalInfo(false)
    setShowAbsenceDropdown(false)
    setRemarks("")
    setAbsenceTypes({})
    setDays({})
    setIsEditIndividualDaysMode(false)
    setShowConfirmationDialog(false)
    setUploadedFiles([])
    setIsDragOver(false)
  }

  // Pre-select leave type for all dates when modal opens and set editing mode based on preference
  useEffect(() => {
    if (isOpen && selectedLeaveType) {
      resetState()
      const initialAbsenceTypes: { [key: number]: string } = {}
      // Use selectedFullDates if available, otherwise use selectedDates
      const datesToProcess = selectedFullDates && selectedFullDates.length > 0 
        ? selectedFullDates
        : selectedDates.map(day => new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
      
      datesToProcess.forEach(date => {
        initialAbsenceTypes[date.getDate()] = selectedLeaveType
      })
      setAbsenceTypes(initialAbsenceTypes)
      if (preferredMultiDateMode === "individual") {
        setIsEditIndividualDaysMode(true)
      } else if (preferredMultiDateMode === "all") {
        setIsEditIndividualDaysMode(false)
      }
    }
  }, [isOpen, selectedLeaveType, selectedDates, selectedFullDates, preferredMultiDateMode, currentDate])

  // Handle back button click with refresh functionality
  const handleBackClick = () => {
    resetState() // Reset state before going back
    if (onBack) {
      onBack()
    } else {
      onClose()
    }
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const formatDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dayName = dayNames[date.getDay()]
    const monthName = monthNames[date.getMonth()].substring(0, 3)
    return `${dayName}, ${monthName} ${day}`
  }

  const formatFullDate = (date: Date) => {
    const dayName = dayNames[date.getDay()]
    const monthName = monthNames[date.getMonth()].substring(0, 3)
    return `${dayName}, ${monthName} ${date.getDate()}`
  }

  // Get the current selected date (either from selectedFullDates or selectedDates)
  const selectedDate = selectedFullDates && selectedFullDates.length > 0 
    ? selectedFullDates[selectedDateIndex]?.getDate() 
    : selectedDates[selectedDateIndex]
  const selectedAbsenceType = selectedDate ? absenceTypes[selectedDate] : undefined

  const handleSubmit = async () => {
    // Check if multiple dates are selected but not in edit individual days mode
    const dateCount = selectedFullDates && selectedFullDates.length > 0 ? selectedFullDates.length : selectedDates.length
    if (dateCount > 1 && !isEditIndividualDaysMode) {
      setShowConfirmationDialog(true)
      return
    }

    // Proceed with submission
    submitRequest()
  }

  const submitRequest = async () => {
    try {
      // Format dates for the API
      const formatDateForAPI = (date: Date) => {
        const dayStr = date.getDate().toString().padStart(2, '0')
        const monthStr = (date.getMonth() + 1).toString().padStart(2, '0')
        const yearStr = date.getFullYear().toString()
        return `${dayStr}-${monthStr}-${yearStr}`
      }

      // Validate required data
      const datesToProcess = selectedFullDates && selectedFullDates.length > 0 
        ? selectedFullDates
        : selectedDates.map(day => new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
      
      if (!datesToProcess || datesToProcess.length === 0) {
        throw new Error("No dates selected for leave application")
      }

      // Create leaves array from selected dates
      const leaves = datesToProcess.map(date => ({
        date: formatDateForAPI(date),
        leaveCode: absenceTypes[date.getDate()] || "CL",
        duration: (days[date.getDate()] || "Full Day").replace(" ", "-")
      }))

      // Sort dates to get from and to dates
      const sortedDates = [...datesToProcess].sort((a, b) => a.getTime() - b.getTime())
      const fromDate = formatDateForAPI(sortedDates[0])
      const toDate = formatDateForAPI(sortedDates[sortedDates.length - 1])

      // Format current date for appliedDate
      const today = new Date()
      const appliedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`

      // Format uploadTime as YYYY-MM-DDTHH:mm:ss
      const pad = (n: number) => n.toString().padStart(2, '0')
      const uploadTime = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(today.getHours())}:${pad(today.getMinutes())}:${pad(today.getSeconds())}`

      // Convert files to base64 strings
      const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      // Convert all uploaded files to base64
      const filePromises = uploadedFiles.map(async (file) => {
        const base64Data = await convertFileToBase64(file);
        return {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          base64Data: base64Data
        };
      });

      const fileData = await Promise.all(filePromises);

      // Get employee ID from hook, fallback to storedRoleInfo
      const uploadedBy = employeeId  || ''
      const createdBy = employeeId  || ''

      const payload = {
        tenant: tenantCode,
        action: "insert",
        collectionName: "leaveApplication",
        id: "",
        event: "application",
        data: {
          tenantCode: tenantCode,
          workflowName: "leave Application",
          stateEvent: "NEXT",
          uploadedBy: uploadedBy,
          createdBy: createdBy,
          createdOn: new Date().toISOString(),
          employeeID: selectedEmployeeId,
          fromDate: fromDate,
          toDate: toDate,
          leaves: leaves,
          uploadTime: uploadTime,
          organizationCode: tenantCode,
          appliedDate: appliedDate,
          workflowState: "INITIATED",
          remarks: remarks,
          documents: fileData,
          documentCount: uploadedFiles.length
        }
      }

      // Use the usePostRequest hook to submit the data
      await postLeaveApplication(payload);
    } catch (error) {
      console.error("Leave application submission failed:", error);
      
      let errorMessage = "Failed to submit leave request. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes('No dates selected')) {
          errorMessage = "Please select at least one date for the leave application.";
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = "Network error: Unable to connect to the server. Please check your internet connection.";
        } else if (error.message.includes('CORS')) {
          errorMessage = "CORS error: The server is not allowing requests from this origin.";
        } else if (error.message.includes('401')) {
          errorMessage = "Authentication error: Your session may have expired. Please log in again.";
        } else if (error.message.includes('403')) {
          errorMessage = "Authorization error: You don't have permission to perform this action.";
        } else if (error.message.includes('500')) {
          errorMessage = "Server error: The server encountered an internal error. Please try again later.";
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      toast.error(errorMessage);
    }
  }

  const handleConfirmationYes = () => {
    setShowConfirmationDialog(false)
    submitRequest()
  }

  const handleConfirmationNo = () => {
    setShowConfirmationDialog(false)
    setIsEditIndividualDaysMode(true)
  }

  const removeAbsenceType = (date: number) => {
    const newAbsenceTypes = { ...absenceTypes }
    delete newAbsenceTypes[date]
    setAbsenceTypes(newAbsenceTypes)
    setShowAbsenceDropdown(false)
  }

  const selectAbsenceType = (typeId: string) => {
    setAbsenceTypes({ ...absenceTypes, [selectedDate]: typeId })
    setShowAbsenceDropdown(false)
  }

  const handleDurationChange = (value: string) => {
    setDays({ ...days, [selectedDate]: value })
  }

  // File handling functions
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`);
        return false
      }

      // Check file type (allow common document types)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain'
      ]

      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.type} is not supported. Please upload PDF, Word documents, images, or text files.`);
        return false
      }

      return true
    })

    setUploadedFiles(prev => [...prev, ...newFiles])
  }

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <>
      {/* Toast Container for this modal */}
      <ToastContainer 
        position="top-right" 
        autoClose={5000} 
        hideProgressBar={false} 
        newestOnTop 
        closeOnClick 
        pauseOnFocusLoss 
        draggable 
        pauseOnHover 
        style={{ zIndex: 9999 }}
      />
      
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent
          className="sm:max-w-2xl p-0 gap-0 bg-white rounded-lg shadow-xl max-h-[80vh] flex flex-col"
          aria-describedby="request-absence-description"
        >
          {/* Header */}
          <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 space-y-0 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={handleBackClick} className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <DialogTitle className="text-base font-semibold text-slate-900">Request Absence</DialogTitle>
            </div>
          </DialogHeader>

          {/* Hidden description for screen readers */}
          <div id="request-absence-description" className="sr-only">
            Detailed form to request absence with date selection, leave type, duration, and comments.
          </div>

          {/* Content - Scrollable */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Panel - Only show when in edit individual days mode */}
            {isEditIndividualDaysMode && (
              <div className="w-1/2 border-r border-slate-200 flex flex-col">
                <div className="p-6 overflow-y-auto flex-1">
                    {/* Total Request Amount */}
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-slate-900 mb-4">
                        Total Request Amount: {(selectedFullDates && selectedFullDates.length > 0 ? selectedFullDates.length : selectedDates.length)} Day{(selectedFullDates && selectedFullDates.length > 0 ? selectedFullDates.length : selectedDates.length) !== 1 ? "s" : ""}
                      </h3>

                      {/* Date List */}
                      <div className="space-y-2">
                        {(selectedFullDates && selectedFullDates.length > 0
                          ? [...selectedFullDates].sort((a,b) => a.getTime() - b.getTime()).map((date, index) => (
                              <div
                                key={`${date.toISOString()}-${index}`}
                                className={cn(
                                  "w-full flex items-center justify-between p-3 rounded-md border transition-colors",
                                  selectedDateIndex === index
                                    ? "bg-blue-50 border-blue-200"
                                    : "bg-slate-50 border-slate-200 hover:bg-slate-100",
                                )}
                              >
                                <button
                                  onClick={() => setSelectedDateIndex(index)}
                                  className="flex-1 text-left"
                                >
                                  <div>
                                    <div className="text-sm font-medium text-slate-900">{formatFullDate(date)}</div>
                                    <div className="text-xs text-slate-600">
                                      {leaveTypes.find((opt) => opt.leaveCode === absenceTypes[date.getDate()])?.label || absenceTypes[date.getDate()] || "No Type"} • {days[date.getDate()] || "Full Day"}
                                    </div>
                                  </div>
                                </button>
                                <div className="flex items-center space-x-2">
                                  <ChevronRight className="h-4 w-4 text-slate-400" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const dateToDelete = date.getDate()
                                      if (onDateDelete) {
                                        onDateDelete(dateToDelete)
                                      }
                                    }}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                    title="Delete this date"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                          : selectedDates.map((date, index) => (
                              <div
                                key={date}
                                className={cn(
                                  "w-full flex items-center justify-between p-3 rounded-md border transition-colors",
                                  selectedDateIndex === index
                                    ? "bg-blue-50 border-blue-200"
                                    : "bg-slate-50 border-slate-200 hover:bg-slate-100",
                                )}
                              >
                                <button
                                  onClick={() => setSelectedDateIndex(index)}
                                  className="flex-1 text-left"
                                >
                                  <div>
                                    <div className="text-sm font-medium text-slate-900">{formatDate(date)}</div>
                                    <div className="text-xs text-slate-600">
                                      {leaveTypes.find((opt) => opt.leaveCode === absenceTypes[date])?.label || absenceTypes[date] || "No Type"} • {days[date] || "Full Day"}
                                    </div>
                                  </div>
                                </button>
                                <div className="flex items-center space-x-2">
                                  <ChevronRight className="h-4 w-4 text-slate-400" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      const dateToDelete = selectedDates[index]
                                      if (onDateDelete) {
                                        onDateDelete(dateToDelete)
                                      }
                                    }}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                    title="Delete this date"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    </div>

                  {/* Additional Information - Show when multiple dates are selected */}
                  {(selectedFullDates && selectedFullDates.length > 1) || (!selectedFullDates && selectedDates.length > 1) && (
                    <div className="mb-6">
                      <button
                        onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                        className="flex items-center space-x-2 text-slate-900 text-sm font-medium mb-3"
                      >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", !showAdditionalInfo && "-rotate-90")} />
                        <span>Additional Information</span>
                      </button>

                      {showAdditionalInfo && (
                        <div className="space-y-4">
                          {/* Document */}
                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2">Document</label>

                            {/* File Upload Area */}
                            <div
                              className={cn(
                                "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                                isDragOver
                                  ? "border-blue-400 bg-blue-50"
                                  : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                              )}
                              onDrop={handleFileDrop}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                            >
                              <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                                onChange={(e) => handleFileSelect(e.target.files)}
                                className="hidden"
                              />

                              <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                              <p className="text-slate-600 text-sm mb-2">
                                Drop files here or{" "}
                                <button
                                  type="button"
                                  onClick={() => fileInputRef.current?.click()}
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  browse
                                </button>
                              </p>
                              <p className="text-xs text-slate-500">
                                Supported: PDF, Word, Images, Text (Max 10MB each)
                              </p>
                            </div>

                            {/* File List */}
                            {uploadedFiles.length > 0 && (
                              <div className="mt-4 space-y-2">
                                <h4 className="text-xs font-medium text-slate-700">Uploaded Files:</h4>
                                {uploadedFiles.map((file, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-slate-50 rounded-md border"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <File className="h-4 w-4 text-slate-500" />
                                      <div>
                                        <p className="text-xs font-medium text-slate-900 truncate max-w-[200px]">
                                          {file.name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                          {formatFileSize(file.size)}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => removeFile(index)}
                                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                      title="Remove file"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Right Panel - Full width when not in edit mode, half width when in edit mode */}
            <div className={cn("flex flex-col", !isEditIndividualDaysMode ? "w-full" : "w-1/2")}>
              <div className="p-6 overflow-y-auto flex-1">
                {selectedDate !== undefined && (
                  <>
                    {/* Request Dates Section - Only show when not in edit individual days mode */}
                    {!isEditIndividualDaysMode && (
                      <div className="mb-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-3">Request Dates</h3>
                        <div className="space-y-1">
                          {(selectedFullDates && selectedFullDates.length > 0
                            ? [...selectedFullDates].sort((a,b) => a.getTime() - b.getTime()).map((date, idx) => (
                                <div key={`${date.toISOString()}-${idx}`} className="text-xs text-slate-700">
                                  {formatFullDate(date)}
                                </div>
                              ))
                            : selectedDates
                                .sort((a, b) => a - b)
                                .map((date) => (
                                  <div key={date} className="text-xs text-slate-700">
                                    {formatDate(date)}
                                  </div>
                                ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Type of Absence */}
                    <div className="mb-6">
                      <div className="flex items-center space-x-2 mb-3">
                        <label className="text-xs font-medium text-slate-900">Type of Absence</label>
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">?</span>
                        </div>
                      </div>

                      {/* Dropdown for Absence Types */}
                      <div className="relative">
                        <button
                          onClick={() => setShowAbsenceDropdown(!showAbsenceDropdown)}
                          className="w-full flex items-center justify-between p-3 rounded-md border bg-slate-50 border-slate-200 hover:bg-slate-100 text-left"
                        >
                          <span className="text-xs text-slate-900">
                            {selectedAbsenceType
                              ? leaveTypes.find((opt) => opt.leaveCode === selectedAbsenceType)?.label
                              : "Select leave type"}
                          </span>
                          {showAbsenceDropdown ? (
                            <ChevronUp className="h-4 w-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                          )}
                        </button>

                        {showAbsenceDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                            {tokenLoading || leaveCodesLoading ? (
                              <div className="text-xs text-slate-500 p-3 text-center">
                                Loading leave types...
                              </div>
                            ) : tokenError ? (
                              <div className="text-xs text-red-600 p-3 bg-red-50 border border-red-200 rounded">
                                Authentication Error: {tokenError.message}
                              </div>
                            ) : leaveCodesError ? (
                              <div className="text-xs text-red-600 p-3 bg-red-50 border border-red-200 rounded">
                                Error: {leaveCodesError}
                              </div>
                            ) : leaveTypes.length === 0 ? (
                              <div className="text-xs text-slate-500 p-3 text-center">
                                No leave types available
                              </div>
                            ) : (
                              leaveTypes.map((option) => (
                                <button
                                  key={option.id}
                                  onClick={() => selectAbsenceType(option.leaveCode)}
                                  className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 border-b border-slate-100 last:border-b-0"
                                >
                                  {option.label}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      {selectedAbsenceType && (
                        <div className="flex items-center space-x-2 mt-3">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-800 px-3 py-1">
                            {leaveTypes.find((opt) => opt.leaveCode === selectedAbsenceType)?.label || selectedAbsenceType}
                            <button
                              onClick={() => removeAbsenceType(selectedDate)}
                              className="ml-2 text-slate-600 hover:text-slate-800"
                            >
                              ×
                            </button>
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="mb-6">
                      <label className="block text-xs font-medium text-slate-900 mb-2">Duration</label>
                      <select
                        value={days[selectedDate] || "Full Day"}
                        onChange={(e) => handleDurationChange(e.target.value)}
                        className="w-full p-3 rounded-md border bg-slate-50 border-slate-200 text-xs"
                      >
                        <option value="Full Day">Full Day</option>
                        <option value="First Half">First Half</option>
                        <option value="Second Half">Second Half</option>
                      </select>

                      {/* Edit Individual Days Link - Only show when not in edit individual days mode */}
                      {!isEditIndividualDaysMode && (
                        <div className="mt-2">
                          <button
                            className={cn(
                              "text-xs underline",
                              ((selectedFullDates && selectedFullDates.length === 1) || (!selectedFullDates && selectedDates.length === 1))
                                ? "text-slate-400 cursor-not-allowed"
                                : "text-blue-600 hover:text-blue-800"
                            )}
                            onClick={() => {
                              const dateCount = selectedFullDates && selectedFullDates.length > 0 ? selectedFullDates.length : selectedDates.length
                              if (dateCount > 1) {
                                setIsEditIndividualDaysMode(!isEditIndividualDaysMode)
                              }
                            }}
                            disabled={(selectedFullDates && selectedFullDates.length === 1) || (!selectedFullDates && selectedDates.length === 1)}
                          >
                            Edit Individual Days
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Remarks */}
                    <div className="mb-6">
                      <label className="block text-xs font-medium text-slate-700 mb-2">Remarks</label>
                      <Textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        className="min-h-[80px] bg-slate-50 border-slate-200 text-sm"
                        placeholder="Enter remarks..."
                      />
                    </div>

                    {/* Additional Information - Show when not in edit mode */}
                    {!isEditIndividualDaysMode && (
                      <div className="mb-6">
                        <button
                          onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                          className="flex items-center space-x-2 text-slate-900 text-sm font-medium mb-3"
                        >
                          <ChevronDown className={cn("h-4 w-4 transition-transform", !showAdditionalInfo && "-rotate-90")} />
                          <span>Additional Information</span>
                        </button>

                        {showAdditionalInfo && (
                          <div className="space-y-4">
                            {/* Document */}
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-2">Document</label>

                              {/* File Upload Area */}
                              <div
                                className={cn(
                                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                                  isDragOver
                                    ? "border-blue-400 bg-blue-50"
                                    : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                                )}
                                onDrop={handleFileDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                              >
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  multiple
                                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt"
                                  onChange={(e) => handleFileSelect(e.target.files)}
                                  className="hidden"
                                />

                                <Upload className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                                <p className="text-slate-600 text-sm mb-2">
                                  Drop files here or{" "}
                                  <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-blue-600 hover:text-blue-800 underline"
                                  >
                                    browse
                                  </button>
                                </p>
                                <p className="text-xs text-slate-500">
                                  Supported: PDF, Word, Images, Text (Max 10MB each)
                                </p>
                              </div>

                              {/* File List */}
                              {uploadedFiles.length > 0 && (
                                <div className="mt-4 space-y-2">
                                  <h4 className="text-xs font-medium text-slate-700">Uploaded Files:</h4>
                                  {uploadedFiles.map((file, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between p-2 bg-slate-50 rounded-md border"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <File className="h-4 w-4 text-slate-500" />
                                        <div>
                                          <p className="text-xs font-medium text-slate-900 truncate max-w-[200px]">
                                            {file.name}
                                          </p>
                                          <p className="text-xs text-slate-500">
                                            {formatFileSize(file.size)}
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => removeFile(index)}
                                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                        title="Remove file"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}


                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 p-6 border-t border-slate-200 flex-shrink-0">
            <Button
              variant="outline"
              onClick={handleBackClick}
              className="px-6 py-2 text-slate-700 border-slate-300 hover:bg-slate-50 bg-transparent text-sm"
            >
              Cancel
            </Button>
            {/* Test button for debugging - remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                variant="outline"
                onClick={() => {
                  toast.success("✅ Test success message!", {
                    position: "top-right",
                    autoClose: 3000,
                  });
                }}
                className="px-4 py-2 text-green-700 border-green-300 hover:bg-green-50 text-xs"
              >
                Test Toast
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={postLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm"
            >
              {postLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmationDialog} onOpenChange={setShowConfirmationDialog}>
        <DialogContent
          className="sm:max-w-md"
          aria-describedby="confirmation-dialog-description"
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Confirm Leave Application</DialogTitle>
          </DialogHeader>

          {/* Hidden description for screen readers */}
          <div id="confirmation-dialog-description" className="sr-only">
            Confirmation dialog to verify leave application details before submission.
          </div>
          <div className="py-4">
            <p className="text-sm text-slate-700 mb-4">
              Are both the dates need to be applied for selected leave type and duration?
            </p>
            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-md mb-4">
              <p className="font-medium mb-2">Selected Dates:</p>
              <div className="space-y-1">
                {(selectedFullDates && selectedFullDates.length > 0
                  ? [...selectedFullDates].sort((a,b) => a.getTime() - b.getTime()).map((date, idx) => (
                      <div key={`${date.toISOString()}-${idx}`} className="text-slate-700">
                        {formatFullDate(date)} • {leaveTypes.find((opt) => opt.leaveCode === absenceTypes[date.getDate()])?.label || absenceTypes[date.getDate()] || "CL"} • {days[date.getDate()] || "Full Day"}
                      </div>
                    ))
                  : selectedDates
                      .sort((a, b) => a - b)
                      .map((date) => (
                        <div key={date} className="text-slate-700">
                          {formatDate(date)} • {leaveTypes.find((opt) => opt.leaveCode === absenceTypes[date])?.label || absenceTypes[date] || "CL"} • {days[date] || "Full Day"}
                        </div>
                      ))
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              onClick={handleConfirmationNo}
              className="px-4 py-2 text-slate-700 border-slate-300 hover:bg-slate-50"
            >
              No, Edit Individual Days
            </Button>
            <Button
              onClick={handleConfirmationYes}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              Yes, Submit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

