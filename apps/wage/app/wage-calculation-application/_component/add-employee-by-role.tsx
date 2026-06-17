"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useQuery, gql } from "@apollo/client"
import { X, Check, ChevronsUpDown, Building2, Users, Search as SearchIcon, Filter, Trash2, Info } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandInput } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/multiple-employee-search"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/serach/use-aggregate-array-fetch"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"

interface SelectedEmployee {
  _id: string
  employeeID: string
  firstName: string
  middleName?: string
  lastName?: string
}

interface AddEmployeeByRoleProps {
  isOpen: boolean
  tenantCode: string
  onEmployeeSelect: (emp: EmpType) => void
  onMultiSelect: (employees: EmpType[]) => void
  onClear: () => void
  selectedEmployees: SelectedEmployee[]
  errorText?: string
  onSelectAllChange?: (isActive: boolean) => void
  // Send current role filter JSON (designation / grades / category / selectAll) to parent
  onRoleFilterChange?: (filter: {
    designation: { designationCode: string; designationName: string }[]
    grade: { gradeCode: string; gradeName: string }[]
    employeeCategory: string[]
    selectAll: boolean
  }) => void
}

const FETCH_EMPLOYEE_CATEGORIES_QUERY = gql`
  query FetchEmployeeCategories($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationCode
      employeeCategories {
        employeeCategoryCode
        employeeCategoryName
        employeeCategoryDescription
      }
    }
  }
`

// GraphQL query for fetching employees (for Select All mode)
const FETCH_EMPLOYEES_QUERY_BASE = gql`
  query FetchEmployees(
    $criteriaRequests: [CriteriaRequest!]!
    $collection: String!
    $offset: Int
    $limit: Int
  ) {
    fetchEmployees(
      criteriaRequests: $criteriaRequests
      collection: $collection
      offset: $offset
      limit: $limit
    ) {
      _id
      firstName
      middleName
      lastName
      employeeID
      organizationCode
      contractorCode
      tenantCode
    }
  }
`

export default function AddEmployeeByRole({
  isOpen,
  tenantCode,
  onEmployeeSelect,
  onMultiSelect,
  onClear,
  selectedEmployees,
  errorText,
  onSelectAllChange,
  onRoleFilterChange,
}: AddEmployeeByRoleProps) {
  const [selectedDesignations, setSelectedDesignations] = useState<{ designationCode: string; designationName: string }[]>([])
  const [selectedGradeCodes, setSelectedGradeCodes] = useState<{ gradeCode: string; gradeName: string }[]>([])
  const [selectedEmployeeCategoryCodes, setSelectedEmployeeCategoryCodes] = useState<string[]>([])
  
  // Popover open states
  const [popoverOpen, setPopoverOpen] = useState<Record<string, boolean>>({})
  const [selectedItemsPopoverOpen, setSelectedItemsPopoverOpen] = useState<Record<string, boolean>>({})
  
  // Search states for each field
  const [designationSearch, setDesignationSearch] = useState('')
  const [gradesSearch, setGradesSearch] = useState('')
  const [categorySearch, setCategorySearch] = useState('')
  const [employeeIDFilter, setEmployeeIDFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 5
  
  // Select All state
  const [isSelectAllActive, setIsSelectAllActive] = useState(false)
  const [totalCount, setTotalCount] = useState<number | null>(null)
  const [debouncedEmployeeIDFilter, setDebouncedEmployeeIDFilter] = useState('')
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [fetchedEmployees, setFetchedEmployees] = useState<EmpType[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)
  const [deselectMessage, setDeselectMessage] = useState<string | null>(null)
  const prevRoleFiltersRef = useRef<{ designations: { designationCode: string; designationName: string }[]; gradeCodes: { gradeCode: string; gradeName: string }[]; employeeCategoryCodes: string[] } | null>(null)
  
  // Handler for Select All change
  const handleSelectAllChange = (isActive: boolean) => {
    setIsSelectAllActive(isActive)
    if (isActive) {
      // When Select All is activated, clear employee list
      onMultiSelect([])
    } else {
      // When Select All is deactivated, clear all selections
      onMultiSelect([])
    }
     // Inform parent (for validation/state) if handler is provided
     onSelectAllChange?.(isActive)
  }
  
  // Get hierarchy filters and employee ID
  const { hierarchyFilters } = useEmpHierarchy()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFilters)

  // --- Designation / Grade / Category data from organization ---
  const organizationCriteriaRequests = useMemo(
    () => [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode,
      },
    ],
    [tenantCode]
  )

  const organizationVariables = useMemo(
    () => ({
      criteriaRequests: organizationCriteriaRequests,
      collection: "organization",
    }),
    [organizationCriteriaRequests]
  )

  const {
    arrayData: designationsArray,
    loading: designationsLoading,
    refetch: refetchDesignations,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "designations",
    userEntitlement,
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const {
    arrayData: gradesArray,
    loading: gradesLoading,
    refetch: refetchGrades,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "grades",
    userEntitlement,
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { data: employeeCategoriesResponse } = useQuery(FETCH_EMPLOYEE_CATEGORIES_QUERY, {
    client,
    variables: organizationVariables,
    skip: !tenantCode,
    fetchPolicy: "cache-and-network",
  })

  const designations = useMemo(() => {
    if (!Array.isArray(designationsArray) || designationsArray.length === 0) return [] as {
      code: string
      name: string
      description?: string
      divisionCode?: string
      subsidiaryCode?: string
      locationCode?: string | string[]
    }[]
    return designationsArray.map((d: {
      designationCode: string
      designationName: string
      designationDescription?: string
      divisionCode?: string
      subsidiaryCode?: string
      locationCode?: string | string[]
    }) => ({
      code: d.designationCode,
      name: d.designationName,
      description: d.designationDescription,
      divisionCode: d.divisionCode,
      subsidiaryCode: d.subsidiaryCode,
      locationCode: d.locationCode,
    }))
  }, [designationsArray])

  const grades = useMemo(() => {
    if (!Array.isArray(gradesArray) || gradesArray.length === 0) return [] as {
      code: string
      name: string
      description?: string
      designationCode?: string
      divisionCode?: string
      subsidiaryCode?: string
      locationCode?: string | string[]
    }[]
    return gradesArray.map((g: {
      gradeCode: string
      gradeName: string
      gradeDescription?: string
      designationCode?: string
      divisionCode?: string
      subsidiaryCode?: string
      locationCode?: string | string[]
    }) => ({
      code: g.gradeCode,
      name: g.gradeName,
      description: g.gradeDescription,
      designationCode: g.designationCode,
      divisionCode: g.divisionCode,
      subsidiaryCode: g.subsidiaryCode,
      locationCode: g.locationCode,
    }))
  }, [gradesArray])

  const employeeCategories = useMemo(() => {
    const org = employeeCategoriesResponse?.fetchOrganization?.[0]
    if (!org?.employeeCategories) return [] as {
      code: string
      name: string
      description?: string
    }[]
    return org.employeeCategories.map((c: {
      employeeCategoryCode: string
      employeeCategoryName: string
      employeeCategoryDescription?: string
    }) => ({
      code: c.employeeCategoryCode,
      name: c.employeeCategoryName || c.employeeCategoryCode,
      description: c.employeeCategoryDescription,
    }))
  }, [employeeCategoriesResponse])

  // Build role filter JSON for downstream use / debugging
  const roleFilterJson = useMemo(() => {
    return {
      designation: selectedDesignations,
      grade: selectedGradeCodes,
      employeeCategory: selectedEmployeeCategoryCodes,
      selectAll: isSelectAllActive,
    }
  }, [
    selectedDesignations,
    selectedGradeCodes,
    selectedEmployeeCategoryCodes,
    isSelectAllActive,
  ])

  useEffect(() => {
    // Notify parent whenever role filters change
    onRoleFilterChange?.(roleFilterJson)
  }, [roleFilterJson, onRoleFilterChange])

  // When designation, grades, or employee category change, set selectAll to false
  useEffect(() => {
    const currentFilters = {
      designations: selectedDesignations,
      gradeCodes: selectedGradeCodes,
      employeeCategoryCodes: selectedEmployeeCategoryCodes,
    }

    if (prevRoleFiltersRef.current !== null) {
      const prevFilters = prevRoleFiltersRef.current
      const filtersChanged =
        JSON.stringify(prevFilters.designations) !== JSON.stringify(currentFilters.designations) ||
        JSON.stringify(prevFilters.gradeCodes) !== JSON.stringify(currentFilters.gradeCodes) ||
        JSON.stringify(prevFilters.employeeCategoryCodes) !== JSON.stringify(currentFilters.employeeCategoryCodes)

      if (filtersChanged && isSelectAllActive) {
        handleSelectAllChange(false)
      }
    }

    prevRoleFiltersRef.current = currentFilters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDesignations, selectedGradeCodes, selectedEmployeeCategoryCodes])

  // Debounce employee ID filter for search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedEmployeeIDFilter(employeeIDFilter)
      setPage(1)
    }, 500)
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [employeeIDFilter])

  // Reset all selections when component is closed or opened
  useEffect(() => {
    if (!isOpen) {
      setSelectedDesignations([])
      setSelectedGradeCodes([])
      setSelectedEmployeeCategoryCodes([])
      setPopoverOpen({})
      setSelectedItemsPopoverOpen({})
      setDesignationSearch('')
      setGradesSearch('')
      setCategorySearch('')
      setEmployeeIDFilter('')
      setDebouncedEmployeeIDFilter('')
      setPage(1)
      setIsSelectAllActive(false)
      setTotalCount(null)
      setFetchedEmployees([])
      setLoadingEmployees(false)
      setDeselectMessage(null)
      prevRoleFiltersRef.current = null
    }
  }, [isOpen])

  // Build effective hierarchy filters for GraphQL
  const effectiveHierarchyFilters = useMemo(() => {
    const filters: {
      subsidiary?: string[]
      division?: string[]
      department?: string[]
      location?: string[]
      contractor?: string[]
    } = {}
    
    if (hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0) {
      filters.subsidiary = hierarchyFilters.subsidiaries
    }
    if (hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0) {
      filters.division = hierarchyFilters.divisions
    }
    if (hierarchyFilters?.departments && hierarchyFilters.departments.length > 0) {
      filters.department = hierarchyFilters.departments
    }
    if (hierarchyFilters?.locations && hierarchyFilters.locations.length > 0) {
      filters.location = hierarchyFilters.locations
    }
    if (hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0) {
      filters.contractor = hierarchyFilters.contractors
    }
    
    return Object.keys(filters).length > 0 ? filters : undefined
  }, [hierarchyFilters])

  // Build GraphQL query dynamically with hierarchyFilters and userEntitlement
  const FETCH_EMPLOYEES_QUERY = useMemo(() => {
    const hasHierarchyFilters = effectiveHierarchyFilters && Object.keys(effectiveHierarchyFilters).length > 0
    const hasUserEntitlement = userEntitlement && Object.keys(userEntitlement).length > 0

    if (!hasHierarchyFilters && !hasUserEntitlement) {
      return FETCH_EMPLOYEES_QUERY_BASE
    }

    // Build hierarchyFilters string inline
    const hierarchyFiltersString = hasHierarchyFilters
      ? Object.entries(effectiveHierarchyFilters!)
        .map(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`
          }
          return ''
        })
        .filter(Boolean)
        .join(', ')
      : ''

    // Build userEntitlement string inline
    const userEntitlementString = hasUserEntitlement
      ? Object.entries(userEntitlement!)
        .map(([key, value]) => {
          if (key === 'employeeID' && typeof value === 'string') {
            return `${key}: "${value}"`
          } else if (Array.isArray(value) && value.length > 0) {
            return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`
          }
          return ''
        })
        .filter(Boolean)
        .join(', ')
      : ''

    // Build query parameters
    const queryParams: string[] = []
    if (hierarchyFiltersString) {
      queryParams.push(`hierarchyFilters: { ${hierarchyFiltersString} }`)
    }
    if (userEntitlementString) {
      queryParams.push(`userEntitlement: { ${userEntitlementString} }`)
    }

    const queryString = `
      query FetchEmployees(
        $criteriaRequests: [CriteriaRequest!]!
        $collection: String!
        $offset: Int
        $limit: Int
      ) {
        fetchEmployees(
          criteriaRequests: $criteriaRequests
          collection: $collection
          offset: $offset
          limit: $limit
          ${queryParams.join('\n          ')}
        ) {
          _id
          firstName
          middleName
          lastName
          employeeID
          organizationCode
          contractorCode
          tenantCode
        }
      }
    `
    return gql(queryString)
  }, [effectiveHierarchyFilters, userEntitlement])

  // Build GraphQL query variables for Select All mode
  const employeesQueryVariables = useMemo<{ criteriaRequests: any[]; collection: string; offset: number; limit: number } | undefined>(() => {
    if (!isSelectAllActive) return undefined
    
    const criteriaRequests: any[] = []
    criteriaRequests.push({
      field: 'tenantCode',
      operator: 'eq',
      value: tenantCode,
    })

    // Add role-based filters
    if (selectedDesignations.length > 0) {
      criteriaRequests.push({
        field: 'deployment.designation.designationCode',
        operator: 'in',
        value: selectedDesignations.map(d => d.designationCode),
      })
    }

    if (selectedGradeCodes && selectedGradeCodes.length > 0) {
      criteriaRequests.push({
        field: 'deployment.grade.gradeCode',
        operator: 'in',
        value: selectedGradeCodes.map(g => g.gradeCode),
      })
    }

    if (selectedEmployeeCategoryCodes && selectedEmployeeCategoryCodes.length > 0) {
      criteriaRequests.push({
        field: 'deployment.employeeCategory.employeeCategoryCode',
        operator: 'in',
        value: selectedEmployeeCategoryCodes,
      })
    }

    // Add search filter with "like" operator
    if (debouncedEmployeeIDFilter.trim()) {
      criteriaRequests.push({
        field: 'employeeID',
        operator: 'like',
        value: debouncedEmployeeIDFilter.trim(),
      })
    }

    const offset = (page - 1) * pageSize

    return {
      criteriaRequests,
      collection: 'contract_employee',
      offset: offset,
      limit: pageSize,
    } as { criteriaRequests: any[]; collection: string; offset: number; limit: number }
  }, [isSelectAllActive, tenantCode, selectedDesignations, selectedGradeCodes, selectedEmployeeCategoryCodes, debouncedEmployeeIDFilter, page, pageSize])

  // Fetch employees using GraphQL when Select All is active
  const {
    data: employeesData,
    loading: employeesLoading,
    error: employeesError,
  } = useQuery(FETCH_EMPLOYEES_QUERY, {
    client,
    variables: employeesQueryVariables || {},
    skip: !isSelectAllActive || !employeesQueryVariables,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      if (data?.fetchEmployees) {
        const mapped: EmpType[] = (data.fetchEmployees || []).map((e: any) => ({
          _id: e._id,
          employeeID: e.employeeID || '',
          firstName: e.firstName || '',
          middleName: e.middleName,
          lastName: e.lastName,
          organizationCode: e.organizationCode,
          contractorCode: e.contractorCode,
          tenantCode: e.tenantCode,
        }))
        setFetchedEmployees(mapped)
        setLoadingEmployees(false)
      }
    },
    onError: (err) => {
      console.error('Error fetching employees:', err)
      setFetchedEmployees([])
      setLoadingEmployees(false)
    },
  })

  useEffect(() => {
    if (employeesLoading) {
      setLoadingEmployees(true)
    }
  }, [employeesLoading])

  // Build count request data for Select All mode
  const countRequestData = useMemo(() => {
    if (!isSelectAllActive) return undefined
    
    const criteriaRequests: any[] = []
    criteriaRequests.push({
      field: 'tenantCode',
      operator: 'eq',
      value: tenantCode,
    })

    // Add role-based filters
    if (selectedDesignations.length > 0) {
      criteriaRequests.push({
        field: 'deployment.designation.designationCode',
        operator: 'in',
        value: selectedDesignations.map(d => d.designationCode),
      })
    }

    if (selectedGradeCodes && selectedGradeCodes.length > 0) {
      criteriaRequests.push({
        field: 'deployment.grade.gradeCode',
        operator: 'in',
        value: selectedGradeCodes.map(g => g.gradeCode),
      })
    }

    if (selectedEmployeeCategoryCodes && selectedEmployeeCategoryCodes.length > 0) {
      criteriaRequests.push({
        field: 'deployment.employeeCategory.employeeCategoryCode',
        operator: 'in',
        value: selectedEmployeeCategoryCodes,
      })
    }

    // Add search filter with "like" operator
    if (debouncedEmployeeIDFilter.trim()) {
      criteriaRequests.push({
        field: 'employeeID',
        operator: 'like',
        value: debouncedEmployeeIDFilter.trim(),
      })
    }

    // Build hierarchyFilters object (always include, even if empty)
    const hierarchyFiltersObj: any = {}
    if (hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0) {
      hierarchyFiltersObj.subsidiary = hierarchyFilters.subsidiaries
    }
    if (hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0) {
      hierarchyFiltersObj.division = hierarchyFilters.divisions
    }
    if (hierarchyFilters?.departments && hierarchyFilters.departments.length > 0) {
      hierarchyFiltersObj.department = hierarchyFilters.departments
    }
    if (hierarchyFilters?.locations && hierarchyFilters.locations.length > 0) {
      hierarchyFiltersObj.location = hierarchyFilters.locations
    }
    if (hierarchyFilters?.contractors && hierarchyFilters.contractors.length > 0) {
      hierarchyFiltersObj.contractor = hierarchyFilters.contractors
    }

    return {
      hierarchyFilters: hierarchyFiltersObj,
      criteriaRequests,
      userEntitlement: userEntitlement,
    }
  }, [isSelectAllActive, tenantCode, selectedDesignations, selectedGradeCodes, selectedEmployeeCategoryCodes, debouncedEmployeeIDFilter, hierarchyFilters, userEntitlement])

  // Count API call to get total collection length - only process when Select All is active
  const {
    data: countData,
    loading: countLoading,
    error: countError,
    refetch: refetchCount,
  } = useRequest<any>({
    url: 'contract_employee/count/searchWithHierarchy',
    method: 'POST',
    data: countRequestData,
    onSuccess: (data: any) => {
      // Only process if Select All is active
      if (isSelectAllActive && data !== null && data !== undefined) {
        setTotalCount(data || 0)
      }
    },
    onError: (error: any) => {
      // Only log errors if Select All is active
      if (isSelectAllActive) {
        console.error("Error fetching contract employee count:", error)
        setTotalCount(null)
      }
    },
    dependencies: [] // Empty dependencies - requests will only be made via manual refetch
  })

  // Refetch count when filters change (with debounce)
  useEffect(() => {
    if (isSelectAllActive && countRequestData) {
      const timer = setTimeout(() => {
        refetchCount()
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setTotalCount(null)
    }
  }, [isSelectAllActive, countRequestData, refetchCount])

  // Filter employees by employeeID (only when not in Select All mode)
  const filteredEmployees = useMemo(() => {
    if (isSelectAllActive) {
      // In Select All mode, we don't show individual employees
      return []
    }
    if (!employeeIDFilter.trim()) {
      return selectedEmployees
    }
    const searchTerm = employeeIDFilter.toLowerCase().trim()
    return selectedEmployees.filter(emp => 
      emp.employeeID.toLowerCase().includes(searchTerm)
    )
  }, [selectedEmployees, employeeIDFilter, isSelectAllActive])

  // Paginated employees (only when not in Select All mode)
  const paginatedEmployees = useMemo(() => {
    if (isSelectAllActive) {
      return []
    }
    return filteredEmployees.slice((page - 1) * pageSize, page * pageSize)
  }, [filteredEmployees, page, pageSize, isSelectAllActive])

  // Helper functions for filtering data
  const getFilteredDesignations = useMemo(() => {
    const query = designationSearch.toLowerCase().trim()
    if (!query) return designations
    return designations.filter((item: any) => {
      if (!item || !item.code) return false
      return item.name?.toLowerCase().includes(query) || item.code?.toLowerCase().includes(query)
    })
  }, [designations, designationSearch])

  const getFilteredGrades = useMemo(() => {
  const query = gradesSearch.toLowerCase().trim()
  let filtered = grades  // ← Show all grades, no filtering by designation
  if (!query) return filtered
  return filtered.filter((item: any) => {
    if (!item || !item.code) return false
    return item.name?.toLowerCase().includes(query) || item.code?.toLowerCase().includes(query)
  })
}, [grades, gradesSearch])

  const getFilteredEmployeeCategories = useMemo(() => {
    const query = categorySearch.toLowerCase().trim()
    if (!query) return employeeCategories
    return employeeCategories.filter((item: any) => {
      if (!item || !item.code) return false
      return item.name?.toLowerCase().includes(query) || item.code?.toLowerCase().includes(query)
    })
  }, [employeeCategories, categorySearch])

  // Handle toggle for designations (multi select)
  const handleDesignationToggle = (designationCode: string, designationName: string) => {
    setSelectedDesignations(prev =>
      prev.some(d => d.designationCode === designationCode)
        ? prev.filter(d => d.designationCode !== designationCode)
        : [...prev, { designationCode, designationName }]
    )
  }

  // Handle select all for designations
  const handleSelectAllDesignations = () => {
    const allDesignations = getFilteredDesignations.map((d: any) => ({ designationCode: d.code, designationName: d.name }))
    const allSelected = allDesignations.every(d => selectedDesignations.some(s => s.designationCode === d.designationCode))
    if (allSelected) {
      setSelectedDesignations(prev => prev.filter(d => !allDesignations.some(ad => ad.designationCode === d.designationCode)))
    } else {
      const newDesignations = allDesignations.filter(d => !selectedDesignations.some(s => s.designationCode === d.designationCode))
      setSelectedDesignations(prev => [...prev, ...newDesignations])
    }
  }

  // Handle toggle for grades (multi select)
  const handleGradeToggle = (gradeCode: string, gradeName: string) => {
    setSelectedGradeCodes(prev =>
      prev.some(g => g.gradeCode === gradeCode)
        ? prev.filter(g => g.gradeCode !== gradeCode)
        : [...prev, { gradeCode, gradeName }]
    )
  }

  // Handle toggle for categories (multi select)
  const handleCategoryToggle = (code: string) => {
    setSelectedEmployeeCategoryCodes(prev => 
      prev.includes(code) 
        ? prev.filter(c => c !== code)
        : [...prev, code]
    )
  }

  // Handle select all for grades
  const handleSelectAllGrades = () => {
    const allGrades = getFilteredGrades.map((g: any) => ({ gradeCode: g.code, gradeName: g.name }))
    const allSelected = allGrades.every((g) => selectedGradeCodes.some(s => s.gradeCode === g.gradeCode))
    if (allSelected) {
      setSelectedGradeCodes(prev => prev.filter(g => !allGrades.some(ag => ag.gradeCode === g.gradeCode)))
    } else {
      const newGrades = allGrades.filter(g => !selectedGradeCodes.some(s => s.gradeCode === g.gradeCode))
      setSelectedGradeCodes(prev => [...prev, ...newGrades])
    }
  }

  // Handle select all for categories
  const handleSelectAllCategories = () => {
    const allCodes = getFilteredEmployeeCategories.map((c: any) => c.code)
    const allSelected = allCodes.every((code: string) => selectedEmployeeCategoryCodes.includes(code))
    if (allSelected) {
      setSelectedEmployeeCategoryCodes(prev => prev.filter(c => !allCodes.includes(c)))
    } else {
      setSelectedEmployeeCategoryCodes(prev => Array.from(new Set([...prev, ...allCodes])))
    }
  }

  if (!isOpen) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="mb-4">
        <Label className="text-sm font-medium text-gray-900">Filter by Role</Label>
        <p className="text-xs text-gray-500 mt-0.5">Select designation, grades, and employee categories</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Designation Field */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 block">
            Designation
          </Label>
          <div className="relative">
            <Popover 
              open={popoverOpen['designation'] || false} 
              onOpenChange={(open) => setPopoverOpen(prev => ({ ...prev, 'designation': open }))}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative w-full h-9 rounded-md border border-gray-300 bg-white px-3 py-1.5 pl-10 pr-10 text-left text-sm transition focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                >
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <span className="block truncate text-sm text-gray-500">
                    Search by name or ID
                  </span>
                  <ChevronsUpDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${popoverOpen['designation'] ? 'rotate-180' : ''}`} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl">
                <Command shouldFilter={false} className="bg-white">
                  <div className="p-2 border-b border-gray-200 sticky top-0 z-10 bg-white">
                    <div className="relative">
                      <CommandInput
                        value={designationSearch}
                        onValueChange={(value) => setDesignationSearch(value)}
                        placeholder="Search..."
                        className="pl-8 h-9"
                      />
                    </div>
                  </div>
                  <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                    {getFilteredDesignations.length === 0 ? (
                      <CommandEmpty>No designations found</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {/* Select All Option */}
                        {getFilteredDesignations.length > 0 && (
                          <div className="flex items-center justify-between px-2 py-1.5 mt-2 mb-1 border border-dashed border-gray-200 rounded-md bg-gray-50">
                            <button
                              type="button"
                              onClick={handleSelectAllDesignations}
                              className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                            >
                              <Check
                                className={`h-4 w-4 rounded-sm border ${
                                  getFilteredDesignations.length > 0 &&
                                  getFilteredDesignations.every((item: any) => selectedDesignations.some(d => d.designationCode === item.code))
                                    ? 'opacity-100 text-green-600 border-green-500'
                                    : 'opacity-70 text-transparent border-gray-300'
                                }`}
                              />
                              <span>Select all ({getFilteredDesignations.length})</span>
                            </button>
                          </div>
                        )}
                        {getFilteredDesignations.map((item: any) => {
                          const isSelected = selectedDesignations.some(d => d.designationCode === item.code)
                          return (
                            <CommandItem
                              key={item.code}
                              value={`${item.code} - ${item.name}`}
                              onSelect={() => handleDesignationToggle(item.code, item.name)}
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
                                <div className="font-medium text-sm">{item.name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">Code: {item.code}</div>
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
            {selectedDesignations.length > 0 && (
              <Popover
                open={selectedItemsPopoverOpen['designation'] || false}
                onOpenChange={(open) => setSelectedItemsPopoverOpen(prev => ({ ...prev, 'designation': open }))}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="absolute right-0 top-0 bottom-0 inline-flex items-center justify-center min-w-[40px] px-3 bg-blue-600 text-white text-xs font-medium rounded-r-lg shadow-sm hover:bg-blue-700 transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedItemsPopoverOpen(prev => ({ ...prev, 'designation': !prev['designation'] }))
                    }}
                  >
                    {selectedDesignations.length}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-80 max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl" align="end">
                  <Command shouldFilter={false} className="bg-white">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700">Selected Designations</h4>
                        <span className="text-xs text-gray-500">{selectedDesignations.length} selected</span>
                      </div>
                    </div>
                    <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                      {selectedDesignations.length === 0 ? (
                        <CommandEmpty>No items selected</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {selectedDesignations.map((designation) => (
                            <CommandItem
                              key={designation.designationCode}
                              value={`${designation.designationCode} - ${designation.designationName}`}
                              className="flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <Check className="h-4 w-4 text-green-600" />
                                <span className="truncate">{designation.designationName}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDesignationToggle(designation.designationCode, designation.designationName)
                                }}
                                className="text-gray-400 hover:text-red-600 ml-2 p-1 rounded hover:bg-red-50 transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        {/* Grades Field */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 block">
            Grades
          </Label>
          <div className="relative">
            <Popover 
              open={popoverOpen['grades'] || false} 
              onOpenChange={(open) => setPopoverOpen(prev => ({ ...prev, 'grades': open }))}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`relative w-full h-9 rounded-md border px-3 py-1.5 pl-10 pr-10 text-left text-sm transition ${
                    "bg-white border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                  }`}
                >
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <span className="block truncate text-sm text-gray-500">
                    Search by name or ID
                  </span>
                  <ChevronsUpDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${popoverOpen['grades'] ? 'rotate-180' : ''}`} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl">
                <Command shouldFilter={false} className="bg-white">
                  <div className="p-2 border-b border-gray-200 sticky top-0 z-10 bg-white">
                    <div className="relative">
                      <CommandInput
                        value={gradesSearch}
                        onValueChange={(value) => setGradesSearch(value)}
                        placeholder="Search..."
                        className="pl-8 h-9"
                      />
                    </div>
                  </div>
                  <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                    {getFilteredGrades.length === 0 ? (
                      <CommandEmpty>
                        No grades found
                      </CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {/* Select All Option */}
                        {getFilteredGrades.length > 0 && (
                          <div className="flex items-center justify-between px-2 py-1.5 mt-2 mb-1 border border-dashed border-gray-200 rounded-md bg-gray-50">
                            <button
                              type="button"
                              onClick={handleSelectAllGrades}
                              className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                            >
                              <Check
                                className={`h-4 w-4 rounded-sm border ${
                                  getFilteredGrades.length > 0 &&
                                  getFilteredGrades.every((item: any) => selectedGradeCodes.some(g => g.gradeCode === item.code))
                                    ? 'opacity-100 text-green-600 border-green-500'
                                    : 'opacity-70 text-transparent border-gray-300'
                                }`}
                              />
                              <span>Select all ({getFilteredGrades.length})</span>
                            </button>
                          </div>
                        )}
                        {getFilteredGrades.map((item: any) => {
                          const isSelected = selectedGradeCodes.some(g => g.gradeCode === item.code)
                          return (
                            <CommandItem
                              key={item.code}
                              value={`${item.code} - ${item.name}`}
                              onSelect={() => handleGradeToggle(item.code, item.name)}
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
                                <div className="font-medium text-sm">{item.name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">Code: {item.code}</div>
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
            {selectedGradeCodes.length > 0 && (
              <Popover 
                open={selectedItemsPopoverOpen['grades'] || false} 
                onOpenChange={(open) => setSelectedItemsPopoverOpen(prev => ({ ...prev, 'grades': open }))}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="absolute right-0 top-0 bottom-0 inline-flex items-center justify-center min-w-[40px] px-3 bg-blue-600 text-white text-xs font-medium rounded-r-lg shadow-sm hover:bg-blue-700 transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedItemsPopoverOpen(prev => ({ ...prev, 'grades': !prev['grades'] }))
                    }}
                  >
                    {selectedGradeCodes.length}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-80 max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl" align="end">
                  <Command shouldFilter={false} className="bg-white">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700">Selected Grades</h4>
                        <span className="text-xs text-gray-500">{selectedGradeCodes.length} selected</span>
                      </div>
                    </div>
                    <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                      {selectedGradeCodes.length === 0 ? (
                        <CommandEmpty>No items selected</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {selectedGradeCodes.map((grade) => {
                            const item = grades.find((g: any) => g.code === grade.gradeCode)
                            return item ? (
                              <CommandItem
                                key={grade.gradeCode}
                                value={`${grade.gradeCode} - ${grade.gradeName}`}
                                className="flex items-center justify-between cursor-pointer"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <Check className="h-4 w-4 text-green-600" />
                                  <span className="truncate">{grade.gradeName}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleGradeToggle(grade.gradeCode, grade.gradeName)
                                  }}
                                  className="text-gray-400 hover:text-red-600 ml-2 p-1 rounded hover:bg-red-50 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </CommandItem>
                            ) : null
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

        {/* Employee Category Field */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-gray-700 block">
            Employee Category
          </Label>
          <div className="relative">
            <Popover 
              open={popoverOpen['employeeCategory'] || false} 
              onOpenChange={(open) => setPopoverOpen(prev => ({ ...prev, 'employeeCategory': open }))}
            >
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative w-full h-9 rounded-md border border-gray-300 bg-white px-3 py-1.5 pl-10 pr-10 text-left text-sm transition focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                >
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <span className="block truncate text-sm text-gray-500">
                    Search by name or ID
                  </span>
                  <ChevronsUpDown className={`absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 transition-transform ${popoverOpen['employeeCategory'] ? 'rotate-180' : ''}`} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl">
                <Command shouldFilter={false} className="bg-white">
                  <div className="p-2 border-b border-gray-200 sticky top-0 z-10 bg-white">
                    <div className="relative">
                      <CommandInput
                        value={categorySearch}
                        onValueChange={(value) => setCategorySearch(value)}
                        placeholder="Search..."
                        className="pl-8 h-9"
                      />
                    </div>
                  </div>
                  <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                    {getFilteredEmployeeCategories.length === 0 ? (
                      <CommandEmpty>No categories found</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {/* Select All Option */}
                        {getFilteredEmployeeCategories.length > 0 && (
                          <div className="flex items-center justify-between px-2 py-1.5 mt-2 mb-1 border border-dashed border-gray-200 rounded-md bg-gray-50">
                            <button
                              type="button"
                              onClick={handleSelectAllCategories}
                              className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                            >
                              <Check
                                className={`h-4 w-4 rounded-sm border ${
                                  getFilteredEmployeeCategories.length > 0 &&
                                  getFilteredEmployeeCategories.every((item: any) => selectedEmployeeCategoryCodes.includes(item.code))
                                    ? 'opacity-100 text-green-600 border-green-500'
                                    : 'opacity-70 text-transparent border-gray-300'
                                }`}
                              />
                              <span>Select all ({getFilteredEmployeeCategories.length})</span>
                            </button>
                          </div>
                        )}
                        {getFilteredEmployeeCategories.map((item: any) => {
                          const isSelected = selectedEmployeeCategoryCodes.includes(item.code)
                          return (
                            <CommandItem
                              key={item.code}
                              value={`${item.code} - ${item.name}`}
                              onSelect={() => handleCategoryToggle(item.code)}
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
                                <div className="font-medium text-sm">{item.name || 'N/A'}</div>
                                <div className="text-xs text-gray-500">Code: {item.code}</div>
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
            {selectedEmployeeCategoryCodes.length > 0 && (
              <Popover 
                open={selectedItemsPopoverOpen['employeeCategory'] || false} 
                onOpenChange={(open) => setSelectedItemsPopoverOpen(prev => ({ ...prev, 'employeeCategory': open }))}
              >
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="absolute right-0 top-0 bottom-0 inline-flex items-center justify-center min-w-[40px] px-3 bg-blue-600 text-white text-xs font-medium rounded-r-lg shadow-sm hover:bg-blue-700 transition-colors z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedItemsPopoverOpen(prev => ({ ...prev, 'employeeCategory': !prev['employeeCategory'] }))
                    }}
                  >
                    {selectedEmployeeCategoryCodes.length}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-80 max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl" align="end">
                  <Command shouldFilter={false} className="bg-white">
                    <div className="p-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-gray-700">Selected Categories</h4>
                        <span className="text-xs text-gray-500">{selectedEmployeeCategoryCodes.length} selected</span>
                      </div>
                    </div>
                    <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                      {selectedEmployeeCategoryCodes.length === 0 ? (
                        <CommandEmpty>No items selected</CommandEmpty>
                      ) : (
                        <CommandGroup>
                          {selectedEmployeeCategoryCodes.map((code) => {
                            const item = employeeCategories.find((c: any) => c.code === code)
                            return item ? (
                              <CommandItem
                                key={code}
                                value={`${code} - ${item.name}`}
                                className="flex items-center justify-between cursor-pointer"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  <Check className="h-4 w-4 text-green-600" />
                                  <span className="truncate">{item.name}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCategoryToggle(code)
                                  }}
                                  className="text-gray-400 hover:text-red-600 ml-2 p-1 rounded hover:bg-red-50 transition-colors"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </CommandItem>
                            ) : null
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
      </div>
      
      {/* Employee Search Field - Filtered by Role */}
      {(selectedDesignations.length > 0 || selectedGradeCodes.length > 0 || selectedEmployeeCategoryCodes.length > 0) && (
        <div className="mt-4 space-y-2">
          <Label className="text-sm font-semibold text-gray-700 block">
            Employees <span className="text-red-500">*</span>
          </Label>
          <EmployeeSearchField
            label=""
            required={false}
            isOpen={isOpen}
            multiSelect={true}
            selectAll={{ permission: true, value: isSelectAllActive }}
            errorText={errorText}
            designationCode={selectedDesignations[0]?.designationCode || undefined}
            gradeCodes={selectedGradeCodes.length > 0 ? selectedGradeCodes.map(g => g.gradeCode) : undefined}
            employeeCategoryCodes={selectedEmployeeCategoryCodes.length > 0 ? selectedEmployeeCategoryCodes : undefined}
            onSelect={onEmployeeSelect}
            onMultiSelect={(employees) => {
              // When Select All is active, pass empty array instead of employee list
              if (isSelectAllActive) {
                onMultiSelect([])
              } else {
                onMultiSelect(employees)
              }
            }}
            onSelectAllChange={handleSelectAllChange}
            onClear={onClear}
          />
          {isSelectAllActive && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700 font-medium">
                All employees matching the selected criteria are selected ({totalCount !== null ? totalCount : '...'} employees)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Employee ID Filter */}
      <div className="mt-4 flex bg-muted/50 rounded-lg border">
        {/* Field Selection */}
        <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
          <Filter className="w-4 h-4 text-muted-foreground mr-2" />
          <span className="text-sm font-medium text-foreground">Employee ID</span>
        </div>

        {/* Search Field */}
        <div className="flex-1 flex items-center bg-background rounded-r-lg">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by Employee ID..."
              value={employeeIDFilter}
              onChange={(e) => {
                setEmployeeIDFilter(e.target.value)
                setPage(1)
              }}
              className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
            />
          </div>
        </div>
      </div>

      {/* Selected Employees Table - Separate table for role-based selection */}
      {!isSelectAllActive && (
        <div className="mt-4 border rounded-lg bg-blue-50/40">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50 hover:bg-blue-50">
                <TableHead className="py-2 pl-4 text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
                  Employee ID
                </TableHead>
                <TableHead className="py-2 text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
                  Name
                </TableHead>
                <TableHead className="py-2 pr-4 text-[11px] font-semibold text-blue-700 uppercase tracking-wide text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp) => {
                  const fullName = [
                    emp.firstName,
                    emp.middleName,
                    emp.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ")
                  return (
                    <TableRow
                      key={emp.employeeID}
                      className="hover:bg-blue-50/80 odd:bg-white even:bg-blue-50/60 transition-colors"
                    >
                      <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                        {emp.employeeID}
                      </TableCell>
                      <TableCell className="py-1.5 text-sm text-gray-900">
                        {fullName || '-'}
                      </TableCell>
                      <TableCell className="py-1.5 pr-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                          onClick={() => {
                            // Remove employee from selection
                            const updated = selectedEmployees.filter(e => e.employeeID !== emp.employeeID)
                            onMultiSelect(updated.map(e => ({
                              _id: e._id,
                              employeeID: e.employeeID,
                              firstName: e.firstName,
                              middleName: e.middleName,
                              lastName: e.lastName,
                            })))
                            // If Select All was active and any employee is deselected, set selectAll to false
                            if (isSelectAllActive) {
                              handleSelectAllChange(false)
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="py-8 text-center text-sm text-gray-500">
                    No employees selected. Apply role filters and select employees above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* Pagination */}
          {filteredEmployees.length > pageSize && (
            <div className="flex items-center justify-between px-4 py-2 border-t bg-blue-50">
              <p className="text-[11px] text-gray-500">
                Showing{' '}
                <span className="font-semibold">
                  {Math.min((page - 1) * pageSize + 1, filteredEmployees.length)}-
                  {Math.min(page * pageSize, filteredEmployees.length)}
                </span>{' '}
                of <span className="font-semibold">{filteredEmployees.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-6 px-2 text-[11px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <button
                  type="button"
                  className="h-6 px-2 text-[11px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page * pageSize >= filteredEmployees.length}
                  onClick={() =>
                    setPage((p) =>
                      p * pageSize >= filteredEmployees.length ? p : p + 1
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Deselect Message */}
      {deselectMessage && (
        <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-blue-50 text-blue-800 border border-blue-200">
          <Info className="h-4 w-4 flex-shrink-0" />
          <span>{deselectMessage}</span>
          <button
            type="button"
            onClick={() => setDeselectMessage(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Employees Table for Select All mode */}
      {isSelectAllActive && (
        <div className="mt-4 border rounded-lg bg-blue-50/40">
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-50 hover:bg-blue-50">
                <TableHead className="py-2 pl-4 text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
                  Employee ID
                </TableHead>
                <TableHead className="py-2 pr-4 text-[11px] font-semibold text-blue-700 uppercase tracking-wide">
                  Name
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingEmployees ? (
                <TableRow>
                  <TableCell colSpan={2} className="py-8 text-center text-sm text-gray-500">
                    Loading employees...
                  </TableCell>
                </TableRow>
              ) : fetchedEmployees.length > 0 ? (
                fetchedEmployees.map((emp) => {
                  const fullName = [
                    emp.firstName,
                    emp.middleName,
                    emp.lastName,
                  ]
                    .filter(Boolean)
                    .join(" ")
                  return (
                    <TableRow
                      key={emp.employeeID}
                      className="hover:bg-blue-50/80 odd:bg-white even:bg-blue-50/60 transition-colors"
                    >
                      <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                        {emp.employeeID}
                      </TableCell>
                      <TableCell className="py-1.5 pr-4 text-sm text-gray-900">
                        {fullName || '-'}
                      </TableCell>
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="py-8 text-center text-sm text-gray-500">
                    No employees found matching the criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {/* Pagination for Select All mode */}
          {totalCount !== null && totalCount > 0 && (
            <div className="flex items-center justify-between px-4 py-2 border-t bg-blue-50">
              <p className="text-[11px] text-gray-500">
                Showing{' '}
                <span className="font-semibold">
                  {Math.min((page - 1) * pageSize + 1, totalCount)}-
                  {Math.min(page * pageSize, totalCount)}
                </span>{' '}
                of <span className="font-semibold">{totalCount}</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-6 px-2 text-[11px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page === 1 || loadingEmployees}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>
                <span className="text-[11px] text-gray-500">
                  Page {page} of {Math.ceil(totalCount / pageSize)}
                </span>
                <button
                  type="button"
                  className="h-6 px-2 text-[11px] border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={page * pageSize >= totalCount || loadingEmployees}
                  onClick={() =>
                    setPage((p) =>
                      p * pageSize >= totalCount ? p : p + 1
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {errorText && (
        <p className="text-sm text-red-600 mt-2">{errorText}</p>
      )}
    </div>
  )
}

