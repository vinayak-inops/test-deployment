"use client"

import { useState } from "react"
import { Sidebar } from "@/components/fields/sidebar-local"
import SidebarFromHeader from "@/components/header/sidebar-from-header"
import CompOffPolicyForm from "./compoff-policy-form"
import CompOffRoundingTab from "./form/rounding/compoff-rounding-tab"
import type { CompOffRoundingItem } from "./form/rounding/compoff-rounding-form-popup"

type Mode = "add" | "edit" | "view"
type SectionId = "policy" | "rounding"

type Props = {
  mode: Mode
  rowId?: string | null
  tenantCode?: string
  employeeId?: string
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

const COMP_OFF_POLICY_SECTIONS = [
  {
    title: "Comp-Off Policy Configuration",
    items: [
      { id: "policy", label: "Policy Details", icon: "file-text" },
      { id: "rounding", label: "Rounding", icon: "calculator" },
    ],
  },
]

export default function CompOffPolicyFormController({
  mode,
  rowId,
  tenantCode,
  employeeId,
  onClose,
  onSaved,
}: Props) {
  const [activeTab, setActiveTab] = useState<SectionId>("policy")
  const [roundingSlabs, setRoundingSlabs] = useState<CompOffRoundingItem[]>([])
  const isViewMode = mode === "view"

  return (
    <div>
      <SidebarFromHeader
        title="Comp-Off Policy"
        description="Create and manage Comp-Off Policy configuration"
        showBackButton
        onBack={onClose}
        canAdd={false}
      />
      <div className="space-y-0 max-w-7xl mx-auto w-full">
        <div className="flex gap-6">
          <div className="sticky top-0 self-start">
            <Sidebar
              sections={COMP_OFF_POLICY_SECTIONS}
              activeId={activeTab}
              onItemClick={(id) => setActiveTab(id as SectionId)}
            />
          </div>
          <main className="flex-1 min-w-0 pt-4 pb-4">
            <div className={activeTab === "policy" ? "" : "hidden"}>
              <CompOffPolicyForm
                mode={mode}
                rowId={rowId}
                tenantCode={tenantCode}
                employeeId={employeeId}
                onClose={onClose}
                onSaved={onSaved}
                roundingSlabs={roundingSlabs}
                onRoundingLoad={setRoundingSlabs}
              />
            </div>
            {activeTab === "rounding" && (
              <CompOffRoundingTab
                value={roundingSlabs}
                isViewMode={isViewMode}
                onChange={setRoundingSlabs}
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
