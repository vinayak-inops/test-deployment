"use client"

import { useState } from "react"
import { useQuery, gql } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import SidebarFromHeader from "@/components/header/sidebar-from-header"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import LeaveBalanceTab from "./form/leave-balance-tab"
import type { LeaveBalanceItem } from "./form/leave-balance-form-popup"

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

type Props = {
  mode: Mode
  rowId?: string | null
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

export default function EmployeeBalanceFormController({
  mode,
  rowId,
  onClose,
  onSaved,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const [balanceRows, setBalanceRows] = useState<LeaveBalanceItem[]>([])
  const [recordData, setRecordData] = useState<any>(null)
  const isViewMode = mode === "view"

  useRequest<any[]>({
    url: "leaveBalance/search",
    method: "POST",
    data: rowId ? [{ field: "_id", operator: "eq", value: rowId }] : [],
    dependencies: [rowId],
    enabled: Boolean(rowId),
    onSuccess: (data: any[]) => {
      const record = Array.isArray(data) && data.length > 0 ? data[0] : null
      if (!record) return
      setRecordData(record)
      const balances = Array.isArray(record.balances) ? record.balances : []
      setBalanceRows(
        balances.map((item: any, index: number) => ({
          parseID: item?.parseID || `lb-${index}`,
          leaveTitle: item?.leaveTitle || "",
          leaveCode: item?.leaveCode || "",
          unitOfTime: item?.unitOfTime || "",
          beginningYearBalance: Number(item?.beginningYearBalance ?? 0),
          carryoverBalance: Number(item?.carryoverBalance ?? 0),
          absencePaidYearToDate: Number(item?.absencePaidYearToDate ?? 0),
          absencePaidInPeriod: Number(item?.absencePaidInPeriod ?? 0),
          beginningPeriodBalance: Number(item?.beginningPeriodBalance ?? 0),
          accruedInPeriod: Number(item?.accruedInPeriod ?? 0),
          carryoverForfeitedInPeriod: Number(item?.carryoverForfeitedInPeriod ?? 0),
          encashed: Number(item?.encashed ?? 0),
          includeEventsAwaitingApproval: Number(item?.includeEventsAwaitingApproval ?? 0),
          asOfPeriod: item?.asOfPeriod || "",
          balance: Number(item?.balance ?? 0),
          encashable: Number(item?.encashable ?? 0),
        }))
      )
    },
  })

  const { data: gqlData } = useQuery(FETCH_EMPLOYEE_QUERY, {
    client,
    skip: !recordData?.employeeID || !hookTenantCode,
    variables: {
      collection: "contract_employee",
      criteriaRequests: [
        { field: "tenantCode", operator: "is", value: hookTenantCode },
        { field: "employeeID", operator: "eq", value: recordData?.employeeID },
      ],
    },
    fetchPolicy: "network-only",
  })

  const emp = gqlData?.fetchEmployees?.[0] ?? null
  const dep = emp?.deployment ?? recordData?.deployment

  const fullName = emp
    ? [emp.firstName, emp.middleName, emp.lastName].filter(Boolean).join(" ")
    : null

  return (
    <div>
      <SidebarFromHeader
        title="Employee Balance"
        description="Manage employee leave balance records"
        showBackButton
        onBack={onClose}
        canAdd={false}
      />

      <div className="max-w-7xl mx-auto w-full px-6 pt-4 pb-8 space-y-4">
        {recordData && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-5 py-4">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Employee Information
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3">
              <InfoField label="Employee ID" value={recordData.employeeID} />
              {fullName && <InfoField label="Name" value={fullName} />}
              <InfoField label="Organization" value={recordData.organizationCode} />
              <InfoField label="Contractor" value={recordData.contractorCode} />
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
              {dep?.effectiveFrom && (
                <InfoField label="Effective From" value={dep.effectiveFrom} />
              )}
            </div>
          </div>
        )}

        <LeaveBalanceTab
          value={balanceRows}
          isViewMode={isViewMode}
          onChange={setBalanceRows}
          mode={mode}
          rowId={rowId}
          tenantCode={hookTenantCode}
          subsidiaryCode={dep?.subsidiary?.subsidiaryCode}
          locationCode={dep?.location?.locationCode}
          designationCode={dep?.designation?.designationCode}
          employeeCategory={dep?.employeeCategory?.employeeCategoryCode}
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
