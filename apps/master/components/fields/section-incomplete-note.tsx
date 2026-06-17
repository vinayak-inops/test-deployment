"use client";

import { AlertCircle } from "lucide-react";

export function SectionIncompleteNote({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-red-100 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-red-900">{title}</h3>
          <p className="text-[11px] text-red-700 mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  );
}
