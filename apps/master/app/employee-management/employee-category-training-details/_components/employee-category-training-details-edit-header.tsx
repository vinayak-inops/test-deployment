"use client"

import { ArrowLeft, GraduationCap } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"

interface EmployeeCategoryTrainingDetailsEditHeaderProps {
  mode?: "add" | "edit" | "view"
  onBack: () => void
  employeeCategoryCode?: string
}

export default function EmployeeCategoryTrainingDetailsEditHeader({
  mode = "edit",
  onBack,
  employeeCategoryCode,
}: EmployeeCategoryTrainingDetailsEditHeaderProps) {
  const getTitle = () => {
    switch (mode) {
      case "edit":
        return "Edit Employee Category Training Details"
      case "view":
        return "View Employee Category Training Details"
      default:
        return "Create Employee Category Training Details"
    }
  }

  const getSubtitle = () => {
    if (employeeCategoryCode) {
      return (
        <>
          Managing trainings for: <span className="font-medium text-slate-700">{employeeCategoryCode}</span>
        </>
      )
    }
    return "Manage trainings mapped to employee categories"
  }

  return (
    <div className="backdrop-blur">
      <div className="flex justify-center">
        <div className="w-full py-4 border-b border-slate-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-gray-600" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{getTitle()}</h1>
                <p className="text-xs text-slate-500">{getSubtitle()}</p>
              </div>
            </div>

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


