import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ChevronDown, ChevronRight, AlertCircle, ArrowLeft, Loader2, Upload, File } from 'lucide-react';
import { Button } from "@repo/ui/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@repo/ui/components/ui/dialog";
import { cn } from "@repo/ui/lib/utils";
import DatePickerField from './datePickerField';
import { useMessage } from "../../../hooks/useMessage";
import { usePostRequest } from '@repo/ui/hooks/api/usePostRequest';
import { toast } from 'react-toastify';
import { useSession } from 'next-auth/react';
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useKeyclockRoleInfo } from '@/hooks/search/keyclock-role-info'

// Props interface for LeaveOfAbsenceModal component
interface LeaveOfAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  selectedAbsenceType?: string;
  selectedEmployeeId: string;
  selectedLeaveCode?: string;
  selectedDates?: number[];
  selectedFullDates?: Date[];
  currentDate?: Date;
}

interface FormData {
  typeOfAbsence: string;
  lastDayOfWork: Date | null;
  firstDayOfAbsence: Date | null;
  estimatedLastDayOfAbsence: Date | null;
  reason: string;
  childsBirthDate: Date | null;
  adoptionPlacementDate: Date | null;
}

interface FormErrors {
  lastDayOfWork?: string;
  firstDayOfAbsence?: string;
  estimatedLastDayOfAbsence?: string;
  reason?: string;
  childsBirthDate?: string;
  adoptionPlacementDate?: string;
}

const LeaveOfAbsenceModal: React.FC<LeaveOfAbsenceModalProps> = ({ isOpen, onClose, onBack, selectedAbsenceType, selectedEmployeeId, selectedLeaveCode, selectedDates, selectedFullDates, currentDate }) => {
  const [formData, setFormData] = useState<FormData>({
    typeOfAbsence: selectedLeaveCode || selectedAbsenceType || 'Paternity Leave',
    lastDayOfWork: null,
    firstDayOfAbsence: null,
    estimatedLastDayOfAbsence: null,
    reason: '',
    childsBirthDate: null,
    adoptionPlacementDate: null
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isAdditionalFieldsExpanded, setIsAdditionalFieldsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showMessage } = useMessage();
  const tenantCode = useGetTenantCode()

  // Get logged-in employee ID from hook
  const { employeeId } = useKeyclockRoleInfo();

  // Get cookie information for fallback
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
      const raw = getCookie('keyclockroleinfo');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  // Calculate days based on dates
  const calculateDays = () => {
    if (!formData.firstDayOfAbsence || !formData.estimatedLastDayOfAbsence) return 0;

    const start = new Date(formData.firstDayOfAbsence);
    const end = new Date(formData.estimatedLastDayOfAbsence);

    if (end < start) return 0;

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const requestDays = calculateDays();
  const remainingBalancePrior = 26;
  const remainingBalance = remainingBalancePrior - requestDays;

  // Validation
  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.lastDayOfWork) {
      newErrors.lastDayOfWork = 'Last day of work is required';
    }

    if (!formData.firstDayOfAbsence) {
      newErrors.firstDayOfAbsence = 'First day of absence is required';
    }

    if (!formData.estimatedLastDayOfAbsence) {
      newErrors.estimatedLastDayOfAbsence = 'Estimated last day of absence is required';
    }

    if (!formData.reason) {
      newErrors.reason = 'Reason is required';
    }

    // Date logic validation
    if (formData.lastDayOfWork && formData.firstDayOfAbsence) {
      if (formData.firstDayOfAbsence <= formData.lastDayOfWork) {
        newErrors.firstDayOfAbsence = 'First day of absence must be after last day of work';
      }
    }

    if (formData.firstDayOfAbsence && formData.estimatedLastDayOfAbsence) {
      if (formData.estimatedLastDayOfAbsence < formData.firstDayOfAbsence) {
        newErrors.estimatedLastDayOfAbsence = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // File handling functions
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        showMessage(`File ${file.name} is too large. Maximum size is 10MB.`, 'error');
        return false;
      }
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain'
      ];
      if (!allowedTypes.includes(file.type)) {
        showMessage(`File type ${file.type} is not supported. Please upload PDF, Word documents, images, or text files.`, 'error');
        return false;
      }
      return true;
    });
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const { data: session } = useSession();

  const {
    post: postLeaveOfAbsence,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: "specialLeaveApplication",
    onSuccess: (data) => {
      toast.success(`Leave of absence request submitted successfully! ${requestDays} day(s) requested for ${formData.typeOfAbsence}.`);
      onClose();
    },
    onError: (error) => {
      console.error("Leave of absence submission failed:", error);
      let errorMessage = "Failed to submit leave of absence request. Please try again.";
      
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
      
      toast.error(errorMessage);
    },
  });

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Format dates for the API
      const formatDateForAPI = (date: Date | null) => {
        if (!date) return '';
        const dayStr = date.getDate().toString().padStart(2, '0');
        const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
        const yearStr = date.getFullYear().toString();
        return `${dayStr}-${monthStr}-${yearStr}`;
      };

      // Format current date for appliedDate
      const today = new Date();
      const appliedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;

      // Convert files to base64 strings
      const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };
      
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
      const uploadedBy = employeeId  || '';
      const createdBy = employeeId || '';

      const payload = {
        tenant: tenantCode,
        action: "insert",
        collectionName: "specialLeaveApplication",
        id: "",
        event: "application",
        data: {
          tenantCode: tenantCode,
          workflowName: "specialLeave Application",
          stateEvent: "NEXT",
          uploadedBy: uploadedBy,
          createdBy: createdBy,
          createdOn: new Date().toISOString(),
          employeeID: selectedEmployeeId,
          leaveCode: selectedLeaveCode || (formData.typeOfAbsence === 'Maternity Leave' ? 'ML' : 'PL'),
          lastDayOfWork: formatDateForAPI(formData.lastDayOfWork),
          fromDate: formatDateForAPI(formData.firstDayOfAbsence),
          toDate: formatDateForAPI(formData.estimatedLastDayOfAbsence),
          noOfDays: requestDays.toString(),
          DOBOfChild: formatDateForAPI(formData.childsBirthDate),
          AdoptionPlacementDate: formatDateForAPI(formData.adoptionPlacementDate),
          document: "9f/ffff",
          organizationCode: tenantCode,
          appliedDate: appliedDate,
          workflowState: "INITIATED",
          remarks: '',
          leaveTitle: formData.typeOfAbsence,
          documents: fileData,
          documentCount: uploadedFiles.length
        }
      };

      // Submit the request using the hook
      await postLeaveOfAbsence(payload);

    } catch (error) {
      console.error("Submission failed:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });

      let errorMessage = "Failed to submit request. Please try again.";
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

      showMessage(errorMessage, 'error');
    }
  };

  // Update typeOfAbsence when selectedAbsenceType or selectedLeaveCode prop changes
  useEffect(() => {
    if (selectedLeaveCode) {
      setFormData(prev => ({ ...prev, typeOfAbsence: selectedLeaveCode }));
    } else if (selectedAbsenceType) {
      const newTypeOfAbsence = selectedAbsenceType === 'maternity-leave' ? 'Maternity Leave' :
        selectedAbsenceType === 'paternity-leave' ? 'Paternity Leave' :
          'Paternity Leave';
      setFormData(prev => ({ ...prev, typeOfAbsence: newTypeOfAbsence }));
    }
  }, [selectedAbsenceType, selectedLeaveCode]);

  // Auto-calculate dates when selected dates are provided
  useEffect(() => {
    if (isOpen && selectedFullDates && selectedFullDates.length > 0) {
      const sortedDates = [...selectedFullDates].sort((a, b) => a.getTime() - b.getTime());
      const firstDate = sortedDates[0];
      const lastDate = sortedDates[sortedDates.length - 1];
      
      // Calculate last day of work (day before first day of absence)
      const lastDayOfWork = new Date(firstDate);
      lastDayOfWork.setDate(lastDayOfWork.getDate() - 1);
      
      setFormData(prev => ({
        ...prev,
        lastDayOfWork: lastDayOfWork,
        firstDayOfAbsence: firstDate,
        estimatedLastDayOfAbsence: lastDate
      }));
    } else if (isOpen && selectedDates && selectedDates.length > 0 && currentDate) {
      // Handle selectedDates (day numbers) case
      const sortedDays = [...selectedDates].sort((a, b) => a - b);
      const firstDay = sortedDays[0];
      const lastDay = sortedDays[sortedDays.length - 1];
      
      const firstDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), firstDay);
      const lastDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), lastDay);
      
      // Calculate last day of work (day before first day of absence)
      const lastDayOfWork = new Date(firstDate);
      lastDayOfWork.setDate(lastDayOfWork.getDate() - 1);
      
      setFormData(prev => ({
        ...prev,
        lastDayOfWork: lastDayOfWork,
        firstDayOfAbsence: firstDate,
        estimatedLastDayOfAbsence: lastDate
      }));
    }
  }, [isOpen, selectedFullDates, selectedDates, currentDate]);

  // Clear errors when form data changes
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      const newErrors = { ...errors };
      Object.keys(formData).forEach(key => {
        if (formData[key as keyof FormData]) {
          delete newErrors[key as keyof FormErrors];
        }
      });
      setErrors(newErrors);
    }
  }, [formData]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto" aria-describedby="leave-of-absence-description">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 space-y-0 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <DialogTitle className="text-base font-semibold text-slate-900">Request Absence</DialogTitle>
              <DialogDescription id="leave-of-absence-description" className="sr-only">
                Modal for requesting leave of absence
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Type of Absence */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Type of Absence
            </label>
            <div className="relative">
              <select
                value={formData.typeOfAbsence}
                onChange={(e) => setFormData({ ...formData, typeOfAbsence: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                <option value="Maternity Leave">Maternity Leave</option>
                <option value="Paternity Leave">Paternity Leave</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Date Fields Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Date Information</h3>

            {/* Last Day of Work */}
            <DatePickerField
              label="Last Day of Work"
              value={formData.lastDayOfWork}
              onChange={(date) => setFormData({ ...formData, lastDayOfWork: date })}
              required
              error={errors.lastDayOfWork}
              maxDate={formData.firstDayOfAbsence ? new Date(formData.firstDayOfAbsence.getTime() - 24 * 60 * 60 * 1000) : undefined}
            />

            {/* First Day of Absence */}
            <DatePickerField
              label="First Day of Absence"
              value={formData.firstDayOfAbsence}
              onChange={(date) => setFormData({ ...formData, firstDayOfAbsence: date })}
              required
              error={errors.firstDayOfAbsence}
              minDate={formData.lastDayOfWork ? new Date(formData.lastDayOfWork.getTime() + 24 * 60 * 60 * 1000) : undefined}
              maxDate={formData.estimatedLastDayOfAbsence || undefined}
            />

            {/* Estimated Last Day of Absence */}
            <DatePickerField
              label="Estimated Last Day of Absence"
              value={formData.estimatedLastDayOfAbsence}
              onChange={(date) => setFormData({ ...formData, estimatedLastDayOfAbsence: date })}
              required
              error={errors.estimatedLastDayOfAbsence}
              minDate={formData.firstDayOfAbsence || undefined}
            />

            {/* Request Amount */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Request Amount
              </label>
              <div className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm text-slate-600">
                {requestDays} Days
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Reason</h3>
            <div>

              <div className="relative">
                <select
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none",
                    errors.reason ? 'border-red-300' : 'border-slate-300'
                  )}
                >
                  <option value="">Select a reason...</option>
                  <option value="Child Birth">Child Birth</option>
                  <option value="Family Care">Family Care</option>
                  <option value="Medical">Medical</option>
                  <option value="Personal">Personal</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              {errors.reason && (
                <div className="flex items-center mt-1 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.reason}
                </div>
              )}
            </div>
          </div>



          {/* Additional Fields */}
          <div className="border-t border-slate-200 pt-4">
            <button
              onClick={() => setIsAdditionalFieldsExpanded(!isAdditionalFieldsExpanded)}
              className="flex items-center text-sm font-semibold text-slate-900 hover:text-slate-700 transition-colors"
            >
              {isAdditionalFieldsExpanded ? (
                <ChevronDown className="w-4 h-4 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2" />
              )}
              Additional Fields
            </button>

            {isAdditionalFieldsExpanded && (
              <div className="mt-4 space-y-4">
                {/* Child's Birth Date */}
                <DatePickerField
                  label="Child's Birth Date"
                  value={formData.childsBirthDate}
                  onChange={(date) => setFormData({ ...formData, childsBirthDate: date })}
                  error={errors.childsBirthDate}
                  maxDate={new Date()}
                />

                {/* Adoption Placement Date */}
                <DatePickerField
                  label="Adoption Placement Date"
                  value={formData.adoptionPlacementDate}
                  onChange={(date) => setFormData({ ...formData, adoptionPlacementDate: date })}
                  error={errors.adoptionPlacementDate}
                />

                {/* Balance Information */}
                <div className="bg-slate-50 p-4 rounded-md space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900">Balance Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Remaining Balance Prior to this Leave Request</span>
                      <span className="font-medium text-slate-900">{remainingBalancePrior}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Number of Days Requested</span>
                      <span className="font-medium text-slate-900">{requestDays}</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                      <span className="text-slate-600">Remaining Balance</span>
                      <span className={cn("font-medium", remainingBalance < 0 ? 'text-red-600' : 'text-slate-900')}>
                        {remainingBalance}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Document Upload */}
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">
                    Document
                  </label>
                  <div
                    className={cn(
                      "border-2 border-dashed border-slate-300 rounded-md p-6 text-center hover:border-slate-400 transition-colors cursor-pointer bg-slate-50",
                      isDragOver ? "border-blue-400 bg-blue-50" : ""
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
                      Drop files here or {" "}
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


        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 text-slate-700 border-slate-300 hover:bg-slate-50 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={postLoading}
          >
            {postLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeaveOfAbsenceModal;

