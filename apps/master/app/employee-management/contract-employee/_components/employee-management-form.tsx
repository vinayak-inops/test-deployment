"use client";

import { useEffect, useMemo, useState } from "react";
import { PersonalInformationForm } from "./forms/personal-information-form";
import { ContactEmergencyForm } from "./forms/contact-emergency-form";
import { EmploymentDetailsForm } from "./forms/employment-details-form";
import { BusDetailsForm } from "./forms/bus-details-form";
import { BankDetailsForm } from "./forms/bank-details-form";
import { DocumentsWorkflowForm } from "./forms/documents-workflow-form";
import { FamilyDependentsForm } from "./forms/family-dependents-form";
import { EducationExperienceForm } from "./forms/education-experience-form";
import { TrainingAssetsForm } from "./forms/training-assets-form";
import { SubFormWorkOrder } from "./forms/workorder/sub-form-workorder";
import { MedicalWorkflowForm } from "./forms/medical-workflow-form";
import { ActionsWorkflowForm } from "./forms/actions-workflow-form";
import { PoliceVerificationForm } from "./forms/police-verification/police-verification-form";
import { BackgroundVerificationForm } from "./forms/background-verification-form";
import { SubmissionSummaryForm } from "./forms/submission-summary-form";
import {
  EmployeeFormSidebar,
  type SectionId,
  useEmployeeSidebarState,
} from "./employee-form-sidebar";
import { SectionIncompleteNote } from "../../../../components/fields/section-incomplete-note";
import { useSearchParams } from "next/navigation";
import { Button } from "@repo/ui/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure";
import { useDynamicTabVisibility } from "@/hooks/form-functions/useDynamicTabVisibility";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";

export type Mode = "add" | "edit" | "view";

const SECTION_TAB_KEYS: Record<SectionId, string[]> = {
  personal: ["personalInformation"],
  contact: ["contactEmergency"],
  employment: ["employmentDetails"],
  bus: ["busDetails"],
  bank: ["bankDetails"],
  documents: ["documentsVerification", "uploadedDocuments"],
  family: ["familyMembers", "pfNominees", "gratuityNominees", "childrenAdmissions"],
  education: ["educations", "experiences"],
  training: ["assetAllocations", "wcPolicies"],
  workorder: ["workOrders"],
  medical: ["medicalSafety", "medicalCheckups", "accidentRegisters"],
  police: ["policeVerification"],
  backgroundVerification: ["backgroundVerification"],
  status: [
    "actionsAndStatus",
    "actionsStatus",
    "defaultWeekOff",
    "disciplinaryAction",
    "disciplinaryActions",
    "bonus",
    "bonuses",
    "penalty",
    "penalties",
    "advancePayment",
    "advancePayments",
  ],
  submission: [],
};

const SECTION_LABELS: Record<SectionId, string> = {
  personal: "Personal Information",
  contact: "Contact & Address",
  employment: "Employment Details",
  bus: "Bus Details",
  bank: "Bank & Identity",
  documents: "Documents & Verification",
  family: "Family & Dependents",
  education: "Education & Experience",
  training: "Training & Assets",
  workorder: "Work Order",
  medical: "Medical & Safety",
  police: "Police Verification",
  backgroundVerification: "Background Verification",
  status: "Actions Workflow",
  submission: "Submission",
};

const TAB_KEY_ALIASES: Record<string, string[]> = {
  workOrder: ["workOrders"],
  actionsAndStatus: ["actionsAndStatus", "actionsStatus"],
  disciplinaryAction: ["disciplinaryAction", "disciplinaryActions"],
  bonus: ["bonus", "bonuses"],
  penalty: ["penalty", "penalties"],
  advancePayment: ["advancePayment", "advancePayments"],
};

const isTabRequired = (
  formStructure: Record<string, unknown> | null,
  configKey: string,
) => {
  const sectionConfig = formStructure?.[configKey];
  if (!sectionConfig || typeof sectionConfig !== "object") return true;
  const tabRequired = (sectionConfig as { tabRequired?: boolean }).tabRequired;
  return typeof tabRequired === "boolean" ? tabRequired : true;
};

export function EmployeeManagementForm({
  duplicateData: _duplicateData,
  employeeResponse,
  mode,
  employeeRecordId,
  employeeSearchUrl,
}: {
  duplicateData: any;
  employeeResponse?: any;
  mode: Mode;
  employeeRecordId: string | null;
  employeeSearchUrl: string;
}) {
  const searchParams = useSearchParams();
  const showWarningState = searchParams.get("form") === "temp";
  const resolvedEmployeeRecordId =
    employeeRecordId || employeeResponse?.[0]?._id || null;

  const { formStructure, loading: formStructureLoading } =
    useCollectionFormStructure({
      collectionName: "contract_employee_strcture",
    });

  const dynamicTabVisibility = useDynamicTabVisibility(
    formStructure as Record<string, unknown> | null,
  );
  const [fetchedDraftTabVisibility, setFetchedDraftTabVisibility] = useState<
    Record<string, unknown> | null
  >(null);

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
      const draftItem = Array.isArray(data) ? data[0] : null;
      if (draftItem && typeof draftItem === "object") {
        setFetchedDraftTabVisibility(draftItem as Record<string, boolean>);
      } else {
        setFetchedDraftTabVisibility(null);
      }
    },
    onError: (error) => {
      console.error("Error fetching employee data:", error);
      setFetchedDraftTabVisibility(null);
    },
    dependencies: [resolvedEmployeeRecordId, employeeSearchUrl],
  });

  useEffect(() => {
    if (!showWarningState) {
      setFetchedDraftTabVisibility(null);
      return;
    }
    if (!resolvedEmployeeRecordId) return;
    fetchEmployee();
  }, [ resolvedEmployeeRecordId, showWarningState]);

  const { sectionOrder, sidebarSections } = useEmployeeSidebarState(
    formStructure as Record<string, unknown> | null,
    showWarningState,
  );
  const tabVisibility = useMemo(
    () => ({
      personalInformation: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "personalInformation",
      ),
      contactEmergency: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "contactEmergency",
      ),
      employmentDetails: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "employmentDetails",
      ),
      busDetails: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "busDetails",
      ),
      bankDetails: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "bankDetails",
      ),
      documentsVerification: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "documentsVerification",
      ),
      uploadedDocuments: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "uploadedDocuments",
      ),
      familyMembers: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "familyMembers",
      ),
      pfNominees: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "pfNominees",
      ),
      gratuityNominees: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "gratuityNominees",
      ),
      childrenAdmissions: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "childrenAdmissions",
      ),
      educations: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "educations",
      ),
      experiences: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "experiences",
      ),
      assetAllocations: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "assetAllocations",
      ),
      wcPolicies: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "wcPolicies",
      ),
      workOrder: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "workOrders",
      ),
      medicalSafety: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "medicalSafety",
      ),
      medicalCheckups: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "medicalCheckups",
      ),
      accidentRegisters: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "accidentRegisters",
      ),
      policeVerification: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "policeVerification",
      ),
      backgroundVerification: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "backgroundVerification",
      ),
      actionsAndStatus: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "actionsAndStatus",
      ),
      defaultWeekOff: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "defaultWeekOff",
      ),
      disciplinaryAction: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "disciplinaryAction",
      ),
      bonus: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "bonus",
      ),
      penalty: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "penalty",
      ),
      advancePayment: isTabRequired(
        formStructure as Record<string, unknown> | null,
        "advancePayment",
      ),
    }),
    [formStructure],
  );


  const [activeSection, setActiveSection] = useState<SectionId>(
    () => sectionOrder[0] ?? "personal",
  );

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
          if (!showWarningState) {
            acc[sectionId] = false;
            return acc;
          }
          if (sectionId === "submission") {
            acc[sectionId] = Object.entries(acc).some(
              ([id, isPending]) => id !== "submission" && isPending,
            );
            return acc;
          }
          const keys = SECTION_TAB_KEYS[sectionId] ?? [];
          acc[sectionId] = keys.some((key) => isTabKeyPending(key));
          return acc;
        },
        {} as Record<SectionId, boolean>,
      ),
    [sectionOrder, showWarningState, dynamicTabVisibility, fetchedDraftTabVisibility],
  );

  const resolvedSidebarSections = useMemo(
    () =>
      sidebarSections.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          state: sectionPendingMap[item.id] ? ("warning" as const) : ("default" as const),
        })),
      })),
    [sidebarSections, sectionPendingMap],
  );

  const isSectionPending = (sectionId: SectionId) => sectionPendingMap[sectionId] ?? false;
  const pendingSectionLabels = useMemo(
    () =>
      sectionOrder
        .filter(
          (sectionId) =>
            sectionId !== "submission" && (sectionPendingMap[sectionId] ?? false),
        )
        .map((sectionId) => SECTION_LABELS[sectionId]),
    [sectionOrder, sectionPendingMap],
  );

  const renderSectionIncompleteNote = (sectionId: SectionId) =>
    isSectionPending(sectionId) ? (
      <SectionIncompleteNote
        title="Section Incomplete"
        description={`Please fill all required fields in the "${SECTION_LABELS[sectionId]}" tab.`}
      />
    ) : null;

  useEffect(() => {
    if (sectionOrder.length === 0) return;
    if (!sectionOrder.includes(activeSection)) {
      setActiveSection(sectionOrder[0]);
    }
  }, [activeSection, sectionOrder]);

  const employeeCollectionUrl = "validate";

  const recordId = employeeResponse?.[0]?._id || "new";
  const activeSectionIndex = sectionOrder.indexOf(activeSection);
  const hasPreviousSection = activeSectionIndex > 0;
  const hasNextSection =
    activeSectionIndex >= 0 && activeSectionIndex < sectionOrder.length - 1;

  const goToNextTab = () => {
    const i = sectionOrder.indexOf(activeSection);
    if (i >= 0 && i < sectionOrder.length - 1)
      setActiveSection(sectionOrder[i + 1]);
  };

  const goToPreviousTab = () => {
    const i = sectionOrder.indexOf(activeSection);
    if (i > 0) setActiveSection(sectionOrder[i - 1]);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeSection]);

  const isEmptyFormStructure =
    !formStructure ||
    (Array.isArray(formStructure) && formStructure.length === 0) ||
    (!Array.isArray(formStructure) && Object.keys(formStructure).length === 0);

  if (formStructureLoading || isEmptyFormStructure) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto scroll-smooth">
      <div className="flex gap-6">
        <EmployeeFormSidebar
          sidebarSections={resolvedSidebarSections}
          activeSection={activeSection}
          sectionOrder={sectionOrder}
          onSectionChange={setActiveSection}
        />

        <main className="flex-1 min-w-0">
          <div className="pt-4 pb-4">
            {activeSection === "personal" && (
              <>
                {renderSectionIncompleteNote("personal")}
                <PersonalInformationForm
                  key={`personal-${recordId}-${mode}`}
                  employeeRecordId={employeeRecordId}
                  onNextTab={goToNextTab}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                />
              </>
            )}
            {activeSection === "contact" && (
              <>
                {renderSectionIncompleteNote("contact")}
                <ContactEmergencyForm
                  key={`contact-${recordId}-${mode}`}
                  employeeRecordId={employeeRecordId}
                  onNextTab={goToNextTab}
                  onPreviousTab={goToPreviousTab}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                />
              </>
            )}
            {activeSection === "employment" && (
              <>
                {renderSectionIncompleteNote("employment")}
                <EmploymentDetailsForm
                  key={`employment-${recordId}-${mode}`}
                  employeeRecordId={employeeRecordId}
                  onNextTab={goToNextTab}
                  onPreviousTab={goToPreviousTab}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                />
              </>
            )}
            {activeSection === "bus" && (
              <>
                {renderSectionIncompleteNote("bus")}
                <BusDetailsForm
                  key={`bus-${recordId}-${mode}`}
                  employeeRecordId={employeeRecordId}
                  onNextTab={goToNextTab}
                  onPreviousTab={goToPreviousTab}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                />
              </>
            )}
            {activeSection === "bank" && (
              <>
                {renderSectionIncompleteNote("bank")}
                <BankDetailsForm
                  key={`bank-${recordId}-${mode}`}
                  employeeRecordId={employeeRecordId}
                  onNextTab={goToNextTab}
                  onPreviousTab={goToPreviousTab}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                />
              </>
            )}
            {activeSection === "documents" && (
              <>
                {renderSectionIncompleteNote("documents")}
                <DocumentsWorkflowForm
                  key={`documents-${recordId}-${mode}`}
                  employeeRecordId={employeeRecordId}
                  onNextTab={goToNextTab}
                  onPreviousTab={goToPreviousTab}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                  showDocumentsVerification={tabVisibility.documentsVerification}
                  showUploadedDocuments={tabVisibility.uploadedDocuments}
                />
              </>
            )}
            {activeSection === "family" && (
              <>
                <FamilyDependentsForm
                  key={`family-${recordId}-${mode}`}
                  employeeRecordId={employeeRecordId}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                  showFamilyMembers={tabVisibility.familyMembers}
                  showPfNominees={tabVisibility.pfNominees}
                  showGratuityNominees={tabVisibility.gratuityNominees}
                  showChildrenAdmissions={tabVisibility.childrenAdmissions}
                  sectionErrors={{
                    familyMembers: isTabKeyPending("familyMembers"),
                    pfNominees: isTabKeyPending("pfNominees"),
                    gratuityNominees: isTabKeyPending("gratuityNominees"),
                    childrenAdmissions: isTabKeyPending("childrenAdmissions"),
                  }}
                />
              </>
            )}
            {activeSection === "education" && (
              <>
                <EducationExperienceForm
                  key={`education-${recordId}-${mode}`}
                  employeeRecordId={employeeRecordId}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                  showEducations={tabVisibility.educations}
                  showExperiences={tabVisibility.experiences}
                  sectionErrors={{
                    educations: isTabKeyPending("educations"),
                    experiences: isTabKeyPending("experiences"),
                  }}
                />
              </>
            )}
            {activeSection === "training" && (
              <>
                <TrainingAssetsForm
                  key={`training-${recordId}-${mode}`}
                  employeeRecordId={employeeRecordId}
                  onNextTab={goToNextTab}
                  onPreviousTab={goToPreviousTab}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                  showAssetAllocations={tabVisibility.assetAllocations}
                  showWcPolicies={tabVisibility.wcPolicies}
                  sectionErrors={{
                    assetAllocations: isTabKeyPending("assetAllocations"),
                    wcPolicies: isTabKeyPending("wcPolicies"),
                  }}
                />
              </>
            )}
            {activeSection === "workorder" && (
              <>
                {renderSectionIncompleteNote("workorder")}
                <SubFormWorkOrder
                  key={`workorder-${recordId}-${mode}`}
                  employeeRecordId={employeeRecordId}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                />
              </>
            )}
            {activeSection === "medical" && (
              <>
                <MedicalWorkflowForm
                  key={`medical-${recordId}-${mode}`}
                  employeeRecordId={employeeRecordId}
                  onNextTab={goToNextTab}
                  onPreviousTab={goToPreviousTab}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                  showMedicalSafety={tabVisibility.medicalSafety}
                  showMedicalCheckups={tabVisibility.medicalCheckups}
                  showAccidentRegisters={tabVisibility.accidentRegisters}
                  sectionErrors={{
                    medicalSafety: isTabKeyPending("medicalSafety"),
                    medicalCheckups: isTabKeyPending("medicalCheckups"),
                    accidentRegisters: isTabKeyPending("accidentRegisters"),
                  }}
                />
              </>
            )}
            {activeSection === "police" && (
              <>
                {renderSectionIncompleteNote("police")}
                <PoliceVerificationForm
                  key={`police-${recordId}-${mode}`}
                  employeeRecordId={employeeRecordId}
                  onNextTab={goToNextTab}
                  onPreviousTab={goToPreviousTab}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                />
              </>
            )}
            {activeSection === "status" && (
              <>
                <ActionsWorkflowForm
                  key={`status-${recordId}-${mode}`}
                  employeeRecordId={employeeRecordId}
                  onNextTab={goToNextTab}
                  onPreviousTab={goToPreviousTab}
                  mode={mode}
                  employeeSearchUrl={employeeSearchUrl}
                  employeeCollectionUrl={employeeCollectionUrl}
                  showActionsStatus={tabVisibility.actionsAndStatus}
                  showDefaultWeekOff={tabVisibility.defaultWeekOff}
                  showDisciplinaryAction={tabVisibility.disciplinaryAction}
                  showBonus={tabVisibility.bonus}
                  showPenalty={tabVisibility.penalty}
                  showAdvancePayment={tabVisibility.advancePayment}
                  sectionErrors={{
                    actionsAndStatus: isTabKeyPending("actionsAndStatus"),
                    defaultWeekOff: isTabKeyPending("defaultWeekOff"),
                    disciplinaryAction: isTabKeyPending("disciplinaryAction"),
                    bonus: isTabKeyPending("bonus"),
                    penalty: isTabKeyPending("penalty"),
                    advancePayment: isTabKeyPending("advancePayment"),
                  }}
                />
              </>
            )}
            {activeSection === "backgroundVerification" && (
              <>
                {renderSectionIncompleteNote("backgroundVerification")}
                <BackgroundVerificationForm
                  employeeRecordId={resolvedEmployeeRecordId}
                  employeeResponse={employeeResponse}
                />
              </>
            )}
            {activeSection === "submission" && showWarningState && (
              <SubmissionSummaryForm
                pendingSectionLabels={pendingSectionLabels}
                employeeRecordId={resolvedEmployeeRecordId}
                employeeSearchUrl={employeeSearchUrl}
                employeeCollectionUrl={employeeCollectionUrl}
              />
            )}
          </div>

          <div className="pt-2 pb-6">
            <div className="flex items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousTab}
                disabled={!hasPreviousSection}
                className="px-3 py-1.5 h-8 text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 disabled:opacity-100 disabled:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              {hasNextSection && (
                <Button
                  type="button"
                  onClick={goToNextTab}
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
