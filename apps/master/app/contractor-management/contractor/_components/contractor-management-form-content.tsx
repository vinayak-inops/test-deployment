"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { BasicInformationForm } from "./forms/basic-information-form";
import { CompanyDetailsForm } from "./forms/company-details-form";
import { LicensesPermitsForm } from "./forms/licenses-permits-form";
import { FinancialDetailsForm } from "./forms/financial-details-form";
import { AddressInformationForm } from "./forms/address-information-form";
import { DocumentsComplianceForm } from "./forms/documents-compliance-form";
import { WorkOrdersForm } from "./forms/work-orders-form";
import { PenaltiesPoliciesForm } from "./forms/penalties-policies-form";
import { SubmissionSummaryForm } from "./forms/submission-summary-form";
import { Sidebar } from "@/components/fields/sidebar-local";
import { SectionIncompleteNote } from "@/components/fields/section-incomplete-note";
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure";
import { useDynamicTabVisibility } from "@/hooks/form-functions/useDynamicTabVisibility";
import { useTabControl, type TabSectionId } from "./hooks/useTabControl";

export type Mode = "add" | "edit" | "view";
type SectionId = TabSectionId;

const SECTION_TAB_KEYS: Record<SectionId, string[]> = {
  basic: ["basicInformation"],
  company: ["companyDetails"],
  licenses: ["license"],
  financial: ["bankDetail", "securityDeposit"],
  address: ["addressInformation"],
  documents: ["document"],
  workorders: ["workOrder"],
  penalties: ["penalty", "wcPolicy"],
  submission: [],
};

const SECTION_LABELS: Record<SectionId, string> = {
  basic: "Basic Information",
  company: "Company Details",
  licenses: "Licenses & Permits",
  financial: "Financial Details",
  address: "Address Information",
  documents: "Documents & Compliance",
  workorders: "Work Orders",
  penalties: "Penalties & Policies",
  submission: "Submission",
};

const TAB_KEY_ALIASES: Record<string, string[]> = {
  basicInformation: ["basicInformation"],
  companyDetails: ["companyDetails", "companyDetail"],
  license: ["license", "licenses"],
  bankDetail: ["bankDetail", "bankDetails"],
  securityDeposit: ["securityDeposit", "securityDeposits"],
  addressInformation: ["addressInformation"],
  document: ["document", "documents"],
  workOrder: ["workOrder", "workOrders"],
  penalty: ["penalty", "penalties"],
  wcPolicy: ["wcPolicy", "wcPolicies"],
};

interface ContractorManagementFormContentProps {
  contractorResponse?: any;
  mode: Mode;
  contractorRecordId: string | null;
  contractorSearchUrl: string;
  contractorCollectionUrl: string;
  onRefresh?: () => void;
}

export function ContractorManagementFormContent({
  contractorResponse,
  mode,
  contractorRecordId,
  contractorSearchUrl,
  contractorCollectionUrl,
  onRefresh,
}: ContractorManagementFormContentProps) {
  const searchParams = useSearchParams();
  const isDraftForm = searchParams.get("form") === "temp";

  const { formStructure, loading: formStructureLoading } = useCollectionFormStructure({
    collectionName: "contractor_form_strcture",
  });

  const { tabVisibility, sectionOrder, sidebarSections } = useTabControl(formStructure, isDraftForm);
  const dynamicTabVisibility = useDynamicTabVisibility(formStructure as Record<string, unknown> | null);

  const fetchedDraftTabVisibility = useMemo<Record<string, unknown> | null>(() => {
    const row = Array.isArray(contractorResponse) ? contractorResponse[0] : null;
    return row && typeof row === "object" ? (row as Record<string, unknown>) : null;
  }, [contractorResponse]);

  const [activeTab, setActiveTab] = useState<SectionId>(() => sectionOrder[0] ?? "basic");
  const [basicFormRefreshKey, setBasicFormRefreshKey] = useState(0);

  useEffect(() => {
    if (sectionOrder.length === 0) return;
    if (!sectionOrder.includes(activeTab)) {
      setActiveTab(sectionOrder[0]);
    }
  }, [activeTab, sectionOrder]);

  const getLocalStatusValue = (tabKey: string) => {
    const keysToCheck = TAB_KEY_ALIASES[tabKey] ?? [tabKey];
    for (const key of keysToCheck) {
      const singularKey = key.endsWith("s") ? key.slice(0, -1) : key;
      const status = dynamicTabVisibility[key] ?? dynamicTabVisibility[singularKey];
      if (status) return status.value;
    }
    return true;
  };

  const getFetchedStatusValue = (tabKey: string) => {
    if (!fetchedDraftTabVisibility) return false;
    if (fetchedDraftTabVisibility.isVerified === true) return true;

    const keysToCheck = TAB_KEY_ALIASES[tabKey] ?? [tabKey];
    const backendKeys = keysToCheck.flatMap((key) => {
      const singularKey = key.endsWith("s") ? key.slice(0, -1) : key;
      return [key, singularKey, `${key}tab`, `${singularKey}tab`];
    });

    for (const key of backendKeys) {
      const status = fetchedDraftTabVisibility[key];
      if (typeof status === "boolean") {
        return status;
      }
    }

    return false;
  };

  const isTabKeyPending = (key: string) => {
    const localStatus = getLocalStatusValue(key);
    const fetchedStatus = getFetchedStatusValue(key);
    return localStatus === false && fetchedStatus === false;
  };

  const sectionPendingMap = useMemo<Record<SectionId, boolean>>(
    () =>
      sectionOrder.reduce(
        (acc, sectionId) => {
          if (!isDraftForm) {
            acc[sectionId] = false;
            return acc;
          }
          if (sectionId === "submission") {
            acc[sectionId] = Object.entries(acc).some(([id, isPending]) => id !== "submission" && isPending);
            return acc;
          }
          const keys = SECTION_TAB_KEYS[sectionId] ?? [];
          acc[sectionId] = keys.some((key) => isTabKeyPending(key));
          return acc;
        },
        {} as Record<SectionId, boolean>,
      ),
    [sectionOrder, isDraftForm, dynamicTabVisibility, fetchedDraftTabVisibility],
  );

  const resolvedSidebarSections = useMemo(
    () =>
      sidebarSections.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          state: sectionPendingMap[item.id as SectionId] ? ("warning" as const) : ("default" as const),
        })),
      })),
    [sidebarSections, sectionPendingMap],
  );

  const renderSectionIncompleteNote = (sectionId: SectionId) =>
    sectionPendingMap[sectionId] ? (
      <SectionIncompleteNote
        title="Section Incomplete"
        description={`Please fill all required fields in the "${SECTION_LABELS[sectionId]}" tab.`}
      />
    ) : null;

  const pendingSectionLabels = useMemo(
    () =>
      sectionOrder
        .filter((sectionId) => sectionId !== "submission" && (sectionPendingMap[sectionId] ?? false))
        .map((sectionId) => SECTION_LABELS[sectionId]),
    [sectionOrder, sectionPendingMap],
  );

  const handleNextTab = () => {
    const i = sectionOrder.indexOf(activeTab);
    if (i >= 0 && i < sectionOrder.length - 1) {
      setActiveTab(sectionOrder[i + 1]);
    }
  };

  const handlePreviousTab = () => {
    const i = sectionOrder.indexOf(activeTab);
    if (i > 0) {
      setActiveTab(sectionOrder[i - 1]);
    }
  };

  const handleTabClick = (tabValue: string) => {
    if (sectionOrder.includes(tabValue as SectionId)) {
      setActiveTab(tabValue as SectionId);
    }
  };

  const handleSectionSaved = () => {
    // Keep current tab mounted; refresh parent only for draft warning-state recalculation.
    if (isDraftForm) {
      onRefresh?.();
    }
  };

  const activeTabIndex = sectionOrder.indexOf(activeTab);
  const hasPreviousTab = activeTabIndex > 0;
  const hasNextTab = activeTabIndex >= 0 && activeTabIndex < sectionOrder.length - 1;
  const record = Array.isArray(contractorResponse) ? contractorResponse[0] : null;
  const recordId = record?._id || "new";

  const isEmptyFormStructure =
    !formStructure ||
    (Array.isArray(formStructure) && formStructure.length === 0) ||
    (!Array.isArray(formStructure) && Object.keys(formStructure).length === 0);

  if (formStructureLoading || isEmptyFormStructure) {
    return null;
  }

  return (
    <div className="space-y-0 max-w-7xl mx-auto">
      <div className="flex gap-6">
        <div className="sticky top-4 self-start">
          <Sidebar
            sections={resolvedSidebarSections}
            activeId={activeTab}
            colorClasses={{
              default: "text-gray-700 hover:bg-gray-100",
              active: "bg-blue-100 text-blue-900",
              warning: "text-red-700 bg-red-50 hover:bg-red-100",
              activeWarning: "bg-red-100 text-red-800",
            }}
            onItemClick={(id) => handleTabClick(id as string)}
          />
        </div>

        <main className="flex-1 min-w-0">
          <div className="space-y-6 py-4">
            {activeTab === "basic" && (
              <>
                {renderSectionIncompleteNote("basic")}
                <BasicInformationForm
                  key={`basic-${recordId}-${mode}-${basicFormRefreshKey}`}
                  employeeRecordId={contractorRecordId}
                  onNextTab={handleNextTab}
                  onPreviousTab={handlePreviousTab}
                  mode={mode}
                  employeeSearchUrl={contractorSearchUrl}
                  contractorCollectionUrl={contractorCollectionUrl}
                  onSaved={handleSectionSaved}
                />
              </>
            )}

            {activeTab === "company" && (
              <>
                {renderSectionIncompleteNote("company")}
                <CompanyDetailsForm
                  employeeRecordId={contractorRecordId}
                  onNextTab={handleNextTab}
                  onPreviousTab={handlePreviousTab}
                  mode={mode}
                  employeeSearchUrl={contractorSearchUrl}
                  contractorCollectionUrl={contractorCollectionUrl}
                  onSaved={handleSectionSaved}
                />
              </>
            )}

            {activeTab === "licenses" && (
              <LicensesPermitsForm
                employeeRecordId={contractorRecordId}
                mode={mode}
                employeeSearchUrl={contractorSearchUrl}
                contractorCollectionUrl={contractorCollectionUrl}
                sectionError={isTabKeyPending("license")}
                onSaved={handleSectionSaved}
              />
            )}

            {activeTab === "financial" && (
              <FinancialDetailsForm
                employeeRecordId={contractorRecordId}
                mode={mode}
                employeeSearchUrl={contractorSearchUrl}
                contractorCollectionUrl={contractorCollectionUrl}
                showBankDetail={tabVisibility.bankDetail}
                showSecurityDeposit={tabVisibility.securityDeposit}
                sectionErrors={{
                  bankDetail: isTabKeyPending("bankDetail"),
                  securityDeposit: isTabKeyPending("securityDeposit"),
                }}
                onSaved={handleSectionSaved}
              />
            )}

            {activeTab === "address" && (
              <>
                {renderSectionIncompleteNote("address")}
                <AddressInformationForm
                  employeeRecordId={contractorRecordId}
                  onPreviousTab={handlePreviousTab}
                  mode={mode}
                  employeeSearchUrl={contractorSearchUrl}
                  contractorCollectionUrl={contractorCollectionUrl}
                  onSaved={handleSectionSaved}
                />
              </>
            )}

            {activeTab === "documents" && (
              <DocumentsComplianceForm
                employeeRecordId={contractorRecordId}
                mode={mode}
                employeeSearchUrl={contractorSearchUrl}
                contractorCollectionUrl={contractorCollectionUrl}
                sectionError={isTabKeyPending("document")}
                onSaved={handleSectionSaved}
              />
            )}

            {activeTab === "workorders" && (
              <WorkOrdersForm
                employeeRecordId={contractorRecordId}
                mode={mode}
                employeeSearchUrl={contractorSearchUrl}
                contractorCollectionUrl={contractorCollectionUrl}
                sectionError={isTabKeyPending("workOrder")}
                onSaved={handleSectionSaved}
              />
            )}

            {activeTab === "penalties" && (
              <PenaltiesPoliciesForm
                employeeRecordId={contractorRecordId}
                mode={mode}
                employeeSearchUrl={contractorSearchUrl}
                contractorCollectionUrl={contractorCollectionUrl}
                showPenalty={tabVisibility.penalty}
                showWcPolicy={tabVisibility.wcPolicy}
                sectionErrors={{
                  penalty: isTabKeyPending("penalty"),
                  wcPolicy: isTabKeyPending("wcPolicy"),
                }}
                onSaved={handleSectionSaved}
              />
            )}

            {activeTab === "submission" && isDraftForm && (
              <SubmissionSummaryForm
                pendingSectionLabels={pendingSectionLabels}
                contractorRecordId={contractorRecordId}
                contractorSearchUrl={contractorSearchUrl}
              />
            )}
          </div>

          <div className="pt-2 pb-6">
            <div className="flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handlePreviousTab}
                disabled={!hasPreviousTab}
                className="px-3 py-1.5 h-8 text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 disabled:opacity-100 disabled:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              {hasNextTab && (
                <Button
                  type="button"
                  onClick={handleNextTab}
                  className="px-3 py-1.5 h-8 text-sm bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
