"use client"

export type TabSectionId =
  | "basic"
  | "company"
  | "licenses"
  | "financial"
  | "address"
  | "documents"
  | "workorders"
  | "penalties"
  | "submission"

type SectionDefinition = {
  id: TabSectionId
  label: string
  icon: string
  configKeys: string[]
}

const SECTION_DEFINITIONS: SectionDefinition[] = [
  { id: "basic", label: "Basic Information", icon: "user-circle", configKeys: ["basicInformation"] },
  { id: "company", label: "Company Details", icon: "building", configKeys: ["companyDetails"] },
  { id: "licenses", label: "Licenses & Permits", icon: "shield-check", configKeys: ["license"] },
  { id: "financial", label: "Financial Details", icon: "credit-card", configKeys: ["bankDetail", "securityDeposit"] },
  { id: "address", label: "Address Information", icon: "map-pin", configKeys: ["addressInformation"] },
  { id: "documents", label: "Documents & Compliance", icon: "file-text", configKeys: ["document"] },
  { id: "workorders", label: "Work Orders", icon: "clipboard-list", configKeys: ["workOrder"] },
  { id: "penalties", label: "Penalties & Policies", icon: "alert-triangle", configKeys: ["penalty", "wcPolicy"] },
  { id: "submission", label: "Submission", icon: "file-text", configKeys: [] },
]

const isTabRequired = (
  formStructure: Record<string, unknown> | null,
  configKey: string
) => {
  const sectionConfig = formStructure?.[configKey]
  if (!sectionConfig || typeof sectionConfig !== "object") return true
  const tabRequired = (sectionConfig as { tabRequired?: boolean }).tabRequired
  return typeof tabRequired === "boolean" ? tabRequired : true
}

export function useTabControl(
  formStructure: Record<string, unknown> | null,
  showSubmission = false,
) {
  const tabVisibility = {
    basicInformation: isTabRequired(formStructure, "basicInformation"),
    companyDetails: isTabRequired(formStructure, "companyDetails"),
    license: isTabRequired(formStructure, "license"),
    bankDetail: isTabRequired(formStructure, "bankDetail"),
    securityDeposit: isTabRequired(formStructure, "securityDeposit"),
    addressInformation: isTabRequired(formStructure, "addressInformation"),
    document: isTabRequired(formStructure, "document"),
    workOrder: isTabRequired(formStructure, "workOrder"),
    penalty: isTabRequired(formStructure, "penalty"),
    wcPolicy: isTabRequired(formStructure, "wcPolicy"),
  }

  const visibleSections = SECTION_DEFINITIONS.filter((section) => {
    if (section.id === "submission") return showSubmission
    return section.configKeys.some((key) => isTabRequired(formStructure, key))
  })

  return {
    tabVisibility,
    sectionOrder: visibleSections.map((section) => section.id),
    sidebarSections: [
      {
        title: "Management",
        items: visibleSections.map(({ id, label, icon }) => ({ id, label, icon })),
      },
    ],
  }
}