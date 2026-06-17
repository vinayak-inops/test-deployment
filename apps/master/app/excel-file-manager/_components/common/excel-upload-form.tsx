"use client";

import React, { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { useDynamicQuery } from "@repo/ui/hooks/api/dynamic-graphql";
import SingleSelectField from "@/components/fields/single-select-field";

type Field = {
  tag: "input" | "selectlist" | "textarea";
  label: string;
  placeholder?: string;
  nameOfExcel?: string;
  setNameOfExcel?: React.Dispatch<React.SetStateAction<string>>;
};

const TextareaField = ({
  descriptionOfExcel,
  setDescriptionOfExcel,
  elem,
}: {
  descriptionOfExcel: string;
  setDescriptionOfExcel: React.Dispatch<React.SetStateAction<string>>;
  elem: Field;
}) => {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor="textarea"
        className="block text-xs font-medium uppercase tracking-wide text-gray-700"
      >
        {elem.label}
      </label>
      <Textarea
        id="textarea"
        value={descriptionOfExcel}
        onChange={(e) => setDescriptionOfExcel(e.target.value)}
        placeholder={elem.placeholder}
        className="min-h-[110px] border-gray-300 text-sm"
      />
    </div>
  );
};

const SelectList = ({
  workFlowName,
  setWorkFlowName,
  elem,
}: {
  workFlowName: string;
  setWorkFlowName: React.Dispatch<React.SetStateAction<string>>;
  elem: Field;
}) => {
  const [workflows, setWorkflows] = useState<any[]>([]);

  const workflowFields = {
    fields: ["_id", "label: name", "value: name", "initialState", "states"],
  };

  const { data, loading, error } = useDynamicQuery(
    workflowFields,
    "workflows",
    "FetchAllWorkflows",
    "fetchAllWorkflows"
  );

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setWorkflows(data);
    }
  }, [data]);

  useEffect(() => {
    if (loading) {
    } else if (error) {
      console.error("Error fetching workflows:", error);
    } else if (workflows.length > 0) {
    }
  }, [loading, error, workflows]);

  return (
    <SingleSelectField
      id="workflow-select"
      label={elem.label}
      required
      placeholder={loading ? "Loading workflows..." : "Select workflow"}
      disabled={loading}
      value={workFlowName}
      onChange={setWorkFlowName}
      options={workflows.map((workflow) => ({
        value: workflow.value,
        label: workflow.label,
      }))}
      errorMessage={error ? "Error loading workflows" : undefined}
    />
  );
};

function ExcelUploadForm({
  descriptionOfExcel,
  setDescriptionOfExcel,
  workFlowName,
  setWorkFlowName,
  excelFileUpload,
  validationError,
  setValidationError,
}: {
  descriptionOfExcel: string;
  setDescriptionOfExcel: React.Dispatch<React.SetStateAction<string>>;
  workFlowName: string;
  setWorkFlowName: React.Dispatch<React.SetStateAction<string>>;
  excelFileUpload: any;
  validationError: string;
  setValidationError: React.Dispatch<React.SetStateAction<string>>;
}) {
  return (
    <div className="rounded-xl space-y-4">

      {[...excelFileUpload.field]
        .sort((a: Field, b: Field) => {
          if (a.tag === "selectlist" && b.tag !== "selectlist") return -1;
          if (a.tag !== "selectlist" && b.tag === "selectlist") return 1;
          return 0;
        })
        .map((elem: any, index: number) => {
          switch (elem.tag) {
            case "selectlist":
              return (
                <div key={index}>
                  <SelectList
                    elem={elem}
                    workFlowName={workFlowName}
                    setWorkFlowName={(value) => {
                      setWorkFlowName(value);
                      setValidationError("");
                    }}
                  />
                  {!workFlowName && validationError === "Please select a workflow" && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {validationError}
                    </p>
                  )}
                </div>
              );
            case "textarea":
              return (
                <div key={index}>
                  <TextareaField
                    elem={elem}
                    descriptionOfExcel={descriptionOfExcel}
                    setDescriptionOfExcel={(value) => {
                      setDescriptionOfExcel(value);
                      if (validationError === "Please enter a description") {
                        setValidationError("");
                      }
                    }}
                  />
                </div>
              );
            default:
              return null;
          }
        })}
    </div>
  );
}

export default ExcelUploadForm;
