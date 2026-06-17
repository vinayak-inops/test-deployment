"use client"

import { useCallback, useMemo, useState } from "react"
import { gql } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"

export interface CheckEmployeeInHierarchyParams {
  _id?: string | null
  employeeID?: string | null
}

interface HierarchyQueryFilters {
  subsidiary?: string[]
  division?: string[]
  department?: string[]
  location?: string[]
  contractor?: string[]
}

interface EmployeeHierarchyRow {
  _id?: string | null
  employeeID?: string | null
}

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
      employeeID
    }
  }
`

function toHierarchyQueryFilters(hierarchyFilters: ReturnType<typeof useEmpHierarchy>["hierarchyFilters"]): HierarchyQueryFilters | undefined {
  if (!hierarchyFilters) return undefined

  const filters: HierarchyQueryFilters = {}

  if (hierarchyFilters.subsidiaries?.length) {
    filters.subsidiary = hierarchyFilters.subsidiaries.map(String)
  }
  if (hierarchyFilters.divisions?.length) {
    filters.division = hierarchyFilters.divisions.map(String)
  }
  if (hierarchyFilters.departments?.length) {
    filters.department = hierarchyFilters.departments.map(String)
  }
  if (hierarchyFilters.locations?.length) {
    filters.location = hierarchyFilters.locations.map(String)
  }
  if (hierarchyFilters.contractors?.length) {
    filters.contractor = hierarchyFilters.contractors.map(String)
  }

  return Object.keys(filters).length > 0 ? filters : undefined
}

function buildInlineFilterString(
  filters?: Record<string, string | string[] | undefined> | HierarchyQueryFilters
) {
  if (!filters) return ""

  return Object.entries(filters)
    .map(([key, value]) => {
      if (typeof value === "string" && value.trim()) {
        return `${key}: "${value.trim()}"`
      }
      if (Array.isArray(value) && value.length > 0) {
        return `${key}: [${value.map((item) => `"${String(item)}"`).join(", ")}]`
      }
      return ""
    })
    .filter(Boolean)
    .join(", ")
}

export function useCheckEmployeeInHierarchy() {
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters } = useEmpHierarchy()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<boolean>(false)
  const [lastMatchedEmployees, setLastMatchedEmployees] = useState<EmployeeHierarchyRow[]>([])

  const effectiveHierarchyFilters = useMemo(
    () => toHierarchyQueryFilters(hierarchyFilters),
    [hierarchyFilters]
  )

  const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFilters)

  const fetchEmployeesQuery = useMemo(() => {
    const hierarchyFiltersString = buildInlineFilterString(effectiveHierarchyFilters)
    const userEntitlementString = buildInlineFilterString(
      userEntitlement as Record<string, string | string[]>
    )

    if (!hierarchyFiltersString && !userEntitlementString) {
      return FETCH_EMPLOYEES_QUERY_BASE
    }

    const queryParams: string[] = []
    if (hierarchyFiltersString) {
      queryParams.push(`hierarchyFilters: { ${hierarchyFiltersString} }`)
    }
    if (userEntitlementString) {
      queryParams.push(`userEntitlement: { ${userEntitlementString} }`)
    }

    return gql(`
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
          ${queryParams.join("\n          ")}
        ) {
          _id
          employeeID
        }
      }
    `)
  }, [effectiveHierarchyFilters, userEntitlement])

  const checkEmployeeInHierarchy = useCallback(
    async (params: CheckEmployeeInHierarchyParams | string) => {
      const normalizedParams: CheckEmployeeInHierarchyParams =
        typeof params === "string" ? { employeeID: params } : params

      const targetId = String(normalizedParams._id || "").trim()
      const targetEmployeeId = String(normalizedParams.employeeID || "").trim()

      if (!tenantCode || (!targetId && !targetEmployeeId)) {
        setLastMatchedEmployees([])
        setLastResult(false)
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const criteriaRequests = [
          {
            field: "tenantCode",
            operator: "is",
            value: tenantCode,
          },
          ...(targetId
            ? [
                {
                  field: "_id",
                  operator: "is",
                  value: targetId,
                },
              ]
            : []),
          ...(!targetId && targetEmployeeId
            ? [
                {
                  field: "employeeID",
                  operator: "is",
                  value: targetEmployeeId,
                },
              ]
            : []),
        ]

        const { data } = await client.query({
          query: fetchEmployeesQuery,
          variables: {
            criteriaRequests,
            collection: "contract_employee",
            offset: 0,
            limit: 10,
          },
          fetchPolicy: "network-only",
        })

        const employees: EmployeeHierarchyRow[] = Array.isArray(data?.fetchEmployees)
          ? data.fetchEmployees
          : []

        const isMatched = employees.some((employee) => {
          const currentId = String(employee?._id || "").trim()
          const currentEmployeeId = String(employee?.employeeID || "").trim()

          return Boolean(
            (targetId && currentId === targetId) ||
              (targetEmployeeId && currentEmployeeId === targetEmployeeId)
          )
        })

        setLastMatchedEmployees(employees)
        setLastResult(isMatched)
        return isMatched
      } catch (queryError: any) {
        const message = queryError?.message || "Failed to check employee hierarchy access"
        setError(message)
        setLastMatchedEmployees([])
        setLastResult(false)
        return false
      } finally {
        setLoading(false)
      }
    },
    [fetchEmployeesQuery, tenantCode]
  )

  return {
    checkEmployeeInHierarchy,
    loading,
    error,
    lastResult,
    lastMatchedEmployees,
  }
}
