"use client"

import { useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@repo/ui/components/ui/button"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Sidebar } from "@/components/fields/sidebar-local"
import SidebarFromHeader from "@/components/header/sidebar-from-header"
import ProfessionalTaxBasicDetailsTab from "./professional-tax-basic-details-tab"
import ProfessionalTaxSlabsTab from "./from/slabs/professional-tax-slabs-tab"
import {
  defaultProfessionalTaxFormValues,
  type ProfessionalTaxFormValues,
  type ProfessionalTaxSlab,
} from "./schemas/professional-tax.schema"
import { validateProfessionalTaxBasicDetails } from "./schemas/professional-tax-basic-details.schema"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/serach/use-aggregate-array-fetch"

type Mode = "add" | "edit" | "view"
type SectionId = "basic" | "slabs"

interface ProfessionalTaxFormControllerProps {
  mode?: Mode
  rowId?: string | null
  onClose?: () => void
  onSaved?: () => Promise<void> | void
}

const PROFESSIONAL_TAX_SECTIONS = [
  {
    title: "Professional Tax",
    items: [
      { id: "basic", label: "Basic Details", icon: "user-circle" },
      { id: "slabs", label: "Slabs", icon: "calendar" },
    ],
  },
]

const PROFESSIONAL_TAX_SECTION_ORDER: SectionId[] = ["basic", "slabs"]

const createSlab = (): ProfessionalTaxSlab => ({ from: 0, to: 0, amount: 0, parseID: crypto.randomUUID() })

export function ProfessionalTaxFormController({ mode = "add", rowId, onClose, onSaved }: ProfessionalTaxFormControllerProps) {
  const isViewMode = mode === "view"
  const tenantCode = useGetTenantCode()
  const searchParams = useSearchParams()
  const queryRowId = searchParams.get("id")
  const effectiveRowId = queryRowId || rowId || null
  const [activeTab, setActiveTab] = useState<SectionId>("basic")
  const [showErrors, setShowErrors] = useState(false)
  const [basicFieldErrors, setBasicFieldErrors] = useState<Partial<Record<"country" | "state" | "effectiveFrom" | "applicableTo", string>>>({})

  const [formData, setFormData] = useState<ProfessionalTaxFormValues>({
    ...defaultProfessionalTaxFormValues,
  })

  const organizationCriteriaRequests = useMemo(() => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []), [tenantCode])
  const { arrayData: countryArray } = useAggregateArrayFetch<any>({ collection: "organization", criteriaRequests: organizationCriteriaRequests, arrayField: "country", enabled: Boolean(tenantCode), defaultValue: [] })
  const { arrayData: stateArray } = useAggregateArrayFetch<any>({ collection: "organization", criteriaRequests: organizationCriteriaRequests, arrayField: "state", enabled: Boolean(tenantCode), defaultValue: [] })

  const countryOptions = useMemo(() => (countryArray || []).map((country: any) => ({ value: country.countryCode, label: country.countryName })), [countryArray])
  const stateOptions = useMemo(() => {
    if (!formData.country) return []
    return (stateArray || []).filter((state: any) => state.countryCode === formData.country || state.countryCode === formData.country.substring(0, 2) || formData.country.startsWith(state.countryCode)).map((state: any) => ({ value: state.stateCode, label: state.region ? `${state.stateName} - ${state.region}` : state.stateName }))
  }, [stateArray, formData.country])

  const isStep1Valid = useMemo(() => Boolean(formData.country.trim() && formData.state.trim() && formData.effectiveFrom.trim() && formData.applicableTo.trim()), [formData.country, formData.state, formData.effectiveFrom, formData.applicableTo])
  const isStep2Valid = useMemo(() => Array.isArray(formData.slabs) && formData.slabs.length > 0 && formData.slabs.every((slab) => slab.from >= 0 && slab.to >= slab.from && slab.amount >= 0 && slab.parseID), [formData.slabs])

  const updateField = <K extends keyof ProfessionalTaxFormValues>(field: K, value: ProfessionalTaxFormValues[K]) => setFormData((prev) => ({ ...prev, [field]: value }))
  const updateSlab = (_index: number, _key: keyof ProfessionalTaxSlab, _value: number | string) => {}

  const handleNextTab = () => {
    if (activeTab === "basic") {
      const validation = validateProfessionalTaxBasicDetails({ country: formData.country, state: formData.state, effectiveFrom: formData.effectiveFrom, applicableTo: formData.applicableTo })
      if (!validation.success) {
        setBasicFieldErrors(validation.errors)
        setShowErrors(true)
        return
      }
      setBasicFieldErrors({})
      setShowErrors(false)
      setActiveTab("slabs")
      return
    }
  }

  const handlePreviousTab = () => {
    if (activeTab === "slabs") {
      setActiveTab("basic")
      setShowErrors(false)
    }
  }

  const handleTabClick = (tabValue: string) => {
    if (tabValue !== "basic" && tabValue !== "slabs") return
    if (isViewMode) return setActiveTab(tabValue)
    if (tabValue === "slabs" && !isStep1Valid) {
      setShowErrors(true)
      return
    }
    setShowErrors(false)
    setActiveTab(tabValue)
  }

  const activeTabIndex = PROFESSIONAL_TAX_SECTION_ORDER.indexOf(activeTab)
  const hasPreviousTab = activeTabIndex > 0

  return (
    <div className="">
      <SidebarFromHeader
        title="Professional Tax"
        description="Create and manage professional tax configuration"
        showBackButton
        onBack={onClose}
        canAdd={false}
      />
      <div className="space-y-0 max-w-7xl mx-auto w-full py-2">
        <div className="flex gap-6">
          <div className="sticky top-0 self-start">
            <Sidebar sections={PROFESSIONAL_TAX_SECTIONS} activeId={activeTab} onItemClick={(id) => handleTabClick(id as string)} />
          </div>
          <main className="flex-1 min-w-0">
            <div className="space-y-6 py-2">
              {activeTab === "basic" && (
                <ProfessionalTaxBasicDetailsTab
                  mode={mode}
                  rowId={effectiveRowId}
                  formData={formData}
                  isViewMode={isViewMode}
                  submitLoading={false}
                  isStepValid={isStep1Valid}
                  fieldErrors={basicFieldErrors}
                  onFieldErrorsChange={setBasicFieldErrors}
                  onSaved={onSaved}
                  onClose={onClose}
                  onChange={updateField}
                  countryOptions={countryOptions}
                  stateOptions={stateOptions}
                />
              )}

              {activeTab === "slabs" && (
                <ProfessionalTaxSlabsTab
                  formData={formData}
                  isViewMode={isViewMode}
                  submitLoading={false}
                  isStepValid={isStep2Valid}
                  onSave={onClose ?? (() => {})}
                  onChange={updateField}
                  onSlabChange={updateSlab}
                  createSlab={createSlab}
                />
              )}

              {showErrors && <p className="text-sm text-red-600 mt-3">{activeTab === "basic" ? "Fill all required basic details." : "Add at least one valid slab row."}</p>}
            </div>
            <div className="pt-2 pb-6">
              <div className="flex items-center justify-between gap-4">
                <Button type="button" variant="outline" onClick={handlePreviousTab} disabled={!hasPreviousTab} className="px-3 py-1.5 h-8 text-sm bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 disabled:opacity-100 disabled:text-gray-700">
                  <ArrowLeft className="h-4 w-4 mr-1" />Back
                </Button>
                {activeTabIndex < PROFESSIONAL_TAX_SECTION_ORDER.length - 1 && (
                  <Button type="button" onClick={handleNextTab} disabled={isViewMode} className="px-3 py-1.5 h-8 text-sm bg-blue-600 hover:bg-blue-700 text-white">
                    Continue<ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default ProfessionalTaxFormController