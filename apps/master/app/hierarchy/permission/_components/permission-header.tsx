"use client"

import { ArrowLeft, Shield } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"

interface PermissionHeaderProps {
  entitlementCode: string
  onBack: () => void
}

export default function PermissionHeader({
  entitlementCode,
  onBack,
}: PermissionHeaderProps) {
  return (
    <div className=" backdrop-blur border-b border-slate-200 px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Icon at the start */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Shield className="h-5 w-5 text-gray-600" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">
              Role Permissions
            </h1>
            <p className="text-xs text-slate-500">
              Managing permissions for: <span className="font-medium text-slate-700">{entitlementCode}</span>
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
  )
}

