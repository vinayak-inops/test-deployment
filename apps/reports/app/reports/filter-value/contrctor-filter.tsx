"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Search, X, ArrowRight, Building2, Users, Calendar } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"

interface Contractor {
  contractorCode: string
  contractorName: string
  workOrders?: Array<{ workOrderNumber: string }>
  location?: string
  contactPerson?: string
  phone?: string
  email?: string
  status?: string
}

interface OrganizationData {
  contractors: Contractor[]
}

export default function ContrctorFilter({fromValue, setFormValue, setMessenger, messenger}: {fromValue: any, setFormValue: (value: any) => void, setMessenger: (value: any) => void, messenger: any}) {
  const [selectedContractors, setSelectedContractors] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [contractorData, setContractorData] = useState<any[]>([])
  const tenantCode = useGetTenantCode()
  // Fetch contractors data
  const {
    data: contractors,
    loading: contractorsLoading,
    error: contractorsError,
    refetch: refetchContractors
  } = useRequest<OrganizationData[]>({
    url: `map/contractor/search?tenantCode=${tenantCode}`,
    onSuccess: (data: any) => {
      setContractorData(data)
    },
    onError: (error: any) => {
      console.error("Error loading contractors:", error)
    }
  })

  // Filter contractors based on search query using contractorData
  const filteredContractors = contractorData?.filter((contractor: any) => {
    const matchesSearch = 
      contractor.contractorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contractor.contractorCode?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  }) || []

  // Handle contractor selection - only store contractorCode
  const handleContractorSelect = (contractor: any) => {
    if (!selectedContractors.includes(contractor.contractorCode)) {
      setSelectedContractors([...selectedContractors, contractor.contractorCode])
    }
    setSearchQuery("")
    setIsDropdownOpen(false)
  }

  // Handle contractor removal
  const handleContractorRemove = (contractorCode: string) => {
    setSelectedContractors(selectedContractors.filter(c => c !== contractorCode))
  }

  // Handle save and continue
  const handleSaveAndContinue = () => {
    setFormValue((prev: any) => ({
      ...prev,
      contractor: selectedContractors,
      subsidiaries:["unKnown"]
    }))
    setMessenger((prev: any) => ({
      ...prev,
      progressbar: "Basic Information",

    }))
    // Add your save logic here
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.contractor-dropdown')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(()=>{
    refetchContractors()
  },[])

  return (
    <Card className=" border-0 bg-gradient-to-br from-white to-gray-50">
      <CardContent className="p-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Contractor Selection</h2>
              <p className="text-sm text-gray-600">Select contractors for report generation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {filteredContractors.length} contractors available
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Contractor Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="contractorSearch" className="text-sm font-medium text-gray-700">
                Select Contractors <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Users className="h-4 w-4" />
                {selectedContractors.length} selected
              </div>
            </div>
            
            {/* Enhanced Search and Select Input */}
            <div className="relative contractor-dropdown">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="contractorSearch"
                  type="text"
                  placeholder="Search contractors by name or code..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setIsDropdownOpen(true)
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className="pl-10 h-12 border-2 border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 rounded-xl transition-all duration-200 text-base"
                />
                <div 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer p-1 hover:bg-gray-100 rounded transition-colors"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <svg 
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Enhanced Dropdown Results */}
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                  {contractorsLoading ? (
                    <div className="p-4 text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-500">Loading contractors...</p>
                    </div>
                  ) : contractorsError ? (
                    <div className="p-4 text-center text-red-500 text-sm">
                      <X className="h-8 w-8 mx-auto mb-2" />
                      Error loading contractors. Please try again.
                    </div>
                  ) : filteredContractors.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      {searchQuery
                        ? 'No contractors found matching your criteria'
                        : 'No contractors available'
                      }
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-600 uppercase tracking-wide">
                        {filteredContractors.length} contractor(s) found
                      </div>
                      {filteredContractors.map((contractor: any) => (
                        <div
                          key={contractor.contractorCode}
                          onClick={() => handleContractorSelect(contractor)}
                          className="p-4 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-all duration-200 hover:shadow-sm"
                        >
                                                     <div className="flex items-start justify-between">
                             <div className="flex-1">
                               <div className="font-semibold text-gray-900 text-base">
                                 {contractor.contractorName} <span className="text-gray-600 font-normal">({contractor.contractorCode})</span>
                               </div>
                             </div>
                            {selectedContractors.includes(contractor.contractorCode) && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs px-2 py-1 bg-green-100 text-green-800"
                              >
                                Selected
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Enhanced Selected Contractors Display */}
            {selectedContractors.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Users className="h-4 w-4" />
                  Selected Contractors ({selectedContractors.length})
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {selectedContractors.map((contractorCode) => {
                    const contractor = contractorData.find(c => c.contractorCode === contractorCode)
                    return (
                      <div
                        key={contractorCode}
                        className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between">
                                                     <div className="flex-1">
                             <div className="font-semibold text-blue-900 text-sm">
                               {contractor?.contractorName || contractorCode} <span className="text-blue-700 font-normal">({contractorCode})</span>
                             </div>
                           </div>
                          <button
                            onClick={() => handleContractorRemove(contractorCode)}
                            className="ml-2 p-1 hover:bg-blue-200 rounded-full transition-colors group"
                            title="Remove contractor"
                          >
                            <X className="h-4 w-4 text-blue-600 group-hover:text-blue-800" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Enhanced Status Information */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
              <div className={`w-3 h-3 rounded-full ${selectedContractors.length > 0 ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  {selectedContractors.length > 0 
                    ? `${selectedContractors.length} contractor(s) selected` 
                    : 'Please select at least one contractor'
                  }
                </span>
                {selectedContractors.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Ready to generate reports with selected contractors
                  </p>
                )}
              </div>
              {selectedContractors.length > 0 && (
                <div className="text-right">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-lg font-bold text-blue-600">{selectedContractors.length}</div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="h-4 w-4" />
              Last updated: {new Date().toLocaleDateString()}
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={refetchContractors}
                disabled={contractorsLoading}
                className="px-4 py-2.5 h-11 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
              >
                {contractorsLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                ) : (
                  "Refresh"
                )}
              </Button>
              
              <Button
                onClick={handleSaveAndContinue}
                disabled={selectedContractors.length === 0}
                className="px-8 py-2.5 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Save & Continue
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}