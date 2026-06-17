"use client"

import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { Check, Mail, Search, Trash2, X } from "lucide-react"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { useEffect, useMemo, useRef, useState } from "react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useSearchParams } from "next/navigation"
import { gql, useQuery } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"

interface Props {
  open: boolean
  onClose: () => void
  selectedEmailIds: string[]
  onSelectedEmailIdsChange: (emails: string[]) => void
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
      organizationCode
      contractorCode
      tenantCode
      employeeID
      emailID {
        primaryEmailID
      }
      middleName
      firstName
      lastName
      isDeleted
    }
  }
`

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const extractPrimaryEmail = (
  emailID: string | { primaryEmailID?: string; secondaryEmailID?: string } | null | undefined,
): string => {
  if (!emailID) return ""
  if (typeof emailID === "object") return emailID.primaryEmailID ?? ""
  const raw = emailID.trim()
  if (!raw) return ""
  if (raw.startsWith("{") && raw.includes("primaryEmailID")) {
    try {
      const parsed = JSON.parse(raw) as { primaryEmailID?: string }
      return parsed.primaryEmailID ?? ""
    } catch {
      return ""
    }
  }
  return raw
}

export default function MailGroupAssociationPrimarySelectorPopup({
  open,
  onClose,
  selectedEmailIds,
  onSelectedEmailIdsChange,
}: Props) {
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters: hierarchyFiltersFromHook } = useEmpHierarchy()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFiltersFromHook)
  const searchParams = useSearchParams()
  const recordId = searchParams.get("id")
  const isEditMode = Boolean(recordId)

  const [inputValue, setInputValue] = useState("")
  const [inputError, setInputError] = useState("")
  const [draftSelected, setDraftSelected] = useState<string[]>([])
  const latestDraftRef = useRef<string[]>([])

  useEffect(() => {
    latestDraftRef.current = draftSelected
  }, [draftSelected])

  useEffect(() => {
    if (!open) return
    setDraftSelected([])
    latestDraftRef.current = []
    setInputValue("")
    setInputError("")
    // Initialize draft only when popup opens; avoid resetting while typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const effectiveHierarchyFilters = useMemo(() => {
    if (!hierarchyFiltersFromHook) return undefined
    const filters: {
      subsidiary?: string[]
      division?: string[]
      department?: string[]
      location?: string[]
      contractor?: string[]
    } = {}
    if (hierarchyFiltersFromHook.subsidiaries?.length) filters.subsidiary = hierarchyFiltersFromHook.subsidiaries
    if (hierarchyFiltersFromHook.divisions?.length) filters.division = hierarchyFiltersFromHook.divisions
    if (hierarchyFiltersFromHook.departments?.length) filters.department = hierarchyFiltersFromHook.departments
    if (hierarchyFiltersFromHook.locations?.length) filters.location = hierarchyFiltersFromHook.locations
    if (hierarchyFiltersFromHook.contractors?.length) filters.contractor = hierarchyFiltersFromHook.contractors
    return Object.keys(filters).length > 0 ? filters : undefined
  }, [hierarchyFiltersFromHook])

  const fetchEmployeesQuery = useMemo(() => {
    const hasHierarchyFilters = effectiveHierarchyFilters && Object.keys(effectiveHierarchyFilters).length > 0
    const hasUserEntitlement = userEntitlement && Object.keys(userEntitlement).length > 0

    if (!hasHierarchyFilters && !hasUserEntitlement) {
      return FETCH_EMPLOYEES_QUERY_BASE
    }

    const hierarchyFiltersString = hasHierarchyFilters
      ? Object.entries(effectiveHierarchyFilters)
          .map(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
              return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`
            }
            return ""
          })
          .filter(Boolean)
          .join(", ")
      : ""

    const userEntitlementString = hasUserEntitlement
      ? Object.entries(userEntitlement)
          .map(([key, value]) => {
            if (key === "employeeID" && typeof value === "string") {
              return `${key}: "${value}"`
            }
            if (Array.isArray(value) && value.length > 0) {
              return `${key}: [${value.map((v) => `"${v}"`).join(", ")}]`
            }
            return ""
          })
          .filter(Boolean)
          .join(", ")
      : ""

    const queryParams: string[] = []
    if (hierarchyFiltersString) queryParams.push(`hierarchyFilters: { ${hierarchyFiltersString} }`)
    if (userEntitlementString) queryParams.push(`userEntitlement: { ${userEntitlementString} }`)

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
          organizationCode
          contractorCode
          tenantCode
          employeeID
          emailID {
            primaryEmailID
          }
          middleName
          firstName
          lastName
          isDeleted
        }
      }
    `)
  }, [effectiveHierarchyFilters, userEntitlement])

  const { data } = useQuery(fetchEmployeesQuery, {
    client,
    variables: {
      criteriaRequests: [{ field: "tenantCode", operator: "eq", value: tenantCode }],
      collection: "contract_employee",
      offset: 0,
      limit: 200,
    },
    errorPolicy: "all",
  })

  const { post: postAssociation, loading: saving } = usePostRequest<any>({
    url: "mailGroupAssociation",
    onSuccess: () => {
      onSelectedEmailIdsChange(latestDraftRef.current)
      toast.success(isEditMode ? "Primary emails updated successfully." : "Primary emails saved successfully.")
      onClose()
    },
  })

  if (!open) return null

  const normalize = (email: string) => email.trim().toLowerCase()

  const allFetchedEmails = ((data?.fetchEmployees || []) as Array<{
    emailID?: { primaryEmailID?: string } | null
    isDeleted?: boolean
  }>)
    .filter((rec) => rec?.isDeleted !== true)
    .map((rec) => normalize(extractPrimaryEmail(rec.emailID)))
    .filter((email) => Boolean(email) && isValidEmail(email))

  const availableOptions = Array.from(new Set(allFetchedEmails)).filter(
    (email) => !selectedEmailIds.includes(email) && !draftSelected.includes(email),
  )

  const normalizedInput = normalize(inputValue)
  const showDropdown = normalizedInput.length >= 2
  const filteredOptions = availableOptions
    .filter((email) => email.includes(normalizedInput))
    .sort((a, b) => {
      const aStarts = a.startsWith(normalizedInput) ? 0 : 1
      const bStarts = b.startsWith(normalizedInput) ? 0 : 1
      if (aStarts !== bStarts) return aStarts - bStarts
      return a.localeCompare(b)
    })

  const addEmail = (rawValue: string) => {
    const email = normalize(rawValue)
    if (!email) return
    if (!isValidEmail(email)) {
      setInputError("Enter a valid email address")
      return
    }
    if (draftSelected.includes(email)) {
      setInputError("Email already selected")
      return
    }
    if (selectedEmailIds.includes(email)) {
      setInputError("Email already exists")
      return
    }
    setDraftSelected((prev) => [...prev, email])
    setInputValue("")
    setInputError("")
  }

  const removeEmail = (email: string) => {
    setDraftSelected((prev) => prev.filter((item) => item !== email))
  }

  const handleSave = async () => {
    const mergedEmails = Array.from(
      new Set(
        [...selectedEmailIds, ...draftSelected]
          .map((email) => normalize(email))
          .filter((email) => Boolean(email) && isValidEmail(email)),
      ),
    )
    setDraftSelected(mergedEmails)
    latestDraftRef.current = mergedEmails

    const payload = {
      tenant: tenantCode,
      action: isEditMode && recordId ? "update" : "insert",
      ...(isEditMode && recordId ? { id: recordId } : {}),
      collectionName: "mailGroupAssociation",
      data: {
        primaryEmail: mergedEmails,
      },
    }
    await postAssociation(payload)
  }

  const canAddTypedEmail =
    Boolean(normalizedInput) &&
    isValidEmail(normalizedInput) &&
    !availableOptions.includes(normalizedInput) &&
    !selectedEmailIds.includes(normalizedInput) &&
    !draftSelected.includes(normalizedInput)

  const selectedRows = draftSelected.map((email) => ({ email }))
  const selectedColumns: ActionTableColumn<{ email: string }>[] = [
    { key: "slNo", label: "Sl No", render: (_row, index) => index + 1 },
    { key: "email", label: "Email", render: (row) => row.email },
    {
      key: "action",
      label: "Action",
      render: (row) => (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-slate-100"
          title="Remove"
          aria-label="Remove email"
          onClick={() => removeEmail(row.email)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ]
  const selectedSearchFields: ActionTableSearchField<{ email: string }>[] = [
    { value: "email", label: "Email", getValue: (row) => row.email },
  ]

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Mail className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Select Primary Email</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Search and select employee email.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 space-y-4">
          <div className="space-y-2">
            <SubFormTitle title="Search Email" />
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    if (inputError) setInputError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return
                    e.preventDefault()
                    if (normalizedInput.length >= 2 && filteredOptions.length > 0) {
                      addEmail(filteredOptions[0])
                      return
                    }
                    addEmail(inputValue)
                  }}
                  autoFocus
                  placeholder="Search email or type new email"
                  className="pl-9"
                />
                {showDropdown && (
                  <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-[180px] overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
                    {filteredOptions.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-gray-500">No email found.</p>
                    ) : (
                      filteredOptions.map((email) => (
                        <button
                          key={email}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between border-b last:border-b-0"
                          onClick={() => addEmail(email)}
                        >
                          <span>{email}</span>
                          <Check className="h-4 w-4 text-green-600" />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
              <Button
                type="button"
                onClick={() => addEmail(inputValue)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Add Email
              </Button>
            </div>
            {inputError ? <p className="text-xs text-red-500">{inputError}</p> : null}
            {normalizedInput.length > 0 && normalizedInput.length < 2 ? (
              <p className="text-xs text-gray-500">Type at least 2 letters to see dropdown.</p>
            ) : null}
            {canAddTypedEmail ? (
              <p className="text-xs text-gray-500">No match found. Click Add to include this email.</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <SubFormTitle title={`Selected Primary Emails (${draftSelected.length})`} />
            <ActionDataTable<{ email: string }>
              rows={selectedRows}
              columns={selectedColumns}
              searchFields={selectedSearchFields}
              defaultSearchField="email"
              isViewMode={false}
              emptyTitle="No primary emails selected"
              emptyDescription="Type or search email and click Add."
              getRowKey={(row) => `primary-popup-${row.email}`}
            />
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="ml-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? "Saving..." : isEditMode ? "Update" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
