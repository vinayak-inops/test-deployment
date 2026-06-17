"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { Calendar } from "lucide-react";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch";
import { type AccidentRegister } from "../../schemas/accident-register-form-schema";
import { AccidentRegisterFormPopup } from "./accident-register-form";
import DocumentPreview from "@/components/popup/document-preview";
import ActionDataTable, {
  type ActionTableColumn,
  type ActionTableSearchField,
} from "@/components/common/action-data-table";
import { toast } from "react-toastify";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"

type SearchField = "accidentDescription" | "dateOfAccident" | "severity";

interface AccidentRegistersSectionFormProps {
  mode?: "add" | "edit" | "view";
  employeeRecordId?: string | null;
  employeeSearchUrl?: string;
  employeeCollectionUrl?: string;
}

export function AccidentRegistersSectionForm({
  mode = "add",
  employeeRecordId = null,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
}: AccidentRegistersSectionFormProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ path?: string; mime?: string; title?: string }>({});
  const [accidentRegister, setAccidentRegister] = useState<AccidentRegister[]>(
    [],
  );
  const tenantCode = useGetTenantCode();
  const currentMode = mode;
  const isViewMode = currentMode === "view";
  const canFetchAccidents = Boolean(employeeRecordId) && currentMode !== "add";

  const accidentCriteriaRequests = useMemo(() => {
    if (!employeeRecordId) return [];
    const criteriaRequests: any[] = [
      { field: "_id", operator: "eq", value: employeeRecordId },
    ];
    if (tenantCode) {
      criteriaRequests.push({
        field: "tenantCode",
        operator: "is",
        value: tenantCode,
      });
    }
    return criteriaRequests;
  }, [employeeRecordId, tenantCode]);

  const { arrayData: fetchedAccidents, refetch: refetchAccidents } =
    useAggregateArrayFetch<any>({
      collection:
        employeeSearchUrl !== "contract_employee/search"
          ? "draft/contract_employee"
          : "contract_employee",
      criteriaRequests: accidentCriteriaRequests,
      arrayField: "accidentRegister",
      enabled: canFetchAccidents,
      defaultValue: [],
    });

  useEffect(() => {
    if (!canFetchAccidents) return;
    void refetchAccidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetchAccidents, tenantCode]);

  useEffect(() => {
    if (!canFetchAccidents) return;
    if (Array.isArray(fetchedAccidents)) {
      setAccidentRegister(fetchedAccidents as AccidentRegister[]);
    }
  }, [canFetchAccidents, fetchedAccidents]);

  useEffect(() => {
    if (currentMode === "add") {
      setAccidentRegister([]);
    }
  }, [currentMode]);

  const openAdd = () => {
    setEditIndex(null);
    setIsFormOpen(true);
  };

  const openEdit = (index: number) => {
    setEditIndex(index);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditIndex(null);
  };

  const { post: postConEmp, loading: postLoading } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: async () => {
      toast.success("Employee data saved successfully!");
      refetchAccidents();
    },
    onError: (error) => {
      console.error("Error saving contractor data:", error);
    },
  });

  const handlePopupSubmit = (next: AccidentRegister[]) => {
    setAccidentRegister(next);
    closeForm();
  };

  const removeRecord = (index: number) => {
    const next = accidentRegister.filter((_, i) => i !== index);
    const isEditMode = currentMode === "edit" && Boolean(employeeRecordId);
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: employeeRecordId } : {}),
      collectionName: "contract_employee",
      data: {
        accidentRegister: next,
      },
    };
    postConEmp?.(payload);
    setAccidentRegister(next);
    setDeleteIndex(null);
  };
  const guessMimeFromPath = (path: string): string => {
    const lower = (path || "").toLowerCase();
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".gif")) return "image/gif";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".pdf")) return "application/pdf";
    if (lower.endsWith(".doc")) return "application/msword";
    if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return "application/octet-stream";
  };

  const columns = useMemo<ActionTableColumn<AccidentRegister>[]>(
    () => [
      {
        key: "dateOfAccident",
        label: "Accident Date",
        headerClassName:
          "py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide",
        cellClassName: "py-1.5 pl-4 text-sm text-gray-900",
        render: (row) => row.dateOfAccident || "-",
      },
      {
        key: "dateOfReport",
        label: "Report Date",
        render: (row) => row.dateOfReport || "-",
      },
      {
        key: "dateOfReturn",
        label: "Return Date",
        render: (row) => row.dateOfReturn || "-",
      },
      {
        key: "accidentDescription",
        label: "Description",
        render: (row) => row.accidentDescription || "-",
      },
      {
        key: "severity",
        label: "Severity",
        render: (row) => row.severity || "-",
      },
      {
        key: "relatedDocument",
        label: "Related Document",
        render: (row) =>
          row.relatedDocument ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                setPreviewDoc({
                  path: row.relatedDocument,
                  mime: guessMimeFromPath(row.relatedDocument || ""),
                  title: "Related Document",
                });
                setPreviewOpen(true);
              }}
            >
              Preview
            </Button>
          ) : (
            "-"
          ),
      },
    ],
    [],
  );

  const searchFields = useMemo<ActionTableSearchField<AccidentRegister>[]>(
    () => [
      {
        value: "accidentDescription",
        label: "Description",
        getValue: (row) => row.accidentDescription || "",
      },
      {
        value: "dateOfAccident",
        label: "Accident Date",
        getValue: (row) => row.dateOfAccident || "",
      },
      {
        value: "severity",
        label: "Severity",
        getValue: (row) => row.severity || "",
      },
    ],
    [],
  );

  const initialValue =
    editIndex !== null && accidentRegister[editIndex]
      ? accidentRegister[editIndex]
      : null;
  const displayedAccidentRegister = useMemo(
    () => [...accidentRegister].reverse(),
    [accidentRegister],
  );
  const toOriginalIndex = (displayIndex: number) =>
    accidentRegister.length - 1 - displayIndex;

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <Calendar className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Accident Register ({accidentRegister.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or edit accident records in the popup.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <ActionDataTable<AccidentRegister>
          rows={displayedAccidentRegister}
          columns={columns}
          searchFields={searchFields}
          defaultSearchField={"accidentDescription" as SearchField}
          isViewMode={isViewMode || postLoading}
          onAdd={!isViewMode && !postLoading ? openAdd : undefined}
          addButtonLabel="Add Record"
          onEdit={
            !isViewMode && !postLoading
              ? (rowIndex) => openEdit(toOriginalIndex(rowIndex))
              : undefined
          }
          onDelete={
            !isViewMode && !postLoading
              ? (rowIndex) => setDeleteIndex(toOriginalIndex(rowIndex))
              : undefined
          }
          getRowKey={(row, index) =>
            `${row.dateOfAccident || "accident"}-${toOriginalIndex(index)}`
          }
          emptyTitle="No accident records added yet."
          emptyDescription="Use Add Record to add details."
        />
      </div>

      {postLoading && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Saving permissions...</span>
          </div>
        </div>
      )}

      <AccidentRegisterFormPopup
        open={isFormOpen && !isViewMode && !postLoading}
        onClose={closeForm}
        initialValue={initialValue}
        mode={currentMode}
        employeeRecordId={employeeRecordId}
        tenantCode={tenantCode}
        employeeSearchUrl={employeeSearchUrl}
        employeeCollectionUrl={employeeCollectionUrl}
        accidentRegisters={accidentRegister}
        editIndex={editIndex}
        refetchAccidents={refetchAccidents}
        onSubmit={handlePopupSubmit}
        disabled={isViewMode}
      />

      {deleteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white border border-red-300 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3 bg-red-50 rounded-t-lg">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <Calendar className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-900">
                  Remove accident record
                </h3>
                <p className="text-[11px] text-red-600 mt-0.5">
                  Are you sure you want to remove this record?
                </p>
              </div>
            </div>
            <div className="px-5 py-4 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={postLoading}
                onClick={() => setDeleteIndex(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={postLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => removeRecord(deleteIndex)}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}

      <DocumentPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        documentPath={previewDoc.path}
        mimeType={previewDoc.mime}
        title={previewDoc.title}
      />
    </div>
  );
}
