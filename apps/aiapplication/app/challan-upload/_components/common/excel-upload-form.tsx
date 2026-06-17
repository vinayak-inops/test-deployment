"use client";

import React, { useState } from "react";
import { AlertCircle, Info } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { Alert, AlertDescription } from "@repo/ui/components/ui/alert";

type Field = {
  tag: "input" | "selectlist" | "textarea";
  label: string;
  placeholder?: string;
};

function ExcelUploadForm({
  setOpen,
  nameOfExcel,
  setNameOfExcel,
  descriptionOfExcel,
  setDescriptionOfExcel,
  workFlowName,
  setWorkFlowName,
  handleSave,
  excelFileUpload,
}: {
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  nameOfExcel: string;
  setNameOfExcel: React.Dispatch<React.SetStateAction<string>>;
  descriptionOfExcel: string;
  setDescriptionOfExcel: React.Dispatch<React.SetStateAction<string>>;
  workFlowName: string;
  setWorkFlowName: React.Dispatch<React.SetStateAction<string>>;
  handleSave: () => void;
  excelFileUpload: any;
}) {
  const [validationError, setValidationError] = useState<string>("");

  const validateForm = () => {
    if (!descriptionOfExcel.trim()) {
      setValidationError("Please enter challan description");
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setOpen(false);
      handleSave();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="pt-4">
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-200 px-4 py-3">
          <p className="text-sm font-semibold text-gray-800">Submission Details</p>
          <p className="text-xs text-gray-500">Add a short note before submitting this challan.</p>
        </div>

        <div className="space-y-4 px-4 py-4">
          <Alert className="border-blue-100 bg-blue-50 text-blue-900">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              This description helps identify the upload in status tracking and history.
            </AlertDescription>
          </Alert>

          {excelFileUpload.field.map((elem: Field, index: number) => {
            if (elem.tag !== "textarea") return null;

            return (
              <div key={index} className="space-y-1.5">
                <label
                  htmlFor="challan-description"
                  className="block text-xs font-medium uppercase tracking-wide text-gray-700"
                >
                  {elem.label} <span className="normal-case text-red-500">*</span>
                </label>
                <Textarea
                  id="challan-description"
                  value={descriptionOfExcel}
                  onChange={(e) => {
                    setDescriptionOfExcel(e.target.value);
                    setValidationError("");
                  }}
                  placeholder={elem.placeholder}
                  className={cn(
                    "min-h-[110px] border-gray-300 text-sm",
                    validationError && "border-red-300 focus-visible:ring-red-500"
                  )}
                />
                {validationError && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {validationError}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-4 py-3">
          <Button
            type="button"
            variant="outline"
            className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!descriptionOfExcel.trim()}
            className={cn(
              "font-medium",
              !descriptionOfExcel.trim()
                ? "bg-gray-300 text-gray-500 hover:bg-gray-300"
                : "bg-blue-600 text-white hover:bg-blue-700"
            )}
          >
            Submit
          </Button>
        </div>
      </div>
    </form>
  );
}

export default ExcelUploadForm;
