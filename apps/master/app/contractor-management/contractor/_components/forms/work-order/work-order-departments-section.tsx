"use client"

import { useState, useMemo, useEffect } from "react"
import { Check, X, Trash2, Filter, Search as SearchIcon } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@repo/ui/components/ui/command"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"

export interface DepartmentOption {
  departmentCode: string
  departmentName: string
}

export interface WorkOrderDepartmentsSectionProps {
  /** Currently selected departments for the work order */
  value: DepartmentOption[]
  onChange: (departments: DepartmentOption[]) => void
  disabled?: boolean
  loading?: boolean
  fieldConfig?: Partial<
    Record<"departmentCode" | "departmentName", { required?: boolean; visible?: boolean; label?: string }>
  >
}

const pageSize = 5

export function WorkOrderDepartmentsSection({
  value,
  onChange,
  disabled = false,
  loading = false,
  fieldConfig,
}: WorkOrderDepartmentsSectionProps) {
  const [addFieldOpen, setAddFieldOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchField, setSearchField] = useState<"code" | "name">("name")
  const [departmentsPage, setDepartmentsPage] = useState(1)
  const [addSearchTerm, setAddSearchTerm] = useState("")
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters } = useEmpHierarchy()

  const departmentsRequestData = useMemo(() => {
    const requestData: any = {
      criteriaRequests: [
        {
          field: "tenantCode",
          operator: "is",
          value: tenantCode,
        },
      ],
    }
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

  const {
    data: departmentsResponse,
    loading: departmentsLoading,
    refetch: refetchDepartments,
  } = useRequest<any[]>({
    url: "organization/aggregate",
    method: "POST",
    data: departmentsRequestData,
    onError: (error: any) => {
      if (tenantCode) console.error("Error fetching departments:", error)
    },
    dependencies: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    refetchDepartments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (!tenantCode) return
    refetchDepartments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(hierarchyFilters)])

  const options = useMemo(() => {
    if (!departmentsResponse) return [] as { code: string; name: string }[]
    if (Array.isArray(departmentsResponse) && departmentsResponse.length > 0) {
      if (departmentsResponse[0]?.departments && Array.isArray(departmentsResponse[0].departments)) {
        const all: any[] = []
        departmentsResponse.forEach((org: any) => {
          if (Array.isArray(org.departments)) {
            org.departments.forEach((dept: any) => all.push(dept))
          }
        })
        return all.map((dept: any) => ({ code: dept.departmentCode, name: dept.departmentName }))
      }
      if (departmentsResponse[0]?.departmentCode) {
        return departmentsResponse.map((dept: any) => ({
          code: dept.departmentCode,
          name: dept.departmentName,
        }))
      }
    }
    return [] as { code: string; name: string }[]
  }, [departmentsResponse])

  const selected = value ?? []

  const filteredSelected = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return selected
    return selected.filter((d) => {
      if (searchField === "code") {
        return d.departmentCode?.toLowerCase().includes(q)
      }
      return d.departmentName?.toLowerCase().includes(q)
    })
  }, [selected, searchTerm, searchField])

  const paginatedSelected = useMemo(() => {
    const start = (departmentsPage - 1) * pageSize
    return filteredSelected.slice(start, start + pageSize)
  }, [filteredSelected, departmentsPage])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredSelected.length / pageSize))
    if (departmentsPage > maxPage) setDepartmentsPage(maxPage)
  }, [filteredSelected.length, departmentsPage])

  useEffect(() => {
    if (addFieldOpen) setAddSearchTerm("")
  }, [addFieldOpen])

  const addFilteredOptions = useMemo(() => {
    const q = addSearchTerm.toLowerCase().trim()
    if (!q) return options
    return options.filter((d) => {
      if (searchField === "code") return d.code.toLowerCase().includes(q)
      return d.name.toLowerCase().includes(q)
    })
  }, [options, addSearchTerm, searchField])

  const toggleDepartment = (code: string, name: string) => {
    const isSelected = selected.some((s) => s.departmentCode === code)
    if (isSelected) {
      onChange(selected.filter((s) => s.departmentCode !== code))
    } else {
      onChange([...selected, { departmentCode: code, departmentName: name }])
    }
  }

  const handleSelectAll = () => {
    const allInFilter = addFilteredOptions.map((d) => ({
      departmentCode: d.code,
      departmentName: d.name,
    }))
    const allSelected = allInFilter.every((d) =>
      selected.some((s) => s.departmentCode === d.departmentCode)
    )
    if (allSelected) {
      const remaining = selected.filter(
        (s) => !addFilteredOptions.some((d) => d.code === s.departmentCode)
      )
      onChange(remaining)
    } else {
      const merged = [...selected]
      allInFilter.forEach((d) => {
        if (!merged.some((m) => m.departmentCode === d.departmentCode)) merged.push(d)
      })
      onChange(merged)
    }
  }

  const removeDepartment = (code: string) => {
    onChange(selected.filter((d) => d.departmentCode !== code))
  }

  const allAddFilteredSelected =
    addFilteredOptions.length > 0 &&
    addFilteredOptions.every((d) => selected.some((s) => s.departmentCode === d.code))

  const showDepartmentCode = fieldConfig?.departmentCode?.visible ?? true
  const showDepartmentName = fieldConfig?.departmentName?.visible ?? true
  const codeLabel = fieldConfig?.departmentCode?.label || "Department Code"
  const nameLabel = fieldConfig?.departmentName?.label || "Department Name"

  useEffect(() => {
    if (showDepartmentCode && showDepartmentName) return
    setSearchField(showDepartmentCode ? "code" : "name")
  }, [showDepartmentCode, showDepartmentName])

  if (!showDepartmentCode && !showDepartmentName) return null

  return (
    <div className="relative bg-white rounded-lg">
      <div>
        <h2 className="text-base font-medium text-gray-900">Department(s)</h2>
        <div className="mt-1 border-b border-gray-200" />
      </div>

      <div className="pt-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <div className="flex bg-muted/50 rounded-lg border">
              <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                <Select
                  value={searchField}
                  onValueChange={(val: "code" | "name") => setSearchField(val)}
                >
                  <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {showDepartmentCode && (
                      <SelectItem value="code" className="text-sm">
                        Code
                      </SelectItem>
                    )}
                    {showDepartmentName && (
                      <SelectItem value="name" className="text-sm">
                        Name
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 flex items-center bg-background rounded-r-lg">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    autoComplete="off"
                    placeholder={`Search by ${searchField === "code" ? "code" : "name"}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {addFieldOpen && (
              <div className="absolute z-30 left-0 top-full mt-3 w-[min(720px,100%)]">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3">
                  <div className="flex bg-muted/50 rounded-lg border">
                    <div className="flex-1 flex items-center bg-background rounded-l-lg">
                      <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder={`Search by ${searchField === "code" ? "code" : "name"}...`}
                          value={addSearchTerm}
                          onChange={(e) => setAddSearchTerm(e.target.value)}
                          className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddFieldOpen(false)}
                      className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="border rounded-lg bg-white">
                    <Command shouldFilter={false} className="rounded-lg">
                      {addFilteredOptions.length > 0 && (
                        <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                          <button
                            type="button"
                            onClick={handleSelectAll}
                            className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                          >
                            <Check
                              className={`h-4 w-4 rounded-sm border ${
                                allAddFilteredSelected
                                  ? "opacity-100 text-green-600 border-green-500"
                                  : "opacity-70 text-transparent border-gray-300"
                              }`}
                            />
                            <span>Select all ({addFilteredOptions.length})</span>
                          </button>
                        </div>
                      )}
                      <CommandList className="max-h-[200px]">
                        <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                          No departments found.
                        </CommandEmpty>
                        <CommandGroup>
                          {addFilteredOptions.map((d) => {
                            const isSelected = selected.some((s) => s.departmentCode === d.code)
                            return (
                              <CommandItem
                                key={d.code}
                                value={`${d.code}-${d.name}`}
                                onSelect={() => toggleDepartment(d.code, d.name)}
                                className="cursor-pointer"
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 rounded-sm border ${
                                    isSelected
                                      ? "opacity-100 text-green-600 border-green-500"
                                      : "opacity-70 text-transparent border-gray-300"
                                  }`}
                                />
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{d.name || "N/A"}</div>
                                  <div className="text-xs text-gray-500">Code: {d.code}</div>
                                </div>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={() => setAddFieldOpen((prev) => !prev)}
            size="default"
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading || disabled}
          >
            Add Departments
          </Button>
        </div>

        <div className="border rounded-lg bg-slate-50/40">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                {showDepartmentCode && (
                  <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    {codeLabel}
                  </TableHead>
                )}
                {showDepartmentName && (
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    {nameLabel}
                  </TableHead>
                )}
                {!disabled && (
                  <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                    Actions
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSelected.length > 0 ? (
                paginatedSelected.map((dept) => (
                  <TableRow
                    key={dept.departmentCode}
                    className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                  >
                    {showDepartmentCode && (
                      <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                        {dept.departmentCode}
                      </TableCell>
                    )}
                    {showDepartmentName && (
                      <TableCell className="py-1.5 text-sm text-gray-900">
                        {dept.departmentName || dept.departmentCode}
                      </TableCell>
                    )}
                    {!disabled && (
                      <TableCell className="py-1.5 pr-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                          onClick={() => removeDepartment(dept.departmentCode)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={(showDepartmentCode && showDepartmentName ? 2 : 1) + (disabled ? 0 : 1)}
                    className="py-8 text-center text-sm text-gray-500"
                  >
                    No departments selected. Click &quot;Add Departments&quot; to select
                    departments.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filteredSelected.length > pageSize && (
            <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
              <p className="text-[11px] text-gray-500">
                Showing{" "}
                <span className="font-semibold">
                  {Math.min((departmentsPage - 1) * pageSize + 1, filteredSelected.length)}-
                  {Math.min(departmentsPage * pageSize, filteredSelected.length)}
                </span>{" "}
                of <span className="font-semibold">{filteredSelected.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  disabled={departmentsPage === 1}
                  onClick={() => setDepartmentsPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  disabled={departmentsPage * pageSize >= filteredSelected.length}
                  onClick={() =>
                    setDepartmentsPage((p) =>
                      p * pageSize >= filteredSelected.length ? p : p + 1
                    )
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
