"use client";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import FileTableManager from "./file-table-manager";
import FilesAndAssets from "./common/files-and-assets";
import { FileUploader } from "./common/file-uploader";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useSession } from "next-auth/react";
import PageNotFound from "@/components/page-notfound";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";
import { AlertCircle, Info, X } from "lucide-react";

interface UploadResponse {
  _id: string;
  [key: string]: any;
}

interface Permission {
  view: boolean;
  upload: boolean;
}

function PageControler() {
  const [excelDataTable, setExcelDataTable] = useState<any | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [descriptionOfExcel, setDescriptionOfExcel] = useState("");
  const [validationError, setValidationError] = useState("");
  const [salMonth, setSalMonth] = useState("");
  const [salYear, setSalYear] = useState("");
  const { data: session } = useSession();
  const tenantCode = useGetTenantCode();

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "challan",
    screenName: "challanUpload",
  });

  const canView = rolePermissions?.view || false;
  const canUpload = rolePermissions?.upload || false;

  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const router = useRouter();

  const resetPopupState = () => {
    setExcelDataTable(null);
    setExcelFile(null);
    setDescriptionOfExcel("");
    setValidationError("");
    setSalMonth("");
    setSalYear("");
    setUploadStatus("idle");
  };

  const handleSetOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    if (typeof value === "function") {
      setOpen((prev) => {
        const next = value(prev);
        if (!next) resetPopupState();
        return next;
      });
      return;
    }
    setOpen(value);
    if (!value) resetPopupState();
  };

  const { post, loading } = usePostRequest<UploadResponse>({
    url: "challanUpload",
    files: excelFile || undefined,
    headers: {
      "X-workflow": "CHALLAN_VERIFICATION",
      "X-Tenant": tenantCode,
      "X-user": session?.user?.name || "user",
      "X-description": descriptionOfExcel,
      "X-collection": "challan",
    },
    data: salYear ? { salYear } : undefined,
    salMonth: salMonth ? salMonth.toLowerCase() : "",
    onSuccess: (responseData) => {
      if (responseData._id) {
        router.push(`/challan-upload/upload-statues?mode=all&id=${responseData._id}`);
      }
    },
    onError: (error) => {
      console.error("Upload Error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        error: error.response?.data,
      });
      alert("File upload failed. Please try again.");
    },
    onProgress: () => {},
  });
  void loading;

  function handleSave() {
    if (!excelFile) return;
    post();
  }

  const handlePopupSubmit = () => {
    if (uploadStatus !== "success") return;
    if (!descriptionOfExcel.trim()) {
      setValidationError("Please enter challan description");
      return;
    }
    setValidationError("");
    handleSetOpen(false);
    handleSave();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleSetOpen(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) handleSetOpen(false);
    };

    if (open) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!canView) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <PageNotFound />
      </div>
    );
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={handleBackdropClick}
        >
          <Card className="w-full max-w-lg">
            <CardHeader className="border-b border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-700">Challan Upload</CardTitle>
                  <p className="text-xs text-gray-500">
                    Upload a challan PDF, add description, and we will extract the data for reconciliation and reporting.
                  </p>
                </div>
                <button
                  onClick={() => handleSetOpen(false)}
                  className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Close popup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 px-6 py-4 ">
              <Alert className="border-0 p-0 text-xs text-gray-600 [&>svg]:left-0 [&>svg]:top-0.5 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-gray-500 [&>svg~*]:pl-5 flex item-center">
                <Info />
                <AlertDescription className="m-0">
                  Select salary period, upload PDF
                </AlertDescription>
              </Alert>

              <FileUploader
                uploadStatus={uploadStatus}
                setUploadStatus={setUploadStatus}
                setExcelDataTable={setExcelDataTable}
                setExcelFile={(file: File | null) => setExcelFile(file)}
                salMonth={salMonth}
                setSalMonth={setSalMonth}
                salYear={salYear}
                setSalYear={setSalYear}
              />

              {uploadStatus === "success" && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Challan Description <span className="normal-case text-red-500">*</span>
                  </label>
                  <Textarea
                    value={descriptionOfExcel}
                    onChange={(e) => {
                      setDescriptionOfExcel(e.target.value);
                      setValidationError("");
                    }}
                    placeholder="Enter a description for this challan upload"
                    className="min-h-[100px] border-gray-300 text-sm"
                  />
                  {validationError && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {validationError}
                    </p>
                  )}
                </div>
              )}
            </CardContent>

            <CardFooter className="justify-end gap-2 border-t border-gray-200 px-6 py-3">
              <Button
                variant="outline"
                className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                onClick={() => handleSetOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-blue-600 text-white hover:bg-blue-700"
                onClick={handlePopupSubmit}
                disabled={loading || uploadStatus !== "success"}
              >
                {loading ? "Submitting..." : "Submit"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <div
        className="flex-1 overflow-y-auto scroll-hidden"
        style={
          {
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          } as React.CSSProperties
        }
      >
        <FileTableManager
          permission={{ view: canView, upload: canUpload }}
          onGenerateReport={() => handleSetOpen(true)}
        />
      </div>

      {/* <div className="w-[360px] px-0 right-0 top-0 h-full pl-4 border-gray-200 z-10">
        <FilesAndAssets
          setOpen={handleSetOpen}
          permission={
            {
              view: canView,
              upload: canUpload,
            } as Permission
          }
        />
      </div> */}
    </>
  );
}

export default PageControler;
