"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Calendar, X, Users } from "lucide-react";
import SemiPopupWrapper from "@repo/ui/components/popupwrapper/semi-popup-wrapper";
import { Separator } from "@repo/ui/components/ui/separator";
import { useHolidayCrud, HolidayItem } from "@/hooks/holidays/useCrudHoliday";
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken";
import { useEffect, useState } from "react";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { SingleSelectField } from "@/components/fields/single-select-field";
import { Badge } from "@repo/ui/components/ui/badge";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";

interface HolidayFormData {
  holidayType: string;
  holidayName: string;
  holidayDate: string;
  subsidiaryCode: string;
  locationCode: string;
  employeeCategory: string[];
  organizationCode: string;
  tenantCode: string;
}

interface HolidayFormModalProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  holidayData?: HolidayItem[]; // Changed: Pass holiday data array
  onSuccess?: (savedHoliday: HolidayItem) => void;
  onServerUpdate?: () => Promise<any>;
  editData?: HolidayItem | null;
  isEditMode?: boolean;
  isViewMode?: boolean;
  deleteValue?: any;
  createdByUser?: string;
}

// Holiday type options
const holidayTypeOptions = [
  { label: "National", value: "National" },
  { label: "Regional", value: "Regional" },
  { label: "Company", value: "Company" },
  { label: "Optional", value: "Optional" },
];

const createSchema = () => {
  return yup.object().shape({
    holidayType: yup.string().required("Holiday type is required"),
    holidayName: yup.string().required("Holiday name is required"),
    holidayDate: yup.string().required("Holiday date is required"),
    subsidiaryCode: yup.string().required("Subsidiary is required"),
    locationCode: yup.string().required("Location is required"),
    employeeCategory: yup
      .array()
      .of(yup.string().required())
      .min(1, "At least one employee category is required")
      .required("At least one employee category is required"),
    organizationCode: yup.string().required("Organization code is required"),
    tenantCode: yup.string().required("Tenant code is required"),
  });
};

export default function HolidayAddFormValidated({
  open,
  setOpen,
  holidayData = [], // Changed: Receive holiday data array
  onSuccess,
  onServerUpdate,
  editData,
  isEditMode,
  isViewMode = false,
  deleteValue,
  createdByUser = "default-user",
}: HolidayFormModalProps) {
  const tenantCode = useGetTenantCode()
  // Fetch organization data for dropdowns only
  const {
    data: orgData,
    loading: orgLoading,
    error: orgError,
    refetch: orgRefetch,
  } = useRequest<any[]>({
    url: `map/organization/search?tenantCode=${tenantCode}`,
    onSuccess: (data) => {
    },
    onError: (error) => {
      console.error("Error loading organization data:", error);
    },
  });

  useEffect(() => {
    orgRefetch();
  }, []);

  // FIXED: Pass the actual holiday data array to the hook
  const { 
    holidays, 
    holiday, 
    addHoliday, 
    updateHoliday, 
    deleteHoliday, 
    setHoliday, 
    resetHoliday 
  } = useHolidayCrud(holidayData); 
  const { data: session, status: sessionStatus } = useSession();

  // Auth token hook
  const { token } = useAuthToken();

  // API post request setup
  const {
    post: postHoliday,
    loading: postLoading,
    error: postError,
    data: postData,
  } = usePostRequest<any>({
    url: "holiday",
    onSuccess: (data) => {
      toast.success("Holiday submitted successfully!");
    },
    onError: (error) => {
      toast.error("Holiday submission failed!");
      console.error("POST error:", error);
    },
  });

  // Select option states
  const [selectedEmployeeCategories, setSelectedEmployeeCategories] = useState<string[]>([]);
  const [selectedSubsidiaryCode, setSelectedSubsidiaryCode] = useState<string>("");
  const [selectedLocationCode, setSelectedLocationCode] = useState<string>("");

  // Options for selects from organization data
  const subsidiaryOptions = (orgData?.[0]?.subsidiaries || []).map((sub: any) => ({
    label: `${sub.subsidiaryName || 'Unknown'} (${sub.subsidiaryCode || 'N/A'})`,
    value: sub.subsidiaryCode || '',
  }));

  const locationOptions = (orgData?.[0]?.location || []).map((loc: any) => ({
    label: `${loc.locationName || 'Unknown'} (${loc.locationCode || 'N/A'})`,
    value: loc.locationCode || '',
  }));

  const employeeCategoryOptions = (orgData?.[0]?.employeeCategories || []).map((cat: any) => ({
    label: cat.employeeCategoryName || cat.employeeCategoryCode || 'Unknown',
    value: cat.employeeCategoryCode || '',
  }));

  // Validation schema
  const schema = createSchema();

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<HolidayFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      holidayType: "",
      holidayName: "",
      holidayDate: "",
      subsidiaryCode: "",
      locationCode: "",
      employeeCategory: [],
      organizationCode: tenantCode,
      tenantCode: tenantCode,
    },
  });

  // Form population logic in edit/view mode
  useEffect(() => {
    if ((isEditMode || isViewMode) && editData) {
      
      setValue("holidayType", editData.holiday?.holidayType || "");
      setValue("holidayName", editData.holiday?.holidayName || "");
      setValue("holidayDate", editData.holiday?.holidayDate || "");
      setValue("subsidiaryCode", editData.subsidiary?.subsidiaryCode || "");
      setValue("locationCode", editData.location?.locationCode || "");
      setValue("employeeCategory", editData.employeeCategory || []);
      setValue("organizationCode", editData.organizationCode || tenantCode);
      setValue("tenantCode", editData.tenantCode || tenantCode);

      setSelectedSubsidiaryCode(editData.subsidiary?.subsidiaryCode || "");
      setSelectedLocationCode(editData.location?.locationCode || "");
      setSelectedEmployeeCategories(editData.employeeCategory || []);

      setHoliday(editData);
    } else {
      reset();
      setSelectedEmployeeCategories([]);
      setSelectedSubsidiaryCode("");
      setSelectedLocationCode("");
      resetHoliday();
    }
  }, [isEditMode, isViewMode, editData, reset, setValue, setHoliday, resetHoliday]);

  // Handle delete functionality
  useEffect(() => {
    if (deleteValue && deleteValue._id) {
      handleDeleteItem(deleteValue._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteValue]);

  const handleDeleteItem = async (holidayId: string) => {
    try {
      
      if (!deleteValue || !deleteValue._id) {
        toast.error("Holiday not found for deletion");
        return;
      }

      const postData = {
        tenant: tenantCode,
        action: "delete",
        id: deleteValue._id,
        collectionName: "holiday",
        data: deleteValue,
      };


      await postHoliday(postData);
      deleteHoliday(deleteValue._id);

      if (onSuccess) onSuccess(deleteValue);
      if (onServerUpdate) await onServerUpdate();

      toast.success("Holiday deleted successfully");
      setOpen(false);
    } catch (error) {
      console.error("Error deleting holiday:", error);
      toast.error("Failed to delete holiday");
    }
  };

  // Handle Select controls
  const handleSubsidiarySelect = (code: string) => {
    setSelectedSubsidiaryCode(code);
    setValue("subsidiaryCode", code);
  };

  const handleLocationSelect = (code: string) => {
    setSelectedLocationCode(code);
    setValue("locationCode", code);
  };

  const handleEmployeeCategorySelect = (code: string) => {
    if (!selectedEmployeeCategories.includes(code)) {
      const newCategories = [...selectedEmployeeCategories, code];
      setSelectedEmployeeCategories(newCategories);
      setValue("employeeCategory", newCategories);
    }
  };

  const handleEmployeeCategoryRemove = (code: string) => {
    const newCategories = selectedEmployeeCategories.filter(c => c !== code);
    setSelectedEmployeeCategories(newCategories);
    setValue("employeeCategory", newCategories);
  };

  // Form submission logic
  const handleFormSubmit: SubmitHandler<HolidayFormData> = async (data) => {
    try {

      const nowISO = new Date().toISOString();

      // Find selected location and subsidiary from orgData
      const selectedLocation = orgData?.[0]?.location?.find((l: any) => l.locationCode === data.locationCode);
      const selectedSubsidiary = orgData?.[0]?.subsidiaries?.find((s: any) => s.subsidiaryCode === data.subsidiaryCode);

      // Build the holiday item
      const holidayItem: HolidayItem = {
        _id: isEditMode && editData?._id ? editData._id : undefined,
        employeeCategory: data.employeeCategory,
        organizationCode: data.organizationCode,
        location: {
          locationName: selectedLocation?.locationName || "",
          locationCode: selectedLocation?.locationCode || data.locationCode,
        },
        tenantCode: data.tenantCode,
        holiday: {
          holidayType: data.holidayType,
          holidayName: data.holidayName,
          holidayDate: data.holidayDate,
        },
        subsidiary: {
          subsidiaryName: selectedSubsidiary?.subsidiaryName || "",
          subsidiaryCode: selectedSubsidiary?.subsidiaryCode || data.subsidiaryCode,
        },
        createdOn: isEditMode ? editData?.createdOn : new Date().toISOString(),
        createdBy: isEditMode ? editData?.createdBy : session?.user?.name || "",
      };


      // Prepare API payload
      const postData = {
        tenant: tenantCode,
        action: "insert",
        id: holidayItem._id,
        collectionName: "holiday",
        data: holidayItem,
      };

      // Send to backend first
      await postHoliday(postData);

      // Update local hook state
      if (isEditMode && holidayItem._id) {
        updateHoliday(holidayItem._id, holidayItem);
      } else {
        addHoliday(holidayItem);
      }

      // Call success callbacks
      if (onSuccess) onSuccess(holidayItem);
      if (onServerUpdate) await onServerUpdate();

      // Reset and close
      reset();
      setSelectedEmployeeCategories([]);
      setSelectedSubsidiaryCode("");
      setSelectedLocationCode("");
      resetHoliday();
      setOpen(false);

    } catch (error) {
      console.error("Error processing holiday:", error);
      toast.error("Failed to save holiday.");
    }
  };

  // Cancel handler
  const handleCancel = () => {
    reset();
    resetHoliday();
    setSelectedEmployeeCategories([]);
    setSelectedSubsidiaryCode("");
    setSelectedLocationCode("");
    setOpen(false);
  };

  return (
    <SemiPopupWrapper
      open={open}
      setOpen={setOpen}
      content={{
          title: isViewMode ? "View Holiday" : isEditMode ? "Edit Holiday" : "Add New Holiday",
          description: isViewMode ? "View holiday information" : "Create a new holiday entry with detailed information",
      }}
    >
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between rounded-t-lg -mx-6 pt-4 mb-4">
          <div className="group cursor-default pl-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
                  <Calendar className="w-5 h-5 text-gray-700 transition-colors duration-300 group-hover:text-gray-900" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-sm animate-pulse"></div>
              </div>
              <div className="transform transition-all duration-300 group-hover:translate-x-1">
                <h1 className="text-lg font-bold flex items-center gap-2">
                  {isViewMode ? "View Holiday" : isEditMode ? "Edit Holiday" : "Add New Holiday"}
                </h1>
                <p className="text-purple-100 text-sm mt-1">
                  {isViewMode
                    ? "View holiday information"
                    : isEditMode
                    ? "Update holiday information"
                    : "Create a new holiday entry with detailed information"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6" noValidate>
            {/* Holiday Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Holiday Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="holidayType">Holiday Type</Label>
                  <Select
                    onValueChange={(val) => setValue("holidayType", val)}
                    value={watch("holidayType")}
                    disabled={orgLoading || isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select holiday type" />
                    </SelectTrigger>
                    <SelectContent>
                      {holidayTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.holidayType && (
                    <p className="text-sm text-red-500">{errors.holidayType.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="holidayName">Holiday Name</Label>
                  <Input
                    id="holidayName"
                    {...register("holidayName")}
                    placeholder="Enter holiday name"
                    className={errors.holidayName ? "border-red-500" : ""}
                    disabled={isViewMode}
                  />
                  {errors.holidayName && (
                    <p className="text-sm text-red-500">{errors.holidayName.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="holidayDate">Holiday Date</Label>
                <Input
                  id="holidayDate"
                  type="date"
                  {...register("holidayDate")}
                  className={errors.holidayDate ? "border-red-500" : ""}
                  disabled={isViewMode}
                />
                {errors.holidayDate && (
                  <p className="text-sm text-red-500">{errors.holidayDate.message}</p>
                )}
              </div>
            </div>

            <Separator />

            {/* Organization Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Organization Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <SingleSelectField
                    key={`subsidiaryCode`}
                    id="subsidiaryCode"
                    label="Subsidiary"
                    placeholder="Search Subsidiary"
                    disabled={orgLoading || isViewMode}
                    value={selectedSubsidiaryCode || ""}
                    onChange={handleSubsidiarySelect}
                    options={orgLoading ? [] : subsidiaryOptions.map((opt: { label: string; value: string }) => ({
                      value: opt.value,
                      label: opt.label,
                      tooltip: opt.label
                    }))}
                    showOnlyValueInTrigger
                    className="group"
                    errorMessage={errors.subsidiaryCode ? errors.subsidiaryCode.message : undefined}
                    allowOnlyProvidedOptions
                  />
                  {orgError && (
                    <p className="text-sm text-red-500">Error loading subsidiaries: {orgError.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <SingleSelectField
                    key={`locationCode`}
                    id="locationCode"
                    label="Location"
                    placeholder="Search Location"
                    disabled={isViewMode}
                    value={selectedLocationCode || ""}
                    onChange={handleLocationSelect}
                    options={locationOptions.map((opt: { label: string; value: string }) => ({
                      value: opt.value,
                      label: opt.label,
                      tooltip: opt.label
                    }))}
                    showOnlyValueInTrigger
                    className="group"
                    errorMessage={errors.locationCode ? errors.locationCode.message : undefined}
                    allowOnlyProvidedOptions
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Employee Categories */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Employee Categories</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <SingleSelectField
                    key={`employeeCategory`}
                    id="employeeCategory"
                    label="Employee Categories"
                    placeholder="Search Employee Categories"
                    disabled={isViewMode}
                    value=""
                    onChange={handleEmployeeCategorySelect}
                    options={employeeCategoryOptions
                      .filter((opt: { label: string; value: string }) => !selectedEmployeeCategories.includes(opt.value))
                      .map((opt: { label: string; value: string }) => ({
                        value: opt.value,
                        label: opt.label,
                        tooltip: opt.label
                      }))}
                    showOnlyValueInTrigger
                    className="group"
                    errorMessage={errors.employeeCategory ? errors.employeeCategory.message : undefined}
                    allowOnlyProvidedOptions
                  />
                </div>

                {selectedEmployeeCategories.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Selected Categories:</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployeeCategories.map((code) => {
                        const category = orgData?.[0]?.employeeCategories?.find(
                          (cat: any) => cat.employeeCategoryCode === code
                        );
                        return (
                          <Badge
                            key={code}
                            variant="secondary"
                            className="flex items-center gap-1 px-3 py-1"
                          >
                            <Users className="w-3 h-3" />
                            {category
                              ? `${category.employeeCategoryName || category.employeeCategoryCode} (${code})`
                              : code}
                            {!isViewMode && (
                            <button
                              type="button"
                              onClick={() => handleEmployeeCategoryRemove(code)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            )}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting || postLoading}
              >
                {isViewMode ? "Close" : "Cancel"}
              </Button>
              {!isViewMode && (
              <Button
                type="submit"
                disabled={isSubmitting || postLoading}
                style={{ backgroundColor: "#2d81ff" }}
                className="hover:opacity-90"
              >
                {(isSubmitting || postLoading) ? "Saving..." : isEditMode ? "Update" : "Save"}
              </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </SemiPopupWrapper>
  );
}