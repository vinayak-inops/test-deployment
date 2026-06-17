"use client"

import { CardContent } from "@repo/ui/components/ui/card"
import { Separator } from "@repo/ui/components/ui/separator"
import { ActionsStatusForm } from "./action-status/actions-status-form"
import DefaultWeekOffTable from "./do-not-consider-week-off/default-week-off-table"
import DisciplinaryActionTable from "./disciplinary/disciplinary-action-table"
import BonusTable from "./bonus/bonus-table"
import PenaltyForm from "./penalty/penalty-table"
import AdvancePaymentForm from "./advance-payment/advance-payment-table"
import { SectionIncompleteNote } from "@/components/fields/section-incomplete-note"

type ActionsSectionKey =
  | "actionsAndStatus"
  | "defaultWeekOff"
  | "disciplinaryAction"
  | "bonus"
  | "penalty"
  | "advancePayment"
type SectionErrorValue =
  | boolean
  | {
      title?: string
      description: string
    }

interface ActionsWorkflowFormProps {
  employeeRecordId?: string | null
  mode?: "add" | "edit" | "view"
  onNextTab?: () => void
  onPreviousTab?: () => void
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  showActionsStatus?: boolean
  showDefaultWeekOff?: boolean
  showDisciplinaryAction?: boolean
  showBonus?: boolean
  showPenalty?: boolean
  showAdvancePayment?: boolean
  sectionErrors?: Partial<Record<ActionsSectionKey, SectionErrorValue>>
}

export function ActionsWorkflowForm({
  employeeRecordId = null,
  mode = "add",
  onNextTab,
  onPreviousTab,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  showActionsStatus = true,
  showDefaultWeekOff = true,
  showDisciplinaryAction = true,
  showBonus = true,
  showPenalty = true,
  showAdvancePayment = true,
  sectionErrors,
}: ActionsWorkflowFormProps) {
  const currentMode = mode
  if (
    !showActionsStatus &&
    !showDefaultWeekOff &&
    !showDisciplinaryAction &&
    !showBonus &&
    !showPenalty &&
    !showAdvancePayment
  ) {
    return null
  }

  const renderSectionError = (key: ActionsSectionKey) => {
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
          {showActionsStatus && (
            <>
              {renderSectionError("actionsAndStatus")}
              <ActionsStatusForm
                mode={currentMode as "add" | "edit" | "view"}
                employeeRecordId={employeeRecordId}
                onNextTab={onNextTab}
                onPreviousTab={onPreviousTab}
                employeeSearchUrl={employeeSearchUrl}
                employeeCollectionUrl={employeeCollectionUrl}
              />
            </>
          )}
          {showActionsStatus && showDefaultWeekOff && <Separator />}
          {showDefaultWeekOff && (
            <>
              {renderSectionError("defaultWeekOff")}
              <DefaultWeekOffTable
                mode={currentMode as "add" | "edit" | "view"}
                employeeRecordId={employeeRecordId}
                employeeSearchUrl={employeeSearchUrl}
                employeeCollectionUrl={employeeCollectionUrl}
              />
            </>
          )}
          {(showActionsStatus || showDefaultWeekOff) && showDisciplinaryAction && <Separator />}
          {showDisciplinaryAction && (
            <>
              {renderSectionError("disciplinaryAction")}
              <DisciplinaryActionTable
                mode={currentMode as "add" | "edit" | "view"}
                employeeRecordId={employeeRecordId}
                employeeSearchUrl={employeeSearchUrl}
                employeeCollectionUrl={employeeCollectionUrl}
              />
            </>
          )}
          {(showActionsStatus || showDefaultWeekOff || showDisciplinaryAction) && showBonus && <Separator />}
          {showBonus && (
            <>
              {renderSectionError("bonus")}
              <BonusTable
                mode={currentMode as "add" | "edit" | "view"}
                employeeRecordId={employeeRecordId}
                employeeSearchUrl={employeeSearchUrl}
                employeeCollectionUrl={employeeCollectionUrl}
              />
            </>
          )}
          {(showActionsStatus || showDefaultWeekOff || showDisciplinaryAction || showBonus) && showPenalty && <Separator />}
          {showPenalty && (
            <>
              {renderSectionError("penalty")}
              <PenaltyForm
                mode={currentMode as "add" | "edit" | "view"}
                employeeRecordId={employeeRecordId}
                employeeSearchUrl={employeeSearchUrl}
                employeeCollectionUrl={employeeCollectionUrl}
              />
            </>
          )}
          {(showActionsStatus || showDefaultWeekOff || showDisciplinaryAction || showBonus || showPenalty) && showAdvancePayment && <Separator />}
          {showAdvancePayment && (
            <>
              {renderSectionError("advancePayment")}
              <AdvancePaymentForm
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

export default function ActionsWorkflowFormWithPreview(props: any) {
  return <ActionsWorkflowForm {...props} />
}
