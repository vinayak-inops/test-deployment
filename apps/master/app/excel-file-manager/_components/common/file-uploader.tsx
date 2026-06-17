"use client";

import type React from "react";

import { Dispatch, SetStateAction, useState } from "react";
import { Upload, FileSpreadsheet, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Progress } from "@repo/ui/components/ui/progress";
import { cn } from "@repo/ui/lib/utils";
import * as XLSX from "xlsx";

// Define sheet data type
interface SheetData {
  [sheetName: string]: any[][];
}

export function FileUploader({
  uploadStatus,
  setUploadStatus,
  setExcelDataTable,
  setExcelFile,
}: {
  uploadStatus: string;
  setUploadStatus: Dispatch<
    SetStateAction<"idle" | "uploading" | "success" | "error">
  >;
  setExcelDataTable: React.Dispatch<React.SetStateAction<SheetData | null>>;
  setExcelFile: any;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [excelData, setExcelData] = useState<SheetData | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setExcelFile(files[0]);
      handleFileUpload(files[0]);
    }
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    // Check if file is Excel only
    const validExcelTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validExcelTypes.includes(file.type)) {
      setUploadStatus("error");
      setFileName(
        "Invalid file type. Please upload Excel files only (.xlsx or .xls)."
      );
      return;
    }

    setFileName(file.name);
    setIsUploading(true);
    setUploadStatus("uploading");

    // Parse the Excel file
    parseExcelFile(file);
  };

  const parseExcelFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        let sheetData = {};
        const allSheetData: Record<string, any[][]> = {};
        workbook.SheetNames.forEach((sheetName) => {
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(sheet, {
            header: 1,
          }) as any[][];

          if (jsonData.length > 0) {
            allSheetData[sheetName] = jsonData;
          }
        });
        sheetData = allSheetData;

        if (Object.keys(sheetData).length === 0) {
          setUploadStatus("error");
          setFileName(
            "The uploaded Excel file is empty or contains no valid data."
          );
          setExcelData(null);
        } else {
          setExcelData(sheetData);
          setExcelDataTable(sheetData);
          simulateUploadProgress();
        }
      } catch (err) {
        console.error("Error parsing Excel file:", err);
        setUploadStatus("error");
        setFileName(
          "Error parsing Excel file. Please make sure it's a valid Excel file."
        );
        setExcelData(null);
        setIsUploading(false);
      }
    };

    reader.onerror = () => {
      setUploadStatus("error");
      setFileName("Error reading the file. Please try again.");
      setExcelData(null);
      setIsUploading(false);
    };

    reader.readAsArrayBuffer(file);
  };

  const simulateUploadProgress = () => {
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setUploadStatus("success");
      }
    }, 150);
  };

  const cancelUpload = () => {
    setIsUploading(false);
    setUploadStatus("idle");
    setUploadProgress(0);
    setFileName("");
    setExcelData(null);
  };

  return (
    <div
      className={`rounded-lg bg-white px-0 text-sm ${uploadStatus == "success" ? "pb-0" : "pb-0"}`}
    >
      <div
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-slate-50 p-4 transition-all",
          isDragging && "border-primary bg-primary/5",
          uploadStatus === "error" && "border-destructive bg-destructive/5"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploadStatus === "idle" && (
          <>
            <div className="mb-0 rounded-full bg-primary/10 p-3">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-gray-700">Upload your Excel file</h3>
            <p className="mb-4 text-center text-sm text-slate-500">
              Drag and drop Excel files here, or click to browse
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-gray-200 bg-white text-slate-700 hover:bg-gray-50"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              Browse files
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
            />
          </>
        )}

        {uploadStatus === "uploading" && (
          <div className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <FileSpreadsheet className="mr-2 h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">{fileName}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-200 bg-white text-slate-700 hover:bg-gray-50"
                onClick={cancelUpload}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            <p className="mt-2 text-right text-xs text-slate-500">
              {uploadProgress}%
            </p>
          </div>
        )}

        {uploadStatus === "success" && (
          <div className="flex flex-col items-center">
            <div className="mb-2 rounded-full bg-emerald-100 p-2">
              <Check className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-emerald-600">
              Upload complete!
            </p>
            <p className="mt-1 text-xs text-slate-500">{fileName}</p>
            {excelData && (
              <div className="mt-2 text-center">
                <p className="text-xs text-slate-500">
                  Successfully parsed {Object.keys(excelData).length} sheets
                  from Excel file
                </p>
                <p className="text-xs text-slate-500">
                  Total rows:{" "}
                  {Object.values(excelData).reduce(
                    (total, sheet) => total + sheet.length,
                    0
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="flex flex-col items-center">
            <div className="mb-2 rounded-full bg-destructive/10 p-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <p className="text-center text-sm font-medium text-destructive">
              {fileName}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 border-gray-200 bg-white text-slate-700 hover:bg-gray-50"
              onClick={() => setUploadStatus("idle")}
            >
              Try again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}