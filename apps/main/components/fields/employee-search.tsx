"use client"

import React, { useEffect, useState, useRef, useMemo } from "react"
import { useQuery, gql } from '@apollo/client'
import { client } from '@repo/ui/hooks/api/dynamic-graphql'
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { AlertCircle, Search, X } from "lucide-react"
import { useEmpHierarchy } from '@/hooks/hierarchy/emp-hierarchy'
import { useGetTenantCode } from '@/hooks/useGetTenantCode'

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
  locations?: string[]
  contractors?: string[]
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
  hierarchyFilters,
  subsidiaries,
  divisions,
  departments,
  locations,
  contractors,
}: EmployeeSearchFieldProps) {
  // Set tenantCode statically to 
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters: hierarchyFiltersFromHook } = useEmpHierarchy()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [searchResults, setSearchResults] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Extract hierarchy filters - prioritize props from step-by-step-filter, then hierarchyFilters prop, then hook
  const effectiveHierarchyFilters = useMemo(() => {
    // First priority: Use filters passed directly from step-by-step-filter component
    if (subsidiaries || divisions || departments || locations || contractors) {
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
  }, [hierarchyFilters, hierarchyFiltersFromHook, subsidiaries, divisions, departments, locations, contractors])

  // Build GraphQL query dynamically with hierarchyFilters inline (since type doesn't exist)
  const FETCH_EMPLOYEES_QUERY = useMemo(() => {
    if (!effectiveHierarchyFilters || Object.keys(effectiveHierarchyFilters).length === 0) {
      return FETCH_EMPLOYEES_QUERY_BASE
    }

    // Build hierarchyFilters string inline
    const hierarchyFiltersString = Object.entries(effectiveHierarchyFilters)
      .map(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          return `${key}: [${value.map(v => `"${v}"`).join(', ')}]`
        }
        return ''
      })
      .filter(Boolean)
      .join(', ')

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
          hierarchyFilters: { ${hierarchyFiltersString} }
        ) {
          firstName
          employeeID
        }
      }
    `
    return gql(queryString)
  }, [effectiveHierarchyFilters])

  // Build query variables
  const queryVariables = useMemo(() => {
    const criteriaRequests: any[] = []
    
    // Add organizationCode filter (statically set to)
    criteriaRequests.push({
      field: 'tenantCode',
      operator: 'is',
      value: tenantCode, // Always use
    })

    if (debouncedSearch.trim()) {
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
      limit: 20, // Limit results for dropdown
    }

    
    return vars
  }, [tenantCode, debouncedSearch, effectiveHierarchyFilters, isOpen, organizationCode, preSelectedEmployeeId])

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
  const {
    data: employeesData,
    loading,
    error: queryError,
  } = useQuery(FETCH_EMPLOYEES_QUERY, {
    client,
    variables: queryVariables,
    skip: !isOpen || ((!debouncedSearch.trim() || debouncedSearch.trim().length < 2) && !organizationCode && !preSelectedEmployeeId),
    fetchPolicy: 'network-only',
    onError: (err) => {
      // Debug: Log error
      setError('Failed to load employees')
      setSearchResults([])
      onEmployeeListChangeRef.current?.([])
    },
  })

  // Update search results when query completes - only call callback once here
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
      setSearchResults(mapped)
      // Notify parent component of filtered employee list changes - use ref to avoid dependency loop
      onEmployeeListChangeRef.current?.(mapped)
    } else if (employeesData !== undefined) {
      // Only notify when data is actually fetched (not on initial undefined state)
      setSearchResults([])
      onEmployeeListChangeRef.current?.([])
    }
  }, [employeesData])

  useEffect(() => {
    if (!isOpen) {
      setSelectedEmployee(null)
      setSearch("")
      setDebouncedSearch("")
      setSearchResults([])
    }
  }, [isOpen])

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

  const handleSelect = (emp: Employee) => {
    setSelectedEmployee(emp)
    const fullName = [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' ')
    setSearch(fullName)
    setSearchResults([])
    onSelect(emp)
  }

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value
    setSearch(value)
    if (selectedEmployee) {
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
    onClear?.()
  }

  return (
    <div className="space-y-1.5">
      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
        {label} {required && <span className="text-red-500 normal-case">*</span>}
      </Label>
      <div className="relative">
        <Input
          value={search}
          onChange={handleChange}
          placeholder={loading ? "Loading employees..." : preSelectedEmployeeId ? "Employee pre-selected" : "Type at least 2 characters to search"}
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
        {selectedEmployee && !preSelectedEmployeeId && (
          <button
            type="button"
            onClick={clear}
            className="absolute right-9 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded"
            title="Clear selection"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        {!preSelectedEmployeeId && search && searchResults.length > 0 && !loading && !selectedEmployee && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-sm max-h-40 overflow-y-auto">
            {searchResults.map(emp => (
              <div
                key={emp._id}
                className="px-3 py-1.5 cursor-pointer hover:bg-gray-50 text-sm transition-colors"
                onClick={() => handleSelect(emp)}
              >
                {[emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(' ')} <span className="text-gray-400">({emp.employeeID})</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {errorText && (
        <div className="flex items-center gap-1 text-red-500 text-xs">
          <AlertCircle className="h-3 w-3" />
          {errorText}
        </div>
      )}
      {selectedEmployee && (
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


