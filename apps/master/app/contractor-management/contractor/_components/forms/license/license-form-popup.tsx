"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Shield, X } from "lucide-react";
import { SubFormTitle } from "../../../../../../components/header/sub-form-title";
import {
  createLicenseSchema,
  normalizeLicenseConfig,
  type LicenseFieldsConfig,
  type LicenseRootConfig,
  EMPTY_LICENSE,
  type License,
} from "../../schemas/license-form-schema";
import { useDynamicSchemaConfig } from "../../hooks/useDynamicSchemaConfig";
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { toast } from "react-toastify";

interface LicenseFormPopupProps {
  open: boolean;
  onClose: () => void;
  /** null = Add mode, otherwise Edit mode with this license */
  initialLicense: License | null;
  onSubmit: (licenses: License[]) => void;
  onSaved?: () => void;
  mode?: "add" | "edit" | "view";
  employeeRecordId?: string | null;
  tenantCode?: string;
  employeeSearchUrl?: string;
  contractorCollectionUrl?: string;
  licenses: License[];
  editIndex: number | null;
  refetchLicenses?: () => Promise<void> | void;
}
type LicenseFormField =
  | "licenseNo"
  | "licenseFromDate"
  | "licenseToDate"
  | "workmen"
  | "issuedOn"
  | "natureOfWork";

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900";

export function LicenseFormPopup({
  open,
  onClose,
  initialLicense,
  mode = "add",
  employeeRecordId = null,
  tenantCode,
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  licenses,
  editIndex,
  refetchLicenses,
  onSubmit,
  onSaved,
}: LicenseFormPopupProps) {
  const { formStructure, loading: formStructureLoading } =
    useCollectionFormStructure({
      collectionName: "contractor_form_strcture",
    });

  const normalizedLicenseConfig = useMemo(
    () =>
      normalizeLicenseConfig(
        (formStructure?.license as
          | LicenseFieldsConfig
          | LicenseRootConfig
          | undefined) ?? undefined,
      ),
    [formStructure],
  );

  const licenseSchema = useMemo(
    () =>
      createLicenseSchema({
        tabRequired: normalizedLicenseConfig.tabRequired,
        meta: normalizedLicenseConfig.meta,
        fields: normalizedLicenseConfig.fields,
      }),
    [normalizedLicenseConfig],
  );

  const { isRequired, isVisible, getLabel } = useDynamicSchemaConfig({
    schema: licenseSchema,
    fieldConfig: {
      tabRequired: normalizedLicenseConfig.tabRequired,
      fields: normalizedLicenseConfig.fields,
    },
    emptyValues: EMPTY_LICENSE,
    defaultRequired: {
      licenseNo: true,
      licenseFromDate: true,
      licenseToDate: true,
      workmen: true,
      issuedOn: true,
      natureOfWork: true,
    },
  });
  const showLicenseInformation =
    isVisible("licenseNo") || isVisible("natureOfWork");
  const showValidityDates =
    isVisible("licenseFromDate") || isVisible("licenseToDate");
  const showWorkforceDetails = isVisible("workmen") || isVisible("issuedOn");
  const [formLicense, setFormLicense] = useState<License>({ ...EMPTY_LICENSE });
  const [popupShowErrors, setPopupShowErrors] = useState(false);
  const [serverErrors, setServerErrors] = useState<Partial<Record<LicenseFormField, string>>>({});
  const [pendingLicenses, setPendingLicenses] = useState<License[] | null>(null);

  useEffect(() => {
    if (open) {
      setFormLicense(
        initialLicense ? { ...initialLicense } : { ...EMPTY_LICENSE },
      );
      setPopupShowErrors(false);
      setServerErrors({});
      setPendingLicenses(null);
    }
  }, [open, initialLicense]);

  const { post: postContractor, loading: postLoading } = usePostRequest<any>({
    url: contractorCollectionUrl,
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status;
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object"
            ? response.data
            : response;

        const normalizeServerField = (fieldName: string): LicenseFormField | null => {
          const fieldMap: Record<string, LicenseFormField> = {
            licenseNo: "licenseNo",
            licenseFromDate: "licenseFromDate",
            licenseToDate: "licenseToDate",
            workmen: "workmen",
            issuedOn: "issuedOn",
            natureOfWork: "natureOfWork",
          };

          if (fieldMap[fieldName]) return fieldMap[fieldName];
          if (fieldName.startsWith("licenses.")) {
            const key = fieldName.split(".").pop() ?? "";
            return fieldMap[key] ?? null;
          }
          return null;
        };

        const nextServerErrors: Partial<Record<LicenseFormField, string>> = {};
        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return;
            if (typeof message !== "string" || !message.trim()) return;
            const normalizedField = normalizeServerField(fieldName);
            if (!normalizedField) return;
            nextServerErrors[normalizedField] = message;
          });
        }

        setServerErrors(nextServerErrors);
        setPopupShowErrors(true);
        return;
      }

      toast.success("Contractor data saved successfully!");
      if (pendingLicenses) {
        onSubmit(pendingLicenses);
      }
      setPendingLicenses(null);
      await refetchLicenses?.();
      onSaved?.();
      onClose();
    },
    onError: (error) => {
      console.error("Error saving contractor data:", error);
    },
  });

  const handleSubmit = () => {
    if (shouldShowConfigLoader || postLoading) return;
    const result = licenseSchema.safeParse(formLicense);
    if (!result.success) {
      setPopupShowErrors(true);
      return;
    }
    setServerErrors({});
    const normalizedLicense = {
      ...EMPTY_LICENSE,
      ...result.data,
    };
    const payloadLicense = {
      ...(initialLicense as Record<string, any> | null),
      ...normalizedLicense,
    };
    const parseId = (payloadLicense as Record<string, any>)?.parseID;
    const next =
      parseId
        ? licenses.map((license) =>
            (license as Record<string, any>)?.parseID === parseId
              ? (payloadLicense as License)
              : license,
          )
        : editIndex !== null
          ? licenses.map((license, index) =>
              index === editIndex ? (payloadLicense as License) : license,
            )
          : [...licenses, (payloadLicense as License)];
    const isEditMode = mode === "edit" && Boolean(employeeRecordId);
    const shouldSetLicenseTab = employeeSearchUrl === "draft/contractor/search";
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      event: "validate",
      ruleId: "contractorLicense",
      collectionName: "contractor",
      data: {
        licenses: [payloadLicense],
        ...(shouldSetLicenseTab ? { licensetab: true } : {}),
      },
    };
    setPendingLicenses(next);
    postContractor?.(payload);
  };

  const handleClose = () => {
    setPopupShowErrors(false);
    setServerErrors({});
    setPendingLicenses(null);
    onClose();
  };

  const formValidation = licenseSchema.safeParse(formLicense);
  const formErrors = formValidation.success
    ? {}
    : formValidation.error.flatten().fieldErrors;
  const getFieldError = (field: LicenseFormField): string | undefined => {
    const clientError = formErrors[field]?.[0];
    if (typeof clientError === "string" && clientError.trim()) return clientError;
    const serverError = serverErrors[field];
    return typeof serverError === "string" && serverError.trim() ? serverError : undefined;
  };
  const shouldShowConfigLoader = formStructureLoading || !formStructure;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Shield className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialLicense !== null ? "Edit License" : "Add License"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Enter license and permit details.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          {shouldShowConfigLoader ? (
            <div className="py-12 text-center text-sm text-gray-600">
              Loading form configuration...
            </div>
          ) : (
            <>
              {showLicenseInformation && (
                <div className="space-y-3">
                  <SubFormTitle title="License Information" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isVisible("licenseNo") && (
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          {getLabel("licenseNo", "License Number")}{" "}
                          {isRequired("licenseNo") && (
                            <span className="text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          value={formLicense.licenseNo}
                          onChange={(e) =>
                            setFormLicense((p) => ({
                              ...p,
                              licenseNo: e.target.value,
                            }))
                          }
                          className={`${INPUT_CLASS} ${popupShowErrors && getFieldError("licenseNo") ? "border-red-500" : ""}`}
                          placeholder="Enter license number"
                        />
                        {popupShowErrors && getFieldError("licenseNo") && (
                          <p className="text-red-500 text-xs" role="alert">
                            {getFieldError("licenseNo")}
                          </p>
                        )}
                      </div>
                    )}
                    {isVisible("natureOfWork") && (
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          {getLabel("natureOfWork", "Nature of Work")}{" "}
                          {isRequired("natureOfWork") && (
                            <span className="text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          value={formLicense.natureOfWork}
                          onChange={(e) =>
                            setFormLicense((p) => ({
                              ...p,
                              natureOfWork: e.target.value,
                            }))
                          }
                          className={`${INPUT_CLASS} ${popupShowErrors && getFieldError("natureOfWork") ? "border-red-500" : ""}`}
                          placeholder="Enter nature of work"
                        />
                        {popupShowErrors && getFieldError("natureOfWork") && (
                          <p className="text-red-500 text-xs" role="alert">
                            {getFieldError("natureOfWork")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showLicenseInformation &&
                (showValidityDates || showWorkforceDetails) && <Separator />}

              {showValidityDates && (
                <div className="space-y-3">
                  <SubFormTitle title="Validity Dates" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isVisible("licenseFromDate") && (
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          {getLabel("licenseFromDate", "License From Date")}{" "}
                          {isRequired("licenseFromDate") && (
                            <span className="text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          type="date"
                          value={formLicense.licenseFromDate}
                          onChange={(e) =>
                            setFormLicense((p) => ({
                              ...p,
                              licenseFromDate: e.target.value,
                            }))
                          }
                          className={`${INPUT_CLASS} ${popupShowErrors && getFieldError("licenseFromDate") ? "border-red-500" : ""}`}
                        />
                        {popupShowErrors && getFieldError("licenseFromDate") && (
                          <p className="text-red-500 text-xs" role="alert">
                            {getFieldError("licenseFromDate")}
                          </p>
                        )}
                      </div>
                    )}
                    {isVisible("licenseToDate") && (
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          {getLabel("licenseToDate", "License To Date")}{" "}
                          {isRequired("licenseToDate") && (
                            <span className="text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          type="date"
                          value={formLicense.licenseToDate}
                          min={formLicense.licenseFromDate || undefined}
                          onChange={(e) =>
                            setFormLicense((p) => ({
                              ...p,
                              licenseToDate: e.target.value,
                            }))
                          }
                          className={`${INPUT_CLASS} ${popupShowErrors && getFieldError("licenseToDate") ? "border-red-500" : ""}`}
                        />
                        {popupShowErrors && getFieldError("licenseToDate") && (
                          <p className="text-red-500 text-xs" role="alert">
                            {getFieldError("licenseToDate")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showWorkforceDetails &&
                (showLicenseInformation || showValidityDates) && <Separator />}

              {showWorkforceDetails && (
                <div className="space-y-3">
                  <SubFormTitle title="Workforce Details" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {isVisible("workmen") && (
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          {getLabel("workmen", "Number of Workmen")}{" "}
                          {isRequired("workmen") && (
                            <span className="text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          type="number"
                          min={0}
                          value={formLicense.workmen ?? ""}
                          onChange={(e) =>
                            setFormLicense((p) => ({
                              ...p,
                              workmen:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            }))
                          }
                          className={`${INPUT_CLASS} ${popupShowErrors && getFieldError("workmen") ? "border-red-500" : ""}`}
                          placeholder="0"
                        />
                        {popupShowErrors && getFieldError("workmen") && (
                          <p className="text-red-500 text-xs" role="alert">
                            {getFieldError("workmen")}
                          </p>
                        )}
                      </div>
                    )}
                    {isVisible("issuedOn") && (
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          {getLabel("issuedOn", "Issued On")}{" "}
                          {isRequired("issuedOn") && (
                            <span className="text-red-500">*</span>
                          )}
                        </Label>
                        <Input
                          type="date"
                          value={formLicense.issuedOn}
                          max={
                            formLicense.licenseFromDate ||
                            new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) =>
                            setFormLicense((p) => ({
                              ...p,
                              issuedOn: e.target.value,
                            }))
                          }
                          className={`${INPUT_CLASS} ${popupShowErrors && getFieldError("issuedOn") ? "border-red-500" : ""}`}
                        />
                        {popupShowErrors && getFieldError("issuedOn") && (
                          <p className="text-red-500 text-xs" role="alert">
                            {getFieldError("issuedOn")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            onClick={handleClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
            disabled={shouldShowConfigLoader || postLoading}
          >
            {initialLicense !== null ? "Save" : "Add License"}
          </Button>
        </div>
      </div>
    </div>
  );
}
