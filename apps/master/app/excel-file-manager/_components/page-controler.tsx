"use client";
import { SheetData } from "@/type/excel-file-manager/excel-file-manager";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { openDB } from "idb";
import FileTableManager from "./file-table-manager";
import ExcelUploadForm from "./common/excel-upload-form";
import { FileUploader } from "./common/file-uploader";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useSession } from "next-auth/react";
import PageNotFound from "@/components/page-notfound";
import SidebarFromHeader from "@/components/header/sidebar-from-header";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";
import { Info, X } from "lucide-react";
import ActionButtons from "@/components/common/action-buttons";
import { cn } from "@repo/ui/lib/utils";

interface UploadResponse {
  _id: string;
  [key: string]: any;
}

function PageControler() {
  const [excelData, setExcelData] = useState<any[]>([]);
  const [, setExcelDataTable] = useState<SheetData | null>(null);
  const [open, setOpen] = useState<boolean>(false);
  const [workflowname, setWorkFlowName] = useState("");
  const [excelFile, setExcelFile] = useState<any | null>(null);
  const [descriptionOfExcel, setDescriptionOfExcel] = useState("");
  const [validationError, setValidationError] = useState("");
  const { data: session } = useSession();
  const tenantCode = useGetTenantCode();

  const contractorEmployee = "excelFileManager";

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "excelUpload",
    screenName: contractorEmployee,
  });

  const excelUpload = rolePermissions?.excelUpload || false;

  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const router = useRouter();

  const resetPopupState = () => {
    setExcelDataTable(null);
    setExcelFile(null);
    setWorkFlowName("");
    setDescriptionOfExcel("");
    setValidationError("");
    setUploadStatus("idle");
  };

  const handleSetOpen = (value: boolean | ((prev: boolean) => boolean)) => {
    if (typeof value === "function") {
      setOpen((prev) => {
        const newValue = value(prev);
        if (!newValue) {
          resetPopupState();
        }
        return newValue;
      });
    } else {
      setOpen(value);
      if (!value) {
        resetPopupState();
      }
    }
  };

  const { post } = usePostRequest<UploadResponse>({
    url: "fileupload",
    files: excelFile,
    headers: {
      "X-workflow": workflowname,
      "X-Tenant": tenantCode,
      "X-user": session?.user?.name || "user",
      "X-description": descriptionOfExcel,
    },
    onSuccess: (responseData) => {
      if (responseData._id) {
        router.push(`/excel-file-manager/upload-statues?mode=all&id=${responseData._id}`);
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
    onProgress: (progress) => { },
  });

  function handleSave() {
    if (!excelFile) {
      return;
    }

    post();
  }

  const handlePopupSubmit = () => {
    if (!workflowname) {
      setValidationError("Please select a workflow");
      return;
    }
    setValidationError("");
    handleSetOpen(false);
    handleSave();
  };

  useEffect(() => {
    const initDB = async () => {
      try {
        const db = await openDB("excelDataDB", 1, {
          upgrade(db) {
            if (!db.objectStoreNames.contains("excelData")) {
              const store = db.createObjectStore("excelData", {
                keyPath: "id",
                autoIncrement: true,
              });
              store.createIndex("title", "title", { unique: false });
              store.createIndex("createdAt", "createdAt", { unique: false });
            }
          },
        });
        await loadNotes();
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    };
    initDB();
  }, []);

  const loadNotes = async () => {
    try {
      const db = await openDB("excelDataDB", 1);
      const allNotes = await db.getAll("excelData");
      let processedData: any[] = [];
      allNotes.forEach((note: any) => {
        const { data, ...rest } = note[0];
        processedData.push(rest);
      });
      setExcelData(processedData);
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  const excelFileUpload = {
    field: [
      {
        label: "Excel File Description",
        tag: "textarea",
        placeholder: "Rename the excel file",
      },
      {
        label: "WorkFlow",
        tag: "selectlist",
        placeholder: "",
      },
    ],
    button: {
      text: "Submit",
    },
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleSetOpen(false);
    }
  };

  return (
    <>
      {excelUpload ? (
        <div className="flex h-full min-h-0 flex-col overflow-hidden text-sm w-full">
          <div className="flex-shrink-0">
            <SidebarFromHeader
              title="Excel File Manager"
              description="Manage Excel uploads and start a new file processing workflow."
              canAdd={excelUpload}
              addButtonText="Upload Excel File"
              onAddNew={() => handleSetOpen(true)}
            />
          </div>

          {open && excelUpload && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
              onClick={handleBackdropClick}
            >
              <Card className="flex w-full max-w-lg max-h-[80vh] flex-col overflow-hidden">
                <CardHeader className="shrink-0 border-b border-gray-200 bg-white px-6 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-gray-700">Excel File Uploader</CardTitle>
                      <p className="text-xs text-gray-500">
                        Upload an Excel file, validate format, preview data, and submit for processing.
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

                <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
                  <Alert className="border-0 p-0 text-xs text-gray-600 [&>svg]:left-0 [&>svg]:top-0.5 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-gray-500 [&>svg~*]:pl-5 flex item-center">
                    <Info />
                    <AlertDescription className="m-0">
                      Upload an Excel file and then complete the required workflow details.
                    </AlertDescription>
                  </Alert>

                  <FileUploader
                    uploadStatus={uploadStatus}
                    setUploadStatus={setUploadStatus}
                    setExcelDataTable={setExcelDataTable}
                    setExcelFile={(file: File | null) => setExcelFile(file)}
                  />
                  {uploadStatus === "success" && (
                    <ExcelUploadForm
                      workFlowName={workflowname}
                      setWorkFlowName={setWorkFlowName}
                      excelFileUpload={excelFileUpload}
                      descriptionOfExcel={descriptionOfExcel}
                      setDescriptionOfExcel={setDescriptionOfExcel}
                      validationError={validationError}
                      setValidationError={setValidationError}
                    />
                  )}
                </CardContent>

                {uploadStatus === "success" && (
                  <CardFooter className="shrink-0 justify-end border-t border-gray-200 bg-white px-6 py-3">
                    {validationError && (
                      <div className="mr-auto rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                        {validationError}
                      </div>
                    )}
                    <ActionButtons
                      layout="end"
                      secondaryLabel="Cancel"
                      onSecondary={() => handleSetOpen(false)}
                      primaryLabel="Submit"
                      onPrimary={handlePopupSubmit}
                      primaryDisabled={!workflowname}
                      className="w-full"
                      primaryClassName={cn(
                        "h-9 min-w-[96px] px-4 font-medium",
                        !workflowname
                          ? "bg-gray-300 text-gray-500 hover:bg-gray-300"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      )}
                      secondaryClassName="h-9 min-w-[96px] bg-gray-200 hover:bg-gray-300 text-gray-800"
                    />
                  </CardFooter>
                )}
              </Card>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-hidden">
            <div className="mx-auto flex h-full w-full max-w-[1400px] overflow-hidden px-4 py-4">
              <div
                className="h-full w-full overflow-y-auto scroll-hidden"
                style={{
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                } as React.CSSProperties}
              >
                <FileTableManager excelData={excelData} permission={{ excelUpload: excelUpload }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full w-full flex items-center justify-center">
          <PageNotFound />
        </div>
      )}
    </>
  );
}

export default PageControler;