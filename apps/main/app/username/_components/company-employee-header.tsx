"use client"

import { User } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"

interface EmployeeDeploymentHeaderProps {
  mode?: "add" | "edit" | "view"
  onBack?: () => void
  employeeID?: string
}

export default function EmployeeDeploymentHeader({
  mode = "view",
  onBack,
  employeeID,
}: EmployeeDeploymentHeaderProps) {

  const getTitle = () => {
    switch (mode) {
      case "edit":
        return "Edit Profile Information"
      case "add":
        return "Create Your Profile"
      default:
        return "Profile Overview"
    }
  }

  const getSubtitle = () => {
    switch (mode) {
      case "edit":
        return "Update your personal and employment information"
      case "add":
        return "Complete your profile to access all system features"
      default:
        return employeeID
          ? `Employee ID: ${employeeID}`
          : "View and manage your personal and employment information in one place"
    }
  }

  return (
    <div className="backdrop-blur px-12">
      <div className="flex justify-center">
        <div className="w-full max-w-8xl px-8 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between gap-4">

            {/* Left Section */}
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-slate-600" />
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

            {/* Right Section – Optional Back Button */}
            {/* {onBack && (
              <Button
                type="button"
                onClick={onBack}
                variant="ghost"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-slate-800 hover:bg-slate-50"
              >
                Back
              </Button>
            )} */}

          </div>
        </div>
      </div>
    </div>
  )
}
