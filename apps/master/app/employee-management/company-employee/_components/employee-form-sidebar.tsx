"use client";

import { useMemo } from "react";
import { Sidebar } from "@/components/fields/sidebar-local";

export const ALL_SECTION_ORDER = [
  "personal",
  "contact",
  "employment",
  "bus",
  "bank",
  "documents",
  "family",
  "education",
  "training",
  "workorder",
  "medical",
  "police",
  "backgroundVerification",
  "status",
  "submission",
] as const;

export type SectionId = (typeof ALL_SECTION_ORDER)[number];

type SectionDefinition = {
  id: SectionId;
  label: string;
  icon: string;
  configKeys: string[];
};

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: "personal",
    label: "Personal Information",
    icon: "user-circle",
    configKeys: ["personalInformation"],
  },
  {
    id: "contact",
    label: "Contact & Address",
    icon: "map-pin",
    configKeys: ["contactEmergency"],
  },
  {
    id: "employment",
    label: "Employment Details",
    icon: "building",
    configKeys: ["employmentDetails"],
  },
  {
    id: "bus",
    label: "Bus Details",
    icon: "map-pin",
    configKeys: ["busDetails"],
  },
  {
    id: "bank",
    label: "Bank & Identity",
    icon: "credit-card",
    configKeys: ["bankDetails"],
  },
  {
    id: "documents",
    label: "Documents & Verification",
    icon: "file-text",
    configKeys: ["documentsVerification", "uploadedDocuments"],
  },
  {
    id: "family",
    label: "Family & Dependents",
    icon: "user-circle",
    configKeys: [
      "familyMembers",
      "pfNominees",
      "gratuityNominees",
      "childrenAdmissions",
    ],
  },
  {
    id: "education",
    label: "Education & Experience",
    icon: "book",
    configKeys: ["educations", "experiences"],
  },
  {
    id: "training",
    label: "Training & Assets",
    icon: "clipboard-list",
    configKeys: ["assetAllocations", "wcPolicies"],
  },
  {
    id: "workorder",
    label: "Work Order",
    icon: "clipboard-list",
    configKeys: ["workOrders"],
  },
  {
    id: "medical",
    label: "Medical & Safety",
    icon: "shield-check",
    configKeys: ["medicalSafety", "medicalCheckups", "accidentRegisters"],
  },
  {
    id: "police",
    label: "Police Verification",
    icon: "shield-check",
    configKeys: ["policeVerification"],
  },
  {
    id: "backgroundVerification",
    label: "Background Verification",
    icon: "shield-check",
    configKeys: ["backgroundVerification"],
  },
  {
    id: "status",
    label: "Actions Workflow",
    icon: "clock",
    configKeys: [
      "actionsAndStatus",
      "defaultWeekOff",
      "disciplinaryAction",
      "bonus",
      "penalty",
      "advancePayment",
    ],
  },
  {
    id: "submission",
    label: "Submission",
    icon: "file-text",
    configKeys: [],
  },
];

const isTabRequired = (
  formStructure: Record<string, unknown> | null,
  configKey: string,
) => {
  const sectionConfig = formStructure?.[configKey];
  if (!sectionConfig || typeof sectionConfig !== "object") return true;
  const tabRequired = (sectionConfig as { tabRequired?: boolean }).tabRequired;
  return typeof tabRequired === "boolean" ? tabRequired : true;
};

export function useEmployeeSidebarState(
  formStructure: Record<string, unknown> | null,
  showSubmission = false,
) {
  const visibleSections = useMemo(
    () =>
      SECTION_DEFINITIONS.filter((section) => {
        if (section.id === "submission") {
          return showSubmission;
        }
        return section.configKeys.some((key) => isTabRequired(formStructure, key));
      }),
    [formStructure, showSubmission],
  );

  const sectionOrder = useMemo<SectionId[]>(
    () =>
      visibleSections.length > 0
        ? visibleSections.map((section) => section.id)
        : [...ALL_SECTION_ORDER],
    [visibleSections],
  );

  const sidebarSections = useMemo(
    () => [
      {
        items:
          visibleSections.length > 0
            ? visibleSections.map(({ id, label, icon }) => ({
                id,
                label,
                icon,
                state: "default" as const,
              }))
            : SECTION_DEFINITIONS.map(({ id, label, icon }) => ({
                id,
                label,
                icon,
                state: "default" as const,
              })),
      },
    ],
    [visibleSections],
  );

  return { sectionOrder, sidebarSections };
}

export function EmployeeFormSidebar({
  sidebarSections,
  activeSection,
  sectionOrder,
  onSectionChange,
}: {
  sidebarSections: {
    items: {
      id: SectionId;
      label: string;
      icon: string;
      state: "default" | "warning";
    }[];
  }[];
  activeSection: SectionId;
  sectionOrder: SectionId[];
  onSectionChange: (id: SectionId) => void;
}) {
  return (
    <div className="sticky top-4 self-start">
      <Sidebar
        sections={sidebarSections}
        activeId={activeSection}
        colorClasses={{
          default: "text-gray-700 hover:bg-gray-100",
          active: "bg-blue-100 text-blue-900",
          warning: "text-red-700 bg-red-50 hover:bg-red-100",
          activeWarning: "bg-red-100 text-red-800",
        }}
        onItemClick={(id) => {
          if (sectionOrder.includes(id as SectionId)) {
            onSectionChange(id as SectionId);
          }
        }}
      />
    </div>
  );
}
