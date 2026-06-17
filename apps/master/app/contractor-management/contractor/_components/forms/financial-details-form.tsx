"use client"

import { useSearchParams } from "next/navigation"
import type { ReactNode } from "react"
import { useMemo } from "react"
import { CardContent } from "@repo/ui/components/ui/card"
import { Separator } from "@repo/ui/components/ui/separator"
import { BankDetailsTable } from "./bank-detail/bank-details-table"
import { SecurityDepositsTable } from "./security-deposit/security-deposits-table"
import { SectionIncompleteNote } from "@/components/fields/section-incomplete-note"

type FinancialSectionKey = "bankDetail" | "securityDeposit"
type SectionErrorValue =
  | boolean
  | {
      title?: string
      description: string
    }

interface FinancialDetailsFormProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  contractorCollectionUrl?: string
  showBankDetail?: boolean
  showSecurityDeposit?: boolean
  sectionErrors?: Partial<Record<FinancialSectionKey, SectionErrorValue>>
  onSaved?: () => void
}

export function FinancialDetailsForm({
  employeeRecordId = null,
  mode = "add",
  employeeSearchUrl = "contractor/search",
  contractorCollectionUrl = "contractor",
  showBankDetail = true,
  showSecurityDeposit = true,
  sectionErrors,
  onSaved,
}: FinancialDetailsFormProps) {
  const searchParams = useSearchParams()
  const isDraftForm = searchParams.get("form") === "temp"
  const modeParam = searchParams.get("mode")
  const currentMode =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : mode

  if (!showBankDetail && !showSecurityDeposit) {
    return null
  }

  const sections = useMemo(
    () =>
      [
        showBankDetail
          ? {
              key: "bankDetail",
              node: (
                <BankDetailsTable
                  mode={currentMode as "add" | "edit" | "view"}
                  employeeRecordId={employeeRecordId}
                  employeeSearchUrl={employeeSearchUrl}
                  contractorCollectionUrl={contractorCollectionUrl}
                  onSaved={onSaved}
                />
              ),
            }
          : null,
        showSecurityDeposit
          ? {
              key: "securityDeposit",
              node: (
                <SecurityDepositsTable
                  mode={currentMode as "add" | "edit" | "view"}
                  employeeRecordId={employeeRecordId}
                  employeeSearchUrl={employeeSearchUrl}
                  contractorCollectionUrl={contractorCollectionUrl}
                  onSaved={onSaved}
                />
              ),
            }
          : null,
      ].filter(Boolean) as Array<{ key: FinancialSectionKey; node: ReactNode }>,
    [
      showBankDetail,
      showSecurityDeposit,
      currentMode,
      employeeRecordId,
      employeeSearchUrl,
      contractorCollectionUrl,
      onSaved,
    ],
  )

  const renderSectionError = (key: FinancialSectionKey) => {
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

export default function FinancialDetailsFormWithPreview(props: any) {
  return <FinancialDetailsForm {...props} />
}