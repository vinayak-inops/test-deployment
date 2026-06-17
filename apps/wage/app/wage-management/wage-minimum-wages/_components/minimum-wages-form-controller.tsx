"use client"

import { Sidebar } from "@/components/fields/sidebar-local"
import SidebarFromHeader from "@/components/header/sidebar-from-header"
import { useState } from "react"
import MinimumWagesForm from "./minimum-wages-form"
import type { MinimumWagesRow } from "./hooks/useMinimumwageSlogic"
import SalaryHeadsSectionTable from "./form/salary-heads/salary-heads-section-table"
import type { SalaryHeadItem } from "./schemas/salary-head.schema"

type Mode = "add" | "edit" | "view"
type SectionId = "basic" | "salaryHeads"

type Props = {
  mode: Mode
  rowId?: string | null
  initialValues?: MinimumWagesRow["raw"]
  tenantCode?: string
  employeeId?: string | null
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

const MINIMUM_WAGES_SECTIONS = [
  {
    title: "Minimum Wages",
    items: [
      { id: "basic", label: "Basic Details", icon: "user-circle" },
      { id: "salaryHeads", label: "Salary Heads", icon: "calendar" },
    ],
  },
]

export default function MinimumWagesFormController({
  mode,
  rowId,
  initialValues,
  tenantCode,
  employeeId,
  onClose,
  onSaved,
}: Props) {
  const [activeTab, setActiveTab] = useState<SectionId>("basic")
  const [salaryHeads, setSalaryHeads] = useState<SalaryHeadItem[]>(
    Array.isArray((initialValues as any)?.salaryHeads) ? (initialValues as any).salaryHeads : [],
  )
  const isViewMode = mode === "view"

  return (
    <div>
      <SidebarFromHeader
        title="Minimum Wages"
        description="Create and manage minimum wages configuration"
        showBackButton
        onBack={onClose}
        canAdd={false}
      />
      <div className="space-y-0 max-w-7xl mx-auto w-full ">
        <div className="flex gap-6">
          <div className="sticky top-0 self-start">
            <Sidebar sections={MINIMUM_WAGES_SECTIONS} activeId={activeTab} onItemClick={(id) => setActiveTab(id as SectionId)} />
          </div>
          <main className="flex-1 min-w-0 pt-4 pb-4">
            {activeTab === "basic" ? (
              <MinimumWagesForm
                mode={mode}
                tenantCode={tenantCode}
                rowId={rowId}
                activeTab={activeTab}
                onClose={() => {}}
                onSaved={onSaved}
              />
            ) : (
              <SalaryHeadsSectionTable
                value={salaryHeads}
                isViewMode={isViewMode}
                error=""
                onChange={setSalaryHeads}
                mode={mode}
                rowId={rowId}
                tenantCode={tenantCode}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
