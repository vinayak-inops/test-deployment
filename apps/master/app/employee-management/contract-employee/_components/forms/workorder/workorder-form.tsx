"use client";

import { Button } from "@repo/ui/components/ui/button";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Separator } from "@repo/ui/components/ui/separator";
import { FileText, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { gql, useQuery } from "@apollo/client";
import { client } from "@repo/ui/hooks/api/dynamic-graphql";
import { SingleSelectField } from "@/components/fields/single-select-field";
import DocumentUploadField from "../../../../../../components/fields/document-upload-field";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { toast } from "react-toastify";
import { useWorkOrderStatus } from "./hooks/use-workorder-status";
import { useWorkOrderDateRules } from "./hooks/use-workorder-date-rules";
import { useWorkOrderDataValidation } from "./hooks/use-workorder-data-validation";
import { useWorkOrderAutoSync } from "./hooks/use-workorder-auto-sync";
import { useWorkOrderCascadeUpdate } from "./hooks/use-workorder-cascade-update";
import { useWorkOrderEffectiveDates } from "./hooks/use-workorder-effective-dates";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useAuditPayload } from "@/hooks/api/useAuditPayload";
import { SubFormTitle } from "../../../../../../components/header/sub-form-title";
import {
  type WorkOrderConfig,
  type WorkOrderFieldKey,
} from "../../schemas/workorder-schema";

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900";

const FETCH_CONTRACTORS_QUERY = gql`
  query FetchContractors(
    $criteriaRequests: [CriteriaRequest!]!
    $collection: String!
  ) {
    fetchContractors(
      criteriaRequests: $criteriaRequests
      collection: $collection
    ) {
      contractorCode
      workOrders {
        workOrderNumber
        workOrderDate
        proposalReferenceNumber
        NumberOfEmployee
        contractPeriodFrom
        contractPeriodTo
      }
    }
  }
`;

interface WorkOrderSectionProps {
  watchedValues: any;
  setValue: any;
  onFormDataChange: (data: any) => void;
  isViewMode: boolean;
  isOpen: boolean;
  onClose: () => void;
  popupTitle?: string;
  employeeCollectionUrl?: string;
  employeeSearchUrl?: string;
  tenantCode?: string;
  employeeRecordId?: string | null;
  contractorCode: string;
  setWorkOrderData: React.Dispatch<React.SetStateAction<any[]>>;
  showErrors: boolean;
  errors: any;
  workOrderData: any[];
  workOrderValidationErrors: { [key: number]: string[] };
  setWorkOrderValidationErrors: React.Dispatch<
    React.SetStateAction<{ [key: number]: string[] }>
  >;
  showDateValidationError: (message: string) => void;
  handleDateChange: (
    index: number,
    field: "effectiveFrom" | "effectiveTo",
    value: string,
  ) => void;
  removeWorkOrder: (index: number) => void;
  getSelectedWorkOrder: (workOrderNumber: string) => any;
  getDateForInput: (dateString: string) => string | undefined;
  formatDateForDisplay: (dateString: string | undefined) => string;
  currentMode: string;
  auditStatusFormData: any;
  workOrderConfig?: WorkOrderConfig;
  onSaveSuccess?: () => void;
  onSavingChange?: (loading: boolean) => void;
}

function WorkOrderSection({
  watchedValues,
  setValue,
  onFormDataChange,
  isViewMode,
  isOpen,
  onClose,
  popupTitle = "Work Order",
  employeeCollectionUrl = "contract_employee",
  employeeSearchUrl = "contract_employee/search",
  tenantCode,
  employeeRecordId = null,
  contractorCode,
  setWorkOrderData,
  showErrors,
  errors,
  workOrderData,
  workOrderValidationErrors,
  setWorkOrderValidationErrors,
  showDateValidationError,
  handleDateChange,
  removeWorkOrder,
  getSelectedWorkOrder,
  getDateForInput,
  formatDateForDisplay,
  currentMode,
  auditStatusFormData,
  workOrderConfig,
  onSaveSuccess,
  onSavingChange,
}: WorkOrderSectionProps) {
  const derivedTenantCode = useGetTenantCode();
  const resolvedTenantCode = tenantCode || derivedTenantCode;
  const auditEntityId = String(
    employeeRecordId ||
      auditStatusFormData?.employeeID ||
      auditStatusFormData?.employeeId ||
      "new",
  );
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  });
  const [serverFieldErrors, setServerFieldErrors] = useState<
    Record<string, string>
  >({});
  const workOrderFields = workOrderConfig?.fields ?? {};
  const isRequired = useMemo(() => {
    return (field: WorkOrderFieldKey): boolean =>
      field === "workOrderNumber"
        ? (workOrderFields[field]?.required ?? true)
        : Boolean(workOrderFields[field]?.required);
  }, [workOrderFields]);
  const isVisible = useMemo(() => {
    return (field: WorkOrderFieldKey): boolean =>
      workOrderFields[field]?.visible ?? true;
  }, [workOrderFields]);
  const getLabel = useMemo(() => {
    return (field: WorkOrderFieldKey, fallback: string): string =>
      workOrderFields[field]?.label || fallback;
  }, [workOrderFields]);
  const contractorQueryVariables = useMemo(
    () => ({
      criteriaRequests: [
        { field: "contractorCode", operator: "eq", value: contractorCode },
        ...(resolvedTenantCode
          ? [{ field: "tenantCode", operator: "eq", value: resolvedTenantCode }]
          : []),
      ],
      collection: "contractor",
    }),
    [contractorCode, resolvedTenantCode],
  );
  const { post: postWorkOrders, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status;
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object"
            ? response.data
            : response;
        const normalizeServerField = (fieldName: string): string | null => {
          const fieldMap: Record<string, string> = {
            workOrderNumber: "workOrderNumber",
            effectiveFrom: "effectiveFrom",
            effectiveTo: "effectiveTo",
            remark: "remark",
            nocByContractor: "nocByContractor.documentPath",
          };
          if (fieldMap[fieldName]) return fieldMap[fieldName];
          if (fieldName.startsWith("workOrder.")) {
            const parts = fieldName.split(".");
            if (
              parts.length >= 4 &&
              parts[2] === "nocByContractor" &&
              parts[3] === "documentPath"
            ) {
              return "nocByContractor.documentPath";
            }
            const key = parts[parts.length - 1] ?? "";
            return fieldMap[key] ?? null;
          }
          return null;
        };
        const nextErrors: Record<string, string> = {};
        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (
              fieldName === "status" ||
              fieldName === "_id" ||
              fieldName === "id"
            )
              return;
            if (typeof message !== "string" || !message.trim()) return;
            const normalizedField = normalizeServerField(fieldName);
            if (!normalizedField) return;
            nextErrors[normalizedField] = message;
          });
        }
        setServerFieldErrors(nextErrors);
        return;
      }

      setServerFieldErrors({});
      toast.success("Work orders saved successfully!");
      onSaveSuccess?.();
    },
    onError: (error) => {
      console.error("Error saving work orders:", error);
    },
  });

  useEffect(() => {
    onSavingChange?.(postLoading);
  }, [postLoading, onSavingChange]);

  const { error: contractorsError } = useQuery(FETCH_CONTRACTORS_QUERY, {
    client,
    variables: contractorQueryVariables,
    skip: !isOpen || !contractorCode,
    fetchPolicy: "network-only",
    onCompleted: (data: any) => {
      const contractors = data?.fetchContractors;
      if (!Array.isArray(contractors) || contractors.length === 0) {
        setWorkOrderData([]);
        return;
      }

      const selectedContractor = contractors.find(
        (c: any) => c?.contractorCode === contractorCode,
      );
      setWorkOrderData(selectedContractor?.workOrders || []);
    },
  });

  useEffect(() => {
    if (!isOpen) return;

    if (!contractorCode) {
      setWorkOrderData([]);
      return;
    }

    if (contractorsError) {
      console.error("Error fetching contractors:", contractorsError);
    }
  }, [isOpen, contractorCode, contractorsError, setWorkOrderData]);

  const {
    isDateWithinContractPeriod,
    isEffectiveFromValid,
    isWorkOrderActive,
    getSuggestedEffectiveFromDate,
    getAutoEffectiveFromDate,
    autoUpdateEffectiveFrom,
    getMinEffectiveFromDate,
    checkForOverlappingDates,
  } = useWorkOrderDateRules({
    watchedValues,
    getSelectedWorkOrder,
    getDateForInput,
    formatDateForDisplay,
  });

  const { getStatusMeta } = useWorkOrderStatus({
    workOrderData,
    isWorkOrderActive,
  });
  const {
    isWorkOrderExists,
    isDateFieldDisabled,
    getEffectiveFromMinDate,
    getEffectiveFromMaxDate,
    getEffectiveToMinDate,
    getEffectiveToMaxDate,
    validateEffectiveFromSelection,
    validateEffectiveToSelection,
  } = useWorkOrderEffectiveDates({
    workOrderData,
    getSelectedWorkOrder,
    getDateForInput,
    formatDateForDisplay,
    getMinEffectiveFromDate,
    checkForOverlappingDates,
  });
  useWorkOrderDataValidation({
    watchedValues,
    workOrderData,
    currentMode,
    auditStatusFormData,
    getSelectedWorkOrder,
    getDateForInput,
    formatDateForDisplay,
    setWorkOrderValidationErrors,
    showDateValidationError,
    setValue,
    onFormDataChange,
    enabled: isOpen,
  });

  useWorkOrderAutoSync({
    watchedValues,
    isViewMode,
    currentMode,
    auditStatusFormData,
    getSelectedWorkOrder,
    getDateForInput,
    formatDateForDisplay,
    setValue,
    onFormDataChange,
    enabled: isOpen,
  });

  useWorkOrderCascadeUpdate({
    watchedValues,
    isViewMode,
    autoUpdateEffectiveFrom,
    handleDateChange,
    setValue,
    enabled: isOpen,
  });

  const handleDocumentUpdate = (
    index: number,
    doc: { documentPath: string; documentType: string },
  ) => {
    setValue(`workOrder.${index}.nocByContractor`, doc);
    const updated = [...(watchedValues.workOrder || [])];
    const prev = updated[index] || {};
    updated[index] = {
      ...prev,
      nocByContractor: doc,
    };
    const formatted = updated.map((wo: any) => ({
      ...wo,
      effectiveFrom: wo.effectiveFrom
        ? formatDateForDisplay(wo.effectiveFrom)
        : "",
      effectiveTo: wo.effectiveTo ? formatDateForDisplay(wo.effectiveTo) : "",
    }));
    onFormDataChange({ workOrder: formatted });
  };

  const handleFinalSubmit = () => {
    const currentWorkOrders = watchedValues.workOrder || [];
    const editableWorkOrder = currentWorkOrders[currentWorkOrders.length - 1];
    if (!editableWorkOrder) return;

    const payloadWorkOrder = {
      ...editableWorkOrder,
      effectiveFrom: editableWorkOrder.effectiveFrom
        ? formatDateForDisplay(editableWorkOrder.effectiveFrom)
        : "",
      effectiveTo: editableWorkOrder.effectiveTo
        ? formatDateForDisplay(editableWorkOrder.effectiveTo)
        : "",
      parseID: (editableWorkOrder as Record<string, any>)?.parseID,
    };

    const isEditMode = currentMode === "edit" && Boolean(employeeRecordId);
    const shouldSetWorkOrderTab = employeeSearchUrl === "draft/contract_employee/search";
    postWorkOrders({
      tenant: resolvedTenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "contractEmployeeWorkOrder",
      audit: auditPayload,
      data: {
        workOrder: [payloadWorkOrder],
        ...(shouldSetWorkOrderTab ? { workOrderstab: true } : {}),
      },
    });
  };
  const clearWorkOrderServerError = () => {
    if (!serverFieldErrors.workOrderNumber) return;
    setServerFieldErrors((prev) => {
      const next = { ...prev };
      delete next.workOrderNumber;
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {popupTitle}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Update work-order details, dates and NOC document.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0">
          {watchedValues.workOrder && watchedValues.workOrder.length > 0 ? (
            <div className="space-y-6">
              {[...watchedValues.workOrder]
                .reverse()
                .map((workOrder: any, originalIndex: number) => {
                  // Calculate the actual index in the original array
                  const actualIndex =
                    watchedValues.workOrder.length - 1 - originalIndex;
                  const statusMeta = getStatusMeta(workOrder);
                  const workOrderExists = isWorkOrderExists(
                    workOrder.workOrderNumber,
                  );
                  // Show editor only for latest record; list is shown in parent table.
                  if (originalIndex !== 0) {
                    return null;
                  }
                  return (
                    <div
                      key={`${actualIndex}-${workOrder.workOrderNumber || "empty"}`}
                      className="space-y-4"
                    >
                      {/* Work Order */}
                      <div className="p-6 border border-gray-200 rounded-xl bg-gray-50/50">
                        <div className="mb-4">
                          <SubFormTitle title="Work Order Details" />
                        </div>
                        {/* Active Work Order Notice */}
                        {isWorkOrderActive(
                          workOrder.effectiveFrom,
                          workOrder.effectiveTo,
                        ) && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                              <p className="text-blue-700 text-sm font-medium">
                                This work order is currently active (today falls
                                within the effective date range). Active work
                                orders cannot be edited to maintain data
                                integrity.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-md font-medium text-gray-800">
                            {actualIndex === watchedValues.workOrder.length - 1
                              ? "Latest Work Order (last update)"
                              : `Work Order - ${workOrder.workOrderNumber || `WO${actualIndex + 1}`}`}
                          </h4>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const isActive = isWorkOrderActive(
                                workOrder.effectiveFrom,
                                workOrder.effectiveTo,
                              );
                              return (
                                <Badge
                                  className={
                                    isActive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {isActive ? "Active" : "Inactive"}
                                </Badge>
                              );
                            })()}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {isVisible("workOrderNumber") && (
                            <SingleSelectField
                              key={`workOrderNumber-${actualIndex}`}
                              id={`workOrderNumber-${actualIndex}`}
                              label={getLabel(
                                "workOrderNumber",
                                "Work Order Number",
                              )}
                              required={isRequired("workOrderNumber")}
                              placeholder="Search Work Order Number"
                              disabled={isViewMode}
                              value={workOrder.workOrderNumber || ""}
                              onChange={(value) => {
                                // Don't allow changes if work order is active
                                if (
                                  isWorkOrderActive(
                                    workOrder.effectiveFrom,
                                    workOrder.effectiveTo,
                                  )
                                ) {
                                  return;
                                }
                                // If there is already a selected number and it's different, block any change
                                if (
                                  workOrder.workOrderNumber &&
                                  workOrder.workOrderNumber !== value
                                ) {
                                  return;
                                }

                                const selectedWorkOrder = workOrderData?.find(
                                  (wo: any) => wo.workOrderNumber === value,
                                );

                                if (selectedWorkOrder) {
                                  clearWorkOrderServerError();
                                  // Auto-populate dates based on contract period
                                  // Store dates in yyyy-mm-dd format for the form
                                  const contractFrom = getDateForInput(
                                    selectedWorkOrder.contractPeriodFrom,
                                  );
                                  const contractTo = getDateForInput(
                                    selectedWorkOrder.contractPeriodTo,
                                  );

                                  // Check if this is a new work order (no existing effectiveFrom/effectiveTo)
                                  const isNewWorkOrder =
                                    !workOrder.effectiveFrom &&
                                    !workOrder.effectiveTo;

                                  let effectiveFrom = contractFrom;
                                  let effectiveTo = contractTo;

                                  // If this is a new work order, auto-set Effective From to next day after latest Effective To
                                  if (isNewWorkOrder) {
                                    const autoFromDate =
                                      getAutoEffectiveFromDate(
                                        value,
                                        actualIndex,
                                      );
                                    if (autoFromDate) {
                                      effectiveFrom = autoFromDate;
                                    }
                                  }

                                  // Create updated work order data with auto-populated dates (both from and to)
                                  const updatedWorkOrder = {
                                    ...workOrder,
                                    workOrderNumber: value,
                                    effectiveFrom: effectiveFrom,
                                    effectiveTo: effectiveTo,
                                  };

                                  // Update form values
                                  setValue(
                                    `workOrder.${actualIndex}`,
                                    updatedWorkOrder,
                                  );

                                  // Clear validation errors
                                  setWorkOrderValidationErrors(
                                    (prev: { [key: number]: string[] }) => {
                                      const newErrors = { ...prev };
                                      delete newErrors[actualIndex];
                                      return newErrors;
                                    },
                                  );

                                  // Update parent component
                                  const updatedWorkOrders = [
                                    ...(watchedValues.workOrder || []),
                                  ];
                                  updatedWorkOrders[actualIndex] =
                                    updatedWorkOrder;
                                  // Convert dates to yyyy-mm-dd format for parent component
                                  const formattedWorkOrders =
                                    updatedWorkOrders.map((wo: any) => ({
                                      ...wo,
                                      effectiveFrom: wo.effectiveFrom
                                        ? formatDateForDisplay(wo.effectiveFrom)
                                        : "",
                                      effectiveTo: wo.effectiveTo
                                        ? formatDateForDisplay(wo.effectiveTo)
                                        : "",
                                    }));
                                  onFormDataChange({
                                    workOrder: formattedWorkOrders,
                                  });
                                } else {
                                  // If selected number doesn't exist in list, do not apply logic and disallow changes
                                  return;
                                }
                              }}
                              options={(workOrderData ?? []).map((wo: any) => ({
                                value: wo.workOrderNumber || "",
                                label: wo.workOrderNumber || "",
                                tooltip: wo.workOrderNumber || "",
                              }))}
                              showOnlyValueInTrigger
                              className="space-y-2"
                              errorMessage={
                                serverFieldErrors.workOrderNumber ||
                                (showErrors &&
                                errors.workOrder?.[actualIndex]?.workOrderNumber
                                  ? errors.workOrder[actualIndex]
                                      .workOrderNumber.message
                                  : undefined)
                              }
                              allowOnlyProvidedOptions
                            />
                          )}

                          {isVisible("isActive") && (
                            <div className="space-y-2">
                              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                                {getLabel("isActive", "Status")}
                              </Label>
                              <div
                                className={`h-9 px-3 py-1.5 border rounded-md flex items-center justify-between ${statusMeta.containerClass}`}
                              >
                                <span className="text-sm font-medium text-gray-700">
                                  {statusMeta.label}
                                </span>
                                <div
                                  className={`w-3 h-3 rounded-full ${statusMeta.dotClass}`}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500">
                                {statusMeta.helperText}
                              </p>
                              {statusMeta.exists && statusMeta.hasDates && (
                                <p className="text-xs text-blue-600">
                                  Active period:{" "}
                                  {formatDateForDisplay(
                                    workOrder.effectiveFrom,
                                  )}{" "}
                                  to{" "}
                                  {formatDateForDisplay(workOrder.effectiveTo)}
                                </p>
                              )}
                            </div>
                          )}

                          {isVisible("effectiveFrom") && (
                            <div className="space-y-2">
                              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                                {getLabel("effectiveFrom", "Effective From")}
                              </Label>
                              <Input
                                type="date"
                                value={
                                  workOrder.effectiveFrom
                                    ? getDateForInput(workOrder.effectiveFrom)
                                    : ""
                                }
                                disabled={isDateFieldDisabled(
                                  isViewMode,
                                  workOrder.workOrderNumber,
                                )}
                                onChange={(e) => {
                                  if (isViewMode) return;
                                  if (!workOrderExists) return;
                                  const selectedDate = e.target.value;
                                  const validationError =
                                    validateEffectiveFromSelection(
                                      workOrder,
                                      selectedDate,
                                      actualIndex,
                                    );
                                  if (validationError) {
                                    showDateValidationError(validationError);
                                    e.target.value = "";
                                    return;
                                  }

                                  handleDateChange(
                                    actualIndex,
                                    "effectiveFrom",
                                    selectedDate,
                                  );
                                  if (serverFieldErrors.effectiveFrom) {
                                    setServerFieldErrors((prev) => {
                                      const next = { ...prev };
                                      delete next.effectiveFrom;
                                      return next;
                                    });
                                  }
                                }}
                                min={getEffectiveFromMinDate(
                                  workOrder.workOrderNumber,
                                  actualIndex,
                                )}
                                max={getEffectiveFromMaxDate(
                                  workOrder.workOrderNumber,
                                )}
                                className={`${INPUT_CLASS} transition-colors duration-200 ${
                                  isViewMode
                                    ? "bg-gray-100 cursor-not-allowed opacity-50"
                                    : workOrderValidationErrors[actualIndex]
                                          ?.length > 0
                                      ? "border-gray-300"
                                      : workOrder.effectiveFrom &&
                                          workOrder.workOrderNumber &&
                                          !isDateWithinContractPeriod(
                                            workOrder.workOrderNumber,
                                            workOrder.effectiveFrom,
                                          )
                                        ? "border-gray-300"
                                        : workOrder.effectiveFrom &&
                                            workOrder.effectiveTo &&
                                            !isEffectiveFromValid(
                                              workOrder.effectiveFrom,
                                              workOrder.effectiveTo,
                                            )
                                          ? "border-gray-300"
                                          : workOrder.effectiveFrom &&
                                              workOrder.effectiveTo &&
                                              (() => {
                                                // Use date comparison without time component to avoid timezone issues
                                                const fromDate = new Date(
                                                  workOrder.effectiveFrom,
                                                );
                                                const toDate = new Date(
                                                  workOrder.effectiveTo,
                                                );
                                                const fromDateOnly = new Date(
                                                  fromDate.getFullYear(),
                                                  fromDate.getMonth(),
                                                  fromDate.getDate(),
                                                );
                                                const toDateOnly = new Date(
                                                  toDate.getFullYear(),
                                                  toDate.getMonth(),
                                                  toDate.getDate(),
                                                );
                                                return (
                                                  fromDateOnly <= toDateOnly
                                                );
                                              })()
                                            ? "border-green-500 focus:border-green-500"
                                            : workOrder.workOrderNumber &&
                                                workOrder.effectiveFrom
                                              ? "border-blue-500 focus:border-blue-500"
                                              : "border-gray-300 focus:border-blue-500"
                                }`}
                              />
                              {workOrder.workOrderNumber &&
                                (() => {
                                  if (!workOrderExists) return null; // Don't show any validation info if work order doesn't exist

                                  const selectedWO = getSelectedWorkOrder(
                                    workOrder.workOrderNumber,
                                  );
                                  if (selectedWO) {
                                    const suggestedDate =
                                      getSuggestedEffectiveFromDate(
                                        workOrder.workOrderNumber,
                                        actualIndex,
                                      );
                                    const minAllowedDate =
                                      getMinEffectiveFromDate(
                                        workOrder.workOrderNumber,
                                        actualIndex,
                                      );
                                    const isCurrentDateValid =
                                      workOrder.effectiveFrom
                                        ? isDateWithinContractPeriod(
                                            workOrder.workOrderNumber,
                                            workOrder.effectiveFrom,
                                          )
                                        : true;

                                    // Check if current Effective From conflicts with minimum allowed date
                                    const hasConflict =
                                      workOrder.effectiveFrom &&
                                      minAllowedDate &&
                                      new Date(workOrder.effectiveFrom) <
                                        new Date(minAllowedDate);

                                    // Check if the conflict has been resolved by auto-update
                                    // A conflict is resolved if the current date is >= minimum allowed date
                                    const isConflictResolved =
                                      hasConflict &&
                                      new Date(workOrder.effectiveFrom) >=
                                        new Date(minAllowedDate);

                                    return (
                                      <div className="mt-2 space-y-1">
                                        <p className="text-blue-500 text-sm font-medium">
                                          Contract Period:{" "}
                                          {formatDateForDisplay(
                                            selectedWO.contractPeriodFrom,
                                          )}{" "}
                                          to{" "}
                                          {formatDateForDisplay(
                                            selectedWO.contractPeriodTo,
                                          )}
                                        </p>

                                        {/* Show contract period validation status */}
                                        {workOrder.effectiveFrom && (
                                          <div
                                            className={`text-xs ${isCurrentDateValid ? "text-green-600" : "text-gray-500"}`}
                                          >
                                            {isCurrentDateValid ? (
                                              <span>
                                                Selected date{" "}
                                                {formatDateForDisplay(
                                                  workOrder.effectiveFrom,
                                                )}{" "}
                                                is within contract period
                                              </span>
                                            ) : (
                                              <span>
                                                Selected date{" "}
                                                {formatDateForDisplay(
                                                  workOrder.effectiveFrom,
                                                )}{" "}
                                                is outside contract period
                                              </span>
                                            )}
                                          </div>
                                        )}

                                        {/* Show minimum allowed date to avoid conflicts */}

                                        {/* Show suggested date to avoid conflicts */}
                                        {suggestedDate &&
                                          !workOrder.effectiveFrom &&
                                          !isWorkOrderActive(
                                            workOrder.effectiveFrom,
                                            workOrder.effectiveTo,
                                          ) && (
                                            <div className="flex items-center gap-2">
                                              <p className="text-green-600 text-xs">
                                                Suggested start date to ensure
                                                no overlap:{" "}
                                                {formatDateForDisplay(
                                                  suggestedDate,
                                                )}
                                              </p>
                                              {!isViewMode && (
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => {
                                                    // Validate suggested date is within contract period before applying
                                                    if (
                                                      isDateWithinContractPeriod(
                                                        workOrder.workOrderNumber,
                                                        suggestedDate,
                                                      )
                                                    ) {
                                                      handleDateChange(
                                                        actualIndex,
                                                        "effectiveFrom",
                                                        suggestedDate,
                                                      );
                                                    } else {
                                                      showDateValidationError(
                                                        `Suggested date ${formatDateForDisplay(suggestedDate)} is outside the contract period (${formatDateForDisplay(selectedWO.contractPeriodFrom)} to ${formatDateForDisplay(selectedWO.contractPeriodTo)})`,
                                                      );
                                                    }
                                                  }}
                                                  className="px-2 py-1 text-xs border-green-300 text-green-700 hover:bg-green-50"
                                                >
                                                  Use Suggested
                                                </Button>
                                              )}
                                            </div>
                                          )}

                                        {/* Show overlapping date warnings - only if conflict is not resolved */}
                                        {!isConflictResolved &&
                                          (() => {
                                            const overlapError =
                                              checkForOverlappingDates(
                                                workOrder.workOrderNumber,
                                                workOrder.effectiveFrom || "",
                                                workOrder.effectiveTo || "",
                                                actualIndex,
                                              );
                                            if (overlapError) {
                                              return (
                                                <p className="text-gray-500 text-xs flex items-center gap-1">
                                                  <X className="h-3 w-3" />
                                                  {overlapError}
                                                </p>
                                              );
                                            }
                                            return null;
                                          })()}
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}

                              {/* Real-time validation errors - only show if work order exists */}
                              {(() => {
                                if (!workOrderExists) return null;

                                return workOrderValidationErrors[actualIndex]
                                  ?.length > 0 ? (
                                  <div className="mt-2 space-y-1">
                                    {workOrderValidationErrors[actualIndex].map(
                                      (error: string, errorIndex: number) => (
                                        <p
                                          key={errorIndex}
                                          className="text-red-500 text-xs flex items-center gap-1"
                                        >
                                          <X className="h-3 w-3" />
                                          {error}
                                        </p>
                                      ),
                                    )}
                                  </div>
                                ) : null;
                              })()}
                              {(() => {
                                if (!workOrderExists) return null;

                                return showErrors &&
                                  errors.workOrder?.[actualIndex]
                                    ?.effectiveTo ? (
                                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                    <X className="h-3 w-3" />
                                    {
                                      errors.workOrder[actualIndex].effectiveTo
                                        .message
                                    }
                                  </p>
                                ) : null;
                              })()}
                              {serverFieldErrors.effectiveFrom && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                  <X className="h-3 w-3" />
                                  {serverFieldErrors.effectiveFrom}
                                </p>
                              )}
                            </div>
                          )}

                          {isVisible("effectiveTo") && (
                            <div className="space-y-2">
                              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                                {getLabel("effectiveTo", "Effective To")}
                              </Label>
                              <div className="flex gap-2">
                                <Input
                                  type="date"
                                  value={
                                    workOrder.effectiveTo
                                      ? getDateForInput(workOrder.effectiveTo)
                                      : ""
                                  }
                                  disabled={isDateFieldDisabled(
                                    isViewMode,
                                    workOrder.workOrderNumber,
                                  )}
                                  onChange={(e) => {
                                    if (isViewMode) return;
                                    if (!workOrderExists) return;
                                    const selectedDate = e.target.value;
                                    const validationError =
                                      validateEffectiveToSelection(
                                        workOrder,
                                        selectedDate,
                                        actualIndex,
                                      );
                                    if (validationError) {
                                      showDateValidationError(validationError);
                                      e.target.value = "";
                                      return;
                                    }

                                    handleDateChange(
                                      actualIndex,
                                      "effectiveTo",
                                      selectedDate,
                                    );
                                    if (serverFieldErrors.effectiveTo) {
                                      setServerFieldErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.effectiveTo;
                                        return next;
                                      });
                                    }
                                  }}
                                  min={getEffectiveToMinDate(workOrder)}
                                  max={getEffectiveToMaxDate(
                                    workOrder.workOrderNumber,
                                  )}
                                  className={`${INPUT_CLASS} transition-colors duration-200 ${
                                    isViewMode
                                      ? "bg-gray-100 cursor-not-allowed opacity-50"
                                      : workOrderValidationErrors[actualIndex]
                                            ?.length > 0
                                        ? "border-gray-300"
                                        : workOrder.effectiveFrom &&
                                            workOrder.effectiveTo &&
                                            !isEffectiveFromValid(
                                              workOrder.effectiveFrom,
                                              workOrder.effectiveTo,
                                            )
                                          ? "border-gray-300"
                                          : workOrder.effectiveFrom &&
                                              workOrder.effectiveTo &&
                                              (() => {
                                                // Use date comparison without time component to avoid timezone issues
                                                const fromDate = new Date(
                                                  workOrder.effectiveFrom,
                                                );
                                                const toDate = new Date(
                                                  workOrder.effectiveTo,
                                                );
                                                const fromDateOnly = new Date(
                                                  fromDate.getFullYear(),
                                                  fromDate.getMonth(),
                                                  fromDate.getDate(),
                                                );
                                                const toDateOnly = new Date(
                                                  toDate.getFullYear(),
                                                  toDate.getMonth(),
                                                  toDate.getDate(),
                                                );
                                                return (
                                                  toDateOnly >= fromDateOnly
                                                );
                                              })()
                                            ? "border-green-500 focus:border-green-500"
                                            : workOrder.workOrderNumber &&
                                                workOrder.effectiveFrom &&
                                                workOrder.effectiveTo
                                              ? "border-blue-500 focus:border-blue-500"
                                              : "border-gray-300 focus:border-blue-500"
                                  }`}
                                />
                                {!isViewMode &&
                                  workOrder.workOrderNumber &&
                                  workOrder.effectiveFrom &&
                                  !isWorkOrderActive(
                                    workOrder.effectiveFrom,
                                    workOrder.effectiveTo,
                                  ) &&
                                  (() => {
                                    const selectedWO = getSelectedWorkOrder(
                                      workOrder.workOrderNumber,
                                    );
                                    if (
                                      selectedWO &&
                                      !workOrder.effectiveTo &&
                                      workOrderExists
                                    ) {
                                      return (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const contractToStr =
                                              getDateForInput(
                                                selectedWO.contractPeriodTo,
                                              );
                                            if (contractToStr) {
                                              const contractTo = new Date(
                                                contractToStr,
                                              );
                                              if (
                                                !isNaN(contractTo.getTime())
                                              ) {
                                                // Store in yyyy-mm-dd format
                                                handleDateChange(
                                                  actualIndex,
                                                  "effectiveTo",
                                                  contractToStr,
                                                );
                                              }
                                            }
                                          }}
                                          className="px-3 py-2 text-xs border-blue-300 text-blue-700 hover:bg-blue-50"
                                        >
                                          Set to Contract End
                                        </Button>
                                      );
                                    }
                                    return null;
                                  })()}
                              </div>
                              {workOrder.workOrderNumber &&
                                workOrder.effectiveFrom &&
                                (() => {
                                  if (!workOrderExists) return null; // Don't show validation info if work order doesn't exist

                                  const selectedWO = getSelectedWorkOrder(
                                    workOrder.workOrderNumber,
                                  );
                                  if (selectedWO) {
                                    return (
                                      <div className="mt-2 space-y-1">
                                        <p className="text-blue-600 text-xs">
                                          Suggested: Select a date between{" "}
                                          {formatDateForDisplay(
                                            workOrder.effectiveFrom || "",
                                          )}{" "}
                                          and{" "}
                                          {formatDateForDisplay(
                                            selectedWO.contractPeriodTo,
                                          )}
                                        </p>
                                      </div>
                                    );
                                  }
                                  return (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-gray-500 text-xs">
                                        Must be greater than or equal to{" "}
                                        {formatDateForDisplay(
                                          workOrder.effectiveFrom || "",
                                        )}{" "}
                                        and within contract period (can be same
                                        date)
                                      </p>
                                    </div>
                                  );
                                })()}
                              {(() => {
                                if (!workOrderExists) return null;

                                return showErrors &&
                                  errors.workOrder?.[actualIndex]
                                    ?.effectiveTo ? (
                                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                    <X className="h-3 w-3" />
                                    {
                                      errors.workOrder[actualIndex].effectiveTo
                                        .message
                                    }
                                  </p>
                                ) : null;
                              })()}
                              {serverFieldErrors.effectiveTo && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                  <X className="h-3 w-3" />
                                  {serverFieldErrors.effectiveTo}
                                </p>
                              )}
                            </div>
                          )}

                          {isVisible("nocByContractor") && (
                            <>
                              <div className="md:col-span-2">
                                <Separator />
                              </div>
                              <DocumentUploadField
                                id={`woDocumentPath${actualIndex}`}
                                label={getLabel(
                                  "nocByContractor",
                                  "NOC By Contractor",
                                )}
                                isViewMode={isViewMode}
                                employeeID={
                                  (auditStatusFormData &&
                                    (auditStatusFormData.employeeID ||
                                      auditStatusFormData.employeeId)) ||
                                  "unknown"
                                }
                                value={
                                  workOrder?.nocByContractor || {
                                    documentPath: "",
                                    documentType: "",
                                  }
                                }
                                onChange={(doc) => {
                                  if (
                                    serverFieldErrors[
                                      "nocByContractor.documentPath"
                                    ]
                                  ) {
                                    setServerFieldErrors((prev) => {
                                      const next = { ...prev };
                                      delete next[
                                        "nocByContractor.documentPath"
                                      ];
                                      return next;
                                    });
                                  }
                                  handleDocumentUpdate(actualIndex, doc);
                                }}
                                disabled={!workOrderExists}
                                uploadPrefix="workorder"
                                uploadButtonText={`Upload ${getLabel("nocByContractor", "NOC By Contractor")}`}
                                successTitle={getLabel(
                                  "nocByContractor",
                                  "NOC By Contractor",
                                )}
                                successSubtitle="Document uploaded successfully"
                                wrapperClassName="space-y-2 md:col-span-2"
                                labelClassName="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                              />
                              {serverFieldErrors[
                                "nocByContractor.documentPath"
                              ] && (
                                <p className="text-red-500 text-sm mt-1 flex items-center gap-1 md:col-span-2">
                                  <X className="h-3 w-3" />
                                  {
                                    serverFieldErrors[
                                      "nocByContractor.documentPath"
                                    ]
                                  }
                                </p>
                              )}
                            </>
                          )}

                          {isVisible("remark") && (
                            <>
                              <div className="md:col-span-2">
                                <Separator />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <SubFormTitle
                                  title={getLabel("remark", "Remark")}
                                />
                                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                                  {getLabel("remark", "Remark")}
                                </Label>
                                <Input
                                  value={workOrder.remark || ""}
                                  disabled={isViewMode}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (serverFieldErrors.remark) {
                                      setServerFieldErrors((prev) => {
                                        const next = { ...prev };
                                        delete next.remark;
                                        return next;
                                      });
                                    }
                                    setValue(
                                      `workOrder.${actualIndex}.remark`,
                                      value,
                                    );
                                    const updated = [
                                      ...(watchedValues.workOrder || []),
                                    ];
                                    updated[actualIndex] = {
                                      ...updated[actualIndex],
                                      remark: value,
                                    };
                                    const formatted = updated.map(
                                      (wo: any) => ({
                                        ...wo,
                                        effectiveFrom: wo.effectiveFrom
                                          ? formatDateForDisplay(
                                              wo.effectiveFrom,
                                            )
                                          : "",
                                        effectiveTo: wo.effectiveTo
                                          ? formatDateForDisplay(wo.effectiveTo)
                                          : "",
                                      }),
                                    );
                                    onFormDataChange({ workOrder: formatted });
                                  }}
                                  className={`${INPUT_CLASS} ${
                                    isViewMode
                                      ? "bg-gray-100 cursor-not-allowed"
                                      : ""
                                  }`}
                                  placeholder="Enter remark"
                                />
                                {serverFieldErrors.remark && (
                                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                    <X className="h-3 w-3" />
                                    {serverFieldErrors.remark}
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm">No work orders available for editing.</p>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          {!isViewMode && (
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleFinalSubmit}
              disabled={postLoading}
            >
              Final Submit
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WorkOrderSection;
