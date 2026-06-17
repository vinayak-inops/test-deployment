"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useQuery, gql } from '@apollo/client'
import { client } from '@repo/ui/hooks/api/dynamic-graphql'
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { TableType, TableMenuItem } from "./types"
import { TablesDisplay } from "./tables-display"
import { TableSidebar } from "./table-sidebar"

const FETCH_CONTRACTORS_QUERY = gql`
  query FetchContractors($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchContractors(criteriaRequests: $criteriaRequests, collection: $collection) {
      contractorCode
      contractorName
      workOrders {
            workOrderNumber
            workOrderDate
            proposalReferenceNumber
            NumberOfEmployee
            contractPeriodFrom
            contractPeriodTo
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

const FETCH_EMPLOYEE_CATEGORIES_QUERY = gql`
  query FetchEmployeeCategories($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      organizationName
      organizationCode
      employeeCategories {
        employeeCategoryCode
        employeeCategoryName
        employeeCategoryDescription
      }
    }
  }
`

const FETCH_SHIFTS_QUERY = gql`
  query FetchShifts($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchShifts(criteriaRequests: $criteriaRequests, collection: $collection) {
      organizationCode
      tenantCode
      shiftGroupCode
      shiftGroupName
      subsidiary {
        subsidiaryCode
        subsidiaryName
      }
      location {
        locationCode
        locationName
      }
      employeeCategory
      shift {
        shiftCode
        shiftName
      }
    }
  }
`

const FETCH_CONTRACT_EMPLOYEES_QUERY = gql`
  query FetchContractEmployees($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchEmployees(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      employeeID
      firstName
      middleName
      lastName
      organizationCode
      contractorCode
      tenantCode
      subsidiaryCode
      divisionCode
      departmentCode
      subDepartmentCode
      sectionCode
      designationCode
      gradeCode
      employeeCategoryCode
      locationCode
      workOrderNumber
    }
  }
`

// Parent-child relationship map
const PARENT_FIELD_MAP: Record<string, string> = {
  subsidiaries: "",
  divisions: "subsidiaries",
  departments: "divisions",
  subDepartments: "departments",
  sections: "subDepartments",
  designations: "",
  grades: "",
  employeeCategories: "",
  locations: "",
  contractors: "",
  workOrders: "contractors",
  shiftGroups: "",
  shifts: "shiftGroups",
  contractEmployees: ""
}

interface TableFilterSectionProps {
  tableMenuItems: TableMenuItem[]
  onSaveAndContinue?: () => void
  // Callback to get selected items for final submission
  onFilterDataChange?: (filterData: Record<TableType, string[]>) => void
  // Initial filter data to restore state when navigating back
  filterData?: Record<TableType, string[]>
}

export function TableFilterSection({
  tableMenuItems,
  onSaveAndContinue,
  onFilterDataChange,
  filterData: initialFilterData,
}: TableFilterSectionProps) {
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters } = useEmpHierarchy()

  // Track which tables are visible/selected in sidebar
  const [visibleTables, setVisibleTables] = useState<Set<TableType>>(new Set())
  
  // Track if visible tables have been initialized to prevent reset on data changes
  const visibleTablesInitialized = useRef(false)

  // Selected items for each table type - initialize from prop if available
  const [selectedSubsidiaries, setSelectedSubsidiaries] = useState<string[]>(initialFilterData?.subsidiaries || [])
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>(initialFilterData?.divisions || [])
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(initialFilterData?.departments || [])
  const [selectedSubDepartments, setSelectedSubDepartments] = useState<string[]>(initialFilterData?.subDepartments || [])
  const [selectedSections, setSelectedSections] = useState<string[]>(initialFilterData?.sections || [])
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>(initialFilterData?.designations || [])
  const [selectedGrades, setSelectedGrades] = useState<string[]>(initialFilterData?.grades || [])
  const [selectedEmployeeCategories, setSelectedEmployeeCategories] = useState<string[]>(initialFilterData?.employeeCategories || [])
  const [selectedLocations, setSelectedLocations] = useState<string[]>(initialFilterData?.locations || [])
  const [selectedContractors, setSelectedContractors] = useState<string[]>(initialFilterData?.contractors || [])
  const [selectedWorkOrders, setSelectedWorkOrders] = useState<string[]>(initialFilterData?.workOrders || [])
  const [selectedShiftGroups, setSelectedShiftGroups] = useState<string[]>(initialFilterData?.shiftGroups || [])
  const [selectedShifts, setSelectedShifts] = useState<string[]>(initialFilterData?.shifts || [])
  const [selectedContractEmployees, setSelectedContractEmployees] = useState<string[]>(initialFilterData?.contractEmployees || [])

  // Track which table type's add field is open
  const [openAddFieldType, setOpenAddFieldType] = useState<TableType | null>(null)

  // Search states for each table
  const [subsidiariesSearch, setSubsidiariesSearch] = useState('')
  const [divisionsSearch, setDivisionsSearch] = useState('')
  const [departmentsSearch, setDepartmentsSearch] = useState('')
  const [designationsSearch, setDesignationsSearch] = useState('')
  const [subDepartmentsSearch, setSubDepartmentsSearch] = useState('')
  const [gradesSearch, setGradesSearch] = useState('')
  const [sectionsSearch, setSectionsSearch] = useState('')
  const [employeeCategoriesSearch, setEmployeeCategoriesSearch] = useState('')
  const [contractorSearch, setContractorSearch] = useState('')
  const [locationsSearch, setLocationsSearch] = useState('')
  const [workOrderSearch, setWorkOrderSearch] = useState('')
  const [shiftGroupsSearch, setShiftGroupsSearch] = useState('')
  const [shiftsSearch, setShiftsSearch] = useState('')
  const [contractEmployeesSearch, setContractEmployeesSearch] = useState('')

  // Selected field for each table (code or name)
  const [subsidiariesField, setSubsidiariesField] = useState<'code' | 'name'>('code')
  const [divisionsField, setDivisionsField] = useState<'code' | 'name'>('code')
  const [departmentsField, setDepartmentsField] = useState<'code' | 'name'>('code')
  const [designationsField, setDesignationsField] = useState<'code' | 'name'>('code')
  const [subDepartmentsField, setSubDepartmentsField] = useState<'code' | 'name'>('code')
  const [gradesField, setGradesField] = useState<'code' | 'name'>('code')
  const [sectionsField, setSectionsField] = useState<'code' | 'name'>('code')
  const [employeeCategoriesField, setEmployeeCategoriesField] = useState<'code' | 'name'>('code')
  const [contractorField, setContractorField] = useState<'code' | 'name'>('code')
  const [locationsField, setLocationsField] = useState<'code' | 'name'>('code')
  const [workOrderField, setWorkOrderField] = useState<'code' | 'name'>('code')
  const [shiftGroupsField, setShiftGroupsField] = useState<'code' | 'name'>('code')
  const [shiftsField, setShiftsField] = useState<'code' | 'name'>('code')
  const [contractEmployeesField, setContractEmployeesField] = useState<'code' | 'name'>('code')

  // Pagination states
  const [subsidiariesPage, setSubsidiariesPage] = useState(1)
  const [divisionsPage, setDivisionsPage] = useState(1)
  const [departmentsPage, setDepartmentsPage] = useState(1)
  const [designationsPage, setDesignationsPage] = useState(1)
  const [subDepartmentsPage, setSubDepartmentsPage] = useState(1)
  const [gradesPage, setGradesPage] = useState(1)
  const [sectionsPage, setSectionsPage] = useState(1)
  const [employeeCategoriesPage, setEmployeeCategoriesPage] = useState(1)
  const [contractorPage, setContractorPage] = useState(1)
  const [locationsPage, setLocationsPage] = useState(1)
  const [workOrderPage, setWorkOrderPage] = useState(1)
  const [shiftGroupsPage, setShiftGroupsPage] = useState(1)
  const [shiftsPage, setShiftsPage] = useState(1)
  const [contractEmployeesPage, setContractEmployeesPage] = useState(1)

  const pageSize = 5

  // Sync state when filterData prop changes (when navigating back to this step)
  // Only restore visibleTables on initial mount when initialFilterData has values
  // This prevents visibleTables from being reset when child selections are auto-populated
  useEffect(() => {
    if (initialFilterData) {
      // Restore all selected items from the prop
      setSelectedSubsidiaries(initialFilterData.subsidiaries || [])
      setSelectedDivisions(initialFilterData.divisions || [])
      setSelectedDepartments(initialFilterData.departments || [])
      setSelectedSubDepartments(initialFilterData.subDepartments || [])
      setSelectedSections(initialFilterData.sections || [])
      setSelectedDesignations(initialFilterData.designations || [])
      setSelectedGrades(initialFilterData.grades || [])
      setSelectedEmployeeCategories(initialFilterData.employeeCategories || [])
      setSelectedLocations(initialFilterData.locations || [])
      setSelectedContractors(initialFilterData.contractors || [])
      setSelectedWorkOrders(initialFilterData.workOrders || [])
      setSelectedShiftGroups(initialFilterData.shiftGroups || [])
      setSelectedShifts(initialFilterData.shifts || [])
      setSelectedContractEmployees(initialFilterData.contractEmployees || [])
      
      // Only restore visibleTables on initial mount when we have data but visibleTables hasn't been initialized yet
      // This prevents resetting visibleTables when child selections are auto-populated later
      if (!visibleTablesInitialized.current) {
        const tablesWithSelections = new Set<TableType>()
        tableMenuItems.forEach(item => {
          const selections = initialFilterData[item.id as TableType] || []
          if (selections.length > 0) {
            tablesWithSelections.add(item.id)
          }
        })
        // If we have selections, restore visibleTables, otherwise keep empty set (user will select in sidebar)
        if (tablesWithSelections.size > 0) {
          setVisibleTables(tablesWithSelections)
        }
        visibleTablesInitialized.current = true
      }
    }
  }, [initialFilterData, tableMenuItems])

  // Helper function to create base request data
  const createBaseRequestData = () => ({
    criteriaRequests: [
      {
        field: 'tenantCode',
        operator: 'is',
        value: tenantCode,
      },
    ],
  })

  // REST API request data for subsidiaries
  const subsidiariesRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    
      requestData.arrayFilter = {
        arrayField: 'subsidiaries',
        filterCriteria: [
          {
            field: 'subsidiaryCode',
            operator: 'in',
            value: hierarchyFilters.subsidiaries,
          },
        ],
      }
    
    return requestData
  }, [tenantCode, hierarchyFilters])


  // REST API request data for divisions
  const divisionsRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    
      requestData.arrayFilter = {
        arrayField: 'divisions',
        filterCriteria: [
          {
            field: 'divisionCode',
            operator: 'in',
            value: hierarchyFilters.divisions,
          },
        ],
      }
    
    return requestData
  }, [tenantCode, hierarchyFilters])

  // REST API request data for departments
  const departmentsRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
      requestData.arrayFilter = {
        arrayField: 'departments',
        filterCriteria: [
          {
            field: 'departmentCode',
            operator: 'in',
            value: hierarchyFilters.departments,
          },
        ],
      }
    
    return requestData
  }, [tenantCode, hierarchyFilters])

  // REST API request data for subDepartments (filter by departmentCode)
  const subDepartmentsRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    
      requestData.arrayFilter = {
        arrayField: 'subDepartments',
        filterCriteria: [
          {
            field: 'departmentCode',
            operator: 'in',
            value: hierarchyFilters.departments,
          },
        ],
      }
    
    return requestData
  }, [tenantCode, hierarchyFilters])

  // REST API request data for sections (filter by departmentCode)
  const sectionsRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    
      requestData.arrayFilter = {
        arrayField: 'sections',
        filterCriteria: [
          {
            field: 'departmentCode',
            operator: 'in',
            value: hierarchyFilters.departments,
          },
        ],
      }
    
    return requestData
  }, [tenantCode, hierarchyFilters])

  // REST API request data for designations (filter by divisionCode)
  const designationsRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    
      requestData.arrayFilter = {
        arrayField: 'designations',
        filterCriteria: [],
      }    
    return requestData
  }, [tenantCode, hierarchyFilters])

  // REST API request data for grades (filter by divisionCode, similar to designations)
  const gradesRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    
      requestData.arrayFilter = {
        arrayField: 'grades',
        filterCriteria: [],
      }
    
    return requestData
  }, [tenantCode, hierarchyFilters])

  // REST API request data for locations
  const locationsRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    
      requestData.arrayFilter = {
        arrayField: 'location',
        filterCriteria: [
          {
            field: 'locationCode',
            operator: 'in',
            value: hierarchyFilters.locations,
          },
        ],
      }
    
    return requestData
  }, [tenantCode, hierarchyFilters])

  // REST API request data for employee categories (no value in filterCriteria)
  const employeeCategoriesRequestData = useMemo(() => {
    const requestData: any = createBaseRequestData()
    
    // Categories: no value required in filterCriteria
    requestData.arrayFilter = {
      arrayField: 'employeeCategories',
      filterCriteria: [],
    }
    
    return requestData
  }, [tenantCode, hierarchyFilters])

  const contractorVariables = useMemo(() => {
    const criteriaRequests: any[] = [
      {
        field: 'tenantCode',
        operator: 'eq',
        value: tenantCode,
      },
    ]
    
    // Add contractor filter if hierarchy has contractors
      criteriaRequests.push({
        field: 'contractorCode',
        operator: 'in',
        value: hierarchyFilters.contractors,
      })
    
    return {
      criteriaRequests,
      collection: 'contractor',
    }
  }, [tenantCode, hierarchyFilters])


  const shiftVariables = useMemo(() => {
    const criteriaRequests: any[] = [
      {
        field: 'tenantCode',
        operator: 'eq',
        value: tenantCode,
      },
    ]
    
    // Add subsidiary filter if hierarchy has subsidiaries
    if (hierarchyFilters?.subsidiaries && hierarchyFilters.subsidiaries.length > 0) {
      criteriaRequests.push({
        field: 'subsidiary.subsidiaryCode',
        operator: 'in',
        value: hierarchyFilters.subsidiaries,
      })
    }
    
    // Add location filter if hierarchy has locations
    if (hierarchyFilters?.locations && hierarchyFilters.locations.length > 0) {
      criteriaRequests.push({
        field: 'location.locationCode',
        operator: 'in',
        value: hierarchyFilters.locations,
      })
    }
    
    return {
      criteriaRequests,
      collection: 'shift',
    }
  }, [tenantCode, hierarchyFilters])

  const contractEmployeeVariables = useMemo(() => ({
    criteriaRequests: [
      {
        field: 'tenantCode',
        operator: 'eq',
        value: tenantCode,
      },
    ],
    collection: 'contract_employee',
  }), [tenantCode])

  // Fetch data using REST API search/aggregate
  const { data: subsidiariesResponse, loading: subsidiariesLoading,refetch: refetchSubsidiaries } = useRequest<any[]>({
    url: 'organization/aggregate',
    method: 'POST',
    data: subsidiariesRequestData,
    onSuccess: (data: any) => {
      // Process data if tenantCode is available
      if (tenantCode) {
        // Data processing handled in useMemo
      }
    },
    onError: (error: any) => {
      if (tenantCode) {
        console.error("Error fetching subsidiaries:", error)
      }
    },
    dependencies: [], // manual refetch pattern
  })

  // Initial refetch once tenantCode is available (same pattern as employee-shift-page)
  useEffect(() => {
    if (!tenantCode) return
    refetchSubsidiaries()
    refetchDivisions()
    refetchDepartments()
    refetchDesignations()
    refetchSubDepartments()
    refetchSections()
    refetchGrades()
    refetchLocations()
    refetchEmployeeCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  // Refetch when hierarchy filters change
  useEffect(() => {
    if (!tenantCode) return
    refetchSubsidiaries()
    refetchDivisions()
    refetchDepartments()
    refetchDesignations()
    refetchSubDepartments()
    refetchSections()
    refetchGrades()
    refetchLocations()
    refetchEmployeeCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(hierarchyFilters)])

  const { data: divisionsResponse, loading: divisionsLoading, refetch: refetchDivisions } = useRequest<any[]>({
    url: 'organization/aggregate',
    method: 'POST',
    data: divisionsRequestData,
    onSuccess: (data: any) => {
      if (tenantCode) {
        // Data processing handled in useMemo
      }
    },
    onError: (error: any) => {
      if (tenantCode) {
        console.error("Error fetching divisions:", error)
      }
    },
    dependencies: [], // manual refetch pattern
  })

  const { data: departmentsResponse, loading: departmentsLoading, refetch: refetchDepartments } = useRequest<any[]>({
    url: 'organization/aggregate',
    method: 'POST',
    data: departmentsRequestData,
    onSuccess: (data: any) => {
      if (tenantCode) {
        // Data processing handled in useMemo
      }
    },
    onError: (error: any) => {
      if (tenantCode) {
        console.error("Error fetching departments:", error)
      }
    },
    dependencies: [], // manual refetch pattern
  })

  const { data: designationsResponse, loading: designationsLoading, refetch: refetchDesignations } = useRequest<any[]>({
    url: 'organization/aggregate',
    method: 'POST',
    data: designationsRequestData,
    onSuccess: (data: any) => {
      if (tenantCode) {
        // Data processing handled in useMemo
      }
    },
    onError: (error: any) => {
      if (tenantCode) {
        console.error("Error fetching designations:", error)
      }
    },
    dependencies: [], // manual refetch pattern
  })

  const { data: subDepartmentsResponse, loading: subDepartmentsLoading, refetch: refetchSubDepartments } = useRequest<any[]>({
    url: 'organization/aggregate',
    method: 'POST',
    data: subDepartmentsRequestData,
    onSuccess: (data: any) => {
      if (tenantCode) {
        // Data processing handled in useMemo
      }
    },
    onError: (error: any) => {
      if (tenantCode) {
        console.error("Error fetching sub departments:", error)
      }
    },
    dependencies: [], // manual refetch pattern
  })

  const { data: sectionsResponse, loading: sectionsLoading, refetch: refetchSections } = useRequest<any[]>({
    url: 'organization/aggregate',
    method: 'POST',
    data: sectionsRequestData,
    onSuccess: (data: any) => {
      if (tenantCode) {
        // Data processing handled in useMemo
      }
    },
    onError: (error: any) => {
      if (tenantCode) {
        console.error("Error fetching sections:", error)
      }
    },
    dependencies: [], // manual refetch pattern
  })

  const { data: gradesResponse, loading: gradesLoading, refetch: refetchGrades } = useRequest<any[]>({
    url: 'organization/aggregate',
    method: 'POST',
    data: gradesRequestData,
    onSuccess: (data: any) => {
      if (tenantCode) {
        // Data processing handled in useMemo
      }
    },
    onError: (error: any) => {
      if (tenantCode) {
        console.error("Error fetching grades:", error)
      }
    },
    dependencies: [], // manual refetch pattern
  })

  const { data: contractorsResponse, loading: contractorsLoading } = useQuery(FETCH_CONTRACTORS_QUERY, {
    client,
    variables: contractorVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode,
  })

  const { data: locationsResponse, loading: locationsLoading, refetch: refetchLocations } = useRequest<any[]>({
    url: 'organization/aggregate',
    method: 'POST',
    data: locationsRequestData,
    onSuccess: (data: any) => {
      if (tenantCode) {
        // Data processing handled in useMemo
      }
    },
    onError: (error: any) => {
      if (tenantCode) {
        console.error("Error fetching locations:", error)
      }
    },
    dependencies: [], // manual refetch pattern
  })

  const { data: employeeCategoriesResponse, loading: employeeCategoriesLoading, refetch: refetchEmployeeCategories } = useRequest<any[]>({
    url: 'organization/aggregate',
    method: 'POST',
    data: employeeCategoriesRequestData,
    onSuccess: (data: any) => {
      if (tenantCode) {
        // Data processing handled in useMemo
      }
    },
    onError: (error: any) => {
      if (tenantCode) {
        console.error("Error fetching employee categories:", error)
      }
    },
    dependencies: [], // manual refetch pattern
  })

  const { data: shiftsResponse, loading: shiftsLoading } = useQuery(FETCH_SHIFTS_QUERY, {
    client,
    variables: shiftVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode,
  })

  const { data: contractEmployeesResponse, loading: contractEmployeesLoading } = useQuery(FETCH_CONTRACT_EMPLOYEES_QUERY, {
    client,
    variables: contractEmployeeVariables,
    fetchPolicy: 'cache-and-network',
    skip: !tenantCode,
  })

  // Process REST API responses - Extract data from array of objects
  // The aggregate endpoint returns an array of organization objects with nested arrays
  const rawSubsidiaries = useMemo(() => {
    if (!subsidiariesResponse) return []
    
    // Handle if response is already a flat array
    if (Array.isArray(subsidiariesResponse) && subsidiariesResponse.length > 0) {
      // Check if first item has subsidiaries property (nested structure)
      if (subsidiariesResponse[0]?.subsidiaries && Array.isArray(subsidiariesResponse[0].subsidiaries)) {
        const allSubsidiaries: any[] = []
        subsidiariesResponse.forEach((org: any) => {
          if (org?.subsidiaries && Array.isArray(org.subsidiaries)) {
            allSubsidiaries.push(...org.subsidiaries)
          }
        })
        return allSubsidiaries
      }
      // If it's a flat array of subsidiaries, return as is
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

  const rawDesignations = useMemo(() => {
    if (!designationsResponse) return []
    
    if (Array.isArray(designationsResponse) && designationsResponse.length > 0) {
      if (designationsResponse[0]?.designations && Array.isArray(designationsResponse[0].designations)) {
        const allDesignations: any[] = []
        designationsResponse.forEach((org: any) => {
          if (org?.designations && Array.isArray(org.designations)) {
            allDesignations.push(...org.designations)
          }
        })
        return allDesignations
      }
      if (designationsResponse[0]?.designationCode) {
        return designationsResponse
      }
    }
    
    return []
  }, [designationsResponse])

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

  const rawGrades = useMemo(() => {
    if (!gradesResponse) return []
    
    if (Array.isArray(gradesResponse) && gradesResponse.length > 0) {
      if (gradesResponse[0]?.grades && Array.isArray(gradesResponse[0].grades)) {
        const allGrades: any[] = []
        gradesResponse.forEach((org: any) => {
          if (org?.grades && Array.isArray(org.grades)) {
            allGrades.push(...org.grades)
          }
        })
        return allGrades
      }
      if (gradesResponse[0]?.gradeCode) {
        return gradesResponse
      }
    }
    
    return []
  }, [gradesResponse])

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

  const rawWorkOrders = useMemo(() => {
    const contractors = contractorsResponse?.fetchContractors
    if (!contractors || !Array.isArray(contractors)) return []
    
    const allWorkOrders: any[] = []
    contractors.forEach((contractor: any) => {
      if (contractor.workOrders && Array.isArray(contractor.workOrders)) {
        contractor.workOrders.forEach((workOrder: any) => {
          allWorkOrders.push({
            ...workOrder,
            code: workOrder.workOrderNumber,
            contractorCode: contractor.contractorCode,
          })
        })
      }
    })
    return allWorkOrders
  }, [contractorsResponse])

  const rawShiftGroups = useMemo(() => {
    const shifts = shiftsResponse?.fetchShifts
    if (!shifts || !Array.isArray(shifts)) return []
    
    const shiftGroupMap = new Map<string, any>()
    shifts.forEach((item: any) => {
      if (item.shiftGroupCode && !shiftGroupMap.has(item.shiftGroupCode)) {
        shiftGroupMap.set(item.shiftGroupCode, {
          shiftGroupCode: item.shiftGroupCode,
          shiftGroupName: item.shiftGroupName,
        })
      }
    })
    return Array.from(shiftGroupMap.values())
  }, [shiftsResponse])

  const rawShifts = useMemo(() => {
    const shifts = shiftsResponse?.fetchShifts
    if (!shifts || !Array.isArray(shifts)) return []
    
    const allShifts: any[] = []
    shifts.forEach((item: any) => {
      if (item.shift && Array.isArray(item.shift)) {
        item.shift.forEach((shift: any) => {
          allShifts.push({
            ...shift,
            shiftCode: shift.shiftCode,
            shiftName: shift.shiftName,
            shiftGroupCode: item.shiftGroupCode,
          })
        })
      }
    })
    return allShifts
  }, [shiftsResponse])

  const rawContractEmployees = useMemo(() => {
    const employees = contractEmployeesResponse?.fetchEmployees
    if (!employees || !Array.isArray(employees)) return []
    return employees.filter((emp: any) => emp?.isDeleted !== true)
  }, [contractEmployeesResponse])

  // Normalized data for display
  const normalizedSubsidiaries = useMemo(() => {
    return rawSubsidiaries.map((sub: any) => ({
      code: sub.subsidiaryCode,
      name: sub.subsidiaryName,
    }))
  }, [rawSubsidiaries])

  const normalizedDivisions = useMemo(() => {
    return rawDivisions.map((div: any) => ({
      code: div.divisionCode,
      name: div.divisionName,
    }))
  }, [rawDivisions])

  const normalizedDepartments = useMemo(() => {
    return rawDepartments.map((dept: any) => ({
      code: dept.departmentCode,
      name: dept.departmentName,
    }))
  }, [rawDepartments])

  const normalizedDesignations = useMemo(() => {
    return rawDesignations.map((des: any) => ({
      code: des.designationCode,
      name: des.designationName,
    }))
  }, [rawDesignations])

  const normalizedSubDepartments = useMemo(() => {
    return rawSubDepartments.map((subDept: any) => ({
      code: subDept.subDepartmentCode,
      name: subDept.subDepartmentName,
    }))
  }, [rawSubDepartments])

  const normalizedGrades = useMemo(() => {
    return rawGrades.map((grade: any) => ({
      code: grade.gradeCode,
      name: grade.gradeName,
    }))
  }, [rawGrades])

  const normalizedSections = useMemo(() => {
    return rawSections.map((sec: any) => ({
      code: sec.sectionCode,
      name: sec.sectionName,
    }))
  }, [rawSections])

  const normalizedEmployeeCategories = useMemo(() => {
    if (!employeeCategoriesResponse || !Array.isArray(employeeCategoriesResponse)) return []
    
    const allCategories: any[] = []
    employeeCategoriesResponse.forEach((org: any) => {
      if (Array.isArray(org.employeeCategories)) {
        org.employeeCategories.forEach((cat: any) => {
          allCategories.push({
            code: cat.employeeCategoryCode,
            name: cat.employeeCategoryName,
          })
        })
      }
    })
    
    // Remove duplicates by code
    const byCode = new Map<string, any>()
    allCategories.forEach((cat: any) => {
      if (!byCode.has(cat.code)) {
        byCode.set(cat.code, cat)
      }
    })
    
    return Array.from(byCode.values())
  }, [employeeCategoriesResponse])

  const normalizedContractors = useMemo(() => {
    const contractors = contractorsResponse?.fetchContractors
    if (!contractors) return []
    return contractors.map((ctr: any) => ({
      code: ctr.contractorCode,
      name: ctr.contractorName,
    }))
  }, [contractorsResponse])

  const normalizedLocations = useMemo(() => {
    if (!locationsResponse) return []
    
    if (Array.isArray(locationsResponse) && locationsResponse.length > 0) {
      // Check if nested structure (organization objects with location arrays)
      if (locationsResponse[0]?.location && Array.isArray(locationsResponse[0].location)) {
        const allLocations: any[] = []
        locationsResponse.forEach((org: any) => {
          if (Array.isArray(org.location)) {
            org.location.forEach((loc: any) => {
              allLocations.push({
                code: loc.locationCode,
                name: loc.locationName,
              })
            })
          }
        })
        const byCode = new Map<string, any>()
        allLocations.forEach((loc: any) => {
          if (!byCode.has(loc.code)) {
            byCode.set(loc.code, loc)
          }
        })
        return Array.from(byCode.values())
      }
      // Check if flat array of locations
      if (locationsResponse[0]?.locationCode) {
        const byCode = new Map<string, any>()
        locationsResponse.forEach((loc: any) => {
          if (loc.locationCode && !byCode.has(loc.locationCode)) {
            byCode.set(loc.locationCode, {
              code: loc.locationCode,
              name: loc.locationName,
            })
          }
        })
        return Array.from(byCode.values())
      }
    }
    
    return []
  }, [locationsResponse])

  const normalizedWorkOrders = useMemo(() => {
    return rawWorkOrders.map((wo: any) => ({
      code: wo.workOrderNumber || wo.code,
      name: wo.workOrderNumber || wo.code,
    }))
  }, [rawWorkOrders])

  const normalizedShiftGroups = useMemo(() => {
    return rawShiftGroups.map((sg: any) => ({
      code: sg.shiftGroupCode,
      name: sg.shiftGroupName,
    }))
  }, [rawShiftGroups])

  const normalizedShifts = useMemo(() => {
    return rawShifts.map((shift: any) => ({
      code: shift.shiftCode,
      name: shift.shiftName,
    }))
  }, [rawShifts])

  const normalizedContractEmployees = useMemo(() => {
    return rawContractEmployees.map((emp: any) => ({
      code: emp.employeeID,
      name: `${emp.firstName || ''} ${emp.middleName || ''} ${emp.lastName || ''}`.trim() || emp.employeeID,
    }))
  }, [rawContractEmployees])

  // Helper functions to get selected items and setters for each table type
  const getSelectedItems = (type: TableType): string[] => {
    switch (type) {
      case 'subsidiaries': return selectedSubsidiaries
      case 'divisions': return selectedDivisions
      case 'departments': return selectedDepartments
      case 'subDepartments': return selectedSubDepartments
      case 'sections': return selectedSections
      case 'designations': return selectedDesignations
      case 'grades': return selectedGrades
      case 'employeeCategories': return selectedEmployeeCategories
      case 'locations': return selectedLocations
      case 'contractors': return selectedContractors
      case 'workOrders': return selectedWorkOrders
      case 'shiftGroups': return selectedShiftGroups
      case 'shifts': return selectedShifts
      case 'contractEmployees': return selectedContractEmployees
      default: return []
    }
  }

  const getDataSetter = (type: TableType): ((codes: string[]) => void) => {
    switch (type) {
      case 'subsidiaries': return setSelectedSubsidiaries
      case 'divisions': return setSelectedDivisions
      case 'departments': return setSelectedDepartments
      case 'subDepartments': return setSelectedSubDepartments
      case 'sections': return setSelectedSections
      case 'designations': return setSelectedDesignations
      case 'grades': return setSelectedGrades
      case 'employeeCategories': return setSelectedEmployeeCategories
      case 'locations': return setSelectedLocations
      case 'contractors': return setSelectedContractors
      case 'workOrders': return setSelectedWorkOrders
      case 'shiftGroups': return setSelectedShiftGroups
      case 'shifts': return setSelectedShifts
      case 'contractEmployees': return setSelectedContractEmployees
      default: return () => {}
    }
  }

  // Get raw data (with relationship fields) for filtering
  const getRawDataForType = (type: TableType): any[] => {
    switch (type) {
      case 'subsidiaries': return rawSubsidiaries
      case 'divisions': return rawDivisions
      case 'departments': return rawDepartments
      case 'subDepartments': return rawSubDepartments
      case 'sections': return rawSections
      case 'designations': return rawDesignations
      case 'grades': return rawGrades
      case 'employeeCategories': return []
      case 'locations': return []
      case 'contractors': return []
      case 'workOrders': return rawWorkOrders
      case 'shiftGroups': return rawShiftGroups
      case 'shifts': return rawShifts
      case 'contractEmployees': return rawContractEmployees
      default: return []
    }
  }

  const getDataForType = (type: TableType): any[] => {
    switch (type) {
      case 'subsidiaries': return normalizedSubsidiaries
      case 'divisions': return normalizedDivisions
      case 'departments': return normalizedDepartments
      case 'subDepartments': return normalizedSubDepartments
      case 'sections': return normalizedSections
      case 'designations': return normalizedDesignations
      case 'grades': return normalizedGrades
      case 'employeeCategories': return normalizedEmployeeCategories
      case 'locations': return normalizedLocations
      case 'contractors': return normalizedContractors
      case 'workOrders': return normalizedWorkOrders
      case 'shiftGroups': return normalizedShiftGroups
      case 'shifts': return normalizedShifts
      case 'contractEmployees': return normalizedContractEmployees
      default: return []
    }
  }

  const getLoadingForType = (type: TableType): boolean => {
    switch (type) {
      case 'subsidiaries': return subsidiariesLoading
      case 'divisions': return divisionsLoading
      case 'departments': return departmentsLoading
      case 'subDepartments': return subDepartmentsLoading
      case 'sections': return sectionsLoading
      case 'designations': return designationsLoading
      case 'grades': return gradesLoading
      case 'employeeCategories': return employeeCategoriesLoading
      case 'locations': return locationsLoading
      case 'contractors': return contractorsLoading
      case 'workOrders': return false
      case 'shiftGroups': return shiftsLoading
      case 'shifts': return shiftsLoading
      case 'contractEmployees': return contractEmployeesLoading
      default: return false
    }
  }

  const getFieldForType = (type: TableType): 'code' | 'name' => {
    switch (type) {
      case 'subsidiaries': return subsidiariesField
      case 'divisions': return divisionsField
      case 'departments': return departmentsField
      case 'subDepartments': return subDepartmentsField
      case 'sections': return sectionsField
      case 'designations': return designationsField
      case 'grades': return gradesField
      case 'employeeCategories': return employeeCategoriesField
      case 'locations': return locationsField
      case 'contractors': return contractorField
      case 'workOrders': return workOrderField
      case 'shiftGroups': return shiftGroupsField
      case 'shifts': return shiftsField
      case 'contractEmployees': return contractEmployeesField
      default: return 'code'
    }
  }

  // Get all children of a parent table type
  const getChildrenOfParent = (parentType: TableType): TableType[] => {
    return tableMenuItems
      .filter(item => PARENT_FIELD_MAP[item.id] === parentType)
      .map(item => item.id)
  }

  // Get all descendant types recursively
  const getAllDescendants = (parentType: TableType): TableType[] => {
    const children = getChildrenOfParent(parentType)
    const descendants = [...children]
    
    children.forEach(child => {
      descendants.push(...getAllDescendants(child))
    })
    
    return descendants
  }

  // Get all child codes that belong to a specific parent code
  const getChildCodesForParent = (childType: TableType, parentCode: string): string[] => {
    const rawChildData = getRawDataForType(childType)
    if (rawChildData.length === 0) return []
    
    const childCodes: string[] = []
    
    rawChildData.forEach((item: any) => {
      let belongsToParent = false
      
      switch (childType) {
        case 'divisions':
          belongsToParent = item.subsidiaryCode === parentCode
          if (belongsToParent) childCodes.push(item.divisionCode)
          break
        case 'departments':
          belongsToParent = item.divisionCode === parentCode
          if (belongsToParent) childCodes.push(item.departmentCode)
          break
        case 'subDepartments':
          belongsToParent = item.departmentCode === parentCode
          if (belongsToParent) childCodes.push(item.subDepartmentCode)
          break
        case 'sections':
          belongsToParent = item.subDepartmentCode === parentCode
          if (belongsToParent) childCodes.push(item.sectionCode)
          break
        case 'designations':
          belongsToParent = item.divisionCode === parentCode
          if (belongsToParent) childCodes.push(item.designationCode)
          break
        case 'grades':
          belongsToParent = item.designationCode === parentCode
          if (belongsToParent) childCodes.push(item.gradeCode)
          break
        case 'workOrders':
          belongsToParent = item.contractorCode === parentCode
          if (belongsToParent) childCodes.push(item.code)
          break
        case 'shifts':
          belongsToParent = item.shiftGroupCode === parentCode
          if (belongsToParent) childCodes.push(item.shiftCode)
          break
      }
    })
    
    return childCodes
  }

  // Recursively remove all descendants of a deleted parent code
  const removeDescendantsOfParent = (parentType: TableType, deletedParentCode: string) => {
    if (!deletedParentCode) return
    
    const children = getChildrenOfParent(parentType)
    
    children.forEach(childType => {
      const childCodesToRemove = getChildCodesForParent(childType, deletedParentCode)
      
      if (childCodesToRemove.length > 0) {
        const childSelected = getSelectedItems(childType)
        const childSetter = getDataSetter(childType)
        
        const remainingChildren = childSelected.filter(code => !childCodesToRemove.includes(code))
        
        if (remainingChildren.length !== childSelected.length) {
          childSetter(remainingChildren)
        }
        
        childCodesToRemove.forEach(childCode => {
          removeDescendantsOfParent(childType, childCode)
        })
      }
    })
  }

  // Check if a child item still has a valid direct parent
  const isChildItemValid = (childType: TableType, childCode: string, parentCodes: string[]): boolean => {
    const rawChildData = getRawDataForType(childType)
    if (rawChildData.length === 0) return true
    
    const childItem = rawChildData.find((item: any) => {
      switch (childType) {
        case 'divisions': return item.divisionCode === childCode
        case 'departments': return item.departmentCode === childCode
        case 'subDepartments': return item.subDepartmentCode === childCode
        case 'sections': return item.sectionCode === childCode
        case 'designations': return item.designationCode === childCode
        case 'grades': return item.gradeCode === childCode
        default: return item.code === childCode
      }
    })
    
    if (!childItem) return false
    
    const parentField = PARENT_FIELD_MAP[childType]
    if (!parentField) return true
    
    switch (childType) {
      case 'divisions':
        return parentCodes.includes(childItem.subsidiaryCode || '')
      case 'departments':
        return parentCodes.includes(childItem.divisionCode || '')
      case 'subDepartments':
        return parentCodes.includes(childItem.departmentCode || '')
      case 'sections':
        return parentCodes.includes(childItem.subDepartmentCode || '')
      case 'designations':
        return parentCodes.includes(childItem.divisionCode || '')
      case 'grades':
        return parentCodes.includes(childItem.designationCode || '')
      case 'workOrders':
        return parentCodes.includes(childItem.contractorCode || '')
      case 'shifts':
        return parentCodes.includes(childItem.shiftGroupCode || '')
      default:
        return true
    }
  }

  // Automatically filter child selections when parent selections change
  const filterChildSelections = (parentType: TableType) => {
    const parentCodes = getSelectedItems(parentType)
    
    if (parentCodes.length === 0) {
      const allDescendants = getAllDescendants(parentType)
      
      allDescendants.forEach(childType => {
        const childSelected = getSelectedItems(childType)
        if (childSelected.length > 0) {
          const childSetter = getDataSetter(childType)
          childSetter([])
        }
      })
      
      return
    }
    
    const descendants = getAllDescendants(parentType)
    descendants.forEach(childType => {
      const childParentField = PARENT_FIELD_MAP[childType]
      const childSelected = getSelectedItems(childType)
      
      if (childParentField === parentType) {
        const childSetter = getDataSetter(childType)
        
        const validChildren = childSelected.filter(childCode => 
          isChildItemValid(childType, childCode, parentCodes)
        )
        
        if (validChildren.length !== childSelected.length) {
          childSetter(validChildren)
          
          if (validChildren.length === 0) {
            const grandChildren = getAllDescendants(childType)
            grandChildren.forEach(grandChildType => {
              const grandChildSelected = getSelectedItems(grandChildType)
              if (grandChildSelected.length > 0) {
                const grandChildSetter = getDataSetter(grandChildType)
                grandChildSetter([])
              }
            })
          }
        }
      }
      
      if (childSelected.length > 0) {
        filterChildSelections(childType)
      }
    })
  }

  // Effect to automatically update child selections when parent selections change
  useEffect(() => {
    if (selectedSubsidiaries.length === 0) {
      if (selectedDivisions.length > 0) setSelectedDivisions([])
      if (selectedDepartments.length > 0) setSelectedDepartments([])
      if (selectedSubDepartments.length > 0) setSelectedSubDepartments([])
      if (selectedSections.length > 0) setSelectedSections([])
      if (selectedDesignations.length > 0) setSelectedDesignations([])
      if (selectedGrades.length > 0) setSelectedGrades([])
    } else {
      filterChildSelections('subsidiaries')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubsidiaries])

  useEffect(() => {
    if (selectedDivisions.length === 0) {
      if (selectedDepartments.length > 0) setSelectedDepartments([])
      if (selectedSubDepartments.length > 0) setSelectedSubDepartments([])
      if (selectedSections.length > 0) setSelectedSections([])
      if (selectedDesignations.length > 0) setSelectedDesignations([])
      if (selectedGrades.length > 0) setSelectedGrades([])
    } else {
      filterChildSelections('divisions')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDivisions])

  useEffect(() => {
    if (selectedDepartments.length === 0) {
      if (selectedSubDepartments.length > 0) setSelectedSubDepartments([])
      if (selectedSections.length > 0) setSelectedSections([])
    } else {
      filterChildSelections('departments')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDepartments])

  useEffect(() => {
    if (selectedSubDepartments.length === 0) {
      if (selectedSections.length > 0) setSelectedSections([])
    } else {
      filterChildSelections('subDepartments')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubDepartments])

  useEffect(() => {
    if (selectedDesignations.length === 0) {
      if (selectedGrades.length > 0) setSelectedGrades([])
    } else {
      filterChildSelections('designations')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDesignations])

  useEffect(() => {
    if (selectedContractors.length === 0) {
      if (selectedWorkOrders.length > 0) setSelectedWorkOrders([])
    } else {
      filterChildSelections('contractors')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContractors])

  useEffect(() => {
    if (selectedShiftGroups.length === 0) {
      if (selectedShifts.length > 0) setSelectedShifts([])
    } else {
      filterChildSelections('shiftGroups')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShiftGroups])

  // Auto-clear child values when parent requirement is not met
  useEffect(() => {
    tableMenuItems.forEach(tableItem => {
      const tableId = tableItem.id
      const parentField = PARENT_FIELD_MAP[tableId]
      
      if (!parentField || parentField === '') return
      
      const selectedItems = getSelectedItems(tableId)
      
      if (selectedItems.length === 0) return
      
      const parentType = parentField as TableType
      const isParentVisible = visibleTables.has(parentType)
      const parentSelected = getSelectedItems(parentType)
      
      if (isParentVisible) {
        if (parentSelected.length === 0) {
          const setter = getDataSetter(tableId)
          setter([])
          return
        }
        
        const rawChildData = getRawDataForType(tableId)
        if (rawChildData.length > 0) {
          const validChildItems = selectedItems.filter(childCode => {
            const childItem = rawChildData.find((item: any) => {
              switch (tableId) {
                case 'divisions': return item.divisionCode === childCode
                case 'departments': return item.departmentCode === childCode
                case 'subDepartments': return item.subDepartmentCode === childCode
                case 'sections': return item.sectionCode === childCode
                case 'designations': return item.designationCode === childCode
                case 'grades': return item.gradeCode === childCode
                case 'workOrders': return (item.workOrderNumber || item.code) === childCode
                case 'shifts': return item.shiftCode === childCode
                default: return false
              }
            })
            
            if (!childItem) return false
            
            switch (tableId) {
              case 'divisions':
                return parentSelected.includes(childItem.subsidiaryCode || '')
              case 'departments':
                return parentSelected.includes(childItem.divisionCode || '')
              case 'subDepartments':
                return parentSelected.includes(childItem.departmentCode || '')
              case 'sections':
                return parentSelected.includes(childItem.subDepartmentCode || '')
              case 'designations':
                return parentSelected.includes(childItem.divisionCode || '')
              case 'grades':
                return parentSelected.includes(childItem.designationCode || '')
              case 'workOrders':
                return parentSelected.includes(childItem.contractorCode || '')
              case 'shifts':
                return parentSelected.includes(childItem.shiftGroupCode || '')
              default:
                return true
            }
          })
          
          if (validChildItems.length !== selectedItems.length) {
            const setter = getDataSetter(tableId)
            setter(validChildItems)
            
            const removedChildren = selectedItems.filter(code => !validChildItems.includes(code))
            removedChildren.forEach(removedCode => {
              removeDescendantsOfParent(tableId, removedCode)
            })
            return
          }
        }
      }
      
      const isParentValid = isParentSelected(tableId)
      
      if (!isParentValid && selectedItems.length > 0) {
        const setter = getDataSetter(tableId)
        setter([])
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedSubsidiaries,
    selectedDivisions,
    selectedDepartments,
    selectedSubDepartments,
    selectedSections,
    selectedDesignations,
    selectedGrades,
    selectedContractors,
    selectedShiftGroups,
    selectedShifts,
    visibleTables.size,
    Array.from(visibleTables).join(',')
  ])

  // Hierarchical check: check up the hierarchy for the first visible ancestor
  const isParentSelected = (type: TableType): boolean => {
    const parentField = PARENT_FIELD_MAP[type];
    
    if (!parentField || parentField === '') {
      return true;
    }
    
    let currentField = parentField;
    
    while (currentField) {
      const currentType = currentField as TableType;
      const isAncestorVisible = visibleTables.has(currentType);
      
      if (isAncestorVisible) {
        const ancestorSelected = getSelectedItems(currentType);
        return ancestorSelected.length > 0;
      }
      
      const grandParentField = PARENT_FIELD_MAP[currentField];
      
      if (!grandParentField || grandParentField === '') {
        return true;
      }
      
      currentField = grandParentField;
    }
    
    return true;
  }

  // Filter child items based on parent codes using relationship fields
  const filterChildByParent = (childType: TableType, parentType: TableType, parentCodes: string[]): any[] => {
    const rawChildData = getRawDataForType(childType);
    const normalizedChildData = getDataForType(childType);
    
    if (rawChildData.length === 0) {
      return normalizedChildData;
    }

    let filteredRawData: any[] = [];
    
    switch (childType) {
      case 'divisions':
        if (parentType === 'subsidiaries') {
          filteredRawData = rawChildData.filter((div: any) => 
            parentCodes.includes(div.subsidiaryCode || '')
          );
        }
        break;
        
      case 'departments':
        if (parentType === 'divisions') {
          filteredRawData = rawChildData.filter((dept: any) => 
            parentCodes.includes(dept.divisionCode || '')
          );
        } else if (parentType === 'subsidiaries') {
          const relevantDivisions = rawDivisions.filter((div: any) => 
            parentCodes.includes(div.subsidiaryCode || '')
          ).map((div: any) => div.divisionCode);
          
          filteredRawData = rawChildData.filter((dept: any) => 
            relevantDivisions.includes(dept.divisionCode || '')
          );
        }
        break;
        
      case 'subDepartments':
        if (parentType === 'departments') {
          filteredRawData = rawChildData.filter((subDept: any) => 
            parentCodes.includes(subDept.departmentCode || '')
          );
        } else if (parentType === 'divisions') {
          const relevantDepartments = rawDepartments.filter((dept: any) => 
            parentCodes.includes(dept.divisionCode || '')
          ).map((dept: any) => dept.departmentCode);
          
          filteredRawData = rawChildData.filter((subDept: any) => 
            relevantDepartments.includes(subDept.departmentCode || '')
          );
        } else if (parentType === 'subsidiaries') {
          const relevantDivisions = rawDivisions.filter((div: any) => 
            parentCodes.includes(div.subsidiaryCode || '')
          ).map((div: any) => div.divisionCode);
          
          const relevantDepartments = rawDepartments.filter((dept: any) => 
            relevantDivisions.includes(dept.divisionCode || '')
          ).map((dept: any) => dept.departmentCode);
          
          filteredRawData = rawChildData.filter((subDept: any) => 
            relevantDepartments.includes(subDept.departmentCode || '')
          );
        }
        break;
        
      case 'sections':
        if (parentType === 'subDepartments') {
          filteredRawData = rawChildData.filter((sec: any) => 
            parentCodes.includes(sec.subDepartmentCode || '')
          );
        } else if (parentType === 'departments') {
          const relevantSubDepts = rawSubDepartments.filter((subDept: any) => 
            parentCodes.includes(subDept.departmentCode || '')
          ).map((subDept: any) => subDept.subDepartmentCode);
          
          filteredRawData = rawChildData.filter((sec: any) => 
            relevantSubDepts.includes(sec.subDepartmentCode || '')
          );
        } else if (parentType === 'divisions') {
          const relevantDepartments = rawDepartments.filter((dept: any) => 
            parentCodes.includes(dept.divisionCode || '')
          ).map((dept: any) => dept.departmentCode);
          
          const relevantSubDepts = rawSubDepartments.filter((subDept: any) => 
            relevantDepartments.includes(subDept.departmentCode || '')
          ).map((subDept: any) => subDept.subDepartmentCode);
          
          filteredRawData = rawChildData.filter((sec: any) => 
            relevantSubDepts.includes(sec.subDepartmentCode || '')
          );
        } else if (parentType === 'subsidiaries') {
          const relevantDivisions = rawDivisions.filter((div: any) => 
            parentCodes.includes(div.subsidiaryCode || '')
          ).map((div: any) => div.divisionCode);
          
          const relevantDepartments = rawDepartments.filter((dept: any) => 
            relevantDivisions.includes(dept.divisionCode || '')
          ).map((dept: any) => dept.departmentCode);
          
          const relevantSubDepts = rawSubDepartments.filter((subDept: any) => 
            relevantDepartments.includes(subDept.departmentCode || '')
          ).map((subDept: any) => subDept.subDepartmentCode);
          
          filteredRawData = rawChildData.filter((sec: any) => 
            relevantSubDepts.includes(sec.subDepartmentCode || '')
          );
        }
        break;
        
      case 'designations':
        filteredRawData = rawChildData;
        // if (parentType === 'divisions') {
        //   filteredRawData = rawChildData.filter((des: any) => 
        //     parentCodes.includes(des.divisionCode || '')
        //   );
        // } else if (parentType === 'subsidiaries') {
        //   const relevantDivisions = rawDivisions.filter((div: any) => 
        //     parentCodes.includes(div.subsidiaryCode || '')
        //   ).map((div: any) => div.divisionCode);
          
        //   filteredRawData = rawChildData.filter((des: any) => 
        //     relevantDivisions.includes(des.divisionCode || '')
        //   );
        // }
        break;
        
      case 'grades':
        filteredRawData = rawChildData;
        // if (parentType === 'designations') {
        //   filteredRawData = rawChildData.filter((grade: any) => 
        //     parentCodes.includes(grade.designationCode || '')
        //   );
        // } else if (parentType === 'divisions') {
        //   const relevantDesignations = rawDesignations.filter((des: any) => 
        //     parentCodes.includes(des.divisionCode || '')
        //   ).map((des: any) => des.designationCode);
          
        //   filteredRawData = rawChildData.filter((grade: any) => 
        //     relevantDesignations.includes(grade.designationCode || '')
        //   );
        // } else if (parentType === 'subsidiaries') {
        //   const relevantDivisions = rawDivisions.filter((div: any) => 
        //     parentCodes.includes(div.subsidiaryCode || '')
        //   ).map((div: any) => div.divisionCode);
          
        //   const relevantDesignations = rawDesignations.filter((des: any) => 
        //     relevantDivisions.includes(des.divisionCode || '')
        //   ).map((des: any) => des.designationCode);
          
        //   filteredRawData = rawChildData.filter((grade: any) => 
        //     relevantDesignations.includes(grade.designationCode || '')
        //   );
        // }
        break;
        
      case 'workOrders':
        if (parentType === 'contractors') {
          filteredRawData = rawChildData.filter((wo: any) => 
            parentCodes.includes(wo.contractorCode || '')
          );
        }
        break;
        
      case 'shifts':
        if (parentType === 'shiftGroups') {
          filteredRawData = rawChildData.filter((shift: any) => 
            parentCodes.includes(shift.shiftGroupCode || '')
          );
        }
        break;
        
      default:
        filteredRawData = rawChildData;
    }

    if (filteredRawData.length === 0) {
      return [];
    }

    const filteredCodes = new Set(filteredRawData.map((item: any) => {
      switch (childType) {
        case 'divisions': return item.divisionCode;
        case 'departments': return item.departmentCode;
        case 'subDepartments': return item.subDepartmentCode;
        case 'sections': return item.sectionCode;
        case 'designations': return item.designationCode;
        case 'grades': return item.gradeCode;
        case 'workOrders': return item.workOrderNumber || item.code;
        case 'shifts': return item.shiftCode;
        default: return item.code;
      }
    }));

    return normalizedChildData.filter((item: any) => filteredCodes.has(item.code));
  }

  // Filter child data based on the first visible ancestor in hierarchy
  const getFilteredDataForType = (type: TableType): any[] => {
    // Special handling for contractEmployees - filter based on all selected dropdowns
    if (type === 'contractEmployees') {
      const allData = rawContractEmployees;
      if (allData.length === 0) return [];
      
      let filtered = allData;
      
      if (selectedSubsidiaries.length > 0) {
        filtered = filtered.filter((emp: any) => 
          selectedSubsidiaries.includes(emp.subsidiaryCode || '')
        );
      }
      
      if (selectedDivisions.length > 0) {
        filtered = filtered.filter((emp: any) => 
          selectedDivisions.includes(emp.divisionCode || '')
        );
      }
      
      if (selectedDepartments.length > 0) {
        filtered = filtered.filter((emp: any) => 
          selectedDepartments.includes(emp.departmentCode || '')
        );
      }
      
      if (selectedSubDepartments.length > 0) {
        filtered = filtered.filter((emp: any) => 
          selectedSubDepartments.includes(emp.subDepartmentCode || '')
        );
      }
      
      if (selectedSections.length > 0) {
        filtered = filtered.filter((emp: any) => 
          selectedSections.includes(emp.sectionCode || '')
        );
      }
      
      if (selectedDesignations.length > 0) {
        filtered = filtered.filter((emp: any) => 
          selectedDesignations.includes(emp.designationCode || '')
        );
      }
      
      if (selectedGrades.length > 0) {
        filtered = filtered.filter((emp: any) => 
          selectedGrades.includes(emp.gradeCode || '')
        );
      }
      
      if (selectedEmployeeCategories.length > 0) {
        filtered = filtered.filter((emp: any) => 
          selectedEmployeeCategories.includes(emp.employeeCategoryCode || '')
        );
      }
      
      if (selectedLocations.length > 0) {
        filtered = filtered.filter((emp: any) => 
          selectedLocations.includes(emp.locationCode || '')
        );
      }
      
      if (selectedContractors.length > 0) {
        filtered = filtered.filter((emp: any) => 
          selectedContractors.includes(emp.contractorCode || '')
        );
      }
      
      if (selectedWorkOrders.length > 0) {
        filtered = filtered.filter((emp: any) => 
          selectedWorkOrders.includes(emp.workOrderNumber || '')
        );
      }
      
      return filtered.map((emp: any) => ({
        code: emp.employeeID,
        name: `${emp.firstName || ''} ${emp.middleName || ''} ${emp.lastName || ''}`.trim() || emp.employeeID,
      }));
    }
    
    const parentField = PARENT_FIELD_MAP[type];
    
    if (!parentField) {
      return getDataForType(type);
    }

    let currentField = parentField;
    
    while (currentField) {
      const currentType = currentField as TableType;
      const isAncestorVisible = visibleTables.has(currentType);
      
      if (isAncestorVisible) {
        const ancestorSelectedCodes = getSelectedItems(currentType);
        if (ancestorSelectedCodes.length === 0) {
          return getDataForType(type);
        }
        
        return filterChildByParent(type, currentType, ancestorSelectedCodes);
      }
      
      const grandParentField = PARENT_FIELD_MAP[currentField];
      
      if (!grandParentField || grandParentField === '') {
        return getDataForType(type);
      }
      
      currentField = grandParentField;
    }
    
    return getDataForType(type);
  }

  // Handle toggling add field visibility
  const toggleAddField = (type: TableType) => {
    setOpenAddFieldType((prev) => prev === type ? null : type)
  }

  // Handle adding multiple items
  const handleAddItems = (type: TableType, codes: string[]) => {
    const setter = getDataSetter(type)
    const current = getSelectedItems(type)
    const newItems = Array.from(new Set([...current, ...codes]))
    setter(newItems)
  }

  // Handle removing item
  const handleRemoveItem = (type: TableType, code: string) => {
    const setter = getDataSetter(type)
    const current = getSelectedItems(type)
    setter(current.filter(c => c !== code))
    
    removeDescendantsOfParent(type, code)
  }

  // Handle removing multiple items
  const handleRemoveItems = (type: TableType, codes: string[]) => {
    const setter = getDataSetter(type)
    const current = getSelectedItems(type)
    const newItems = current.filter(c => !codes.includes(c))
    setter(newItems)
    
    codes.forEach(code => {
      removeDescendantsOfParent(type, code)
    })
  }

  // Notify parent component of filter data changes
  useEffect(() => {
    if (onFilterDataChange) {
      const filterData: Record<TableType, string[]> = {
        subsidiaries: selectedSubsidiaries,
        divisions: selectedDivisions,
        departments: selectedDepartments,
        subDepartments: selectedSubDepartments,
        sections: selectedSections,
        designations: selectedDesignations,
        grades: selectedGrades,
        employeeCategories: selectedEmployeeCategories,
        locations: selectedLocations,
        contractors: selectedContractors,
        workOrders: selectedWorkOrders,
        shiftGroups: selectedShiftGroups,
        shifts: selectedShifts,
        contractEmployees: selectedContractEmployees,
      }
      onFilterDataChange(filterData)
    }
  }, [
    selectedSubsidiaries,
    selectedDivisions,
    selectedDepartments,
    selectedSubDepartments,
    selectedSections,
    selectedDesignations,
    selectedGrades,
    selectedEmployeeCategories,
    selectedLocations,
    selectedContractors,
    selectedWorkOrders,
    selectedShiftGroups,
    selectedShifts,
    selectedContractEmployees,
    onFilterDataChange,
  ])

  // Toggle table visibility in sidebar
  const toggleTableVisibility = (tableId: TableType) => {
    setVisibleTables(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tableId)) {
        newSet.delete(tableId)
        // Clear selected values for this table
        const setter = getDataSetter(tableId)
        const currentSelected = getSelectedItems(tableId)
        if (currentSelected.length > 0) {
          setter([])
        }
        // Clear all descendants
        const descendants = getAllDescendants(tableId)
        descendants.forEach(descendantType => {
          const descendantSelected = getSelectedItems(descendantType)
          if (descendantSelected.length > 0) {
            const descendantSetter = getDataSetter(descendantType)
            descendantSetter([])
          }
        })
      } else {
        newSet.add(tableId)
      }
      return newSet
    })
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Table Selection Sidebar Component */}
      <TableSidebar
        tableMenuItems={tableMenuItems}
        visibleTables={visibleTables}
        getSelectedItems={getSelectedItems}
        onToggleTableVisibility={toggleTableVisibility}
      />

      {/* Right Side - Selected Tables Display */}
      <TablesDisplay
        tableMenuItems={tableMenuItems}
        visibleTables={visibleTables}
        getSelectedItems={getSelectedItems}
        getDataForType={getDataForType}
        getLoadingForType={getLoadingForType}
        getFilteredDataForType={getFilteredDataForType}
        isParentSelected={isParentSelected}
        handleAddItems={handleAddItems}
        handleRemoveItem={handleRemoveItem}
        handleRemoveItems={handleRemoveItems}
        toggleAddField={toggleAddField}
        openAddFieldType={openAddFieldType}
        setOpenAddFieldType={setOpenAddFieldType}
        filterChildByParent={filterChildByParent}
        PARENT_FIELD_MAP={PARENT_FIELD_MAP}
        onSaveAndContinue={onSaveAndContinue}
        // Search states
        subsidiariesSearch={subsidiariesSearch}
        setSubsidiariesSearch={setSubsidiariesSearch}
        divisionsSearch={divisionsSearch}
        setDivisionsSearch={setDivisionsSearch}
        departmentsSearch={departmentsSearch}
        setDepartmentsSearch={setDepartmentsSearch}
        designationsSearch={designationsSearch}
        setDesignationsSearch={setDesignationsSearch}
        subDepartmentsSearch={subDepartmentsSearch}
        setSubDepartmentsSearch={setSubDepartmentsSearch}
        gradesSearch={gradesSearch}
        setGradesSearch={setGradesSearch}
        sectionsSearch={sectionsSearch}
        setSectionsSearch={setSectionsSearch}
        employeeCategoriesSearch={employeeCategoriesSearch}
        setEmployeeCategoriesSearch={setEmployeeCategoriesSearch}
        contractorSearch={contractorSearch}
        setContractorSearch={setContractorSearch}
        locationsSearch={locationsSearch}
        setLocationsSearch={setLocationsSearch}
        workOrderSearch={workOrderSearch}
        setWorkOrderSearch={setWorkOrderSearch}
        shiftGroupsSearch={shiftGroupsSearch}
        setShiftGroupsSearch={setShiftGroupsSearch}
        shiftsSearch={shiftsSearch}
        setShiftsSearch={setShiftsSearch}
        contractEmployeesSearch={contractEmployeesSearch}
        setContractEmployeesSearch={setContractEmployeesSearch}
        // Field states
        subsidiariesField={subsidiariesField}
        setSubsidiariesField={setSubsidiariesField}
        divisionsField={divisionsField}
        setDivisionsField={setDivisionsField}
        departmentsField={departmentsField}
        setDepartmentsField={setDepartmentsField}
        designationsField={designationsField}
        setDesignationsField={setDesignationsField}
        subDepartmentsField={subDepartmentsField}
        setSubDepartmentsField={setSubDepartmentsField}
        gradesField={gradesField}
        setGradesField={setGradesField}
        sectionsField={sectionsField}
        setSectionsField={setSectionsField}
        employeeCategoriesField={employeeCategoriesField}
        setEmployeeCategoriesField={setEmployeeCategoriesField}
        contractorField={contractorField}
        setContractorField={setContractorField}
        locationsField={locationsField}
        setLocationsField={setLocationsField}
        workOrderField={workOrderField}
        setWorkOrderField={setWorkOrderField}
        shiftGroupsField={shiftGroupsField}
        setShiftGroupsField={setShiftGroupsField}
        shiftsField={shiftsField}
        setShiftsField={setShiftsField}
        contractEmployeesField={contractEmployeesField}
        setContractEmployeesField={setContractEmployeesField}
        // Pagination states
        subsidiariesPage={subsidiariesPage}
        setSubsidiariesPage={setSubsidiariesPage}
        divisionsPage={divisionsPage}
        setDivisionsPage={setDivisionsPage}
        departmentsPage={departmentsPage}
        setDepartmentsPage={setDepartmentsPage}
        designationsPage={designationsPage}
        setDesignationsPage={setDesignationsPage}
        subDepartmentsPage={subDepartmentsPage}
        setSubDepartmentsPage={setSubDepartmentsPage}
        gradesPage={gradesPage}
        setGradesPage={setGradesPage}
        sectionsPage={sectionsPage}
        setSectionsPage={setSectionsPage}
        employeeCategoriesPage={employeeCategoriesPage}
        setEmployeeCategoriesPage={setEmployeeCategoriesPage}
        contractorPage={contractorPage}
        setContractorPage={setContractorPage}
        locationsPage={locationsPage}
        setLocationsPage={setLocationsPage}
        workOrderPage={workOrderPage}
        setWorkOrderPage={setWorkOrderPage}
        shiftGroupsPage={shiftGroupsPage}
        setShiftGroupsPage={setShiftGroupsPage}
        shiftsPage={shiftsPage}
        setShiftsPage={setShiftsPage}
        contractEmployeesPage={contractEmployeesPage}
        setContractEmployeesPage={setContractEmployeesPage}
        pageSize={pageSize}
        // Additional dependencies
        selectedSubsidiaries={selectedSubsidiaries}
        selectedDivisions={selectedDivisions}
        selectedDepartments={selectedDepartments}
        selectedSubDepartments={selectedSubDepartments}
        selectedDesignations={selectedDesignations}
        selectedContractors={selectedContractors}
        selectedLocations={selectedLocations}
        selectedWorkOrders={selectedWorkOrders}
        selectedEmployeeCategories={selectedEmployeeCategories}
        selectedSections={selectedSections}
        selectedGrades={selectedGrades}
      />
    </div>
  )
}

