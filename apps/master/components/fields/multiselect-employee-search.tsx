"use client"

import React, { useEffect, useState, useRef, useMemo } from "react"
import { useQuery, gql } from '@apollo/client'
import { client } from '@repo/ui/hooks/api/dynamic-graphql'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertCircle, Search, X, Check, Info, AlertTriangle } from "lucide-react"
import { useEmpHierarchy } from '@/hooks/hierarchy/emp-hierarchy'
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode'
import { useKeyclockRoleInfo } from '@/hooks/api/search/keyclock-role-info'
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"

export interface Employee {
  _id: string
  employeeID: string
  firstName: string
  middleName?: string
  lastName?: string
  organizationCode?: string
  contractorCode?: string
  tenantCode?: string
}

interface EmployeeSearchFieldProps {
  label?: string
  required?: boolean
  isOpen?: boolean
  preSelectedEmployeeId?: string
  errorText?: string
  onSelect: (employee: Employee) => void
  onClear?: () => void
  onEmployeeListChange?: (employees: Employee[]) => void
  organizationCode?: string
  multiSelect?: boolean
  onMultiSelect?: (employees: Employee[]) => void
  hierarchyFilters?: {
    subsidiary?: string[]
    division?: string[]
    department?: string[]
    location?: string[]
    contractor?: string[]
  }
  // Filters from step-by-step-filter component
  subsidiaries?: string[]
  divisions?: string[]
  departments?: string[]
  subDepartments?: string[]
  sections?: string[]
  locations?: string[]
  contractors?: string[]
  // Role-based filters
  designationCode?: string
  gradeCodes?: string[]
  employeeCategoryCodes?: string[]
  // Select All functionality
  selectAll?: { permission: boolean; value: boolean }
  onSelectAllChange?: (isSelectAll: boolean) => void
}

// Base GraphQL query for fetching employees (without hierarchyFilters)
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

export default function EmployeeSearchField({
  label = "Employee",
  required = true,
  isOpen = true,
  preSelectedEmployeeId,
  errorText,
  onSelect,
  onClear,
  onEmployeeListChange,
  organizationCode,
  multiSelect = false,
  onMultiSelect,
  hierarchyFilters,
  subsidiaries,
  divisions,
  departments,
  subDepartments,
  sections,
  locations,
  contractors,
  designationCode,
  gradeCodes,
  employeeCategoryCodes,
  selectAll,
  onSelectAllChange,
}: EmployeeSearchFieldProps) {
  // Set tenantCode statically to 
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters: hierarchyFiltersFromHook } = useEmpHierarchy()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedEmployees, setSelectedEmployees] = useState<Employee[]>([])
  const [error, setError] = useState<string | null>(null)
  const [limit, setLimit] = useState(20)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [isSelectAllActive, setIsSelectAllActive] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null)
  const [notificationType, setNotificationType] = useState<'info' | 'warning' | 'success'>('info')
  const prevFiltersRef = useRef<{
    designationCode?: string
    gradeCodes?: string[]
    employeeCategoryCodes?: string[]
    subsidiaries?: string[]
    divisions?: string[]
    departments?: string[]
    subDepartments?: string[]
    sections?: string[]
    locations?: string[]
    contractors?: string[]
  }>({})
  const prevSelectAllValueRef = useRef<boolean | undefined>(undefined)
  const deselectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Extract hierarchy filters - prioritize props from step-by-step-filter, then hierarchyFilters prop, then hook
  const effectiveHierarchyFilters = useMemo(() => {
    // First priority: Use filters passed directly from step-by-step-filter component
    if (subsidiaries || divisions || departments || subDepartments || sections || locations || contractors) {
      const filters: {
        subsidiary?: string[]
        division?: string[]
        department?: string[]
        location?: string[]
        contractor?: string[]
      } = {}
      
      if (subsidiaries && subsidiaries.length > 0) {
        filters.subsidiary = subsidiaries.map((c: any) => String(c))
      }
      if (divisions && divisions.length > 0) {
        filters.division = divisions.map((c: any) => String(c))
      }
      if (departments && departments.length > 0) {
        filters.department = departments.map((c: any) => String(c))
      }
      if (subDepartments && subDepartments.length > 0) {
        // no direct hierarchyFilters support; handled via criteriaRequests
      }
      if (sections && sections.length > 0) {
        // no direct hierarchyFilters support; handled via criteriaRequests
      }
      if (locations && locations.length > 0) {
        filters.location = locations.map((c: any) => String(c))
      }
      if (contractors && contractors.length > 0) {
        filters.contractor = contractors.map((c: any) => String(c))
      }
      
      return Object.keys(filters).length > 0 ? filters : undefined
    }
    
    // Second priority: Use hierarchyFilters prop
    if (hierarchyFilters) {
      return hierarchyFilters
    }
    
    // Third priority: Use hierarchy filters from hook (transform from hook format to query format)
    if (hierarchyFiltersFromHook) {
      const filters: {
        subsidiary?: string[]
        division?: string[]
        department?: string[]
        location?: string[]
        contractor?: string[]
      } = {}
      
      if (hierarchyFiltersFromHook.subsidiaries && hierarchyFiltersFromHook.subsidiaries.length > 0) {
        filters.subsidiary = hierarchyFiltersFromHook.subsidiaries
      }
      if (hierarchyFiltersFromHook.divisions && hierarchyFiltersFromHook.divisions.length > 0) {
        filters.division = hierarchyFiltersFromHook.divisions
      }
      if (hierarchyFiltersFromHook.departments && hierarchyFiltersFromHook.departments.length > 0) {
        filters.department = hierarchyFiltersFromHook.departments
      }
      if (hierarchyFiltersFromHook.locations && hierarchyFiltersFromHook.locations.length > 0) {
        filters.location = hierarchyFiltersFromHook.locations
      }
      if (hierarchyFiltersFromHook.contractors && hierarchyFiltersFromHook.contractors.length > 0) {
        filters.contractor = hierarchyFiltersFromHook.contractors
      }
      
      return Object.keys(filters).length > 0 ? filters : undefined
    }
    
    return undefined
  }, [hierarchyFilters, hierarchyFiltersFromHook, subsidiaries, divisions, departments, subDepartments, sections, locations, contractors])

  // Centralized userEntitlement using shared hook
  const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFiltersFromHook)

  // Build GraphQL query dynamically with hierarchyFilters and userEntitlement inline (since type doesn't exist)
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
          firstName
          employeeID
        }
      }
    `
    return gql(queryString)
  }, [effectiveHierarchyFilters, userEntitlement])

  // Build query variables
  const queryVariables = useMemo(() => {
    const criteriaRequests: any[] = []
    
    // Add organizationCode filter (statically set to "")
    criteriaRequests.push({
      field: 'tenantCode',
      operator: 'is',
      value: tenantCode, // Always use ""
    })

    const normalize = (value?: string[] | string | null) => {
      if (!value) return [] as string[]
      return Array.isArray(value) ? value : [value]
    }

    const addFilter = (field: string, values?: string[] | string | null) => {
      const list = normalize(values)
      if (list.length === 0) return
      criteriaRequests.push({
        field,
        operator: list.length === 1 ? 'eq' : 'in',
        value: list.length === 1 ? list[0] : list,
      })
    }

    addFilter('deployment.subsidiary.subsidiaryCode', subsidiaries as any)
    addFilter('deployment.division.divisionCode', divisions as any)
    addFilter('deployment.department.departmentCode', departments as any)
    addFilter('deployment.subDepartment.subDepartmentCode', subDepartments as any)
    addFilter('deployment.section.sectionCode', sections as any)
    addFilter('deployment.location.locationCode', locations as any)
    addFilter('deployment.designation.designationCode', designationCode as any)
    addFilter('deployment.grade.gradeCode', gradeCodes as any)
    addFilter('deployment.employeeCategory.employeeCategoryCode', employeeCategoryCodes as any)

    // Only add search filter if selectAll is not active
    // When selectAll is true, fetch all employees matching the role-based criteria only
    if (!isSelectAllActive && debouncedSearch.trim()) {
      criteriaRequests.push({
        field: 'employeeID',
        operator: 'like',
        value: debouncedSearch.trim(),
      })
    }

    const vars = {
      criteriaRequests,
      collection: 'contract_employee',
      offset: 0,
      limit: limit, // Dynamic limit for infinite scroll
    }

    // Debug: Log query variables when open and filters/search are present
    if (isOpen && (criteriaRequests.length > 1 || debouncedSearch.trim())) {
      console.debug("[EmployeeSearchField] queryVariables", vars)
    }

    return vars
  }, [
    tenantCode,
    debouncedSearch,
    effectiveHierarchyFilters,
    userEntitlement,
    isOpen,
    organizationCode,
    preSelectedEmployeeId,
    limit,
    designationCode,
    gradeCodes,
    employeeCategoryCodes,
    subsidiaries,
    divisions,
    departments,
    subDepartments,
    sections,
    locations,
    isSelectAllActive,
  ])

  // Debounce search input with optimized timing to reduce backend calls
  // Minimum 2 characters required before searching to avoid unnecessary API calls
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Only search if user has typed at least 2 characters
    const trimmedSearch = search.trim()
    if (trimmedSearch.length < 2 && trimmedSearch.length > 0) {
      // Clear results if less than 2 characters
      setDebouncedSearch("")
      setSearchResults([])
      return
    }

    // Debounce set to 350ms - optimal balance between responsiveness and backend load
    // Calls backend 350ms after user stops typing
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search)
    }, 350) // 350ms debounce - calls backend after user stops typing

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [search])

  // Store callback in ref to avoid dependency issues
  const onEmployeeListChangeRef = useRef(onEmployeeListChange)
  useEffect(() => {
    onEmployeeListChangeRef.current = onEmployeeListChange
  }, [onEmployeeListChange])

  // Fetch employees using GraphQL
  // Skip query if search has less than 2 characters to reduce backend load
  // When selectAll is active, allow query even without search term (fetch by criteria only)
  // But require at least one role-based filter when selectAll is active
  const hasRoleFilters = designationCode ||
    (gradeCodes && gradeCodes.length > 0) ||
    (employeeCategoryCodes && employeeCategoryCodes.length > 0) ||
    (subsidiaries && subsidiaries.length > 0) ||
    (divisions && divisions.length > 0) ||
    (departments && departments.length > 0) ||
    (subDepartments && subDepartments.length > 0) ||
    (sections && sections.length > 0) ||
    (locations && locations.length > 0) ||
    (contractors && contractors.length > 0)
  
  const shouldSkipQuery = !isOpen || (
    !isSelectAllActive && 
    (!debouncedSearch.trim() || debouncedSearch.trim().length < 2) && 
    !organizationCode && 
    !preSelectedEmployeeId
  ) || (
    isSelectAllActive && 
    !hasRoleFilters
  )

  const {
    data: employeesData,
    loading,
    error: queryError,
  } = useQuery(FETCH_EMPLOYEES_QUERY, {
    client,
    variables: queryVariables,
    skip: shouldSkipQuery,
    fetchPolicy: 'network-only',
    onError: (err) => {
      // Debug: Log error
      console.error('Error fetching employees:', err)
      setError('Failed to load employees')
      setSearchResults([])
      onEmployeeListChangeRef.current?.([])
    },
  })

  // Update search results when query completes - handle infinite scroll
  useEffect(() => {
    if (employeesData?.fetchEmployees) {
      const mapped: Employee[] = (employeesData.fetchEmployees || []).map((e: any) => ({
        _id: e._id,
        employeeID: e.employeeID || '',
        firstName: e.firstName || '',
        middleName: e.middleName,
        lastName: e.lastName,
        organizationCode: e.organizationCode,
        contractorCode: e.contractorCode,
        tenantCode: e.tenantCode,
      }))
      
      // For infinite scroll: when limit increases, GraphQL returns all results up to new limit
      // So we just replace with the new larger set (which includes previous results)
      setSearchResults(mapped)
      setIsLoadingMore(false) // Reset loading more flag
      
      // Open dropdown when search results arrive and user has typed at least 2 characters
      if (debouncedSearch.trim().length >= 2 && mapped.length > 0) {
        setIsDropdownOpen(true)
      }
      
      // If Select All is active, automatically select all new results
      if (isSelectAllActive && multiSelect && mapped.length > 0) {
        // When selectAll is active, select all fetched employees
        // Merge with existing selections, avoiding duplicates
        const existingIDs = new Set(selectedEmployees.map(e => e.employeeID))
        const newEmployees = mapped.filter(emp => !existingIDs.has(emp.employeeID))
        if (newEmployees.length > 0) {
          const updatedSelection = [...selectedEmployees, ...newEmployees]
          setSelectedEmployees(updatedSelection)
          onMultiSelect?.(updatedSelection)
        } else if (selectedEmployees.length === 0 && mapped.length > 0) {
          // First time selecting all - select all current results
          setSelectedEmployees(mapped)
          onMultiSelect?.(mapped)
          setNotificationMessage("All employees selected")
          setNotificationType('success')
          setTimeout(() => setNotificationMessage(null), 3000)
        }
      }
      
      // Notify parent component of filtered employee list changes
      onEmployeeListChangeRef.current?.(mapped)
    } else if (employeesData !== undefined) {
      // Only notify when data is actually fetched (not on initial undefined state)
      setSearchResults([])
      setIsLoadingMore(false)
      onEmployeeListChangeRef.current?.([])
      // Close dropdown if no results
      if (debouncedSearch.trim().length < 2) {
        setIsDropdownOpen(false)
      }
    }
  }, [employeesData, isSelectAllActive, multiSelect, selectedEmployees, onMultiSelect, debouncedSearch])

  // Sync selectAll prop with internal state
  useEffect(() => {
    if (selectAll !== undefined && selectAll.permission) {
      const prevValue = prevSelectAllValueRef.current
      setIsSelectAllActive(selectAll.value)
      
      // When selectAll.value becomes false (was true before), clear all selections
      if (prevValue === true && !selectAll.value) {
        setSelectedEmployees([])
        onMultiSelect?.([])
      }
      
      prevSelectAllValueRef.current = selectAll.value
    }
  }, [selectAll, onMultiSelect])

  // Detect filter changes when Select All is active
  useEffect(() => {
    if (isSelectAllActive && multiSelect) {
      const currentFilters = {
        designationCode,
        gradeCodes,
        employeeCategoryCodes,
        subsidiaries,
        divisions,
        departments,
        subDepartments,
        sections,
        locations,
        contractors,
      }
      const prevFilters = prevFiltersRef.current
      
      const filtersChanged = 
        prevFilters.designationCode !== currentFilters.designationCode ||
        JSON.stringify(prevFilters.gradeCodes || []) !== JSON.stringify(currentFilters.gradeCodes || []) ||
        JSON.stringify(prevFilters.employeeCategoryCodes || []) !== JSON.stringify(currentFilters.employeeCategoryCodes || []) ||
        JSON.stringify(prevFilters.subsidiaries || []) !== JSON.stringify(currentFilters.subsidiaries || []) ||
        JSON.stringify(prevFilters.divisions || []) !== JSON.stringify(currentFilters.divisions || []) ||
        JSON.stringify(prevFilters.departments || []) !== JSON.stringify(currentFilters.departments || []) ||
        JSON.stringify(prevFilters.subDepartments || []) !== JSON.stringify(currentFilters.subDepartments || []) ||
        JSON.stringify(prevFilters.sections || []) !== JSON.stringify(currentFilters.sections || []) ||
        JSON.stringify(prevFilters.locations || []) !== JSON.stringify(currentFilters.locations || []) ||
        JSON.stringify(prevFilters.contractors || []) !== JSON.stringify(currentFilters.contractors || [])
      
      // Check if filters have actually changed (not just initial state)
      const hasPreviousFilters = prevFilters.designationCode !== undefined || 
        (prevFilters.gradeCodes && prevFilters.gradeCodes.length > 0) || 
        (prevFilters.employeeCategoryCodes && prevFilters.employeeCategoryCodes.length > 0) ||
        (prevFilters.subsidiaries && prevFilters.subsidiaries.length > 0) ||
        (prevFilters.divisions && prevFilters.divisions.length > 0) ||
        (prevFilters.departments && prevFilters.departments.length > 0) ||
        (prevFilters.subDepartments && prevFilters.subDepartments.length > 0) ||
        (prevFilters.sections && prevFilters.sections.length > 0) ||
        (prevFilters.locations && prevFilters.locations.length > 0) ||
        (prevFilters.contractors && prevFilters.contractors.length > 0)
      
      if (filtersChanged && hasPreviousFilters) {
        setNotificationMessage("Selected values are going to be removed due to filter changes")
        setNotificationType('warning')
        // Clear selection when filters change
        setSelectedEmployees([])
        onMultiSelect?.([])
        setIsSelectAllActive(false)
        onSelectAllChange?.(false)
        // Clear notification after 5 seconds
        setTimeout(() => setNotificationMessage(null), 5000)
      }
      
      prevFiltersRef.current = currentFilters
    } else {
      prevFiltersRef.current = {
        designationCode,
        gradeCodes,
        employeeCategoryCodes,
        subsidiaries,
        divisions,
        departments,
        subDepartments,
        sections,
        locations,
        contractors,
      }
    }
  }, [
    designationCode,
    gradeCodes,
    employeeCategoryCodes,
    subsidiaries,
    divisions,
    departments,
    subDepartments,
    sections,
    locations,
    contractors,
    isSelectAllActive,
    multiSelect,
    onMultiSelect,
    onSelectAllChange,
  ])

  useEffect(() => {
    if (!isOpen) {
      setSelectedEmployee(null)
      setSelectedEmployees([])
      setSearch("")
      setDebouncedSearch("")
      setSearchResults([])
      setLimit(20) // Reset limit when closed
      setIsDropdownOpen(false)
      setIsLoadingMore(false)
      setIsSelectAllActive(false)
      setNotificationMessage(null)
      prevFiltersRef.current = {}
    }
  }, [isOpen])

  // Reset limit when search changes
  useEffect(() => {
    setLimit(20)
    setIsLoadingMore(false)
    
    // In multi-select mode, preserve searchResults to keep dropdown open
    // Only clear searchResults in single-select mode or when search is cleared
    if (!multiSelect) {
      setSearchResults([])
      // Close dropdown if search is cleared or too short
      if (!debouncedSearch.trim() || debouncedSearch.trim().length < 2) {
        setIsDropdownOpen(false)
      }
    } else {
      // In multi-select mode, only clear searchResults if search is empty or too short
      // Close dropdown if search is cleared or too short
      if (!debouncedSearch.trim() || debouncedSearch.trim().length < 2) {
        setSearchResults([])
        setIsDropdownOpen(false)
      }
      // Otherwise, keep existing searchResults to maintain dropdown visibility
    }
    
    // Note: We don't clear selectAll when search changes - it should only become false when values are deselected
  }, [debouncedSearch, multiSelect])

  // Reset limit when search changes
  useEffect(() => {
    setLimit(20)
  }, [debouncedSearch])

  // Handle infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    
    // Load more when within 50px of bottom and we have results matching current limit
    if (scrollBottom < 50 && !loading && !isLoadingMore && searchResults.length >= limit) {
      setIsLoadingMore(true)
      setLimit(prev => prev + 20)
    }
  }

  // Close dropdown handler for multi-select mode
  const handleCloseDropdown = () => {
    setIsDropdownOpen(false)
    setSearch("")
    setDebouncedSearch("")
    setSearchResults([])
    setLimit(20)
  }

  // Initialize from pre-selected id
  useEffect(() => {
    if (!isOpen) return
    if (preSelectedEmployeeId) {
      // If we have search results, try to find the employee
      const emp = searchResults.find(e => e.employeeID === preSelectedEmployeeId)
      if (emp) {
        setSelectedEmployee(emp)
        const fullName = [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' ')
        setSearch(fullName)
        setDebouncedSearch(preSelectedEmployeeId)
        onSelect(emp)
      } else {
        // Set search to trigger query
        setSearch(preSelectedEmployeeId)
        setDebouncedSearch(preSelectedEmployeeId)
      }
    } else {
      setSelectedEmployee(null)
      setSearch("")
      setDebouncedSearch("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, preSelectedEmployeeId])

  // Handle when search results update and we have a pre-selected ID
  useEffect(() => {
    if (preSelectedEmployeeId && searchResults.length > 0) {
      const emp = searchResults.find(e => e.employeeID === preSelectedEmployeeId)
      if (emp && !selectedEmployee) {
        setSelectedEmployee(emp)
        const fullName = [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' ')
        setSearch(fullName)
        onSelect(emp)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults, preSelectedEmployeeId])

  // Handle Select All
  const handleSelectAll = () => {
    if (!multiSelect) return
    
    if (isSelectAllActive) {
      // Deselect all
      setSelectedEmployees([])
      onMultiSelect?.([])
      setIsSelectAllActive(false)
      onSelectAllChange?.(false)
      setNotificationMessage(null)
      // Clear search to reset query
      setSearch("")
      setDebouncedSearch("")
    } else {
      // When selecting all, clear search term and fetch all employees matching criteria
      setSearch("")
      setDebouncedSearch("")
      
      // Select all will be handled when searchResults update after query runs
      // Set the flag first
      setIsSelectAllActive(true)
      onSelectAllChange?.(true)
    }
  }

  const handleSelect = (emp: Employee) => {
    if (multiSelect) {
      // If Select All is active and any employee is selected/deselected, show warning message
      if (isSelectAllActive) {
        // Clear any existing timeout
        if (deselectTimeoutRef.current) {
          clearTimeout(deselectTimeoutRef.current)
        }
        
        // Show message explaining what will happen
        setNotificationMessage("Deselecting will disable 'Select All' and clear all selections")
        setNotificationType('warning')
        
        // Clear selectAll and all selections after showing message
        deselectTimeoutRef.current = setTimeout(() => {
          setIsSelectAllActive(false)
          onSelectAllChange?.(false)
          // Clear all selections when selectAll becomes false
          setSelectedEmployees([])
          onMultiSelect?.([])
          setNotificationMessage(null)
          deselectTimeoutRef.current = null
        }, 3000) // Auto-proceed after 3 seconds
        
        return // Exit early - message shown, will auto-clear after timeout
      }
      
      // Toggle selection for multi-select mode - use employeeID as unique identifier
      const isSelected = selectedEmployees.some(e => e.employeeID === emp.employeeID)
      let updatedSelection: Employee[]
      
      if (isSelected) {
        // Deselecting an employee
        updatedSelection = selectedEmployees.filter(e => e.employeeID !== emp.employeeID)
      } else {
        // Selecting an employee
        updatedSelection = [...selectedEmployees, emp]
      }
      
      setSelectedEmployees(updatedSelection)
      onMultiSelect?.(updatedSelection)
      // Keep dropdown open in multi-select mode - explicitly set to true
      setIsDropdownOpen(true)
      // Keep search input and results for continuous selection
      // Don't clear searchResults to allow continuous selection
    } else {
      // Single select mode - close dropdown after selection
      setSelectedEmployee(emp)
      const fullName = [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' ')
      setSearch(fullName)
      setSearchResults([])
      setIsDropdownOpen(false) // Explicitly close dropdown in single-select mode
      onSelect(emp)
    }
  }

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value
    setSearch(value)
    // Close dropdown if search is cleared or less than 2 characters
    if (value.trim().length < 2) {
      setIsDropdownOpen(false)
      if (!multiSelect) {
        setSearchResults([])
      }
    }
    // Don't open dropdown here - it will open when search results arrive and search length >= 2
    // In multi-select mode, don't interfere with selected employees
    if (!multiSelect && selectedEmployee) {
      const currentDisplayName = [selectedEmployee.firstName, selectedEmployee.middleName, selectedEmployee.lastName]
        .filter(Boolean).join(' ')
      if (!value.includes(selectedEmployee.employeeID) && !currentDisplayName.toLowerCase().includes(value.toLowerCase())) {
        setSelectedEmployee(null)
        onClear?.()
      }
    }
  }

  const clear = () => {
    setSearch("")
    setDebouncedSearch("")
    setSelectedEmployee(null)
    setSearchResults([])
    setIsDropdownOpen(false)
    onClear?.()
  }

  // Check if all current results are selected
  const allResultsSelected = multiSelect && searchResults.length > 0 && 
    searchResults.every(emp => selectedEmployees.some(sel => sel.employeeID === emp.employeeID))

  const hasFilterSelections = Boolean(
    designationCode ||
      (gradeCodes && gradeCodes.length > 0) ||
      (employeeCategoryCodes && employeeCategoryCodes.length > 0) ||
      (subsidiaries && subsidiaries.length > 0) ||
      (divisions && divisions.length > 0) ||
      (departments && departments.length > 0) ||
      (subDepartments && subDepartments.length > 0) ||
      (sections && sections.length > 0) ||
      (locations && locations.length > 0) ||
      (contractors && contractors.length > 0)
  )

  const showNoResultsError =
    hasFilterSelections && !loading && employeesData !== undefined && searchResults.length === 0

  return (
    <div className="space-y-1.5">
      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
        {label} {required && <span className="text-red-500 normal-case">*</span>}
      </Label>
      
      {/* Notification Banner */}
      {notificationMessage && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
          notificationType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          notificationType === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        }`}>
          {notificationType === 'success' ? (
            <Check className="h-4 w-4 flex-shrink-0" />
          ) : notificationType === 'warning' ? (
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <Info className="h-4 w-4 flex-shrink-0" />
          )}
          <span>{notificationMessage}</span>
          <button
            type="button"
            onClick={() => setNotificationMessage(null)}
            className="ml-auto text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Select All Status */}
      {isSelectAllActive && multiSelect && !notificationMessage && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-green-50 text-green-800 border border-green-200">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>All employees selected</span>
        </div>
      )}

      <div className="relative">
        <Input
          value={multiSelect ? search : search}
          onChange={handleChange}
          placeholder={loading ? "Loading employees..." : preSelectedEmployeeId ? "Employee pre-selected" : multiSelect ? "Type at least 2 characters to search" : "Type at least 2 characters to search"}
          disabled={!!preSelectedEmployeeId}
          className="h-9 px-3 py-1.5 text-sm bg-white placeholder:text-gray-400 focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition border-gray-300"
        />
        <button
          type="button"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Search className="h-4 w-4" />
          )}
        </button>
        {selectedEmployee && !preSelectedEmployeeId && !multiSelect && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded"
            title="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!preSelectedEmployeeId && (
          multiSelect 
            ? (isDropdownOpen && searchResults.length > 0) 
            : (search && searchResults.length > 0 && !selectedEmployee)
        ) && (
          <div 
            ref={dropdownRef}
            className={`absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-sm overflow-y-auto ${
              multiSelect ? 'max-h-96' : 'max-h-40'
            }`}
            onScroll={handleScroll}
          >
            {/* Close button and Select All for multi-select mode */}
            {multiSelect && (
              <div className="sticky top-0 bg-white border-b border-gray-200 z-10">
                <div className="px-3 py-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">Select Employees</span>
                  <button
                    type="button"
                    onClick={handleCloseDropdown}
                    className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    title="Close dropdown"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {/* Select All option - show if selectAll.permission is true */}
                {selectAll?.permission === true && searchResults.length > 0 && (
                  <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 w-full text-left text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
                    >
                      <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                        isSelectAllActive || allResultsSelected
                          ? 'border-blue-600 bg-blue-600' 
                          : 'border-gray-300'
                      }`}>
                        {(isSelectAllActive || allResultsSelected) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span>{isSelectAllActive || allResultsSelected ? 'All Selected' : 'Select All'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            {searchResults.map(emp => {
              const isSelected = multiSelect ? selectedEmployees.some(e => e.employeeID === emp.employeeID) : false
              return (
                <div
                  key={emp.employeeID}
                  className={`px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-sm transition-colors flex items-center gap-2 ${
                    isSelected ? 'bg-blue-50' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelect(emp)
                  }}
                >
                  {multiSelect && (
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  )}
                  <span>
                    {[emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' ')} <span className="text-gray-400">({emp.employeeID})</span>
                  </span>
                </div>
              )
            })}
            {(loading || isLoadingMore) && (
              <div className="px-3 py-2 text-center text-xs text-gray-500">
                Loading more...
              </div>
            )}
          </div>
        )}
      </div>
      {errorText && (
        <div className="flex items-center gap-1 text-red-500 text-xs">
          <AlertCircle className="h-3 w-3" />
          {errorText}
        </div>
      )}
      {showNoResultsError && !errorText && (
        <div className="flex items-center gap-1 text-yellow-700 text-xs">
          <AlertTriangle className="h-3 w-3" />
          No employees found for the selected filters.
        </div>
      )}
      {!multiSelect && selectedEmployee && (
        <div className="text-xs text-gray-600 flex items-start gap-2 bg-gray-50 px-2.5 py-1.5 rounded-md">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
          <div>
            <span className="font-medium text-green-700">Selected:</span> {[selectedEmployee.firstName, selectedEmployee.middleName, selectedEmployee.lastName].filter(Boolean).join(' ')} ({selectedEmployee.employeeID})
          </div>
        </div>
      )}
    </div>
  )
}


