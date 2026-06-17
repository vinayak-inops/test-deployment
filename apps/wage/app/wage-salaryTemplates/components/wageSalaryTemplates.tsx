"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { SelectSearch } from "@repo/ui/components/ui/select-search"
import { Separator } from "@repo/ui/components/ui/separator"
import { Switch } from "@repo/ui/components/ui/switch"
import { toast } from "react-toastify"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Trash2, Building2, Calendar, Users, DollarSign, MapPin, Briefcase, GraduationCap, Settings, ArrowLeft } from "lucide-react"
import { useWageSalaryHeads } from "@/hooks/useWageSalaryHeads"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

type SalaryHead = { salaryHeadCode: string; salaryHeadName: string; amount: number }
type Designation = { designationCode: string; designationName: string }
type Grade = { gradeCode: string; gradeName: string }
type SkillLevel = { skilledLevelTitle: string; skilledLevelDescription: string }
type Subsidiary = { subsidiaryCode: string; subsidiaryName: string }
type Category = { categoryCode: string; categoryName: string }
type Location = { locationCode: string; locationName: string }

type WageSalaryTemplateForm = {
  _id?: { $oid: string }
  organizationCode: string
  tenantCode: string
  name: string
  code: string
  subsidiary: Subsidiary
  state: string
  zone: string
  location: Location
  designation: Designation
  grade: Grade
  category: Category
  skillLevel: SkillLevel
  effectiveFrom: string
  effectiveTo: string
  salaryHeads: SalaryHead[]
  asPerMinimumWages: boolean
  remark: string
  country: string
  independentSalaryHeads: SalaryHead[]
  dependentSalaryHeads: string[]
}

const emptySalaryHead = (): SalaryHead => ({ salaryHeadCode: "", salaryHeadName: "", amount: 0 })
const emptyDesignation = (): Designation => ({ designationCode: "", designationName: "" })
const emptyGrade = (): Grade => ({ gradeCode: "", gradeName: "" })
const emptySkill = (): SkillLevel => ({ skilledLevelTitle: "", skilledLevelDescription: "" })
const emptySubsidiary = (): Subsidiary => ({ subsidiaryCode: "", subsidiaryName: "" })
const emptyCategory = (): Category => ({ categoryCode: "", categoryName: "" })
const emptyLocation = (): Location => ({ locationCode: "", locationName: "" })

const emptyTemplate = (): Omit<WageSalaryTemplateForm, "_id" | "organizationCode" | "tenantCode"> => ({
  name: "",
  code: "",
  subsidiary: emptySubsidiary(),
  state: "",
  zone: "",
  location: emptyLocation(),
  designation: emptyDesignation(),
  grade: emptyGrade(),
  category: emptyCategory(),
  skillLevel: emptySkill(),
  effectiveFrom: "",
  effectiveTo: "",
  asPerMinimumWages: true,
  remark: "",
  salaryHeads: [emptySalaryHead()],
  country: "",
  independentSalaryHeads: [emptySalaryHead()],
  dependentSalaryHeads: [""],
})

export default function WageSalaryTemplates({
  scrollToIndex,
  initialData,
  mode,
}: {
  scrollToIndex?: number
  initialData?: any
  mode?: "add" | "edit" | "view" | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const urlMode = searchParams.get("mode") || "add"
  const tenantCode: string = useGetTenantCode()
  const submitContextRef = useRef<{ mode: "add" | "edit" | "view"; id: string | null }>({
    mode: "add",
    id: null,
  })

  // Use URL mode if available, otherwise fallback to prop mode
  const currentMode = (urlMode as "add" | "edit" | "view") || mode || "add"
  

  // Safe date parsing helper function
  const formatDateForInput = (dateValue: any): string => {
    if (!dateValue) return ""
    try {
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return ""
      return date.toISOString().slice(0, 10)
    } catch (error) {
      console.warn("Invalid date value:", dateValue, error)
      return ""
    }
  }

  const normalizeId = (value: any) => {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object" && value.$oid) return String(value.$oid)
    return String(value)
  }

  const [form, setForm] = useState<WageSalaryTemplateForm>({
    organizationCode: tenantCode,
    tenantCode: tenantCode,
    ...emptyTemplate(),
  })

  const [countries, setCountries] = useState<Array<{ countryCode: string; countryName: string }>>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [countriesError, setCountriesError] = useState<string | null>(null)

  const [states, setStates] = useState<Array<{ stateCode: string; stateName: string }>>([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [statesError, setStatesError] = useState<string | null>(null)

  // Organization data hooks
  const [subsidiaries, setSubsidiaries] = useState<Array<{ subsidiaryCode: string; subsidiaryName: string }>>([])
  const [loadingSubsidiaries, setLoadingSubsidiaries] = useState(false)
  const [subsidiariesError, setSubsidiariesError] = useState<string | null>(null)

  const [locations, setLocations] = useState<Array<{ locationCode: string; locationName: string }>>([])
  const [loadingLocations, setLoadingLocations] = useState(false)
  const [locationsError, setLocationsError] = useState<string | null>(null)

  const [designations, setDesignations] = useState<Array<{ designationCode: string; designationName: string }>>([])
  const [loadingDesignations, setLoadingDesignations] = useState(false)
  const [designationsError, setDesignationsError] = useState<string | null>(null)

  const [grades, setGrades] = useState<Array<{ gradeCode: string; gradeName: string }>>([])
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [gradesError, setGradesError] = useState<string | null>(null)

  const [categories, setCategories] = useState<Array<{ categoryCode: string; categoryName: string }>>([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  const [skillLevels, setSkillLevels] = useState<Array<{ skilledLevelTitle: string; skilledLevelDescription: string }>>(
    [],
  )
  const [loadingSkillLevels, setLoadingSkillLevels] = useState(false)
  const [skillLevelsError, setSkillLevelsError] = useState<string | null>(null)

  // Fetch organization data
  const {
    data: orgData,
    error: orgError,
    loading: orgLoading,
    refetch: fetchOrgData,
  } = useRequest<any[]>({
    url: `map/organization/search?tenantCode=${tenantCode}`,
    onSuccess: (data: any) => {
      if (data && data.length > 0) {
        const orgData = data[0]

        // Process subsidiaries
        const subsidiariesData = orgData.subsidiaries || []
        const processedSubsidiaries = subsidiariesData
          .map((sub: any) => ({
            subsidiaryCode: sub.subsidiaryCode || sub.code || sub.id || "",
            subsidiaryName: sub.subsidiaryName || sub.name || sub.title || "",
          }))
          .filter((sub: any) => sub.subsidiaryCode && sub.subsidiaryCode.trim() !== "")
        setSubsidiaries(processedSubsidiaries)
        setLoadingSubsidiaries(false)

        // Process locations
        const locationsData = orgData.location || []
        const processedLocations = locationsData
          .map((loc: any) => ({
            locationCode: loc.locationCode || loc.code || loc.id || "",
            locationName: loc.locationName || loc.name || loc.title || "",
          }))
          .filter((loc: any) => loc.locationCode && loc.locationCode.trim() !== "")
        setLocations(processedLocations)
        setLoadingLocations(false)

        // Process designations
        const designationsData = orgData.designations || []
        const processedDesignations = designationsData
          .map((des: any) => ({
            designationCode: des.designationCode || des.code || des.id || "",
            designationName: des.designationName || des.name || des.title || "",
          }))
          .filter((des: any) => des.designationCode && des.designationCode.trim() !== "")
        setDesignations(processedDesignations)
        setLoadingDesignations(false)

        // Process grades
        const gradesData = orgData.grades || []
        const processedGrades = gradesData
          .map((grade: any) => ({
            gradeCode: grade.gradeCode || grade.code || grade.id || "",
            gradeName: grade.gradeName || grade.name || grade.title || "",
          }))
          .filter((grade: any) => grade.gradeCode && grade.gradeCode.trim() !== "")
        setGrades(processedGrades)
        setLoadingGrades(false)

        // Process categories
        const categoriesData = orgData.employeeCategories || []
        const processedCategories = categoriesData
          .map((cat: any) => ({
            categoryCode: cat.employeeCategoryCode || cat.categoryCode || cat.code || cat.id || "",
            categoryName: cat.employeeCategoryName || cat.categoryName || cat.name || cat.title || "",
          }))
          .filter((cat: any) => cat.categoryCode && cat.categoryCode.trim() !== "")
        setCategories(processedCategories)
        setLoadingCategories(false)

        // Process countries
        setLoadingCountries(true)
        const countriesData = orgData.country || []
        const processedCountries = countriesData
          .map((country: any) => ({
            countryCode: country.countryCode || country.code || "",
            countryName: country.countryName || country.name || "",
          }))
          .filter((country: any) => country.countryCode && country.countryCode.trim() !== "")
        setCountries(processedCountries)
        setLoadingCountries(false)
        setCountriesError(null)

        // Process states
        setLoadingStates(true)
        const statesData = orgData.state || []
        const processedStates = statesData
          .map((state: any) => ({
            stateCode: state.stateCode || state.code || "",
            stateName: state.stateName || state.name || "",
          }))
          .filter((state: any) => state.stateCode && state.stateCode.trim() !== "")
        setStates(processedStates)
        setLoadingStates(false)
        setStatesError(null)

        // Process skill levels
        setLoadingSkillLevels(true)
        const skillLevelsData = orgData.skillLevels || []
        const processedSkillLevels = skillLevelsData
          .map((skill: any) => ({
            skilledLevelTitle: skill.skilledLevelTitle || skill.title || "",
            skilledLevelDescription: skill.skilledLevelDescription || skill.description || "",
          }))
          .filter((skill: any) => skill.skilledLevelTitle && skill.skilledLevelTitle.trim() !== "")
        setSkillLevels(processedSkillLevels)
        setLoadingSkillLevels(false)
        setSkillLevelsError(null)
      } else {
        setSubsidiaries([])
        setLocations([])
        setDesignations([])
        setGrades([])
        setCategories([])
        setCountries([])
        setStates([])
        setSkillLevels([])
        setLoadingSubsidiaries(false)
        setLoadingLocations(false)
        setLoadingDesignations(false)
        setLoadingGrades(false)
        setLoadingCategories(false)
        setLoadingCountries(false)
        setLoadingStates(false)
        setLoadingSkillLevels(false)
      }
    },
    onError: (error: any) => {
      console.error("Error loading organization data:", error)
      const errorMessage = error.message || "Failed to load organization data"
      setSubsidiariesError(errorMessage)
      setLocationsError(errorMessage)
      setDesignationsError(errorMessage)
      setGradesError(errorMessage)
      setCategoriesError(errorMessage)
      setCountriesError(errorMessage)
      setStatesError(errorMessage)
      setSkillLevelsError(errorMessage)
      setLoadingSubsidiaries(false)
      setLoadingLocations(false)
      setLoadingDesignations(false)
      setLoadingGrades(false)
      setLoadingCategories(false)
      setLoadingCountries(false)
      setLoadingStates(false)
      setLoadingSkillLevels(false)
    },
  })

  // Wage Salary Heads dropdown
  const { salaryHeads: apiSalaryHeads, loading: salaryHeadsLoading, error: salaryHeadsError } = useWageSalaryHeads()

  // Fetch single salary template (edit/view)
  const {
    data: salaryTemplateData,
    loading: salaryTemplateLoading,
    error: salaryTemplateError,
    refetch: fetchSalaryTemplate,
  } = useRequest<any>({
    url: "wageSalaryTemplates/search",
    method: "POST",
    data: [
      {
        field: "_id",
        value: id,
        operator: "eq",
      },
    ],
    onSuccess: (data) => {
      if (data && data[0] && data[0].isDeleted !== true) {
        const row = data[0]
        const st = row.salaryTemplate || row
        let formattedId: { $oid: string } | undefined = undefined
        const normalizedId = normalizeId(row._id || st._id)
        if (normalizedId) {
          formattedId = { $oid: normalizedId }
        }

        setForm({
          _id: formattedId,
          organizationCode: st.organizationCode || tenantCode,
          tenantCode: st.tenantCode || tenantCode,
          name: st.name || "",
          code: st.code || "",
          subsidiary: st.subsidiary || emptySubsidiary(),
          state: st.state || "",
          zone: st.zone || "",
          location: st.location || emptyLocation(),
          designation: st.designation || emptyDesignation(),
          grade: st.grade || emptyGrade(),
          category: st.category || emptyCategory(),
          skillLevel: st.skillLevel || emptySkill(),
          effectiveFrom: formatDateForInput(st.effectiveFrom),
          effectiveTo: formatDateForInput(st.effectiveTo),
          asPerMinimumWages: st.asPerMinimumWages !== undefined ? st.asPerMinimumWages : true,
          remark: st.remark || "",
          salaryHeads:
            Array.isArray(st.salaryHeads) && st.salaryHeads.length > 0
              ? st.salaryHeads.map((h: any) => ({
                  salaryHeadCode: h?.salaryHeadCode || "",
                  salaryHeadName: h?.salaryHeadName || "",
                  amount: Number.isFinite(Number(h?.amount)) ? Number(h.amount) : 0,
                }))
              : [emptySalaryHead()],
          country: st.country || "",
          independentSalaryHeads:
            Array.isArray(st.independentSalaryHeads) && st.independentSalaryHeads.length > 0
              ? st.independentSalaryHeads.map((h: any) => ({
                  salaryHeadCode: h?.salaryHeadCode || "",
                  salaryHeadName: h?.salaryHeadName || "",
                  amount: Number.isFinite(Number(h?.amount)) ? Number(h.amount) : 0,
                }))
              : [emptySalaryHead()],
          dependentSalaryHeads:
            Array.isArray(st.dependentSalaryHeads) && st.dependentSalaryHeads.length > 0
              ? st.dependentSalaryHeads
              : [""],
        })
      }
    },
    onError: (error) => {
      console.error("Error fetching salary template data:", error)
    },
    dependencies: [id],
  })

  const { post: postTemplate, loading: postLoading } = usePostRequest<any>({
    url: "wageSalaryTemplates",
    onSuccess: () => {
      const ctx = submitContextRef.current
      alert(`Salary Template ${ctx.mode === "edit" ? "updated" : "created"} successfully.`)
      setTimeout(() => {
        router.push("/wage-salaryTemplates")
      }, 1000)
    },
    onError: (error) => {
      const ctx = submitContextRef.current
      alert(`Failed to ${ctx.mode === "edit" ? "update" : "save"} Salary Template.`)
      console.error("POST error:", error)
    },
  })

  // Fetch data when in edit/view mode
  useEffect(() => {
    if (currentMode === "view" || currentMode === "edit") {
      fetchSalaryTemplate()
    }
  }, [currentMode, id])

  // Navigation handlers
  const handleBack = () => {
    router.push("/wage-salaryTemplates")
  }

  const handleCancel = () => {
    router.push("/wage-salaryTemplates")
  }

  const getPageTitle = () => {
    switch (currentMode) {
      case "add":
        return "Add New Salary Template"
      case "edit":
        return "Edit Salary Template"
      case "view":
        return "View Salary Template"
      default:
        return "Salary Template Management"
    }
  }

  const getPageDescription = () => {
    switch (currentMode) {
      case "add":
        return "Add new salary template with heads and metadata"
      case "edit":
        return "Edit existing salary template with heads and metadata"
      case "view":
        return "View salary template details (read-only)"
      default:
        return "Manage salary templates with heads and metadata"
    }
  }

  const zones = ["Zone-1", "Zone-2", "Zone-3", "Zone-4"]

  useEffect(() => {
    fetchOrgData()
  }, [tenantCode])

  const isViewMode = currentMode === "view"
  const isEditMode = currentMode === "edit"
  const isAddMode = currentMode === "add"

  const updateRoot = (key: keyof WageSalaryTemplateForm, value: any) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const resetForm = () =>
    setForm({
      organizationCode: tenantCode,
      tenantCode: tenantCode,
      ...emptyTemplate(),
    })

  const addIndependentSalaryHead = () =>
    updateRoot("independentSalaryHeads", [...form.independentSalaryHeads, emptySalaryHead()])
  const removeIndependentSalaryHead = (index: number) =>
    updateRoot(
      "independentSalaryHeads",
      form.independentSalaryHeads.filter((_, i) => i !== index),
    )

  const addDependentSalaryHead = () =>
    updateRoot("dependentSalaryHeads", [...form.dependentSalaryHeads, ""])
  const removeDependentSalaryHead = (index: number) =>
    updateRoot(
      "dependentSalaryHeads",
      form.dependentSalaryHeads.filter((_, i) => i !== index),
    )

  // Validation (without org/tenant fields)
  const validateForm = () => {
    const errors: string[] = []

    if (!form.name.trim()) errors.push("Template Name is required")
    if (!form.code.trim()) errors.push("Template Code is required")
    if (!form.country.trim()) errors.push("Country is required")
    if (!form.state.trim()) errors.push("State is required")
    if (!form.zone.trim()) errors.push("Zone is required")

    if (errors.length > 0) {
      toast.error(errors.join(", "))
      return false
    }
    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    const recordId = currentMode === "edit" ? form._id?.$oid || id || null : form._id?.$oid || null

    const baseData: any = {
      organizationCode: tenantCode,
      tenantCode: tenantCode,
      name: form.name,
      code: form.code,
      subsidiary: form.subsidiary,
      state: form.state,
      zone: form.zone,
      location: form.location,
      designation: form.designation,
      grade: form.grade,
      category: form.category,
      skillLevel: form.skillLevel,
      effectiveFrom: form.effectiveFrom,
      effectiveTo: form.effectiveTo,
      salaryHeads: form.salaryHeads,
      asPerMinimumWages: form.asPerMinimumWages,
      remark: form.remark,
      country: form.country,
      independentSalaryHeads: form.independentSalaryHeads,
      dependentSalaryHeads: form.dependentSalaryHeads,
    }

    if (currentMode === "edit" && recordId) {
      baseData._id = recordId
    }

    if (currentMode === "edit") {
      baseData.updatedOn = new Date().toISOString()
    } else {
      baseData.createdOn = new Date().toISOString()
    }

    const payload = {
      tenant: baseData.tenantCode || tenantCode,
      action: "insert",
      ...(recordId ? { id: recordId } : {}),
      collectionName: "wageSalaryTemplates",
      data: baseData,
    }

    submitContextRef.current = {
      mode: currentMode,
      id: recordId ? String(recordId) : null,
    }

    postTemplate(payload)
  }

  if ((isEditMode || isViewMode) && salaryTemplateLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading salary template data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>Wage Salary Head Management</span>
        <span>/</span>
        <span>Salary Templates</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Salary Template Management</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="p-2 hover:bg-blue-50" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 text-blue-600" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h2>
            <p className="text-gray-600">{getPageDescription()}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            className="border-gray-300 hover:bg-gray-50 bg-transparent"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="pb-8 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Settings className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Wage Salary Template</CardTitle>
                  <p className="text-blue-100 mt-1">
                    Define comprehensive salary templates with heads and metadata
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Template Information Section (first section now) */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Template Information</h3>
                    <p className="text-sm text-gray-600">Basic details for the salary template</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Template Name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => updateRoot("name", e.target.value)}
                      placeholder="Enter template name"
                      disabled={isViewMode}
                      className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Template Code</Label>
                    <Input
                      value={form.code}
                      onChange={(e) => updateRoot("code", e.target.value)}
                      placeholder="Enter template code"
                      disabled={isViewMode}
                      className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Country</Label>
                    <Select
                      value={form.country}
                      onValueChange={(v) => updateRoot("country", v)}
                      disabled={loadingCountries || !!countriesError || isViewMode}
                    >
                      <SelectTrigger
                        className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                          isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      >
                        <SelectValue
                          placeholder={
                            loadingCountries
                              ? "Loading countries..."
                              : countriesError
                              ? "Error loading countries"
                              : "Select country"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {countries.map((c, index) => (
                          <SelectItem key={index} value={c.countryName}>
                            {c.countryName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {countriesError && (
                      <p className="text-xs text-red-500">{countriesError}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">State</Label>
                    <Select
                      value={form.state}
                      onValueChange={(v) => updateRoot("state", v)}
                      disabled={loadingStates || !!statesError || isViewMode}
                    >
                      <SelectTrigger
                        className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                          isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      >
                        <SelectValue
                          placeholder={
                            loadingStates
                              ? "Loading states..."
                              : statesError
                              ? "Error loading states"
                              : "Select state"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((s, index) => (
                          <SelectItem key={index} value={s.stateName}>
                            {s.stateName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {statesError && (
                      <p className="text-xs text-red-500">{statesError}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Zone</Label>
                    <Select
                      value={form.zone}
                      onValueChange={(v) => updateRoot("zone", v)}
                      disabled={isViewMode}
                    >
                      <SelectTrigger
                        className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                          isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((z) => (
                          <SelectItem key={z} value={z}>
                            {z}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Subsidiary Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Subsidiary Information</h3>
                    <p className="text-sm text-gray-600">Define subsidiary details for this template</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Subsidiary Code</Label>
                    <Select
                      value={form.subsidiary.subsidiaryCode}
                      onValueChange={(value) => {
                        const selectedSubsidiary = subsidiaries.find(
                          (sub: { subsidiaryCode: string }) => sub.subsidiaryCode === value,
                        )
                        updateRoot("subsidiary", {
                          subsidiaryCode: value,
                          subsidiaryName: selectedSubsidiary?.subsidiaryName || "",
                        })
                      }}
                      disabled={orgLoading || isViewMode}
                    >
                      <SelectTrigger
                        className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                          isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                      >
                        <SelectValue
                          placeholder={
                            orgLoading ? "Loading subsidiaries..." : "Select subsidiary code"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {subsidiaries && subsidiaries.length > 0 ? (
                          subsidiaries.map(
                            (sub: { subsidiaryCode: string; subsidiaryName: string }) => (
                              <SelectItem key={sub.subsidiaryCode} value={sub.subsidiaryCode}>
                                {sub.subsidiaryCode}
                              </SelectItem>
                            ),
                          )
                        ) : (
                          <SelectItem value="no-subsidiaries" disabled>
                            {orgLoading ? "Loading..." : "No subsidiaries available"}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {subsidiariesError && (
                      <p className="text-xs text-red-500">{subsidiariesError}</p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-gray-700">Subsidiary Name</Label>
                    <div className="h-11 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg text-blue-800 flex items-center font-medium shadow-sm">
                      {form.subsidiary.subsidiaryName ? (
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          {form.subsidiary.subsidiaryName}
                        </span>
                      ) : (
                        <span className="text-blue-600 italic">Will auto-fill from code</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                  <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
                  <p className="text-sm text-gray-600">Define location details for this template</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Location Code</Label>
                  <Select
                    value={form.location.locationCode}
                    onValueChange={(value) => {
                      const selectedLocation = locations.find(
                        (loc: { locationCode: string }) => loc.locationCode === value,
                      )
                      updateRoot("location", {
                        locationCode: value,
                        locationName: selectedLocation?.locationName || "",
                      })
                    }}
                    disabled={orgLoading || isViewMode}
                  >
                    <SelectTrigger
                      className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    >
                      <SelectValue
                        placeholder={
                          orgLoading ? "Loading locations..." : "Select location code"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {locations && locations.length > 0 ? (
                        locations.map(
                          (loc: { locationCode: string; locationName: string }) => (
                            <SelectItem key={loc.locationCode} value={loc.locationCode}>
                              {loc.locationCode}
                            </SelectItem>
                          ),
                        )
                      ) : (
                        <SelectItem value="no-locations" disabled>
                          {orgLoading ? "Loading..." : "No locations available"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {locationsError && (
                    <p className="text-xs text-red-500">{locationsError}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Location Name</Label>
                  <div className="h-11 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg text-blue-800 flex items-center font-medium shadow-sm">
                    {form.location.locationName ? (
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {form.location.locationName}
                      </span>
                    ) : (
                      <span className="text-blue-600 italic">Will auto-fill from code</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Designation Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Designation Information</h3>
                  <p className="text-sm text-gray-600">
                    Define designation details for this template
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Designation Code</Label>
                  <Select
                    value={form.designation.designationCode}
                    onValueChange={(value) => {
                      const selectedDesignation = designations.find(
                        (des: { designationCode: string }) =>
                          des.designationCode === value,
                      )
                      updateRoot("designation", {
                        designationCode: value,
                        designationName: selectedDesignation?.designationName || "",
                      })
                    }}
                    disabled={orgLoading || isViewMode}
                  >
                    <SelectTrigger
                      className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    >
                      <SelectValue
                        placeholder={
                          orgLoading ? "Loading designations..." : "Select designation code"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {designations && designations.length > 0 ? (
                        designations.map(
                          (des: { designationCode: string; designationName: string }) => (
                            <SelectItem key={des.designationCode} value={des.designationCode}>
                              {des.designationCode}
                            </SelectItem>
                          ),
                        )
                      ) : (
                        <SelectItem value="no-designations" disabled>
                          {orgLoading ? "Loading..." : "No designations available"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {designationsError && (
                    <p className="text-xs text-red-500">{designationsError}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Designation Name</Label>
                  <div className="h-11 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg text-blue-800 flex items-center font-medium shadow-sm">
                    {form.designation.designationName ? (
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {form.designation.designationName}
                      </span>
                    ) : (
                      <span className="text-blue-600 italic">Will auto-fill from code</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grade Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Grade Information</h3>
                  <p className="text-sm text-gray-600">Define grade details for this template</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Grade Code</Label>
                  <Select
                    value={form.grade.gradeCode}
                    onValueChange={(value) => {
                      const selectedGrade = grades.find(
                        (grade: { gradeCode: string }) => grade.gradeCode === value,
                      )
                      updateRoot("grade", {
                        gradeCode: value,
                        gradeName: selectedGrade?.gradeName || "",
                      })
                    }}
                    disabled={orgLoading || isViewMode}
                  >
                    <SelectTrigger
                      className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    >
                      <SelectValue
                        placeholder={orgLoading ? "Loading grades..." : "Select grade code"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {grades && grades.length > 0 ? (
                        grades.map(
                          (grade: { gradeCode: string; gradeName: string }) => (
                            <SelectItem key={grade.gradeCode} value={grade.gradeCode}>
                              {grade.gradeCode}
                            </SelectItem>
                          ),
                        )
                      ) : (
                        <SelectItem value="no-grades" disabled>
                          {orgLoading ? "Loading..." : "No grades available"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {gradesError && (
                    <p className="text-xs text-red-500">{gradesError}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Grade Name</Label>
                  <div className="h-11 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg text-blue-800 flex items-center font-medium shadow-sm">
                    {form.grade.gradeName ? (
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {form.grade.gradeName}
                      </span>
                    ) : (
                      <span className="text-blue-600 italic">Will auto-fill from code</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                <Users className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Category</h3>
                  <p className="text-sm text-gray-600">Define category for this template</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Category Code</Label>
                  <Select
                    value={form.category.categoryCode}
                    onValueChange={(value) => {
                      const selectedCategory = categories.find(
                        (cat: { categoryCode: string }) => cat.categoryCode === value,
                      )
                      updateRoot("category", {
                        categoryCode: value,
                        categoryName: selectedCategory?.categoryName || "",
                      })
                    }}
                    disabled={orgLoading || isViewMode}
                  >
                    <SelectTrigger
                      className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    >
                      <SelectValue
                        placeholder={orgLoading ? "Loading categories..." : "Select category code"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories && categories.length > 0 ? (
                        categories.map(
                          (cat: { categoryCode: string; categoryName: string }) => (
                            <SelectItem key={cat.categoryCode} value={cat.categoryCode}>
                              {cat.categoryCode}
                            </SelectItem>
                          ),
                        )
                      ) : (
                        <SelectItem value="no-categories" disabled>
                          {orgLoading ? "Loading..." : "No categories available"}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {categoriesError && (
                    <p className="text-xs text-red-500">{categoriesError}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Category Name</Label>
                  <div className="h-11 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg text-blue-800 flex items-center font-medium shadow-sm">
                    {form.category.categoryName ? (
                      <span className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {form.category.categoryName}
                      </span>
                    ) : (
                      <span className="text-blue-600 italic">Will auto-fill from code</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Skill Level Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                <GraduationCap className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Skill Level</h3>
                  <p className="text-sm text-gray-600">
                    Select skill level and provide description
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Skill Level</Label>
                  <Select
                    value={form.skillLevel.skilledLevelTitle}
                    onValueChange={(v) => {
                      const found = skillLevels.find((sl) => sl.skilledLevelTitle === v)
                      updateRoot("skillLevel", {
                        ...form.skillLevel,
                        skilledLevelTitle: v,
                        skilledLevelDescription:
                          found?.skilledLevelDescription ||
                          form.skillLevel.skilledLevelDescription,
                      })
                    }}
                    disabled={loadingSkillLevels || !!skillLevelsError || isViewMode}
                  >
                    <SelectTrigger
                      className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                        isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                      }`}
                    >
                      <SelectValue
                        placeholder={
                          loadingSkillLevels
                            ? "Loading skill levels..."
                            : skillLevelsError
                            ? "Error loading skill levels"
                            : "Select skill level"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevels.map((sl, i) => (
                        <SelectItem
                          key={`${sl.skilledLevelTitle}-${i}`}
                          value={sl.skilledLevelTitle}
                        >
                          {sl.skilledLevelTitle}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {skillLevelsError && (
                    <p className="text-xs text-red-500">{skillLevelsError}</p>
                  )}
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Skill Description
                  </Label>
                  <div className="text-sm rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600">
                    {form.skillLevel.skilledLevelDescription || "No description available"}
                  </div>
                </div>
              </div>
            </div>

            {/* Effective Dates and Settings Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Effective Dates &amp; Settings
                  </h3>
                  <p className="text-sm text-gray-600">
                    Define validity period and template settings
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Effective From</Label>
                  <Input
                    type="date"
                    value={formatDateForInput(form.effectiveFrom)}
                    onChange={(e) => updateRoot("effectiveFrom", e.target.value)}
                    disabled={isViewMode}
                    className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Effective To</Label>
                  <Input
                    type="date"
                    value={formatDateForInput(form.effectiveTo)}
                    onChange={(e) => updateRoot("effectiveTo", e.target.value)}
                    disabled={isViewMode}
                    className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Remark</Label>
                <Input
                  value={form.remark}
                  onChange={(e) => updateRoot("remark", e.target.value)}
                  placeholder="Enter any additional remarks"
                  disabled={isViewMode}
                  className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">
                      As Per Minimum Wages
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      Enable to use minimum wage calculations instead of fixed amounts
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={!!form.asPerMinimumWages}
                      onCheckedChange={(v) => updateRoot("asPerMinimumWages", !!v)}
                      disabled={isViewMode}
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {form.asPerMinimumWages ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Independent Salary Heads Section */}
            {(() => {
              const isAPMW = !!form.asPerMinimumWages
              return (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Independent Salary Heads
                      </h3>
                      <p className="text-sm text-gray-600">
                        Define independent salary heads with fixed amounts
                      </p>
                    </div>
                  </div>

                  {isAPMW && (
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-sm text-amber-800">
                        <strong>Note:</strong> Independent salary heads are disabled when "As
                        Per Minimum Wages" is enabled. The system will use minimum wage
                        calculations instead.
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {form.independentSalaryHeads.map((sh, i) => (
                      <div
                        key={i}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-gray-700">
                            Independent Head
                          </h4>
                          {!isAPMW &&
                            !isViewMode &&
                            form.independentSalaryHeads.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeIndependentSalaryHead(i)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Code
                            </Label>
                            <SelectSearch
                              options={apiSalaryHeads.map((shOpt: any) => ({
                                value: shOpt.code,
                                label: shOpt.code,
                              }))}
                              value={sh.salaryHeadCode || ""}
                              onValueChange={(value) => {
                                if (isAPMW || isViewMode) return
                                const found = apiSalaryHeads.find(
                                  (opt: any) => opt.code === value,
                                )
                                updateRoot(
                                  "independentSalaryHeads",
                                  form.independentSalaryHeads.map((x, idx) =>
                                    idx === i
                                      ? {
                                          ...x,
                                          salaryHeadCode: value,
                                          salaryHeadName:
                                            found?.name || x.salaryHeadName,
                                        }
                                      : x,
                                  ),
                                )
                              }}
                              placeholder="Select salary head code"
                              disabled={isAPMW || isViewMode || salaryHeadsLoading}
                              className={`h-10 rounded-lg border-gray-300 bg-gray-50 ${
                                isAPMW || isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                              }`}
                              searchPlaceholder="Search salary heads..."
                              emptyMessage="No salary heads found."
                            />
                            {salaryHeadsError && (
                              <p className="text-xs text-red-500">{salaryHeadsError}</p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Name
                            </Label>
                            <Input
                              disabled={isAPMW || isViewMode}
                              value={sh.salaryHeadName}
                              onChange={(e) =>
                                updateRoot(
                                  "independentSalaryHeads",
                                  form.independentSalaryHeads.map((x, idx) =>
                                    idx === i
                                      ? { ...x, salaryHeadName: e.target.value }
                                      : x,
                                  ),
                                )
                              }
                              placeholder="Enter salary head name"
                              className={`h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                                isAPMW || isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                              }`}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700">
                              Amount
                            </Label>
                            <Input
                              disabled={isAPMW || isViewMode}
                              type="number"
                              value={Number.isFinite(sh.amount) ? sh.amount : 0}
                              onChange={(e) =>
                                updateRoot(
                                  "independentSalaryHeads",
                                  form.independentSalaryHeads.map((x, idx) =>
                                    idx === i
                                      ? {
                                          ...x,
                                          amount: Number(e.target.value || 0),
                                        }
                                      : x,
                                  ),
                                )
                              }
                              placeholder="0.00"
                              className={`h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                                isAPMW || isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* Dependent Salary Heads Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dependent Salary Heads
                  </h3>
                  <p className="text-sm text-gray-600">
                    Heads derived via formulae (names only)
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {form.dependentSalaryHeads.map((name, i) => (
                  <div
                    key={i}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-gray-700">
                        Dependent Head
                      </h4>
                      {!isViewMode && form.dependentSalaryHeads.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDependentSalaryHead(i)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">
                        Head Name
                      </Label>
                      <SelectSearch
                        options={apiSalaryHeads.map((shOpt: any) => ({
                          value: shOpt.name,
                          label: shOpt.name,
                        }))}
                        value={name || ""}
                        onValueChange={(value) => {
                          if (isViewMode) return
                          updateRoot(
                            "dependentSalaryHeads",
                            form.dependentSalaryHeads.map((x, idx) =>
                              idx === i ? value : x,
                            ),
                          )
                        }}
                        placeholder="Select salary head name"
                        disabled={isViewMode || salaryHeadsLoading}
                        className={`h-10 rounded-lg border-gray-300 bg-gray-50 ${
                          isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                        searchPlaceholder="Search salary heads..."
                        emptyMessage="No salary heads found."
                      />
                      {salaryHeadsError && (
                        <p className="text-xs text-red-500">{salaryHeadsError}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Section */}
            <div className="pt-8 border-t border-gray-200">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex items-center gap-3">
                  {!isViewMode && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      className="px-6 py-3 h-12 rounded-xl border-2 border-gray-300 hover:bg-gray-50 bg-transparent text-gray-700 hover:text-gray-900 transition-all duration-200 hover:border-gray-400"
                    >
                      Reset Form
                    </Button>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                  {!isViewMode && (
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          validateForm() ? "bg-green-500" : "bg-yellow-500"
                        } animate-pulse`}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">
                        {validateForm()
                          ? "Form is valid and ready to save"
                          : "Please complete all required fields"}
                      </span>
                    </div>
                  )}
                  {!isViewMode && (
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={postLoading}
                      className="px-8 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {postLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {currentMode === "edit" ? "Updating..." : "Saving..."}
                        </div>
                      ) : currentMode === "edit" ? (
                        "Update Salary Template"
                      ) : (
                        "Save Salary Template"
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
  )
}