"use client";

import type React from "react";

import { Dispatch, SetStateAction, useState } from "react";
import { Upload, FileText, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Progress } from "@repo/ui/components/ui/progress";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { cn } from "@repo/ui/lib/utils";

const MONTH_OPTIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Define sheet data type (kept for compatibility; null for PDF uploads)
interface SheetData {
  [sheetName: string]: any[][];
}

export function FileUploader({
  uploadStatus,
  setUploadStatus,
  setExcelDataTable,
  setExcelFile,
  salMonth,
  setSalMonth,
  salYear,
  setSalYear,
}: {
  uploadStatus: string;
  setUploadStatus: Dispatch<
    SetStateAction<"idle" | "uploading" | "success" | "error">
  >;
  setExcelDataTable: React.Dispatch<React.SetStateAction<SheetData | null>>;
  setExcelFile: any;
  salMonth: string;
  setSalMonth: Dispatch<SetStateAction<string>>;
  salYear: string;
  setSalYear: Dispatch<SetStateAction<string>>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const currentYear = new Date().getFullYear();
  const canUpload = Boolean(salMonth && salYear);
  const YEAR_OPTIONS = Array.from({ length: 21 }, (_, idx) => String(currentYear - 10 + idx));

  const resetUploadedFileState = () => {
    if (uploadStatus !== "idle") {
      setIsUploading(false);
      setUploadStatus("idle");
      setUploadProgress(0);
      setFileName("");
      setExcelDataTable(null);
      setExcelFile(null);
    }
  };

  const handleMonthChange = (month: string) => {
    setSalMonth(month);
    setSelectionError("");
    resetUploadedFileState();
  };

  const handleYearChange = (year: string) => {
    setSalYear(year);
    setSelectionError("");
    resetUploadedFileState();
  };

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
    if (!canUpload) {
      setSelectionError("Please select both month and year before uploading.");
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUpload) {
      setSelectionError("Please select both month and year before uploading.");
      return;
    }
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = (file: File) => {
    setExcelFile(file);

    // Check if file is PDF only
    const validPdfTypes = ["application/pdf"];
    const validPdfExtension = /\.pdf$/i.test(file.name);

    if (!validPdfTypes.includes(file.type) && !validPdfExtension) {
      setExcelFile(null);
      setUploadStatus("error");
      setFileName(
        "Invalid file type. Please upload PDF files only (.pdf)."
      );
      return;
    }

    setFileName(file.name);
    setIsUploading(true);
    setUploadStatus("uploading");
    setExcelDataTable(null); // No sheet data for PDF
    simulateUploadProgress();
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
    setExcelDataTable(null);
    setExcelFile(null);
  };

  return (
    <div
      className={`rounded-lg bg-white px-0 text-sm ${uploadStatus == "success" ? "pb-0" : "pb-0"}`}
    >
      {uploadStatus === "idle" && (
        <div className="mb-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="month-select" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                Month <span className="text-destructive normal-case">*</span>
              </Label>
              <Select value={salMonth || undefined} onValueChange={handleMonthChange}>
                <SelectTrigger
                  id="month-select"
                  className="h-9 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-none transition focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                >
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  align="start"
                  className="z-[250] max-h-44 overflow-y-auto rounded-md border border-gray-200"
                >
                  {MONTH_OPTIONS.map((month) => (
                    <SelectItem key={month} value={month} className="py-2 text-sm">
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year-select" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                Year <span className="text-destructive normal-case">*</span>
              </Label>
              <Select value={salYear || undefined} onValueChange={handleYearChange}>
                <SelectTrigger
                  id="year-select"
                  className="h-9 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-none transition focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                >
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent
                  side="bottom"
                  align="start"
                  className="z-[250] max-h-44 overflow-y-auto rounded-md border border-gray-200"
                >
                  {YEAR_OPTIONS.map((year) => (
                    <SelectItem key={year} value={year} className="py-2 text-sm">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {selectionError && (
            <p className="mt-3 text-xs text-destructive">{selectionError}</p>
          )}
        </div>
      )}

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
            <h3 className="mb-2 text-base font-semibold text-gray-700">Upload your Challan file</h3>
            <p className="mb-4 text-center text-sm text-slate-500">
              Drag and drop Challan PDF files here, or click to browse
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-gray-200 bg-white text-slate-700 hover:bg-gray-50"
              disabled={!canUpload}
              onClick={() => {
                if (!canUpload) {
                  setSelectionError("Please select both month and year before uploading.");
                  return;
                }
                document.getElementById("file-upload")?.click();
              }}
            >
              {canUpload ? "Browse files" : "Select month/year first"}
            </Button>
            <input
              id="file-upload"
              type="file"
              className="hidden"
              accept=".pdf,application/pdf"
              disabled={!canUpload}
              onChange={handleFileChange}
            />
          </>
        )}

        {uploadStatus === "uploading" && (
          <div className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="mr-2 h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">{fileName}</span>
              </div>
              <Button variant="outline" size="sm" className="border-gray-200 bg-white text-slate-700 hover:bg-gray-50" onClick={cancelUpload}>
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
            <p className="mt-2 text-xs text-slate-500">
              PDF file ready for upload
            </p>
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
              className="mt-4"
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
