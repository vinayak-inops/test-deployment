"use client"

import { useSearchParams } from "next/navigation"
import { CardContent } from "@repo/ui/components/ui/card"
import { Separator } from "@repo/ui/components/ui/separator"
import { TrainingProgramsSectionForm } from "./training-programs/training-programs-table"
import { AssetAllocationSectionForm } from "./asset-allocation/asset-allocation-table"
import { WCPolicySectionForm } from "./wc-policy/wc-policy-table"
import { SectionIncompleteNote } from "@/components/fields/section-incomplete-note"

type TrainingSectionKey = "assetAllocations" | "wcPolicies"
type SectionErrorValue =
  | boolean
  | {
      title?: string
      description: string
    }

interface TrainingAssetsFormProps {
  employeeRecordId?: string | null
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
  showAssetAllocations?: boolean
  showWcPolicies?: boolean
  sectionErrors?: Partial<Record<TrainingSectionKey, SectionErrorValue>>
}

export function TrainingAssetsForm({
  employeeRecordId = null,
  onNextTab: _onNextTab,
  onPreviousTab: _onPreviousTab,
  mode = "add",
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
  showAssetAllocations = true,
  showWcPolicies = true,
  sectionErrors,
}: TrainingAssetsFormProps) {
  const searchParams = useSearchParams()
  const modeParam = searchParams.get("mode")
  const currentMode =
    modeParam === "add" || modeParam === "edit" || modeParam === "view" ? modeParam : mode
  if (!showAssetAllocations && !showWcPolicies) {
    return null
  }

  const renderSectionError = (key: TrainingSectionKey) => {
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
          {/* <TrainingProgramsSectionForm
            employeeRecordId={employeeRecordId}
            mode={currentMode as "add" | "edit" | "view"}
            employeeSearchUrl={employeeSearchUrl}
            onSubmit={onSubmit}
          />
          <Separator /> */}
          {showAssetAllocations && (
            <>
              {renderSectionError("assetAllocations")}
              <AssetAllocationSectionForm
                employeeRecordId={employeeRecordId}
                mode={currentMode as "add" | "edit" | "view"}
                employeeSearchUrl={employeeSearchUrl}
                employeeCollectionUrl={employeeCollectionUrl}
              />
            </>
          )}
          {showAssetAllocations && showWcPolicies && <Separator />}
          {showWcPolicies && (
            <>
              {renderSectionError("wcPolicies")}
              <WCPolicySectionForm
                employeeRecordId={employeeRecordId}
                mode={currentMode as "add" | "edit" | "view"}
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

export default function TrainingAssetsFormWithPreview(props: any) {
  return <TrainingAssetsForm {...props} />
}
