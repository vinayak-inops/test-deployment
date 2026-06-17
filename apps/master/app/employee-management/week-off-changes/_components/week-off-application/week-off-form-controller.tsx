"use client"

import { useState } from "react"
import { useQuery, gql } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import SidebarFromHeader from "@/components/header/sidebar-from-header"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { getCurrentTimeIST } from "@/utils/time/time-control"
import { toast } from "react-toastify"
import WeekOffWeeksTab from "./week-off-weeks-tab"
import type { WeekOffItem } from "../schemas/week-off-application-schema"

const FETCH_EMPLOYEE_QUERY = gql`
  query FetchEmployees(
    $criteriaRequests: [CriteriaRequest!]!
    $collection: String!
  ) {
    fetchEmployees(
      criteriaRequests: $criteriaRequests
      collection: $collection
      offset: 0
      limit: 1
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
        division { divisionName }
        department { departmentName }
        designation { designationCode designationName }
        location { locationCode locationName }
        grade { gradeName }
        employeeCategory { employeeCategoryCode employeeCategoryName }
      }
    }
  }
`

type Mode = "edit" | "view"

export type WeekOffRecord = {
  _id: string
  employeeID: string
  fromDate?: string
  toDate?: string
  weekOffs: WeekOffItem[]
  organizationCode?: string
  tenantCode?: string
}

type Props = {
  mode: Mode
  record: WeekOffRecord
  onClose: () => void
  onSaved?: () => void
}

export default function WeekOffFormController({ mode, record, onClose, onSaved }: Props) {
  const hookTenantCode = useGetTenantCode()
  const { employeeId: currentEmployeeId } = useKeyclockRoleInfo()
  const isViewMode = mode === "view"

  const [weekOffRows, setWeekOffRows] = useState<WeekOffItem[]>(
    (record.weekOffs ?? []).map((w) => ({
      week: Number(w.week),
      weekOff: Array.isArray(w.weekOff) ? w.weekOff.map(Number) : [],
    }))
  )

  const { data: gqlData } = useQuery(FETCH_EMPLOYEE_QUERY, {
    client,
    skip: !record.employeeID || !hookTenantCode,
    variables: {
      collection: "contract_employee",
      criteriaRequests: [
        { field: "tenantCode", operator: "is", value: hookTenantCode },
        { field: "employeeID", operator: "eq", value: record.employeeID },
      ],
    },
    fetchPolicy: "network-only",
  })

  const emp = gqlData?.fetchEmployees?.[0] ?? null
  const dep = emp?.deployment
  const fullName = emp
    ? [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(" ")
    : null

  const { post: postWeekOffs } = usePostRequest<any>({
    url: "weekOffChanges",
    onSuccess: () => {
      toast.success("Week off saved!")
    },
    onError: () => {
      toast.error("Failed to save week off configuration")
    },
  })

  const saveRows = (rows: WeekOffItem[]) => {
    postWeekOffs({
      tenant: hookTenantCode,
      action: "update",
      id: record._id,
      collectionName: "weekOffChanges",
      data: {
        weekOffs: rows,
        updatedBy: currentEmployeeId,
        updatedOn: getCurrentTimeIST(),
      },
    })
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—"
    try {
      const date = new Date(dateString)
      if (Number.isNaN(date.getTime())) return dateString
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" })
    } catch {
      return dateString
    }
  }

  return (
    <div className="px-12">
      <SidebarFromHeader
        title="Week Off Change"
        description="Manage employee week off records"
        showBackButton
        onBack={onClose}
        canAdd={false}
      />

      <div className="max-w-7xl mx-auto w-full px-6 pt-4 pb-8 space-y-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-5 py-4">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Employee Information
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
            <InfoField label="Employee ID" value={record.employeeID} />
            {fullName && <InfoField label="Name" value={fullName} />}
            <InfoField label="From Date" value={formatDate(record.fromDate)} />
            <InfoField label="To Date" value={formatDate(record.toDate)} />
            <InfoField label="Organization" value={record.organizationCode} />
            {dep?.subsidiary?.subsidiaryName && (
              <InfoField label="Subsidiary" value={dep.subsidiary.subsidiaryName} />
            )}
            {dep?.division?.divisionName && (
              <InfoField label="Division" value={dep.division.divisionName} />
            )}
            {dep?.department?.departmentName && (
              <InfoField label="Department" value={dep.department.departmentName} />
            )}
            {dep?.designation?.designationName && (
              <InfoField label="Designation" value={dep.designation.designationName} />
            )}
            {dep?.location?.locationName && (
              <InfoField label="Location" value={dep.location.locationName} />
            )}
            {dep?.grade?.gradeName && (
              <InfoField label="Grade" value={dep.grade.gradeName} />
            )}
            {dep?.employeeCategory?.employeeCategoryName && (
              <InfoField label="Category" value={dep.employeeCategory.employeeCategoryName} />
            )}
          </div>
        </div>

        <WeekOffWeeksTab
          rows={weekOffRows}
          isViewMode={isViewMode}
          rowId={record._id}
          tenantCode={hookTenantCode}
          onChange={(newRows) => {
            setWeekOffRows(newRows)
            saveRows(newRows)
          }}
        />
      </div>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-sm text-gray-900 mt-0.5">{value || "-"}</p>
    </div>
  )
}
