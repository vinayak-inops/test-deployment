"use client"

import { useState } from "react"
import { Sidebar } from "@/components/fields/sidebar-local"
import SidebarFromHeader from "@/components/header/sidebar-from-header"
import EmployerLWFContributionsSectionTable from "./form/employer/employer-lwf-contributions-section-table"
import EmployeeLWFContributionsSectionTable from "./form/employee/employee-lwf-contributions-section-table"
import WageEmployerContributionsForm from "./wage-employer-contributions-form"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

type Mode = "add" | "edit" | "view"
type SectionId = "contributions" | "lwfEmployer" | "lwfEmployee"

type Props = {
  mode: Mode
  rowId?: string | null
  tenantCode?: string
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

const WAGE_EMPLOYER_CONTRIBUTIONS_SECTIONS = [
  {
    title: "Employer Contributions",
    items: [
      { id: "contributions", label: "PF & ESI", icon: "shield" },
      { id: "lwfEmployer", label: "Employer LWF", icon: "landmark" },
      { id: "lwfEmployee", label: "Employee LWF", icon: "landmark" },
    ],
  },
]

export default function WageEmployerContributionsFormController({
  mode,
  rowId,
  tenantCode: propTenantCode,
  onClose,
  onSaved,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode
  
  const [activeTab, setActiveTab] = useState<SectionId>("contributions")

  return (
    <div>
      <SidebarFromHeader
        title="Wage Employer Contributions"
        description="Create and manage PF and ESI employer contribution configuration"
        showBackButton
        onBack={onClose}
        canAdd={false}
      />
      <div className="space-y-0 max-w-7xl mx-auto w-full">
        <div className="flex gap-6">
          <div className="sticky top-0 self-start">
            <Sidebar
              sections={WAGE_EMPLOYER_CONTRIBUTIONS_SECTIONS}
              activeId={activeTab}
              onItemClick={(id) => setActiveTab(id as SectionId)}
            />
          </div>
          <main className="flex-1 min-w-0 pt-4 pb-4">
            {activeTab === "lwfEmployer" && (
              <EmployerLWFContributionsSectionTable
                mode={mode}
                rowId={rowId}
                tenantCode={tenantCode}
                onSaved={onSaved}
              />
            )}
            {activeTab === "lwfEmployee" && (
              <EmployeeLWFContributionsSectionTable
                mode={mode}
                rowId={rowId}
                tenantCode={tenantCode}
                onSaved={onSaved}
              />
            )}
            {activeTab === "contributions" && (
              <WageEmployerContributionsForm
                mode={mode}
                rowId={rowId}
                tenantCode={tenantCode}
                onClose={onClose}
                onSaved={onSaved}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
