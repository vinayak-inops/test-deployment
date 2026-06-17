"use client"

import { useState } from "react"
import { Sidebar } from "@/components/fields/sidebar-local"
import SidebarFromHeader from "@/components/header/sidebar-from-header"
import OtPolicyForm from "./ot-policy-form"
import OtRoundingTab from "./form/ot-rounding-tab"
import type { OtRoundingItem } from "./form/ot-rounding-form-popup"

type Mode = "add" | "edit" | "view"
type SectionId = "policy" | "rounding"

type Props = {
  mode: Mode
  rowId?: string | null
  tenantCode?: string
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

const OT_POLICY_SECTIONS = [
  {
    title: "OT Policy Configuration",
    items: [
      { id: "policy", label: "Policy Identity", icon: "file-text" },
      { id: "rounding", label: "Rounding", icon: "calculator" },
    ],
  },
]

export default function OtPolicyFormController({
  mode,
  rowId,
  tenantCode,
  onClose,
  onSaved,
}: Props) {
  const [activeTab, setActiveTab] = useState<SectionId>("policy")
  const [roundingSlabs, setRoundingSlabs] = useState<OtRoundingItem[]>([])
  const isViewMode = mode === "view"

  return (
    <div>
      <SidebarFromHeader
        title="OT Policy"
        description="Create and manage Overtime Policy configuration"
        showBackButton
        onBack={onClose}
        canAdd={false}
      />
      <div className="space-y-0 max-w-7xl mx-auto w-full">
        <div className="flex gap-6">
          <div className="sticky top-0 self-start">
            <Sidebar
              sections={OT_POLICY_SECTIONS}
              activeId={activeTab}
              onItemClick={(id) => setActiveTab(id as SectionId)}
            />
          </div>
          <main className="flex-1 min-w-0 pt-4 pb-4">
            <div className={activeTab === "policy" ? "" : "hidden"}>
              <OtPolicyForm
                mode={mode}
                rowId={rowId}
                onClose={onClose}
                onSaved={onSaved}
              />
            </div>
            {activeTab === "rounding" && (
              <OtRoundingTab
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
