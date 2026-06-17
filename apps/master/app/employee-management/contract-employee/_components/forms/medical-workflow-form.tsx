"use client"

import { useSearchParams } from "next/navigation"
import { CardContent } from "@repo/ui/components/ui/card"
import { Separator } from "@repo/ui/components/ui/separator"
import { MedicalSafetyForm } from "./medical-form/medical-safety-form"
import { MedicalCheckupsSectionForm } from "./medical-checkup/medical-checkups-table"
import { AccidentRegistersSectionForm } from "./accident-register/accident-registers-table"
import { SectionIncompleteNote } from "@/components/fields/section-incomplete-note"

type MedicalSectionKey = "medicalSafety" | "medicalCheckups" | "accidentRegisters"
type SectionErrorValue =
  | boolean
  | {
      title?: string
      description: string
    }

interface MedicalWorkflowFormProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  onNextTab?: () => void
  onPreviousTab?: () => void
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  showMedicalSafety?: boolean
  showMedicalCheckups?: boolean
  showAccidentRegisters?: boolean
  sectionErrors?: Partial<Record<MedicalSectionKey, SectionErrorValue>>
}

export function MedicalWorkflowForm({
  employeeRecordId = null,
  mode = "add",
  onNextTab,
  onPreviousTab,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  showMedicalSafety = true,
  showMedicalCheckups = true,
  showAccidentRegisters = true,
  sectionErrors,
}: MedicalWorkflowFormProps) {
  const searchParams = useSearchParams()
  const modeParam = searchParams.get("mode")
  const currentMode =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : mode
  if (!showMedicalSafety && !showMedicalCheckups && !showAccidentRegisters) {
    return null
  }

  const renderSectionError = (key: MedicalSectionKey) => {
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
    <div>
      <CardContent className="p-0">
        <div className="space-y-8">
          {showMedicalSafety && (
            <>
              {renderSectionError("medicalSafety")}
              <MedicalSafetyForm
                mode={currentMode as "add" | "edit" | "view"}
                employeeRecordId={employeeRecordId}
                onNextTab={onNextTab}
                onPreviousTab={onPreviousTab}
                employeeSearchUrl={employeeSearchUrl}
                employeeCollectionUrl={employeeCollectionUrl}
              />
            </>
          )}
          {showMedicalSafety && showMedicalCheckups && <Separator />}
          {showMedicalCheckups && (
            <>
              {renderSectionError("medicalCheckups")}
              <MedicalCheckupsSectionForm
                mode={currentMode as "add" | "edit" | "view"}
                employeeRecordId={employeeRecordId}
                employeeSearchUrl={employeeSearchUrl}
                employeeCollectionUrl={employeeCollectionUrl}
              />
            </>
          )}
          {(showMedicalSafety || showMedicalCheckups) && showAccidentRegisters && <Separator />}
          {showAccidentRegisters && (
            <>
              {renderSectionError("accidentRegisters")}
              <AccidentRegistersSectionForm
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

export default function MedicalWorkflowFormWithPreview(props: any) {
  return <MedicalWorkflowForm {...props} />
}
