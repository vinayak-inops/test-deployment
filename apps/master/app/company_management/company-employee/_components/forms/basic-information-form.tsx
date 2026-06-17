"use client";

import type React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import {
  Card,
  CardContent,
} from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  User,
  Upload,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload";
import PreviewOfEmp from "@/app/contractor/_components/forms/basic-information/preview-of-emp";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure";
import { useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import {
  createBasicInformationSchema,
  normalizeBasicInformationConfig,
  type BasicInformationData,
  type BasicInformationFieldKey,
  type BasicInformationFieldsConfig,
  type BasicInformationTabConfig,
} from "../schemas/basic-information-schema";
import { FormActionsFooter } from "../../../../../components/footer/form-actions-footer";
import { GradientFormHeader } from "../../../../../components/header/form-header";
import { SubFormTitle } from "../../../../../components/header/sub-form-title";

interface BasicInformationFormProps {
  employeeRecordId?: string | null;
  mode?: "add" | "edit" | "view";
  employeeSearchUrl?: string;
  employeeCollectionUrl?: string;
  onSaved?: () => void;
}

export function BasicInformationForm({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl = "company_employee/search",
  employeeCollectionUrl = "company_employee",
  onSaved,
}: BasicInformationFormProps) {
  const searchParams = useSearchParams();
  const idFromUrl = searchParams.get("id");
  const resolvedEmployeeRecordId = employeeRecordId || idFromUrl;

  // Upload hook
  const { uploadFile: uploadDocument } = useFileUpload({
    uploadPath: "company_employee",
  });

  const [showErrors, setShowErrors] = useState(false);
  const tenantCode = useGetTenantCode();
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "company_employee_form_structure",
  });

  const emptyValues: BasicInformationData = {
    employeeID: "",
    firstName: "",
    middleName: "",
    lastName: "",
    gender: undefined,
    birthDate: "",
    bloodGroup: undefined,
    photo: "",
    nationality: "",
    maritalStatus: undefined,
    joiningDate: "",
    emailID: "",
    aadharNumber: "",
    status: undefined,
  };

  const basicInformationTabConfig = useMemo(
    () =>
      normalizeBasicInformationConfig(
        (formStructure?.basicInformation as
          | BasicInformationFieldsConfig
          | BasicInformationTabConfig
          | undefined) ?? undefined
      ),
    [formStructure]
  );

  const basicInformationSchema = useMemo(
    () => createBasicInformationSchema(basicInformationTabConfig),
    [basicInformationTabConfig]
  );

  const fieldsConfig = basicInformationTabConfig.fields ?? {};
  const isVisible = (key: BasicInformationFieldKey) => fieldsConfig[key]?.visible ?? true;
  const isRequired = (key: BasicInformationFieldKey) =>
    (fieldsConfig[key]?.visible ?? true) && (fieldsConfig[key]?.required ?? true);
  const getLabel = (key: BasicInformationFieldKey, fallback: string) =>
    fieldsConfig[key]?.label || fallback;

  const currentMode = mode;

  const isViewMode = currentMode === "view";
  const shouldShowConfigLoader = formStructureLoading || !formStructure;

  // Normalize gender from various inputs to Select enum values
  const normalizeGender = (
    value: unknown,
  ): "Male" | "Female" | "Other" | "Prefer not to say" | undefined => {
    const s = String(value ?? "")
      .trim()
      .toLowerCase();
    if (!s) return undefined;
    if (s === "male") return "Male";
    if (s === "female") return "Female";
    if (s === "other") return "Other";
    if (
      s === "prefer not to say" ||
      s === "prefer_not_to_say" ||
      s === "prefer-not-to-say"
    )
      return "Prefer not to say";
    return undefined;
  };

  const toFormValues = (source: any): BasicInformationData => ({
    employeeID: source?.employeeID || "",
    firstName: source?.firstName || "",
    middleName: source?.middleName || "",
    lastName: source?.lastName || "",
    gender: normalizeGender(source?.gender),
    birthDate: source?.birthDate || "",
    bloodGroup: source?.bloodGroup || undefined,
    photo:
      typeof source?.photo === "string"
        ? source.photo
        : source?.photo?.documentPath || "",
    nationality: source?.nationality || "",
    maritalStatus: source?.maritalStatus || undefined,
    joiningDate: source?.joiningDate || "",
    emailID: source?.emailID || "",
    aadharNumber: source?.aadharNumber || "",
    status: source?.status || undefined,
  });

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    reset,
    setError,
  } = useForm<BasicInformationData>({
    resolver: zodResolver(basicInformationSchema),
    defaultValues: emptyValues,
    mode: "onChange",
  });

  const getExactData = (): BasicInformationData => {
    const values = watch();
    return {
      employeeID: values.employeeID || "",
      firstName: values.firstName || "",
      middleName: values.middleName || "",
      lastName: values.lastName || "",
      gender: values.gender || undefined,
      birthDate: values.birthDate || "",
      bloodGroup: values.bloodGroup || undefined,
      photo: values.photo || "",
      nationality: values.nationality || "",
      maritalStatus: values.maritalStatus || undefined,
      joiningDate: values.joiningDate || "",
      emailID: values.emailID || "",
      aadharNumber: values.aadharNumber || "",
      status: values.status || undefined,
    };
  };

  const { post: postBasicInformation, loading: postLoading } =
    usePostRequest<any>({
      url: employeeCollectionUrl,
      onSuccess: (response) => {
        const status = response?.status ?? response?.data?.status ?? true;
        if (!status) {
          setShowErrors(true);
          const responseData =
            response?.data && typeof response.data === "object"
              ? response.data
              : response;
          if (responseData && typeof responseData === "object") {
            Object.entries(responseData).forEach(([fieldName, message]) => {
              if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return;
              if (typeof message !== "string" || !message.trim()) return;
              setError(fieldName as keyof BasicInformationData, {
                type: "server",
                message,
              });
            });
          }
          return;
        }

        toast.success("Company employee basic information has been saved successfully.");

        onSaved?.();
      },
      onError: (error) => {
        const message =
          (error as { message?: string } | undefined)?.message ||
          "Failed to save company employee basic information.";
        toast.error(message);
      },
    });

  const { refetch: fetchEmployeeRecord } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [{ field: "_id", value: resolvedEmployeeRecordId, operator: "eq" }],
    onSuccess: (data) => {
      const row = Array.isArray(data) ? data[0] : null;
      if (row && row.isDeleted !== true) {
        reset(toFormValues(row));
      } else {
        reset(emptyValues);
      }
    },
    onError: (error) => {
      console.error("Error fetching employee data:", error);
    },
    dependencies: [resolvedEmployeeRecordId, employeeSearchUrl],
  });

  useEffect(() => {
    if ((currentMode === "edit" || currentMode === "view") && resolvedEmployeeRecordId) {
      void fetchEmployeeRecord();
      return;
    }
    if (currentMode === "add") {
      reset(emptyValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMode, resolvedEmployeeRecordId, employeeSearchUrl]);

  const handleInputChange = async (
    field: keyof BasicInformationData,
    value: string,
  ) => {
    setValue(field, value, { shouldDirty: true, shouldTouch: true });
    await trigger(field);
  };

  // Photo handling functions
  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if Employee ID is available
    const currentEmployeeID = watchedValues.employeeID;
    if (!currentEmployeeID || currentEmployeeID.trim() === "") {
      alert("Please enter Employee ID first before uploading photo");
      return;
    }

    try {
      // Generate unique filename
      const now = new Date();
      const isoTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const fileExtension = file.name.split(".").pop();
      const employeeID = currentEmployeeID;
      const newFileName = `${employeeID}_photo_${isoTime}.${fileExtension}`;

      // Upload file using hook with renamed file
      const renamedFile = new File([file], newFileName, { type: file.type });
      const res = await uploadDocument(renamedFile, newFileName);

      if (res.success && res.serverPath) {
        setValue("photo", res.serverPath, {
          shouldDirty: true,
          shouldTouch: true,
        });
      } else {
        setValue("photo", file.name, { shouldDirty: true, shouldTouch: true });
      }
    } catch (error) {
      // noop
    }
  };

  const removePhoto = () => {
    setValue("photo", "", { shouldDirty: true, shouldTouch: true });
  };

  const handleSaveAndContinue = async () => {
    if (shouldShowConfigLoader) return;
    setShowErrors(true);

    const formValues = getExactData();

    const valid = await trigger();
    if (valid) {
      const isEdit = currentMode === "edit" && Boolean(resolvedEmployeeRecordId);
      const payload = {
        tenant: tenantCode,
        action: isEdit ? "update" : "insert",
        ...(isEdit ? { id: resolvedEmployeeRecordId } : {}),
        collectionName: "company_employee",
        ruleId: "companyEmployeeDetails",
        data: {
          ...formValues,
          basicInformation: true,
        },
      };
      postBasicInformation(payload);
    }
  };

  // Split actions: Save and Continue
  const handleSave = async () => {
    await handleSaveAndContinue();
  };

  const watchedValues = watch();
  const showEmployeePhoto = isVisible("photo");
  const showEmployeeDetailsSection =
    isVisible("employeeID") ||
    isVisible("firstName") ||
    isVisible("middleName") ||
    isVisible("lastName") ||
    isVisible("status");
  const showAdditionalSection =
    isVisible("gender") ||
    isVisible("nationality") ||
    isVisible("emailID") ||
    isVisible("birthDate") ||
    isVisible("bloodGroup") ||
    isVisible("maritalStatus") ||
    isVisible("joiningDate") ||
    isVisible("aadharNumber");

  // if (isFetchingRecord && (currentMode === "edit" || currentMode === "view")) {
  //   return (
  //     <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
  //       <CardContent className="p-8">
  //         <div className="text-sm text-gray-600">
  //           Loading employee basic information...
  //         </div>
  //       </CardContent>
  //     </Card>
  //   );
  // }

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      <GradientFormHeader
        icon={User}
        title="Basic Information"
        description="Essential contractor details and identification"
      />
      <CardContent className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
        {shouldShowConfigLoader ? (
          <div className="py-12 text-center text-sm text-gray-600">
            Loading form configuration...
          </div>
        ) : (
          <>
            {showErrors && Object.keys(errors).length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Please fix highlighted fields before continuing.
              </div>
            )}
        {(showEmployeePhoto || showEmployeeDetailsSection) && (
          <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-6 gap-6 items-start">
            {showEmployeePhoto && (
              <div className="space-y-3 lg:col-span-1 xl:col-span-1">
                <SubFormTitle title={getLabel("photo", "Profile Photo")} />
                <div className="rounded-lg border border-gray-200 p-2 h-[140px] flex items-center justify-center relative overflow-hidden">
                  <PreviewOfEmp path={watchedValues?.photo || ""} />
                  {!isViewMode && watchedValues?.photo && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {!isViewMode && (
                  <label className="h-9 border border-gray-300 rounded-md flex items-center justify-center gap-2 px-3 cursor-pointer">
                    <Upload className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis">
                      {watchedValues?.photo?.split("/").pop() || "Upload photo"}
                    </span>
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                  </label>
                )}
              </div>
            )}

            {showEmployeeDetailsSection && (
              <div className={`space-y-3 ${showEmployeePhoto ? "lg:col-span-4 xl:col-span-5" : "lg:col-span-5 xl:col-span-6"}`}>
                <SubFormTitle title="Employee Details" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {isVisible("employeeID") && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="employeeID"
                      className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                    >
                      {getLabel("employeeID", "Employee ID")} {isRequired("employeeID") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      {...register("employeeID")}
                      id="employeeID"
                      disabled={
                        currentMode === "edit" || currentMode === "view"
                      }
                      className={`h-9 border focus:ring-1 rounded-md transition-colors ${
                        currentMode === "view" || currentMode === "edit"
                          ? "bg-gray-100 cursor-not-allowed"
                          : ""
                      } ${
                        showErrors && errors.employeeID
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                      placeholder="Enter employee ID (e.g., EMP001)"
                    />
                    {showErrors && errors.employeeID && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.employeeID.message}
                      </p>
                    )}
                  </div>
                  )}
                  {isVisible("firstName") && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="firstName"
                      className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                    >
                      {getLabel("firstName", "First Name")} {isRequired("firstName") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      {...register("firstName")}
                      id="firstName"
                      disabled={isViewMode}
                      className={`h-9 border focus:ring-1 rounded-md transition-colors ${
                        isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                      } ${
                        showErrors && errors.firstName
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                      placeholder="Enter first name"
                    />
                    {showErrors && errors.firstName && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.firstName.message}
                      </p>
                    )}
                  </div>
                  )}
                  {isVisible("middleName") && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="middleName"
                      className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                    >
                      {getLabel("middleName", "Middle Name")}
                    </Label>
                    <Input
                      {...register("middleName")}
                      id="middleName"
                      disabled={isViewMode}
                      className={`h-9 border focus:ring-1 rounded-md transition-colors ${
                        isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                      } ${
                        showErrors && errors.middleName
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                      placeholder="Enter middle name"
                    />
                    {showErrors && errors.middleName && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.middleName.message}
                      </p>
                    )}
                  </div>
                  )}
                  {isVisible("lastName") && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="lastName"
                      className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                    >
                      {getLabel("lastName", "Last Name")} {isRequired("lastName") && <span className="text-red-500">*</span>}
                    </Label>
                    <Input
                      {...register("lastName")}
                      id="lastName"
                      disabled={isViewMode}
                      className={`h-9 border focus:ring-1 rounded-md transition-colors ${
                        isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                      } ${
                        showErrors && errors.lastName
                          ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                      placeholder="Enter last name"
                    />
                    {showErrors && errors.lastName && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.lastName.message}
                      </p>
                    )}
                  </div>
                  )}
                  {isVisible("status") && (
                  <div className="space-y-2">
                    <Label
                      htmlFor="status"
                      className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                    >
                      {getLabel("status", "Status")} {isRequired("status") && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={watchedValues.status || ""}
                      onValueChange={(value) =>
                        handleInputChange("status", value)
                      }
                      disabled={isViewMode}
                      key={`status-${watchedValues.status || "empty"}`}
                    >
                      <SelectTrigger
                        className={`h-9 border focus:ring-1 rounded-md transition-colors bg-white ${
                          isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                        } ${
                          showErrors && errors.status
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                            : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                        }`}
                      >
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-md border-2 bg-white">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    {showErrors && errors.status && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <X className="h-3 w-3" />
                        {errors.status.message}
                      </p>
                    )}
                  </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {showAdditionalSection && (
          <div className="space-y-3">
            <SubFormTitle title="Additional Information" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {isVisible("gender") && (
              <div className="space-y-2">
                <Label
                  htmlFor="gender"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("gender", "Gender")} {isRequired("gender") && <span className="text-red-500">*</span>}
                </Label>
                <Select
                  value={watchedValues.gender || ""}
                  onValueChange={(value) => handleInputChange("gender", value)}
                  disabled={isViewMode}
                  key={`gender-${watchedValues.gender || "empty"}`}
                >
                  <SelectTrigger
                    className={`h-9 border focus:ring-1 rounded-md transition-colors bg-white ${
                      isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                    } ${
                      showErrors && errors.gender
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  >
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-2 bg-white">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                    <SelectItem value="Prefer not to say">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
                {showErrors && errors.gender && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.gender.message}
                  </p>
                )}
              </div>
              )}

              {isVisible("nationality") && (
              <div className="space-y-2">
                <Label
                  htmlFor="nationality"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("nationality", "Nationality")} {isRequired("nationality") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  {...register("nationality")}
                  id="nationality"
                  disabled={isViewMode}
                  className={`h-9 border focus:ring-1 rounded-md transition-colors ${
                    isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                  } ${
                    showErrors && errors.nationality
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter nationality"
                />
                {showErrors && errors.nationality && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.nationality.message}
                  </p>
                )}
              </div>
              )}

              {isVisible("emailID") && (
              <div className="space-y-2">
                <Label
                  htmlFor="emailID"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("emailID", "Email Address")} {isRequired("emailID") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  {...register("emailID")}
                  id="emailID"
                  type="email"
                  disabled={isViewMode}
                  className={`h-9 border focus:ring-1 rounded-md transition-colors ${
                    isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                  } ${
                    showErrors && errors.emailID
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter email address"
                />
                {showErrors && errors.emailID && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.emailID.message}
                  </p>
                )}
              </div>
              )}

              {isVisible("birthDate") && (
              <div className="space-y-2">
                <Label
                  htmlFor="birthDate"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("birthDate", "Date of Birth")} {isRequired("birthDate") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  {...register("birthDate")}
                  id="birthDate"
                  type="date"
                  disabled={isViewMode}
                  className={`h-9 border focus:ring-1 rounded-md transition-colors ${
                    isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                  } ${
                    showErrors && errors.birthDate
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {showErrors && errors.birthDate && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.birthDate.message}
                  </p>
                )}
                {!errors.birthDate && (
                  <p className="text-gray-500 text-xs mt-1">
                    Select birth date (cannot be future date)
                  </p>
                )}
              </div>
              )}

              {isVisible("bloodGroup") && (
              <div className="space-y-2">
                <Label
                  htmlFor="bloodGroup"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("bloodGroup", "Blood Group")} {isRequired("bloodGroup") && <span className="text-red-500">*</span>}
                </Label>
                <Select
                  value={watchedValues.bloodGroup || ""}
                  onValueChange={(value) =>
                    handleInputChange("bloodGroup", value)
                  }
                  disabled={isViewMode}
                  key={`bloodGroup-${watchedValues.bloodGroup || "empty"}`}
                >
                  <SelectTrigger
                    className={`h-9 border focus:ring-1 rounded-md transition-colors bg-white ${
                      isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                    } ${
                      showErrors && errors.bloodGroup
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  >
                    <SelectValue placeholder="Select Blood Group" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-2 bg-white">
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
                {showErrors && errors.bloodGroup && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.bloodGroup.message}
                  </p>
                )}
              </div>
              )}

              {isVisible("maritalStatus") && (
              <div className="space-y-2">
                <Label
                  htmlFor="maritalStatus"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("maritalStatus", "Marital Status")} {isRequired("maritalStatus") && <span className="text-red-500">*</span>}
                </Label>
                <Select
                  value={watchedValues.maritalStatus || ""}
                  onValueChange={(value) =>
                    handleInputChange("maritalStatus", value)
                  }
                  disabled={isViewMode}
                  key={`maritalStatus-${watchedValues.maritalStatus || "empty"}`}
                >
                  <SelectTrigger
                    className={`h-9 border focus:ring-1 rounded-md transition-colors bg-white ${
                      isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                    } ${
                      showErrors && errors.maritalStatus
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                        : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                  >
                    <SelectValue placeholder="Select Marital Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-md border-2 bg-white">
                    <SelectItem value="Unmarried">Unmarried</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                  </SelectContent>
                </Select>
                {showErrors && errors.maritalStatus && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.maritalStatus.message}
                  </p>
                )}
              </div>
              )}

              {isVisible("joiningDate") && (
              <div className="space-y-2">
                <Label
                  htmlFor="joiningDate"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("joiningDate", "Joining Date")} {isRequired("joiningDate") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  {...register("joiningDate")}
                  id="joiningDate"
                  type="date"
                  disabled={isViewMode}
                  className={`h-9 border focus:ring-1 rounded-md transition-colors ${
                    isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                  } ${
                    showErrors && errors.joiningDate
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {showErrors && errors.joiningDate && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.joiningDate.message}
                  </p>
                )}
              </div>
              )}

              {isVisible("aadharNumber") && (
              <div className="space-y-2">
                <Label
                  htmlFor="aadharNumber"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("aadharNumber", "Aadhar Number")} {isRequired("aadharNumber") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  {...register("aadharNumber")}
                  id="aadharNumber"
                  type="text"
                  maxLength={12}
                  disabled={isViewMode}
                  className={`h-9 border focus:ring-1 rounded-md transition-colors ${
                    isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                  } ${
                    showErrors && errors.aadharNumber
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                  placeholder="Enter 12-digit Aadhar number"
                />
                {showErrors && errors.aadharNumber && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.aadharNumber.message}
                  </p>
                )}
              </div>
              )}
            </div>
          </div>
        )}

          </>
        )}
      </CardContent>

      <FormActionsFooter
        isViewMode={isViewMode}
        isValid={isValid}
        showErrors={showErrors}
        errorCount={Object.keys(errors).length}
        postLoading={postLoading || shouldShowConfigLoader}
        onSave={handleSave}
      />
    </Card>
  );
}

