"use client";

import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { ClipboardList } from "lucide-react";
import { GradientFormHeader } from "../../../../../components/header/form-header";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { toast } from "react-toastify";

interface SubmissionSummaryFormProps {
  pendingSectionLabels: string[];
  onFinalSubmit?: () => void;
  finalSubmitting?: boolean;
  canSubmit?: boolean;
  employeeRecordId?: string | null;
  employeeSearchUrl?: string;
  employeeCollectionUrl?: string;
  finalSubmissionUrl?: string;
  targetCollectionName?: string;
}

const SECTION_HELP_TEXT: Record<string, string> = {
  "Personal Information": "Complete mandatory identity and basic profile details.",
  "Contact & Address": "Fill required contact numbers, emails, and address fields.",
  "Employment Details": "Provide required job, department, and employment data.",
  "Bus Details": "Complete required transport and route assignment details.",
  "Bank & Identity": "Fill mandatory bank account and identity information.",
  "Documents & Verification": "Upload required documents and complete verification fields.",
  "Family & Dependents": "Add required family, nominee, and dependent information.",
  "Education & Experience": "Provide required education and work experience records.",
  "Training & Assets": "Complete required training, asset, and policy entries.",
  "Work Order": "Add mandatory work order information and dates.",
  "Medical & Safety": "Fill required medical, safety, and accident details.",
  "Police Verification": "Complete mandatory police verification information.",
  "Actions Workflow": "Fill required action, penalty, bonus, and advance details.",
};

export function SubmissionSummaryForm({
  pendingSectionLabels,
  onFinalSubmit,
  finalSubmitting = false,
  canSubmit = false,
  employeeRecordId = null,
  employeeSearchUrl = "draft/contract_employee/search",
  employeeCollectionUrl = "validate",
  finalSubmissionUrl = "draft/contract_employee",
  targetCollectionName = "contract_employee",
}: SubmissionSummaryFormProps) {
  const tenantCode = useGetTenantCode();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const resolvedEmployeeRecordId = employeeRecordId || id;
  const [employeeData, setEmployeeData] = useState<Record<string, unknown> | null>(null);
  const employeeRef = useRef<Record<string, unknown> | null>(null);
  const hasPending = pendingSectionLabels.length > 0;

  const { refetch: fetchEmployee } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [
      {
        field: "_id",
        value: resolvedEmployeeRecordId,
        operator: "eq",
      },
    ],
    onSuccess: (data) => {
      const item =
        Array.isArray(data) && data[0] && data[0].isDeleted !== true ? data[0] : null;
      if (item && typeof item === "object") {
        employeeRef.current = item as Record<string, unknown>;
        setEmployeeData(item as Record<string, unknown>);
      }
    },
    onError: (error) => {
      console.error("Error fetching employee data:", error);
    },
    dependencies: [resolvedEmployeeRecordId, employeeSearchUrl],
  });

  const { post: postFinalSubmission, loading: internalSubmitting } = usePostRequest<any>({
    url: "validate/maker-checker",
    onSuccess: (response) => {
      const responseData =
        response?.data && typeof response.data === "object" ? response.data : response;
      const businessStatus =
        responseData && typeof responseData === "object"
          ? (responseData as { status?: boolean }).status
          : undefined;

      if (businessStatus === false) {
        toast.error("Final submission failed. Please check required tabs.");
        return;
      }

      toast.success("Final submission completed successfully.");
      void fetchEmployee();
    },
    onError: (error) => {
      toast.error("Error during final submission.");
    },
  });

  const handleInternalFinalSubmit = async () => {
    if (!resolvedEmployeeRecordId || hasPending) return;

    await fetchEmployee();

    const latestEmployee = employeeRef.current ?? employeeData ?? {};
    const sanitizedEmployeeData = Object.fromEntries(
      Object.entries(latestEmployee).filter(([key]) => !key.endsWith("tab")),
    );
    const payload = {
      tenant: tenantCode,
      action: "insert",
      id: resolvedEmployeeRecordId,
      collectionName: targetCollectionName,
      data: {
        ...sanitizedEmployeeData,
        isVerified: true,
      },
    };
    postFinalSubmission(payload);
  };

  const submitHandler = onFinalSubmit ?? handleInternalFinalSubmit;
  const submitting = onFinalSubmit ? finalSubmitting : internalSubmitting;
  const canSubmitResolved = onFinalSubmit
    ? canSubmit
    : !hasPending && Boolean(resolvedEmployeeRecordId);

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      <GradientFormHeader
        icon={ClipboardList}
        title="Submission"
        description="Review incomplete tabs before final submission"
      />
      <CardContent className="px-6 py-4">
        {hasPending ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">
              Complete these tabs first:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-amber-900 space-y-2">
              {pendingSectionLabels.map((label) => (
                <li key={label}>
                  <p className="font-medium">{label}</p>
                  <p className="text-xs text-amber-800">
                    {SECTION_HELP_TEXT[label] || "Complete all required fields in this tab."}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              All required tabs are complete. You can proceed with submission.
            </div>
            <Button
              type="button"
              onClick={submitHandler}
              disabled={!canSubmitResolved || submitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {submitting ? "Submitting..." : "Final Submit"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
