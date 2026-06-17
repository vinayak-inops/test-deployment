"use client"

import React, { useEffect, useRef, useState } from "react"
import FormulaBuilder from "./formula-builder"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { SelectSearch } from "@repo/ui/components/ui/select-search"
import { Separator } from "@repo/ui/components/ui/separator"
import { Shield, Trash2, ArrowLeft } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useRouter, useSearchParams } from "next/navigation"
import { useWageSalaryHeads } from "@/hooks/useWageSalaryHeads"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

type Slab = { from: number; to: number; amount: number }

type Operation =
  | { comparator: "lessThan"; value: number; then: number }
  | { comparator: "greaterThan"; value: number; then: number }
  | { comparator: "equalTo"; value: number; then: number }
  | { comparator: "between"; from: number; to: number; then: number }

type CalculationType = {
  type: "fixed" | "percentage" | "slab" | "formula"
  percentageAmount?: string
  slabs?: Slab[]
  expression?: string
  variables?: string[]
  operation?: Operation[]
}

type PrimarySalaryHead = { code: string; name: string } | {}

type SalaryHead = {
  name: string
  code: string
  description: string
  salaryType: "earning" | "deduction"
  primarySalaryHead: PrimarySalaryHead
  calculationType: CalculationType
  printable: boolean
  salaryCalculationBasis: string
  excludedDays: string[]
  applicableMonths: number[]
}

type WageSalaryHeadsForm = {
  _id?: { $oid: string }
  organizationCode: string
  tenantCode: string
  salaryHeads: SalaryHead[]
}

// Note: Salary head options are now fetched from API using useWageSalaryHeads hook

const emptySalaryHead = (): SalaryHead => ({
  name: "",
  code: "",
  description: "",
  salaryType: "earning",
  primarySalaryHead: {},
  calculationType: { type: "fixed" },
  printable: true,
  salaryCalculationBasis: "payable days",
  excludedDays: [],
  applicableMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
})

const normalizeId = (value: any) => {
  if (!value) return ""
  if (typeof value === "string") return value
  if (typeof value === "object" && value.$oid) return String(value.$oid)
  return String(value)
}

export default function WageSalaryHeads({ scrollToIndex, initialData }: { scrollToIndex?: number; initialData?: WageSalaryHeadsForm }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const mode = searchParams.get('mode') || 'add'
  const currentMode = (mode as "add" | "edit" | "view") || "add"
  
  const [form, setForm] = useState<WageSalaryHeadsForm>({
    organizationCode: "Midhani",
    tenantCode: "Midhani",
    salaryHeads: [emptySalaryHead()],
  })
  
  const [showErrors, setShowErrors] = useState(false)
  const [originalCode, setOriginalCode] = useState<string | null>(null)
  const tenantCode = useGetTenantCode()
  const submitContextRef = useRef<{ mode: "add" | "edit" | "view"; id: string | null }>({
    mode: "add",
    id: null,
  })

  // Fetch salary heads from API
  const { salaryHeads: apiSalaryHeads, loading: salaryHeadsLoading, error: salaryHeadsError, refetch: refetchSalaryHeads } = useWageSalaryHeads()

  // Fetch single salary head data for edit/view mode
  const {
    data: salaryHeadData,
    loading: salaryHeadLoading,
    error: salaryHeadError,
    refetch: fetchSalaryHead
  } = useRequest<any>({
    url: 'wageSalaryHeads/search',
    method: 'POST',
    data: [
      {
        field: "_id",
        value: id,
        operator: "eq",
      }
    ],
    onSuccess: (data) => { 
      if(data && data[0] && data[0].isDeleted !== true){
        // Transform single salary head data to form format
        const salaryHead = data[0]
        
        // Handle _id properly - it could be a string, object with $oid, or object directly
        let formattedId: { $oid: string } | undefined = undefined
        const normalizedId = normalizeId(salaryHead._id)
        if (normalizedId) {
          formattedId = { $oid: normalizedId }
        }
        
        setOriginalCode(salaryHead.code || null)
        setForm({
          _id: formattedId,
          organizationCode: salaryHead.organizationCode || "",
          tenantCode: salaryHead.tenantCode || "",
          salaryHeads: [{
            name: salaryHead.name || "",
            code: salaryHead.code || "",
            description: salaryHead.description || "",
            salaryType: salaryHead.salaryType || "earning",
            primarySalaryHead: salaryHead.primarySalaryHead || {},
            calculationType: salaryHead.calculationType || { type: "fixed" },
            printable: salaryHead.printable !== undefined ? salaryHead.printable : true,
            salaryCalculationBasis: salaryHead.salaryCalculationBasis || "payable days",
            excludedDays: salaryHead.excludedDays || [],
            applicableMonths: salaryHead.applicableMonths || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
          }]
        })
      }
    },
    onError: (error) => {
      console.error("Error fetching salary head data:", error);
    },
    dependencies: [id]
  });

  // Hook for saving salary heads data
  const {
    post: postSalaryHeads,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "wageSalaryHeads",
    onSuccess: () => {
      const ctx = submitContextRef.current
      alert(`Salary head ${ctx.mode === "edit" ? "updated" : "created"} successfully.`)
      refetchSalaryHeads()
      setTimeout(() => {
        router.push('/wage-salaryhead')
      }, 1000)
    },
    onError: (error) => {
      const ctx = submitContextRef.current
      alert(`Failed to ${ctx.mode === "edit" ? "update" : "save"} salary head.`)
      console.error("POST error:", error)
    },
  })

  // Navigation handlers
  const handleBack = () => {
    router.push('/wage-salaryhead')
  }

  const handleCancel = () => {
    router.push('/wage-salaryhead')
  }

  // Get page title based on mode
  const getPageTitle = () => {
    switch (mode) {
      case "add":
        return "Add New Salary Head"
      case "edit":
        return "Edit Salary Head"
      case "view":
        return "View Salary Head"
      default:
        return "Salary Head Management"
    }
  }

  // Get page description based on mode
  const getPageDescription = () => {
    switch (mode) {
      case "add":
        return "Add new salary head and calculation details"
      case "edit":
        return "Edit existing salary head and calculation details"
      case "view":
        return "View salary head details (read-only)"
      default:
        return "Manage salary head and calculation details"
    }
  }

  const updateRoot = (key: keyof WageSalaryHeadsForm, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const updateHead = (index: number, updater: (s: SalaryHead) => SalaryHead) => {
    setForm(prev => ({
      ...prev,
      salaryHeads: prev.salaryHeads.map((h, i) => (i === index ? updater(h) : h)),
    }))
  }

  const addHead = () => setForm(prev => ({ ...prev, salaryHeads: [...prev.salaryHeads, emptySalaryHead()] }))
  const removeHead = (index: number) =>
    setForm(prev => ({ ...prev, salaryHeads: prev.salaryHeads.filter((_, i) => i !== index) }))

  // Check if code is duplicate (already exists in apiSalaryHeads or within form)
  const isCodeDuplicate = (code: string, headIndex: number): boolean => {
    const trimmed = code.trim()
    if (!trimmed) return false
    // Check duplicate within form (other heads)
    const duplicateInForm = form.salaryHeads.some((h, i) => i !== headIndex && h.code.trim().toLowerCase() === trimmed.toLowerCase())
    if (duplicateInForm) return true
    // Check if exists in API (existing salary heads)
    const existsInApi = apiSalaryHeads.some((sh: any) => (sh.code || "").trim().toLowerCase() === trimmed.toLowerCase())
    if (!existsInApi) return false
    // In edit mode, allow keeping the original code for the head being edited
    if (mode === "edit" && headIndex === 0 && originalCode && originalCode.trim().toLowerCase() === trimmed.toLowerCase()) {
      return false
    }
    return true
  }

  // Form validation (Organization Details hidden - org/tenant default to "midhani")
  const validateForm = (): boolean => {
    const errors: string[] = []
    
    form.salaryHeads.forEach((head, index) => {
      if (!head.name.trim()) {
        errors.push(`Salary Head #${index + 1}: Name is required`)
      }
      if (!head.code.trim()) {
        errors.push(`Salary Head #${index + 1}: Code is required`)
      } else if (isCodeDuplicate(head.code, index)) {
        errors.push(`Salary Head #${index + 1}: ${head.code.trim()} is already created`)
      }
    })
    
    return errors.length === 0
  }

  // Handle save functionality
  const handleSave = async () => {
    setShowErrors(true)
    
    if (!validateForm()) {
      return
    }
    
    // Get the ID string - prioritize form._id.$oid from loaded data, then URL id
    const recordId = mode === 'edit' 
      ? (form._id?.$oid || id || null)
      : (form._id?.$oid || null)

    submitContextRef.current = {
      mode: currentMode,
      id: recordId ? String(recordId) : null,
    }
    
    // Save each salary head individually - organization/tenant from tenantCode hook
    const orgCode = tenantCode
    const tenant = tenantCode
    const savePromises = form.salaryHeads.map(head => {
      const baseData: any = {
        organizationCode: orgCode,
        tenantCode: tenant,
        name: head.name,
        code: head.code,
        description: head.description,
        salaryType: head.salaryType,
        primarySalaryHead: (head.primarySalaryHead as any)?.name ? head.primarySalaryHead : {},
        calculationType: head.calculationType,
        printable: head.printable,
        salaryCalculationBasis: head.salaryCalculationBasis,
        excludedDays: head.excludedDays,
        applicableMonths: head.applicableMonths
      }
      
      // Add _id for edit mode if available
      if (mode === 'edit' && recordId) {
        baseData._id = recordId
      }
      
      // Add timestamp
      if (mode === 'edit') {
        baseData.updatedOn = new Date().toISOString()
      } else {
        baseData.createdOn = new Date().toISOString()
      }
      
      const payload = {
        tenant: tenant,
        action: "insert",
        ...(recordId ? { id: recordId } : {}),
        collectionName: "wageSalaryHeads",
        data: baseData
      }
      
      return postSalaryHeads(payload)
    })
    
    try {
      await Promise.all(savePromises)
    } catch (error) {
      console.error("Error saving salary heads:", error)
    }
  }

  // Handle reset functionality (Organization Details default to "midhani")
  const handleReset = () => {
    setOriginalCode(null)
    setForm({
      _id: undefined,
      organizationCode: "Midhani",
      tenantCode: "Midhani",
      salaryHeads: [emptySalaryHead()],
    })
    setShowErrors(false)
  }

  // Fetch data when in edit/view mode
  useEffect(() => {
    if (mode === "view" || mode === "edit") {
      fetchSalaryHead()
    }
  }, [mode, id])

  // Initialize form with initialData and ensure excludedDays field is initialized
  useEffect(() => {
    if (initialData) {
      setForm({
        ...initialData,
        salaryHeads: initialData.salaryHeads.map(head => ({
          ...head,
          excludedDays: head.excludedDays || [],
          applicableMonths: head.applicableMonths || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        }))
      })
    } else {
      setForm(prev => ({
        ...prev,
        salaryHeads: prev.salaryHeads.map(head => ({
          ...head,
          excludedDays: head.excludedDays || [],
          applicableMonths: head.applicableMonths || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        }))
      }))
    }
  }, [initialData])

  // auto-scroll to a specific salary head card when requested
  useEffect(() => {
    if (typeof scrollToIndex === "number") {
      const id = `sh-item-${scrollToIndex}`
      const t = setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
      return () => clearTimeout(t)
    }
  }, [scrollToIndex, form.salaryHeads.length])

  // Show loading state only for view/edit modes where a fetch is expected
  if (mode !== "add" && salaryHeadLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading salary head data...</p>
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
        <span>Salary Heads</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Salary Head Management</span>
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
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Wage Salary Heads</CardTitle>
                  <p className="text-blue-100 mt-1">Configure salary head details and how the amount is calculated</p>
                </div>
              </div>
            </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Organization Details - hidden from UI; organizationCode defaults to "midhani" in backend */}

            {/* Salary Head Details Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Salary Head Details</h3>
                  <p className="text-sm text-gray-600">Provide identifying info and description for each salary head</p>
                </div>
              </div>

              <div className="space-y-6">
                {form.salaryHeads.map((head, idx) => (
                  <div key={idx} id={`sh-item-${idx}`} className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Salary Head</h4>
                        {form.salaryHeads.length > 1 && mode !== "view" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeHead(idx)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Name *</Label>
                          <Input
                            value={head.name}
                            onChange={e => updateHead(idx, s => ({ ...s, name: e.target.value }))}
                            placeholder="Enter salary head name"
                            disabled={mode === "view"}
                            className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${showErrors && !head.name.trim() ? 'border-red-500 focus:border-red-500' : ''} ${mode === "view" ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          />
                          {showErrors && !head.name.trim() && (
                            <p className="text-red-500 text-sm">Name is required</p>
                          )}
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Code *</Label>
                          <Input
                            value={head.code}
                            onChange={e => updateHead(idx, s => ({ ...s, code: e.target.value }))}
                            placeholder="Enter salary head code"
                            disabled={mode === "view"}
                            className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${(showErrors && !head.code.trim()) || (head.code.trim() && isCodeDuplicate(head.code, idx)) ? 'border-red-500 focus:border-red-500' : ''} ${mode === "view" ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          />
                          {showErrors && !head.code.trim() && (
                            <p className="text-red-500 text-sm">Code is required</p>
                          )}
                          {head.code.trim() && isCodeDuplicate(head.code, idx) && (
                            <p className="text-red-500 text-sm">{head.code.trim()} is already created</p>
                          )}
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Salary Type</Label>
                          <Select
                            value={head.salaryType}
                            onValueChange={(v: "earning" | "deduction") => updateHead(idx, s => ({ ...s, salaryType: v }))}
                            disabled={mode === "view"}
                          >
                            <SelectTrigger className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${mode === "view" ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="earning">earning</SelectItem>
                              <SelectItem value="deduction">deduction</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Description</Label>
                        <Textarea
                          value={head.description}
                          onChange={e => updateHead(idx, s => ({ ...s, description: e.target.value }))}
                          placeholder="Enter description"
                          disabled={mode === "view"}
                          className={`min-h-24 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${mode === "view" ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Primary Salary Head</Label>
                          <SelectSearch
                            options={apiSalaryHeads.map((sh: any) => ({ value: sh.code, label: `${sh.name} (${sh.code})` }))}
                            value={(head.primarySalaryHead as any)?.code || ""}
                            onValueChange={(value) => {
                              if (mode === "view") return
                              const found = apiSalaryHeads.find((sh: any) => sh.code === value)
                              updateHead(idx, s => ({
                                ...s,
                                primarySalaryHead: found ? { name: found.name, code: found.code } : {}
                              }))
                            }}
                            placeholder="Select primary salary head"
                            disabled={mode === "view"}
                            className={`h-11 rounded-lg border-gray-300 bg-gray-50 ${mode === "view" ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            searchPlaceholder="Search salary heads..."
                            emptyMessage="No salary heads found."
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Salary Calculation Basis</Label>
                          <Select
                            value={head.salaryCalculationBasis}
                            onValueChange={v => updateHead(idx, s => ({ ...s, salaryCalculationBasis: v }))}
                            disabled={mode === "view"}
                          >
                            <SelectTrigger className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${mode === "view" ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                              <SelectValue placeholder="Select basis" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="payable days">payable days</SelectItem>
                              <SelectItem value="present days">present days</SelectItem>
                              <SelectItem value="fixed">fixed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Calculation Type</Label>
                          <Select
                            value={head.calculationType.type}
                            onValueChange={(v: CalculationType["type"]) => {
                              if (mode === "view") return
                              updateHead(idx, s => ({
                                ...s,
                                calculationType:
                                  v === "slab"
                                    ? { type: v, slabs: s.calculationType.type === "slab" && s.calculationType.slabs ? s.calculationType.slabs : [{ from: 0, to: 0, amount: 0 }] }
                                    : v === "percentage"
                                    ? { type: v, percentageAmount: s.calculationType.type === "percentage" && s.calculationType.percentageAmount ? s.calculationType.percentageAmount : "" }
                                    : v === "formula"
                                    ? {
                                        type: v,
                                        expression: s.calculationType.type === "formula" ? s.calculationType.expression : "",
                                        variables: s.calculationType.type === "formula" ? s.calculationType.variables || [] : [],
                                        operation: s.calculationType.type === "formula" ? s.calculationType.operation || [] : [],
                                      }
                                    : { type: v },
                              }))
                            }}
                            disabled={mode === "view"}
                          >
                            <SelectTrigger className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${mode === "view" ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                              <SelectValue placeholder="Select calculation type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="fixed">fixed</SelectItem>
                              <SelectItem value="percentage">percentage</SelectItem>
                              <SelectItem value="slab">slab</SelectItem>
                              <SelectItem value="formula">formula</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {head.calculationType.type === "percentage" && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-lg border border-gray-200 p-4 bg-blue-50">
                          <div className="space-y-3">
                            <Label className="text-sm font-medium text-gray-700">Percentage Amount</Label>
                            <Input
                              type="number"
                              value={head.calculationType.percentageAmount || ""}
                              onChange={e =>
                                updateHead(idx, s => ({
                                  ...s,
                                  calculationType: {
                                    ...s.calculationType,
                                    percentageAmount: e.target.value,
                                  },
                                }))
                              }
                              placeholder="10"
                              className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <p className="text-xs text-gray-600">Enter percentage to apply. Example: 10 for 10%.</p>
                          </div>
                        </div>
                      )}

                      {head.calculationType.type === "slab" && (
                        <div className="space-y-4 rounded-lg border border-gray-200 p-4 bg-blue-50">
                          <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium text-gray-700">Slabs</Label>
                            <p className="text-xs text-gray-600">Define ranges and amounts for each slab.</p>
                          </div>
                      <div className="space-y-3">
                          {(head.calculationType.slabs || []).map((slab, slabIdx) => (
                            <div key={slabIdx} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                              <div className="space-y-3">
                                <Label className="text-sm font-medium text-gray-700">From</Label>
                                <Input
                                  type="number"
                                  value={Number.isFinite(slab.from) ? slab.from : 0}
                                  onChange={e =>
                                    updateHead(idx, s => ({
                                      ...s,
                                      calculationType: {
                                        ...s.calculationType,
                                        slabs: (s.calculationType.slabs || []).map((sl, i) =>
                                          i === slabIdx ? { ...sl, from: Number(e.target.value || 0) } : sl
                                        ),
                                      },
                                    }))
                                  }
                                  className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                              <div className="space-y-3">
                                <Label className="text-sm font-medium text-gray-700">To</Label>
                                <Input
                                  type="number"
                                  value={Number.isFinite(slab.to) ? slab.to : 0}
                                  onChange={e =>
                                    updateHead(idx, s => ({
                                      ...s,
                                      calculationType: {
                                        ...s.calculationType,
                                        slabs: (s.calculationType.slabs || []).map((sl, i) =>
                                          i === slabIdx ? { ...sl, to: Number(e.target.value || 0) } : sl
                                        ),
                                      },
                                    }))
                                  }
                                  className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                              <div className="space-y-3">
                                <Label className="text-sm font-medium text-gray-700">Amount</Label>
                                <Input
                                  type="number"
                                  value={Number.isFinite(slab.amount) ? slab.amount : 0}
                                  onChange={e =>
                                    updateHead(idx, s => ({
                                      ...s,
                                      calculationType: {
                                        ...s.calculationType,
                                        slabs: (s.calculationType.slabs || []).map((sl, i) =>
                                          i === slabIdx ? { ...sl, amount: Number(e.target.value || 0) } : sl
                                        ),
                                      },
                                    }))
                                  }
                                  className="h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                              
                            </div>
                          ))}
                      </div>
                          
                        </div>
                      )}

                      {head.calculationType.type === "formula" && (
                        <div className="rounded-lg border border-gray-200 p-4 bg-blue-50">
                          <FormulaBuilder 
                            salaryHeads={apiSalaryHeads}
                            expression={head.calculationType.expression || ""}
                            variables={head.calculationType.variables || []}
                            operation={head.calculationType.operation || []}
                            onFormulaChange={(data) => {
                              updateHead(idx, s => ({
                                ...s,
                                calculationType: {
                                  ...s.calculationType,
                                  expression: data.expression,
                                  variables: data.variables,
                                  operation: data.operation,
                                },
                              }))
                            }}
                          />
                        </div>
                      )}

                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Excluded Days</Label>
                    <div className="space-y-2">
                      {["weekOffs", "leaveDays", "holidays"].map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`${idx}-${day}`}
                            checked={head.excludedDays.includes(day)}
                            disabled={mode === "view"}
                            onChange={() => {
                              if (mode === "view") return
                              const isSelected = head.excludedDays.includes(day)
                              updateHead(idx, s => ({
                                ...s,
                                excludedDays: isSelected
                                  ? s.excludedDays.filter(d => d !== day)
                                  : [...s.excludedDays, day]
                              }))
                            }}
                            className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${mode === "view" ? 'cursor-not-allowed opacity-50' : ''}`}
                          />
                          <label htmlFor={`${idx}-${day}`} className="text-sm font-medium text-gray-700 capitalize cursor-pointer">
                            {day}
                          </label>
                        </div>
                      ))}
                    </div>
                    {head.excludedDays.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-2">Selected: {head.excludedDays.join(", ")}</p>
                        <div className="flex flex-wrap gap-1">
                          {head.excludedDays.map((day) => (
                            <span
                              key={day}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {day}
                              <button
                                type="button"
                                onClick={() => {
                                  updateHead(idx, s => ({
                                    ...s,
                                    excludedDays: s.excludedDays.filter(d => d !== day)
                                  }))
                                }}
                                className="ml-1 hover:text-blue-600"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">Applicable Months</Label>
                    <div className="space-y-2">
                      <div className="grid grid-cols-6 gap-2">
                        {[
                          { value: 1, label: "Jan" },
                          { value: 2, label: "Feb" },
                          { value: 3, label: "Mar" },
                          { value: 4, label: "Apr" },
                          { value: 5, label: "May" },
                          { value: 6, label: "Jun" },
                          { value: 7, label: "Jul" },
                          { value: 8, label: "Aug" },
                          { value: 9, label: "Sep" },
                          { value: 10, label: "Oct" },
                          { value: 11, label: "Nov" },
                          { value: 12, label: "Dec" }
                        ].map((month) => (
                          <div key={month.value} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`${idx}-month-${month.value}`}
                              checked={head.applicableMonths.includes(month.value)}
                              disabled={mode === "view"}
                              onChange={() => {
                                if (mode === "view") return
                                const isSelected = head.applicableMonths.includes(month.value)
                                updateHead(idx, s => ({
                                  ...s,
                                  applicableMonths: isSelected
                                    ? s.applicableMonths.filter(m => m !== month.value)
                                    : [...s.applicableMonths, month.value]
                                }))
                              }}
                              className={`w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 ${mode === "view" ? 'cursor-not-allowed opacity-50' : ''}`}
                            />
                            <label htmlFor={`${idx}-month-${month.value}`} className="text-sm font-medium text-gray-700 cursor-pointer">
                              {month.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    {head.applicableMonths.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-gray-600 mb-2">Selected months: {head.applicableMonths.sort((a, b) => a - b).map(m => {
                          const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                          return months[m - 1]
                        }).join(", ")}</p>
                        <div className="flex flex-wrap gap-1">
                          {head.applicableMonths.sort((a, b) => a - b).map((month) => {
                            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                            return (
                              <span
                                key={month}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800"
                              >
                                {months[month - 1]}
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateHead(idx, s => ({
                                      ...s,
                                      applicableMonths: s.applicableMonths.filter(m => m !== month)
                                    }))
                                  }}
                                  className="ml-1 hover:text-green-600"
                                >
                                  ×
                                </button>
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {head.calculationType.type === "formula" && false && (
                    <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                      <div className="space-y-2">
                        <Label>Expression</Label>
                        <Input
                          value={head.calculationType.expression || ""}
                          onChange={e =>
                            updateHead(idx, s => ({
                              ...s,
                              calculationType: {
                                ...s.calculationType,
                                expression: e.target.value,
                              },
                            }))
                          }
                          placeholder="(Basic + 0.5*HRA + PF)*0.1"
                        />
                        <p className="text-xs text-muted-foreground">Use variables defined below to form a formula.</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Variables (comma separated)</Label>
                        <Input
                          value={(head.calculationType.variables || []).join(", ")}
                          onChange={e =>
                            updateHead(idx, s => ({
                              ...s,
                              calculationType: {
                                ...s.calculationType,
                                variables: e.target.value
                                  .split(",")
                                  .map(v => v.trim())
                                  .filter(v => v.length > 0),
                              },
                            }))
                          }
                          placeholder="Basic, HRA, PF"
                        />
                        <p className="text-xs text-muted-foreground">Separate variable names with commas.</p>
                      </div>

                      {/* Calculator keypad */}
                      <div className="space-y-3">
                        <Label>Keypad</Label>
                        <div className="rounded-md border p-3">
                          <div className="grid grid-cols-5 gap-2 mb-3">
                            <Button type="button" variant="outline" onClick={() =>
                              updateHead(idx, s => ({
                                ...s,
                                calculationType: {
                                  ...s.calculationType,
                                  expression: (s.calculationType.expression || "").slice(0, -1),
                                },
                              }))
                            }>{"<-"}</Button>
                            <Button type="button" variant="outline" onClick={() =>
                              updateHead(idx, s => ({
                                ...s,
                                calculationType: { ...s.calculationType, expression: "" },
                              }))
                            }>c</Button>
                          </div>
                          <div className="grid grid-cols-5 gap-2 mb-2">
                            {[
                              "7","8","9","*","/",
                              "4","5","6","+","-",
                              "1","2","3","(",")",
                              ".","0"
                            ].map(key => (
                              <Button key={key} type="button" variant="secondary" onClick={() =>
                                updateHead(idx, s => ({
                                  ...s,
                                  calculationType: {
                                    ...s.calculationType,
                                    expression: `${s.calculationType.expression || ""}${key}`,
                                  },
                                }))
                              }>
                                {key}
                              </Button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" variant="secondary" onClick={() => {
                              const expr = head.calculationType.expression || ""
                              const valid = /^[-+*/().0-9\sA-Za-z_]+$/.test(expr)
                              const stack: string[] = []
                              let balanced = true
                              for (const ch of expr) {
                                if (ch === "(") stack.push(ch)
                                if (ch === ")") balanced = balanced && stack.pop() === "("
                              }
                              if (stack.length !== 0) balanced = false
                              const ok = valid && balanced
                              if (!ok) console.warn("Expression may be invalid or unbalanced")
                            }}>Check Syntax</Button>
                            <Button type="button" onClick={() => {}}>Ok</Button>
                            <Button type="button" variant="destructive" onClick={() =>
                              updateHead(idx, s => ({
                                ...s,
                                calculationType: { ...s.calculationType, expression: "" },
                              }))
                            }>Cancel</Button>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Operations</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              onClick={() =>
                                updateHead(idx, s => ({
                                  ...s,
                                  calculationType: {
                                    ...s.calculationType,
                                    operation: [...(s.calculationType.operation || []), { comparator: "lessThan", value: 0, then: 0 } as Operation],
                                  },
                                }))
                              }
                            >
                              Add lessThan
                            </Button>
                                <Button
                                  type="button"
                                  onClick={() =>
                                    updateHead(idx, s => ({
                                      ...s,
                                      calculationType: {
                                        ...s.calculationType,
                                        operation: [...(s.calculationType.operation || []), { comparator: "greaterThan", value: 0, then: 0 } as Operation],
                                      },
                                    }))
                                  }
                                >
                                  Add greaterThan
                                </Button>
                            <Button
                              type="button"
                              onClick={() =>
                                updateHead(idx, s => ({
                                  ...s,
                                  calculationType: {
                                    ...s.calculationType,
                                    operation: [...(s.calculationType.operation || []), { comparator: "equalTo", value: 0, then: 0 } as Operation],
                                  },
                                }))
                              }
                            >
                              Add equalTo
                            </Button>
                            <Button
                              type="button"
                              onClick={() =>
                                updateHead(idx, s => ({
                                  ...s,
                                  calculationType: {
                                    ...s.calculationType,
                                    operation: [...(s.calculationType.operation || []), { comparator: "between", from: 0, to: 0, then: 0 } as Operation],
                                  },
                                }))
                              }
                            >
                              Add between
                            </Button>
                          </div>
                        </div>

                        {(head.calculationType.operation || []).map((op, opIdx) => (
                          <div key={opIdx} className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                            <div className="space-y-2">
                              <Label>Comparator</Label>
                              <Select
                                value={op.comparator}
                                onValueChange={v =>
                                  updateHead(idx, s => ({
                                    ...s,
                                    calculationType: {
                                      ...s.calculationType,
                                      operation: (s.calculationType.operation || []).map((o, i) =>
                                        i === opIdx
                                          ? (v === "lessThan"
                                              ? { comparator: "lessThan", value: 0, then: (o as any).then ?? 0 }
                                              : v === "greaterThan"
                                              ? { comparator: "greaterThan", value: 0, then: (o as any).then ?? 0 }
                                              : v === "equalTo"
                                              ? { comparator: "equalTo", value: 0, then: (o as any).then ?? 0 }
                                              : { comparator: "between", from: 0, to: 0, then: (o as any).then ?? 0 })
                                          : o
                                      ),
                                    },
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose comparator" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="lessThan">lessThan</SelectItem>
                                  <SelectItem value="greaterThan">greaterThan</SelectItem>
                                  <SelectItem value="equalTo">equalTo</SelectItem>
                                  <SelectItem value="between">between</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {op.comparator === "lessThan" && (
                              <>
                                <div className="space-y-2">
                                  <Label>Value</Label>
                                  <Input
                                    type="number"
                                    value={(op as any).value}
                                    onChange={e =>
                                      updateHead(idx, s => ({
                                        ...s,
                                        calculationType: {
                                          ...s.calculationType,
                                          operation: (s.calculationType.operation || []).map((o, i) =>
                                            i === opIdx ? { ...(o as any), value: Number(e.target.value || 0) } : o
                                          ),
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Then</Label>
                                  <Input
                                    type="number"
                                    value={(op as any).then}
                                    onChange={e =>
                                      updateHead(idx, s => ({
                                        ...s,
                                        calculationType: {
                                          ...s.calculationType,
                                          operation: (s.calculationType.operation || []).map((o, i) =>
                                            i === opIdx ? { ...(o as any), then: Number(e.target.value || 0) } : o
                                          ),
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              </>
                            )}

                            {op.comparator === "equalTo" && (
                              <>
                                <div className="space-y-2">
                                  <Label>Value</Label>
                                  <Input
                                    type="number"
                                    value={(op as any).value}
                                    onChange={e =>
                                      updateHead(idx, s => ({
                                        ...s,
                                        calculationType: {
                                          ...s.calculationType,
                                          operation: (s.calculationType.operation || []).map((o, i) =>
                                            i === opIdx ? { ...(o as any), value: Number(e.target.value || 0) } : o
                                          ),
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Then</Label>
                                  <Input
                                    type="number"
                                    value={(op as any).then}
                                    onChange={e =>
                                      updateHead(idx, s => ({
                                        ...s,
                                        calculationType: {
                                          ...s.calculationType,
                                          operation: (s.calculationType.operation || []).map((o, i) =>
                                            i === opIdx ? { ...(o as any), then: Number(e.target.value || 0) } : o
                                          ),
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              </>
                            )}

                            {op.comparator === "greaterThan" && (
                              <>
                                <div className="space-y-2">
                                  <Label>Value</Label>
                                  <Input
                                    type="number"
                                    value={(op as any).value}
                                    onChange={e =>
                                      updateHead(idx, s => ({
                                        ...s,
                                        calculationType: {
                                          ...s.calculationType,
                                          operation: (s.calculationType.operation || []).map((o, i) =>
                                            i === opIdx ? { ...(o as any), value: Number(e.target.value || 0) } : o
                                          ),
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Then</Label>
                                  <Input
                                    type="number"
                                    value={(op as any).then}
                                    onChange={e =>
                                      updateHead(idx, s => ({
                                        ...s,
                                        calculationType: {
                                          ...s.calculationType,
                                          operation: (s.calculationType.operation || []).map((o, i) =>
                                            i === opIdx ? { ...(o as any), then: Number(e.target.value || 0) } : o
                                          ),
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              </>
                            )}

                            {op.comparator === "between" && (
                              <>
                                <div className="space-y-2">
                                  <Label>From</Label>
                                  <Input
                                    type="number"
                                    value={(op as any).from}
                                    onChange={e =>
                                      updateHead(idx, s => ({
                                        ...s,
                                        calculationType: {
                                          ...s.calculationType,
                                          operation: (s.calculationType.operation || []).map((o, i) =>
                                            i === opIdx ? { ...(o as any), from: Number(e.target.value || 0) } : o
                                          ),
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>To</Label>
                                  <Input
                                    type="number"
                                    value={(op as any).to}
                                    onChange={e =>
                                      updateHead(idx, s => ({
                                        ...s,
                                        calculationType: {
                                          ...s.calculationType,
                                          operation: (s.calculationType.operation || []).map((o, i) =>
                                            i === opIdx ? { ...(o as any), to: Number(e.target.value || 0) } : o
                                          ),
                                        },
                                      }))
                                    }
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Then</Label>
                                  <Input
                                    type="number"
                                    value={(op as any).then}
                                    onChange={e =>
                                      updateHead(idx, s => ({
                                        ...s,
                                        calculationType: {
                                          ...s.calculationType,
                                          operation: (s.calculationType.operation || []).map((o, i) =>
                                            i === opIdx ? { ...(o as any), then: Number(e.target.value || 0) } : o
                                          ),
                                        },
                                      }))
                                    }
                                  />
                                </div>
                              </>
                            )}

                            <div className="flex">
                              <Button
                                type="button"
                                variant="destructive"
                                onClick={() =>
                                  updateHead(idx, s => ({
                                    ...s,
                                    calculationType: {
                                      ...s.calculationType,
                                      operation: (s.calculationType.operation || []).filter((_, i) => i !== opIdx),
                                    },
                                  }))
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
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
                  {mode !== "view" && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                      className="px-6 py-3 h-12 rounded-xl border-2 border-gray-300 hover:bg-gray-50 bg-transparent text-gray-700 hover:text-gray-900 transition-all duration-200 hover:border-gray-400"
                    >
                      Reset Form
                    </Button>
                  )}
                </div>

                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                  {mode !== "view" && (
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${validateForm() ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {validateForm() ? 'Form is valid and ready to save' : 'Please complete all required fields'}
                      </span>
                    </div>
                  )}
                  {mode !== "view" && (
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={postLoading}
                      className="px-8 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      {postLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {mode === "edit" ? "Updating..." : "Saving..."}
                        </div>
                      ) : (
                        mode === "edit" ? "Update Salary Head" : "Save Salary Head"
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