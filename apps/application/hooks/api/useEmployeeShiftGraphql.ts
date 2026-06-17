"use client"

import { useMemo } from "react"
import { useQuery, gql } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"

/** Fetch employee by tenant + employeeID */
const FETCH_EMPLOYEE_BY_ID_QUERY = gql`
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
      deployment {
        effectiveFrom
        subsidiary { subsidiaryCode subsidiaryName }
        division { divisionCode divisionName }
        department { departmentCode departmentName }
        designation { designationCode designationName }
        location { locationCode locationName }
        grade { gradeCode gradeName }
        employeeCategory { employeeCategoryCode employeeCategoryName }
      }
    }
  }
`

/** Fetch shift groups (for group dropdown) */
const FETCH_SHIFT_GROUPS_QUERY = gql`
  query FetchShiftGroups(
    $criteriaRequests: [CriteriaRequest!]!
    $collection: String!
    $offset: Int
    $limit: Int
  ) {
    fetchShifts(
      criteriaRequests: $criteriaRequests
      collection: $collection
      offset: $offset
      limit: $limit
    ) {
      _id
      organizationCode
      tenantCode
      shiftGroupCode
      shiftGroupName
    }
  }
`

/** Fetch full shift details by group */
const FETCH_SHIFTS_BY_GROUP_QUERY = gql`
  query FetchShiftsByGroup(
    $criteriaRequests: [CriteriaRequest!]!
    $collection: String!
    $offset: Int
    $limit: Int
  ) {
    fetchShifts(
      criteriaRequests: $criteriaRequests
      collection: $collection
      offset: $offset
      limit: $limit
    ) {
      _id
      organizationCode
      tenantCode
      shiftGroupCode
      shiftGroupName
      shift {
        shiftCode
        shiftName
        shiftStart
        shiftEnd
        firstHalfStart
        firstHalfEnd
        secondHalfStart
        secondHalfEnd
        lunchStart
        lunchEnd
        duration
        crossDay
        flexible
        flexiFullDayDuration
        flexiHalfDayDuration
        inAheadMargin
        inAboveMargin
        outAheadMargin
        outAboveMargin
        lateInAllowedTime
        earlyOutAllowedTime
        graceIn
        graceOut
        earlyOutTime
        minimumDurationForFullDay
        minimumDurationForHalfDay
        minimumExtraMinutesForExtraHours
      }
    }
  }
`

export interface FetchedEmployee {
  _id: string
  employeeID: string
  firstName?: string
  middleName?: string
  lastName?: string
  organizationCode?: string
  contractorCode?: string
  tenantCode?: string
  deployment?: {
    subsidiary?: { subsidiaryCode?: string; subsidiaryName?: string }
    division?: { divisionCode?: string; divisionName?: string }
    department?: { departmentCode?: string; departmentName?: string }
    designation?: { designationCode?: string; designationName?: string }
    location?: { locationCode?: string; locationName?: string }
    grade?: { gradeCode?: string; gradeName?: string }
    employeeCategory?: { employeeCategoryCode?: string; employeeCategoryName?: string }
  }
}

export interface ShiftGroupOption {
  shiftGroupCode: string
  shiftGroupName: string
}

export interface ShiftOption {
  shiftCode: string
  shiftName: string
  shift: Record<string, unknown>
  grace: Record<string, unknown>
}

export interface EmployeeShiftHierarchyFilters {
  subsidiary?: string | string[]
  location?: string | string[]
  categories?: string | string[]
}

export interface UseEmployeeShiftGraphqlParams {
  /** Tenant code (required for shift groups and shifts by group) */
  tenantCode: string | null | undefined
  /** When set, fetches employee details from contract_employee */
  employeeId?: string | null
  /** When set, fetches shifts for this group (for shift dropdown) */
  shiftGroupCode?: string
  /** Optional search filter for shift group name (like) */
  shiftGroupSearch?: string
  /** Optional hierarchy filters for shift group query (subsidiary, location, category) */
  hierarchyFilters?: EmployeeShiftHierarchyFilters | null
}

export interface UseEmployeeShiftGraphqlResult {
  /** Fetched employee when employeeId is provided */
  fetchedEmployee: FetchedEmployee | null
  /** List of shift groups for dropdown */
  shiftGroups: ShiftGroupOption[]
  shiftGroupsLoading: boolean
  shiftGroupsError: Error | undefined
  /** List of shifts for selected group (when shiftGroupCode is set) */
  shiftOptions: ShiftOption[]
}

/**
 * Hook to fetch employee-shift related data via GraphQL.
 * Pass tenantCode and optional employeeId, shiftGroupCode, shiftGroupSearch, hierarchyFilters.
 * Use the returned data wherever needed (e.g. basic info form, other components).
 */
export function useEmployeeShiftGraphql({
  tenantCode,
  employeeId,
  shiftGroupCode,
  shiftGroupSearch = "",
  hierarchyFilters = null,
}: UseEmployeeShiftGraphqlParams): UseEmployeeShiftGraphqlResult {
  const employeeQueryVariables = useMemo(() => {
    if (!employeeId || !tenantCode?.trim()) return null
    return {
      criteriaRequests: [
        { field: "tenantCode", operator: "is" as const, value: tenantCode.trim() },
        { field: "employeeID", operator: "eq" as const, value: String(employeeId).trim() },
      ],
      collection: "contract_employee",
      offset: 0,
      limit: 1,
    }
  }, [employeeId, tenantCode])

  const { data: employeeData } = useQuery(FETCH_EMPLOYEE_BY_ID_QUERY, {
    client,
    variables: employeeQueryVariables ?? {},
    skip: !employeeQueryVariables,
    fetchPolicy: "network-only",
  })

  const fetchedEmployee: FetchedEmployee | null = useMemo(() => {
    const list = employeeData?.fetchEmployees
    if (!Array.isArray(list) || list.length === 0) return null
    const e = list[0]
    return {
      _id: e._id,
      employeeID: e.employeeID ?? "",
      firstName: e.firstName,
      middleName: e.middleName,
      lastName: e.lastName,
      organizationCode: e.organizationCode,
      contractorCode: e.contractorCode,
      tenantCode: e.tenantCode,
      deployment: e.deployment ?? {},
    }
  }, [employeeData])

  const shiftGroupQueryVariables = useMemo(() => {
    if (!tenantCode?.trim()) return null
    const employeeDeployment = employeeData?.fetchEmployees?.[0]?.deployment
    const getFirstValue = (value: string | string[] | null | undefined) => {
      const nextValue = Array.isArray(value) ? value[0] : value
      return typeof nextValue === "string" && nextValue.trim() ? nextValue.trim() : undefined
    }
    const hierarchySubsidiary = getFirstValue(hierarchyFilters?.subsidiary)
    const hierarchyLocation = getFirstValue(hierarchyFilters?.location)
    const hierarchyCategory = getFirstValue(hierarchyFilters?.categories)
    const subsidiaryValue = hierarchySubsidiary || employeeDeployment?.subsidiary?.subsidiaryCode
    const locationValue = hierarchyLocation || employeeDeployment?.location?.locationCode
    const categoryValue = hierarchyCategory || employeeDeployment?.employeeCategory?.employeeCategoryCode

    const criteriaRequests: Array<{ field: string; operator: string; value: any }> = [
      { field: "tenantCode", operator: "eq", value: tenantCode.trim() },
    ]
    if (subsidiaryValue) {
      criteriaRequests.push({
        field: "subsidiary.subsidiaryCode",
        operator: "in",
        value: subsidiaryValue,
      })
    }
    if (locationValue) {
      criteriaRequests.push({
        field: "location.locationCode",
        operator: "in",
        value: locationValue,
      })
    }
    if (categoryValue) {
      criteriaRequests.push({
        field: "employeeCategory",
        operator: "in",
        value: categoryValue,
      })
    }
    const search = String(shiftGroupSearch ?? "").trim()
    if (search) {
      criteriaRequests.push({
        field: "shiftGroupName",
        operator: "like",
        value: search,
      })
    }
    return {
      criteriaRequests,
      collection: "shift",
      offset: 0,
      limit: 20,
    }
  }, [tenantCode, shiftGroupSearch, hierarchyFilters, employeeData])

  const { data: shiftGroupsData, loading: shiftGroupsLoading, error: shiftGroupsError } = useQuery(
    FETCH_SHIFT_GROUPS_QUERY,
    {
      client,
      variables: shiftGroupQueryVariables ?? { criteriaRequests: [], collection: "shift", offset: 0, limit: 20 },
      skip: !shiftGroupQueryVariables,
      fetchPolicy: "network-only",
    }
  )

  const shiftGroups: ShiftGroupOption[] = useMemo(() => {
    const list = shiftGroupsData?.fetchShifts
    if (!Array.isArray(list)) return []
    return list.map((g: { shiftGroupCode?: string; shiftGroupName?: string }) => ({
      shiftGroupCode: g.shiftGroupCode ?? "",
      shiftGroupName: g.shiftGroupName ?? "",
    }))
  }, [shiftGroupsData])

  const shiftsByGroupQueryVariables = useMemo(() => {
    if (!tenantCode?.trim() || !shiftGroupCode?.trim()) return null
    return {
      criteriaRequests: [
        { field: "tenantCode", operator: "eq", value: tenantCode.trim() },
        { field: "shiftGroupCode", operator: "eq", value: shiftGroupCode.trim() },
      ],
      collection: "shift",
      offset: 0,
      limit: 20,
    }
  }, [tenantCode, shiftGroupCode])

  const { data: shiftsByGroupData } = useQuery(FETCH_SHIFTS_BY_GROUP_QUERY, {
    client,
    variables: shiftsByGroupQueryVariables ?? { criteriaRequests: [], collection: "shift", offset: 0, limit: 20 },
    skip: !shiftsByGroupQueryVariables,
    fetchPolicy: "network-only",
  })

  const shiftOptions: ShiftOption[] = useMemo(() => {
    const list = shiftsByGroupData?.fetchShifts
    if (!Array.isArray(list) || list.length === 0) return []
    const options: ShiftOption[] = []
    list.forEach((g: { shift?: Array<Record<string, unknown>>; grace?: Record<string, unknown> }) => {
      const arr = g.shift
      if (!Array.isArray(arr)) return
      arr.forEach((s: Record<string, unknown>) => {
        const shiftCode = (s.shiftCode as string) ?? ""
        const shiftName = (s.shiftName as string) ?? ""
        // Auto-extract grace from shift like shift-management-form: prefer nested s.grace, else flat fields
        const nestedGrace = s.grace as Record<string, unknown> | undefined
        const graceSettings: Record<string, unknown> = nestedGrace
          ? {
              inAheadMargin: nestedGrace.inAheadMargin ?? 0,
              inAboveMargin: nestedGrace.inAboveMargin ?? 0,
              outAheadMargin: nestedGrace.outAheadMargin ?? 0,
              outAboveMargin: nestedGrace.outAboveMargin ?? 0,
              lateInAllowedTime: nestedGrace.lateInAllowedTime ?? 0,
              earlyOutAllowedTime: nestedGrace.earlyOutAllowedTime ?? 0,
              graceIn: nestedGrace.graceIn ?? 0,
              graceOut: nestedGrace.graceOut ?? 0,
              minimumDurationForPresent: nestedGrace.minimumDurationForPresent ?? 240,
              allowNormalComputation: nestedGrace.allowNormalComputation ?? true,
            }
          : {
              inAheadMargin: s.inAheadMargin ?? 0,
              inAboveMargin: s.inAboveMargin ?? 0,
              outAheadMargin: s.outAheadMargin ?? 0,
              outAboveMargin: s.outAboveMargin ?? 0,
              lateInAllowedTime: s.lateInAllowedTime ?? 0,
              earlyOutAllowedTime: s.earlyOutAllowedTime ?? 0,
              graceIn: s.graceIn ?? 0,
              graceOut: s.graceOut ?? 0,
              minimumDurationForPresent: 240,
              allowNormalComputation: true,
            }
        options.push({ shiftCode, shiftName, shift: { ...s }, grace: graceSettings })
      })
    })
    return options
  }, [shiftsByGroupData])

  return {
    fetchedEmployee,
    shiftGroups,
    shiftGroupsLoading,
    shiftGroupsError: shiftGroupsError ?? undefined,
    shiftOptions,
  }
}
