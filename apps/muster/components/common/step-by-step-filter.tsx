"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useQuery, gql } from '@apollo/client'
import { client } from '@repo/ui/hooks/api/dynamic-graphql'
import { Check, X, Search, ChevronsUpDown, FileText, Calendar, DollarSign, List, Users, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@repo/ui/components/ui/checkbox'
import { Switch } from '@repo/ui/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@repo/ui/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@repo/ui/components/ui/command'
import ActionButtons from '@/components/common/action-buttons'
import { useGetTenantCode } from '@/hooks/useGetTenantCode'
import { useToast } from '@repo/ui/hooks/use-toast'
import { useSelector } from 'react-redux'
import { RootState } from '@inops/store/src/store'
import EmployeeSearchField, { type Employee } from '@/components/fields/employee-search'

interface StepByStepFilterProps {
  isOpen: boolean
  onClose: () => void
  organizationId?: string
  onFilterChange?: (filters: FilterSelections) => void
  onApply?: (filters: FilterSelections) => void
  initialSelections?: FilterSelections
}

export interface FilterSelections {
  subsidiaries: string[]
  divisions: string[]
  departments: string[]
  locations: string[]
  contractors: string[]
  workOrderNumbers: string[]
  employeeID: string
}

// Organization Structure Steps
const ORGANIZATION_STEPS = [
  { key: 'subsidiaries', label: 'Subsidiaries', parentKey: null },
  { key: 'divisions', label: 'Divisions', parentKey: 'subsidiaries' as const },
  { key: 'departments', label: 'Departments', parentKey: 'divisions' as const },
  { key: 'locations', label: 'Locations', parentKey: null },
] as const

// Contractor Structure Steps
const CONTRACTOR_STEPS = [
  { key: 'contractors', label: 'Contractors', parentKey: null },
  { key: 'workOrderNumbers', label: 'Work Order Numbers', parentKey: 'contractors' as const },
] as const

// All steps combined for iteration
const ALL_STEPS = [...ORGANIZATION_STEPS, ...CONTRACTOR_STEPS] as const

// Select All Checkbox Component
const SelectAllCheckbox = ({ 
  stepKey, 
  checked, 
  indeterminate, 
  onChange, 
  itemCount 
}: { 
  stepKey: string
  checked: boolean
  indeterminate: boolean
  onChange: (checked: boolean) => void
  itemCount: number
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate
    }
  }, [indeterminate])

  return (
    <label className="flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors hover:bg-gray-50 border border-transparent">
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
      />
      <span className="text-sm font-medium text-gray-700">Select All</span>
      <span className="text-xs text-gray-500 ml-auto">
        ({itemCount} {itemCount === 1 ? 'item' : 'items'})
      </span>
    </label>
  )
}

// Dummy employee data
const DUMMY_EMPLOYEES = [
  { employeeID: "EMP001", name: "John Doe", subsidiaries: ["M01", "M02"], divisions: ["M01", "DIV01"], departments: ["DEPT01", "DEPT02"] },
  { employeeID: "EMP002", name: "Jane Smith", subsidiaries: ["M03", "M04"], divisions: ["DIV03", "DIV04"], departments: ["DEPT05", "DEPT06"] },
  { employeeID: "EMP003", name: "Bob Johnson", subsidiaries: ["M01", "M05"], divisions: ["M01", "DIV05"], departments: ["DEPT01", "DEPT08"] },
  { employeeID: "EMP025", name: "Alice Williams", subsidiaries: ["M01"], divisions: ["M01"], departments: ["DEPT01"] },
]



// Function to get organization data filtered by employee ID
    const getOrganizationDataByEmployee = (employeeID: string | null, baseData: FilterSelections) => {
  if (!employeeID) {
    return baseData
  }

  const employee = DUMMY_EMPLOYEES.find(emp => emp.employeeID === employeeID)
  if (!employee) {
    return baseData
  }

  // Filter data based on employee's access
  return {
    ...baseData,
    subsidiaries: baseData.subsidiaries.filter((sub: any) => 
      employee.subsidiaries.includes(sub.subsidiaryCode)
    ),
    divisions: baseData.divisions.filter((div: any) => 
      employee.divisions.includes(div.divisionCode)
    ),
    departments: baseData.departments.filter((dept: any) => 
      employee.departments.includes(dept.departmentCode)
    ),
  }
}

// GraphQL queries to fetch organization hierarchy per level
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

const FETCH_LOCATIONS_QUERY = gql`
  query FetchLocations($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationName
      organizationCode
      location {
        locationName
        locationCode
        regionCode
        countryCode
        stateCode
        city
        pinCode
        organizationCode
      }
    }
  }
`

// GraphQL queries to fetch contractor hierarchy
const FETCH_CONTRACTORS_QUERY = gql`
  query FetchContractors($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchContractors(criteriaRequests: $criteriaRequests, collection: $collection) {
      contractorCode
      contractorName
    }
  }
`

const FETCH_WORK_ORDERS_QUERY = gql`
  query FetchContractorWorkOrders($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchContractors(criteriaRequests: $criteriaRequests, collection: $collection) {
      contractorCode
      workOrders {
        workOrderNumber
        contractPeriodFrom
        contractPeriodTo
      }
    }
  }
`

export default function StepByStepFilter({ 
  isOpen,
  onClose,
  organizationId = 'default', 
  onFilterChange,
  onApply,
  initialSelections 
}: StepByStepFilterProps) {
  const hierarchyData = useSelector((state: RootState) => (state as any).hierarchy?.data)
 
  // Base organization data that can be overridden by API
  const [organizationBase, setOrganizationBase] = useState<FilterSelections>({
    subsidiaries: [],
    divisions: [],
    departments: [],
    locations: [],
    contractors: [],
    workOrderNumbers: [],
    employeeID: '',
  })
  const tenantCode = useGetTenantCode()
  const { toast } = useToast()

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

  // Contractor query variables
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

  // Fetch each hierarchy level via its own query
  const {
    data: subsidiariesResponse,
    loading: subsidiariesLoading,
  } = useQuery(FETCH_SUBSIDIARIES_QUERY, {
    client,
    variables: organizationVariables,
    skip: !isOpen,
    fetchPolicy: 'cache-and-network',
  })

  const {
    data: divisionsResponse,
    loading: divisionsLoading,
  } = useQuery(FETCH_DIVISIONS_QUERY, {
    client,
    variables: organizationVariables,
    skip: !isOpen,
    fetchPolicy: 'cache-and-network',
  })

  const {
    data: departmentsResponse,
    loading: departmentsLoading,
  } = useQuery(FETCH_DEPARTMENTS_QUERY, {
    client,
    variables: organizationVariables,
    skip: !isOpen,
    fetchPolicy: 'cache-and-network',
  })

  const {
    data: locationsResponse,
    loading: locationsLoading,
  } = useQuery(FETCH_LOCATIONS_QUERY, {
    client,
    variables: organizationVariables,
    skip: !isOpen,
    fetchPolicy: 'cache-and-network',
  })

  // Fetch contractors and their work orders
  const {
    data: contractorsResponse,
    loading: contractorsLoading,
  } = useQuery(FETCH_CONTRACTORS_QUERY, {
    client,
    variables: contractorVariables,
    skip: !isOpen,
    fetchPolicy: 'cache-and-network',
  })

  const {
    data: workOrdersResponse,
    loading: workOrdersLoading,
  } = useQuery(FETCH_WORK_ORDERS_QUERY, {
    client,
    variables: contractorVariables,
    skip: !isOpen,
    fetchPolicy: 'cache-and-network',
  })

  // Base contractor data that can be overridden by API
  const [contractorBase, setContractorBase] = useState<{
    contractors: any[]
    workOrderNumbers: any[]
  }>({
    contractors: [],
    workOrderNumbers: [],
  })

  // Extract allowed codes from hierarchyData
  const allowedCodes = useMemo(() => {
    if (!hierarchyData || !Array.isArray(hierarchyData) || hierarchyData.length === 0) {
      return null
    }
    
    const allowed = {
      subsidiaries: new Set<string>(),
      divisions: new Set<string>(),
      departments: new Set<string>(),
      locations: new Set<string>(),
      contractors: new Set<string>(),
    }

    hierarchyData.forEach((item: any) => {
      if (Array.isArray(item.subsidiaries)) item.subsidiaries.forEach((c: any) => allowed.subsidiaries.add(String(c)))
      if (Array.isArray(item.divisions)) item.divisions.forEach((c: any) => allowed.divisions.add(String(c)))
      if (Array.isArray(item.departments)) item.departments.forEach((c: any) => allowed.departments.add(String(c)))
      if (Array.isArray(item.locations)) item.locations.forEach((c: any) => allowed.locations.add(String(c)))
      if (Array.isArray(item.contractors)) item.contractors.forEach((c: any) => allowed.contractors.add(String(c)))
    })

    return allowed
  }, [hierarchyData])

  // When organization data arrives, merge each level into our base structure
  useEffect(() => {
    const updates: Partial<FilterSelections> = {}

    const subsOrg = subsidiariesResponse?.fetchOrganization?.[0]
    if (subsOrg?.subsidiaries && Array.isArray(subsOrg.subsidiaries)) {
      let apiSubsidiaries = subsOrg.subsidiaries.map((sub: any) => ({
          label: sub.subsidiaryName,
          value: sub.subsidiaryCode,
          name: sub.subsidiaryName,
          code: sub.subsidiaryCode,
          subsidiaryCode: sub.subsidiaryCode,
          locationCodes: Array.isArray(sub.locationCode) ? sub.locationCode : (sub.locationCode ? [sub.locationCode] : []),
      }))

      if (allowedCodes) {
        apiSubsidiaries = apiSubsidiaries.filter((sub: any) => allowedCodes.subsidiaries.has(String(sub.subsidiaryCode)))
      }

      updates.subsidiaries = apiSubsidiaries
    }

    const divOrg = divisionsResponse?.fetchOrganization?.[0]
    if (divOrg?.divisions && Array.isArray(divOrg.divisions)) {
      let apiDivisions = divOrg.divisions.map((div: any) => ({
        label: div.divisionName,
        value: div.divisionCode,
        name: div.divisionName,
        code: div.divisionCode,
        divisionCode: div.divisionCode,
        subsidiaryCode: div.subsidiaryCode,
        locationCodes: Array.isArray(div.locationCode) ? div.locationCode : (div.locationCode ? [div.locationCode] : []),
      }))

      if (allowedCodes) {
        apiDivisions = apiDivisions.filter((div: any) => allowedCodes.divisions.has(String(div.divisionCode)))
      }

      updates.divisions = apiDivisions
    }

    const deptOrg = departmentsResponse?.fetchOrganization?.[0]
    if (deptOrg?.departments && Array.isArray(deptOrg.departments)) {
      let apiDepartments = deptOrg.departments.map((dept: any) => ({
        label: dept.departmentName,
        value: dept.departmentCode,
        name: dept.departmentName,
        code: dept.departmentCode,
        departmentCode: dept.departmentCode,
        divisionCode: dept.divisionCode,
        locationCodes: Array.isArray(dept.locationCode) ? dept.locationCode : (dept.locationCode ? [dept.locationCode] : []),
      }))

      if (allowedCodes) {
        apiDepartments = apiDepartments.filter((dept: any) => allowedCodes.departments.has(String(dept.departmentCode)))
      }

      updates.departments = apiDepartments
    }

    // Process locations data
    const orgs = locationsResponse?.fetchOrganization
    if (Array.isArray(orgs) && orgs.length > 0) {
      let allLocations: any[] = []
      orgs.forEach((org: any) => {
        if (Array.isArray(org.location)) {
          org.location.forEach((loc: any) => {
            allLocations.push({
              label: loc.locationName,
              value: loc.locationCode,
              locationCode: loc.locationCode,
              name: loc.locationName,
              code: loc.locationCode,
              city: loc.city,
              stateCode: loc.stateCode,
              regionCode: loc.regionCode,
              countryCode: loc.countryCode,
            })
          })
        }
      })
      // Remove duplicates by code
      const byCode = new Map<string, any>()
      allLocations.forEach((loc: any) => {
        if (loc.code && !byCode.has(loc.code)) {
          byCode.set(loc.code, loc)
        }
      })
      if (byCode.size > 0) {
        let finalLocations = Array.from(byCode.values())
        
        if (allowedCodes) {
          finalLocations = finalLocations.filter((loc: any) => allowedCodes.locations.has(String(loc.locationCode)))
        }
        
        updates.locations = finalLocations
      }
    }

    if (Object.keys(updates).length > 0) {
      setOrganizationBase((prev: any) => ({
        ...prev,
        ...updates,
      }))
    }
  }, [subsidiariesResponse, divisionsResponse, departmentsResponse, locationsResponse, allowedCodes])

  // When contractor data arrives, merge into contractor base structure
  useEffect(() => {
    const updates: {
      contractors?: any[]
      workOrderNumbers?: any[]
    } = {}

    // Contractors list
    if (contractorsResponse?.fetchContractors && Array.isArray(contractorsResponse.fetchContractors)) {
      let apiContractors = contractorsResponse.fetchContractors.map((ctr: any) => ({
        label: `${ctr.contractorCode} - ${ctr.contractorName}`,
        value: ctr.contractorCode,
        contractorCode: ctr.contractorCode,
        contractorName: ctr.contractorName,
      }))

      if (allowedCodes) {
        apiContractors = apiContractors.filter((ctr: any) => allowedCodes.contractors.has(String(ctr.contractorCode)))
      }

      updates.contractors = apiContractors
    }

    // Work order numbers flattened with contractorCode
    if (workOrdersResponse?.fetchContractors && Array.isArray(workOrdersResponse.fetchContractors)) {
      let apiWorkOrders = workOrdersResponse.fetchContractors.flatMap((ctr: any) =>
        (ctr.workOrders || []).map((wo: any) => ({
          label: wo.workOrderNumber,
          value: wo.workOrderNumber,
          workOrderNumber: wo.workOrderNumber,
          contractorCode: ctr.contractorCode,
          contractPeriodFrom: wo.contractPeriodFrom,
          contractPeriodTo: wo.contractPeriodTo,
        }))
      )

      if (allowedCodes) {
        // Filter work orders if their contractor is not allowed
        apiWorkOrders = apiWorkOrders.filter((wo: any) => allowedCodes.contractors.has(String(wo.contractorCode)))
      }

      updates.workOrderNumbers = apiWorkOrders
    }

    if (Object.keys(updates).length > 0) {
      setContractorBase(prev => ({
        ...prev,
        ...updates,
      }))
    }
  }, [contractorsResponse, workOrdersResponse, allowedCodes])

  const loading =
    subsidiariesLoading ||
    divisionsLoading ||
    departmentsLoading ||
    locationsLoading ||
    contractorsLoading ||
    workOrdersLoading
  
  const [selectedEmployeeID, setSelectedEmployeeID] = useState<string | null>(null)
  // Track which section the employee belongs to ('employee', 'organization', 'contractor', or null)
  const [employeeSection, setEmployeeSection] = useState<'employee' | 'organization' | 'contractor' | null>(null)
  const [selections, setSelections] = useState<FilterSelections>(
    initialSelections || {
      subsidiaries: [],
      divisions: [],
      departments: [],
      locations: [],
      contractors: [],
      workOrderNumbers: [],
      employeeID: ''
    }
  )

  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({})
  const [activeSection, setActiveSection] = useState<'employee' | 'organization' | 'contractor'>('employee')
  const [popoverOpen, setPopoverOpen] = useState<Record<string, boolean>>({})
  const [selectedItemsPopoverOpen, setSelectedItemsPopoverOpen] = useState<Record<string, boolean>>({})
  
  // Track filtered employee lists from EmployeeSearchField components
  const [orgFilteredEmployees, setOrgFilteredEmployees] = useState<Employee[]>([])
  const [contractorFilteredEmployees, setContractorFilteredEmployees] = useState<Employee[]>([])

  // Memoized callbacks to prevent infinite loops
  const handleOrgEmployeeListChange = useCallback((employees: Employee[]) => {
    setOrgFilteredEmployees(employees)
  }, [])

  const handleContractorEmployeeListChange = useCallback((employees: Employee[]) => {
    setContractorFilteredEmployees(employees)
  }, [])

  // Clear employeeID when organization filters are all empty OR if selected employee doesn't exist in filtered list
  useEffect(() => {
    if (activeSection === 'organization') {
      const currentEmployeeID = currentEmployeeIDRef.current
      const hasNoOrgFilters = 
        (!selections.subsidiaries || selections.subsidiaries.length === 0) &&
        (!selections.divisions || selections.divisions.length === 0) &&
        (!selections.departments || selections.departments.length === 0) &&
        (!selections.locations || selections.locations.length === 0)
      
      // Clear employee when all organization filters are cleared
      if (hasNoOrgFilters && currentEmployeeID && employeeSection === 'organization') {
        setSelections(prev => ({ ...prev, employeeID: '' }))
        setSelectedEmployeeID(null)
        setEmployeeSection(null) // Clear section tracking
        return
      }
      
      // If we have organization filters and a selected employee in organization section, check if employee exists in filtered list
      if (currentEmployeeID && employeeSection === 'organization' && orgFilteredEmployees.length > 0) {
        const employeeExists = orgFilteredEmployees.some(emp => emp.employeeID === currentEmployeeID)
        if (!employeeExists) {
          setSelections(prev => ({ ...prev, employeeID: '' }))
          setSelectedEmployeeID(null)
          setEmployeeSection(null) // Clear section tracking
        }
      }
    }
  }, [orgFilteredEmployees, selections.subsidiaries, selections.divisions, selections.departments, selections.locations, activeSection])

  // Clear employeeID when contractor filters are all empty OR if selected employee doesn't exist in filtered list
  useEffect(() => {
    if (activeSection === 'contractor') {
      const currentEmployeeID = currentEmployeeIDRef.current
      const hasNoContractorFilters = 
        (!selections.contractors || selections.contractors.length === 0) &&
        (!selections.workOrderNumbers || selections.workOrderNumbers.length === 0)
      
      // Clear employee when all contractor filters are cleared
      if (hasNoContractorFilters && currentEmployeeID && employeeSection === 'contractor') {
        setSelections(prev => ({ ...prev, employeeID: '' }))
        setSelectedEmployeeID(null)
        setEmployeeSection(null) // Clear section tracking
        return
      }
      
      // If we have contractor filters and a selected employee in contractor section, check if employee exists in filtered list
      if (currentEmployeeID && employeeSection === 'contractor' && contractorFilteredEmployees.length > 0) {
        const employeeExists = contractorFilteredEmployees.some(emp => emp.employeeID === currentEmployeeID)
        if (!employeeExists) {
          setSelections(prev => ({ ...prev, employeeID: '' }))
          setSelectedEmployeeID(null)
          setEmployeeSection(null) // Clear section tracking
        }
      }
    }
  }, [contractorFilteredEmployees, selections.contractors, selections.workOrderNumbers, activeSection])

  // Get filtered organization data based on selected employee ID
  const organizationData = getOrganizationDataByEmployee(selectedEmployeeID, organizationBase)
  
  // Contractor data (not filtered by employee)
  const contractorData = contractorBase

  // Track previous isOpen state to detect when modal opens
  const prevIsOpenRef = useRef<boolean>(false)
  // Track previous initialSelections to detect when they actually change
  const prevInitialSelectionsRef = useRef<FilterSelections | undefined>(initialSelections)
  // Track if selections have been initialized for current initialSelections
  const selectionsInitializedRef = useRef<boolean>(false)
  // Track the active section to preserve it across open/close cycles
  const preservedActiveSectionRef = useRef<'employee' | 'organization' | 'contractor'>('employee')
  // Track the employee section to preserve it across open/close cycles
  const preservedEmployeeSectionRef = useRef<'employee' | 'organization' | 'contractor' | null>(null)
  // Track current selections in a ref to avoid dependency issues
  const currentSelectionsRef = useRef<FilterSelections>(selections)
  // Track current employeeID in a ref to avoid dependency loops
  const currentEmployeeIDRef = useRef<string>(selections.employeeID || '')
  
  // Update refs when selections change
  useEffect(() => {
    currentSelectionsRef.current = selections
    currentEmployeeIDRef.current = selections.employeeID || ''
  }, [selections])
  
  // Helper function to determine which section should be active based on selections
  // Check in reverse order: contractor first, then organization, then employee
  const determineActiveSection = (selectionsToCheck: FilterSelections): 'employee' | 'organization' | 'contractor' => {
    // If both contractor AND organization selections exist, it means user canceled/cleared
    // In this case, open employee section and don't update any fields
    const hasContractorSelections = selectionsToCheck.contractors.length > 0 || selectionsToCheck.workOrderNumbers.length > 0
    const hasOrgSelections = selectionsToCheck.subsidiaries.length > 0 || selectionsToCheck.divisions.length > 0 || 
                             selectionsToCheck.departments.length > 0 || selectionsToCheck.locations.length > 0
    
    if (hasContractorSelections && hasOrgSelections) {
      return 'employee'
    }
    
    // First check contractor fields
    if (hasContractorSelections) {
      return 'contractor'
    }
    // Then check organization fields
    if (hasOrgSelections) {
      return 'organization'
    }
    // Finally check employee ID
    if (selectionsToCheck.employeeID && selectionsToCheck.employeeID.trim()) {
      return 'employee'
    }
    return preservedActiveSectionRef.current || 'employee'
  }
  
  // Update selections only when modal opens AND initialSelections actually changed
  // This preserves selections when closing/reopening without applying
  useEffect(() => {
    const wasOpen = prevIsOpenRef.current
    const isNowOpen = isOpen
    
    // Check if initialSelections actually changed
    const initialSelectionsChanged = JSON.stringify(prevInitialSelectionsRef.current) !== JSON.stringify(initialSelections)
    
    // When modal closes, preserve the active section and employee section
    if (wasOpen && !isNowOpen) {
      preservedActiveSectionRef.current = activeSection
      preservedEmployeeSectionRef.current = employeeSection
    }
    
    // When modal opens
    if (!wasOpen && isNowOpen) {
      // Check if both contractor and organization selections exist (user canceled/cleared)
      const checkSelections = initialSelections || currentSelectionsRef.current
      const hasContractorSelections = (checkSelections.contractors?.length > 0 || checkSelections.workOrderNumbers?.length > 0) ?? false
      const hasOrgSelections = (checkSelections.subsidiaries?.length > 0 || checkSelections.divisions?.length > 0 || 
                                 checkSelections.departments?.length > 0 || checkSelections.locations?.length > 0) ?? false
      const bothExist = hasContractorSelections && hasOrgSelections
      
      // Reset selections if:
      // 1. initialSelections changed (parent updated them), OR
      // 2. Selections haven't been initialized yet for current initialSelections
      if ((initialSelectionsChanged || !selectionsInitializedRef.current) && initialSelections) {
        setSelections(initialSelections)
        selectionsInitializedRef.current = true
        // Determine active section based on initialSelections
        const sectionToActivate = determineActiveSection(initialSelections)
        setActiveSection(sectionToActivate)
        preservedActiveSectionRef.current = sectionToActivate
      } else {
        // When reopening without initialSelections change, determine active section from current selections
        // This ensures the correct section is active based on what was selected
        const sectionToActivate = determineActiveSection(currentSelectionsRef.current)
        setActiveSection(sectionToActivate)
        preservedActiveSectionRef.current = sectionToActivate
      }
      
      // If both contractor and organization selections exist, don't reset UI state (preserve everything)
      if (!bothExist) {
        // Reset other UI state when modal opens
        setSearchQueries({})
        setSelectedEmployeeID(null)
        // Restore employee section if preserved, otherwise reset
        if (preservedEmployeeSectionRef.current && currentSelectionsRef.current.employeeID) {
          setEmployeeSection(preservedEmployeeSectionRef.current)
        } else {
          setEmployeeSection(null)
        }
      }
    }
    
    // Update refs for next render
    prevIsOpenRef.current = isOpen
    if (initialSelectionsChanged) {
      prevInitialSelectionsRef.current = initialSelections
      selectionsInitializedRef.current = false // Reset flag when initialSelections change
    }
  }, [isOpen, initialSelections, activeSection])

  // Notify parent of filter changes - REMOVED to prevent API calls on every change
  // Only notify when Apply is clicked (via onApply callback)
  // useEffect(() => {
  //   onFilterChange?.(selections)
  // }, [selections, onFilterChange])

  // Get all available data for a step (for displaying selected items)
  const getAllDataForStep = (stepKey: string) => {
    const isContractorStep = CONTRACTOR_STEPS.some(s => s.key === stepKey)
    const dataSource = isContractorStep ? contractorData : organizationData
    
    if (!dataSource) return []
    const allItems = dataSource[stepKey as keyof typeof dataSource] as any[]
    if (!Array.isArray(allItems)) return []
    return allItems
  }

  // Get data for a step with proper parent/child relationship
  const getParentFilteredData = (stepKey: string) => {
    // Determine which data source to use
    const isContractorStep = CONTRACTOR_STEPS.some(s => s.key === stepKey)
    const dataSource = isContractorStep ? contractorData : organizationData
    
    if (!dataSource) return []

    const step = ALL_STEPS.find(s => s.key === stepKey)
    if (!step) return []
 
    const allItems = dataSource[step.key as keyof typeof dataSource] as any[]
    if (!Array.isArray(allItems)) return []

    // Top-level steps (no parent) always show all items
    if (!step.parentKey) {
      return allItems
    }
 
    const parentSelections = selections[step.parentKey]
    if (parentSelections.length === 0) {
      return []
    }
 
    // Organization hierarchy: filter on client using parent code fields
    if (!isContractorStep) {
      switch (step.key) {
        case 'divisions':
          // divisions belong to subsidiaries via subsidiaryCode
          return allItems.filter((item: any) =>
            parentSelections.includes(item.subsidiaryCode)
          )
        case 'departments':
          // departments belong to divisions via divisionCode
          return allItems.filter((item: any) =>
            parentSelections.includes(item.divisionCode)
          )
        default:
          return allItems
      }
    }
 
    // Contractor hierarchy: still apply parent-child relation on the frontend
    const parentCodeField = step.parentKey === 'contractors' ? 'contractorCode' : 'contractorCode'
    return allItems.filter((item: any) => parentSelections.includes(item[parentCodeField]))
  }

  // Filter data based on parent selections and search
  const getFilteredData = (stepKey: string) => {
    let filtered = getParentFilteredData(stepKey)

    // Apply search filter if search query exists
    const searchQuery = searchQueries[stepKey]?.toLowerCase().trim()
    if (searchQuery) {
      filtered = filtered.filter((item: any) => {
        return item.label?.toLowerCase().includes(searchQuery) ||
               item.value?.toLowerCase().includes(searchQuery)
      })
    }

    return filtered
  }

  // Handle search input change
  const handleSearchChange = (stepKey: string, value: string) => {
    setSearchQueries(prev => ({
      ...prev,
      [stepKey]: value
    }))
  }

  // Handle checkbox toggle
  const handleToggle = (stepKey: string, value: string) => {
    setSelections(prev => {
      // employeeID is a string, not an array, so handle it differently
      if (stepKey === 'employeeID') {
        return {
          ...prev,
          employeeID: prev.employeeID === value ? '' : value
        }
      }

      const currentSelections = prev[stepKey as keyof FilterSelections] as string[]
      const isSelected = currentSelections.includes(value)
      
      let newSelections: FilterSelections = {
        ...prev,
        [stepKey]: isSelected
          ? currentSelections.filter(v => v !== value)
          : [...currentSelections, value]
      }

      // Determine which step array to use
      const isContractorStep = CONTRACTOR_STEPS.some(s => s.key === stepKey)
      const stepArray = isContractorStep ? CONTRACTOR_STEPS : ORGANIZATION_STEPS
      const stepIndex = stepArray.findIndex(s => s.key === stepKey)
      // If a parent value changes, all child values should be cleared
      if (stepIndex < stepArray.length - 1) {
        for (let i = stepIndex + 1; i < stepArray.length; i++) {
          const childStep = stepArray[i]
          newSelections = {
            ...newSelections,
            [childStep.key]: [] as any
          }
        }
      }

      // If parent filter changed (subsidiaries, divisions, departments, locations, contractors)
      // and employeeID is set, we'll check if employee exists in useEffect above

      return newSelections
    })
  }

  // Handle select all for a step
  const handleSelectAll = (stepKey: string) => {
    // employeeID is a string, not an array, so this function doesn't apply
    if (stepKey === 'employeeID') {
      return
    }

    const filteredData = getFilteredData(stepKey)
    const allValues = filteredData.map((item: any) => {
      const codeField = stepKey === 'subsidiaries'
        ? 'subsidiaryCode'
        : stepKey === 'divisions'
        ? 'divisionCode'
        : stepKey === 'departments'
        ? 'departmentCode'
        : stepKey === 'contractors'
        ? 'contractorCode'
        : 'workOrderNumber'
      return item[codeField]
    })
    
    setSelections(prev => ({
      ...prev,
      [stepKey]: allValues
    }))
  }

  // Check if all visible items are selected
  const areAllVisibleItemsSelected = (stepKey: string) => {
    const filteredData = getFilteredData(stepKey)
    if (filteredData.length === 0) return false
    
    const codeField = stepKey === 'subsidiaries'
      ? 'subsidiaryCode'
      : stepKey === 'divisions'
      ? 'divisionCode'
        : stepKey === 'departments'
        ? 'departmentCode'
        : stepKey === 'contractors'
      ? 'contractorCode'
      : 'workOrderNumber'
    
    const currentSelections = selections[stepKey as keyof FilterSelections]
    return filteredData.every((item: any) => currentSelections.includes(item[codeField]))
  }

  // Check if some (but not all) visible items are selected (for indeterminate state)
  const areSomeVisibleItemsSelected = (stepKey: string) => {
    // employeeID is a string, not an array, so this function doesn't apply
    if (stepKey === 'employeeID') {
      return false
    }

    const filteredData = getFilteredData(stepKey)
    if (filteredData.length === 0) return false
    
    const codeField = stepKey === 'subsidiaries'
      ? 'subsidiaryCode'
      : stepKey === 'divisions'
      ? 'divisionCode'
        : stepKey === 'departments'
        ? 'departmentCode'
        : stepKey === 'contractors'
      ? 'contractorCode'
      : 'workOrderNumber'
    
    const currentSelections = selections[stepKey as keyof FilterSelections] as string[]
    const selectedCount = filteredData.filter((item: any) => currentSelections.includes(item[codeField])).length
    return selectedCount > 0 && selectedCount < filteredData.length
  }

  // Handle select all checkbox toggle
  const handleSelectAllCheckbox = (stepKey: string, checked: boolean) => {
    // employeeID is a string, not an array, so this function doesn't apply
    if (stepKey === 'employeeID') {
      return
    }

    if (checked) {
      handleSelectAll(stepKey)
    } else {
      // Deselect all visible items
      const filteredData = getFilteredData(stepKey)
      const codeField = stepKey === 'subsidiaries'
        ? 'subsidiaryCode'
        : stepKey === 'divisions'
        ? 'divisionCode'
        : stepKey === 'departments'
        ? 'departmentCode'
        : stepKey === 'contractors'
        ? 'contractorCode'
        : 'workOrderNumber'
      
      const visibleValues = filteredData.map((item: any) => item[codeField])
      setSelections(prev => {
        const currentSelections = prev[stepKey as keyof FilterSelections] as string[]
        return {
          ...prev,
          [stepKey]: currentSelections.filter(v => !visibleValues.includes(v))
        }
      })
    }
  }

  // Handle clear all for a step
  const handleClearAll = (stepKey: string) => {
    setSelections(prev => {
      // employeeID is a string, not an array, so handle it differently
      if (stepKey === 'employeeID') {
        return {
          ...prev,
          employeeID: ''
        }
      }

      // Determine which step array to use
      const isContractorStep = CONTRACTOR_STEPS.some(s => s.key === stepKey)
      const stepArray = isContractorStep ? CONTRACTOR_STEPS : ORGANIZATION_STEPS
      const stepIndex = stepArray.findIndex(s => s.key === stepKey)
      const newSelections = { ...prev, [stepKey]: [] }
      
      // Clear all child selections
      for (let i = stepIndex + 1; i < stepArray.length; i++) {
        const childKey = stepArray[i].key as keyof FilterSelections
        newSelections[childKey] = [] as any
      }
      
      return newSelections
    })
  }

  // Get count of selected items for a step
  const getSelectedCount = (stepKey: string) => {
    return selections[stepKey as keyof FilterSelections].length
  }

  // Check if step is enabled (section active + parent has selections)
  const isStepEnabled = (stepKey: string) => {
    const step = ALL_STEPS.find(s => s.key === stepKey)
    if (!step) return false

    const isContractorStep = CONTRACTOR_STEPS.some(s => s.key === stepKey)
    const isOrgStep = ORGANIZATION_STEPS.some(s => s.key === stepKey)

    // Section must be active first
    if (isOrgStep && activeSection !== 'organization') return false
    if (isContractorStep && activeSection !== 'contractor') return false

    // Top-level steps don't require parent selection
    if (!step.parentKey) return true

    // For both organization and contractor hierarchies, require parent selection
    return selections[step.parentKey].length > 0
  }

  // Handle employee ID change - clear organization selections when employee changes
  const handleEmployeeIDChange = (employeeID: string) => {
    // If "all" is selected, set to null to show all employees
    const actualEmployeeID = employeeID === "all" ? null : employeeID
    setSelectedEmployeeID(actualEmployeeID)
    // Clear organization structure selections when employee changes
    setSelections(prev => ({
      ...prev,
      subsidiaries: [],
      divisions: [],
      departments: [],
      // Keep contractor selections
    }))
  }

  // Helper function to reset all state to initial state (like first render)
  const resetToInitialState = () => {
    // Clear all selections from all three sections
    setSelections({
      subsidiaries: [],
      divisions: [],
      departments: [],
      locations: [],
      contractors: [],
      workOrderNumbers: [],
      employeeID: ''
    })
    // Clear all search queries
    setSearchQueries({})
    // Clear employee-related state
    setSelectedEmployeeID(null)
    setEmployeeSection(null)
    // Reset active section to employee (uncheck all Enable checkboxes)
    setActiveSection('employee')
    // Clear all popover states
    setPopoverOpen({})
    setSelectedItemsPopoverOpen({})
    // Clear filtered employee lists
    setOrgFilteredEmployees([])
    setContractorFilteredEmployees([])
    // Reset preserved refs
    preservedActiveSectionRef.current = 'employee'
    preservedEmployeeSectionRef.current = null
  }

  // Handle cancel - apply defaults if initial selections are empty
  // When initial selections are empty (first render), reset to initial state like Clear All
  const handleCancel = () => {
    // Check if initial selections are empty (no filters applied yet)
    const isInitialEmpty = !initialSelections || (
      initialSelections.subsidiaries.length === 0 &&
      initialSelections.divisions.length === 0 &&
      initialSelections.departments.length === 0 &&
      initialSelections.locations.length === 0 &&
      initialSelections.contractors.length === 0 &&
      initialSelections.workOrderNumbers.length === 0 &&
      !initialSelections.employeeID
    )

    if (isInitialEmpty && allowedCodes) {
        // Reset all state to initial state (same as Clear All)
        resetToInitialState()
        // Construct default selections from allowedCodes to ensure data is loaded
        const defaultSelections: any = {
            subsidiaries: Array.from(allowedCodes.subsidiaries),
            divisions: Array.from(allowedCodes.divisions),
            departments: Array.from(allowedCodes.departments),
            locations: Array.from(allowedCodes.locations),
            contractors: Array.from(allowedCodes.contractors),
            workOrderNumbers: [],
            employeeID: ''
        }
        onApply?.(defaultSelections)
    } else {
        // Don't reset selections when closing - preserve them for next open
        // Selections will only reset when initialSelections prop changes (after Apply)
        onClose()
    }
  }

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCancel()
    }
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleCancel()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden" // Prevent background scroll
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, initialSelections, allowedCodes]) // Added dependencies for handleCancel logic



  // Handle apply button with section-wise validation and summary alert
  const handleApply = () => {
    let filteredSelections: FilterSelections = {
      subsidiaries: [],
      divisions: [],
      departments: [],
      locations: [],
      contractors: [],
      workOrderNumbers: [],
      employeeID: ''
    }

    // Based on active section, only send data from that section
    if (activeSection === 'employee') {
      // Employee ID section - only send employeeID if selected in this section
      if (employeeSection === 'employee' && selections.employeeID && selections.employeeID.trim()) {
        filteredSelections = {
          ...filteredSelections,
          employeeID: selections.employeeID.trim()
        }
      } else if (!selections.employeeID || !selections.employeeID.trim()) {
        toast({
          variant: 'destructive',
          title: 'Employee ID required',
          description: 'Please enter an Employee ID before applying filters.',
        })
        return
      } else {
        // EmployeeID exists but not from this section - don't send it
        toast({
          variant: 'destructive',
          title: 'Employee ID required',
          description: 'Please enter an Employee ID in the Employee ID section before applying filters.',
        })
        return
      }
    } else if (activeSection === 'organization') {
      // Organization Structure section - only send organization filters and employeeID if selected in this section
      const hasAnyOrgSelections = 
        selections.subsidiaries.length > 0 ||
        selections.divisions.length > 0 ||
        selections.departments.length > 0 ||
        selections.locations.length > 0
      
      if (hasAnyOrgSelections) {
        // User has made specific organization selections
        filteredSelections = {
          ...filteredSelections,
          subsidiaries: selections.subsidiaries,
          divisions: selections.divisions,
          departments: selections.departments,
          locations: selections.locations
        }
        // Include employeeID only if it was selected in organization section
        if (employeeSection === 'organization' && selections.employeeID && selections.employeeID.trim()) {
          filteredSelections.employeeID = selections.employeeID.trim()
        }
      } else {
        // No organization selections - use all allowed codes as defaults
        filteredSelections = {
          ...filteredSelections,
          subsidiaries: Array.from(allowedCodes?.subsidiaries || []),
          divisions: Array.from(allowedCodes?.divisions || []),
          departments: Array.from(allowedCodes?.departments || []),
          locations: Array.from(allowedCodes?.locations || [])
        }
        // Include employeeID only if it was selected in organization section
        if (employeeSection === 'organization' && selections.employeeID && selections.employeeID.trim()) {
          filteredSelections.employeeID = selections.employeeID.trim()
        }
      }
    } else if (activeSection === 'contractor') {
      // Contractor Structure section - only send contractor filters and employeeID if selected in this section
      const hasAnyContractorSelections = 
        selections.contractors.length > 0 ||
        selections.workOrderNumbers.length > 0
      
      if (hasAnyContractorSelections) {
        // User has made specific contractor selections
        filteredSelections = {
          ...filteredSelections,
          contractors: selections.contractors,
          workOrderNumbers: selections.workOrderNumbers
        }
        // Include employeeID only if it was selected in contractor section
        if (employeeSection === 'contractor' && selections.employeeID && selections.employeeID.trim()) {
          filteredSelections.employeeID = selections.employeeID.trim()
        }
      } else {
        // No contractor selections - use all allowed codes as defaults
        filteredSelections = {
          ...filteredSelections,
          contractors: Array.from(allowedCodes?.contractors || []),
          workOrderNumbers: []
        }
        // Include employeeID only if it was selected in contractor section
        if (employeeSection === 'contractor' && selections.employeeID && selections.employeeID.trim()) {
          filteredSelections.employeeID = selections.employeeID.trim()
        }
      }
    }

    // Send only the filtered selections for the active section
    onApply?.(filteredSelections)
    onClose()
  }

  // Handle clear all selections - reset to initial state (like first render)
  const handleClear = () => {
    // Reset all state to initial state
    resetToInitialState()
    
    // Pass all allowed codes when clearing (like first time popup open and cancel)
    if (allowedCodes) {
      const defaultSelections: FilterSelections = {
        subsidiaries: Array.from(allowedCodes.subsidiaries),
        divisions: Array.from(allowedCodes.divisions),
        departments: Array.from(allowedCodes.departments),
        locations: Array.from(allowedCodes.locations),
        contractors: Array.from(allowedCodes.contractors),
        workOrderNumbers: [],
        employeeID: ''
      }
      onApply?.(defaultSelections)
    }
  }
  
  // Field styles matching add-new-punch-form.tsx
  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"

  if (!isOpen) return null

  // if (loading) {
  //   return (
  //     <div
  //       className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  //       onClick={handleBackdropClick}
  //     >
  //       <Card className="w-full max-w-7xl h-[85vh]">
  //         <CardContent className="p-6">
  //           <div className="flex items-center justify-center py-8">
  //             <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
  //             <span className="ml-3 text-sm text-gray-600">Loading organization data...</span>
  //           </div>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   )
  // }

  if (!organizationData) {
    return (
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <Card className="w-full max-w-7xl h-[85vh]">
          <CardContent className="p-6">
            <div className="text-center py-8 text-sm text-gray-500">
              No organization data available
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-5xl flex flex-col">
        <Card className="w-full max-h-[80vh] flex flex-col overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">
                Filter Options
              </CardTitle>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 px-0 py-0 overflow-y-auto relative min-h-0">
            {/* Employee ID Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b border-gray-100">
              <div className="md:col-span-1">
                <h3 className="text-base font-semibold text-gray-900">Employee ID</h3>
                <p className="text-sm text-gray-500 mt-1">Primary filter for employee selection</p>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-end space-x-2 mb-4">
                  <Checkbox 
                    id="employee-toggle"
                    checked={activeSection === 'employee'}
                    onCheckedChange={(checked) => {
                      if (checked) setActiveSection('employee')
                    }}
                    className="data-[state=checked]:bg-blue-600 border-blue-600"
                  />
                  <Label 
                    htmlFor="employee-toggle" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Enable
                  </Label>
                </div>
                {activeSection === 'employee' && (
                  <div className="max-w-md">
                    <EmployeeSearchField
                      isOpen={isOpen}
                      preSelectedEmployeeId={employeeSection === 'employee' ? selections.employeeID || undefined : undefined}
                      onSelect={(employee: Employee) => {
                        setSelections(prev => ({
                          ...prev,
                          employeeID: employee.employeeID
                        }))
                        setSelectedEmployeeID(employee.employeeID)
                        setEmployeeSection('employee') // Mark employee as belonging to 'employee' section
                      }}
                      onClear={() => {
                        setSelections(prev => ({
                          ...prev,
                          employeeID: ''
                        }))
                        setSelectedEmployeeID(null)
                        setEmployeeSection(null) // Clear section tracking
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Organization Structure Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b border-gray-100">
              <div className="md:col-span-1">
                <h3 className="text-base font-semibold text-gray-900">Organization Structure</h3>
                <p className="text-sm text-gray-500 mt-1">Hierarchical filters for organization data</p>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-end space-x-2 mb-4">
                  <Checkbox 
                    id="org-toggle"
                    checked={activeSection === 'organization'}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setActiveSection('organization')
                      } else {
                        // When unchecked, switch to employee section if no other section has selections
                        if (activeSection === 'organization') {
                          // Only switch if no other section is active
                          if (!selections.employeeID && selections.contractors.length === 0 && selections.workOrderNumbers.length === 0) {
                            setActiveSection('employee')
                          }
                        }
                      }
                    }}
                    className="data-[state=checked]:bg-blue-600 border-blue-600"
                  />
                  <Label 
                    htmlFor="org-toggle" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    onClick={() => {
                      // Ensure section opens when label is clicked
                      if (activeSection !== 'organization') {
                        setActiveSection('organization')
                      }
                    }}
                  >
                    Enable
                  </Label>
                </div>
              
                {activeSection === 'organization' && (
                  <div className="space-y-4">
                    {/* First Row - 2 fields */}
                    <div className="grid grid-cols-2 gap-4">
                    {ORGANIZATION_STEPS.slice(0, 2).map((step, index) => {
                  const filteredData = getFilteredData(step.key)
                  const isEnabled = isStepEnabled(step.key)
                  const selectedCount = getSelectedCount(step.key)
                  const codeField = step.key === 'subsidiaries'
                    ? 'subsidiaryCode'
                    : step.key === 'divisions'
                    ? 'divisionCode'
                    : step.key === 'departments'
                    ? 'departmentCode'
                    : step.key === 'locations'
                    ? 'locationCode'
                    : 'departmentCode'
                  const isOpen = popoverOpen[step.key] || false

                  const selectedItems = getAllDataForStep(step.key).filter((item: any) => 
                    selections[step.key as keyof FilterSelections].includes(item[codeField])
                  )

                  const IconComponent = step.key === 'subsidiaries' ? Building2 : Building2

                      return (
                    <div key={step.key} className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 block">
                        {step.label}
                      </Label>
                      <div className="relative">
                        <Popover open={isOpen} onOpenChange={(open) => setPopoverOpen(prev => ({ ...prev, [step.key]: open }))}>
                          <PopoverTrigger asChild>
                        <button
                              type="button"
                          disabled={!isEnabled}
                              className={`relative w-full h-10 border rounded-lg pl-10 pr-10 text-left transition-all ${
                                !isEnabled 
                                  ? "bg-gray-50 cursor-not-allowed border-gray-200" 
                                  : "bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                              }`}
                        >
                              <IconComponent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <span className="block truncate text-sm text-gray-500">
                                {!isEnabled
                                  ? (index === 0 ? 'No data available' : `Select ${ORGANIZATION_STEPS[index - 1].label.toLowerCase()} first`)
                                  : 'Search by name or ID'}
                              </span>
                              <ChevronsUpDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                          </PopoverTrigger>
                        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl">
                          <Command shouldFilter={false} className="bg-white">
                            <div className="p-2 border-b border-gray-200 sticky top-0 z-10 bg-white">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <CommandInput
                                value={searchQueries[step.key] || ''}
                                  onValueChange={(value) => handleSearchChange(step.key, value)}
                                  placeholder="Search..."
                                  className="pl-8 h-9"
                              />
                            </div>
                            </div>
                            <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                          {filteredData.length === 0 ? (
                                <CommandEmpty>
                              {!isEnabled
                                ? (index === 0 
                                    ? 'No data available' 
                                    : `Please select ${ORGANIZATION_STEPS[index - 1].label.toLowerCase()} first`)
                                : 'No data available'}
                                </CommandEmpty>
                          ) : (
                                <CommandGroup>
                                  {/* Select All Option - matching step-subsidiaries design */}
                                  {filteredData.length > 0 && (
                                    <div className="flex items-center justify-between px-2 py-1.5 mt-2 mb-1 border border-dashed border-gray-200 rounded-md bg-gray-50">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const allValues = filteredData.map((item: any) => item[codeField])
                                          const currentSelections = selections[step.key as keyof FilterSelections] as string[]
                                          const allSelected = allValues.every((val: string) => currentSelections.includes(val))
                                          if (allSelected) {
                                            // Deselect all visible
                                            setSelections(prev => {
                                              const prevSelections = prev[step.key as keyof FilterSelections] as string[]
                                              return {
                                                ...prev,
                                                [step.key]: prevSelections.filter((v: string) => !allValues.includes(v))
                                              }
                                            })
                                          } else {
                                            // Select all visible (merge, avoid duplicates)
                                            setSelections(prev => {
                                              const prevSelections = prev[step.key as keyof FilterSelections] as string[]
                                              return {
                                                ...prev,
                                                [step.key]: Array.from(new Set([...prevSelections, ...allValues]))
                                              }
                                            })
                                          }
                                        }}
                                        className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                                      >
                                        <Check
                                          className={`h-4 w-4 rounded-sm border ${
                                            filteredData.length > 0 &&
                                            filteredData.every((item: any) => selections[step.key as keyof FilterSelections].includes(item[codeField]))
                                              ? 'opacity-100 text-green-600 border-green-500'
                                              : 'opacity-70 text-transparent border-gray-300'
                                          }`}
                                        />
                                        <span>Select all ({filteredData.length})</span>
                                      </button>
                                  </div>
                                  )}
                                {filteredData.map((item: any) => {
                                  const value = item[codeField]
                                  const isSelected = selections[step.key as keyof FilterSelections].includes(value)
                                  return (
                                      <CommandItem
                                      key={value}
                                        value={`${value} - ${item.label}`}
                                        onSelect={() => handleToggle(step.key, value)}
                                        className="cursor-pointer"
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 rounded-sm border ${
                                            isSelected
                                              ? 'opacity-100 text-green-600 border-green-500'
                                              : 'opacity-70 text-transparent border-gray-300'
                                          }`}
                                        />
                                        <div className="flex-1">
                                          <div className="font-medium text-sm">{item.label || item.name}</div>
                                          <div className="text-xs text-gray-500">Code: {value}</div>
                                          {item.locationCodes?.length > 0 && (
                                            <div className="text-[11px] text-gray-400">
                                              Locations: {Array.isArray(item.locationCodes) ? item.locationCodes.join(', ') : item.locationCodes}
                                        </div>
                                          )}
                                        </div>
                                      </CommandItem>
                                    )
                                  })}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedCount > 0 && (
                        <Popover 
                          open={selectedItemsPopoverOpen[step.key] || false} 
                          onOpenChange={(open) => setSelectedItemsPopoverOpen(prev => ({ ...prev, [step.key]: open }))}
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="absolute right-0 top-0 bottom-0 inline-flex items-center justify-center min-w-[40px] px-3 bg-blue-600 text-white text-xs font-medium rounded-r-lg shadow-sm hover:bg-blue-700 transition-colors z-10"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedItemsPopoverOpen(prev => ({ ...prev, [step.key]: !prev[step.key] }))
                              }}
                            >
                              {selectedCount}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-80 max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl" align="end">
                            <Command shouldFilter={false} className="bg-white">
                              <div className="p-3 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-gray-700">Selected {step.label}</h4>
                                  <span className="text-xs text-gray-500">{selectedCount} selected</span>
                              </div>
                            </div>
                              <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                                {selectedItems.length === 0 ? (
                                  <CommandEmpty>No items selected</CommandEmpty>
                                ) : (
                                  <CommandGroup>
                                    {selectedItems.map((item: any) => {
                                      const value = item[codeField]
                                      return (
                                        <CommandItem
                                          key={value}
                                          value={`${value} - ${item.label}`}
                                          className="flex items-center justify-between cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2 flex-1">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span className="truncate">{item.label}</span>
                        </div>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleToggle(step.key, value)
                                            }}
                                            className="text-gray-400 hover:text-red-600 ml-2 p-1 rounded hover:bg-red-50 transition-colors"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </CommandItem>
                                      )
                                    })}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                      </div>
                    </div>
                      )
                    })}
                  </div>

                  {/* Second Row - 2 fields (Departments, Locations) */}
                  <div className="grid grid-cols-2 gap-4">
                    {ORGANIZATION_STEPS.slice(2).map((step, index) => {
                  const filteredData = getFilteredData(step.key)
                  const isEnabled = isStepEnabled(step.key)
                  const selectedCount = getSelectedCount(step.key)
                  const codeField = step.key === 'departments'
                    ? 'departmentCode'
                    : step.key === 'locations'
                    ? 'locationCode'
                    : 'locationCode'
                  const isOpen = popoverOpen[step.key] || false

                  const selectedItems = getAllDataForStep(step.key).filter((item: any) => 
                    selections[step.key as keyof FilterSelections].includes(item[codeField])
                  )

                  const IconComponent = step.key === 'departments' ? Building2 : Calendar

                      return (
                    <div key={step.key} className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 block">
                        {step.label}
                      </Label>
                      <div className="relative">
                        <Popover open={isOpen} onOpenChange={(open) => setPopoverOpen(prev => ({ ...prev, [step.key]: open }))}>
                          <PopoverTrigger asChild>
                        <button
                              type="button"
                          disabled={!isEnabled}
                              className={`relative w-full h-10 border rounded-lg pl-10 pr-10 text-left transition-all ${
                                !isEnabled 
                                  ? "bg-gray-50 cursor-not-allowed border-gray-200" 
                                  : "bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                              }`}
                        >
                              <IconComponent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <span className="block truncate text-sm text-gray-500">
                                {!isEnabled
                                  ? (index === 0 ? `Select ${ORGANIZATION_STEPS[1].label.toLowerCase()} first` : 'No data available')
                                  : 'Search by name or ID'}
                              </span>
                              <ChevronsUpDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                          </PopoverTrigger>
                        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl">
                          <Command shouldFilter={false} className="bg-white">
                            <div className="p-2 border-b border-gray-200 sticky top-0 z-10 bg-white">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <CommandInput
                                value={searchQueries[step.key] || ''}
                                  onValueChange={(value) => handleSearchChange(step.key, value)}
                                  placeholder="Search..."
                                  className="pl-8 h-9"
                              />
                            </div>
                            </div>
                            <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                          {filteredData.length === 0 ? (
                                <CommandEmpty>
                                {!isEnabled
                                ? (step.key === 'locations' ? 'No data available' : `Please select ${ORGANIZATION_STEPS[1].label.toLowerCase()} first`)
                                : 'No data available'}
                                </CommandEmpty>
                          ) : (
                                <CommandGroup>
                                  {/* Select All Option - matching step-subsidiaries design */}
                                  {filteredData.length > 0 && (
                                    <div className="flex items-center justify-between px-2 py-1.5 mt-2 mb-1 border border-dashed border-gray-200 rounded-md bg-gray-50">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const allValues = filteredData.map((item: any) => item[codeField])
                                          const currentSelections = selections[step.key as keyof FilterSelections] as string[]
                                          const allSelected = allValues.every((val: string) => currentSelections.includes(val))
                                          if (allSelected) {
                                            // Deselect all visible
                                            setSelections(prev => {
                                              const prevSelections = prev[step.key as keyof FilterSelections] as string[]
                                              return {
                                                ...prev,
                                                [step.key]: prevSelections.filter((v: string) => !allValues.includes(v))
                                              }
                                            })
                                          } else {
                                            // Select all visible (merge, avoid duplicates)
                                            setSelections(prev => {
                                              const prevSelections = prev[step.key as keyof FilterSelections] as string[]
                                              return {
                                                ...prev,
                                                [step.key]: Array.from(new Set([...prevSelections, ...allValues]))
                                              }
                                            })
                                          }
                                        }}
                                        className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                                      >
                                        <Check
                                          className={`h-4 w-4 rounded-sm border ${
                                            filteredData.length > 0 &&
                                            filteredData.every((item: any) => selections[step.key as keyof FilterSelections].includes(item[codeField]))
                                              ? 'opacity-100 text-green-600 border-green-500'
                                              : 'opacity-70 text-transparent border-gray-300'
                                          }`}
                                        />
                                        <span>Select all ({filteredData.length})</span>
                                      </button>
                                  </div>
                                  )}
                                {filteredData.map((item: any) => {
                                  const value = item[codeField]
                                  const isSelected = selections[step.key as keyof FilterSelections].includes(value)
                                  return (
                                      <CommandItem
                                      key={value}
                                        value={`${value} - ${item.label}`}
                                        onSelect={() => handleToggle(step.key, value)}
                                        className="cursor-pointer"
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 rounded-sm border ${
                                            isSelected
                                              ? 'opacity-100 text-green-600 border-green-500'
                                              : 'opacity-70 text-transparent border-gray-300'
                                          }`}
                                        />
                                        <div className="flex-1">
                                          <div className="font-medium text-sm">{item.label || item.name}</div>
                                          <div className="text-xs text-gray-500">Code: {value}</div>
                                          {step.key === 'locations' && item.city && (
                                            <div className="text-[11px] text-gray-400">
                                              {item.city}{item.stateCode ? `, ${item.stateCode}` : ''}
                                        </div>
                                          )}
                                          {step.key !== 'locations' && item.locationCodes?.length > 0 && (
                                            <div className="text-[11px] text-gray-400">
                                              Locations: {Array.isArray(item.locationCodes) ? item.locationCodes.join(', ') : item.locationCodes}
                                            </div>
                                          )}
                                        </div>
                                      </CommandItem>
                                    )
                                  })}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedCount > 0 && (
                        <Popover 
                          open={selectedItemsPopoverOpen[step.key] || false} 
                          onOpenChange={(open) => setSelectedItemsPopoverOpen(prev => ({ ...prev, [step.key]: open }))}
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="absolute right-0 top-0 bottom-0 inline-flex items-center justify-center min-w-[40px] px-3 bg-blue-600 text-white text-xs font-medium rounded-r-lg shadow-sm hover:bg-blue-700 transition-colors z-10"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedItemsPopoverOpen(prev => ({ ...prev, [step.key]: !prev[step.key] }))
                              }}
                            >
                              {selectedCount}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-80 max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl" align="end">
                            <Command shouldFilter={false} className="bg-white">
                              <div className="p-3 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-gray-700">Selected {step.label}</h4>
                                  <span className="text-xs text-gray-500">{selectedCount} selected</span>
                              </div>
                            </div>
                              <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                                {selectedItems.length === 0 ? (
                                  <CommandEmpty>No items selected</CommandEmpty>
                                ) : (
                                  <CommandGroup>
                                    {selectedItems.map((item: any) => {
                                      const value = item[codeField]
                                      return (
                                        <CommandItem
                                          key={value}
                                          value={`${value} - ${item.label}`}
                                          className="flex items-center justify-between cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2 flex-1">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span className="truncate">{item.label || item.name}</span>
                        </div>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleToggle(step.key, value)
                                            }}
                                            className="text-gray-400 hover:text-red-600 ml-2 p-1 rounded hover:bg-red-50 transition-colors"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </CommandItem>
                                      )
                                    })}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                      </div>
                    </div>
                      )
                    })}
                  </div>

                  {/* Employee Filter - at the end of organization section */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {/* <Label className="text-sm font-semibold text-gray-700 block mb-2">
                      Employee Filter
                    </Label> */}
                    <div className="max-w-md">
                      <EmployeeSearchField
                        isOpen={isOpen && activeSection === 'organization'}
                        preSelectedEmployeeId={employeeSection === 'organization' ? selections.employeeID || undefined : undefined}
                        required={false}
                        onSelect={(employee: Employee) => {
                          setSelections(prev => ({
                            ...prev,
                            employeeID: employee.employeeID
                          }))
                          setSelectedEmployeeID(employee.employeeID)
                          setEmployeeSection('organization') // Mark employee as belonging to 'organization' section
                        }}
                        onClear={() => {
                          setSelections(prev => ({
                            ...prev,
                            employeeID: ''
                          }))
                          setSelectedEmployeeID(null)
                          setEmployeeSection(null) // Clear section tracking
                        }}
                        onEmployeeListChange={handleOrgEmployeeListChange}
                        subsidiaries={selections.subsidiaries}
                        divisions={selections.divisions}
                        departments={selections.departments}
                        locations={selections.locations}
                        contractors={selections.contractors}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Filter employees based on selected organization structure (subsidiaries, divisions, departments, locations)
                    </p>
                  </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contractor Structure Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
              <div className="md:col-span-1">
                <h3 className="text-base font-semibold text-gray-900">Contractor Structure</h3>
                <p className="text-sm text-gray-500 mt-1">Contractor filters and work orders</p>
              </div>
              <div className="md:col-span-2">
                <div className="flex items-center justify-end space-x-2 mb-4">
                  <Checkbox 
                    id="contractor-toggle"
                    checked={activeSection === 'contractor'}
                    onCheckedChange={(checked) => {
                      if (checked) setActiveSection('contractor')
                    }}
                    className="data-[state=checked]:bg-blue-600 border-blue-600"
                  />
                  <Label 
                    htmlFor="contractor-toggle" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Enable
                  </Label>
                </div>
                {activeSection === 'contractor' && (
                  <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                  {CONTRACTOR_STEPS.map((step, index) => {
                  const filteredData = getFilteredData(step.key)
                  const isEnabled = isStepEnabled(step.key)
                  const selectedCount = getSelectedCount(step.key)
                  const codeField = step.key === 'contractors'
                    ? 'contractorCode'
                    : 'workOrderNumber'
                  const isOpen = popoverOpen[step.key] || false

                  const selectedItems = getAllDataForStep(step.key).filter((item: any) => 
                    selections[step.key as keyof FilterSelections].includes(item[codeField])
                  )

                  const IconComponent = step.key === 'contractors' ? Users : FileText

                    return (
                    <div key={step.key} className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700 block">
                        {step.label}
                      </Label>
                      <div className="relative">
                        <Popover open={isOpen} onOpenChange={(open) => setPopoverOpen(prev => ({ ...prev, [step.key]: open }))}>
                          <PopoverTrigger asChild>
                        <button
                              type="button"
                          disabled={!isEnabled}
                              className={`relative w-full h-10 border rounded-lg pl-10 pr-10 text-left transition-all ${
                                !isEnabled ? "bg-gray-50 cursor-not-allowed border-gray-200" : "bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                              }`}
                        >
                              <IconComponent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <span className="block truncate text-sm text-gray-500">
                                {!isEnabled
                                  ? (index === 0 ? 'No data available' : `Select ${CONTRACTOR_STEPS[index - 1].label.toLowerCase()} first`)
                                  : 'Search by name or ID'}
                              </span>
                              <ChevronsUpDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                          </PopoverTrigger>
                        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl">
                          <Command shouldFilter={false} className="bg-white">
                            <div className="p-2 border-b border-gray-200 sticky top-0 z-10 bg-white">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <CommandInput
                                value={searchQueries[step.key] || ''}
                                  onValueChange={(value) => handleSearchChange(step.key, value)}
                                  placeholder="Search..."
                                  className="pl-8 h-9"
                              />
                            </div>
                            </div>
                            <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                          {filteredData.length === 0 ? (
                                <CommandEmpty>
                              {!isEnabled
                                ? (index === 0 
                                    ? 'No data available' 
                                    : `Please select ${CONTRACTOR_STEPS[index - 1].label.toLowerCase()} first`)
                                : 'No data available'}
                                </CommandEmpty>
                          ) : (
                                <CommandGroup>
                                  {/* Select All Option */}
                                  <div className="px-2 py-1.5 border-b border-gray-100">
                                    <label className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors hover:bg-gray-50">
                                      <input
                                        type="checkbox"
                                checked={areAllVisibleItemsSelected(step.key)}
                                        ref={(el) => {
                                          if (el) el.indeterminate = areSomeVisibleItemsSelected(step.key)
                                        }}
                                        onChange={(e) => handleSelectAllCheckbox(step.key, e.target.checked)}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                      />
                                      <span className="text-sm font-medium text-gray-700">Select All</span>
                                      <span className="text-xs text-gray-500 ml-auto">
                                        ({filteredData.length} {filteredData.length === 1 ? 'item' : 'items'})
                                      </span>
                                    </label>
                                  </div>
                                {filteredData.map((item: any) => {
                                  const value = item[codeField]
                                  const isSelected = selections[step.key as keyof FilterSelections].includes(value)
                                  return (
                                      <CommandItem
                                      key={value}
                                        value={`${value} - ${item.label}`}
                                        onSelect={() => handleToggle(step.key, value)}
                                        className="flex items-center justify-between cursor-pointer"
                                      >
                                        <div className="flex items-center gap-2 flex-1">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleToggle(step.key, value)}
                                            onClick={(e) => e.stopPropagation()}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                                      />
                                          <span className="truncate">{item.label}</span>
                                        </div>
                                        <Check className={`h-4 w-4 ml-2 text-green-600 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                                      </CommandItem>
                                    )
                                  })}
                                </CommandGroup>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedCount > 0 && (
                        <Popover 
                          open={selectedItemsPopoverOpen[step.key] || false} 
                          onOpenChange={(open) => setSelectedItemsPopoverOpen(prev => ({ ...prev, [step.key]: open }))}
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              className="absolute right-0 top-0 bottom-0 inline-flex items-center justify-center min-w-[40px] px-3 bg-blue-600 text-white text-xs font-medium rounded-r-lg shadow-sm hover:bg-blue-700 transition-colors z-10"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedItemsPopoverOpen(prev => ({ ...prev, [step.key]: !prev[step.key] }))
                              }}
                            >
                              {selectedCount}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-80 max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl" align="end">
                            <Command shouldFilter={false} className="bg-white">
                              <div className="p-3 border-b border-gray-200">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-sm font-semibold text-gray-700">Selected {step.label}</h4>
                                  <span className="text-xs text-gray-500">{selectedCount} selected</span>
                              </div>
                            </div>
                              <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                                {selectedItems.length === 0 ? (
                                  <CommandEmpty>No items selected</CommandEmpty>
                                ) : (
                                  <CommandGroup>
                                    {selectedItems.map((item: any) => {
                                      const value = item[codeField]
                                      return (
                                        <CommandItem
                                          key={value}
                                          value={`${value} - ${item.label}`}
                                          className="flex items-center justify-between cursor-pointer"
                                        >
                                          <div className="flex items-center gap-2 flex-1">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span className="truncate">{item.label}</span>
                        </div>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              handleToggle(step.key, value)
                                            }}
                                            className="text-gray-400 hover:text-red-600 ml-2 p-1 rounded hover:bg-red-50 transition-colors"
                                          >
                                            <X className="h-4 w-4" />
                                          </button>
                                        </CommandItem>
                                      )
                                    })}
                                  </CommandGroup>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                      </div>
                    </div>
                    )
                  })}
                  </div>

                  {/* Employee Filter - at the end of contractor section */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="max-w-md">
                      <EmployeeSearchField
                        isOpen={isOpen && activeSection === 'contractor'}
                        preSelectedEmployeeId={employeeSection === 'contractor' ? selections.employeeID || undefined : undefined}
                        required={false}
                        onSelect={(employee: Employee) => {
                          setSelections(prev => ({
                            ...prev,
                            employeeID: employee.employeeID
                          }))
                          setSelectedEmployeeID(employee.employeeID)
                          setEmployeeSection('contractor') // Mark employee as belonging to 'contractor' section
                        }}
                        onClear={() => {
                          setSelections(prev => ({
                            ...prev,
                            employeeID: ''
                          }))
                          setSelectedEmployeeID(null)
                          setEmployeeSection(null) // Clear section tracking
                        }}
                        onEmployeeListChange={handleContractorEmployeeListChange}
                        subsidiaries={selections.subsidiaries}
                        divisions={selections.divisions}
                        departments={selections.departments}
                        locations={selections.locations}
                        contractors={selections.contractors}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Filter employees based on selected contractors
                    </p>
                  </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClear}
              className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium"
            >
              Clear All
            </Button>
            <ActionButtons
              layout="end"
              secondaryLabel="Cancel"
              onSecondary={handleCancel}
              primaryLabel="Submit"
              onPrimary={handleApply}
              primaryLoading={false}
              className=""
              primaryClassName="bg-green-600 hover:bg-green-700 text-white"
              secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
