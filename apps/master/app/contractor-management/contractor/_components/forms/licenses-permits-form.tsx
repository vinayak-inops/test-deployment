"use client"

import { useSearchParams } from "next/navigation"
import { CardContent } from "@repo/ui/components/ui/card"
import { LicensesTable } from "./license/licenses-table"
import { SectionIncompleteNote } from "@/components/fields/section-incomplete-note"

type SectionErrorValue =
  | boolean
  | {
      title?: string
      description: string
    }

interface LicensesPermitsFormProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  sectionError?: SectionErrorValue
  onSaved?: () => void
}

export function LicensesPermitsForm({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  sectionError,
  onSaved,
}: LicensesPermitsFormProps) {
  const searchParams = useSearchParams()
  const isDraftForm = searchParams.get("form") === "temp"
  const modeParam = searchParams.get("mode")
  const currentMode =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : mode

  const renderSectionError = () => {
    if (!isDraftForm) return null
    if (!sectionError) return null
    if (typeof sectionError === "boolean") {
      return sectionError ? (
        <SectionIncompleteNote
          title="Section Incomplete"
          description='Please fill all required fields in "Licenses & Permits" section.'
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
        {renderSectionError()}
        <LicensesTable
          mode={currentMode as "add" | "edit" | "view"}
          employeeRecordId={employeeRecordId}
          employeeSearchUrl={employeeSearchUrl}
          contractorCollectionUrl={contractorCollectionUrl}
          onSaved={onSaved}
        />
      </CardContent>
    </div>
  )
}

export default function LicensesPermitsFormWithPreview(props: any) {
  return <LicensesPermitsForm {...props} />
}
