"use client"

import { useMemo } from "react"
import type { ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import { CardContent } from "@repo/ui/components/ui/card"
import { Separator } from "@repo/ui/components/ui/separator"
import { FamilyMembersSectionForm } from "./family-member/family-members-table"
import { PfNomineesSectionForm } from "./pf-nominee/pf-nominees-table"
import { GratuityNomineesSectionForm } from "./gratuity-nominee/gratuity-nominees-table"
import { ChildrenAdmissionsSectionForm } from "./children-admission/children-admissions-table"
import { SectionIncompleteNote } from "@/components/fields/section-incomplete-note"

type FamilySectionKey =
  | "familyMembers"
  | "pfNominees"
  | "gratuityNominees"
  | "childrenAdmissions"

type SectionErrorValue =
  | boolean
  | {
      title?: string
      description: string
    }

interface FamilyDependentsFormProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  showFamilyMembers?: boolean
  showPfNominees?: boolean
  showGratuityNominees?: boolean
  showChildrenAdmissions?: boolean
  sectionErrors?: Partial<Record<FamilySectionKey, SectionErrorValue>>
}

export function FamilyDependentsForm({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl,
  employeeCollectionUrl="contract_employee",
  showFamilyMembers = true,
  showPfNominees = true,
  showGratuityNominees = true,
  showChildrenAdmissions = true,
  sectionErrors,
}: FamilyDependentsFormProps) {
  const searchParams = useSearchParams()
  const modeParam = searchParams.get("mode")
  const currentMode =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : mode
  if (!showFamilyMembers && !showPfNominees && !showGratuityNominees && !showChildrenAdmissions) {
    return null
  }
  const sections = useMemo(
    () => [
      showFamilyMembers ? {
        key: "familyMembers",
        node: (
          <FamilyMembersSectionForm
            mode={currentMode as "add" | "edit" | "view"}
            employeeRecordId={employeeRecordId}
            employeeSearchUrl={employeeSearchUrl}
            employeeCollectionUrl={employeeCollectionUrl}
          />
        ),
      } : null,
      showPfNominees ? {
        key: "pfNominees",
        node: (
          <PfNomineesSectionForm
            mode={currentMode as "add" | "edit" | "view"}
            employeeRecordId={employeeRecordId}
            employeeSearchUrl={employeeSearchUrl}
            employeeCollectionUrl={employeeCollectionUrl}
          />
        ),
      } : null,
      showGratuityNominees ? {
        key: "gratuityNominees",
        node: (
          <GratuityNomineesSectionForm
            mode={currentMode as "add" | "edit" | "view"}
            employeeRecordId={employeeRecordId}
            employeeSearchUrl={employeeSearchUrl}
            employeeCollectionUrl={employeeCollectionUrl}
          />
        ),
      } : null,
      showChildrenAdmissions ? {
        key: "childrenAdmissions",
        node: (
          <ChildrenAdmissionsSectionForm
            mode={currentMode as "add" | "edit" | "view"}
            employeeRecordId={employeeRecordId}
            employeeSearchUrl={employeeSearchUrl}
            employeeCollectionUrl={employeeCollectionUrl}
          />
        ),
      } : null,
    ].filter(Boolean) as Array<{ key: string; node: ReactNode }>,
    [
      currentMode,
      employeeRecordId,
      employeeSearchUrl,
      employeeCollectionUrl,
      showFamilyMembers,
      showPfNominees,
      showGratuityNominees,
      showChildrenAdmissions,
    ]
  )

  const renderSectionError = (key: FamilySectionKey) => {
    const sectionError = sectionErrors?.[key]
    if (!sectionError) return null

    if (typeof sectionError === "boolean") {
      return sectionError ? (
        <SectionIncompleteNote
          title="Section Incomplete"
          description={`Please fill all required fields in "${key}" section.`}
        />
      ) : null
    }

    return (
      <SectionIncompleteNote
        title={sectionError.title ?? "Section Incomplete"}
        description={sectionError.description}
      />
    )
  }

  return (
    <div className="">
      <CardContent className="p-0">
        <div className="space-y-8">
          {sections.map((section, index) => (
            <div key={section.key}>
              {renderSectionError(section.key as FamilySectionKey)}
              {section.node}
              {index < sections.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </div>
      </CardContent>
    </div>
  )
}

export default function FamilyDependentsFormWithPreview(props: any) {
  return <FamilyDependentsForm {...props} />
}
