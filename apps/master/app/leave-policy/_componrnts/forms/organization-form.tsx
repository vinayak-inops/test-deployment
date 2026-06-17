"use client"

import type React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { SingleSelectField } from "@/components/fields/single-select-field"
import { Badge } from "@repo/ui/components/ui/badge"
import { Separator } from "@repo/ui/components/ui/separator"
import { Button } from "@repo/ui/components/ui/button"
import { Building2, RotateCcw, ArrowRight, ArrowLeft, Hash, MapPin, UserCheck, Users, X, CheckCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { SuccessPopup } from "@/components/success-popup"
import type { LeavePolicyData } from "../types/leave-policy.types"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// Extended interface for backward compatibility with flat structure
interface LeavePolicyDataCompat extends Partial<LeavePolicyData> {
  // Allow flat structure for backward compatibility
  subsidiaryCode?: string
  subsidiaryName?: string
  locationCode?: string
  locationName?: string
  designationCode?: string
  designationName?: string
}

// Zod Schema for validation
const organizationSchema = z.object({
  subsidiary: z.object({
    subsidiaryCode: z.string().min(1, "Subsidiary code is required"),
    subsidiaryName: z.string().min(1, "Subsidiary name is required"),
  }),
  location: z.object({
    locationCode: z.string().min(1, "Location code is required"),
    locationName: z.string().min(1, "Location name is required"),
  }),
  designation: z.object({
    designationCode: z.string().min(1, "Designation code is required"),
    designationName: z.string().min(1, "Designation name is required"),
  }),
  employeeCategory: z.array(z.string()).min(1, "At least one employee category is required"),
})

type OrganizationData = z.infer<typeof organizationSchema>

// Custom hook for location data with multiple fallback strategies
const useLocationData = (tenantCode: string) => {
  const [locationData, setLocationData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Try to fetch from organization API
  const {
    data: orgResponse,
    loading: orgLoading,
    error: orgError,
    refetch: fetchOrg
  } = useRequest<any>({
    url: 'organization/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
    ],
    onSuccess: (data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        let locations = [];
        
        // Handle different possible response structures
        if (data[0]?.locations) {
          locations = data[0].locations;
        } else if (data[0]?.data?.locations) {
          locations = data[0].data.locations;
        } else if (data[0]?.location) {
          locations = data[0].location;
        }

        if (locations && locations.length > 0) {
          const formattedLocations = locations.map((loc: any) => ({
            locationCode: loc.locationCode || loc.code || loc.id || '',
            locationName: loc.locationName || loc.name || loc.title || '',
            locationDescription: loc.locationDescription || loc.description || '',
            subsidiaryCode: loc.subsidiaryCode || loc.subsidiary_code || ''
          })).filter((loc: any) => loc.locationCode && loc.locationCode.trim() !== '');

          if (formattedLocations.length > 0) {
            setLocationData(formattedLocations);
            setIsLoading(false);
            return;
          }
        }
      }
      // If no valid locations found, set empty array
      setLocationData([]);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("Error fetching organization data for locations:", error);
      setError("Failed to load organization locations");
      setLocationData([]);
      setIsLoading(false);
    },
    dependencies: []
  });

  // Try alternative API endpoint for locations
  const {
    data: altResponse,
    loading: altLoading,
    error: altError,
    refetch: fetchAlt
  } = useRequest<any>({
    url: `map/organization/search?tenantCode=${tenantCode}`,
    onSuccess: (data) => {
      if (data && data[0] && data[0].location && data[0].location.length > 0) {
        const locations = data[0].location.map((loc: any) => ({
          locationCode: loc.locationCode || loc.code || loc.id || '',
          locationName: loc.locationName || loc.name || loc.title || '',
          locationDescription: loc.locationDescription || loc.description || '',
          subsidiaryCode: loc.subsidiaryCode || loc.subsidiary_code || ''
        })).filter((loc: any) => loc.locationCode && loc.locationCode.trim() !== '');

        if (locations.length > 0) {
          setLocationData(locations);
          setIsLoading(false);
          return;
        }
      }
      // If still no valid locations, set empty array
      setLocationData([]);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error("Error fetching alternative location data:", error);
      setLocationData([]);
      setIsLoading(false);
    },
    dependencies: []
  });

  useEffect(() => {
    // If organization data fails, try alternative endpoint
    if (orgError && !altLoading) {
      fetchAlt();
    }
  }, [orgError, altLoading]);

  return {
    locationData,
    isLoading: orgLoading || altLoading,
    error: orgError || altError,
    refetch: () => {
      fetchOrg();
      fetchAlt();
    }
  };
};

interface OrganizationFormProps {
  formData?: LeavePolicyDataCompat
  onFormDataChange: (data: Partial<LeavePolicyData>) => void
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  auditStatus?: any
  auditStatusFormData?: any
  setAuditStatus?: (status: any) => void
  setAuditStatusFormData?: (data: any) => void
  activeTab?: string
}

export function OrganizationForm({ 
  onFormDataChange, 
  onNextTab,
  onPreviousTab,
  mode = "add",
  auditStatus,
  auditStatusFormData,
  setAuditStatus,
  setAuditStatusFormData,
  activeTab
}: OrganizationFormProps) {
  // Determine if form is read-only based on mode
  const isReadOnly = mode === "view"
  const router = useRouter()
  
  // State to track if form data has been initialized
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [formKey, setFormKey] = useState(0); // Force re-render when data changes
  const [showErrors, setShowErrors] = useState(false)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)
  const [successPopupData, setSuccessPopupData] = useState({ title: "", message: "" })
  const  tenantCode  = useGetTenantCode()
  
  // Get the "id" and "mode" values from the URL query parameters
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const currentMode = (modeParam === "add" || modeParam === "edit" || modeParam === "view") ? modeParam : "add";
  

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    reset,
    setError,
    clearErrors,
  } = useForm<OrganizationData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      subsidiary: {
        subsidiaryCode: auditStatusFormData?.subsidiary?.subsidiaryCode || auditStatusFormData?.subsidiaryCode || "",
        subsidiaryName: auditStatusFormData?.subsidiary?.subsidiaryName || auditStatusFormData?.subsidiaryName || "",
      },
      location: {
        locationCode: auditStatusFormData?.location?.locationCode || auditStatusFormData?.locationCode || "",
        locationName: auditStatusFormData?.location?.locationName || auditStatusFormData?.locationName || "",
      },
      designation: {
        designationCode: auditStatusFormData?.designation?.designationCode || auditStatusFormData?.designationCode || "",
        designationName: auditStatusFormData?.designation?.designationName || auditStatusFormData?.designationName || "",
      },
      employeeCategory: auditStatusFormData?.employeeCategory || [],
    },
    mode: "onChange",
  })

 

  // POST request for saving leave policy data
  const {
    post: postOrganizationData,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "leave_policy",
    onSuccess: (data) => {
      setSuccessPopupData({
        title: "Organization Settings Saved",
        message: "Your organization settings have been successfully saved. You can now continue to the next section or make additional changes."
      })
      setShowSuccessPopup(true)
    },
    onError: (error) => {
      console.error("Error saving organization data:", error)
    },
  });

  // Fetch leave policy data when in edit or view mode
  useEffect(() => {
    if ((currentMode === "view" || currentMode === "edit") && id && !isDataInitialized) {
      
    }
  }, [currentMode, id, isDataInitialized])

  // Reset initialization flag when mode or id changes
  useEffect(() => {
    setIsDataInitialized(false);
  }, [currentMode, id]);



  // Update form values based on mode (similar to PersonalInformationForm)
  useEffect(() => {
    if (currentMode === "add") {
      // In add mode, get values from auditStatusFormData
      if (auditStatusFormData) {
        setValue("subsidiary", {
          subsidiaryCode: auditStatusFormData.subsidiary?.subsidiaryCode || auditStatusFormData.subsidiaryCode || "",
          subsidiaryName: auditStatusFormData.subsidiary?.subsidiaryName || auditStatusFormData.subsidiaryName || "",
        });
        setValue("location", {
          locationCode: auditStatusFormData.location?.locationCode || auditStatusFormData.locationCode || "",
          locationName: auditStatusFormData.location?.locationName || auditStatusFormData.locationName || "",
        });
        setValue("designation", {
          designationCode: auditStatusFormData.designation?.designationCode || auditStatusFormData.designationCode || "",
          designationName: auditStatusFormData.designation?.designationName || auditStatusFormData.designationName || "",
        });
        setValue("employeeCategory", auditStatusFormData.employeeCategory || []);
      }
    } else if (currentMode === "edit" || currentMode === "view") {
      // In edit/view mode, get values from formData
      if (auditStatusFormData) {
        setValue("subsidiary", {
          subsidiaryCode: auditStatusFormData.subsidiary?.subsidiaryCode || auditStatusFormData.subsidiaryCode || "",
          subsidiaryName: auditStatusFormData.subsidiary?.subsidiaryName || auditStatusFormData.subsidiaryName || "",
        });
        setValue("location", {
          locationCode: auditStatusFormData.location?.locationCode || auditStatusFormData.locationCode || "",
          locationName: auditStatusFormData.location?.locationName || auditStatusFormData.locationName || "",
        });
        setValue("designation", {
          designationCode: auditStatusFormData.designation?.designationCode || auditStatusFormData.designationCode || "",
          designationName: auditStatusFormData.designation?.designationName || auditStatusFormData.designationName || "",
        });
        setValue("employeeCategory", auditStatusFormData.employeeCategory || []);
      }
    }
  }, [currentMode, auditStatusFormData, setValue]);


    // Use custom location data hook
  const { locationData: allLocationCodes, isLoading: isLocationLoading, error: locationError, refetch: refetchLocations } = useLocationData(tenantCode);

  // Force location data to load on component mount
  useEffect(() => {
    if (!allLocationCodes || allLocationCodes.length === 0) {
      refetchLocations();
    }
  }, [allLocationCodes, refetchLocations]);



  // Show all locations without filtering by subsidiary
  const filteredLocationCodes = useMemo(() => {
    return allLocationCodes || [];
  }, [allLocationCodes]);

  // Organization search hook for subsidiaries
  const {
    data: attendanceResponse,
    loading: isLoading,
    error: attendanceError,
    refetch: fetchAttendance
  } = useRequest<any>({
    url: 'organization/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
    ],
    onSuccess: (data) => {
      // handled in useEffect
    },
    onError: (error) => {
      console.error("Error fetching organization data:", error);
    },
    dependencies: []
  });

  // Designation Code search hook
  const {
    data: designationResponse,
    loading: isDesignationLoading,
    error: designationError,
    refetch: fetchDesignation
  } = useRequest<any>({
    url: 'organization/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
    ],
    onSuccess: (data) => {
    },
    onError: (error) => {
      console.error("Error fetching designation data:", error);
    },
    dependencies: []
  });

  // Employee Categories search hook
  const {
    data: employeeCategoryResponse,
    loading: isEmployeeCategoryLoading,
    error: employeeCategoryError,
    refetch: fetchEmployeeCategory
  } = useRequest<any>({
    url: 'organization/search',
    method: 'POST',
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode
      },
    ],
    onSuccess: (data) => {
    },
    onError: (error) => {
      console.error("Error fetching employee category data:", error);
    },
    dependencies: []
  });

  // Extract subsidiaries from the response
  const subsidiaries = (() => {
    if (!attendanceResponse) return [];

    // Handle different possible response structures
    let subsidiariesData = [];

    if (Array.isArray(attendanceResponse)) {
      if (attendanceResponse[0]?.subsidiaries) {
        subsidiariesData = attendanceResponse[0].subsidiaries;
      } else if (attendanceResponse[0]?.data?.subsidiaries) {
        subsidiariesData = attendanceResponse[0].data.subsidiaries;
      } else if (attendanceResponse[0]?.subsidiary) {
        subsidiariesData = attendanceResponse[0].subsidiary;
      }
    } else if (attendanceResponse.subsidiaries) {
      subsidiariesData = attendanceResponse.subsidiaries;
    } else if (attendanceResponse.data?.subsidiaries) {
      subsidiariesData = attendanceResponse.data.subsidiaries;
    } else if (attendanceResponse.subsidiary) {
      subsidiariesData = attendanceResponse.subsidiary;
    }


    const result = subsidiariesData
      .map((subsidiary: any) => ({
        subsidiaryCode: subsidiary.subsidiaryCode || subsidiary.code || subsidiary.id || '',
        subsidiaryName: subsidiary.subsidiaryName || subsidiary.name || subsidiary.title || '',
        subsidiaryDescription: subsidiary.subsidiaryDescription || subsidiary.description || ''
      }))
      .filter((subsidiary: any) => subsidiary.subsidiaryCode && subsidiary.subsidiaryCode.trim() !== '');

    return result;
  })();

  // Extract designation codes from the response
  const designationCodes = (() => {
    if (!designationResponse) return [];

    // Handle different possible response structures
    let designationData = [];

    if (Array.isArray(designationResponse)) {
      if (designationResponse[0]?.designations) {
        designationData = designationResponse[0].designations;
      } else if (designationResponse[0]?.data?.designations) {
        designationData = designationResponse[0].data.designations;
      } else if (designationResponse[0]?.designation) {
        designationData = designationResponse[0].designation;
      }
    } else if (designationResponse.designations) {
      designationData = designationResponse.designations;
    } else if (designationResponse.data?.designations) {
      designationData = designationResponse.data.designations;
    } else if (designationResponse.designation) {
      designationData = designationResponse.designation;
    }


    const result = designationData
      .map((designation: any) => ({
        designationCode: designation.designationCode || designation.code || designation.id || '',
        designationName: designation.designationName || designation.name || designation.title || '',
        designationDescription: designation.designationDescription || designation.description || '',
        locationCode: String(designation.locationCode || designation.location_code || ''),
        subsidiaryCode: String(designation.subsidiaryCode || designation.subsidiary_code || '')
      }))
      .filter((designation: any) => designation.designationCode && designation.designationCode.trim() !== '');

    return result;
  })();

  // Extract employee categories from the response
  const employeeCategories = (() => {
    if (!employeeCategoryResponse) return [];

    // Handle different response structures
    let categoryData = [];

    if (Array.isArray(employeeCategoryResponse)) {
      if (employeeCategoryResponse[0]?.employeeCategories) {
        categoryData = employeeCategoryResponse[0].employeeCategories;
      } else if (employeeCategoryResponse[0]?.data?.employeeCategories) {
        categoryData = employeeCategoryResponse[0].data.employeeCategories;
      } else if (employeeCategoryResponse[0]?.employeeCategory) {
        categoryData = employeeCategoryResponse[0].employeeCategory;
      }
    } else if (employeeCategoryResponse.employeeCategories) {
      categoryData = employeeCategoryResponse.employeeCategories;
    } else if (employeeCategoryResponse.data?.employeeCategories) {
      categoryData = employeeCategoryResponse.data.employeeCategories;
    } else if (employeeCategoryResponse.employeeCategory) {
      categoryData = employeeCategoryResponse.employeeCategory;
    }

    const result = categoryData
      .map((category: any) => ({
        categoryCode: category.employeeCategoryCode || category.categoryCode || category.code || category.id || '',
        categoryName: category.employeeCategoryName || category.categoryName || category.name || category.title || '',
        categoryDescription: category.employeeCategoryDescription || category.categoryDescription || category.description || ''
      }))
      .filter((category: any) => category.categoryCode && category.categoryCode.trim() !== '');

    return result;
  })();

  useEffect(() => {
    fetchAttendance();
    fetchDesignation();
    fetchEmployeeCategory();
  }, []);



  const handleInputChange = async (field: keyof OrganizationData, value: any) => {
    setValue(field, value)
    await trigger(field)
    
    // Update form data for parent component with nested structure
    const currentValues = watch()
    const exactData = {
      subsidiary: currentValues.subsidiary || { subsidiaryCode: "", subsidiaryName: "" },
      location: currentValues.location || { locationCode: "", locationName: "" },
      designation: currentValues.designation || { designationCode: "", designationName: "" },
      employeeCategory: currentValues.employeeCategory || [],
    }
    
    // In add mode, update auditStatusFormData; in edit/view mode, update parent formData
    if (currentMode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...exactData
      })
    } else {
      onFormDataChange(exactData)
    }
  }

  // Special handler for Select components to ensure proper data flow
  const handleSelectChange = async (field: keyof OrganizationData, value: any) => {
    setValue(field, value)
    await trigger(field)
    
    // Get the updated values after setting the new value
    const updatedValues = watch()
    
    // Create the exact data structure with the updated value
    const exactData = {
      subsidiary: updatedValues.subsidiary || { subsidiaryCode: "", subsidiaryName: "" },
      location: updatedValues.location || { locationCode: "", locationName: "" },
      designation: updatedValues.designation || { designationCode: "", designationName: "" },
      employeeCategory: updatedValues.employeeCategory || [],
    }
    
    // In add mode, update auditStatusFormData; in edit/view mode, update parent formData
    if (currentMode === "add") {
      // setAuditStatusFormData?.({
      //   ...auditStatusFormData,
      //   ...exactData
      // })
    } else {
      onFormDataChange(exactData)
    }
  }

  const handleFormDataChange = useCallback((field: keyof LeavePolicyDataCompat, value: any) => {
    onFormDataChange({ [field]: value });
  }, [onFormDataChange]);

  // Handle save and continue functionality
  const handleSaveAndContinue = async () => {
    setShowErrors(true)
    const isValid = await trigger()
    
    if (isValid) {
      const formValues = watch()
      
      // Create the exact JSON structure for saving (nested format)
      const exactData = {
        subsidiary: formValues.subsidiary || { subsidiaryCode: "", subsidiaryName: "" },
        location: formValues.location || { locationCode: "", locationName: "" },
        designation: formValues.designation || { designationCode: "", designationName: "" },
        employeeCategory: formValues.employeeCategory || [],
      }
      
      // Update form data based on mode
      if (currentMode === "add") {
        // In add mode, update auditStatusFormData
        const updatedAuditStatusFormData = {
          ...auditStatusFormData,
          ...exactData,
        }
        setAuditStatusFormData?.(updatedAuditStatusFormData)
        setAuditStatus?.({
          ...auditStatus,
          organization: true
        })
        // Show success popup
        setSuccessPopupData({
          title: "Organization Settings Saved",
          message: "Your organization settings have been successfully saved. You can continue to the next section."
        })
        setShowSuccessPopup(true)
      } else if (currentMode === "edit") {
        const updatedAuditStatusFormData = {
          ...auditStatusFormData,
          ...exactData,
        }
        setAuditStatusFormData?.(updatedAuditStatusFormData)
        // In edit mode, update parent formData and save to backend
        onFormDataChange(exactData)
        let json = {
          tenant: tenantCode,
          action: "insert",
          id: auditStatusFormData._id || null,
          collectionName: "leave_policy",
          data: {
            ...auditStatusFormData,
            ...exactData,
          }
        }
        postOrganizationData(json)
      } else {
        // In view mode, just update parent formData
        onFormDataChange(exactData)
        if (onNextTab) {
          onNextTab()
        }
      }
    }
  }

  // Separate actions
  const handleSave = async () => {
    await handleSaveAndContinue()
  }

  const handleContinue = async () => {
    setShowErrors(true)
    const valid = await trigger()
    if (valid && onNextTab) {
      onNextTab()
    }
  }

  // Handle reset functionality
  const handleReset = () => {
    reset({
      subsidiary: { subsidiaryCode: "", subsidiaryName: "" },
      location: { locationCode: "", locationName: "" },
      designation: { designationCode: "", designationName: "" },
      employeeCategory: [],
    })
    setShowErrors(false)
    
    // Clear only the exact fields that should be submitted (nested format)
    const clearedData = {
      subsidiary: { subsidiaryCode: "", subsidiaryName: "" },
      location: { locationCode: "", locationName: "" },
      designation: { designationCode: "", designationName: "" },
      employeeCategory: [],
    }
    
    // In add mode, update auditStatusFormData; in edit/view mode, update parent formData
    if (currentMode === "add") {
      setAuditStatusFormData?.({
        ...auditStatusFormData,
        ...clearedData
      })
    } else {
      onFormDataChange(clearedData)
    }
  }

  // Filter designations based on selected subsidiary
  const filteredDesignationCodes = useMemo(() => {
    const selectedSubsidiaryCode = watch("subsidiary.subsidiaryCode");
    
    if (!designationCodes || designationCodes.length === 0) {
      return [];
    }
    
    // If no subsidiary is selected, show all designations
    if (!selectedSubsidiaryCode) {
      return designationCodes;
    }
    
    // Check if any designation has subsidiaryCode field
    const hasSubsidiaryCode = designationCodes.some((designation: any) => 
      designation.subsidiaryCode && 
      typeof designation.subsidiaryCode === 'string' && 
      designation.subsidiaryCode.trim() !== ''
    );
    
    // If no subsidiary codes found in designation data, show all designations
    if (!hasSubsidiaryCode) {
      return designationCodes;
    }
    
    // Filter designations by subsidiary code
    return designationCodes.filter((designation: any) => {
      const designationSubsidiaryCode = typeof designation.subsidiaryCode === 'string' 
        ? designation.subsidiaryCode.trim() 
        : String(designation.subsidiaryCode || '').trim();
      
      return designationSubsidiaryCode === selectedSubsidiaryCode;
    });
  }, [watch("subsidiary.subsidiaryCode"), designationCodes]);

  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/70 backdrop-blur-xl shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-700/90"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Organization Configuration</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Set up the organizational hierarchy and employee categorization for this leave policy.
                </CardDescription>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">


        {/* Show loading state in edit mode when data is not yet initialized */}
        {(currentMode === "edit" || currentMode === "view") && isLoading && !isDataInitialized ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading organization data...</p>
            </div>
          </div>
        ) : (
          <div key={formKey} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Subsidiary Information */}
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Subsidiary Details
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="group">
                  <SingleSelectField
                    key={`subsidiaryCode`}
                    id="subsidiaryCode"
                    label="Subsidiary Code"
                    placeholder="Search Subsidiary Code"
                    disabled={isLoading || isReadOnly}
                    value={watch("subsidiary.subsidiaryCode") || ""}
                    onChange={(value) => {
                      const selectedSubsidiary = subsidiaries.find((sub: { subsidiaryCode: string }) => sub.subsidiaryCode === value);
                      
                      // Clear dependent fields when subsidiary changes
                      setValue("designation.designationCode", "");
                      setValue("designation.designationName", "");
                      
                      handleSelectChange('subsidiary', {
                        subsidiaryCode: value,
                        subsidiaryName: selectedSubsidiary?.subsidiaryName || ''
                      });
                    }}
                    options={subsidiaries
                      .filter((subsidiary: { subsidiaryCode: string; subsidiaryName: string }) =>
                        subsidiary.subsidiaryCode && subsidiary.subsidiaryCode.trim() !== ''
                      )
                      .map((subsidiary: { subsidiaryCode: string; subsidiaryName: string }) => ({
                        value: subsidiary.subsidiaryCode,
                        label: `${subsidiary.subsidiaryCode} - ${subsidiary.subsidiaryName}`,
                        tooltip: `${subsidiary.subsidiaryCode} - ${subsidiary.subsidiaryName}`
                      }))}
                    showOnlyValueInTrigger
                    className="group"
                    errorMessage={showErrors && errors.subsidiary?.subsidiaryCode ? errors.subsidiary.subsidiaryCode.message : undefined}
                    allowOnlyProvidedOptions
                  />
                  {attendanceError && (
                    <p className="text-xs text-red-500 mt-1">Error loading subsidiaries: {attendanceError.message}</p>
                  )}
                  {!isLoading && !attendanceError && subsidiaries.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">No subsidiaries found for the selected tenant.</p>
                  )}
                </div>

                <div className="group">
                  <Label htmlFor="subsidiaryName" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Subsidiary Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="h-10 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl text-blue-800 flex items-center font-medium shadow-sm">
                    {watch("subsidiary.subsidiaryName") && typeof watch("subsidiary.subsidiaryName") === 'string' ? (
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {watch("subsidiary.subsidiaryName")}
                      </span>
                    ) : (
                      <span className="text-blue-600 italic">Will auto-fill from code</span>
                    )}
                  </div>
                  {showErrors && errors.subsidiary?.subsidiaryName && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.subsidiary.subsidiaryName.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="lg:col-span-3 my-4" />

            {/* Location & Designation */}
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Location & Designation Details
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="group">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="locationCode" className="text-sm font-semibold text-gray-700">
                      Location Code <span className="text-red-500">*</span>
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        refetchLocations();
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      Refresh Locations
                    </button>
                  </div>
                  <SingleSelectField
                    key={`locationCode`}
                    id="locationCode"
                    label=""
                    placeholder="Search Location Code"
                    disabled={isLocationLoading || isReadOnly}
                    value={watch("location.locationCode") || ""}
                    onChange={(value) => {
                      const selectedLocation = filteredLocationCodes.find((loc: { locationCode: string }) => loc.locationCode === value);
                      
                      handleSelectChange('location', {
                        locationCode: value,
                        locationName: selectedLocation?.locationName || ''
                      });
                    }}
                    options={filteredLocationCodes
                      .filter((location: { locationCode: string; locationName: string }) =>
                        location.locationCode && location.locationCode.trim() !== ''
                      )
                      .map((location: { locationCode: string; locationName: string }) => ({
                        value: location.locationCode,
                        label: `${location.locationCode} - ${location.locationName}`,
                        tooltip: `${location.locationCode} - ${location.locationName}`
                      }))}
                    showOnlyValueInTrigger
                    className="group"
                    errorMessage={showErrors && errors.location?.locationCode ? errors.location.locationCode.message : undefined}
                    allowOnlyProvidedOptions
                  />
                  {locationError && (
                    <p className="text-xs text-red-500 mt-1">Error loading locations: {locationError.message}</p>
                  )}
                  {!isLocationLoading && !locationError && filteredLocationCodes.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">No locations found.</p>
                  )}
                  
                </div>

                <div className="group">
                  <Label htmlFor="locationName" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Location Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="h-10 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl text-blue-800 flex items-center font-medium shadow-sm">
                    {watch("location.locationName") && typeof watch("location.locationName") === 'string' ? (
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {watch("location.locationName")}
                      </span>
                    ) : (
                      <span className="text-blue-600 italic">Will auto-fill from code</span>
                    )}
                  </div>
                  {showErrors && errors.location?.locationName && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.location.locationName.message}
                    </p>
                  )}
                </div>
                <div className="group">
                  <SingleSelectField
                    key={`designationCode-${watch("subsidiary.subsidiaryCode") || 'none'}`}
                    id="designationCode"
                    label="Designation Code"
                    placeholder={!watch("subsidiary.subsidiaryCode") ? "Select subsidiary first" : "Search Designation Code"}
                    disabled={isDesignationLoading || isReadOnly || !watch("subsidiary.subsidiaryCode")}
                    value={watch("designation.designationCode") || ""}
                    onChange={(value) => {
                      const selectedDesignation = filteredDesignationCodes.find((des: { designationCode: string }) => des.designationCode === value);
                      
                      // No dependent fields to clear for designation
                      
                      handleSelectChange('designation', {
                        designationCode: value,
                        designationName: selectedDesignation?.designationName || ''
                      });
                    }}
                    options={filteredDesignationCodes
                      .filter((designation: { designationCode: string; designationName: string }) =>
                        designation.designationCode && designation.designationCode.trim() !== ''
                      )
                      .map((designation: { designationCode: string; designationName: string }) => ({
                        value: designation.designationCode,
                        label: `${designation.designationCode} - ${designation.designationName}`,
                        tooltip: `${designation.designationCode} - ${designation.designationName}`
                      }))}
                    showOnlyValueInTrigger
                    className="group"
                    errorMessage={showErrors && errors.designation?.designationCode ? errors.designation.designationCode.message : undefined}
                    allowOnlyProvidedOptions
                  />
                  {designationError && (
                    <p className="text-xs text-red-500 mt-1">Error loading designations: {designationError.message}</p>
                  )}
                  {!isDesignationLoading && !designationError && filteredDesignationCodes.length === 0 && watch("subsidiary.subsidiaryCode") && (
                    <p className="text-xs text-yellow-600 mt-1">No designations found for the selected subsidiary.</p>
                  )}
                </div>

                <div className="group">
                  <Label htmlFor="designationName" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Designation Name <span className="text-red-500">*</span>
                  </Label>
                  <div className="h-10 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl text-blue-800 flex items-center font-medium shadow-sm">
                    {(() => {
                      const designationName = watch("designation.designationName");
                      return designationName && typeof designationName === 'string' ? (
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          {designationName}
                        </span>
                      ) : (
                        <span className="text-blue-600 italic">Will auto-fill from code</span>
                      );
                    })()}
                  </div>
                  {showErrors && errors.designation?.designationName && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.designation.designationName.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="lg:col-span-3 my-4" />

            {/* Employee Categories */}
            <div className="lg:col-span-3">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Employee Categories
              </h3>
              <div className="space-y-3">
                <div className="group">
                  <Label htmlFor="categoryCode" className="text-sm font-semibold text-gray-700 mb-2 block">
                    Category Codes <span className="text-red-500">*</span> (Select multiple categories)
                  </Label>
                  <div className="space-y-2">
                    {/* Category Selection */}
                    <SingleSelectField
                      key={`employeeCategory`}
                      id="employeeCategory"
                      label=""
                      placeholder="Search Employee Categories"
                      disabled={isEmployeeCategoryLoading || isReadOnly}
                      value=""
                      onChange={(value) => {
                        const currentCategories = Array.isArray(watch("employeeCategory")) ? watch("employeeCategory").filter((item: any) => typeof item === 'string') : [];
                        if (!currentCategories.includes(value)) {
                          handleSelectChange('employeeCategory', [...currentCategories, value]);
                        }
                      }}
                      options={employeeCategories
                        .filter((category: { categoryCode: string; categoryName: string }) =>
                          category.categoryCode && category.categoryCode.trim() !== ''
                        )
                        .filter((category: { categoryCode: string }) => {
                          const currentCategories = Array.isArray(watch("employeeCategory")) ? watch("employeeCategory").filter((item: any) => typeof item === 'string') : [];
                          return !currentCategories.includes(category.categoryCode);
                        })
                        .map((category: { categoryCode: string; categoryName: string }) => ({
                          value: category.categoryCode,
                          label: `${category.categoryCode} - ${category.categoryName}`,
                          tooltip: `${category.categoryCode} - ${category.categoryName}`
                        }))}
                      showOnlyValueInTrigger
                      className="group"
                      errorMessage={showErrors && errors.employeeCategory ? errors.employeeCategory.message : undefined}
                      allowOnlyProvidedOptions
                    />

                    {/* Selected Categories Display */}
                    {Array.isArray(watch("employeeCategory")) && watch("employeeCategory").length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">
                          Selected Categories ({watch("employeeCategory").filter((item: any) => typeof item === 'string').length})
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {watch("employeeCategory").filter((item: any) => typeof item === 'string').map((categoryCode: string, index: number) => {
                            const category = employeeCategories.find((cat: { categoryCode: string }) => 
                              cat.categoryCode === categoryCode
                            );
                            return (
                              <Badge
                                key={`${categoryCode}-${index}`}
                                variant="secondary"
                                className="px-3 py-2 bg-blue-100 text-blue-800 border border-blue-200 rounded-lg flex items-center gap-2"
                              >
                                <span className="font-medium">{categoryCode}</span>
                                <span className="text-blue-600">-</span>
                                <span>{category?.categoryName || 'Unknown Category'}</span>
                                {!isReadOnly && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const currentCategories = Array.isArray(watch("employeeCategory")) ? watch("employeeCategory").filter((item: any) => typeof item === 'string') : [];
                                      const updatedCategories = currentCategories.filter((_: string, i: number) => i !== index);
                                      handleSelectChange('employeeCategory', updatedCategories);
                                    }}
                                    className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                )}
                              </Badge>
                            );
                          })}
                       </div>
                      </div>
                    )}

                    {/* Empty State */}
                    {(!Array.isArray(watch("employeeCategory")) || watch("employeeCategory").filter((item: any) => typeof item === 'string').length === 0) && (
                      <div className="h-10 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200 rounded-xl text-gray-500 flex items-center font-medium shadow-sm">
                        <span className="text-gray-600 italic">No categories selected. Please add categories above.</span>
                      </div>
                    )}
                  </div>
                  
                  {showErrors && errors.employeeCategory && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.employeeCategory.message}
                    </p>
                  )}
                  {employeeCategoryError && (
                    <p className="text-xs text-red-500 mt-1">Error loading employee categories: {employeeCategoryError.message}</p>
                  )}
                  {!isEmployeeCategoryLoading && !employeeCategoryError && employeeCategories.length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">No employee categories found for the selected tenant.</p>
                  )}
                </div>
              </div>
            </div>

            
          </div>
        )}
            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3">
              {/* {onPreviousTab && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onPreviousTab}
                    className="px-6 py-3 h-12 rounded-xl border-2 border-gray-300 hover:bg-gray-50 bg-transparent text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
              )} */}
              </div>
              
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    {isValid ? 'Form is valid and ready to continue' : 'Please complete all required fields'}
                  </span>
                {!isValid && showErrors && Object.keys(errors).length > 0 && (
                  <div className="text-xs text-red-600 ml-2">
                    {Object.keys(errors).length} error{Object.keys(errors).length > 1 ? 's' : ''} remaining
                  </div>
                )}
                </div>
                
                {!isReadOnly && (
                  <>
                    <Button
                      type="button"
                    onClick={handleSaveAndContinue}
                      disabled={postLoading}
                    className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg text-white font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {postLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Save
                      </>
                    )}
                    </Button>
                  {onNextTab && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowErrors(true)
                        if (isValid && onNextTab) {
                          onNextTab()
                        }
                      }}
                      className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </Button>
                  )}
                  </>
                )}
                </div>
              </div>
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