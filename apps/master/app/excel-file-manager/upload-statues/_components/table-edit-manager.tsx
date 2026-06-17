"use client";

import { openDB } from "idb";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { useByteToBase64 } from "@/hooks/api/file-handle/useByteToBase64";
import ExcelContentPanel from "./excel-content-panel";
import ExcelErrorView from "./excel-error-view";
import ExcelValidationView from "./excel-validation-view";

type OrganizationErrorRecord = {
  employeeID?: string;
  parseID?: string;
  missingData?: {
    reason?: string[];
    sheet?: string;
  };
};

function TableEditManager({ paramsValue: _paramsValue, setOpen }: { paramsValue: string, setOpen: (open: boolean) => void }) {
  const [data, setData] = useState<any[]>([]);
  const [excelData, setExcelData] = useState<any>({});
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const searchParams = useSearchParams();
  const fileId = searchParams.get('id');
  const like = fileId;
  const { fetchByteArray } = useByteToBase64();

  const setParsedExcelData = (decodedData: { data: Record<string, any[]> } | null) => {
    if (!decodedData?.data) return;

    setExcelData(decodedData);
    const sheetNames = Object.keys(decodedData.data);
    if (sheetNames.length > 0) {
      setSelectedSheet(sheetNames[0]);
    }
  };

  const getFileSource = (document: any) => {
    return document?.file || document?.filePath || document?.path || document?.documentPath || "";
  };

  const isServerPath = (value: string) => {
    return value.startsWith("/") || value.startsWith("app/");
  };

  const getMimeType = (ext: string) => {
    const normalizedExt = ext.toLowerCase().trim();
    if (normalizedExt === "xls") return "application/vnd.ms-excel";
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  };

  const loadExcelFromDocument = async (document: any) => {
    const fileSource = getFileSource(document);
    if (!fileSource || typeof fileSource !== "string") return;

    if (isServerPath(fileSource)) {
      const extension = String(document?.extension || document?.fileName?.split(".").pop() || "xlsx");
      const result = await fetchByteArray(fileSource, getMimeType(extension));
      if (result.success && result.bytes) {
        setParsedExcelData(decodeExcelData(result.bytes));
      }
      return;
    }

    setParsedExcelData(decodeExcelData(fileSource));
  };

  // Hook for fetching file data
  const { data: searchData, loading: isFetching, error: fetchError, refetch } = useRequest<any[]>({
    url: `map/files/search?_id=${fileId}`,
    method: 'GET',
    onSuccess: (data) => {
      if (data && data[0]) {
        loadExcelFromDocument(data[0]);
      }
    },
    onError: (error) => {
      console.error("Search Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        error: error.response?.data
      });
      alert("Failed to fetch file data. Please try again.");
    },
    dependencies: [fileId]
  });

  const {
    data: errorFileData,
    loading: errorLoading,
    error: errorFileError,
    refetch: refetchErrorFile,
  } = useRequest<any>({
    url: "upload_row_errors/search",
    method: "POST",
    data: [
      {
        field: "fileId",
        operator: "eq",
        value: fileId,
      },
    ],
    onSuccess: (data) => {
    },
    onError: (error) => {
      console.error("Error fetching organization data:", error);
    },
    dependencies: [fileId],
  });

  const excelDocument = searchData && searchData[0] ? searchData[0] : null;
  const fileExt = String(excelDocument?.extension || excelDocument?.fileName?.split(".").pop() || "xlsx")
    .toLowerCase()
    .trim();
  const formattedCreatedOn = excelDocument?.createdOn
    ? new Date(excelDocument.createdOn).toLocaleString()
    : "N/A";

  useEffect(() => {
    refetch()
    refetchErrorFile()
  }, [])

  // Function to decode base64 and parse Excel data
  const decodeExcelData = (excelSource: string | Uint8Array | ArrayBuffer) => {
    try {
      const bytes =
        typeof excelSource === "string"
          ? Uint8Array.from(atob(excelSource), (character) => character.charCodeAt(0))
          : excelSource instanceof ArrayBuffer
            ? new Uint8Array(excelSource)
            : excelSource;

      const workbook = XLSX.read(bytes, { type: "array" });
      // Convert all sheets to JSON
      const data: Record<string, any[]> = {};
      workbook.SheetNames.forEach((sheetName) => {
        data[sheetName] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
      });
      return { data };
    } catch (error) {
      console.error("Error decoding Excel data:", error);
      return null;
    }
  };

  useEffect(() => {
    const excelData = async () => {
      await loadNotes();
    };
    excelData();
  }, []);

  useEffect(() => {
    const updateValue = data.filter((nodes) => {
      return nodes[0].like == like;
    });
    const fileData = updateValue[0]?.[0];
    if (!fileData?.data) return;

    setExcelData(fileData);
    const sheetNames = fileData?.data ? Object.keys(fileData.data) : [];
    if (sheetNames.length > 0) {
      setSelectedSheet(sheetNames[0]);
    }
  }, [data]);

  const loadNotes = async () => {
    try {
      const db = await openDB("excelDataDB", 1);
      const allNotes = await db.getAll("excelData");
      setData(allNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  const normalizedErrorRows = (() => {
    const records = Array.isArray(errorFileData)
      ? errorFileData
      : Array.isArray(errorFileData?.data)
        ? errorFileData.data
        : errorFileData
          ? [errorFileData]
          : [];

    return records.flatMap((record: { errors?: OrganizationErrorRecord[] }) => {
      const errors = Array.isArray(record?.errors) ? record.errors : [];
      return errors.map((item) => ({
        employeeID: item.employeeID || "",
        parseID: item.parseID || "",
        sheet: item.missingData?.sheet || "",
        reasons: Array.isArray(item.missingData?.reason) ? item.missingData.reason : [],
      }));
    });
  })();

  // If no fileId is provided, show a message
  if (!fileId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No File ID Provided</h2>
          <p className="text-gray-600">Please provide a file ID in the URL query parameters.</p>
          <p className="text-sm text-gray-500 mt-2">Example: /excel-edit?mode=all&id=67d274aab51380a9d3e40dc1</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="max-full">
        <ExcelContentPanel
          excelDocument={excelDocument}
          fileExt={fileExt}
          formattedCreatedOn={formattedCreatedOn}
          isFetching={isFetching}
          fetchError={fetchError}
          onOpenStatus={() => setOpen(true)}
        />

        <ExcelErrorView
          errorRows={normalizedErrorRows}
          loading={errorLoading}
          errorMessage={errorFileError?.message || null}
        />

        {/* Excel Data Section */}
        {excelData?.data && (
          <ExcelValidationView
            excelData={excelData.data}
            selectedSheet={selectedSheet}
            setSelectedSheet={setSelectedSheet}
          />
        )}
      </div>
    </div>
  );
}

export default TableEditManager;
