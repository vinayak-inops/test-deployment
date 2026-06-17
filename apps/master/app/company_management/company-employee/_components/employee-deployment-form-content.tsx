"use client";

import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "@/components/fields/sidebar-local";
import { SectionIncompleteNote } from "@/components/fields/section-incomplete-note";
import { BasicInformationForm } from "./forms/basic-information-form";
import { EmploymentDetailsForm } from "./forms/employment-details-form";
import { SubmissionSummaryForm } from "./forms/submission-summary-form";
import { useSearchParams } from "next/navigation";
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure";
import { useDynamicTabVisibility } from "@/hooks/form-functions/useDynamicTabVisibility";

export type Mode = "add" | "edit" | "view";
type SectionId = "basic" | "employeeDeployment" | "submission";

const SECTION_ORDER: SectionId[] = ["basic", "employeeDeployment", "submission"];
const SECTION_LABELS: Record<SectionId, string> = {
  basic: "Basic Information",
  employeeDeployment: "Employee Deployment",
  submission: "Submission",
};

const SECTION_TAB_KEYS: Record<SectionId, string[]> = {
  basic: ["basicInformation", "basicInfo"],
  employeeDeployment: ["employmentDetails"],
  submission: [],
};

const TAB_KEY_ALIASES: Record<string, string[]> = {
  basicInformation: ["basicInformation", "basicInfo"],
  employmentDetails: ["employmentDetails"],
};

interface EmployeeDeploymentFormContentProps {
  employeeResponse?: any;
  mode: Mode;
  employeeRecordId: string | null;
  employeeSearchUrl: string;
  employeeCollectionUrl: string;
  onRefresh?: () => void;
}

export function EmployeeDeploymentFormContent({
  employeeResponse,
  mode,
  employeeRecordId,
  employeeSearchUrl,
  employeeCollectionUrl,
  onRefresh,
}: EmployeeDeploymentFormContentProps) {
  const searchParams = useSearchParams();
  const isDraftForm = searchParams.get("form") === "temp";
  const showWarningState = isDraftForm;

  const { formStructure } = useCollectionFormStructure({
    collectionName: "company_employee_form_structure",
  });
  const dynamicTabVisibility = useDynamicTabVisibility(formStructure as Record<string, unknown> | null);

  const [activeSection, setActiveSection] = useState<SectionId>("basic");
  const visibleSectionOrder = useMemo<SectionId[]>(
    () => (showWarningState ? SECTION_ORDER : SECTION_ORDER.filter((s) => s !== "submission")),
    [showWarningState],
  );

  const fetchedDraftTabVisibility = useMemo<Record<string, unknown> | null>(() => {
    const row = Array.isArray(employeeResponse) ? employeeResponse[0] : null;
    return row && typeof row === "object" ? (row as Record<string, unknown>) : null;
  }, [employeeResponse]);

  useEffect(() => {
    if (!visibleSectionOrder.includes(activeSection)) {
      setActiveSection("basic");
    }
  }, [activeSection, visibleSectionOrder]);

  const getFetchedStatusValue = (tabKey: string) => {
    if (!fetchedDraftTabVisibility) return false;
    if (fetchedDraftTabVisibility.isVerified === true) return true;

    const singularKey = tabKey.endsWith("s") ? tabKey.slice(0, -1) : tabKey;
    const backendKeys = [tabKey, singularKey, `${tabKey}tab`, `${singularKey}tab`];
    for (const key of backendKeys) {
      const status = fetchedDraftTabVisibility[key];
      if (typeof status === "boolean") return status;
    }
    return false;
  };

  const getLocalStatusValue = (tabKey: string) => {
    const keysToCheck = TAB_KEY_ALIASES[tabKey] ?? [tabKey];
    for (const key of keysToCheck) {
      const singularKey = key.endsWith("s") ? key.slice(0, -1) : key;
      const status = dynamicTabVisibility[key] ?? dynamicTabVisibility[singularKey];
      if (status) return status.value;
    }
    return true;
  };

  const sectionPendingMap = useMemo<Record<SectionId, boolean>>(
    () =>
      visibleSectionOrder.reduce((acc, sectionId) => {
        if (!showWarningState) {
          acc[sectionId] = false;
          return acc;
        }
        if (sectionId === "submission") {
          acc[sectionId] = Object.entries(acc).some(([id, isPending]) => id !== "submission" && isPending);
          return acc;
        }
        acc[sectionId] = (SECTION_TAB_KEYS[sectionId] || []).some((key) => {
          const localStatus = getLocalStatusValue(key);
          const fetchedStatus = getFetchedStatusValue(key);
          return localStatus === false && fetchedStatus === false;
        });
        return acc;
      }, {} as Record<SectionId, boolean>),
    [showWarningState, fetchedDraftTabVisibility, dynamicTabVisibility, visibleSectionOrder],
  );

  const pendingSectionLabels = useMemo(
    () =>
      visibleSectionOrder
        .filter((sectionId) => sectionId !== "submission" && (sectionPendingMap[sectionId] ?? false))
        .map((sectionId) => SECTION_LABELS[sectionId]),
    [sectionPendingMap, visibleSectionOrder],
  );

  const sidebarSections = useMemo(
    () => [
      {
        items: [
          {
            id: "basic",
            label: "Basic Information",
            icon: "user-circle",
            state: sectionPendingMap.basic ? ("warning" as const) : ("default" as const),
          },
          {
            id: "employeeDeployment",
            label: "Employee Deployment",
            icon: "briefcase",
            state: sectionPendingMap.employeeDeployment ? ("warning" as const) : ("default" as const),
          },
          ...(showWarningState
            ? [
                {
                  id: "submission" as const,
                  label: "Submission",
                  icon: "clipboard-list",
                  state: sectionPendingMap.submission ? ("warning" as const) : ("default" as const),
                },
              ]
            : []),
        ],
      },
    ],
    [sectionPendingMap, showWarningState],
  );

  const renderSectionIncompleteNote = (sectionId: SectionId) =>
    sectionPendingMap[sectionId] ? (
      <SectionIncompleteNote
        title="Section Incomplete"
        description={`Please fill all required fields in the "${SECTION_LABELS[sectionId]}" tab.`}
      />
    ) : null;

  const handleSectionSaved = () => {
    if (showWarningState) {
      onRefresh?.();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex gap-6">
        <div className="sticky top-0 self-start">
          <Sidebar
            sections={sidebarSections}
            activeId={activeSection}
            colorClasses={{
              default: "text-gray-700 hover:bg-gray-100",
              active: "bg-blue-100 text-blue-900",
              warning: "text-red-700 bg-red-50 hover:bg-red-100",
              activeWarning: "bg-red-100 text-red-800",
            }}
            onItemClick={(sectionId) => setActiveSection(sectionId as SectionId)}
          />
        </div>

        <main className="flex-1 min-w-0">
          <div className="space-y-6 pb-4">
            {activeSection === "basic" && (
              <>
                {renderSectionIncompleteNote("basic")}
                <BasicInformationForm
                  employeeRecordId={employeeRecordId}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                  onSaved={handleSectionSaved}
                  key={`basic-${employeeRecordId || "new"}-${mode}`}
                />
              </>
            )}

            {activeSection === "employeeDeployment" && (
              <>
                {renderSectionIncompleteNote("employeeDeployment")}
                <EmploymentDetailsForm
                  employeeRecordId={employeeRecordId}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                  onSaved={handleSectionSaved}
                  key={`employee-deployment-${employeeRecordId || "new"}-${mode}`}
                />
              </>
            )}

            {activeSection === "submission" && showWarningState && (
              <SubmissionSummaryForm
                pendingSectionLabels={pendingSectionLabels}
                employeeRecordId={employeeRecordId}
                employeeSearchUrl={employeeSearchUrl}
                employeeCollectionUrl={employeeCollectionUrl}
                finalSubmissionUrl="draft/company_employee"
                targetCollectionName="company_employee"
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
