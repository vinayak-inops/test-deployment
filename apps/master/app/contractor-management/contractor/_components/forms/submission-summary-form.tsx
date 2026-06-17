"use client";

import { useRef, useState } from "react";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Button } from "@repo/ui/components/ui/button";
import { ClipboardList } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { GradientFormHeader } from "../../../../../components/header/form-header";
import { toast } from "react-toastify";

interface SubmissionSummaryFormProps {
  pendingSectionLabels: string[];
  onFinalSubmit?: () => void;
  finalSubmitting?: boolean;
  canSubmit?: boolean;
  contractorRecordId?: string | null;
  contractorSearchUrl?: string;
  contractorCollectionUrl?: string;
}

const SECTION_HELP_TEXT: Record<string, string> = {
  "Basic Information": "Complete mandatory contractor profile details.",
  "Company Details": "Fill required company and registration details.",
  "Licenses & Permits": "Add all required license and permit information.",
  "Financial Details": "Complete required bank and deposit details.",
  "Address Information": "Fill required address fields.",
  "Documents & Compliance": "Upload required documents and complete compliance fields.",
  "Work Orders": "Add mandatory work order details.",
  "Penalties & Policies": "Complete penalty and policy details.",
};

export function SubmissionSummaryForm({
  pendingSectionLabels,
  onFinalSubmit,
  finalSubmitting = false,
  canSubmit = false,
  contractorRecordId = null,
  contractorSearchUrl = "draft/contractor/search",
  contractorCollectionUrl = "draft/contractor",
}: SubmissionSummaryFormProps) {
  const tenantCode = useGetTenantCode();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const resolvedContractorRecordId = contractorRecordId || id;
  const [contractorData, setContractorData] = useState<Record<string, unknown> | null>(null);
  const contractorRef = useRef<Record<string, unknown> | null>(null);
  const hasPending = pendingSectionLabels.length > 0;

  const { refetch: fetchContractor } = useRequest<any>({
    url: contractorSearchUrl,
    method: "POST",
    data: [
      {
        field: "_id",
        value: resolvedContractorRecordId,
        operator: "eq",
      },
    ],
    onSuccess: (data) => {
      const item =
        Array.isArray(data) && data[0] && data[0].isDeleted !== true ? data[0] : null;
      if (item && typeof item === "object") {
        contractorRef.current = item as Record<string, unknown>;
        setContractorData(item as Record<string, unknown>);
      }
    },
    onError: (error) => {
      console.error("Error fetching contractor data:", error);
    },
    dependencies: [resolvedContractorRecordId, contractorSearchUrl],
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
      void fetchContractor();
    },
    onError: () => {
      toast.error("Error during final submission.");
    },
  });

  const handleInternalFinalSubmit = async () => {
    if (!resolvedContractorRecordId || hasPending) return;

    await fetchContractor();

    const latestContractor = contractorRef.current ?? contractorData ?? {};
    const sanitizedContractorData = Object.fromEntries(
      Object.entries(latestContractor).filter(([key]) => !key.endsWith("tab")),
    );
    const payload = {
      tenant: tenantCode,
      action: "insert",
      id: resolvedContractorRecordId,
      collectionName: "contractor",
      data: {
        ...sanitizedContractorData,
        isVerified: true,
      },
    };
    postFinalSubmission(payload);
  };

  const submitHandler = onFinalSubmit ?? handleInternalFinalSubmit;
  const submitting = onFinalSubmit ? finalSubmitting : internalSubmitting;
  const canSubmitResolved = onFinalSubmit
    ? canSubmit
    : !hasPending && Boolean(resolvedContractorRecordId);

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
            <p className="text-sm font-medium text-amber-800">Complete these tabs first:</p>
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

