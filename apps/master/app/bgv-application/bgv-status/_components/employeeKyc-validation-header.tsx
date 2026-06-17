"use client";

import { MoreVertical, ShieldCheck } from "lucide-react";

interface EmployeeKycValidationHeaderProps {
  title?: string;
  description?: string;
}

export default function EmployeeKycValidationHeader({
  title = "Employee KYC Validation",
  description = "Manage and review employee KYC verification records",
}: EmployeeKycValidationHeaderProps) {
  return (
    <div className="backdrop-blur border-b border-slate-200 px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
            <p className="text-sm text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-800 hover:bg-slate-50 transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}