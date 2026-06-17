"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useQuery, gql } from "@apollo/client"
import { Check, X, Search as SearchIcon, Filter, Trash2, Info } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/multiselect-employee-search"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"
import SingleSelectField from "@/components/fields/single-select-field"
import LocationsSelector from "./locations-selector"

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
  // Send current hierarchy filter JSON (subsidiary/division/department/subDepartment/section/locations/selectAll) to parent
  onRoleFilterChange?: (filter: {
    subsidiary: { subsidiaryCode: string | null; subsidiaryName: string | null }
    division: { divisionCode: string | null; divisionName: string | null }
    department: { departmentCode: string | null; departmentName: string | null }
    subDepartment: { subDepartmentCode: string | null; subDepartmentName: string | null }
    section: { sectionCode: string | null; sectionName: string | null }
    locations: string[]
    selectAll: boolean
  }) => void
}

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
  const [selectedSubsidiaryCode, setSelectedSubsidiaryCode] = useState<string>("")
  const [selectedDivisionCode, setSelectedDivisionCode] = useState<string>("")
  const [selectedDepartmentCode, setSelectedDepartmentCode] = useState<string>("")
  const [selectedSubDepartmentCode, setSelectedSubDepartmentCode] = useState<string>("")
  const [selectedSectionCode, setSelectedSectionCode] = useState<string>("")
  const [selectedLocationCodes, setSelectedLocationCodes] = useState<string[]>([])
  
  // Search states for employees list
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
  const prevRoleFiltersRef = useRef<{
    subsidiaryCode: string
    divisionCode: string
    departmentCode: string
    subDepartmentCode: string
    sectionCode: string
    locationCodes: string[]
  } | null>(null)
  
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

  // --- Organization hierarchy data (subsidiary -> division -> department -> subDepartment -> section + locations) ---
  const createBaseRequestData = () => ({
    criteriaRequests: [
      {
        field: "tenantCode",
        operator: "is",
        value: tenantCode,
      },
    ],
  })

  const subsidiariesRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    if (hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0) {
      requestData.arrayFilter = {
        arrayField: "subsidiaries",
        filterCriteria: [
          {
            field: "subsidiaryCode",
            operator: "in",
            value: hierarchyFilters.subsidiaries,
          },
        ],
      }
    }
    return requestData
  }, [tenantCode, hierarchyFilters])

  const divisionsRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    if (hierarchyFilters?.divisions && hierarchyFilters.divisions.length > 0) {
      requestData.arrayFilter = {
        arrayField: "divisions",
        filterCriteria: [
          {
            field: "divisionCode",
            operator: "in",
            value: hierarchyFilters.divisions,
          },
        ],
      }
    }
    return requestData
  }, [tenantCode, hierarchyFilters])

  const departmentsRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    if (hierarchyFilters?.departments && hierarchyFilters.departments.length > 0) {
      requestData.arrayFilter = {
        arrayField: "departments",
        filterCriteria: [
          {
            field: "departmentCode",
            operator: "in",
            value: hierarchyFilters.departments,
          },
        ],
      }
    }
    return requestData
  }, [tenantCode, hierarchyFilters])

  const subDepartmentsRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    if (hierarchyFilters?.departments && hierarchyFilters.departments.length > 0) {
      requestData.arrayFilter = {
        arrayField: "subDepartments",
        filterCriteria: [
          {
            field: "departmentCode",
            operator: "in",
            value: hierarchyFilters.departments,
          },
        ],
      }
    }
    return requestData
  }, [tenantCode, hierarchyFilters])

  const sectionsRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    if (hierarchyFilters?.departments && hierarchyFilters.departments.length > 0) {
      requestData.arrayFilter = {
        arrayField: "sections",
        filterCriteria: [
          {
            field: "departmentCode",
            operator: "in",
            value: hierarchyFilters.departments,
          },
        ],
      }
    }
    return requestData
  }, [tenantCode, hierarchyFilters])

  const locationsRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    if (hierarchyFilters?.locations && hierarchyFilters.locations.length > 0) {
      requestData.arrayFilter = {
        arrayField: "location",
        filterCriteria: [
          {
            field: "locationCode",
            operator: "in",
            value: hierarchyFilters.locations,
          },
        ],
      }
    }
    return requestData
  }, [tenantCode, hierarchyFilters])

  const {
    data: subsidiariesResponse,
    refetch: refetchSubsidiaries,
  } = useRequest<any[]>({
    url: "organization/aggregate",
    method: "POST",
    data: subsidiariesRequestData,
    dependencies: [],
  })

  const {
    data: divisionsResponse,
    refetch: refetchDivisions,
  } = useRequest<any[]>({
    url: "organization/aggregate",
    method: "POST",
    data: divisionsRequestData,
    dependencies: [],
  })

  const {
    data: departmentsResponse,
    refetch: refetchDepartments,
  } = useRequest<any[]>({
    url: "organization/aggregate",
    method: "POST",
    data: departmentsRequestData,
    dependencies: [],
  })

  const {
    data: subDepartmentsResponse,
    refetch: refetchSubDepartments,
  } = useRequest<any[]>({
    url: "organization/aggregate",
    method: "POST",
    data: subDepartmentsRequestData,
    dependencies: [],
  })

  const {
    data: sectionsResponse,
    refetch: refetchSections,
  } = useRequest<any[]>({
    url: "organization/aggregate",
    method: "POST",
    data: sectionsRequestData,
    dependencies: [],
  })

  const {
    data: locationsResponse,
    refetch: refetchLocations,
  } = useRequest<any[]>({
    url: "organization/aggregate",
    method: "POST",
    data: locationsRequestData,
    dependencies: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    refetchSubsidiaries()
    refetchDivisions()
    refetchDepartments()
    refetchSubDepartments()
    refetchSections()
    refetchLocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!tenantCode) return
    refetchSubsidiaries()
    refetchDivisions()
    refetchDepartments()
    refetchSubDepartments()
    refetchSections()
    refetchLocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(hierarchyFilters)])

  const rawSubsidiaries = useMemo(() => {
    if (!subsidiariesResponse) return []
    if (Array.isArray(subsidiariesResponse) && subsidiariesResponse.length > 0) {
      if (subsidiariesResponse[0]?.subsidiaries && Array.isArray(subsidiariesResponse[0].subsidiaries)) {
        const allSubsidiaries: any[] = []
        subsidiariesResponse.forEach((org: any) => {
          if (org?.subsidiaries && Array.isArray(org.subsidiaries)) {
            allSubsidiaries.push(...org.subsidiaries)
          }
        })
        return allSubsidiaries
      }
      if (subsidiariesResponse[0]?.subsidiaryCode) {
        return subsidiariesResponse
      }
    }
    return []
  }, [subsidiariesResponse])

  const rawDivisions = useMemo(() => {
    if (!divisionsResponse) return []
    if (Array.isArray(divisionsResponse) && divisionsResponse.length > 0) {
      if (divisionsResponse[0]?.divisions && Array.isArray(divisionsResponse[0].divisions)) {
        const allDivisions: any[] = []
        divisionsResponse.forEach((org: any) => {
          if (org?.divisions && Array.isArray(org.divisions)) {
            allDivisions.push(...org.divisions)
          }
        })
        return allDivisions
      }
      if (divisionsResponse[0]?.divisionCode) {
        return divisionsResponse
      }
    }
    return []
  }, [divisionsResponse])

  const rawDepartments = useMemo(() => {
    if (!departmentsResponse) return []
    if (Array.isArray(departmentsResponse) && departmentsResponse.length > 0) {
      if (departmentsResponse[0]?.departments && Array.isArray(departmentsResponse[0].departments)) {
        const allDepartments: any[] = []
        departmentsResponse.forEach((org: any) => {
          if (org?.departments && Array.isArray(org.departments)) {
            allDepartments.push(...org.departments)
          }
        })
        return allDepartments
      }
      if (departmentsResponse[0]?.departmentCode) {
        return departmentsResponse
      }
    }
    return []
  }, [departmentsResponse])

  const rawSubDepartments = useMemo(() => {
    if (!subDepartmentsResponse) return []
    if (Array.isArray(subDepartmentsResponse) && subDepartmentsResponse.length > 0) {
      if (subDepartmentsResponse[0]?.subDepartments && Array.isArray(subDepartmentsResponse[0].subDepartments)) {
        const allSubDepartments: any[] = []
        subDepartmentsResponse.forEach((org: any) => {
          if (org?.subDepartments && Array.isArray(org.subDepartments)) {
            allSubDepartments.push(...org.subDepartments)
          }
        })
        return allSubDepartments
      }
      if (subDepartmentsResponse[0]?.subDepartmentCode) {
        return subDepartmentsResponse
      }
    }
    return []
  }, [subDepartmentsResponse])

  const rawSections = useMemo(() => {
    if (!sectionsResponse) return []
    if (Array.isArray(sectionsResponse) && sectionsResponse.length > 0) {
      if (sectionsResponse[0]?.sections && Array.isArray(sectionsResponse[0].sections)) {
        const allSections: any[] = []
        sectionsResponse.forEach((org: any) => {
          if (org?.sections && Array.isArray(org.sections)) {
            allSections.push(...org.sections)
          }
        })
        return allSections
      }
      if (sectionsResponse[0]?.sectionCode) {
        return sectionsResponse
      }
    }
    return []
  }, [sectionsResponse])

  const rawLocations = useMemo(() => {
    if (!locationsResponse) return []
    if (Array.isArray(locationsResponse) && locationsResponse.length > 0) {
      if (locationsResponse[0]?.location && Array.isArray(locationsResponse[0].location)) {
        const allLocations: any[] = []
        locationsResponse.forEach((org: any) => {
          if (Array.isArray(org.location)) {
            org.location.forEach((loc: any) => {
              allLocations.push(loc)
            })
          }
        })
        return allLocations
      }
      if (locationsResponse[0]?.locationCode) {
        return locationsResponse
      }
    }
    return []
  }, [locationsResponse])

  const subsidiaries = useMemo(() => {
    return rawSubsidiaries.map((sub: any) => ({
      code: sub.subsidiaryCode,
      name: sub.subsidiaryName,
    }))
  }, [rawSubsidiaries])

  const divisions = useMemo(() => {
    return rawDivisions.map((div: any) => ({
      code: div.divisionCode,
      name: div.divisionName,
      subsidiaryCode: div.subsidiaryCode,
    }))
  }, [rawDivisions])

  const departments = useMemo(() => {
    return rawDepartments.map((dept: any) => ({
      code: dept.departmentCode,
      name: dept.departmentName,
      divisionCode: dept.divisionCode,
    }))
  }, [rawDepartments])

  const subDepartments = useMemo(() => {
    return rawSubDepartments.map((subDept: any) => ({
      code: subDept.subDepartmentCode,
      name: subDept.subDepartmentName,
      departmentCode: subDept.departmentCode,
      locationCode: subDept.locationCode,
    }))
  }, [rawSubDepartments])

  const sections = useMemo(() => {
    return rawSections.map((sec: any) => ({
      code: sec.sectionCode,
      name: sec.sectionName,
      subDepartmentCode: sec.subDepartmentCode,
    }))
  }, [rawSections])

  const locations = useMemo(() => {
    return rawLocations.map((loc: any) => ({
      code: loc.locationCode,
      name: loc.locationName,
    }))
  }, [rawLocations])

  const locationMap = useMemo(() => {
    const map = new Map<string, { code: string; name: string }>()
    locations.forEach((loc) => map.set(loc.code, loc))
    return map
  }, [locations])

  const allowedLocationCodes = useMemo(() => {
    if (!selectedSubsidiaryCode) return null
    const subsidiary = rawSubsidiaries.find((s: any) => s.subsidiaryCode === selectedSubsidiaryCode)
    if (!subsidiary) return null
    const raw = subsidiary.locationCode
    if (Array.isArray(raw)) return raw.map((c: any) => String(c))
    if (raw) return [String(raw)]
    return null
  }, [selectedSubsidiaryCode, rawSubsidiaries])

  const filteredLocationsBase = useMemo(() => {
    if (!allowedLocationCodes || allowedLocationCodes.length === 0) return locations
    const allowed = new Set(allowedLocationCodes)
    return locations.filter((loc) => allowed.has(loc.code))
  }, [locations, allowedLocationCodes])

  // Build hierarchy filter JSON for downstream use / debugging
  const roleFilterJson = useMemo(() => {
    const selectedSubsidiary = selectedSubsidiaryCode
      ? subsidiaries.find((s: any) => s.code === selectedSubsidiaryCode)
      : null
    const selectedDivision = selectedDivisionCode
      ? divisions.find((d: any) => d.code === selectedDivisionCode)
      : null
    const selectedDepartment = selectedDepartmentCode
      ? departments.find((d: any) => d.code === selectedDepartmentCode)
      : null
    const selectedSubDepartment = selectedSubDepartmentCode
      ? subDepartments.find((s: any) => s.code === selectedSubDepartmentCode)
      : null
    const selectedSection = selectedSectionCode
      ? sections.find((s: any) => s.code === selectedSectionCode)
      : null

    return {
      subsidiary: {
        subsidiaryCode: selectedSubsidiaryCode || null,
        subsidiaryName: selectedSubsidiary?.name || null,
      },
      division: {
        divisionCode: selectedDivisionCode || null,
        divisionName: selectedDivision?.name || null,
      },
      department: {
        departmentCode: selectedDepartmentCode || null,
        departmentName: selectedDepartment?.name || null,
      },
      subDepartment: {
        subDepartmentCode: selectedSubDepartmentCode || null,
        subDepartmentName: selectedSubDepartment?.name || null,
      },
      section: {
        sectionCode: selectedSectionCode || null,
        sectionName: selectedSection?.name || null,
      },
      locations: selectedLocationCodes,
      selectAll: isSelectAllActive,
    }
  }, [
    selectedSubsidiaryCode,
    selectedDivisionCode,
    selectedDepartmentCode,
    selectedSubDepartmentCode,
    selectedSectionCode,
    selectedLocationCodes,
    isSelectAllActive,
    subsidiaries,
    divisions,
    departments,
    subDepartments,
    sections,
  ])

  useEffect(() => {
    // Notify parent whenever role filters change
    onRoleFilterChange?.(roleFilterJson)
  }, [roleFilterJson, onRoleFilterChange])

  // When hierarchy filters change, set selectAll to false
  useEffect(() => {
    const currentFilters = {
      subsidiaryCode: selectedSubsidiaryCode,
      divisionCode: selectedDivisionCode,
      departmentCode: selectedDepartmentCode,
      subDepartmentCode: selectedSubDepartmentCode,
      sectionCode: selectedSectionCode,
      locationCodes: selectedLocationCodes,
    }
    
    // Check if filters have changed (not initial render)
    if (prevRoleFiltersRef.current !== null) {
      const prevFilters = prevRoleFiltersRef.current
      const filtersChanged = 
        prevFilters.subsidiaryCode !== currentFilters.subsidiaryCode ||
        prevFilters.divisionCode !== currentFilters.divisionCode ||
        prevFilters.departmentCode !== currentFilters.departmentCode ||
        prevFilters.subDepartmentCode !== currentFilters.subDepartmentCode ||
        prevFilters.sectionCode !== currentFilters.sectionCode ||
        JSON.stringify(prevFilters.locationCodes) !== JSON.stringify(currentFilters.locationCodes)
      
      // If any hierarchy filter changes while selectAll is active, deactivate selectAll
      if (filtersChanged && isSelectAllActive) {
        handleSelectAllChange(false)
      }
    }
    
    // Update ref with current values
    prevRoleFiltersRef.current = currentFilters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedSubsidiaryCode,
    selectedDivisionCode,
    selectedDepartmentCode,
    selectedSubDepartmentCode,
    selectedSectionCode,
    selectedLocationCodes,
  ])

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
      setSelectedSubsidiaryCode("")
      setSelectedDivisionCode("")
      setSelectedDepartmentCode("")
      setSelectedSubDepartmentCode("")
      setSelectedSectionCode("")
      setSelectedLocationCodes([])
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

    // Add hierarchy filters
    if (selectedSubsidiaryCode) {
      criteriaRequests.push({
        field: 'deployment.subsidiary.subsidiaryCode',
        operator: 'eq',
        value: selectedSubsidiaryCode,
      })
    }

    if (selectedDivisionCode) {
      criteriaRequests.push({
        field: 'deployment.division.divisionCode',
        operator: 'eq',
        value: selectedDivisionCode,
      })
    }

    if (selectedDepartmentCode) {
      criteriaRequests.push({
        field: 'deployment.department.departmentCode',
        operator: 'eq',
        value: selectedDepartmentCode,
      })
    }

    if (selectedSubDepartmentCode) {
      criteriaRequests.push({
        field: 'deployment.subDepartment.subDepartmentCode',
        operator: 'eq',
        value: selectedSubDepartmentCode,
      })
    }

    if (selectedSectionCode) {
      criteriaRequests.push({
        field: 'deployment.section.sectionCode',
        operator: 'eq',
        value: selectedSectionCode,
      })
    }

    if (selectedLocationCodes && selectedLocationCodes.length > 0) {
      criteriaRequests.push({
        field: 'deployment.location.locationCode',
        operator: 'in',
        value: selectedLocationCodes,
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
  }, [
    isSelectAllActive,
    tenantCode,
    selectedSubsidiaryCode,
    selectedDivisionCode,
    selectedDepartmentCode,
    selectedSubDepartmentCode,
    selectedSectionCode,
    selectedLocationCodes,
    debouncedEmployeeIDFilter,
    page,
    pageSize,
  ])

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

    // Add hierarchy filters
    if (selectedSubsidiaryCode) {
      criteriaRequests.push({
        field: 'deployment.subsidiary.subsidiaryCode',
        operator: 'eq',
        value: selectedSubsidiaryCode,
      })
    }

    if (selectedDivisionCode) {
      criteriaRequests.push({
        field: 'deployment.division.divisionCode',
        operator: 'eq',
        value: selectedDivisionCode,
      })
    }

    if (selectedDepartmentCode) {
      criteriaRequests.push({
        field: 'deployment.department.departmentCode',
        operator: 'eq',
        value: selectedDepartmentCode,
      })
    }

    if (selectedSubDepartmentCode) {
      criteriaRequests.push({
        field: 'deployment.subDepartment.subDepartmentCode',
        operator: 'eq',
        value: selectedSubDepartmentCode,
      })
    }

    if (selectedSectionCode) {
      criteriaRequests.push({
        field: 'deployment.section.sectionCode',
        operator: 'eq',
        value: selectedSectionCode,
      })
    }

    if (selectedLocationCodes && selectedLocationCodes.length > 0) {
      criteriaRequests.push({
        field: 'deployment.location.locationCode',
        operator: 'in',
        value: selectedLocationCodes,
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
  }, [
    isSelectAllActive,
    tenantCode,
    selectedSubsidiaryCode,
    selectedDivisionCode,
    selectedDepartmentCode,
    selectedSubDepartmentCode,
    selectedSectionCode,
    selectedLocationCodes,
    debouncedEmployeeIDFilter,
    hierarchyFilters,
    userEntitlement,
  ])

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

  // Parent-child lists
  const availableDivisions = useMemo(() => {
    if (!selectedSubsidiaryCode) return []
    return divisions.filter((div: any) => div.subsidiaryCode === selectedSubsidiaryCode)
  }, [divisions, selectedSubsidiaryCode])

  const availableDepartments = useMemo(() => {
    if (!selectedDivisionCode) return []
    return departments.filter((dept: any) => dept.divisionCode === selectedDivisionCode)
  }, [departments, selectedDivisionCode])

  const availableSubDepartments = useMemo(() => {
    if (!selectedDepartmentCode) return []
    return subDepartments.filter((sub: any) => sub.departmentCode === selectedDepartmentCode)
  }, [subDepartments, selectedDepartmentCode])

  const availableSections = useMemo(() => {
    if (!selectedSubDepartmentCode) return []
    return sections.filter((sec: any) => sec.subDepartmentCode === selectedSubDepartmentCode)
  }, [sections, selectedSubDepartmentCode])

  const handleSubsidiaryChange = (code: string) => {
    setSelectedSubsidiaryCode(code)
    setSelectedDivisionCode("")
    setSelectedDepartmentCode("")
    setSelectedSubDepartmentCode("")
    setSelectedSectionCode("")
    setSelectedLocationCodes([])
  }

  const handleDivisionChange = (code: string) => {
    setSelectedDivisionCode(code)
    setSelectedDepartmentCode("")
    setSelectedSubDepartmentCode("")
    setSelectedSectionCode("")
  }

  const handleDepartmentChange = (code: string) => {
    setSelectedDepartmentCode(code)
    setSelectedSubDepartmentCode("")
    setSelectedSectionCode("")
  }

  const handleSubDepartmentChange = (code: string) => {
    setSelectedSubDepartmentCode(code)
    setSelectedSectionCode("")
  }

  // Clear child selections when parent changes
  useEffect(() => {
    if (!selectedSubsidiaryCode) {
      setSelectedDivisionCode("")
      setSelectedDepartmentCode("")
      setSelectedSubDepartmentCode("")
      setSelectedSectionCode("")
      setSelectedLocationCodes([])
    }
  }, [selectedSubsidiaryCode])

  useEffect(() => {
    if (!selectedDivisionCode) {
      setSelectedDepartmentCode("")
      setSelectedSubDepartmentCode("")
      setSelectedSectionCode("")
    }
  }, [selectedDivisionCode])

  useEffect(() => {
    if (!selectedDepartmentCode) {
      setSelectedSubDepartmentCode("")
      setSelectedSectionCode("")
    }
  }, [selectedDepartmentCode])

  useEffect(() => {
    if (!selectedSubDepartmentCode) {
      setSelectedSectionCode("")
    }
  }, [selectedSubDepartmentCode])

  useEffect(() => {
    if (!allowedLocationCodes || allowedLocationCodes.length === 0) return
    setSelectedLocationCodes((prev) => prev.filter((code) => allowedLocationCodes.includes(code)))
  }, [allowedLocationCodes])

  if (!isOpen) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="mb-4">
        <Label className="text-sm font-medium text-gray-900">Filter by Role</Label>
        <p className="text-xs text-gray-500 mt-0.5">Select subsidiary, division, department, sub department, section, and locations</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SingleSelectField
          label="Subsidiary"
          placeholder="Select subsidiary"
          value={selectedSubsidiaryCode}
          onChange={handleSubsidiaryChange}
          options={subsidiaries.map((item: any) => ({
            value: item.code,
            label: item.name,
          }))}
        />

        <SingleSelectField
          label="Division"
          placeholder="Select division"
          disabled={!selectedSubsidiaryCode}
          value={selectedDivisionCode}
          onChange={handleDivisionChange}
          options={availableDivisions.map((item: any) => ({
            value: item.code,
            label: item.name,
          }))}
        />

        <SingleSelectField
          label="Department"
          placeholder="Select department"
          disabled={!selectedDivisionCode}
          value={selectedDepartmentCode}
          onChange={handleDepartmentChange}
          options={availableDepartments.map((item: any) => ({
            value: item.code,
            label: item.name,
          }))}
        />

        <SingleSelectField
          label="Sub Department"
          placeholder="Select sub department"
          disabled={!selectedDepartmentCode}
          value={selectedSubDepartmentCode}
          onChange={handleSubDepartmentChange}
          options={availableSubDepartments.map((item: any) => ({
            value: item.code,
            label: item.name,
          }))}
        />

        <SingleSelectField
          label="Section"
          placeholder="Select section"
          disabled={!selectedSubDepartmentCode}
          value={selectedSectionCode}
          onChange={setSelectedSectionCode}
          options={availableSections.map((item: any) => ({
            value: item.code,
            label: item.name,
          }))}
        />

        <LocationsSelector
          selectedLocationCodes={selectedLocationCodes}
          setSelectedLocationCodes={setSelectedLocationCodes}
          filteredLocationsBase={filteredLocationsBase}
          locationMap={locationMap}
          resetKey={`${selectedSubsidiaryCode}|${selectedDivisionCode}|${selectedDepartmentCode}|${selectedSubDepartmentCode}`}
        />
      </div>
      {/* Employee Search Field - Filtered by Role */}
      {(selectedSubsidiaryCode ||
        selectedDivisionCode ||
        selectedDepartmentCode ||
        selectedSubDepartmentCode ||
        selectedSectionCode ||
        selectedLocationCodes.length > 0) && (
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
            subsidiaries={selectedSubsidiaryCode ? [selectedSubsidiaryCode] : undefined}
            divisions={selectedDivisionCode ? [selectedDivisionCode] : undefined}
            departments={selectedDepartmentCode ? [selectedDepartmentCode] : undefined}
            subDepartments={selectedSubDepartmentCode ? [selectedSubDepartmentCode] : undefined}
            sections={selectedSectionCode ? [selectedSectionCode] : undefined}
            locations={selectedLocationCodes.length > 0 ? selectedLocationCodes : undefined}
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

