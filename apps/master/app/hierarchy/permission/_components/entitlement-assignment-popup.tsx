"use client"

import React, { useState, useEffect } from 'react'
import { X, User, Building, Layers, Shield, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Label } from '@repo/ui/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select'
import { Badge } from '@repo/ui/components/ui/badge'
import { EntitlementAssignment, entitlementAssignmentSchema } from '@/validation/entitlement-assignments'
import SingleSelectField from '@/components/fields/single-select-field'
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { useQuery, gql } from '@apollo/client'
import { client } from '@repo/ui/hooks/api/dynamic-graphql'
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

interface EntitlementAssignmentPopupProps {
  isOpen: boolean
  onClose: () => void
  onSave: (assignment: EntitlementAssignment) => void
  initialData?: EntitlementAssignment | null
}

// GraphQL query for fetching company employees
const FETCH_COMPANY_EMPLOYEES_QUERY = gql`
  query FetchCompanyEmployees($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchCompanyEmployee(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      employeeID
      firstName
      lastName
      middleName
      emailID
      isDeleted
      createdOn
      createdBy
    }
  }
`

const levelOptions = [
  { value: 1, label: 'Level 1' },
  { value: 2, label: 'Level 2' },
  { value: 3, label: 'Level 3' },
  { value: 4, label: 'Level 4' }
]

// Employee options will be populated from GraphQL query

const entitlementOptions = [
  { value: 'ECT-CHT-TO', label: 'ECT-CHT-TO - Chief Technology Officer' },
  { value: 'ECT-MGR-AD', label: 'ECT-MGR-AD - Manager Administration' },
  { value: 'ECT-SUP-OP', label: 'ECT-SUP-OP - Supervisor Operations' },
  { value: 'ECT-EMP-BA', label: 'ECT-EMP-BA - Employee Basic Access' },
]

export default function EntitlementAssignmentPopup({
  isOpen,
  onClose,
  onSave,
  initialData
}: EntitlementAssignmentPopupProps) {
  const [formData, setFormData] = useState<Partial<EntitlementAssignment>>({
    level: 2,
    companyEmployeeID: '',
    hierarchy: {
      subsidiary: [],
      divisions: []
    },
    entitlementCode: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [employeeOptions, setEmployeeOptions] = useState<Array<{value: string, label: string}>>([])

  // Organization data for hierarchical dropdowns
  const tenantCode = useGetTenantCode()
  const [subOrganization, setSubOrganization] = useState<any>({
    subsidiaries: [],
    divisions: [],
    departments: [],
    subDepartments: [],
  })

  const { refetch: refetchOrg } = useRequest<any[]>({
    url: `map/organization/search?tenantCode=${tenantCode}`,
    onSuccess: (data) => {
      const org = Array.isArray(data) ? data[0] : data
      setSubOrganization({
        subsidiaries: org?.subsidiaries || [],
        divisions: org?.divisions || [],
        departments: org?.departments || [],
        subDepartments: org?.subDepartments || [],
      })
    },
  })

  // GraphQL query for fetching company employees
  const {
    data: employeesData,
    loading: employeesLoading,
    error: employeesError,
    refetch: refetchEmployees
  } = useQuery(FETCH_COMPANY_EMPLOYEES_QUERY, {
    client,
    variables: {
      criteriaRequests: [
        { field: 'tenantCode', operator: 'eq', value: tenantCode }
      ],
      collection: 'company_employee'
    },
    errorPolicy: 'all',
    onCompleted: (data) => {
      if (data?.fetchCompanyEmployee) {
        
        // Filter out deleted employees and format for dropdown
        const filteredEmployees = data.fetchCompanyEmployee
          .filter((employee: any) => 
            employee.isDeleted !== true &&
            employee.employeeID && 
            employee.employeeID.trim() !== ""
          )
          .map((employee: any) => ({
            value: employee.employeeID || "",
            label: `${employee.firstName || ""} ${employee.lastName || ""}`.trim() 
              ? `${employee.firstName || ""} ${employee.lastName || ""}`.trim() + ` (${employee.employeeID})`
              : `Employee ${employee.employeeID}`
          }))
        
        setEmployeeOptions(filteredEmployees)
      } else {
        setEmployeeOptions([])
      }
    },
    onError: (error) => {
      console.error('❌ GraphQL Error loading company employee data:', error)
      console.error('Error details:', error.message, error.graphQLErrors)
      setEmployeeOptions([])
    }
  })

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      // Populate multi-select states from initialData
      setSelectedSubsidiaries(initialData.hierarchy?.subsidiary || [])
      setSelectedDivisions(initialData.hierarchy?.divisions || [])
    } else {
      setFormData({
        level: 2,
        companyEmployeeID: '',
        hierarchy: {
          subsidiary: [],
          divisions: []
        },
        entitlementCode: ''
      })
      setSelectedSubsidiaries([])
      setSelectedDivisions([])
      setSelectedDepartments([])
      setSelectedSubDepartments([])
    }
    setErrors({})
  }, [initialData, isOpen])

  // Separate useEffect for data fetching to avoid infinite loops
  useEffect(() => {
    if (isOpen) {
      refetchOrg()
      refetchEmployees()
    }
  }, [isOpen]) // Only depend on isOpen to avoid infinite loops

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleLevelChange = (value: string) => {
    const newLevel = parseInt(value)
    
    // Clear hierarchy selections when level changes to enforce new restrictions
    setSelectedSubsidiaries([])
    setSelectedDivisions([])
    setSelectedDepartments([])
    setSelectedSubDepartments([])
    
    // Update form data with level and clear hierarchy in one call
    setFormData(prev => ({
      ...prev,
      level: newLevel,
      hierarchy: {
        subsidiary: [],
        divisions: []
      }
    }))
    
    if (errors.level) setErrors(prev => ({ ...prev, level: '' }))
  }

  const handleEmployeeChange = (value: string) => {
    setFormData(prev => ({ ...prev, companyEmployeeID: value }))
    if (errors.companyEmployeeID) setErrors(prev => ({ ...prev, companyEmployeeID: '' }))
  }

  const handleEntitlementChange = (value: string) => {
    setFormData(prev => ({ ...prev, entitlementCode: value }))
    if (errors.entitlementCode) setErrors(prev => ({ ...prev, entitlementCode: '' }))
  }

  // Hierarchical selections (organization to subDepartment) - Multi-select
  const [selectedOrganization, setSelectedOrganization] = useState<string>(tenantCode)
  const [selectedSubsidiaries, setSelectedSubsidiaries] = useState<string[]>([])
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>([])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedSubDepartments, setSelectedSubDepartments] = useState<string[]>([])

  // Filters based on parent selection - Multi-select
  const filteredDivisions = React.useMemo(() => {
    if (selectedSubsidiaries.length === 0) return []
    return (subOrganization.divisions || []).filter((d: any) => 
      selectedSubsidiaries.includes(d.subsidiaryCode || d.parentSubsidiaryCode)
    )
  }, [selectedSubsidiaries, subOrganization.divisions])

  const filteredDepartments = React.useMemo(() => {
    if (selectedDivisions.length === 0) return []
    return (subOrganization.departments || []).filter((d: any) => 
      selectedDivisions.includes(d.divisionCode || d.parentDivisionCode)
    )
  }, [selectedDivisions, subOrganization.departments])

  const filteredSubDepartments = React.useMemo(() => {
    if (selectedDepartments.length === 0) return []
    return (subOrganization.subDepartments || []).filter((sd: any) => 
      selectedDepartments.includes(sd.departmentCode || sd.parentDepartmentCode)
    )
  }, [selectedDepartments, subOrganization.subDepartments])

  // Multi-select handlers with level-based restrictions
  const handleSubsidiarySelect = (code: string) => {
    // Level 1-4: Allow only 1 subsidiary
    if (selectedSubsidiaries.length >= 1) {
      return // Don't allow more than 1 subsidiary
    }
    
    if (!selectedSubsidiaries.includes(code)) {
      const newSubsidiaries = [...selectedSubsidiaries, code]
      setSelectedSubsidiaries(newSubsidiaries)
      setFormData(prev => ({
        ...prev,
        hierarchy: {
          subsidiary: newSubsidiaries,
          divisions: prev.hierarchy?.divisions ?? []
        }
      }))
      // Clear child selections when parent changes
      setSelectedDivisions([])
      setSelectedDepartments([])
      setSelectedSubDepartments([])
    }
  }

  const handleSubsidiaryRemove = (code: string) => {
    const newSubsidiaries = selectedSubsidiaries.filter(c => c !== code)
    setSelectedSubsidiaries(newSubsidiaries)
    setFormData(prev => ({
      ...prev,
      hierarchy: {
        subsidiary: newSubsidiaries,
        divisions: prev.hierarchy?.divisions ?? []
      }
    }))
    // Clear child selections when parent changes
    setSelectedDivisions([])
    setSelectedDepartments([])
    setSelectedSubDepartments([])
  }

  const handleDivisionSelect = (code: string) => {
    // Level 3-4: Allow only 1 division
    if (formData.level && formData.level >= 3) {
      if (selectedDivisions.length >= 1) {
        return // Don't allow more than 1 division
      }
    }
    
    if (!selectedDivisions.includes(code)) {
      const newDivisions = [...selectedDivisions, code]
      setSelectedDivisions(newDivisions)
      setFormData(prev => ({
        ...prev,
        hierarchy: {
          subsidiary: prev.hierarchy?.subsidiary ?? [],
          divisions: newDivisions
        }
      }))
      // Clear child selections when parent changes
      setSelectedDepartments([])
      setSelectedSubDepartments([])
    }
  }

  const handleDivisionRemove = (code: string) => {
    const newDivisions = selectedDivisions.filter(c => c !== code)
    setSelectedDivisions(newDivisions)
    setFormData(prev => ({
      ...prev,
      hierarchy: {
        subsidiary: prev.hierarchy?.subsidiary ?? [],
        divisions: newDivisions
      }
    }))
    // Clear child selections when parent changes
    setSelectedDepartments([])
    setSelectedSubDepartments([])
  }

  const handleDepartmentSelect = (code: string) => {
    // Level 4: Allow only 1 department
    if (formData.level && formData.level >= 4) {
      if (selectedDepartments.length >= 1) {
        return // Don't allow more than 1 department
      }
    }
    
    if (!selectedDepartments.includes(code)) {
      const newDepartments = [...selectedDepartments, code]
      setSelectedDepartments(newDepartments)
      setSelectedSubDepartments([])
    }
  }

  const handleDepartmentRemove = (code: string) => {
    const newDepartments = selectedDepartments.filter(c => c !== code)
    setSelectedDepartments(newDepartments)
    setSelectedSubDepartments([])
  }

  const handleSubDepartmentSelect = (code: string) => {
    // All levels: Allow multiple sub departments
    if (!selectedSubDepartments.includes(code)) {
      const newSubDepartments = [...selectedSubDepartments, code]
      setSelectedSubDepartments(newSubDepartments)
    }
  }

  const handleSubDepartmentRemove = (code: string) => {
    const newSubDepartments = selectedSubDepartments.filter(c => c !== code)
    setSelectedSubDepartments(newSubDepartments)
  }

  // Helper function to get level restrictions description
  const getLevelRestrictions = () => {
    if (!formData.level) return ""
    
    switch (formData.level) {
      case 1:
        return "Level 1: Select multiple for all hierarchy fields"
      case 2:
        return "Level 2: Select only 1 Subsidiary, multiple for others"
      case 3:
        return "Level 3: Select only 1 Subsidiary and 1 Division, multiple for others"
      case 4:
        return "Level 4: Select only 1 Subsidiary, 1 Division, and 1 Department, multiple for Sub Department"
      default:
        return ""
    }
  }

  const validateForm = () => {
    try {
      entitlementAssignmentSchema.parse(formData)
      return true
    } catch (error: any) {
      const newErrors: Record<string, string> = {}
      error.errors?.forEach((err: any) => {
        const path = err.path.join('.')
        newErrors[path] = err.message
      })
      setErrors(newErrors)
      return false
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    // Log form data before validation
    
    if (!validateForm()) {
      setIsSubmitting(false)
      return
    }

    
    try {
      await onSave(formData as EntitlementAssignment)
      onClose()
    } catch (error) {
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[150] p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-white grid place-items-center shadow">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <span className="absolute -top-1 -left-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-blue-600" />
              </div>
              <div className="leading-snug">
                <h2 className="text-white text-xl font-semibold">
                  {initialData ? 'Edit Assignment' : 'Add New Assignment'}
                </h2>
                <p className="text-blue-100 text-sm">Configure entitlement assignment details</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-amber-300 hover:text-white rounded-full p-1.5 transition-colors"
              aria-label="Close popup"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Vertical Progress Bar */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gray-200">
          <div 
            className="bg-blue-600 transition-all duration-500 ease-out"
            style={{ 
              height: formData.level && formData.companyEmployeeID ? '100%' : '50%'
            }}
          />
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 pl-8">
          {/* Level Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Level <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.level?.toString()} onValueChange={handleLevelChange}>
              <SelectTrigger className={`h-10 rounded-md border ${errors.level ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} focus:ring-2 focus:ring-blue-500/20 transition-all duration-200`}>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                {levelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.level && (
              <div className="flex items-center gap-1 text-red-500 text-xs">
                <AlertCircle className="h-3 w-3" />
                {errors.level}
              </div>
            )}
          </div>

          {/* Employee Selection */}
          <div className="space-y-2">
            <SingleSelectField
              id="companyEmployeeID"
              label="Company Employee ID"
              required
              placeholder={employeesLoading ? "Loading employees..." : !!employeesError ? "Error loading employees" : employeeOptions.length === 0 ? "No employees found" : "Search Employees"}
              disabled={employeesLoading || !!employeesError || employeeOptions.length === 0}
              value={formData.companyEmployeeID || ""}
              onChange={handleEmployeeChange}
              options={employeeOptions}
              showOnlyValueInTrigger
              className="group"
            />
            {employeesLoading && (
              <div className="flex items-center gap-1 text-blue-500 text-xs">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500"></div>
                Loading employees...
              </div>
            )}
            {!!employeesError && (
              <div className="flex items-center gap-1 text-red-500 text-xs">
                <AlertCircle className="h-3 w-3" />
                Failed to load employees. Please try again.
              </div>
            )}
            {errors.companyEmployeeID && (
              <div className="flex items-center gap-1 text-red-500 text-xs">
                <AlertCircle className="h-3 w-3" />
                {errors.companyEmployeeID}
              </div>
            )}
          </div>

          {/* Conditional Fields - Only show after Level and Employee ID are selected */}
          {!formData.level || !formData.companyEmployeeID ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <Building className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Complete Basic Information</h3>
              <p className="text-gray-600">
                Please select both Level and Company Employee ID to configure hierarchy and entitlement settings.
              </p>
            </div>
          ) : (
            <div className="space-y-6 transform transition-all duration-500 ease-out animate-in slide-in-from-bottom-4">
              {/* Hierarchy Configuration */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Hierarchy Configuration
                  </h4>
                  {formData.level && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800 font-medium">
                        {getLevelRestrictions()}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Subsidiaries (Multi-select) */}
                <div className="space-y-2">
                  <SingleSelectField
                    id="subsidiaryCode"
                    label="Subsidiaries"
                    required
                    placeholder="Search Subsidiaries"
                    value=""
                    onChange={handleSubsidiarySelect}
                    options={(subOrganization.subsidiaries || [])
                      .filter((o: any) => !selectedSubsidiaries.includes(o.subsidiaryCode || ''))
                      .map((o: any) => ({
                        value: o.subsidiaryCode || '',
                        label: `${o.subsidiaryCode} - ${o.subsidiaryName}` || ''
                      }))}
                    showOnlyValueInTrigger
                    className="group"
                  />
                  
                  {selectedSubsidiaries.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Selected Subsidiaries:</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedSubsidiaries.map((code) => {
                          const subsidiary = subOrganization.subsidiaries?.find((s: any) => s.subsidiaryCode === code)
                          return (
                            <Badge
                              key={code}
                              variant="secondary"
                              className="flex items-center gap-1 px-3 py-1"
                            >
                              <Building className="w-3 h-3" />
                              {subsidiary ? `${subsidiary.subsidiaryName} (${code})` : code}
                              <button
                                type="button"
                                onClick={() => handleSubsidiaryRemove(code)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Divisions (Multi-select) */}
                <div className="space-y-2">
                  <SingleSelectField
                    key={`division-${selectedSubsidiaries.join('-') || 'none'}`}
                    id="divisionCode"
                    label="Divisions"
                    required
                    placeholder={selectedSubsidiaries.length === 0 ? 'Select Subsidiaries first' : 'Search Divisions'}
                    disabled={selectedSubsidiaries.length === 0}
                    value=""
                    onChange={handleDivisionSelect}
                    options={filteredDivisions
                      .filter((o: any) => !selectedDivisions.includes(o.divisionCode || ''))
                      .map((o: any) => ({
                        value: o.divisionCode || '',
                        label: `${o.divisionCode} - ${o.divisionName}` || ''
                      }))}
                    showOnlyValueInTrigger
                    className="group"
                  />
                  
                  {selectedDivisions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Selected Divisions:</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedDivisions.map((code) => {
                          const division = filteredDivisions.find((d: any) => d.divisionCode === code)
                          return (
                            <Badge
                              key={code}
                              variant="secondary"
                              className="flex items-center gap-1 px-3 py-1"
                            >
                              <Building className="w-3 h-3" />
                              {division ? `${division.divisionName} (${code})` : code}
                              <button
                                type="button"
                                onClick={() => handleDivisionRemove(code)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Departments (Multi-select) */}
                <div className="space-y-2">
                  <SingleSelectField
                    key={`department-${selectedDivisions.join('-') || 'none'}`}
                    id="departmentCode"
                    label="Departments"
                    required
                    placeholder={selectedDivisions.length === 0 ? 'Select Divisions first' : 'Search Departments'}
                    disabled={selectedDivisions.length === 0}
                    value=""
                    onChange={handleDepartmentSelect}
                    options={filteredDepartments
                      .filter((o: any) => !selectedDepartments.includes(o.departmentCode || ''))
                      .map((o: any) => ({
                        value: o.departmentCode || '',
                        label: `${o.departmentCode} - ${o.departmentName}` || ''
                      }))}
                    showOnlyValueInTrigger
                    className="group"
                  />
                  
                  {selectedDepartments.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Selected Departments:</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedDepartments.map((code) => {
                          const department = filteredDepartments.find((d: any) => d.departmentCode === code)
                          return (
                            <Badge
                              key={code}
                              variant="secondary"
                              className="flex items-center gap-1 px-3 py-1"
                            >
                              <Building className="w-3 h-3" />
                              {department ? `${department.departmentName} (${code})` : code}
                              <button
                                type="button"
                                onClick={() => handleDepartmentRemove(code)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sub Departments (Multi-select) */}
                <div className="space-y-2">
                  <SingleSelectField
                    key={`subDepartment-${selectedDepartments.join('-') || 'none'}`}
                    id="subDepartmentCode"
                    label="Sub Departments"
                    required
                    placeholder={selectedDepartments.length === 0 ? 'Select Departments first' : 'Search Sub Departments'}
                    disabled={selectedDepartments.length === 0}
                    value=""
                    onChange={handleSubDepartmentSelect}
                    options={filteredSubDepartments
                      .filter((o: any) => !selectedSubDepartments.includes(o.subDepartmentCode || ''))
                      .map((o: any) => ({
                        value: o.subDepartmentCode || '',
                        label: `${o.subDepartmentCode} - ${o.subDepartmentName}` || ''
                      }))}
                    showOnlyValueInTrigger
                    className="group"
                  />
                  
                  {selectedSubDepartments.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Selected Sub Departments:</Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedSubDepartments.map((code) => {
                          const subDepartment = filteredSubDepartments.find((sd: any) => sd.subDepartmentCode === code)
                          return (
                            <Badge
                              key={code}
                              variant="secondary"
                              className="flex items-center gap-1 px-3 py-1"
                            >
                              <Building className="w-3 h-3" />
                              {subDepartment ? `${subDepartment.subDepartmentName} (${code})` : code}
                              <button
                                type="button"
                                onClick={() => handleSubDepartmentRemove(code)}
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Entitlement Code Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Entitlement Code <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.entitlementCode} onValueChange={handleEntitlementChange}>
                  <SelectTrigger className={`h-10 rounded-md border ${errors.entitlementCode ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} focus:ring-2 focus:ring-blue-500/20 transition-all duration-200`}>
                    <SelectValue placeholder="Select entitlement code" />
                  </SelectTrigger>
                  <SelectContent>
                    {entitlementOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.entitlementCode && (
                  <div className="flex items-center gap-1 text-red-500 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    {errors.entitlementCode}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            {isSubmitting ? 'Saving...' : ''}
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={onClose} 
              variant="outline" 
              className="px-4 py-2 h-9 rounded-md border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 h-9 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {initialData ? 'Update Assignment' : 'Create Assignment'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
