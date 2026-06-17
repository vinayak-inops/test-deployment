"use client"

import { useState } from "react"
import { Sidebar } from "@/components/fields/sidebar-local"
import SidebarFromHeader from "@/components/header/sidebar-from-header"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import EmployeeWageTemplateForm from "./employee-wage-template-form"
import SalaryHeadsSectionTable from "./form/independen-salary-heads/salary-heads-section-table"
import DependentSalaryHeadsSectionTable from "./form/dependent-salary-heads/dependent-salary-heads-section-table"

type Mode = "add" | "edit" | "view"
type SectionId = "template" | "independentSalaryHeads" | "dependentSalaryHeads"

type Props = {
  mode: Mode
  rowId?: string | null
  tenantCode?: string
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

const EMPLOYEE_WAGE_TEMPLATE_SECTIONS = [
  {
    title: "Employee Wage Template",
    items: [
      { id: "template", label: "Template Details", icon: "user-circle" },
      { id: "independentSalaryHeads", label: "Independent Salary Heads", icon: "file-text" },
      { id: "dependentSalaryHeads", label: "Dependent Salary Heads", icon: "git-branch" },
    ],
  },
]

export default function EmployeeWageTemplateFormController({
  mode,
  rowId,
  tenantCode: propTenantCode,
  onClose,
  onSaved,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode

  const [activeTab, setActiveTab] = useState<SectionId>("template")

  return (
    <div>
      <SidebarFromHeader
        title="Employee Wage Template"
        description="Create and manage employee wage template configuration"
        showBackButton
        onBack={onClose}
        canAdd={false}
      />
      <div className="space-y-0 max-w-7xl mx-auto w-full">
        <div className="flex gap-6">
          <div className="sticky top-0 self-start">
            <Sidebar
              sections={EMPLOYEE_WAGE_TEMPLATE_SECTIONS}
              activeId={activeTab}
              onItemClick={(id) => setActiveTab(id as SectionId)}
            />
          </div>
          <main className="flex-1 min-w-0 pt-4 pb-4">
            {activeTab === "template" && (
              <EmployeeWageTemplateForm
                mode={mode}
                rowId={rowId}
                tenantCode={tenantCode}
                onClose={onClose}
                onSaved={onSaved}
              />
            )}
            {activeTab === "independentSalaryHeads" && (
              <SalaryHeadsSectionTable
                mode={mode}
                rowId={rowId}
                tenantCode={tenantCode}
                onSaved={onSaved}
              />
            )}
            {activeTab === "dependentSalaryHeads" && (
              <DependentSalaryHeadsSectionTable
                mode={mode}
                rowId={rowId}
                tenantCode={tenantCode}
                onSaved={onSaved}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
