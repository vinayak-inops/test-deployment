"use client"

import { useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { useMemo } from "react"
import { CardContent } from "@repo/ui/components/ui/card"
import { Separator } from "@repo/ui/components/ui/separator"
import { PenaltiesTable } from "./penalty/penalties-table"
import { WCPoliciesTable } from "./wc-policy/wc-policies-table"
import { SectionIncompleteNote } from "@/components/fields/section-incomplete-note"

type PenaltySectionKey = "penalty" | "wcPolicy"
type SectionErrorValue =
  | boolean
  | {
      title?: string
      description: string
    }

interface PenaltiesPoliciesFormProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  showPenalty?: boolean
  showWcPolicy?: boolean
  sectionErrors?: Partial<Record<PenaltySectionKey, SectionErrorValue>>
  onSaved?: () => void
}

export function PenaltiesPoliciesForm({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  showPenalty = true,
  showWcPolicy = true,
  sectionErrors,
  onSaved,
}: PenaltiesPoliciesFormProps) {
  const searchParams = useSearchParams()
  const isDraftForm = searchParams.get("form") === "temp"
  const modeParam = searchParams.get("mode")
  const currentMode =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : mode

  if (!showPenalty && !showWcPolicy) {
    return null
  }

  const sections = useMemo(
    () =>
      [
        showPenalty
          ? {
              key: "penalty",
              node: (
                <PenaltiesTable
                  mode={currentMode as "add" | "edit" | "view"}
                  employeeRecordId={employeeRecordId}
                  employeeSearchUrl={employeeSearchUrl}
                  contractorCollectionUrl={contractorCollectionUrl}
                  onSaved={onSaved}
                />
              ),
            }
          : null,
        showWcPolicy
          ? {
              key: "wcPolicy",
              node: (
                <WCPoliciesTable
                  mode={currentMode as "add" | "edit" | "view"}
                  employeeRecordId={employeeRecordId}
                  employeeSearchUrl={employeeSearchUrl}
                  contractorCollectionUrl={contractorCollectionUrl}
                  onSaved={onSaved}
                />
              ),
            }
          : null,
      ].filter(Boolean) as Array<{ key: PenaltySectionKey; node: ReactNode }>,
    [
      showPenalty,
      showWcPolicy,
      currentMode,
      employeeRecordId,
      employeeSearchUrl,
      contractorCollectionUrl,
      onSaved,
    ],
  )

  const renderSectionError = (key: PenaltySectionKey) => {
    if (!isDraftForm) return null
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
              {renderSectionError(section.key)}
              {section.node}
              {index < sections.length - 1 ? <Separator /> : null}
            </div>
          ))}
        </div>
      </CardContent>
    </div>
  )
}

export default function PenaltiesPoliciesFormWithPreview(props: any) {
  return <PenaltiesPoliciesForm {...props} />
}
