"use client"

import { Wrench } from "lucide-react"

export default function UnderDevelopment() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-6">
          <Wrench className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Under Development
        </h3>
        <p className="text-sm text-slate-600">
          This feature is currently being developed and will be available soon.
        </p>
      </div>
    </div>
  )
}

