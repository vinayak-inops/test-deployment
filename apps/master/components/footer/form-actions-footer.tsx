import ActionButtons from "@/components/common/action-buttons"
import { ArrowLeft } from "lucide-react"

interface FormActionsFooterProps {
  onPreviousTab?: () => void
  isViewMode: boolean
  isValid: boolean
  showErrors: boolean
  errorCount: number
  postLoading: boolean
  onSave: () => void
}

export function FormActionsFooter({
  onPreviousTab,
  isViewMode,
  isValid,
  showErrors,
  errorCount,
  postLoading,
  onSave,
}: FormActionsFooterProps) {
  if (!onPreviousTab && isViewMode) return null

  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
      <div className="flex justify-between items-center w-full gap-4 flex-wrap">
        <div>
          {/* {onPreviousTab && (
            <button
              type="button"
              onClick={onPreviousTab}
              className="h-8 px-3 py-1.5 text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md inline-flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
          )} */}
        </div>

        {!isViewMode && (
          <div className="flex items-center gap-3">
            {!isValid && showErrors && errorCount > 0 && (
              <span className="text-xs text-red-600">Please complete all required fields</span>
            )}
            <ActionButtons
              layout="end"
              gap="gap-3"
              // secondaryLabel="Continue"
              // onSecondary={onContinue}
              secondaryOnly={true}
              primaryLabel={isViewMode ? "Close" : "Save Details"}
              onPrimary={onSave}
              primaryLoading={postLoading}
              primaryDisabled={postLoading}
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            />
          </div>
        )}
      </div>
    </div>
  )
}
