"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import ContractEmployeeApproverTable from "./contract-employee-approver-table"
import ApproverHeader from "./approver-header"
import ContractEmployeeApproverFilterBar from "./contract-employee-approver-filter-bar"
import AddContractEmployeePopup from "./add-contract-employee-popup"
import { useRouter } from "next/navigation"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import { gql, useQuery } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"

type ContractEmployeeApproverItem = {
  _id: string
  employeeID: string
  employeeName?: string
  leaveApprover?: string[]
  punchApprover?: string[]
  shiftApprover?: string[]
  outDutyApprover?: string[]
  organizationCode?: string
  tenantCode?: string
}

export default function ContractEmployeeApproverApplication() {
  const tenantCode = useGetTenantCode()
  const router = useRouter()

  // Role permissions
  const screenName = "contractEmployeeApprover"
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "roleControl",
    screenName,
  })

  const viewMode = rolePermissions?.view || false
  const editMode = rolePermissions?.edit || false
  const addMode = rolePermissions?.add || false
  const deleteMode = rolePermissions?.delete || false

  const [approvers, setApprovers] = useState<ContractEmployeeApproverItem[]>([])
  const [isAddPopupOpen, setIsAddPopupOpen] = useState(false)
  const [searchField, setSearchField] = useState<string>("employeeID")
  const [searchValue, setSearchValue] = useState<string>("")
  const [debouncedSearchValue, setDebouncedSearchValue] = useState<string>("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  const [totalCount, setTotalCount] = useState(0)

  // Debounce search value
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchValue(searchValue)
    }, 500)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchValue])

  // Define search fields
  const searchFields = [
    { value: "employeeID", label: "Employee ID" },
    { value: "leaveApprover", label: "Leave Approver" },
    { value: "punchApprover", label: "Punch Approver" },
    { value: "shiftApprover", label: "Shift Approver" },
    { value: "outDutyApprover", label: "Out Duty Approver" },
  ]

  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage])
  const totalPages = useMemo(
    () => (totalCount > 0 ? Math.ceil(totalCount / itemsPerPage) : 1),
    [totalCount],
  )
  const startIndex = offset
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

  // Map API data to table format
  const tableData = useMemo(
    () =>
      approvers.map((item) => ({
        _id: item._id,
        employeeID: item.employeeID,
        employeeName: item.employeeName,
        leaveApprover: item.leaveApprover || [],
        punchApprover: item.punchApprover || [],
        shiftApprover: item.shiftApprover || [],
        outDutyApprover: item.outDutyApprover || [],
        organizationCode: item.organizationCode,
        tenantCode: item.tenantCode,
      })),
    [approvers],
  )

  // GraphQL Query - applicationMode is required (String!)
  const GET_APPROVER_DETAILS = gql`
    query GetApproverDetails(
      $criteriaRequests: [CriteriaRequest!]!
      $applicationMode: String!
      $offset: Int
      $limit: Int
    ) {
      getApproverDetails(
        criteriaRequests: $criteriaRequests
        applicationMode: $applicationMode
        offset: $offset
        limit: $limit
      ) {
        _id
        employeeDetails {
          employeeID
          firstName
          middleName
          lastName
        }
        leaveApproverDetails {
          employeeID
          firstName
          lastName
          middleName
        }
        punchApproverDetails {
          employeeID
          firstName
          lastName
          middleName
        }
        shiftApproverDetails {
          employeeID
          firstName
          lastName
          middleName
        }
        outDutyApproverDetails {
          employeeID
          firstName
          lastName
          middleName
        }
      }
    }
  `

  const queryVariables = useMemo(() => {
    const trimmedSearch = debouncedSearchValue.trim()
    const criteriaRequests: Array<{ field: string; operator: string; value: any }> = [
      { field: "tenantCode", operator: "eq", value: tenantCode },
    ]

    if (trimmedSearch) {
      const approverFields = ["leaveApprover", "punchApprover", "shiftApprover", "outDutyApprover"]
      if (approverFields.includes(searchField)) {
        criteriaRequests.push({
          field: searchField,
          operator: "in",
          value: [trimmedSearch],
        })
      } else {
        criteriaRequests.push({
          field: searchField,
          operator: "like",
          value: trimmedSearch,
        })
      }
    }

    return {
      criteriaRequests,
      applicationMode: "hris", // Required field
      offset,
      limit: itemsPerPage,
    }
  }, [tenantCode, debouncedSearchValue, searchField, offset, itemsPerPage])

  const { loading: requestLoading, refetch, data, error } = useQuery(GET_APPROVER_DETAILS, {
    client,
    variables: queryVariables,
    skip: !tenantCode,
    errorPolicy: "all",
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      
      const rawRows = data?.getApproverDetails
      
      const rows = Array.isArray(rawRows) ? rawRows : rawRows ? [rawRows] : []
      
      const toApproverLabel = (approver: any) => {
        if (!approver) return ""
        const name = [approver?.firstName, approver?.middleName, approver?.lastName]
          .filter((v: string | undefined) => v && v.trim())
          .join(" ")
        return name ? `${approver?.employeeID} (${name})` : approver?.employeeID
      }
      
      const mapped: ContractEmployeeApproverItem[] = rows.map((item: any, index: number) => {
        
        return {
          _id: item?._id || `temp-${index}`,
          employeeID: item?.employeeDetails?.employeeID || "N/A",
          employeeName: [
            item?.employeeDetails?.firstName,
            item?.employeeDetails?.middleName,
            item?.employeeDetails?.lastName,
          ]
            .filter((v: string | undefined) => v && v.trim())
            .join(" ") || "No Name",
          leaveApprover: (item?.leaveApproverDetails || []).map((a: any) => toApproverLabel(a)).filter(Boolean),
          punchApprover: (item?.punchApproverDetails || []).map((a: any) => toApproverLabel(a)).filter(Boolean),
          shiftApprover: (item?.shiftApproverDetails || []).map((a: any) => toApproverLabel(a)).filter(Boolean),
          outDutyApprover: (item?.outDutyApproverDetails || []).map((a: any) => toApproverLabel(a)).filter(Boolean),
          tenantCode: item?.tenantCode || tenantCode,
        }
      })
      setApprovers(mapped)
      
      // Update total count based on response
      if (rows.length < itemsPerPage) {
        setTotalCount(offset + rows.length)
      } else {
        setTotalCount(offset + itemsPerPage + 1)
      }
    },
    onError: (err) => {
      console.error("GraphQL Error:", err)
      setApprovers([])
      setTotalCount(0)
      toast.error("Failed to fetch approver details")
    },
  })

  // Log errors
  useEffect(() => {
    if (error) {
      console.error("Query Error:", error)
      toast.error(error.message || "Failed to fetch data")
    }
  }, [error])

  const handleView = useCallback((row: ContractEmployeeApproverItem) => {
    if (!viewMode) return
    if (!row?._id) return
    router.push(`/employee-management/company-employee-approver?mode=view&id=${row._id}`)
  }, [router, viewMode])

  const handleEdit = useCallback((row: ContractEmployeeApproverItem) => {
    if (!editMode) return
    if (!row?._id) return
    router.push(`/employee-management/company-employee-approver?mode=edit&id=${row._id}`)
  }, [router, editMode])

  const { post: postDelete, loading: deleteLoading } = usePostRequest<any>({
    url: "contract_employee_approver",
    onSuccess: () => {
      toast.success("Deleted successfully")
      refetch()
    },
    onError: () => {
      toast.error("Failed to delete")
    },
  })

  const handleDelete = useCallback(async (row: ContractEmployeeApproverItem) => {
    if (!deleteMode) return
    if (!row?._id) return
    const ok = window.confirm(`Delete approver record for Employee ID: ${row.employeeID || row._id}?`)
    if (!ok) return

    await postDelete({
      tenant: tenantCode,
      action: "delete",
      id: row._id,
      collectionName: "contract_employee_approver",
    })
  }, [postDelete, tenantCode, deleteMode])

  const handleAddNew = useCallback(() => {
    if (!addMode) return
    setIsAddPopupOpen(true)
  }, [addMode])

  const handleSelectEmployee = useCallback((employee: any) => {
  }, [])

  // Clear any cached data on unmount
  useEffect(() => {
    return () => {
      setApprovers([])
    }
  }, [])

  return (
    <>
      <div className="px-12">
        <ApproverHeader 
          title="Employee Approvers" 
          description="Manage Employee approvers for leave, punch, shift, and out duty" 
        />
      </div>
      <div className="mx-auto max-w-7xl space-y-4 mt-1">
        <ContractEmployeeApproverFilterBar
          searchTerm={searchValue}
          setSearchTerm={setSearchValue}
          selectedField={searchField}
          setSelectedField={setSearchField}
          searchFields={searchFields}
          filtersApplied={true}
          onFilterClick={() => {}}
          onAddNew={handleAddNew}
          canAdd={addMode}
        />

        <ContractEmployeeApproverTable
          data={tableData}
          onView={handleView}
          onEdit={editMode ? handleEdit : undefined}
          onDelete={deleteMode ? handleDelete : undefined}
          onAdd={addMode ? handleAddNew : undefined}
          isLoading={requestLoading}
          permission={{
            view: viewMode,
            edit: editMode,
            add: addMode,
            delete: deleteMode,
          }}
          externalPagination={{
            currentPage,
            totalPages,
            totalItems: totalCount,
            itemsPerPage,
            startIndex,
            endIndex,
            onPageChange: setCurrentPage,
          }}
        />
      </div>

      <AddContractEmployeePopup
        isOpen={isAddPopupOpen}
        onClose={() => setIsAddPopupOpen(false)}
        onSelect={handleSelectEmployee}
      />
    </>
  )
}