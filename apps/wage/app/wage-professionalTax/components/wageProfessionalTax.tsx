"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { toast } from "react-toastify"
import { useWageProfessionalTaxCrud, type WageProfessionalTaxForm as WageProfessionalTaxFormType } from "@/hooks/useWageProfessionalTaxCrud"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken"
import { useRouter, useSearchParams } from "next/navigation"
import { Building2, MapPin, Calendar, Users, DollarSign, Settings, Plus, Trash2, ArrowLeft } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

type Slab = { from: number; to: number; amount: number }

type ProfessionalTaxItem = {
  country?: string
  state: string
  effectiveFrom: string
  slabs: Slab[]
  applicableTo: string
}

type WageProfessionalTaxForm = {
  _id?: { $oid: string }
  organizationCode: string
  tenantCode: string
  professionaTax: ProfessionalTaxItem[]
}

const emptySlab = (): Slab => ({ from: 0, to: 0, amount: 0 })
const emptyPTItem = (): ProfessionalTaxItem => ({ country: "", state: "", effectiveFrom: "", slabs: [emptySlab()], applicableTo: "All" })

const STORAGE_KEY = "wageProfessionalTaxForm"

export default function WageProfessionalTax({ 
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
  
  // Use URL mode if available, otherwise fallback to prop mode
  const currentMode = urlMode as 'add' | 'edit' | 'view' || mode || 'add'
  const [form, setForm] = useState<WageProfessionalTaxForm>({
    organizationCode: "",
    tenantCode: "",
    professionaTax: [emptyPTItem()],
  })

  const [countries, setCountries] = useState<Array<{countryCode: string, countryName: string}>>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [countriesError, setCountriesError] = useState<string | null>(null)
  
  const [states, setStates] = useState<Array<{stateCode: string, stateName: string}>>([])
  const [loadingStates, setLoadingStates] = useState(false)
  const [statesError, setStatesError] = useState<string | null>(null)

  const { record, setRecord, upsertRecord, deleteRecord } = useWageProfessionalTaxCrud(null)
  const { token, loading: tokenLoading, error: tokenError } = useAuthToken()
  const tenantCode = useGetTenantCode()
  const submitContextRef = useRef<{ mode: "add" | "edit" | "view"; id: string | null }>({
    mode: "add",
    id: null,
  })

  const normalizeId = (value: any) => {
    if (!value) return ""
    if (typeof value === "string") return value
    if (typeof value === "object" && value.$oid) return String(value.$oid)
    return String(value)
  }

  const normalizeDateForInput = (value: any) => {
    if (!value) return ""
    const raw = String(value).trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
    if (raw.includes("T")) return raw.split("T")[0]
    const parsed = new Date(raw)
    if (Number.isNaN(parsed.getTime())) return ""
    const yyyy = parsed.getFullYear()
    const mm = `${parsed.getMonth() + 1}`.padStart(2, "0")
    const dd = `${parsed.getDate()}`.padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  // Fetch single professional tax data for edit/view mode
  const {
    data: professionalTaxData,
    loading: professionalTaxLoading,
    error: professionalTaxError,
    refetch: fetchProfessionalTax
  } = useRequest<any>({
    url: 'wageProfessionalTax/search',
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
        // Transform single professional tax data to form format (supports flat and nested shapes)
        const row = data[0]
        const nested = Array.isArray(row.professionaTax) && row.professionaTax.length > 0 ? row.professionaTax[0] : {}
        const pt = { ...nested, ...row }
        
        // Handle _id properly - it could be a string, object with $oid, or object directly
        let formattedId: { $oid: string } | undefined = undefined
        const normalizedId = normalizeId(row._id)
        if (normalizedId) {
          formattedId = { $oid: normalizedId }
        }
        
        setForm({
          _id: formattedId,
          organizationCode: pt.organizationCode || "",
          tenantCode: pt.tenantCode || "",
          professionaTax: [{
            country: pt.country || "",
            state: pt.state || "",
            effectiveFrom: normalizeDateForInput(pt.effectiveFrom),
            slabs: Array.isArray(pt.slabs) && pt.slabs.length > 0
              ? pt.slabs.map((s: any) => ({
                  from: Number.isFinite(Number(s?.from)) ? Number(s.from) : 0,
                  to: Number.isFinite(Number(s?.to)) ? Number(s.to) : 0,
                  amount: Number.isFinite(Number(s?.amount)) ? Number(s.amount) : 0,
                }))
              : [emptySlab()],
            applicableTo: pt.applicableTo || "All",
          }]
        })
      }
    },
    onError: (error) => {
      console.error("Error fetching professional tax data:", error);
    },
    dependencies: [id]
  });

  const {
    post: postWageProfessionalTax,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "wageProfessionalTax",
    onSuccess: () => {
      const ctx = submitContextRef.current
      alert(`Professional Tax ${ctx.mode === "edit" ? "updated" : "created"} successfully.`)
      setTimeout(() => {
        router.push('/wage-professionalTax')
      }, 1000)
    },
    onError: (error) => {
      const ctx = submitContextRef.current
      alert(`Failed to ${ctx.mode === "edit" ? "update" : "save"} Professional Tax.`)
      console.error("POST error:", error)
    },
  })

  // Fetch data when in edit/view mode
  useEffect(() => {
    if (currentMode === "view" || currentMode === "edit") {
      fetchProfessionalTax()
    }
  }, [currentMode, id])

  // Navigation handlers
  const handleBack = () => {
    router.push('/wage-professionalTax')
  }

  const handleCancel = () => {
    router.push('/wage-professionalTax')
  }

  // Get page title based on mode
  const getPageTitle = () => {
    switch (currentMode) {
      case "add":
        return "Add New Professional Tax"
      case "edit":
        return "Edit Professional Tax"
      case "view":
        return "View Professional Tax"
      default:
        return "Professional Tax Management"
    }
  }

  // Get page description based on mode
  const getPageDescription = () => {
    switch (currentMode) {
      case "add":
        return "Add new professional tax configuration and slabs"
      case "edit":
        return "Edit existing professional tax configuration and slabs"
      case "view":
        return "View professional tax details (read-only)"
      default:
        return "Manage professional tax configuration and slabs"
    }
  }

  // auto-scroll to a specific state card when requested
  useEffect(() => {
    if (typeof scrollToIndex === "number") {
      const id = `pt-item-${scrollToIndex}`
      // delay to ensure DOM is painted
      const t = setTimeout(() => {
        const el = document.getElementById(id)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 50)
      return () => clearTimeout(t)
    }
  }, [scrollToIndex, form.professionaTax.length])

  // Fetch countries using GraphQL
  useEffect(() => {
    // Don't make API call if token is loading or not available
    if (tokenLoading || !token) {
      return;
    }

    // Validate token before making API call
    if (!token || token.trim() === '') {
      setCountriesError('Invalid authentication token');
      return;
    }

    setLoadingCountries(true);
    setCountriesError(null);

    // Define the GraphQL query
    const query = `
      query FetchOrganization {
        fetchOrganization(
          criteriaRequests: [
            { field: "organizationCode", operator: "is", value: ${tenantCode} }
            { field: "tenantCode", operator: "is", value: "${tenantCode}" }
          ]
          collection: "organization"
        ) {
          country {
            countryCode
            countryName
          }
        }
      }
    `;

    // Helper function to create headers with token
    const createHeaders = (token: string) => {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/json',
      };
    };

    // Send the request using fetch
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`, {
      method: 'POST',
      headers: createHeaders(token),
      mode: "cors",
      credentials: "include",
      body: JSON.stringify({ query })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status} - ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        // Extract the countries from the data
        if (data?.data?.fetchOrganization?.[0]?.country) {
          setCountries(data.data.fetchOrganization[0].country);
      } else {
          setCountriesError('No country data found');
      }
      })
      .catch(error => {
        console.error('Error fetching countries:', error);
        setCountriesError(`Failed to fetch countries: ${error.message}`);
      })
      .finally(() => {
        setLoadingCountries(false);
      });
  }, [token, tokenLoading]);

  // Fetch states using GraphQL
  useEffect(() => {
    // Don't make API call if token is loading or not available
    if (tokenLoading || !token) {
      return;
    }

    // Validate token before making API call
    if (!token || token.trim() === '') {
      setStatesError('Invalid authentication token');
      return;
    }

    setLoadingStates(true);
    setStatesError(null);

    // Define the GraphQL query
    const query = `
      query FetchOrganization {
        fetchOrganization(
          criteriaRequests: [
            { field: "organizationCode", operator: "is", value: ${tenantCode} }
            { field: "tenantCode", operator: "is", value: "${tenantCode}" }
          ]
          collection: "organization"
        ) {
          state {
            stateCode
            stateName
          }
        }
      }
    `;

    // Helper function to create headers with token
    const createHeaders = (token: string) => {
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/json',
      };
    };

    // Send the request using fetch
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`, {
      method: 'POST',
      headers: createHeaders(token),
      mode: "cors",
      credentials: "include",
      body: JSON.stringify({ query })
    })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status} - ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        // Extract the states from the data
        if (data?.data?.fetchOrganization?.[0]?.state) {
          setStates(data.data.fetchOrganization[0].state);
        } else {
          setStatesError('No state data found');
        }
      })
      .catch(error => {
        console.error('Error fetching states:', error);
        setStatesError(`Failed to fetch states: ${error.message}`);
      })
      .finally(() => {
        setLoadingStates(false);
      });
  }, [token, tokenLoading]);

  const resetForm = () => setForm({ _id: undefined, organizationCode: "", tenantCode: "", professionaTax: [emptyPTItem()] })

  // Handle initial data and mode
  useEffect(() => {
    if (initialData && mode) {
      // For edit/view mode, populate form with existing data
      if (record) {
        setForm({
          organizationCode: record.organizationCode || "",
          tenantCode: record.tenantCode || "",
          professionaTax: record.professionaTax || [emptyPTItem()],
        })
      }
    } else if (mode === 'add') {
      // For add mode, reset form and auto-assign organization/tenant from tenantCode hook
      setForm({
        _id: undefined,
        organizationCode: tenantCode,
        tenantCode: tenantCode,
        professionaTax: [emptyPTItem()],
      })
    }
  }, [initialData, mode, record, tenantCode])

  // Check if form is in view mode
  const isViewMode = currentMode === 'view'
  const isEditMode = currentMode === 'edit'
  const isAddMode = currentMode === 'add'
  
  const updateRoot = (key: keyof WageProfessionalTaxForm, value: any) => setForm(prev => ({ ...prev, [key]: value }))
  const updatePT = (index: number, updater: (p: ProfessionalTaxItem) => ProfessionalTaxItem) =>
    setForm(prev => ({ ...prev, professionaTax: prev.professionaTax.map((p, i) => (i === index ? updater(p) : p)) }))

  // Form validation
  const validateForm = () => {
    const errors: string[] = []

    form.professionaTax.forEach((pt, index) => {
      if (!pt.country?.trim()) {
        errors.push(`Country is required for Professional Tax item ${index + 1}`)
      }
      if (!pt.state?.trim()) {
        errors.push(`State is required for Professional Tax item ${index + 1}`)
      }
      if (!pt.effectiveFrom?.trim()) {
        errors.push(`Effective From date is required for Professional Tax item ${index + 1}`)
      }
    })
    
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

    const recordId = currentMode === 'edit'
      ? (form._id?.$oid || id || null)
      : (form._id?.$oid || null)

    const ptItem = form.professionaTax[0] || emptyPTItem()
    const baseData: any = {
      organizationCode: tenantCode,
      tenantCode: tenantCode,
      country: ptItem.country,
      state: ptItem.state,
      effectiveFrom: ptItem.effectiveFrom,
      slabs: ptItem.slabs,
      applicableTo: ptItem.applicableTo,
      professionaTax: [ptItem],
    }

    if (currentMode === 'edit' && recordId) {
      baseData._id = recordId
    }

    if (currentMode === 'edit') {
      baseData.updatedOn = new Date().toISOString()
    } else {
      baseData.createdOn = new Date().toISOString()
    }

    const payload = {
      tenant: tenantCode,
      action: "insert",
      ...(recordId ? { id: recordId } : {}),
      collectionName: "wageProfessionalTax",
      data: baseData
    }

    submitContextRef.current = {
      mode: currentMode,
      id: recordId ? String(recordId) : null,
    }

    await postWageProfessionalTax(payload)
  }

  // Add/Remove controls are disabled per requirement

  // Show loading state only for edit/view modes
  if ((isEditMode || isViewMode) && professionalTaxLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading professional tax data...</p>
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
        <span>Professional Tax</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Professional Tax Management</span>
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
                  <CardTitle className="text-2xl font-bold">Wage Professional Tax</CardTitle>
                  <p className="text-blue-100 mt-1">Configure country-wise, state-wise, professional tax slabs and applicability</p>
                </div>
              </div>
            </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Professional Tax Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-2 border-b border-blue-200">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Professional Tax Configuration</h3>
                  <p className="text-sm text-gray-600">Country-wise, state-wise, tax slabs and applicability settings</p>
                </div>
              </div>

              <div className="space-y-6">
                {form.professionaTax.map((pt, idx) => (
                  <Card key={idx} id={`pt-item-${idx}`} className="border border-gray-200 shadow-sm">
                    <CardContent className="p-6 space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-900">Professional Tax Item </h4>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-600">State Configuration</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Country</Label>
                          <Select 
                            value={pt.country || ""} 
                            onValueChange={v => updatePT(idx, s => ({ ...s, country: v }))}
                            disabled={loadingCountries || !!countriesError || isViewMode}
                          >
                            <SelectTrigger className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                              <SelectValue placeholder={
                                loadingCountries ? "Loading countries..." : 
                                countriesError ? "Error loading countries" : 
                                "Select country"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((c, index) => (
                                <SelectItem key={index} value={c.countryName}>{c.countryName}</SelectItem>
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
                            value={pt.state} 
                            onValueChange={v => updatePT(idx, s => ({ ...s, state: v }))}
                            disabled={loadingStates || !!statesError || isViewMode}
                          >
                            <SelectTrigger className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                              <SelectValue placeholder={
                                loadingStates ? "Loading states..." : 
                                statesError ? "Error loading states" : 
                                "Select state"
                              } />
                            </SelectTrigger>
                            <SelectContent>
                              {states.map((s, index) => (
                                <SelectItem key={index} value={s.stateName}>{s.stateName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {statesError && (
                            <p className="text-xs text-red-500">{statesError}</p>
                          )}
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Effective From</Label>
                          <Input
                            type="date"
                            value={pt.effectiveFrom ? new Date(pt.effectiveFrom).toISOString().slice(0,10) : ""}
                            onChange={e => updatePT(idx, s => ({ ...s, effectiveFrom: e.target.value }))}
                            disabled={isViewMode}
                            className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Applicable To</Label>
                          <Select value={pt.applicableTo} onValueChange={v => updatePT(idx, s => ({ ...s, applicableTo: v }))} disabled={isViewMode}>
                            <SelectTrigger className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All">All</SelectItem>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Tax Slabs Section */}
                      <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3 pb-2 border-b border-gray-300">
                          <DollarSign className="h-5 w-5 text-blue-600" />
                          <div>
                            <h5 className="text-base font-semibold text-gray-900">Tax Slabs</h5>
                            <p className="text-sm text-gray-600">Define salary ranges and corresponding tax amounts</p>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          {(pt.slabs || []).map((slab, slabIdx) => (
                            <div key={slabIdx} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                              <div className="flex items-center justify-between mb-4">
                                <h6 className="text-sm font-medium text-gray-700">Slab</h6>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="text-xs text-gray-500">Salary Range</span>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">From Amount</Label>
                                  <Input
                                    type="number"
                                    value={Number.isFinite(slab.from) ? slab.from : 0}
                                    onChange={e =>
                                      updatePT(idx, s => ({
                                        ...s,
                                        slabs: (s.slabs || []).map((sl, i) => (i === slabIdx ? { ...sl, from: Number(e.target.value || 0) } : sl)),
                                      }))
                                    }
                                    placeholder="0"
                                    disabled={isViewMode}
                                    className={`h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">To Amount</Label>
                                  <Input
                                    type="number"
                                    value={Number.isFinite(slab.to) ? slab.to : 0}
                                    onChange={e =>
                                      updatePT(idx, s => ({
                                        ...s,
                                        slabs: (s.slabs || []).map((sl, i) => (i === slabIdx ? { ...sl, to: Number(e.target.value || 0) } : sl)),
                                      }))
                                    }
                                    placeholder="0"
                                    disabled={isViewMode}
                                    className={`h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium text-gray-700">Tax Amount</Label>
                                  <Input
                                    type="number"
                                    value={Number.isFinite(slab.amount) ? slab.amount : 0}
                                    onChange={e =>
                                      updatePT(idx, s => ({
                                        ...s,
                                        slabs: (s.slabs || []).map((sl, i) => (i === slabIdx ? { ...sl, amount: Number(e.target.value || 0) } : sl)),
                                      }))
                                    }
                                    placeholder="0"
                                    disabled={isViewMode}
                                    className={`h-10 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                      <div className={`w-3 h-3 rounded-full ${validateForm() ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
                      <span className="text-sm font-medium text-gray-700">
                        {validateForm() ? 'Form is valid and ready to save' : 'Please complete all required fields'}
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
                        currentMode === "edit" ? "Update Professional Tax" : "Save Professional Tax"
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