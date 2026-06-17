"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Switch } from "@repo/ui/components/ui/switch"
import { toast } from "react-toastify"
import { useCompOffCrud, type CompOffForm as CompoffFormType } from "@/hooks/useCompoffCrud"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, MapPin, Calendar, Users, Settings, Plus, Trash2, ArrowLeft, Clock, Hash, FileText, CheckCircle, AlertTriangle, Timer, Zap, Target, RotateCcw, CalendarDays, ArrowUpDown } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

type RoundingRule = { from: number; to: number; roundOffTo: number }

type CompoffPolicyItem = {
  compOffPolicyCode: string
  compOffPolicyTitle: string
  generateOnWeekDay: boolean
  generateOnWeekOff: boolean
  generateOnHoliday: boolean
  halfDayCompOffApplicable: boolean
  expireCompOffAtYearEnd: boolean
  compOffExpiryDays: number
  backDateCompOffAllowed: boolean
  maxBackDaysAllowed: number
  allowDuringNoticePeriod: boolean
  compOffMonthlyLimit: number
  deductLunchBreakForCompOff: boolean
  cannotCombineWith: { prefix: string[]; postfix: string[] }
  compOffApplicationRequired: boolean
  compOffGenerationUnit: string
  minimumMinutesToGetFullCompOff: number
  minimumMinutesToGetHalfCompOff: number
  multiplierForWeekDay: number
  multiplierForWeekOff: number
  multiplierForHoliday: number
  forHolidayAndWeekOffOverlap: { multiplierWithoutWorking: number; multiplierForWorking: number }
  autoApprove: boolean
  daysUntilAutoApproval: number
  rounding: RoundingRule[]
}

type CompoffForm = {
  _id?: { $oid: string }
  subsidiary?: { subsidiaryCode: string; subsidiaryName: string }
  location?: { locationCode: string; locationName: string }
  designation?: { designationCode: string; designationName: string }
  employeeCategory?: string[]
  compOffPolicy: CompoffPolicyItem
}

const emptyRoundingRule = (): RoundingRule => ({ from: 0, to: 0, roundOffTo: 0 })

const emptyCompoffPolicy = (): CompoffPolicyItem => ({
  compOffPolicyCode: "",
  compOffPolicyTitle: "",
  generateOnWeekDay: false,
  generateOnWeekOff: false,
  generateOnHoliday: false,
  halfDayCompOffApplicable: false,
  expireCompOffAtYearEnd: false,
  compOffExpiryDays: 0,
  backDateCompOffAllowed: false,
  maxBackDaysAllowed: 0,
  allowDuringNoticePeriod: false,
  compOffMonthlyLimit: 0,
  deductLunchBreakForCompOff: false,
  cannotCombineWith: { prefix: [], postfix: [] },
  compOffApplicationRequired: false,
  compOffGenerationUnit: "days",
  minimumMinutesToGetFullCompOff: 0,
  minimumMinutesToGetHalfCompOff: 0,
  multiplierForWeekDay: 0,
  multiplierForWeekOff: 0,
  multiplierForHoliday: 0,
  forHolidayAndWeekOffOverlap: { multiplierWithoutWorking: 0, multiplierForWorking: 0 },
  autoApprove: false,
  daysUntilAutoApproval: 0,
  rounding: [emptyRoundingRule()],
})

const emptyCompoffForm = (): CompoffForm => ({
  subsidiary: { subsidiaryCode: "", subsidiaryName: "" },
  location: { locationCode: "", locationName: "" },
  designation: { designationCode: "", designationName: "" },
  employeeCategory: [],
  compOffPolicy: emptyCompoffPolicy(),
})

function toCsv(arr: string[]): string {
  return (arr || []).join(", ")
}

function fromCsv(text: string): string[] {
  return (text || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export default function Compoff({ 
  scrollToIndex, 
  initialData, 
  mode 
}: { 
  scrollToIndex?: number
  initialData?: any
  mode?: 'add' | 'edit' | 'view' | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const urlMode = searchParams.get('mode') || 'add'
  const tenantCode = useGetTenantCode()
  
  // Use URL mode if available, otherwise fallback to prop mode
  const currentMode = urlMode as 'add' | 'edit' | 'view' || mode || 'add'
  const [form, setForm] = useState<CompoffForm>(emptyCompoffForm())
  const [originalData, setOriginalData] = useState<any>(null) // Store original record for updates

  const [prefixCsv, setPrefixCsv] = useState("")
  const [postfixCsv, setPostfixCsv] = useState("")
  const [employeeCategoryCsv, setEmployeeCategoryCsv] = useState("")

  const [subsidiaries, setSubsidiaries] = useState<Array<{subsidiaryCode: string, subsidiaryName: string}>>([])
  const [locations, setLocations] = useState<Array<{locationCode: string, locationName: string}>>([])
  const [designations, setDesignations] = useState<Array<{designationCode: string, designationName: string}>>([])

  const { record, setRecord, upsertRecord, deleteRecord } = useCompOffCrud(null)
  const { token, loading: tokenLoading, error: tokenError } = useAuthToken()

  // Fetch single compoff data for edit/view mode
  const {
    data: compoffData,
    loading: compoffLoading,
    error: compoffError,
    refetch: fetchCompoff
  } = useRequest<any>({
    url: 'compoff_policy/search',
    method: 'POST',
    data: [
      {
        field: "_id",
        value: id,
        operator: "eq",
      }
    ],
    onSuccess: (data) => { 
      if (data && data[0] && data[0].isDeleted !== true) {
        const compoff = data[0]
        
        // Store original data for merging during update
        setOriginalData(compoff)
        
        // Handle _id properly - it could be a string, object with $oid, or object directly
        let formattedId: { $oid: string } | undefined = undefined
        if (compoff._id) {
          if (typeof compoff._id === 'string') {
            formattedId = { $oid: compoff._id }
          } else if (compoff._id.$oid) {
            formattedId = { $oid: String(compoff._id.$oid) }
          } else if (typeof compoff._id === 'object') {
            formattedId = { $oid: String(compoff._id) }
          }
        }
        
        // Transform compoff policy data with proper type handling
        const policy = compoff.compOffPolicy || {}
        const transformedPolicy: CompoffPolicyItem = {
          compOffPolicyCode: policy.compOffPolicyCode || "",
          compOffPolicyTitle: policy.compOffPolicyTitle || "",
          generateOnWeekDay: Boolean(policy.generateOnWeekDay),
          generateOnWeekOff: Boolean(policy.generateOnWeekOff),
          generateOnHoliday: Boolean(policy.generateOnHoliday),
          halfDayCompOffApplicable: Boolean(policy.halfDayCompOffApplicable),
          expireCompOffAtYearEnd: Boolean(policy.expireCompOffAtYearEnd),
          compOffExpiryDays: Number.isFinite(Number(policy?.compOffExpiryDays)) ? Number(policy.compOffExpiryDays) : 0,
          backDateCompOffAllowed: Boolean(policy.backDateCompOffAllowed),
          maxBackDaysAllowed: Number.isFinite(Number(policy?.maxBackDaysAllowed)) ? Number(policy.maxBackDaysAllowed) : 0,
          allowDuringNoticePeriod: Boolean(policy.allowDuringNoticePeriod),
          compOffMonthlyLimit: Number.isFinite(Number(policy?.compOffMonthlyLimit)) ? Number(policy.compOffMonthlyLimit) : 0,
          deductLunchBreakForCompOff: Boolean(policy.deductLunchBreakForCompOff),
          cannotCombineWith: {
            prefix: Array.isArray(policy?.cannotCombineWith?.prefix) ? policy.cannotCombineWith.prefix : [],
            postfix: Array.isArray(policy?.cannotCombineWith?.postfix) ? policy.cannotCombineWith.postfix : [],
          },
          compOffApplicationRequired: Boolean(policy.compOffApplicationRequired),
          compOffGenerationUnit: policy.compOffGenerationUnit || "days",
          minimumMinutesToGetFullCompOff: Number.isFinite(Number(policy?.minimumMinutesToGetFullCompOff)) ? Number(policy.minimumMinutesToGetFullCompOff) : 0,
          minimumMinutesToGetHalfCompOff: Number.isFinite(Number(policy?.minimumMinutesToGetHalfCompOff)) ? Number(policy.minimumMinutesToGetHalfCompOff) : 0,
          multiplierForWeekDay: Number.isFinite(Number(policy?.multiplierForWeekDay)) ? Number(policy.multiplierForWeekDay) : 0,
          multiplierForWeekOff: Number.isFinite(Number(policy?.multiplierForWeekOff)) ? Number(policy.multiplierForWeekOff) : 0,
          multiplierForHoliday: Number.isFinite(Number(policy?.multiplierForHoliday)) ? Number(policy.multiplierForHoliday) : 0,
          forHolidayAndWeekOffOverlap: {
            multiplierWithoutWorking: Number.isFinite(Number(policy?.forHolidayAndWeekOffOverlap?.multiplierWithoutWorking)) 
              ? Number(policy.forHolidayAndWeekOffOverlap.multiplierWithoutWorking) : 0,
            multiplierForWorking: Number.isFinite(Number(policy?.forHolidayAndWeekOffOverlap?.multiplierForWorking)) 
              ? Number(policy.forHolidayAndWeekOffOverlap.multiplierForWorking) : 0,
          },
          autoApprove: Boolean(policy.autoApprove),
          daysUntilAutoApproval: Number.isFinite(Number(policy?.daysUntilAutoApproval)) ? Number(policy.daysUntilAutoApproval) : 0,
          rounding: Array.isArray(policy.rounding) && policy.rounding.length > 0
            ? policy.rounding.map((r: any) => ({
                from: Number.isFinite(Number(r?.from)) ? Number(r.from) : 0,
                to: Number.isFinite(Number(r?.to)) ? Number(r.to) : 0,
                roundOffTo: Number.isFinite(Number(r?.roundOffTo)) ? Number(r.roundOffTo) : 0,
              }))
            : [emptyRoundingRule()],
        }
        
        setForm({
          _id: formattedId,
          subsidiary: compoff.subsidiary || { subsidiaryCode: "", subsidiaryName: "" },
          location: compoff.location || { locationCode: "", locationName: "" },
          designation: compoff.designation || { designationCode: "", designationName: "" },
          employeeCategory: Array.isArray(compoff.employeeCategory) ? compoff.employeeCategory : [],
          compOffPolicy: transformedPolicy,
        })
        setPrefixCsv(toCsv(policy?.cannotCombineWith?.prefix || []))
        setPostfixCsv(toCsv(policy?.cannotCombineWith?.postfix || []))
        setEmployeeCategoryCsv(toCsv(compoff?.employeeCategory || []))
      }
    },
    onError: (error) => {
      console.error("Error fetching compoff data:", error);
    },
    dependencies: [id]
  });

  const {
    post: postCompoff,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "compoff_policy",
    onSuccess: (data) => {
      alert(`✅ CompOff ${currentMode === "edit" ? "updated" : "created"} successfully!`);
      // Optionally navigate back or reset form
      setTimeout(() => {
        router.push('/compoff'); // Navigate back to list
      }, 1000);
    },
    onError: (error) => {
      alert(`❌ Failed to ${currentMode === "edit" ? "update" : "save"} CompOff!`);
      console.error("POST error:", error);
    },
  })

  // Fetch organization data for subsidiaries, locations, and designations
  const {
    data: orgData,
    loading: orgLoading,
    error: orgError,
    refetch: fetchOrg
  } = useRequest<any>({
    url: "organization/search",
    method: "POST",
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode,
      },
    ],
    onSuccess: (data) => {
      if (data && Array.isArray(data) && data.length > 0) {
        // Extract subsidiaries
        let subsidiariesData: any[] = []
        if (data[0]?.subsidiaries) {
          subsidiariesData = data[0].subsidiaries
        } else if (data[0]?.data?.subsidiaries) {
          subsidiariesData = data[0].data.subsidiaries
        } else if (data[0]?.subsidiary) {
          subsidiariesData = data[0].subsidiary
        }
        const formattedSubsidiaries = subsidiariesData
          .map((sub: any) => ({
            subsidiaryCode: sub.subsidiaryCode || sub.code || sub.id || "",
            subsidiaryName: sub.subsidiaryName || sub.name || sub.title || "",
          }))
          .filter((sub: any) => sub.subsidiaryCode && sub.subsidiaryCode.trim() !== "")
        setSubsidiaries(formattedSubsidiaries)

        // Extract locations
        let locationsData: any[] = []
        if (data[0]?.locations) {
          locationsData = data[0].locations
        } else if (data[0]?.data?.locations) {
          locationsData = data[0].data.locations
        } else if (data[0]?.location) {
          locationsData = data[0].location
        }
        const formattedLocations = locationsData
          .map((loc: any) => ({
            locationCode: loc.locationCode || loc.code || loc.id || "",
            locationName: loc.locationName || loc.name || loc.title || "",
          }))
          .filter((loc: any) => loc.locationCode && loc.locationCode.trim() !== "")
        setLocations(formattedLocations)

        // Extract designations
        let designationsData: any[] = []
        if (data[0]?.designations) {
          designationsData = data[0].designations
        } else if (data[0]?.data?.designations) {
          designationsData = data[0].data.designations
        } else if (data[0]?.designation) {
          designationsData = data[0].designation
        }
        const formattedDesignations = designationsData
          .map((des: any) => ({
            designationCode: des.designationCode || des.code || des.id || "",
            designationName: des.designationName || des.name || des.title || "",
          }))
          .filter((des: any) => des.designationCode && des.designationCode.trim() !== "")
        setDesignations(formattedDesignations)
      }
    },
    onError: (error) => {
      console.error("Error fetching organization data:", error);
    },
  });

  // Fetch data when in edit/view mode
  useEffect(() => {
    if (currentMode === "view" || currentMode === "edit") {
      fetchCompoff()
    }
  }, [currentMode, id])

  // Fetch organization data on mount
  useEffect(() => {
    if (token && !tokenLoading) {
      fetchOrg()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, tokenLoading])

  // Navigation handlers
  const handleBack = () => {
    router.push('/compoff')
  }

  const handleCancel = () => {
    router.push('/compoff')
  }

  // Get page title based on mode
  const getPageTitle = () => {
    switch (currentMode) {
      case "add":
        return "Add New CompOff"
      case "edit":
        return "Edit CompOff"
      case "view":
        return "View CompOff"
      default:
        return "CompOff Management"
    }
  }

  // Get page description based on mode
  const getPageDescription = () => {
    switch (currentMode) {
      case "add":
        return "Add new compoff policy configuration"
      case "edit":
        return "Edit existing compoff policy configuration"
      case "view":
        return "View compoff policy details (read-only)"
      default:
        return "Manage compoff policy configuration"
    }
  }

  const resetForm = () => {
    setForm(emptyCompoffForm())
    setOriginalData(null)
    setPrefixCsv("")
    setPostfixCsv("")
    setEmployeeCategoryCsv("")
  }

  // Check if form is in view mode
  const isViewMode = currentMode === 'view'
  const isEditMode = currentMode === 'edit'
  const isAddMode = currentMode === 'add'
  
  const updateRoot = (key: keyof CompoffForm, value: any) => setForm(prev => ({ ...prev, [key]: value }))
  const updatePolicy = (updater: (p: CompoffPolicyItem) => CompoffPolicyItem) =>
    setForm(prev => ({ ...prev, compOffPolicy: updater(prev.compOffPolicy) }))

  // Check if form is valid (without showing errors)
  const isFormValid = () => {
    if (!form.compOffPolicy.compOffPolicyCode.trim()) {
      return false
    }
    if (!form.compOffPolicy.compOffPolicyTitle.trim()) {
      return false
    }
    return true
  }

  // Form validation (with error messages)
  const validateForm = () => {
    const errors: string[] = []

    if (!form.compOffPolicy.compOffPolicyCode.trim()) {
      errors.push("CompOff Policy Code is required")
    }

    if (!form.compOffPolicy.compOffPolicyTitle.trim()) {
      errors.push("CompOff Policy Title is required")
    }
    
    if (errors.length > 0) {
      toast.error(errors.join(", "))
      return false
    }
    
    return true
  }

  // Handle save functionality
  const handleSave = async () => {
    if (!validateForm()) {
      return
    }
    
    // Get the ID string - prioritize form._id.$oid from loaded data, then URL id
    const recordId = currentMode === 'edit' 
      ? (form._id?.$oid || id || null)
      : (form._id?.$oid || null)
    
    // Build the payload with form data - use form state directly to ensure all changes are captured
    const baseData: any = {
      organizationCode: tenantCode,
      tenantCode: tenantCode,
      subsidiary: form.subsidiary,
      location: form.location,
      designation: form.designation,
      employeeCategory: fromCsv(employeeCategoryCsv),
      compOffPolicy: {
        ...form.compOffPolicy,
        cannotCombineWith: {
          prefix: fromCsv(prefixCsv),
          postfix: fromCsv(postfixCsv),
        },
      },
    }
    
    // Add _id for edit mode if available
    if (currentMode === 'edit' && recordId) {
      baseData._id = recordId
    }
    
    // Add timestamp
    if (currentMode === 'edit') {
      baseData.updatedOn = new Date().toISOString()
    } else {
      baseData.createdOn = new Date().toISOString()
    }
    
    const payload = {
      tenant: tenantCode,
      action: "insert",
      id: recordId,
      collectionName: "compoff_policy",
      data: baseData
    }
    
    await postCompoff(payload)
  }

  // Show loading state only for edit/view modes
  if ((isEditMode || isViewMode) && compoffLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading compoff data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <span>Master</span>
        <span>/</span>
        <span>CompOff</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">CompOff Management</span>
      </div>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 hover:bg-blue-50"
            onClick={handleBack}
          >
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
                  <CardTitle className="text-2xl font-bold">CompOff Policy</CardTitle>
                  <p className="text-blue-100 mt-1">Configure compoff policy settings and rules</p>
                </div>
              </div>
            </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Organization Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                <Building2 className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Organization Details</h3>
                  <p className="text-sm text-gray-600">Associate this configuration to organization and tenant</p>
                </div>
              </div>

              {/* Subsidiary, Location, Designation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Subsidiary */}
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Subsidiary Code
                    </Label>
                    <Select 
                      value={form.subsidiary?.subsidiaryCode || ""} 
                      onValueChange={v => {
                        const selected = subsidiaries.find(s => s.subsidiaryCode === v)
                        updateRoot("subsidiary", { subsidiaryCode: v, subsidiaryName: selected?.subsidiaryName || "" })
                      }}
                      disabled={orgLoading || isViewMode}
                    >
                      <SelectTrigger className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                        <SelectValue placeholder={orgLoading ? "Loading subsidiaries..." : "Select subsidiary code"} />
                      </SelectTrigger>
                      <SelectContent>
                        {subsidiaries && subsidiaries.length > 0 ? (
                          subsidiaries
                            .filter((subsidiary: { subsidiaryCode: string }) =>
                              subsidiary.subsidiaryCode && subsidiary.subsidiaryCode.trim() !== "",
                            )
                            .map((subsidiary: { subsidiaryCode: string; subsidiaryName: string }, index: number) => (
                              <SelectItem key={index} value={subsidiary.subsidiaryCode}>
                                {subsidiary.subsidiaryCode}
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="no-subsidiaries" disabled>
                            No subsidiaries available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Subsidiary Name
                    </Label>
                    <div className="h-11 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl text-blue-800 flex items-center font-medium shadow-sm">
                      {form.subsidiary?.subsidiaryName ? (
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

                {/* Location */}
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      Location Code
                    </Label>
                    <Select 
                      value={form.location?.locationCode || ""} 
                      onValueChange={v => {
                        const selected = locations.find(l => l.locationCode === v)
                        updateRoot("location", { locationCode: v, locationName: selected?.locationName || "" })
                      }}
                      disabled={orgLoading || isViewMode}
                    >
                      <SelectTrigger className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                        <SelectValue placeholder={orgLoading ? "Loading locations..." : "Select location code"} />
                      </SelectTrigger>
                      <SelectContent>
                        {locations && locations.length > 0 ? (
                          locations
                            .filter((location: { locationCode: string }) =>
                              location.locationCode && location.locationCode.trim() !== "",
                            )
                            .map((location: { locationCode: string; locationName: string }, index: number) => (
                              <SelectItem key={index} value={location.locationCode}>
                                {location.locationCode}
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="no-locations" disabled>
                            No locations available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      Location Name
                    </Label>
                    <div className="h-11 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl text-blue-800 flex items-center font-medium shadow-sm">
                      {form.location?.locationName ? (
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

                {/* Designation */}
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Designation Code
                    </Label>
                    <Select 
                      value={form.designation?.designationCode || ""} 
                      onValueChange={v => {
                        const selected = designations.find(d => d.designationCode === v)
                        updateRoot("designation", { designationCode: v, designationName: selected?.designationName || "" })
                      }}
                      disabled={orgLoading || isViewMode}
                    >
                      <SelectTrigger className={`h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                        <SelectValue placeholder={orgLoading ? "Loading designations..." : "Select designation code"} />
                      </SelectTrigger>
                      <SelectContent>
                        {designations && designations.length > 0 ? (
                          designations
                            .filter((designation: { designationCode: string }) =>
                              designation.designationCode && designation.designationCode.trim() !== "",
                            )
                            .map((designation: { designationCode: string; designationName: string }, index: number) => (
                              <SelectItem key={index} value={designation.designationCode}>
                                {designation.designationCode}
                              </SelectItem>
                            ))
                        ) : (
                          <SelectItem value="no-designations" disabled>
                            No designations available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      Designation Name
                    </Label>
                    <div className="h-11 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl text-blue-800 flex items-center font-medium shadow-sm">
                      {form.designation?.designationName ? (
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

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Employee Category (comma separated)</Label>
                <Input 
                  value={employeeCategoryCsv} 
                  onChange={e => setEmployeeCategoryCsv(e.target.value)} 
                  placeholder="WKM, Cat2, Cat3" 
                  disabled={isViewMode}
                  className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>

            {/* CompOff Policy Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                <Settings className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">CompOff Policy Configuration</h3>
                  <p className="text-sm text-gray-600">Define policy rules and generation settings</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Policy Code</Label>
                  <Input 
                    value={form.compOffPolicy.compOffPolicyCode} 
                    onChange={e => updatePolicy(p => ({ ...p, compOffPolicyCode: e.target.value }))} 
                    placeholder="Enter policy code" 
                    disabled={isViewMode}
                    className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Policy Title</Label>
                  <Input 
                    value={form.compOffPolicy.compOffPolicyTitle} 
                    onChange={e => updatePolicy(p => ({ ...p, compOffPolicyTitle: e.target.value }))} 
                    placeholder="Enter policy title" 
                    disabled={isViewMode}
                    className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              {/* Boolean Switches */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-900">Policy Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    ["generateOnWeekDay", "Generate On Week Day"],
                    ["generateOnWeekOff", "Generate On Week Off"],
                    ["generateOnHoliday", "Generate On Holiday"],
                    ["halfDayCompOffApplicable", "Half Day CompOff Applicable"],
                    ["expireCompOffAtYearEnd", "Expire CompOff At Year End"],
                    ["backDateCompOffAllowed", "Back Date CompOff Allowed"],
                    ["allowDuringNoticePeriod", "Allow During Notice Period"],
                    ["compOffApplicationRequired", "CompOff Application Required"],
                    ["autoApprove", "Auto Approve"],
                    ["deductLunchBreakForCompOff", "Deduct Lunch Break For CompOff"],
                  ].map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <Label className="text-sm font-medium text-gray-700">{label}</Label>
                      <Switch 
                        disabled={isViewMode}
                        checked={Boolean((form.compOffPolicy as any)[key])}
                        onCheckedChange={checked => updatePolicy(p => ({ ...p, [key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Numeric Settings */}
              <div className="space-y-4">
                <h4 className="text-base font-semibold text-gray-900">Time & Limit Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    ["compOffExpiryDays", "CompOff Expiry Days"],
                    ["maxBackDaysAllowed", "Max Back Days Allowed"],
                    ["compOffMonthlyLimit", "CompOff Monthly Limit"],
                    ["minimumMinutesToGetFullCompOff", "Min Minutes To Get Full CompOff"],
                    ["minimumMinutesToGetHalfCompOff", "Min Minutes To Get Half CompOff"],
                    ["multiplierForWeekDay", "Multiplier For Week Day"],
                    ["multiplierForWeekOff", "Multiplier For Week Off"],
                    ["multiplierForHoliday", "Multiplier For Holiday"],
                    ["daysUntilAutoApproval", "Days Until Auto Approval"],
                  ].map(([key, label]) => (
                    <div key={key} className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">{label}</Label>
                      <Input
                        type="number"
                        value={Number((form.compOffPolicy as any)[key] ?? 0)}
                        onChange={e => updatePolicy(p => ({ ...p, [key]: Number(e.target.value) }))}
                        disabled={isViewMode}
                        className={`h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">CompOff Generation Unit</Label>
                <Input 
                  value={form.compOffPolicy.compOffGenerationUnit} 
                  onChange={e => updatePolicy(p => ({ ...p, compOffGenerationUnit: e.target.value }))} 
                  placeholder="e.g. days" 
                  disabled={isViewMode}
                  className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
              </div>

              {/* Cannot Combine With */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-base font-semibold text-gray-900">Cannot Combine With</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Prefix (comma separated)</Label>
                    <Input 
                      value={prefixCsv} 
                      onChange={e => setPrefixCsv(e.target.value)} 
                      disabled={isViewMode}
                      className={`h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Postfix (comma separated)</Label>
                    <Input 
                      value={postfixCsv} 
                      onChange={e => setPostfixCsv(e.target.value)} 
                      disabled={isViewMode}
                      className={`h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Holiday and Week Off Overlap */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-base font-semibold text-gray-900">Holiday and Week Off Overlap</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Multiplier Without Working</Label>
                    <Input
                      type="number"
                      value={form.compOffPolicy.forHolidayAndWeekOffOverlap.multiplierWithoutWorking}
                      onChange={e => updatePolicy(p => ({ 
                        ...p, 
                        forHolidayAndWeekOffOverlap: { 
                          ...p.forHolidayAndWeekOffOverlap, 
                          multiplierWithoutWorking: Number(e.target.value) 
                        } 
                      }))}
                      disabled={isViewMode}
                      className={`h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">Multiplier For Working</Label>
                    <Input
                      type="number"
                      value={form.compOffPolicy.forHolidayAndWeekOffOverlap.multiplierForWorking}
                      onChange={e => updatePolicy(p => ({ 
                        ...p, 
                        forHolidayAndWeekOffOverlap: { 
                          ...p.forHolidayAndWeekOffOverlap, 
                          multiplierForWorking: Number(e.target.value) 
                        } 
                      }))}
                      disabled={isViewMode}
                      className={`h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* Rounding Rules */}
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-semibold text-gray-900">Rounding Rules</h4>
                  {!isViewMode && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updatePolicy(p => ({ ...p, rounding: [...p.rounding, emptyRoundingRule()] }))}
                      className="flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Rule
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {form.compOffPolicy.rounding.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">From (minutes)</Label>
                          <Input
                            type="number"
                            value={rule.from}
                            onChange={e => updatePolicy(p => ({
                              ...p,
                              rounding: p.rounding.map((r, i) => i === idx ? { ...r, from: Number(e.target.value) } : r)
                            }))}
                            disabled={isViewMode}
                            className={`h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">To (minutes)</Label>
                          <Input
                            type="number"
                            value={rule.to}
                            onChange={e => updatePolicy(p => ({
                              ...p,
                              rounding: p.rounding.map((r, i) => i === idx ? { ...r, to: Number(e.target.value) } : r)
                            }))}
                            disabled={isViewMode}
                            className={`h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs text-gray-600">Round Off To (minutes)</Label>
                          <Input
                            type="number"
                            value={rule.roundOffTo}
                            onChange={e => updatePolicy(p => ({
                              ...p,
                              rounding: p.rounding.map((r, i) => i === idx ? { ...r, roundOffTo: Number(e.target.value) } : r)
                            }))}
                            disabled={isViewMode}
                            className={`h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          />
                        </div>
                      </div>
                      {!isViewMode && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => updatePolicy(p => ({ ...p, rounding: p.rounding.filter((_, i) => i !== idx) }))}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
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
                      <div className={`w-3 h-3 rounded-full ${isFormValid() ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {isFormValid() ? 'Form is valid and ready to save' : 'Please complete all required fields'}
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
                      ) : (
                        currentMode === "edit" ? "Update CompOff" : "Save CompOff"
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

