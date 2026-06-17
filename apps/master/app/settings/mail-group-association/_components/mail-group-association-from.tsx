"use client"

import { ArrowLeft, Mail } from "lucide-react"
import { useMemo, useState } from "react"
import { Sidebar } from "@/components/fields/sidebar-local"
import MailGroupAssociationPrimaryEmailSection from "./form/primary-email/mail-group-association-primary-email-section"
import MailGroupAssociationCcEmailSection from "./form/cc-email/mail-group-association-cc-email-section"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"

type Mode = "add" | "edit" | "view"
type SectionId = "primaryEmail" | "ccEmail"

interface Props {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  recordId?: string | null
  isEditMode?: boolean
  isViewMode?: boolean
  layout?: "popup" | "page"
  onBack?: () => void
}

export default function MailGroupAssociationForm({
  setOpen,
  recordId,
  isEditMode,
  isViewMode,
  layout = "popup",
  onBack,
}: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>("primaryEmail")
  const mode: Mode = isViewMode ? "view" : isEditMode ? "edit" : "add"
  const tenantCode = useGetTenantCode()

  const criteria = useMemo(() => {
    if (!recordId) return []
    return [
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
      { field: "_id", operator: "eq", value: String(recordId) },
    ]
  }, [recordId, tenantCode])

  const { data: associationData } = useRequest<any>({
    url: "mailGroupAssociation/search",
    method: "POST",
    data: criteria,
    dependencies: [recordId, tenantCode],
  })

  const headerMailGroupCode = useMemo(() => {
    const rec = Array.isArray(associationData) ? associationData[0] : null
    return rec?.mailGroup ? String(rec.mailGroup) : ""
  }, [associationData])

  const handleCancel = () => {
    if (layout === "page") {
      onBack?.()
      return
    }
    setOpen(false)
  }

  const sidebarSections = [
    {
      title: "Mail Group Association",
      items: [
        { id: "primaryEmail", label: "Primary Emails", icon: "user-circle" },
        { id: "ccEmail", label: "CC Emails", icon: "file-text" },
      ],
    },
  ]

  const sectionContent =
    activeSection === "primaryEmail" ? (
      <MailGroupAssociationPrimaryEmailSection mode={mode} recordId={recordId} />
    ) : (
      <MailGroupAssociationCcEmailSection mode={mode} recordId={recordId} />
    )

  if (layout === "page") {
    return (
      <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden relative">
        <div className="px-8 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex items-center justify-center h-9 w-9 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900">
                {mode === "view" ? "View Mail Group Association" : mode === "edit" ? "Edit Mail Group Association" : "Create Mail Group Association"}
              </h1>
              <p className="text-sm text-slate-500">
                {headerMailGroupCode
                  ? `Mail Group: ${headerMailGroupCode}`
                  : "Configure mail group and recipients"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center flex-1 overflow-hidden">
          <div className="w-full max-w-7xl h-full flex flex-col">
            <div className="flex w-full h-full overflow-hidden">
              <div className="flex-shrink-0 h-full">
                <Sidebar
                  sections={sidebarSections}
                  activeId={activeSection}
                  onItemClick={(id) => setActiveSection(id as SectionId)}
                />
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 pt-6 min-w-0">
                <div className="">
                  <div className="space-y-6">{sectionContent}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between rounded-t-lg -mx-6 pt-4 mb-2">
        <div className="group cursor-default pl-8">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 shadow-sm">
                <Mail className="w-5 h-5 text-gray-700" />
              </div>
            </div>
            <div>
              <h1 className="text-lg font-bold">
                {mode === "view" ? "View Mail Group Association" : mode === "edit" ? "Edit Mail Group Association" : "Add Mail Group Association"}
              </h1>
              {headerMailGroupCode ? (
                <p className="text-xs text-blue-100 mt-0.5">Mail Group: {headerMailGroupCode}</p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6">{sectionContent}</div>
      </div>
    </div>
  )
}
