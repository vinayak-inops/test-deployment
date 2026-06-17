"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gql, useQuery } from "@apollo/client";

import { useToast } from "@repo/ui/hooks/use-toast";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ActionButtons from "@/components/common/action-buttons";
import { SingleSelectField } from "@/components/fields/single-select-field";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useFileUpload } from "@/hooks/api/file-handle/useFileUpload";
import PreviewOfEmp from "@/app/contractor/_components/forms/basic-information/preview-of-emp";
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info";
import {
  getCurrentISODate,
  getCurrentISOString,
} from "@/utils/time/time-control";
import { useRouter } from "next/navigation";
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto";
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure";
import { client } from "@repo/ui/hooks/api/dynamic-graphql";
import {
  createPersonalInformationSchema,
  normalizePersonalInformationConfig,
  type PersonalInformationFieldKey,
  type PersonalInformationFieldsConfig,
  type PersonalInformationTabConfig,
  type PersonalInformationData,
} from "./schemas/personal-information-schema";

export type ContractEmployeeBasicInfoData = PersonalInformationData;

const extractServerPath = (res: any): string => {
  if (typeof res?.serverPath === "string") return res.serverPath;
  if (typeof res?.data === "string") return res.data;
  if (typeof res?.data?.path === "string") return res.data.path;
  if (typeof res?.data?.serverPath === "string") return res.data.serverPath;
  if (typeof res?.path === "string") return res.path;
  return "";
};

interface ContractEmployeeBasicInfoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ContractEmployeeBasicInfoData) => Promise<boolean> | boolean;
  initialValues?: Partial<ContractEmployeeBasicInfoData>;
  title?: string;
}

const FETCH_ORGANIZATION_CASTE_QUERY = gql`
  query FetchOrganizationCaste(
    $criteriaRequests: [CriteriaRequest!]!
    $collection: String!
  ) {
    fetchOrganization(
      criteriaRequests: $criteriaRequests
      collection: $collection
    ) {
      caste {
        casteName
        casteDescription
      }
    }
  }
`;

export default function ContractEmployeeBasicInfoForm({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  title = "Contract Employee - Basic Information",
}: ContractEmployeeBasicInfoFormProps) {
  const router = useRouter();
  const tenantCode = useGetTenantCode();
  const { toast } = useToast();
  const { employeeId: createdBy } = useKeyclockRoleInfo();
  const { formStructure, loading: formStructureLoading } =
    useCollectionFormStructure({
      collectionName: "contract_employee_strcture",
    });
  const { data: organizationResponse } = useQuery(
    FETCH_ORGANIZATION_CASTE_QUERY,
    {
      variables: {
        criteriaRequests: [
          { field: "tenantCode", operator: "eq", value: tenantCode },
        ],
        collection: "organization",
      },
      skip: !tenantCode,
      client,
    },
  );

  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [photoFileName, setPhotoFileName] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const lastSaveSucceededRef = useRef(false);
  const photoRef = useRef("");
  const { uploadFile: uploadEmployeePhoto } = useFileUpload({ uploadPath: "contract_employee" });
  const { post: postPersonalInformation, loading: postLoading } =
    usePostRequest<any>({
      url: "validate",
      onSuccess: async (response) => {
        const status = response?.status ?? response?.data?.status;
        if (!status) {
          lastSaveSucceededRef.current = false;
          const responseData =
            response?.data && typeof response.data === "object"
              ? response.data
              : response;

          if (responseData && typeof responseData === "object") {
            Object.entries(responseData).forEach(([fieldName, message]) => {
              if (
                fieldName === "status" ||
                fieldName === "_id" ||
                fieldName === "id"
              )
                return;
              if (typeof message !== "string" || !message.trim()) return;
              setError(fieldName as keyof ContractEmployeeBasicInfoData, {
                type: "server",
                message,
              });
            });
          }
          return;
        }
        lastSaveSucceededRef.current = true;

        toast({
          variant: "default",
          title: "Saved",
          description:
            "Contract employee basic information saved successfully.",
        });

        const createdId =
          response?._id?.$oid ||
          response?._id ||
          response?.id ||
          response?.data?._id?.$oid ||
          response?.data?._id ||
          response?.data?.id;

        if (createdId) {
          const encryptedData = encryptEmployeeData({
            employeeId: createdBy || "",
            _id: String(createdId),
          });
          router.push(
            `/employee-management/contract-employee?form=temp&mode=edit&id=${encodeURIComponent(encryptedData)}`,
          );
        }
      },
      onError: (error) => {
        lastSaveSucceededRef.current = false;
        const msg = error?.message || "Failed to save basic information.";
        setSaveError(msg);
        toast({
          variant: "destructive",
          title: "Save Error",
          description: msg,
        });
      },
    });

  const defaultValues = useMemo<Partial<ContractEmployeeBasicInfoData>>(() => {
    return {
      photo: initialValues?.photo ?? "",
      employeeID: initialValues?.employeeID ?? "",
      firstName: initialValues?.firstName ?? "",
      middleName: initialValues?.middleName ?? "",
      lastName: initialValues?.lastName ?? "",
      fatherHusbandName: initialValues?.fatherHusbandName ?? "",
      gender: initialValues?.gender ?? undefined,
      birthDate: initialValues?.birthDate ?? "",
      bloodGroup: initialValues?.bloodGroup ?? undefined,
      nationality: initialValues?.nationality ?? "",
      maritalStatus: initialValues?.maritalStatus ?? undefined,
      caste: initialValues?.caste ?? "",
      identificationMark: initialValues?.identificationMark ?? "",
    };
  }, [initialValues]);

  const personalInformationTabConfig = useMemo(
    () =>
      normalizePersonalInformationConfig(
        (formStructure?.personalInformation as
          | PersonalInformationFieldsConfig
          | PersonalInformationTabConfig
          | undefined) ?? undefined,
      ),
    [formStructure],
  );

  const dynamicPersonalInformationSchema = useMemo(
    () => createPersonalInformationSchema(personalInformationTabConfig),
    [personalInformationTabConfig],
  );

  const requiredDefaults: Partial<
    Record<PersonalInformationFieldKey, boolean>
  > = {
    employeeID: true,
    firstName: true,
    gender: true,
    nationality: true,
    identificationMark: true,
  };

  const isRequired = (field: PersonalInformationFieldKey) =>
    personalInformationTabConfig.fields[field]?.required ??
    requiredDefaults[field] ??
    false;

  const isVisible = (field: PersonalInformationFieldKey) =>
    personalInformationTabConfig.fields[field]?.visible ?? true;

  const getLabel = (field: PersonalInformationFieldKey, fallback: string) =>
    personalInformationTabConfig.fields[field]?.label || fallback;

  const {
    register,
    watch,
    setValue,
    setError,
    trigger,
    formState: { errors },
    reset,
    clearErrors,
  } = useForm<ContractEmployeeBasicInfoData>({
    resolver: zodResolver(dynamicPersonalInformationSchema),
    defaultValues,
    mode: "onChange",
  });

  // Helper function to get error message safely
  const getErrorMessage = (error: unknown): string | undefined => {
    if (error && typeof error === "object" && "message" in error) {
      return (error as { message: string }).message;
    }
    return undefined;
  };

  const shouldShowConfigLoader = formStructureLoading || !formStructure;
  const showBasicInformationSection = [
    "employeeID",
    "firstName",
    "middleName",
    "lastName",
    "fatherHusbandName",
  ].some((field) => isVisible(field as PersonalInformationFieldKey));
  const showPersonalDetailsSection = [
    "gender",
    "birthDate",
    "bloodGroup",
    "caste",
    "nationality",
    "identificationMark",
  ].some((field) => isVisible(field as PersonalInformationFieldKey));
  const casteOptions = useMemo(() => {
    const organizations = organizationResponse?.fetchOrganization;
    if (!Array.isArray(organizations) || organizations.length === 0) return [];
    const caste = organizations[0]?.caste;
    if (!Array.isArray(caste)) return [];
    return caste
      .map((item: any) => ({
        value: item?.casteName || "",
        label: item?.casteName || "",
        tooltip: item?.casteDescription || item?.casteName || "",
      }))
      .filter((item: { value: string }) => Boolean(item.value));
  }, [organizationResponse]);

  useEffect(() => {
    if (!isOpen) return;
    reset(defaultValues);
    setSaveError(null);
    setShowErrors(false);
    clearErrors();
  }, [isOpen, reset, defaultValues, clearErrors]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading && !postLoading) onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, loading, postLoading]);

  const handleInputChange = async (
    field: keyof ContractEmployeeBasicInfoData,
    value: any,
  ) => {
    setValue(field as any, value, { shouldDirty: true, shouldTouch: true });
    await trigger(field as any);
  };

  const removePhoto = () => {
    setValue("photo" as any, "");
    setPhotoFileName("");
    photoRef.current = "";
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputElement = event.target as HTMLInputElement;
    const file = inputElement.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop() || "png";
    const code = watch("employeeID" as any) || watch("firstName" as any) || "employee";
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    const fileName = `${String(code).replace(/\s+/g, "_")}_photo_${ts}.${ext}`;
    const renamed = new File([file], fileName, { type: file.type });

    setPhotoUploading(true);

    uploadEmployeePhoto(renamed, fileName)
      .then((res: any) => {
        const serverPath = extractServerPath(res);
        if (res?.success && serverPath) {
          setPhotoFileName(file.name);
          photoRef.current = serverPath;
          setValue("photo" as any, serverPath);
          void trigger("photo" as any);
          return;
        }
        setValue("photo" as any, "");
        toast({ variant: "destructive", title: "Upload Error", description: res?.error || "Photo upload failed" });
      })
      .catch(() => {
        setValue("photo" as any, "");
        toast({ variant: "destructive", title: "Upload Error", description: "Photo upload failed" });
      })
      .finally(() => {
        setPhotoUploading(false);
        inputElement.value = "";
      });
  };

  const submitForm = async () => {
    if (shouldShowConfigLoader || photoUploading) return;
    setSaveError(null);
    setShowErrors(true);
    lastSaveSucceededRef.current = false;
    clearErrors();

    const frontendValid = await trigger();
    if (!frontendValid) return;

    const values = watch();

    setLoading(true);
    try {
      const payload = {
        tenant: tenantCode || "",
        action: "insert",
        id: null,
        event: "validate",
        ruleId: "contractEmployeeBasic",
        collectionName: "contract_employee",
        data: {
          tenantCode: tenantCode || "",
          organizationCode: tenantCode || "",
          ...values,
          bonus: [],
          assetAllocated: [],
          advances: [],
          accidentRegister: [],
          experience: [],
          educations: [],
          doNotConsiderWeekOff: [],
          disciplinaryAction: [],
          childrenAdmission: [],
          penalty: [],
          medicalCheckup: [],
          gratuityNominee: [],
          familyMember: [],
          uploadedDocuments: [],
          trainings: [],
          policeVerification: [],
          pfNominee: [],
          workOrder: [],
          wcPolicies: [],
          personalInformation: true,
          contactEmergencytab: false,
          employmentDetailstab: false,
          busDetailstab: false,
          bankDetailstab: false,
          documentsVerificationtab: false,
          uploadedDocumentstab: false,
          familyMemberstab: false,
          pfNomineestab: false,
          gratuityNomineestab: false,
          childrenAdmissionstab: false,
          educationstab: false,
          experiencestab: false,
          assetAllocationstab: false,
          wcPoliciestab: false,
          workOrderstab: false,
          medicalSafetytab: false,
          medicalCheckupstab: false,
          accidentRegisterstab: false,
          policeVerificationtab: false,
          actionsAndStatustab: false,
          defaultWeekOfftab: false,
          disciplinaryActiontab: false,
          bonustab: false,
          penaltytab: false,
          advancePaymenttab: false,
          createdBy: createdBy,
          createdOn: getCurrentISOString(),
        },
      };
      await postPersonalInformation(payload);
      if (!lastSaveSucceededRef.current) return;
      const ok = await onSubmit(values);
      if (ok) onClose();
    } catch (e: any) {
      const msg = e?.message || "Failed to submit. Please try again.";
      setSaveError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-5xl flex flex-col">
        <Card className="w-full max-h-[90vh] flex flex-col overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">
                {title}
              </CardTitle>
              <button
                onClick={onClose}
                disabled={loading || postLoading}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close popup"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
            {saveError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {saveError}
              </div>
            )}

            {shouldShowConfigLoader ? (
              <div className="py-12 text-center text-sm text-gray-600">
                Loading form configuration...
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitForm();
                }}
                className="space-y-6"
              >
                {isVisible("photo") && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-800">
                      {getLabel("photo", "Profile Photo")}
                    </h3>
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg border border-gray-200 p-2 flex justify-center min-h-[120px] w-[120px] relative overflow-hidden flex-shrink-0">
                        <PreviewOfEmp path={watch("photo" as any) || ""} />
                        {watch("photo" as any) && (
                          <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className={`h-9 border border-gray-300 rounded-md flex items-center gap-2 px-3 ${photoUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
                          <Upload className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {photoUploading ? "Uploading..." : photoFileName || "Upload photo"}
                          </span>
                          <input type="file" className="hidden" accept="image/*" disabled={photoUploading} onChange={handlePhotoChange} />
                        </label>
                        {showErrors && getErrorMessage(errors.photo) && (
                          <p className="text-xs text-red-600">{getErrorMessage(errors.photo)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {showBasicInformationSection && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {isVisible("employeeID") && (
                        <div className="space-y-2">
                          <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                            {getLabel("employeeID", "Employee ID")}{" "}
                            {isRequired("employeeID") && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>
                          <Input
                            {...register("employeeID")}
                            placeholder="e.g., 10001"
                            className="h-9 border-gray-300 px-3 py-1.5 text-sm"
                          />
                          {showErrors && getErrorMessage(errors.employeeID) && (
                            <div className="text-xs text-red-600">
                              {getErrorMessage(errors.employeeID)}
                            </div>
                          )}
                        </div>
                      )}
                      {isVisible("firstName") && (
                        <div className="space-y-2">
                          <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                            {getLabel("firstName", "First Name")}{" "}
                            {isRequired("firstName") && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>
                          <Input
                            {...register("firstName")}
                            placeholder="e.g., Satyanarayana"
                            className="h-9 border-gray-300 px-3 py-1.5 text-sm"
                          />
                          {showErrors && getErrorMessage(errors.firstName) && (
                            <div className="text-xs text-red-600">
                              {getErrorMessage(errors.firstName)}
                            </div>
                          )}
                        </div>
                      )}
                      {isVisible("middleName") && (
                        <div className="space-y-2">
                          <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                            {getLabel("middleName", "Middle Name")}
                          </Label>
                          <Input
                            {...register("middleName")}
                            placeholder="e.g., (optional)"
                            className="h-9 border-gray-300 px-3 py-1.5 text-sm"
                          />
                          {showErrors && getErrorMessage(errors.middleName) && (
                            <div className="text-xs text-red-600">
                              {getErrorMessage(errors.middleName)}
                            </div>
                          )}
                        </div>
                      )}
                      {isVisible("lastName") && (
                        <div className="space-y-2">
                          <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                            {getLabel("lastName", "Last Name")}
                          </Label>
                          <Input
                            {...register("lastName")}
                            placeholder="e.g., Bondugula"
                            className="h-9 border-gray-300 px-3 py-1.5 text-sm"
                          />
                          {showErrors && getErrorMessage(errors.lastName) && (
                            <div className="text-xs text-red-600">
                              {getErrorMessage(errors.lastName)}
                            </div>
                          )}
                        </div>
                      )}
                      {isVisible("fatherHusbandName") && (
                        <div className="space-y-2 md:col-span-2">
                          <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                            {getLabel(
                              "fatherHusbandName",
                              "Father / Husband Name",
                            )}
                          </Label>
                          <Input
                            {...register("fatherHusbandName")}
                            placeholder="e.g., (optional)"
                            className="h-9 border-gray-300 px-3 py-1.5 text-sm"
                          />
                          {showErrors && getErrorMessage(errors.fatherHusbandName) && (
                            <div className="text-xs text-red-600">
                              {getErrorMessage(errors.fatherHusbandName)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {showPersonalDetailsSection && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Personal Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {isVisible("gender") && (
                        <div className="space-y-2">
                          <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                            {getLabel("gender", "Gender")}{" "}
                            {isRequired("gender") && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>
                          <select
                            value={watch("gender") || ""}
                            onChange={(e) =>
                              void handleInputChange(
                                "gender",
                                (e.target.value || undefined) as any,
                              )
                            }
                            className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                            <option value="Prefer not to say">
                              Prefer not to say
                            </option>
                          </select>
                          {showErrors && getErrorMessage(errors.gender) && (
                            <div className="text-xs text-red-600">
                              {getErrorMessage(errors.gender)}
                            </div>
                          )}
                        </div>
                      )}

                      {isVisible("birthDate") && (
                        <div className="space-y-2">
                          <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                            {getLabel("birthDate", "Date of Birth")}{" "}
                            {isRequired("birthDate") && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>
                          <Input
                            {...register("birthDate")}
                            type="date"
                            className="h-9 border-gray-300 px-3 py-1.5 text-sm"
                            max={getCurrentISODate()}
                          />
                          {showErrors && getErrorMessage(errors.birthDate) && (
                            <div className="text-xs text-red-600">
                              {getErrorMessage(errors.birthDate)}
                            </div>
                          )}
                        </div>
                      )}

                      {isVisible("bloodGroup") && (
                        <div className="space-y-2">
                          <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                            {getLabel("bloodGroup", "Blood Group")}{" "}
                            {isRequired("bloodGroup") && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>
                          <select
                            value={watch("bloodGroup") || ""}
                            onChange={(e) =>
                              void handleInputChange(
                                "bloodGroup",
                                (e.target.value || undefined) as any,
                              )
                            }
                            className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
                          >
                            <option value="">Select</option>
                            {[
                              "A+",
                              "A-",
                              "B+",
                              "B-",
                              "AB+",
                              "AB-",
                              "O+",
                              "O-",
                            ].map((bg) => (
                              <option key={bg} value={bg}>
                                {bg}
                              </option>
                            ))}
                          </select>
                          {showErrors && getErrorMessage(errors.bloodGroup) && (
                            <div className="text-xs text-red-600">
                              {getErrorMessage(errors.bloodGroup)}
                            </div>
                          )}
                        </div>
                      )}

                      {isVisible("nationality") && (
                        <div className="space-y-2">
                          <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                            {getLabel("nationality", "Nationality")}{" "}
                            {isRequired("nationality") && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>
                          <Input
                            {...register("nationality")}
                            placeholder="e.g., Indian"
                            className="h-9 border-gray-300 px-3 py-1.5 text-sm"
                          />
                          {showErrors && getErrorMessage(errors.nationality) && (
                            <div className="text-xs text-red-600">
                              {getErrorMessage(errors.nationality)}
                            </div>
                          )}
                        </div>
                      )}

                      {isVisible("caste") && (
                        <SingleSelectField
                          id="caste"
                          label={getLabel("caste", "Caste")}
                          required={isRequired("caste")}
                          placeholder="Search Caste"
                          disabled={loading || postLoading}
                          value={watch("caste") || ""}
                          onChange={(value) => {
                            void handleInputChange("caste", value);
                          }}
                          options={casteOptions}
                          showOnlyValueInTrigger
                          allowOnlyProvidedOptions
                          errorMessage={
                            showErrors ? getErrorMessage(errors.caste) : undefined
                          }
                        />
                      )}

                      {isVisible("identificationMark") && (
                        <div className="space-y-2 md:col-span-2">
                          <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                            {getLabel(
                              "identificationMark",
                              "Identification Mark",
                            )}{" "}
                            {isRequired("identificationMark") && (
                              <span className="text-red-500">*</span>
                            )}
                          </Label>
                          <Input
                            {...register("identificationMark")}
                            placeholder="e.g., A mole on left palm"
                            className="h-9 border-gray-300 px-3 py-1.5 text-sm"
                          />
                          {showErrors && getErrorMessage(errors.identificationMark) && (
                            <div className="text-xs text-red-600">
                              {getErrorMessage(errors.identificationMark)}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            )}
          </CardContent>

          <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
            <ActionButtons
              layout="end"
              secondaryLabel="Cancel"
              onSecondary={onClose}
              primaryLabel="Save"
              onPrimary={submitForm}
              primaryLoading={loading || postLoading || photoUploading}
              className="w-full"
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}