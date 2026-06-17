"use client"

import { useSearchParams } from "next/navigation"
import { CardContent } from "@repo/ui/components/ui/card"
import { Separator } from "@repo/ui/components/ui/separator"
import { EducationsSectionForm } from "./education/educations-table"
import { ExperiencesSectionForm } from "./experience/experiences-table"
import { SectionIncompleteNote } from "@/components/fields/section-incomplete-note"

type EducationSectionKey = "educations" | "experiences"
type SectionErrorValue =
  | boolean
  | {
      title?: string
      description: string
    }

interface EducationExperienceFormProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  showEducations?: boolean
  showExperiences?: boolean
  sectionErrors?: Partial<Record<EducationSectionKey, SectionErrorValue>>
}

export function EducationExperienceForm({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl,
  showEducations = true,
  showExperiences = true,
  sectionErrors,
}: EducationExperienceFormProps) {
  const searchParams = useSearchParams()
  const modeParam = searchParams.get("mode")
  const currentMode =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : mode
  if (!showEducations && !showExperiences) {
    return null
  }

  const renderSectionError = (key: EducationSectionKey) => {
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
          {showEducations && (
            <>
              {renderSectionError("educations")}
              <EducationsSectionForm
                mode={currentMode as "add" | "edit" | "view"}
                employeeRecordId={employeeRecordId}
                employeeSearchUrl={employeeSearchUrl}
                employeeCollectionUrl={employeeCollectionUrl}
              />
            </>
          )}
          {showEducations && showExperiences && <Separator />}
          {showExperiences && (
            <>
              {renderSectionError("experiences")}
              <ExperiencesSectionForm
                mode={currentMode as "add" | "edit" | "view"}
                employeeRecordId={employeeRecordId}
                employeeSearchUrl={employeeSearchUrl}
                employeeCollectionUrl={employeeCollectionUrl}
              />
            </>
          )}
        </div>
      </CardContent>
    </div>
  )
}

export default function EducationExperienceFormWithPreview(props: any) {
  return <EducationExperienceForm {...props} />
}
