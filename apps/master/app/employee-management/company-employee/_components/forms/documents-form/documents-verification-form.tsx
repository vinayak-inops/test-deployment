"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { FileText } from "lucide-react";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useAuditPayload } from "@/hooks/api/useAuditPayload";
import { SuccessPopup } from "@/components/success-popup";
import { useCollectionFormStructure } from "../../../../../../hooks/form-functions/useCollectionFormStructure";
import DocumentUploadField from "../../../../../../components/fields/document-upload-field";
import { FormActionsFooter } from "../../../../../../components/footer/form-actions-footer";
import { GradientFormHeader } from "../../../../../../components/header/form-header";
import { SubFormTitle } from "../../../../../../components/header/sub-form-title";
import {
  createDocumentsVerificationSchema,
  normalizeDocumentsVerificationConfig,
  type DocumentsVerificationConfig,
  type DocumentsVerificationData,
  type DocumentsLabourCardFieldKey,
  type DocumentsPassportFieldKey,
  type DocumentsRootFieldKey,
  type DocumentsWorkPermitFieldKey,
} from "../../schemas/documents-verification-schema";
import { toast } from "react-toastify";

interface DocumentsVerificationFormProps {
  employeeRecordId?: string | null;
  onNextTab?: () => void;
  onPreviousTab?: () => void;
  mode?: "add" | "edit" | "view";
  employeeSearchUrl?: string;
  employeeCollectionUrl?: string;
  onSubmit?: (data: any) => void;
}

export function DocumentsVerificationForm({
  employeeRecordId = null,
  onNextTab,
  onPreviousTab,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  onSubmit,
}: DocumentsVerificationFormProps) {
  const INPUT_CLASS =
    "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900";
  const SECTION_CARD_CLASS =
    "rounded-lg border border-gray-200 bg-gray-50/30 p-4 space-y-3";

  const defaultValues: DocumentsVerificationData = {
    passport: { passportNumber: "", passportExpiryDate: "", passportPath: "" },
    insuranceNumber: "",
    mediclaimPolicyNumber: "",
    accidentPolicyNumber: "",
    workPermit: {
      workpermitNumber: "",
      workpermitExpiryDate: "",
      workPermitPath: "",
    },
    labourCard: {
      labourCardNumber: "",
      labourCardExpiryDate: "",
      labourCardPath: "",
    },
  };

  const [employeeData, setEmployeeData] = useState<any>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const hydratedForRecordRef = useRef<string | null>(null);
  const tenantCode = useGetTenantCode();
  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  });

  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const resolvedEmployeeRecordId = employeeRecordId || id;
  const currentMode =
    modeParam === "add" || modeParam === "edit" || modeParam === "view"
      ? modeParam
      : mode;
  const isViewMode = currentMode === "view";
  const targetCollectionName =
    employeeSearchUrl !== "contract_employee/search" ? "draft/contract_employee" : "contract_employee";
  const documentsVerificationConfig = useMemo(
    () =>
      normalizeDocumentsVerificationConfig(
        formStructure?.documentsVerification as
          | DocumentsVerificationConfig
          | undefined
      ),
    [formStructure]
  );
  const documentsVerificationSchema = useMemo(
    () => createDocumentsVerificationSchema(documentsVerificationConfig),
    [documentsVerificationConfig]
  );
  const shouldShowConfigLoader = formStructureLoading || !formStructure;

  type DocumentsFieldPath =
    | "insuranceNumber"
    | "mediclaimPolicyNumber"
    | "accidentPolicyNumber"
    | "passport.passportNumber"
    | "passport.passportExpiryDate"
    | "passport.passportPath"
    | "workPermit.workpermitNumber"
    | "workPermit.workpermitExpiryDate"
    | "workPermit.workPermitPath"
    | "labourCard.labourCardNumber"
    | "labourCard.labourCardExpiryDate"
    | "labourCard.labourCardPath";

  const getRootConfig = (field: DocumentsRootFieldKey) =>
    documentsVerificationConfig.fields[field];
  const getPassportConfig = (field: DocumentsPassportFieldKey) =>
    documentsVerificationConfig.passport.fields[field];
  const getWorkPermitConfig = (field: DocumentsWorkPermitFieldKey) =>
    documentsVerificationConfig.workPermit.fields[field];
  const getLabourCardConfig = (field: DocumentsLabourCardFieldKey) =>
    documentsVerificationConfig.labourCard.fields[field];

  const isRequired = useMemo(() => {
    return (fieldPath: DocumentsFieldPath): boolean => {
      switch (fieldPath) {
        case "insuranceNumber":
          return Boolean(getRootConfig("insuranceNumber")?.required);
        case "mediclaimPolicyNumber":
          return Boolean(getRootConfig("mediclaimPolicyNumber")?.required);
        case "accidentPolicyNumber":
          return Boolean(getRootConfig("accidentPolicyNumber")?.required);
        case "passport.passportNumber":
          return Boolean(getPassportConfig("passportNumber")?.required);
        case "passport.passportExpiryDate":
          return Boolean(getPassportConfig("passportExpiryDate")?.required);
        case "passport.passportPath":
          return Boolean(getPassportConfig("passportPath")?.required);
        case "workPermit.workpermitNumber":
          return Boolean(getWorkPermitConfig("workpermitNumber")?.required);
        case "workPermit.workpermitExpiryDate":
          return Boolean(getWorkPermitConfig("workpermitExpiryDate")?.required);
        case "workPermit.workPermitPath":
          return Boolean(getWorkPermitConfig("workPermitPath")?.required);
        case "labourCard.labourCardNumber":
          return Boolean(getLabourCardConfig("labourCardNumber")?.required);
        case "labourCard.labourCardExpiryDate":
          return Boolean(getLabourCardConfig("labourCardExpiryDate")?.required);
        case "labourCard.labourCardPath":
          return Boolean(getLabourCardConfig("labourCardPath")?.required);
        default:
          return false;
      }
    };
  }, [documentsVerificationConfig]);

  const isVisible = useMemo(() => {
    return (fieldPath: DocumentsFieldPath): boolean => {
      switch (fieldPath) {
        case "insuranceNumber":
          return getRootConfig("insuranceNumber")?.visible ?? true;
        case "mediclaimPolicyNumber":
          return getRootConfig("mediclaimPolicyNumber")?.visible ?? true;
        case "accidentPolicyNumber":
          return getRootConfig("accidentPolicyNumber")?.visible ?? true;
        case "passport.passportNumber":
          return getPassportConfig("passportNumber")?.visible ?? true;
        case "passport.passportExpiryDate":
          return getPassportConfig("passportExpiryDate")?.visible ?? true;
        case "passport.passportPath":
          return getPassportConfig("passportPath")?.visible ?? true;
        case "workPermit.workpermitNumber":
          return getWorkPermitConfig("workpermitNumber")?.visible ?? true;
        case "workPermit.workpermitExpiryDate":
          return getWorkPermitConfig("workpermitExpiryDate")?.visible ?? true;
        case "workPermit.workPermitPath":
          return getWorkPermitConfig("workPermitPath")?.visible ?? true;
        case "labourCard.labourCardNumber":
          return getLabourCardConfig("labourCardNumber")?.visible ?? true;
        case "labourCard.labourCardExpiryDate":
          return getLabourCardConfig("labourCardExpiryDate")?.visible ?? true;
        case "labourCard.labourCardPath":
          return getLabourCardConfig("labourCardPath")?.visible ?? true;
      }
    };
  }, [documentsVerificationConfig]);

  const getLabel = useMemo(() => {
    return (fieldPath: DocumentsFieldPath, fallback: string): string => {
      switch (fieldPath) {
        case "insuranceNumber":
          return getRootConfig("insuranceNumber")?.label || fallback;
        case "mediclaimPolicyNumber":
          return getRootConfig("mediclaimPolicyNumber")?.label || fallback;
        case "accidentPolicyNumber":
          return getRootConfig("accidentPolicyNumber")?.label || fallback;
        case "passport.passportNumber":
          return getPassportConfig("passportNumber")?.label || fallback;
        case "passport.passportExpiryDate":
          return getPassportConfig("passportExpiryDate")?.label || fallback;
        case "passport.passportPath":
          return getPassportConfig("passportPath")?.label || fallback;
        case "workPermit.workpermitNumber":
          return getWorkPermitConfig("workpermitNumber")?.label || fallback;
        case "workPermit.workpermitExpiryDate":
          return getWorkPermitConfig("workpermitExpiryDate")?.label || fallback;
        case "workPermit.workPermitPath":
          return getWorkPermitConfig("workPermitPath")?.label || fallback;
        case "labourCard.labourCardNumber":
          return getLabourCardConfig("labourCardNumber")?.label || fallback;
        case "labourCard.labourCardExpiryDate":
          return getLabourCardConfig("labourCardExpiryDate")?.label || fallback;
        case "labourCard.labourCardPath":
          return getLabourCardConfig("labourCardPath")?.label || fallback;
      }
    };
  }, [documentsVerificationConfig]);

  const showPassportSection =
    isVisible("passport.passportNumber") ||
    isVisible("passport.passportExpiryDate") ||
    isVisible("passport.passportPath");
  const showWorkPermitSection =
    isVisible("workPermit.workpermitNumber") ||
    isVisible("workPermit.workpermitExpiryDate") ||
    isVisible("workPermit.workPermitPath");
  const showLabourCardSection =
    isVisible("labourCard.labourCardNumber") ||
    isVisible("labourCard.labourCardExpiryDate") ||
    isVisible("labourCard.labourCardPath");
  const showInsuranceSection =
    isVisible("insuranceNumber") ||
    isVisible("mediclaimPolicyNumber") ||
    isVisible("accidentPolicyNumber");

  const {
    register,
    control,
    formState: { errors, isValid },
    watch,
    reset,
    setError,
    trigger,
    clearErrors,
  } = useForm<DocumentsVerificationData>({
    resolver: zodResolver(documentsVerificationSchema),
    defaultValues,
    mode: "onChange",
  });
  const auditEntityId = String(
    resolvedEmployeeRecordId ||
      employeeData?._id ||
      employeeData?.employeeID ||
      employeeData?.employeeId ||
      "",
  );
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  });
  const { post: postDocumentsVerification, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status;
      if (!status) {
        setShowErrors(true);
        const responseData =
          response?.data && typeof response.data === "object"
            ? response.data
            : response;

        const applyFieldError = (fieldName: string, message: string) => {
          const normalized = fieldName.trim();
          if (!normalized || !message.trim()) return;
          setError(normalized as any, {
            type: "server",
            message,
          });
        };

        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return;

            if (typeof message === "string") {
              applyFieldError(fieldName, message);
              return;
            }

            if (message && typeof message === "object") {
              Object.entries(message as Record<string, unknown>).forEach(([childKey, childValue]) => {
                if (typeof childValue !== "string") return;
                applyFieldError(`${fieldName}.${childKey}`, childValue);
              });
            }
          });
        }
        return;
      }

      toast.success("Employee data saved successfully!");
      void fetchEmployee();
    },
    onError: (error) => {
      console.error("Error saving documents verification:", error);
    },
  });

  const { refetch: fetchEmployee } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [{ field: "_id", value: resolvedEmployeeRecordId, operator: "eq" }],
    onSuccess: (data) => {
      if (Array.isArray(data) && data[0] && data[0].isDeleted !== true) {
        setEmployeeData(data[0]);
      }
    },
    onError: (error) => {
      console.error("Error fetching employee data:", error);
    },
    dependencies: [resolvedEmployeeRecordId, employeeSearchUrl],
  });

  useEffect(() => {
    if (!resolvedEmployeeRecordId || currentMode === "add") return;
    void fetchEmployee();
  }, [resolvedEmployeeRecordId, currentMode, employeeSearchUrl]);

  useEffect(() => {
    hydratedForRecordRef.current = null;
  }, [resolvedEmployeeRecordId]);

  useEffect(() => {
    if (!employeeData || !resolvedEmployeeRecordId) return;
    if (hydratedForRecordRef.current === resolvedEmployeeRecordId) return;

    reset({
      passport: {
        passportNumber: employeeData?.passport?.passportNumber || "",
        passportExpiryDate: employeeData?.passport?.passportExpiryDate || "",
        passportPath: employeeData?.passport?.passportPath || "",
      },
      insuranceNumber: employeeData?.insuranceNumber || "",
      mediclaimPolicyNumber: employeeData?.mediclaimPolicyNumber || "",
      accidentPolicyNumber: employeeData?.accidentPolicyNumber || "",
      workPermit: {
        workpermitNumber: employeeData?.workPermit?.workpermitNumber || "",
        workpermitExpiryDate:
          employeeData?.workPermit?.workpermitExpiryDate || "",
        workPermitPath: employeeData?.workPermit?.workPermitPath || "",
      },
      labourCard: {
        labourCardNumber: employeeData?.labourCard?.labourCardNumber || "",
        labourCardExpiryDate:
          employeeData?.labourCard?.labourCardExpiryDate || "",
        labourCardPath: employeeData?.labourCard?.labourCardPath || "",
      },
    });
    hydratedForRecordRef.current = resolvedEmployeeRecordId;
    void trigger();
  }, [employeeData, resolvedEmployeeRecordId, reset, trigger]);

  const handleSaveAndContinue = async () => {
    if (shouldShowConfigLoader) return;
    setShowErrors(true);
    clearErrors();
    const formValues = watch();
    const valid = await trigger();
    if (!valid) return;

    const isEditMode = currentMode === "edit" && Boolean(resolvedEmployeeRecordId);
    const shouldSetDocumentsVerificationTab =
      employeeSearchUrl === "draft/contract_employee/search";
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: resolvedEmployeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      roleId: "",
      data: {
        ...formValues,
        ...(shouldSetDocumentsVerificationTab ? { documentsVerificationtab: true } : {}),
      },
      audit: auditPayload,
    };

    postDocumentsVerification(payload);
  };

  const handleSave = async () => {
    await handleSaveAndContinue();
  };

  const handleContinue = async () => {
    setShowErrors(true);
    const valid = await trigger();
    if (!valid) return;
    if (onNextTab) onNextTab();
  };

  return (
      <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
        {postLoading && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Saving permissions...</span>
          </div>
        </div>
      )}
        <GradientFormHeader
          icon={FileText}
          title="Documents & Verification"
          description="Identity documents, work permits, and verification details"
        />

        <CardContent className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
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

          {showPassportSection && (
          <div className={SECTION_CARD_CLASS}>
            <SubFormTitle title="Passport Details" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {isVisible("passport.passportNumber") && (
              <div className="space-y-2">
                <Label
                  htmlFor="passportNumber"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("passport.passportNumber", "Passport Number")}
                  {isRequired("passport.passportNumber") && (
                    <span className="text-red-500"> *</span>
                  )}
                </Label>
                <Input
                  id="passportNumber"
                  {...register("passport.passportNumber")}
                  disabled={isViewMode}
                  className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  placeholder="Enter passport number"
                />
                {errors.passport?.passportNumber?.message && (
                  <p className="text-xs text-red-600">
                    {errors.passport.passportNumber.message}
                  </p>
                )}
              </div>
              )}
              {isVisible("passport.passportExpiryDate") && (
              <div className="space-y-2">
                <Label
                  htmlFor="passportExpiryDate"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("passport.passportExpiryDate", "Passport Expiry Date")}
                  {isRequired("passport.passportExpiryDate") && (
                    <span className="text-red-500"> *</span>
                  )}
                </Label>
                <Input
                  id="passportExpiryDate"
                  type="date"
                  {...register("passport.passportExpiryDate")}
                  disabled={isViewMode}
                  className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                />
                {errors.passport?.passportExpiryDate?.message && (
                  <p className="text-xs text-red-600">
                    {errors.passport.passportExpiryDate.message}
                  </p>
                )}
              </div>
              )}
              {isVisible("passport.passportPath") && (
              <Controller
                control={control}
                name="passport.passportPath"
                render={({ field }) => (
                  <DocumentUploadField
                    id="passportPath"
                    label={`${getLabel("passport.passportPath", "Passport Document")}${
                      isRequired("passport.passportPath") ? " *" : ""
                    }`}
                    isViewMode={isViewMode}
                    employeeID={
                      employeeData?.employeeID || employeeData?.employeeId
                    }
                    value={{
                      documentPath: field.value || "",
                      documentType: "",
                    }}
                    onChange={(doc) => {
                      field.onChange(doc.documentPath || "");
                      void trigger("passport.passportPath");
                    }}
                    uploadPrefix="passport"
                    uploadButtonText="Upload Passport Document"
                    successTitle="Passport Document"
                    successSubtitle="Document uploaded successfully"
                    wrapperClassName="space-y-2"
                    labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                  />
                )}
              />
              )}
            </div>
          </div>
          )}

          {showWorkPermitSection && (
          <div className={SECTION_CARD_CLASS}>
            <SubFormTitle title="Work Permit" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {isVisible("workPermit.workpermitNumber") && (
              <div className="space-y-2">
                <Label
                  htmlFor="workpermitNumber"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("workPermit.workpermitNumber", "Work Permit Number")}
                  {isRequired("workPermit.workpermitNumber") && (
                    <span className="text-red-500"> *</span>
                  )}
                </Label>
                <Input
                  id="workpermitNumber"
                  {...register("workPermit.workpermitNumber")}
                  disabled={isViewMode}
                  className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  placeholder="Enter work permit number"
                />
                {errors.workPermit?.workpermitNumber?.message && (
                  <p className="text-xs text-red-600">
                    {errors.workPermit.workpermitNumber.message}
                  </p>
                )}
              </div>
              )}
              {isVisible("workPermit.workpermitExpiryDate") && (
              <div className="space-y-2">
                <Label
                  htmlFor="workpermitExpiryDate"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("workPermit.workpermitExpiryDate", "Work Permit Expiry Date")}
                  {isRequired("workPermit.workpermitExpiryDate") && (
                    <span className="text-red-500"> *</span>
                  )}
                </Label>
                <Input
                  id="workpermitExpiryDate"
                  type="date"
                  {...register("workPermit.workpermitExpiryDate")}
                  disabled={isViewMode}
                  className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                />
                {errors.workPermit?.workpermitExpiryDate?.message && (
                  <p className="text-xs text-red-600">
                    {errors.workPermit.workpermitExpiryDate.message}
                  </p>
                )}
              </div>
              )}
              {isVisible("workPermit.workPermitPath") && (
              <Controller
                control={control}
                name="workPermit.workPermitPath"
                render={({ field }) => (
                  <DocumentUploadField
                    id="workPermitPath"
                    label={`${getLabel("workPermit.workPermitPath", "Work Permit Document")}${
                      isRequired("workPermit.workPermitPath") ? " *" : ""
                    }`}
                    isViewMode={isViewMode}
                    employeeID={
                      employeeData?.employeeID || employeeData?.employeeId
                    }
                    value={{
                      documentPath: field.value || "",
                      documentType: "",
                    }}
                    onChange={(doc) => {
                      field.onChange(doc.documentPath || "");
                      void trigger("workPermit.workPermitPath");
                    }}
                    uploadPrefix="workpermit"
                    uploadButtonText="Upload Work Permit Document"
                    successTitle="Work Permit Document"
                    successSubtitle="Document uploaded successfully"
                    wrapperClassName="space-y-2"
                    labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                  />
                )}
              />
              )}
            </div>
          </div>
          )}

          {showLabourCardSection && (
          <div className={SECTION_CARD_CLASS}>
            <SubFormTitle title="Labour Card" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {isVisible("labourCard.labourCardNumber") && (
              <div className="space-y-2">
                <Label
                  htmlFor="labourCardNumber"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("labourCard.labourCardNumber", "Labour Card Number")}
                  {isRequired("labourCard.labourCardNumber") && (
                    <span className="text-red-500"> *</span>
                  )}
                </Label>
                <Input
                  id="labourCardNumber"
                  {...register("labourCard.labourCardNumber")}
                  disabled={isViewMode}
                  className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  placeholder="Enter labour card number"
                />
                {errors.labourCard?.labourCardNumber?.message && (
                  <p className="text-xs text-red-600">
                    {errors.labourCard.labourCardNumber.message}
                  </p>
                )}
              </div>
              )}
              {isVisible("labourCard.labourCardExpiryDate") && (
              <div className="space-y-2">
                <Label
                  htmlFor="labourCardExpiryDate"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("labourCard.labourCardExpiryDate", "Labour Card Expiry Date")}
                  {isRequired("labourCard.labourCardExpiryDate") && (
                    <span className="text-red-500"> *</span>
                  )}
                </Label>
                <Input
                  id="labourCardExpiryDate"
                  type="date"
                  {...register("labourCard.labourCardExpiryDate")}
                  disabled={isViewMode}
                  className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                />
                {errors.labourCard?.labourCardExpiryDate?.message && (
                  <p className="text-xs text-red-600">
                    {errors.labourCard.labourCardExpiryDate.message}
                  </p>
                )}
              </div>
              )}
              {isVisible("labourCard.labourCardPath") && (
              <Controller
                control={control}
                name="labourCard.labourCardPath"
                render={({ field }) => (
                  <DocumentUploadField
                    id="labourCardPath"
                    label={`${getLabel("labourCard.labourCardPath", "Labour Card Document")}${
                      isRequired("labourCard.labourCardPath") ? " *" : ""
                    }`}
                    isViewMode={isViewMode}
                    employeeID={
                      employeeData?.employeeID || employeeData?.employeeId
                    }
                    value={{
                      documentPath: field.value || "",
                      documentType: "",
                    }}
                    onChange={(doc) => {
                      field.onChange(doc.documentPath || "");
                      void trigger("labourCard.labourCardPath");
                    }}
                    uploadPrefix="labourcard"
                    uploadButtonText="Upload Labour Card Document"
                    successTitle="Labour Card Document"
                    successSubtitle="Document uploaded successfully"
                    wrapperClassName="space-y-2"
                    labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                  />
                )}
              />
              )}
            </div>
          </div>
          )}

          {showInsuranceSection && (
          <div className={SECTION_CARD_CLASS}>
            <SubFormTitle title="Insurance Details" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {isVisible("insuranceNumber") && (
              <div className="space-y-2">
                <Label
                  htmlFor="insuranceNumber"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("insuranceNumber", "Insurance Number")}
                  {isRequired("insuranceNumber") && (
                    <span className="text-red-500"> *</span>
                  )}
                </Label>
                <Input
                  id="insuranceNumber"
                  {...register("insuranceNumber")}
                  disabled={isViewMode}
                  className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  placeholder="Enter insurance number"
                />
                {errors.insuranceNumber?.message && (
                  <p className="text-xs text-red-600">
                    {errors.insuranceNumber.message}
                  </p>
                )}
              </div>
              )}
              {isVisible("mediclaimPolicyNumber") && (
              <div className="space-y-2">
                <Label
                  htmlFor="mediclaimPolicyNumber"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("mediclaimPolicyNumber", "Mediclaim Policy Number")}
                  {isRequired("mediclaimPolicyNumber") && (
                    <span className="text-red-500"> *</span>
                  )}
                </Label>
                <Input
                  id="mediclaimPolicyNumber"
                  {...register("mediclaimPolicyNumber")}
                  disabled={isViewMode}
                  className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  placeholder="Enter mediclaim policy number"
                />
                {errors.mediclaimPolicyNumber?.message && (
                  <p className="text-xs text-red-600">
                    {errors.mediclaimPolicyNumber.message}
                  </p>
                )}
              </div>
              )}
              {isVisible("accidentPolicyNumber") && (
              <div className="space-y-2">
                <Label
                  htmlFor="accidentPolicyNumber"
                  className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                >
                  {getLabel("accidentPolicyNumber", "Accident Policy Number")}
                  {isRequired("accidentPolicyNumber") && (
                    <span className="text-red-500"> *</span>
                  )}
                </Label>
                <Input
                  id="accidentPolicyNumber"
                  {...register("accidentPolicyNumber")}
                  disabled={isViewMode}
                  className={`${INPUT_CLASS} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  placeholder="Enter accident policy number"
                />
                {errors.accidentPolicyNumber?.message && (
                  <p className="text-xs text-red-600">
                    {errors.accidentPolicyNumber.message}
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
          onPreviousTab={onPreviousTab}
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
