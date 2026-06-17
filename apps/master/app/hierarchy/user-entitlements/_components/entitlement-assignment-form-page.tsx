"use client"

import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/components/ui/card'
import { useQuery, gql } from '@apollo/client'
import { client } from '@repo/ui/hooks/api/dynamic-graphql'
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode'
import { useRouter } from 'next/navigation'
import { FETCH_COMPANY_EMPLOYEE_QUERY } from '@/utils/query/gql'
import { Sidebar } from '@/components/fields/sidebar-local'
import EntitlementAssignmentHeader from './entitlement-assignment-header'
import StepSubsidiaries from './steps/step-subsidiaries'
import StepDivisions from './steps/step-divisions'
import StepDepartments from './steps/step-departments'
import StepLocations from './steps/step-locations'
import StepContractors from './steps/step-contractors'
import StepEmployeeRole from './steps/step-employee-role'

export interface EntitlementFormData {
  _id?: string
  employeeID: string
  roleID: string
  subsidiaries: string[]
  divisions: string[]
  departments: string[]
  locations: string[]
  contractors: string[]
  organizationCode: string
  tenantCode: string
}

// GraphQL queries
const FETCH_SUBSIDIARIES_QUERY = gql`
  query FetchSubsidiaries($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationCode
      subsidiaries {
        subsidiaryName
        subsidiaryCode
        subsidiaryDescription
        locationCode
      }
    }
  }
`

const FETCH_DIVISIONS_QUERY = gql`
  query FetchDivisions($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationCode
      divisions {
        divisionName
        divisionCode
        subsidiaryCode
        divisionDescription
        locationCode
      }
    }
  }
`

const FETCH_DEPARTMENTS_QUERY = gql`
  query FetchDepartments($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationCode
      departments {
        departmentName
        departmentCode
        divisionCode
        subsidiaryCode
        departmentDescription
        locationCode
      }
    }
  }
`

const FETCH_CONTRACTORS_QUERY = gql`
  query FetchContractors($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchContractors(criteriaRequests: $criteriaRequests, collection: $collection) {
      contractorCode
      contractorName
    }
  }
`

const FETCH_LOCATIONS_QUERY = gql`
  query FetchLocations($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationName
      organizationCode
      location {
        locationName
        locationCode
      }
    }
  }
`


interface EntitlementAssignmentFormPageProps {
  initialData?: EntitlementFormData | null
  onSave?: (data: EntitlementFormData) => void
  mode?: "add" | "edit" | "view"
  onBack?: () => void
  onDataChange?: () => void
}


export default function EntitlementAssignmentFormPage({
  initialData,
  onSave,
  mode = "add",
  onBack,
  onDataChange,
}: EntitlementAssignmentFormPageProps) {
  const router = useRouter()
  const tenantCode = useGetTenantCode()
  const [activeId, setActiveId] = useState<string>('employeeRole')
  const [formData, setFormData] = useState<EntitlementFormData>({
    employeeID: '',
    roleID: '',
    subsidiaries: [],
    divisions: [],
    departments: [],
    locations: [],
    contractors: [],
    organizationCode: '',
    tenantCode: tenantCode || ''
  })
  const [assignmentId, setAssignmentId] = useState<string | null>(null)

  // Debug: Log when assignmentId changes
  useEffect(() => {
  }, [assignmentId])

  // Sync assignmentId with formData._id as fallback (in case _id is set but assignmentId isn't)
  useEffect(() => {
    if (formData._id && !assignmentId) {
      const idStr = String(formData._id).trim()
      if (idStr && idStr !== 'null' && idStr !== 'undefined') {
        setAssignmentId(idStr)
      }
    }
  }, [formData._id, assignmentId])


  // Sidebar sections configuration - structured like permission-root.tsx
  const sidebarSections = [
    {
      title: 'User Entitlements',
      items: [
        { id: 'employeeRole', label: 'Employee Role', icon: 'user' },
        { id: 'organization', label: 'Organization', icon: 'grid' },
        { id: 'contractor', label: 'Contractor', icon: 'file-text' },
      ],
    },
  ]

  // Subsidiaries & Contractors become editable once we have a saved assignment (_id from backend)
  // Check both assignmentId and formData._id to ensure we catch all cases
  const canEditChildSteps = !!(assignmentId || formData._id)

  // Organization query variables
  const organizationVariables = {
    criteriaRequests: [
      {
        field: 'tenantCode',
        operator: 'eq',
        value: tenantCode,
      },
    ],
    collection: 'organization',
  }

  const contractorVariables = {
    criteriaRequests: [
      {
        field: 'tenantCode',
        operator: 'eq',
        value: tenantCode,
      },
    ],
    collection: 'contractor',
  }

  const employeeVariables = {
    criteriaRequests: [
      {
        field: 'tenantCode',
        operator: 'eq',
        value: tenantCode,
      },
    ],
    collection: 'company_employee',
  }

  // Fetch data
  const { data: subsidiariesResponse, loading: subsidiariesLoading } = useQuery(FETCH_SUBSIDIARIES_QUERY, {
    client,
    variables: organizationVariables,
    fetchPolicy: 'cache-and-network',
  })

  const { data: divisionsResponse, loading: divisionsLoading } = useQuery(FETCH_DIVISIONS_QUERY, {
    client,
    variables: organizationVariables,
    fetchPolicy: 'cache-and-network',
  })

  const { data: departmentsResponse, loading: departmentsLoading } = useQuery(FETCH_DEPARTMENTS_QUERY, {
    client,
    variables: organizationVariables,
    fetchPolicy: 'cache-and-network',
  })

  const { data: locationsResponse, loading: locationsLoading } = useQuery(FETCH_LOCATIONS_QUERY, {
    client,
    variables: organizationVariables,
    fetchPolicy: 'cache-and-network',
  })

  const { data: contractorsResponse, loading: contractorsLoading } = useQuery(FETCH_CONTRACTORS_QUERY, {
    client,
    variables: contractorVariables,
    fetchPolicy: 'cache-and-network',
  })

  const { data: employeesResponse, loading: employeesLoading } = useQuery(FETCH_COMPANY_EMPLOYEE_QUERY, {
    client,
    variables: employeeVariables,
    fetchPolicy: 'cache-and-network',
  })


  // Process organization data
  const subsidiariesData = useMemo(() => {
    const org = subsidiariesResponse?.fetchOrganization?.[0]
    if (!org?.subsidiaries) return []
    return org.subsidiaries.map((sub: any) => ({
      code: sub.subsidiaryCode,
      name: sub.subsidiaryName,
      description: sub.subsidiaryDescription,
      locationCodes: Array.isArray(sub.locationCode) ? sub.locationCode : (sub.locationCode ? [sub.locationCode] : []),
    }))
  }, [subsidiariesResponse])

  const divisionsData = useMemo(() => {
    const org = divisionsResponse?.fetchOrganization?.[0]
    if (!org?.divisions) return []
    return org.divisions
      .filter((div: any) => formData.subsidiaries.includes(div.subsidiaryCode))
      .map((div: any) => ({
        code: div.divisionCode,
        name: div.divisionName,
        description: div.divisionDescription,
        subsidiaryCode: div.subsidiaryCode,
        locationCodes: Array.isArray(div.locationCode) ? div.locationCode : (div.locationCode ? [div.locationCode] : []),
      }))
  }, [divisionsResponse, formData.subsidiaries])

  const departmentsData = useMemo(() => {
    const org = departmentsResponse?.fetchOrganization?.[0]
    if (!org?.departments) return []
    return org.departments
      .filter((dept: any) => formData.divisions.includes(dept.divisionCode))
      .map((dept: any) => ({
        code: dept.departmentCode,
        name: dept.departmentName,
        description: dept.departmentDescription,
        divisionCode: dept.divisionCode,
        subsidiaryCode: dept.subsidiaryCode,
        locationCodes: Array.isArray(dept.locationCode) ? dept.locationCode : (dept.locationCode ? [dept.locationCode] : []),
      }))
  }, [departmentsResponse, formData.divisions])

  const contractorsData = useMemo(() => {
    if (!contractorsResponse?.fetchContractors) return []
    return contractorsResponse.fetchContractors.map((ctr: any) => ({
      code: ctr.contractorCode,
      name: ctr.contractorName,
    }))
  }, [contractorsResponse])


  const locationsData = useMemo(() => {
    const orgs = locationsResponse?.fetchOrganization
    if (!Array.isArray(orgs) || orgs.length === 0) return []

    const allLocations: any[] = []

    orgs.forEach((org: any) => {
      if (Array.isArray(org.location)) {
        org.location.forEach((loc: any) => {
          allLocations.push({
            code: loc.locationCode,
            name: loc.locationName,
            regionCode: loc.regionCode,
            countryCode: loc.countryCode,
            stateCode: loc.stateCode,
            city: loc.city,
            pincode: loc.pinCode, // GraphQL field is pinCode
            organizationCode: loc.organizationCode || org.organizationCode,
          })
        })
      }
    })

    // Remove entries without a code and de-duplicate by code
    const byCode = new Map<string, any>()
    allLocations.forEach((loc: any) => {
      if (!loc.code) return
      if (!byCode.has(loc.code)) {
        byCode.set(loc.code, loc)
      }
    })

    return Array.from(byCode.values())
  }, [locationsResponse])

  // Helpers to check child relationships for delete guards
  const hasChildrenForSubsidiary = (subCode: string) => {
    const hasDivChild = divisionsData.some(
      (d: any) => d.subsidiaryCode === subCode && formData.divisions.includes(d.code)
    )
    const hasDeptChild = departmentsData.some(
      (dept: any) => dept.subsidiaryCode === subCode && formData.departments.includes(dept.code)
    )
    return hasDivChild || hasDeptChild
  }

  const hasChildrenForDivision = (divCode: string) => {
    return departmentsData.some(
      (dept: any) => dept.divisionCode === divCode && formData.departments.includes(dept.code)
    )
  }

  const employeesData = useMemo(() => {
    if (!employeesResponse?.fetchCompanyEmployee) return []
    return employeesResponse.fetchCompanyEmployee
      .filter((emp: any) => !emp.isDeleted) // Filter out deleted employees
      .map((emp: any) => ({
        employeeID: emp.employeeID,
        name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeID,
        firstName: emp.firstName,
        lastName: emp.lastName,
        emailID: emp.emailID,
      }))
  }, [employeesResponse])


  // After backend POST from StepEmployeeRole, capture _id so that child steps can be edited
  const handleEmployeeRoleSave = (created?: any) => {
    
    if (!created) {
      console.warn("⚠️ No response data received")
      return
    }

    // Helper function to extract _id from any value
    const extractId = (value: any): string | null => {
      if (!value) return null
      
      // If it's already a string and not empty
      if (typeof value === 'string' && value.trim()) {
        const trimmed = value.trim()
        if (trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== '') {
          return trimmed
        }
      }
      
      // If it's an object with $oid property (MongoDB format)
      if (typeof value === 'object' && value.$oid) {
        return String(value.$oid).trim()
      }
      
      // If it's an object with toString method
      if (typeof value === 'object' && typeof value.toString === 'function') {
        const str = value.toString()
        if (str && str !== '[object Object]') {
          return str.trim()
        }
      }
      
      // Try to convert to string
      try {
        const str = String(value).trim()
        if (str && str !== 'null' && str !== 'undefined' && str !== '') {
          return str
        }
      } catch (e) {
        console.warn("⚠️ Error converting _id to string:", e)
      }
      
      return null
    }

    // Response is like [{ _id: "...", ...payload }] or { data: [{ _id: "...", ... }] }
    let list: any[] = []
    if (Array.isArray(created)) {
      list = created
    } else if (created?.data && Array.isArray(created.data)) {
      list = created.data
    } else if (created) {
      list = [created]
    }

    if (list.length === 0) {
      console.warn("⚠️ No documents in response list")
      return
    }

    const doc = list[0]
    
    // Extract _id from response document
    const idStr = extractId(doc?._id)
    
    // Extract employeeID and roleID from response or use current formData
    const responseEmployeeID = doc?.employeeID || formData.employeeID || ''
    const responseRoleID = doc?.roleID || formData.roleID || ''
    
    // Update formData with _id and preserve/update employeeID and roleID
    setFormData(prev => {
      const updated = {
        ...prev,
        employeeID: responseEmployeeID || prev.employeeID || '',
        roleID: responseRoleID || prev.roleID || '',
        // Update _id if we got one from response
        ...(idStr ? { _id: idStr } : {}),
      }
      return updated
    })
    
    // Set assignmentId separately for canEditChildSteps check - this is critical!
    if (idStr) {
      setAssignmentId(idStr)
    } else {
      // Fallback: check if _id is in formData
      if (formData._id) {
        setAssignmentId(String(formData._id))
      }
    }

    // Trigger table refresh after saving employee role
    onDataChange?.()
  }

  // Initialize form data
  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      if (initialData._id) {
        setAssignmentId(String(initialData._id))
      }
      setActiveId('employeeRole')
    }
  }, [initialData])

  // Check step completion
  const isStepCompleted = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return !!(formData.employeeID && formData.roleID)
      case 2:
        return formData.subsidiaries.length > 0
      case 3:
        return formData.divisions.length > 0
      case 4:
        return formData.departments.length > 0
      case 5:
        return formData.locations.length > 0
      case 6:
        return formData.contractors.length > 0
      default:
        return false
    }
  }


  const handleAddSubsidiary = (code: string) => {
    setFormData(prev => {
      if (!prev.subsidiaries.includes(code)) {
        return { ...prev, subsidiaries: [...prev.subsidiaries, code] }
      }
      return prev
    })
  }

  const handleRemoveSubsidiary = (code: string) => {
    setFormData(prev => ({
      ...prev,
      subsidiaries: prev.subsidiaries.filter((c: string) => c !== code),
      // Keep divisions, departments and locations unchanged; user manages locations explicitly
    }))
  }

  const handleAddDivision = (code: string) => {
    setFormData(prev => {
      if (!prev.divisions.includes(code)) {
        return { ...prev, divisions: [...prev.divisions, code] }
      }
      return prev
    })
  }

  const handleRemoveDivision = (code: string) => {
    setFormData(prev => ({
      ...prev,
      divisions: prev.divisions.filter((c: string) => c !== code),
      // Keep departments and locations unchanged; user manages locations manually
    }))
  }

  const handleAddDepartment = (code: string) => {
    setFormData(prev => {
      if (!prev.departments.includes(code)) {
        return { ...prev, departments: [...prev.departments, code] }
      }
      return prev
    })
  }

  const handleRemoveDepartment = (code: string) => {
    setFormData(prev => ({
      ...prev,
      departments: prev.departments.filter((c: string) => c !== code),
    }))
  }

  const handleAddLocation = (code: string) => {
    setFormData(prev => {
      if (!prev.locations.includes(code)) {
        return { ...prev, locations: [...prev.locations, code] }
      }
      return prev
    })
  }

  const handleRemoveLocation = (code: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((c: string) => c !== code)
    }))
  }

  const handleAddContractor = (code: string) => {
    setFormData(prev => {
      if (!prev.contractors.includes(code)) {
        return { ...prev, contractors: [...prev.contractors, code] }
      }
      return prev
    })
  }

  const handleRemoveContractor = (code: string) => {
    setFormData(prev => ({
      ...prev,
      contractors: prev.contractors.filter((c: string) => c !== code)
    }))
  }


  // Handle sidebar item click
  const handleSidebarClick = (id: string) => {
    setActiveId(id)
  }

  // Render content based on active sidebar item
  const renderContent = () => {
    switch (activeId) {
      case 'employeeRole':
        return (
          <StepEmployeeRole
            employeeID={formData.employeeID}
            roleID={formData.roleID}
            employeesData={employeesData}
            employeesLoading={employeesLoading}
            onEmployeeChange={(employeeID: string) => setFormData(prev => ({ ...prev, employeeID }))}
            onRoleChange={(roleID: string) => setFormData(prev => ({ ...prev, roleID }))}
            onSave={handleEmployeeRoleSave}
            mode={mode}
            contextData={{
              _id: assignmentId || formData._id || undefined,
              ...formData,
            }}
          />
        )
      case 'organization':
        return (
          <div className="space-y-8">
            {/* Subsidiaries Section */}
            <div id="subsidiaries-section" className="scroll-mt-6">
              {/* <h2 className="text-xl font-semibold text-slate-900 mb-4">Subsidiaries</h2> */}
              <StepSubsidiaries
                subsidiaries={formData.subsidiaries}
                subsidiariesData={subsidiariesData}
                subsidiariesLoading={subsidiariesLoading}
                onAdd={handleAddSubsidiary}
                onRemove={handleRemoveSubsidiary}
                hasChildren={hasChildrenForSubsidiary}
                mode={canEditChildSteps ? mode : "view"}
                contextData={{
                  _id: assignmentId || formData._id || undefined,
                  ...formData,
                }}
                onSave={() => {
                  onDataChange?.()
                }}
              />
            </div>

            {/* Divisions Section */}
            <div id="divisions-section" className="scroll-mt-6">
              {/* <h2 className="text-xl font-semibold text-slate-900 mb-4">Divisions</h2> */}
              <StepDivisions
                divisions={formData.divisions}
                divisionsData={divisionsData}
                divisionsLoading={divisionsLoading}
                subsidiaries={formData.subsidiaries}
                onAdd={handleAddDivision}
                onRemove={handleRemoveDivision}
                hasChildren={hasChildrenForDivision}
                mode={mode}
                contextData={{
                  _id: assignmentId || formData._id || undefined,
                  ...formData,
                }}
                onSave={() => {
                  onDataChange?.()
                }}
              />
            </div>

            {/* Departments Section */}
            <div id="departments-section" className="scroll-mt-6">
              {/* <h2 className="text-xl font-semibold text-slate-900 mb-4">Departments</h2> */}
              <StepDepartments
                departments={formData.departments}
                departmentsData={departmentsData}
                departmentsLoading={departmentsLoading}
                divisions={formData.divisions}
                onAdd={handleAddDepartment}
                onRemove={handleRemoveDepartment}
                mode={mode}
                contextData={{
                  _id: assignmentId || formData._id || undefined,
                  ...formData,
                }}
                onSave={() => {
                  onDataChange?.()
                }}
              />
            </div>

            {/* Locations Section */}
            <div id="locations-section" className="scroll-mt-6">
              {/* <h2 className="text-xl font-semibold text-slate-900 mb-4">Locations</h2> */}
              <StepLocations
                locations={formData.locations}
                locationsData={locationsData}
                locationsLoading={locationsLoading}
                onAdd={handleAddLocation}
                onRemove={handleRemoveLocation}
                mode={mode}
                contextData={{
                  _id: assignmentId || formData._id || undefined,
                  ...formData,
                }}
                onSave={() => {
                  onDataChange?.()
                }}
              />
            </div>
          </div>
        )
      case 'contractor':
        return (
          <StepContractors
            contractors={formData.contractors}
            contractorsData={contractorsData}
            contractorsLoading={contractorsLoading}
            onAdd={handleAddContractor}
            onRemove={handleRemoveContractor}
            mode={canEditChildSteps ? mode : "view"}
            contextData={{
              _id: assignmentId || formData._id || undefined,
              ...formData,
            }}
            onSave={() => {
              onDataChange?.()
            }}
          />
        )
      default:
        return null
    }
  }

  // Ensure onBack always navigates to list view
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      // Fallback: navigate back if onBack is not provided
      router.back()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden relative">
      {/* Header */}
      <EntitlementAssignmentHeader 
        mode={mode} 
        onBack={handleBack} 
        employeeID={formData.employeeID || undefined}
      />

      {/* Main Content Area */}
      <div className="flex justify-center flex-1 overflow-hidden">
        <div className="w-full max-w-7xl h-full flex flex-col">
          <div className="flex w-full h-full overflow-hidden">
            {/* Left - Sidebar */}
            <div className="flex-shrink-0 h-full">
              <Sidebar
                sections={sidebarSections}
                activeId={activeId}
                onItemClick={handleSidebarClick}
              />
            </div>

            {/* Right - Form Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 pt-6 min-w-0">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>    
    </div>
  )
}
