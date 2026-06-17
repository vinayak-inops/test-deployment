"use client"

import { useState } from "react"
import { Sidebar } from "@/components/fields/sidebar-local"
import SidebarFromHeader from "@/components/header/sidebar-from-header"
import EmpCategorySettingForm from "./employee-category-setting-form"
import NotificationSettingsTab from "./form/notification/notification-settings-tab"
import DefaultWeekOffsTab from "./form/default-week-offs/default-week-offs-tab"
import type { NotificationSettingItem } from "./form/notification/notification-settings-form-popup"
import type { DefaultWeekOffItem } from "./form/default-week-offs/default-week-offs-form-popup"

type Mode = "add" | "edit" | "view"
type SectionId = "setting" | "notifications" | "weekoffs"

type Props = {
  mode: Mode
  rowId?: string | null
  tenantCode?: string
  employeeId?: string
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

const EMP_CATEGORY_SETTING_SECTIONS = [
  {
    title: "Employee Category Setting",
    items: [
      { id: "setting",       label: "Setting Details",     icon: "settings"       },
      { id: "notifications", label: "Notifications",       icon: "alert"          },
      { id: "weekoffs",      label: "Default Week Offs",   icon: "calendar"       },
    ],
  },
]

export default function EmpCategorySettingFormController({
  mode,
  rowId,
  tenantCode,
  employeeId,
  onClose,
  onSaved,
}: Props) {
  const [activeTab, setActiveTab] = useState<SectionId>("setting")
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettingItem[]>([])
  const [defaultWeekOffs, setDefaultWeekOffs] = useState<DefaultWeekOffItem[]>([])
  const isViewMode = mode === "view"

  return (
    <div>
      <SidebarFromHeader
        title="Employee Category Setting"
        description="Create and manage employee category settings"
        showBackButton
        onBack={onClose}
        canAdd={false}
      />
      <div className="space-y-0 max-w-7xl mx-auto w-full">
        <div className="flex gap-6">
          <div className="sticky top-0 self-start">
            <Sidebar
              sections={EMP_CATEGORY_SETTING_SECTIONS}
              activeId={activeTab}
              onItemClick={(id) => setActiveTab(id as SectionId)}
            />
          </div>
          <main className="flex-1 min-w-0 pt-4 pb-4">
            <div className={activeTab === "setting" ? "" : "hidden"}>
              <EmpCategorySettingForm
                mode={mode}
                rowId={rowId}
                tenantCode={tenantCode}
                employeeId={employeeId}
                onClose={onClose}
                onSaved={onSaved}
                notificationSettings={notificationSettings}
                defaultWeekOffs={defaultWeekOffs}
                onNotificationLoad={setNotificationSettings}
                onDefaultWeekOffsLoad={setDefaultWeekOffs}
              />
            </div>
            {activeTab === "notifications" && (
              <NotificationSettingsTab
                rows={notificationSettings}
                isViewMode={isViewMode}
                onChange={setNotificationSettings}
                rowId={rowId}
                tenantCode={tenantCode}
              />
            )}
            {activeTab === "weekoffs" && (
              <DefaultWeekOffsTab
                rows={defaultWeekOffs}
                isViewMode={isViewMode}
                onChange={setDefaultWeekOffs}
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
