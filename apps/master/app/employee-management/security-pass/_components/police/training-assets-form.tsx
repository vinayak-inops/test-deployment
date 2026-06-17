"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { Briefcase, X, CheckCircle } from "lucide-react"
// import WorkOrderSection from "@/app/contractor-employee/_components/forms/subform/training-assets/workorder-section"
import { useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useState, useEffect } from "react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { SuccessPopup } from "@/components/success-popup"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// Zod Schema for validation (WorkOrder only)
const trainingAssetsSchema = z.object({
  workOrder: z.array(z.object({
    workOrderNumber: z.string().min(1, "Work order number is required"),
    effectiveFrom: z.string().optional(),
    effectiveTo: z.string().optional(),
    isActive: z.boolean().optional(),
  }).superRefine((data, ctx) => {
    if (data.effectiveFrom && data.effectiveTo) {
      const effectiveFrom = new Date(data.effectiveFrom);
      const effectiveTo = new Date(data.effectiveTo);
      if (effectiveFrom > effectiveTo) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Effective From must be less than or equal to Effective To",
          path: ["effectiveTo"],
        });
      }
    }
  })).min(1, "At least one work order is required"),
})

type TrainingAssetsData = z.infer<typeof trainingAssetsSchema>

interface TrainingAssetsFormProps {
  formData: any
  onFormDataChange: (data: any) => void
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  auditStatus?: any
  auditStatusFormData?: any
  setAuditStatus?: (data: any) => void
  setAuditStatusFormData?: (data: any) => void
  activeTab?: string
}

// Training programs and asset types will be fetched from orgData

export function TrainingAssetsForm({ 
  formData, 
  onFormDataChange, 
  onNextTab, 
  onPreviousTab,
  mode = "view",
  auditStatus,
  auditStatusFormData,
  setAuditStatus,
  setAuditStatusFormData,
  activeTab
}: TrainingAssetsFormProps) {
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const searchParams = useSearchParams()
  const currentMode = mode
  const isViewMode = currentMode === 'view'
  const [workOrderData, setWorkOrderData] = useState<any[]>([])
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<any>({
    workOrderNumber: "",
    effectiveFrom: "",
    effectiveTo: "",
  })
  const [orgData, setOrgData] = useState<any>(null)
  const [workOrderValidationErrors, setWorkOrderValidationErrors] = useState<{[key: number]: string[]}>({})
  const [showDateError, setShowDateError] = useState<string | null>(null)
  const [showAllWorkOrders, setShowAllWorkOrders] = useState<boolean>(false)
  const tenantCode = useGetTenantCode()

   // Fetch organizational data for dropdowns
   const {
    data: org,
    error: orgError,
    loading: orgLoading,
    refetch: fetchOrgData
  } = useRequest<any[]>({
    url: `map/organization/search?tenantCode=${tenantCode}`,
    onSuccess: (data: any) => {
      setOrgData(data[0])
    },
    onError: (error: any) => {
      console.error("Error fetching org data:", error)
    }
  });
  
  useEffect(() => {
    fetchOrgData()
  }, [])

  const {
    data: contractors,
    refetch: fetchContractor
  } = useRequest<any[]>({
    url: `map/contractor/search?contractorCode=${auditStatusFormData?.deployment?.contractor?.contractorCode}`,
    onSuccess: (data: any) => {
      setWorkOrderData(data[0]?.workOrders)
    },
    onError: (error: any) => {
      console.error("Error fetching contractor data:", error)
    }
  });

  useEffect(() => {
    fetchContractor()
  }, [auditStatusFormData?.deployment?.contractor?.contractorCode])




  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    reset,
  } = useForm<TrainingAssetsData>({
    resolver: zodResolver(trainingAssetsSchema),
    defaultValues: {
      workOrder: [{
        workOrderNumber: "",
        effectiveFrom: "",
        effectiveTo: "",
        isActive: false,
      }],
    },
    mode: "onChange",
  })

  const watchedValues = watch()

  // Helper function to convert date format from legacy dd-mm-yyyy to yyyy-mm-dd
  const convertDateFormat = (dateString: string) => {
    if (!dateString) return undefined;
    
    // If already in yyyy-mm-dd format, return as is
    if (dateString.includes('-') && dateString.split('-').length === 3) {
      const parts = dateString.split('-');
      if (parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
        return dateString;
      }
    }
    
    // Convert from legacy dd-mm-yyyy to yyyy-mm-dd
    if (dateString.includes('-') && dateString.split('-').length === 3) {
      const parts = dateString.split('-');
      if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        // Format: legacy dd-mm-yyyy -> yyyy-mm-dd
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    // If it's a valid date string, try to parse and format
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return undefined;
  };

  // Helper function to get date in yyyy-mm-dd format for HTML date inputs
  const getDateForInput = (dateString: string) => {
    if (!dateString) return undefined;
    
    // If already in yyyy-mm-dd format, return as is
    if (dateString.includes('-') && dateString.split('-').length === 3) {
      const parts = dateString.split('-');
      if (parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
        return dateString;
      }
    }
    
    // Convert from legacy dd-mm-yyyy to yyyy-mm-dd
    if (dateString.includes('-') && dateString.split('-').length === 3) {
      const parts = dateString.split('-');
      if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        // Format: legacy dd-mm-yyyy -> yyyy-mm-dd
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    // If it's a valid date string, try to parse and format
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return undefined;
  };

  // Helper function to format date for display (yyyy-mm-dd)
  const formatDateForDisplay = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    // Handle yyyy-mm-dd format from API
    if (dateString.includes('-') && dateString.split('-').length === 3) {
      const parts = dateString.split('-');
      if (parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
        // Already in yyyy-mm-dd format
        return dateString;
      }
    }
    
    // Handle legacy dd-mm-yyyy format from old data
    if (dateString.includes('-') && dateString.split('-').length === 3) {
      const parts = dateString.split('-');
      if (parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
        // Convert legacy dd-mm-yyyy to yyyy-mm-dd
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    
    // Try to parse as a date and format
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return dateString;
  };

  // Helper function to get selected work order data
  const getSelectedWorkOrder = (workOrderNumber: string) => {
    return workOrderData?.find((wo: any) => wo.workOrderNumber === workOrderNumber);
  };

  // Check for overlapping dates across all work orders
  const checkForOverlappingDates = () => {
    const workOrders = watchedValues.workOrder || [];
    const overlappingErrors: string[] = [];
    
    // Group work orders by work order number
    const workOrderGroups: { [key: string]: any[] } = {};
    
    workOrders.forEach((wo, index) => {
      if (wo.workOrderNumber) {
        if (!workOrderGroups[wo.workOrderNumber]) {
          workOrderGroups[wo.workOrderNumber] = [];
        }
        workOrderGroups[wo.workOrderNumber].push({ ...wo, originalIndex: index });
      }
    });
    
    // Check each group for overlapping dates
    Object.entries(workOrderGroups).forEach(([workOrderNumber, orders]) => {
      if (orders.length > 1) {
        // Sort orders by effective from date
        const sortedOrders = orders
          .filter(wo => wo.effectiveFrom && wo.effectiveTo)
          .sort((a, b) => new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime());
        
        // Check for overlaps
        for (let i = 0; i < sortedOrders.length - 1; i++) {
          const currentOrder = sortedOrders[i];
          const nextOrder = sortedOrders[i + 1];
          
          const currentEndDate = new Date(currentOrder.effectiveTo);
          const nextStartDate = new Date(nextOrder.effectiveFrom);
          
          if (currentEndDate >= nextStartDate) {
            overlappingErrors.push(
              `Work Order ${workOrderNumber}: Overlapping dates detected. Order ${i + 1} ends ${formatDateForDisplay(currentOrder.effectiveTo)} but Order ${i + 2} starts ${formatDateForDisplay(nextOrder.effectiveFrom)}`
            );
          }
        }
      }
    });
    
    return overlappingErrors;
  };

  // Helper function to validate date constraints with flexible validation
  const validateDateConstraints = (workOrderNumber: string, effectiveFrom: string, effectiveTo: string) => {
    const selectedWO = getSelectedWorkOrder(workOrderNumber);
    if (!selectedWO) return { isValid: false, errors: [] };

    const errors: string[] = [];
    
    // Convert contract dates to proper format for comparison
    const contractFromStr = getDateForInput(selectedWO.contractPeriodFrom);
    const contractToStr = getDateForInput(selectedWO.contractPeriodTo);
    
    if (!contractFromStr || !contractToStr) {
      errors.push('Contract period dates are missing');
      return { isValid: false, errors };
    }
    
    const contractFrom = new Date(contractFromStr);
    const contractTo = new Date(contractToStr);

    // Validate contract dates are valid
    if (isNaN(contractFrom.getTime()) || isNaN(contractTo.getTime())) {
      errors.push('Invalid contract period dates');
      return { isValid: false, errors };
    }

    if (effectiveFrom) {
      const fromDate = new Date(effectiveFrom);
      if (isNaN(fromDate.getTime())) {
        errors.push('Invalid Effective From date format');
      } else {
        // More flexible validation: Allow Effective From to be later than contract start
        if (fromDate < contractFrom) {
          errors.push(`Effective From cannot be before ${formatDateForDisplay(selectedWO.contractPeriodFrom)}`);
        }
        if (fromDate > contractTo) {
          errors.push(`Effective From cannot be after ${formatDateForDisplay(selectedWO.contractPeriodTo)}`);
        }
      }
    }

    if (effectiveTo) {
      const toDate = new Date(effectiveTo);
      if (isNaN(toDate.getTime())) {
        errors.push('Invalid Effective To date format');
      } else {
        // More flexible validation: Allow Effective To to be earlier than contract end
        if (toDate < contractFrom) {
          errors.push(`Effective To cannot be before ${formatDateForDisplay(selectedWO.contractPeriodFrom)}`);
        }
        // Note: We don't check if Effective To is after contract end - that's allowed
        if (effectiveFrom) {
          const fromDate = new Date(effectiveFrom);
          // Allow same date or later date
          if (toDate < fromDate) {
            errors.push('Effective To must be greater than or equal to Effective From');
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  };

  // Fetch employee data and populate form (WorkOrder only)


  useEffect(() => {
    if (auditStatusFormData) {
      if (auditStatusFormData.workOrder) {
        // Convert dates to yyyy-mm-dd format for HTML inputs in edit mode
        const formattedWorkOrders = auditStatusFormData.workOrder.map((wo: any) => {
          // Calculate if work order is active (today falls between effectiveFrom and effectiveTo)
          let isActive = false;
          if (wo.effectiveFrom && wo.effectiveTo) {
            const today = new Date();
            const fromDate = new Date(wo.effectiveFrom);
            const toDate = new Date(wo.effectiveTo);
            
            if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
              // Remove time component for date comparison
              const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
              const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
              
              isActive = todayOnly >= fromDateOnly && todayOnly <= toDateOnly;
            }
          }
          
          return {
          ...wo,
          effectiveFrom: wo.effectiveFrom ? getDateForInput(wo.effectiveFrom) : '',
            effectiveTo: wo.effectiveTo ? getDateForInput(wo.effectiveTo) : '',
            isActive: isActive
          };
        });
        setValue("workOrder", formattedWorkOrders)
      }
    }
  }, [auditStatusFormData, currentMode, setValue])

  // Ensure work orders array is properly initialized
  useEffect(() => {
    const workOrderCount = watchedValues.workOrder?.length || 0
    
    if (workOrderCount === 0) {
      // Initialize with one empty work order if none exist
      const initialWorkOrder = {
        workOrderNumber: "",
        effectiveFrom: "",
        effectiveTo: "",
        isActive: false,
      }
      setValue("workOrder", [initialWorkOrder])
      onFormDataChange({ workOrder: [initialWorkOrder] })
    }
  }, [watchedValues.workOrder?.length, setValue, onFormDataChange])



  // Work Order Add/Remove
  const addWorkOrder = () => {
    const newWorkOrders = [...(watchedValues.workOrder || []), {
      workOrderNumber: "",
      effectiveFrom: "",
      effectiveTo: "",
      isActive: false,
    }]
    setValue("workOrder", newWorkOrders)
    onFormDataChange({ workOrder: newWorkOrders })
    // Clear validation errors for new work order
    setWorkOrderValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[newWorkOrders.length - 1];
      return newErrors;
    });
  }
  const removeWorkOrder = (index: number) => {
    const newWorkOrders = watchedValues.workOrder?.filter((_, i) => i !== index) || []
    setValue("workOrder", newWorkOrders)
    onFormDataChange({ workOrder: newWorkOrders })
    // Clear validation errors for removed work order
    setWorkOrderValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  }

  // WC Policies removed in this simplified form

  // Handle date changes and validate in real-time with strict validation
  const handleDateChange = (index: number, field: 'effectiveFrom' | 'effectiveTo', value: string) => {
    const workOrder = watchedValues.workOrder?.[index];
    if (!workOrder?.workOrderNumber) return;

    // Validate the dates BEFORE updating the form
    const updatedWorkOrder = {
      ...workOrder,
      [field]: value
    };
    
    const validation = validateDateConstraints(
      updatedWorkOrder.workOrderNumber || '',
      updatedWorkOrder.effectiveFrom || '',
      updatedWorkOrder.effectiveTo || ''
    );

    // If validation fails, don't update the form and show error
    if (!validation.isValid) {
      setWorkOrderValidationErrors(prev => ({
        ...prev,
        [index]: validation.errors
      }));
      showDateValidationError(validation.errors.join(', '));
      return; // Don't update the form with invalid data
    }

    // Clear validation errors if valid
    setWorkOrderValidationErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });

    // Only update form if validation passes
    setValue(`workOrder.${index}.${field}`, value);
    
    // Update parent component
    const updatedWorkOrders = [...(watchedValues.workOrder || [])];
    updatedWorkOrders[index] = updatedWorkOrder;
    onFormDataChange({ workOrder: updatedWorkOrders });
  }

  // Show date validation error message
  const showDateValidationError = (message: string) => {
    setShowDateError(message);
    // Auto-hide after 3 seconds
    setTimeout(() => setShowDateError(null), 3000);
  }





  const handleReset = () => {
    reset()
    setShowErrors(false)
    // Clear validation errors
    setWorkOrderValidationErrors({})
    // Clear auditStatusFormData or call onFormDataChange with empty data
    onFormDataChange({
      workOrder: [{
        workOrderNumber: "",
        effectiveFrom: "",
        effectiveTo: "",
        isActive: false,
      }]
    })
    // Also clear the auditStatusFormData if it exists
    if (setAuditStatusFormData) {
      setAuditStatusFormData({
        ...auditStatusFormData,
        workOrder: [{
          workOrderNumber: "",
          effectiveFrom: "",
          effectiveTo: "",
          isActive: false,
        }]
      })
    }
  }

  const {
    post: postPersonalInformation,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "contract_employee",
    onSuccess: (data) => {
      setSuccessPopupData({
        title: "Training & Assets Saved",
        message: "Your training programs, asset allocations, and work orders have been saved successfully."
      })
      setShowSuccessPopup(true)
      // if (onNextTab) onNextTab()
    },
    onError: (error) => {
      console.error("Error saving personal information:", error)
    },
  });

  const handleSaveAndContinue = async () => {
    setShowErrors(true)
    
    try {
      // Check for overlapping dates first
      const overlappingErrors = checkForOverlappingDates();
      if (overlappingErrors.length > 0) {
        const errorMessage = `Cannot save due to overlapping dates:\n${overlappingErrors.join('\n')}`;
        showDateValidationError(errorMessage);
        return; // Don't proceed with saving
      }
      
      const valid = await trigger()
      
      if (valid) {
        const formValues = watch()
        
        // Convert dates back to yyyy-mm-dd format for storage
        const flatData = {
          workOrder: (formValues.workOrder || []).map((wo: any) => {
            // Calculate if work order is active (today falls between effectiveFrom and effectiveTo)
            let isActive = false;
            if (wo.effectiveFrom && wo.effectiveTo) {
              const today = new Date();
              const fromDate = new Date(wo.effectiveFrom);
              const toDate = new Date(wo.effectiveTo);
              
              if (!isNaN(fromDate.getTime()) && !isNaN(toDate.getTime())) {
                // Remove time component for date comparison
                const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
                const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
                
                isActive = todayOnly >= fromDateOnly && todayOnly <= toDateOnly;
              }
            }
            
            return {
            ...wo,
            effectiveFrom: wo.effectiveFrom ? formatDateForDisplay(wo.effectiveFrom) : '',
              effectiveTo: wo.effectiveTo ? formatDateForDisplay(wo.effectiveTo) : '',
              isActive: isActive,
              deployment: auditStatusFormData.deployment
            };
          })
        }


        if (currentMode === "add") {
          // Ensure we're updating with the latest form values
          const updatedAuditStatusFormData = {
            ...auditStatusFormData,
            ...flatData,
          }
          setAuditStatusFormData?.(updatedAuditStatusFormData)
          setAuditStatus?.({
            ...auditStatus,
            personalInformation: true
          })
          // Show success popup in add mode
          setSuccessPopupData({
            title: "Training & Assets Saved",
            message: "Your training programs, asset allocations, and work orders have been saved successfully."
          })
          setShowSuccessPopup(true)
        } else if (currentMode === "edit") {
          let json = {
            tenant: tenantCode,
            action: "insert",
            id: auditStatusFormData._id || null,
            collectionName: "contract_employee",
            data: {
              ...auditStatusFormData,
              ...flatData,
            }
          }
          postPersonalInformation(json)
        } else {
          // view mode: do nothing
        }

        setAuditStatusFormData?.({
          ...auditStatusFormData,
          ...flatData,
        })
        setAuditStatus?.({
          ...auditStatus,
          trainingAssets: true
        })
      } else {
      }
    } catch (error) {
      console.error("Error saving form:", error)
    }
  }

  // Separate actions
  const handleSave = async () => {
    await handleSaveAndContinue()
  }

  const handleContinue = async () => {
    setShowErrors(true)
    const overlappingErrors = checkForOverlappingDates();
    if (overlappingErrors.length > 0) {
      const errorMessage = `Cannot continue due to overlapping dates:\n${overlappingErrors.join('\n')}`;
      showDateValidationError(errorMessage);
      return;
    }
    const valid = await trigger()
    if (valid && onNextTab) {
      onNextTab()
    }
  }

  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/70 backdrop-blur-xl shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-700/90"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Briefcase className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Training & Assets</CardTitle>
              <CardDescription className="text-blue-100 text-base">
                Training programs completed and assets allocated to the employee
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
             <CardContent className="p-8">
         {/* Date Validation Error Message */}
         {showDateError && (
           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
             <div className="flex items-center gap-2">
               <X className="h-5 w-5 text-red-600" />
               <p className="text-red-700 font-medium">{showDateError}</p>
             </div>
           </div>
         )}
         
        {/* <div className="space-y-8">
          <WorkOrderSection
            watchedValues={watchedValues}
            setValue={setValue}
            onFormDataChange={onFormDataChange}
            isViewMode={isViewMode}
            showErrors={showErrors}
            errors={errors}
            workOrderData={workOrderData}
            workOrderValidationErrors={workOrderValidationErrors}
            setWorkOrderValidationErrors={setWorkOrderValidationErrors}
            showDateValidationError={showDateValidationError}
            handleDateChange={handleDateChange}
            addWorkOrder={addWorkOrder}
            removeWorkOrder={removeWorkOrder}
            getSelectedWorkOrder={getSelectedWorkOrder}
            getDateForInput={getDateForInput}
            formatDateForDisplay={formatDateForDisplay}
            currentMode={currentMode}
            auditStatusFormData={auditStatusFormData}
            showAllWorkOrders={showAllWorkOrders}
            setShowAllWorkOrders={setShowAllWorkOrders}
          />

        </div> */}
        {/* Action Buttons */}
        {isViewMode && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              {onPreviousTab && (
                <Button type="button" variant="outline" onClick={onPreviousTab} className="px-6 py-3 h-12 rounded-xl border-2 border-gray-300 hover:bg-gray-50 bg-transparent text-gray-700 hover:text-gray-900 transition-colors"><span>Back</span></Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {/* Overlapping dates validation status */}
                {(() => {
                  const overlappingErrors = checkForOverlappingDates();
                  if (overlappingErrors.length > 0) {
                    return (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm font-medium text-red-700">
                          {overlappingErrors.length} overlapping date issue(s) detected
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {isValid ? 'Form is valid and ready to continue' : 'Please complete all required fields'}
                      </span>
                    </div>
                  );
                })()}
              </div>
              <Button 
                type="button" 
                variant="secondary"
                onClick={handleContinue}
                className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Continue</span>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      {/* Success Popup */}
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={() => setShowSuccessPopup(false)}
        title={successPopupData.title}
        message={successPopupData.message}
      />
    </Card>
  )
} 
