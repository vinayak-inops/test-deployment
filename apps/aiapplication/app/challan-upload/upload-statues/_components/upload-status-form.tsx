"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useWorkflowSSE } from "@repo/ui/hooks/workflow-management/useWorkflowSSE";
import { DownloadCloud, FileText, Search, Filter } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import SidebarFromHeader from "@/components/header/sidebar-from-header";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import PageNotFound from "@/components/page-notfound";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import AutoStutuesUpdate from "../../_components/auto-stutues-update";
import SSEStatusTimeline from "../../_components/sse-status-timeline";
import ChallanMainPanel from "./challan-main-panel";
import ChallanStatusSidebar from "./challan-status-sidebar";
import ChallanContentPanel from "./challan-content-panel";

const getMimeType = (ext: string) => {
  const mimeTypes: { [key: string]: string } = {
    pdf: "application/pdf",
    excel: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    xls: "application/vnd.ms-excel",
    csv: "text/csv",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    txt: "text/plain",
    json: "application/json",
    xml: "application/xml",
    html: "text/html",
    htm: "text/html",
    rtf: "application/rtf",
    odt: "application/vnd.oasis.opendocument.text",
    ods: "application/vnd.oasis.opendocument.spreadsheet",
    odp: "application/vnd.oasis.opendocument.presentation",
  };

  return mimeTypes[(ext || "").toLowerCase().trim()] || "application/octet-stream";
};

const getFileExtension = (ext: string) => {
  const normalizedExt = (ext || "").toLowerCase().trim();
  if (normalizedExt === "excel") return "xlsx";
  return normalizedExt || "pdf";
};

const resolveFileExtension = (document: any) => {
  const knownExtensions = new Set([
    "pdf",
    "excel",
    "xlsx",
    "xls",
    "csv",
    "doc",
    "docx",
    "txt",
    "json",
    "xml",
    "html",
    "htm",
    "rtf",
    "odt",
    "ods",
    "odp",
  ]);

  const explicitExtension = String(document?.extension || "").toLowerCase().trim();
  if (knownExtensions.has(explicitExtension)) {
    return getFileExtension(explicitExtension);
  }

  const fileName = String(document?.fileName || "").trim();
  if (!fileName.includes(".")) return "pdf";

  const fromName = fileName.split(".").pop()?.toLowerCase().trim() || "";
  if (knownExtensions.has(fromName)) {
    return getFileExtension(fromName);
  }

  return "pdf";
};

const isPathValue = (value: string) => {
  return value.startsWith("/") || value.startsWith("app/");
};

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "N/A";
  const kb = bytes / 1024;
  if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`;
  return `${kb.toFixed(2)} KB`;
};

const formatTableCell = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

type ValidationRow = {
  contributionType: string;
  calculated: unknown;
  fromFile: unknown;
  difference: unknown;
  status: string;
  remarks: string;
};

type ValidationBlock = {
  employeeId: string;
  month: string;
  status: string;
  rows: ValidationRow[];
};

type ViewResponseLoaderProps = {
  lookupId: string;
  requestKey: number;
  onSuccess: (data: any) => void;
  onError: (message: string) => void;
};

const CONTRIBUTION_ORDER = [
  "GROSS (Total Wages)",
  "EE (Employee Contribution)",
  "EPS (Employer Pension)",
  "EPF (Employer PF)",
  "EDLI (Insurance)",
  "ER (Employer Total)",
];

const VALIDATION_SEARCH_FIELDS = [
  { value: "employeeId", label: "Employee ID" },
];

const parseNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    const parsed = Number(cleaned);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const toAmount = (value: unknown) => {
  const num = parseNumber(value);
  if (num === null) return formatTableCell(value);
  return num.toLocaleString("en-IN");
};

const normalizeStatus = (value: unknown) => {
  const text = String(value ?? "").trim().toUpperCase();
  if (!text) return "";
  if (text.includes("MATCH")) return "MATCH";
  if (text.includes("DISCREP")) return "DISCREPANCY";
  if (text.includes("FAIL")) return "FAIL";
  if (text.includes("PASS")) return "PASS";
  return text;
};

const STATUS_FIELD_KEYS = ["status", "overallStatus", "validationStatus", "result"];
const EMPLOYEE_FIELD_KEYS = ["employeeId", "employeeID", "empId", "empID", "employeeCode", "_id"];

const getStatusFromRecord = (record: Record<string, unknown>) => {
  for (const key of STATUS_FIELD_KEYS) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return normalizeStatus(record[key]);
    }
  }
  return "";
};

const getEmployeeIdFromRecord = (record: Record<string, unknown>) => {
  for (const key of EMPLOYEE_FIELD_KEYS) {
    if (record[key] !== undefined && record[key] !== null && record[key] !== "") {
      return String(record[key]);
    }
  }
  return "";
};

const toObject = (value: unknown): Record<string, any> => {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, any>;
  }
  if (typeof value !== "string") return {};

  const trimmed = value.trim();
  if (!trimmed) return {};

  try {
    return JSON.parse(trimmed);
  } catch {
    try {
      // Some payloads come with single quotes. Try a permissive fallback.
      return JSON.parse(trimmed.replace(/'/g, "\""));
    } catch {
      return {};
    }
  }
};

const pickValue = (obj: Record<string, any>, keys: string[]) => {
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") {
      return obj[key];
    }
  }
  return "";
};

const buildValidationBlocks = (payload: any): ValidationBlock[] => {
  const rootItems: any[] = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : payload && typeof payload === "object"
        ? [payload]
        : [];

  return rootItems
    .map((item: any) => {
      const employeeId = String(
        item?.EmployeeId ??
        item?.EmployeeID ??
        "N/A"
      );

      const month = String(
        item?.Returns ??
        (item?.Month && item?.Year ? `${item.Month} ${item.Year}` : item?.Month) ??
        "N/A"
      );

      const blockStatus = normalizeStatus(
        item?.status ?? item?.overallStatus ?? item?.validationStatus ?? "FAIL"
      ) || "FAIL";

      const calculatedObj = toObject(item?.calculated);
      const fileObj = toObject(item?.file);
      const comparisonsObj = toObject(item?.comparisons);

      // Primary path: API shape with calculated/file/comparisons objects.
      let rows: ValidationRow[] = [];
      if (
        Object.keys(calculatedObj).length > 0 ||
        Object.keys(fileObj).length > 0 ||
        Object.keys(comparisonsObj).length > 0
      ) {
        const mappedRows: ValidationRow[] = [
          {
            contributionType: "GROSS (Total Wages)",
            calculated: pickValue(calculatedObj, ["Gross", "gross", "wages", "totalWages"]),
            fromFile: pickValue(fileObj, ["Gross", "gross", "wages", "totalWages"]),
            difference: pickValue(comparisonsObj?.Gross || comparisonsObj?.gross || {}, ["difference", "diff"]),
            status: normalizeStatus(pickValue(comparisonsObj?.Gross || comparisonsObj?.gross || {}, ["status"])) || "",
            remarks: "",
          },
          {
            contributionType: "EE (Employee Contribution)",
            calculated: pickValue(calculatedObj, ["EE", "ee", "e", "employeeContribution"]),
            fromFile: pickValue(fileObj, ["EE", "ee", "e", "employeeContribution"]),
            difference: pickValue(comparisonsObj?.EE || comparisonsObj?.ee || {}, ["difference", "diff"]),
            status: normalizeStatus(pickValue(comparisonsObj?.EE || comparisonsObj?.ee || {}, ["status"])) || "",
            remarks: "",
          },
          {
            contributionType: "EPS (Employer Pension)",
            calculated: pickValue(calculatedObj, ["EPS", "eps", "employerPension"]),
            fromFile: pickValue(fileObj, ["EPS", "eps", "employerPension"]),
            difference: pickValue(comparisonsObj?.EPS || comparisonsObj?.eps || {}, ["difference", "diff"]),
            status: normalizeStatus(pickValue(comparisonsObj?.EPS || comparisonsObj?.eps || {}, ["status"])) || "",
            remarks: "",
          },
          {
            contributionType: "EPF (Employer PF)",
            calculated: pickValue(calculatedObj, ["EPF", "epf", "employerPF"]),
            fromFile: pickValue(fileObj, ["ER", "er", "employerPF"]),
            difference: pickValue(comparisonsObj?.EPF || comparisonsObj?.epf || {}, ["difference", "diff"]),
            status: normalizeStatus(pickValue(comparisonsObj?.EPF || comparisonsObj?.epf || {}, ["status"])) || "",
            remarks: "",
          },
          {
            contributionType: "EDLI (Insurance)",
            calculated: pickValue(calculatedObj, ["EDLI", "edli", "insurance"]),
            fromFile: pickValue(fileObj, ["EDLI", "edli", "insurance"]),
            difference: pickValue(comparisonsObj?.EDLI || comparisonsObj?.edli || {}, ["difference", "diff"]),
            status: normalizeStatus(pickValue(comparisonsObj?.EDLI || comparisonsObj?.edli || {}, ["status"])) || "",
            remarks: "",
          },
          {
            contributionType: "ER (Employer Total)",
            calculated: pickValue(calculatedObj, ["ER_TOTAL", "erTotal", "ER", "employerTotal", "total"]),
            fromFile: pickValue(fileObj, ["ER_TOTAL", "employerTotal", "ER", "er", "erTotal"]),
            difference: pickValue(comparisonsObj?.ER_TOTAL || comparisonsObj?.erTotal || comparisonsObj?.er || {}, ["difference", "diff"]),
            status: normalizeStatus(
              pickValue(comparisonsObj?.ER_TOTAL || comparisonsObj?.erTotal || comparisonsObj?.ER || comparisonsObj?.er || {}, ["status"])
            ) || "",
            remarks: "",
          },
        ];

        rows = mappedRows.map((r) => {
          const calcNum = parseNumber(r.calculated);
          const fileNum = parseNumber(r.fromFile);
          const explicitDiff = parseNumber(r.difference);
          const difference = explicitDiff !== null ? explicitDiff : (calcNum !== null && fileNum !== null ? fileNum - calcNum : "");
          const status = normalizeStatus(r.status) || (parseNumber(difference) === 0 ? "MATCH" : "DISCREPANCY");
          const remarks = status === "MATCH" ? "Verified" : `Variance of ${toAmount(difference)}`;
          return { ...r, difference, status, remarks };
        });
      } else {
        // Fallback path for already-flattened row arrays.
        const listLikeEntry = Object.values(item || {}).find(
          (val: unknown) =>
            Array.isArray(val) &&
            val.length > 0 &&
            typeof val[0] === "object" &&
            !Array.isArray(val[0])
        ) as any[] | undefined;

        const sourceRows: any[] = Array.isArray(item?.rows)
          ? item.rows
          : Array.isArray(item?.details)
            ? item.details
            : Array.isArray(item?.contributions)
              ? item.contributions
              : Array.isArray(item?.validationDetails)
                ? item.validationDetails
                : Array.isArray(listLikeEntry)
                  ? listLikeEntry
                  : [];

        rows = sourceRows.map((r: any) => {
          const calculated =
            r?.calculated ??
            r?.calculatedValue ??
            r?.expected ??
            r?.systemValue ??
            r?.amount;
          const fromFile =
            r?.fromFile ??
            r?.fileValue ??
            r?.uploadedValue ??
            r?.actual ??
            r?.value;
          const difference =
            r?.difference ??
            r?.diff ??
            (() => {
              const c = parseNumber(calculated);
              const f = parseNumber(fromFile);
              return c !== null && f !== null ? f - c : "";
            })();
          const rowStatus = normalizeStatus(
            r?.status ?? r?.result ?? (parseNumber(difference) === 0 ? "MATCH" : "DISCREPANCY")
          ) || "DISCREPANCY";

          return {
            contributionType: String(
              r?.contributionType ??
              r?.type ??
              r?.component ??
              r?.head ??
              r?.name ??
              "N/A"
            ),
            calculated,
            fromFile,
            difference,
            status: rowStatus,
            remarks: String(
              r?.remarks ??
              r?.remark ??
              (rowStatus === "MATCH" ? "Verified" : `Variance of ${toAmount(difference)}`)
            ),
          };
        });
      }

      const orderedRows: ValidationRow[] = [
        ...CONTRIBUTION_ORDER.map((label) => rows.find((r) => r.contributionType === label)).filter(Boolean) as ValidationRow[],
        ...rows.filter((r) => !CONTRIBUTION_ORDER.includes(r.contributionType)),
      ];

      return {
        employeeId,
        month,
        status: blockStatus,
        rows: orderedRows,
      };
    })
    .filter((block) => block.rows.length > 0);
};

function ViewResponseLoader({
  lookupId,
  requestKey,
  onSuccess,
  onError,
}: ViewResponseLoaderProps) {
  useRequest<any>({
    url: `map/Challan/search?fileId=${lookupId}`,
    method: "GET",
    dependencies: [lookupId, requestKey],
    onSuccess,
    onError: (error: any) => {
      onError(error?.message || "Failed to load challan validation data.");
    },
  });

  return null;
}

export default function UploadStatusForm() {
  const [open, setOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [fullPageView, setFullPageView] = useState(false);
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);
  const [viewerType, setViewerType] = useState<string>("pdf");
  const [apiViewerData, setApiViewerData] = useState<any>(null);
  const [apiViewerError, setApiViewerError] = useState<string | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [selectedStatusTab, setSelectedStatusTab] = useState("ALL");
  const [employeeSearchInput, setEmployeeSearchInput] = useState("");
  const [employeeSearchApplied, setEmployeeSearchApplied] = useState("");
  const [viewRequestKey, setViewRequestKey] = useState(0);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParams = useSearchParams();
  const fileId = searchParams.get("id");
  const lookupId = fileId ?? "";
  const { workflows } = useWorkflowSSE();

  useEffect(() => {
    if (fileId) {
      setOpen(true);
    }
  }, [fileId]);

  useEffect(() => {
    if (!lookupId) return;

    setViewLoading(true);
    setApiViewerError(null);
    setApiViewerData(null);
    setSelectedStatusTab("ALL");
    setEmployeeSearchInput("");
    setEmployeeSearchApplied("");

    if (viewerUrl) {
      window.URL.revokeObjectURL(viewerUrl);
    }

    setViewerUrl(null);
    setViewerOpen(false);
    setViewerType("json");
    setFullPageView(true);
    setViewRequestKey((current) => current + 1);
  }, [lookupId]);

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "challan",
    screenName: "challanUpload",
  });
  const excelUpload = rolePermissions?.view || false;

  const {
    data: challanResponse,
    loading: docLoading,
  } = useRequest<any>({
    url: `map/challan/search?_id=${lookupId}`,
    method: "GET",
    dependencies: [lookupId],
    onError: (error: any) => {
      console.error("Error loading challan data:", error);
    },
  });

  const { data: workflowManagementResponse } = useRequest<any>({
    url: `map/workflow_management/search?fileId=${lookupId}`,
    method: "GET",
    dependencies: [lookupId],
    onError: (error: any) => {
      console.error("Error loading workflow management data:", error);
    },
  });

  const challanDocument = useMemo(() => {
    if (!challanResponse) return null;
    if (Array.isArray(challanResponse)) return challanResponse[0] || null;
    if (Array.isArray((challanResponse as any)?.data)) return (challanResponse as any).data[0] || null;
    if ((challanResponse as any)?.data && !Array.isArray((challanResponse as any)?.data)) return (challanResponse as any).data;
    return challanResponse as any;
  }, [challanResponse]);

  const derivedSalMonth = useMemo(() => {
    if (!challanDocument) return null;
    if (challanDocument.salMonth) return challanDocument.salMonth;
    const path = challanDocument.filePath || challanDocument.path || challanDocument.documentPath || challanDocument.reportPath;
    if (!path || typeof path !== "string") return null;
    const parts = path.split(/[/\\]+/).filter(Boolean);
    return parts.length >= 2 ? parts[parts.length - 2] : null;
  }, [challanDocument]);

  const fileSource = useMemo(() => {
    if (!challanDocument) return "";
    return (
      challanDocument.file ||
      challanDocument.report ||
      challanDocument.filePath ||
      challanDocument.path ||
      challanDocument.documentPath ||
      challanDocument.reportPath ||
      ""
    );
  }, [challanDocument]);

  const displayFilePath = useMemo(() => {
    return (
      challanDocument?.filePath ||
      challanDocument?.path ||
      challanDocument?.documentPath ||
      challanDocument?.reportPath ||
      "N/A"
    );
  }, [challanDocument]);

  const fileExt = useMemo(() => {
    return resolveFileExtension(challanDocument);
  }, [challanDocument]);

  const hasFile = Boolean(fileSource && typeof fileSource === "string" && fileSource.trim() !== "");

  const formattedFileSize = useMemo(() => {
    const rawSize =
      challanDocument?.fileSize ??
      challanDocument?.size ??
      challanDocument?.file_size ??
      challanDocument?.contentLength;

    if (rawSize !== null && rawSize !== undefined && rawSize !== "") {
      if (typeof rawSize === "string" && /kb|mb|gb|bytes?/i.test(rawSize)) {
        return rawSize;
      }
      const numericSize = Number(rawSize);
      if (Number.isFinite(numericSize) && numericSize > 0) {
        return formatBytes(numericSize);
      }
    }

    // Fallback: derive approximate size from base64 content
    if (typeof fileSource === "string" && fileSource && !isPathValue(fileSource)) {
      const cleaned = fileSource.replace(/\s/g, "");
      const padding = cleaned.endsWith("==") ? 2 : cleaned.endsWith("=") ? 1 : 0;
      const estimatedBytes = Math.max(0, Math.floor((cleaned.length * 3) / 4) - padding);
      return formatBytes(estimatedBytes);
    }

    return "N/A";
  }, [challanDocument, fileSource]);

  const formattedCreatedOn = useMemo(() => {
    if (!challanDocument?.createdOn) return "N/A";
    const dt = new Date(challanDocument.createdOn);
    if (Number.isNaN(dt.getTime())) return "N/A";
    return dt.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }, [challanDocument?.createdOn]);

  const apiTableData = useMemo(() => {
    if (!apiViewerData) return { rows: [] as Record<string, unknown>[], columns: [] as string[] };

    const rawRows = Array.isArray(apiViewerData)
      ? apiViewerData
      : Array.isArray((apiViewerData as any)?.data)
        ? (apiViewerData as any).data
        : typeof apiViewerData === "object"
          ? [apiViewerData]
          : [];

    const rows: Record<string, unknown>[] = rawRows
      .filter((item: unknown) => item && typeof item === "object" && !Array.isArray(item))
      .map((item: unknown) => item as Record<string, unknown>);

    const columns: string[] = Array.from(
      new Set(
        rows.reduce((acc: string[], row: Record<string, unknown>) => {
          acc.push(...Object.keys(row));
          return acc;
        }, [])
      )
    );

    return { rows, columns };
  }, [apiViewerData]);

  const validationBlocks = useMemo(() => buildValidationBlocks(apiViewerData), [apiViewerData]);
  const hasValidationBlocks = validationBlocks.length > 0;

  const statusTabsFromBlocks = useMemo(() => {
    const statuses = Array.from(
      new Set(
        validationBlocks
          .map((block) => normalizeStatus(block.status))
          .filter((status) => Boolean(status))
      )
    );
    return ["ALL", ...statuses];
  }, [validationBlocks]);

  const statusTabsFromRows = useMemo(() => {
    const statuses = Array.from(
      new Set(
        apiTableData.rows
          .map((row) => getStatusFromRecord(row))
          .filter((status) => Boolean(status))
      )
    );
    return ["ALL", ...statuses];
  }, [apiTableData.rows]);

  const activeStatusTabs = hasValidationBlocks ? statusTabsFromBlocks : statusTabsFromRows;

  useEffect(() => {
    if (!activeStatusTabs.includes(selectedStatusTab)) {
      setSelectedStatusTab("ALL");
    }
  }, [activeStatusTabs, selectedStatusTab]);

  const normalizedEmpSearch = employeeSearchApplied.trim().toUpperCase();
  const selectedValidationFieldLabel = useMemo(() => {
    return VALIDATION_SEARCH_FIELDS.find((field) => field.value === "employeeId")?.label.toLowerCase() || "employee id";
  }, []);

  const employeeFilteredValidationBlocks = useMemo(() => {
    return validationBlocks.filter((block) => {
      return !normalizedEmpSearch || block.employeeId.toUpperCase().includes(normalizedEmpSearch);
    });
  }, [validationBlocks, normalizedEmpSearch]);

  const employeeFilteredApiRows = useMemo(() => {
    return apiTableData.rows.filter((row) => {
      const rowEmployeeId = getEmployeeIdFromRecord(row).toUpperCase();
      return !normalizedEmpSearch || rowEmployeeId.includes(normalizedEmpSearch);
    });
  }, [apiTableData.rows, normalizedEmpSearch]);

  const filteredValidationBlocks = useMemo(() => {
    return employeeFilteredValidationBlocks.filter((block) => {
      const normalizedBlockStatus = normalizeStatus(block.status);
      return selectedStatusTab === "ALL" || normalizedBlockStatus === selectedStatusTab;
    });
  }, [employeeFilteredValidationBlocks, selectedStatusTab]);

  const filteredApiRows = useMemo(() => {
    return employeeFilteredApiRows.filter((row) => {
      const rowStatus = getStatusFromRecord(row);
      return selectedStatusTab === "ALL" || rowStatus === selectedStatusTab;
    });
  }, [employeeFilteredApiRows, selectedStatusTab]);

  const statusCountMap = useMemo(() => {
    const map = new Map<string, number>();
    if (hasValidationBlocks) {
      for (const block of employeeFilteredValidationBlocks) {
        const status = normalizeStatus(block.status) || "UNKNOWN";
        map.set(status, (map.get(status) || 0) + 1);
      }
      map.set("ALL", employeeFilteredValidationBlocks.length);
    } else {
      for (const row of employeeFilteredApiRows) {
        const status = getStatusFromRecord(row) || "UNKNOWN";
        map.set(status, (map.get(status) || 0) + 1);
      }
      map.set("ALL", employeeFilteredApiRows.length);
    }
    return map;
  }, [hasValidationBlocks, employeeFilteredValidationBlocks, employeeFilteredApiRows]);

  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setEmployeeSearchApplied(employeeSearchInput.trim());
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [employeeSearchInput]);

  const workflowReportPath = useMemo(() => {
    const raw =
      Array.isArray(workflowManagementResponse)
        ? workflowManagementResponse
        : Array.isArray((workflowManagementResponse as any)?.data)
          ? (workflowManagementResponse as any).data
          : (workflowManagementResponse as any)
            ? [workflowManagementResponse as any]
            : [];

    // Prefer the latest record if there are many
    const ordered = [...raw].sort((a: any, b: any) => {
      const aTime = new Date(a?.createdOn || a?.timestamp || 0).getTime();
      const bTime = new Date(b?.createdOn || b?.timestamp || 0).getTime();
      return bTime - aTime;
    });

    const reportValue = ordered.find((item: any) => typeof item?.report === "string" && item.report.trim())?.report;
    if (typeof reportValue !== "string") return "";

    // Requirement: use path from workflow_management.report field.
    // If report is already a path, use it directly.
    if (isPathValue(reportValue)) return reportValue;
    return "";
  }, [workflowManagementResponse]);

  const { fetchByteArray, loading: fileLoading } = useByteToBase64({
    onError: (error) => {
      console.error("Error fetching file:", error);
    },
  });

  const getFileBytes = async () => {
    if (!hasFile || typeof fileSource !== "string") {
      throw new Error("No file data available.");
    }

    if (isPathValue(fileSource)) {
      const fileType = getMimeType(fileExt);
      const result = await fetchByteArray(fileSource, fileType);
      if (!result.success || !result.bytes) {
        throw new Error("Failed to fetch file bytes.");
      }
      return Uint8Array.from(result.bytes);
    }

    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(fileSource)) {
      throw new Error("Invalid base64 string format.");
    }
    const binary = atob(fileSource);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const handleDownloadFile = async () => {
    try {
      // Primary flow: fetch report file using workflow_management.report path
      if (workflowReportPath) {
        const reportFileName =
          workflowReportPath.split("/").filter(Boolean).pop() || "verification-report.pdf";
        const reportExtension = getFileExtension(reportFileName.split(".").pop() || "pdf");
        const reportResult = await fetchByteArray(workflowReportPath, getMimeType(reportExtension));
        if (!reportResult.success || !reportResult.bytes) {
          throw new Error(reportResult.error || "Failed to fetch report file.");
        }

        const reportBlob = new Blob([Uint8Array.from(reportResult.bytes)], {
          type: getMimeType(reportExtension),
        });
        if (reportBlob.size === 0) {
          throw new Error("Downloaded report is empty.");
        }

        const reportUrl = window.URL.createObjectURL(reportBlob);
        const reportLink = window.document.createElement("a");
        reportLink.href = reportUrl;
        reportLink.download = reportFileName;
        window.document.body.appendChild(reportLink);
        reportLink.click();
        window.document.body.removeChild(reportLink);
        window.URL.revokeObjectURL(reportUrl);
        return;
      }

      // Fallback: existing challan file download flow
      const bytes = await getFileBytes();
      const blob = new Blob([bytes], { type: getMimeType(fileExt) });
      if (blob.size === 0) {
        throw new Error("Generated file is empty.");
      }
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = `${(challanDocument?.fileName || "challan").split(".")[0]}.${getFileExtension(fileExt)}`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
      alert(`Failed to download file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const closeViewer = () => {
    if (viewerUrl) {
      window.URL.revokeObjectURL(viewerUrl);
    }
    setViewerOpen(false);
    setViewerUrl(null);
  };

  const closeFullPageView = () => {
    setFullPageView(false);
    setApiViewerData(null);
    setApiViewerError(null);
    setViewerType("pdf");
  };

  if (!fileId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-base font-semibold text-gray-800 mb-2">No File ID Provided</h2>
          <p className="text-gray-600">Please provide a file ID in the URL query parameters.</p>
        </div>
      </div>
    );
  }

  const safeFileId: string = fileId;

  if (!excelUpload) {
    return <PageNotFound />;
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col overflow-hidden text-sm">
        <div className="flex-shrink-0">
          <SidebarFromHeader
            title={challanDocument?.fileName?.split(".")[0] || "Challan Upload"}
            description={`Selected challan - ${fileExt.toUpperCase()}`}
            canAdd={Boolean(workflowReportPath || hasFile)}
            onAddNew={handleDownloadFile}
            addButtonText={docLoading ? "Updating..." : "Download Challan"}
          />
        </div>

        <div className="flex-1 min-h-0 flex overflow-hidden">
          <div className="w-full max-w-[1400px] mx-auto flex flex-1 min-h-0 overflow-hidden px-4 py-4 gap-6">
            <ChallanMainPanel
              fullPageView={fullPageView}
              challanDocument={challanDocument}
              fileExt={fileExt}
              derivedSalMonth={derivedSalMonth}
              formattedCreatedOn={formattedCreatedOn}
              viewLoading={viewLoading}
              apiViewerError={apiViewerError}
              viewerType={viewerType}
              activeStatusTabs={activeStatusTabs}
              selectedStatusTab={selectedStatusTab}
              setSelectedStatusTab={setSelectedStatusTab}
              statusCountMap={statusCountMap}
              validationSearchFields={VALIDATION_SEARCH_FIELDS}
              selectedValidationFieldLabel={selectedValidationFieldLabel}
              employeeSearchInput={employeeSearchInput}
              setEmployeeSearchInput={setEmployeeSearchInput}
              hasValidationBlocks={hasValidationBlocks}
              filteredValidationBlocks={filteredValidationBlocks}
              apiTableData={apiTableData}
              filteredApiRows={filteredApiRows}
              apiViewerData={apiViewerData}
              normalizeStatus={normalizeStatus}
              parseNumber={parseNumber}
              toAmount={toAmount}
              formatTableCell={formatTableCell}
            />

            <ChallanStatusSidebar
              open={open}
              safeFileId={safeFileId}
              setOpen={setOpen}
              workflows={workflows}
              rolePermissions={rolePermissions}
            />
          </div>
        </div>
      </div>

      {viewRequestKey > 0 && (
        <ViewResponseLoader
          key={viewRequestKey}
          lookupId={lookupId}
          requestKey={viewRequestKey}
          onSuccess={(data) => {
            setApiViewerData(data);
            setApiViewerError(null);
            setViewerType("json");
            setFullPageView(true);
            setViewLoading(false);
          }}
          onError={(message) => {
            console.error("Error viewing file:", message);
            setApiViewerError(message);
            setApiViewerData(null);
            setViewerType("text");
            setFullPageView(true);
            setViewLoading(false);
          }}
        />
      )}
    </>
  );
}
