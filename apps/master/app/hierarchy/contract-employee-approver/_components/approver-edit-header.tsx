"use client"

import { ArrowLeft, Users } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ApproverEditHeaderProps {
  mode?: "add" | "edit" | "view"
  onBack: () => void
  employeeID?: string
}

export default function ApproverEditHeader({
  mode = "edit",
  onBack,
  employeeID,
}: ApproverEditHeaderProps) {
  const getTitle = () => {
    switch (mode) {
      case "edit":
        return "Edit Contract Employee Approver"
      case "view":
        return "View Contract Employee Approver"
      default:
        return "Create Contract Employee Approver"
    }
  }

  const getSubtitle = () => {
    if (employeeID) {
      return (
        <>
          Managing approvers for: <span className="font-medium text-slate-700">{employeeID}</span>
        </>
      )
    }
    return "Configure approvers for leave, punch, shift, and out duty"
  }

  return (
    <div className="backdrop-blur px-12">
      <div className="flex justify-center">
        <div className="w-full max-w-8xl px-8 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Icon at the start */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">
                  {getTitle()}
                </h1>
                <p className="text-xs text-slate-500">
                  {getSubtitle()}
                </p>
              </div>
            </div>
            {/* Back button on the right */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={onBack}
                variant="ghost"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-800 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

