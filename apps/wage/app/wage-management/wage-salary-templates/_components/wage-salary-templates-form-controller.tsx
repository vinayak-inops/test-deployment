"use client"

import { Sidebar } from "@/components/fields/sidebar-local"
import SidebarFromHeader from "@/components/header/sidebar-from-header"
import { useMemo, useState } from "react"
import WageSalaryTemplatesForm from "./wage-salary-templates-form"
import type { WageSalaryTemplateRow } from "./hooks/useWagesalaryTemplateslogic"
import SalaryHeadsSectionTable from "./form/independen-salary-heads/salary-heads-section-table"
import TemplateSalaryHeadsSectionTable from "./form/salary-heads/template-salary-heads-section-table"
import DependentSalaryHeadsSectionTable from "./form/dependent-salary-heads/dependent-salary-heads-section-table"
import type { SalaryHeadItem } from "./schemas/salary-head.schema"

type Mode = "add" | "edit" | "view"
type SectionId = "basic" | "salaryHeads" | "independentSalaryHeads" | "dependentSalaryHeads"

type Props = {
  mode: Mode
  rowId?: string | null
  initialValues?: WageSalaryTemplateRow["raw"]
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

const WAGE_SALARY_TEMPLATE_SECTIONS = [
  {
    title: "Wage Salary Template",
    items: [
      { id: "basic", label: "Basic Details", icon: "user-circle" },
      // { id: "salaryHeads", label: "Salary Heads", icon: "calendar" },
      { id: "independentSalaryHeads", label: "Independent Salary Heads", icon: "calendar" },
      { id: "dependentSalaryHeads", label: "Dependent Salary Heads", icon: "calendar" },
    ],
  },
]

export default function WageSalaryTemplatesFormController({
  mode,
  rowId,
  initialValues,
  onClose,
  onSaved,
}: Props) {
  const [activeTab, setActiveTab] = useState<SectionId>("basic")

  const isViewMode = mode === "view"

  return (
    <div>
      <SidebarFromHeader
        title="Wage Salary Template"
        description="Create and manage wage salary templates"
        showBackButton
        onBack={onClose}
        canAdd={false}
      />
      <div className="space-y-0 max-w-7xl mx-auto w-full">
        <div className="flex gap-6">
          <div className="sticky top-0 self-start">
            <Sidebar sections={WAGE_SALARY_TEMPLATE_SECTIONS} activeId={activeTab} onItemClick={(id) => setActiveTab(id as SectionId)} />
          </div>
          <main className="flex-1 min-w-0 pt-4 pb-4">
            {activeTab === "basic" ? (
              <WageSalaryTemplatesForm
                mode={mode}
                rowId={rowId}
                onClose={onClose}
                onSaved={onSaved}
              />
            ) : activeTab === "salaryHeads" ? (
              <TemplateSalaryHeadsSectionTable
                addMode={true}
                editMode={true}
                deleteMode={true}  
                templateId={rowId}
              />
            ) : activeTab === "independentSalaryHeads" ? (
              <SalaryHeadsSectionTable
                addMode={true}
                editMode={true}
                deleteMode={true}  
                wageSalaryHeadId={rowId}
              />
            ) : (
              <DependentSalaryHeadsSectionTable
                addMode={true}
                editMode={true}
                deleteMode={true}  
                wageSalaryHeadId={rowId}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
