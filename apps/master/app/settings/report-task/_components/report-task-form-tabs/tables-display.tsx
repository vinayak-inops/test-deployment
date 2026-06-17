"use client"

import { useState, useEffect, useMemo } from "react"
import { Building2, Filter, Search as SearchIcon, X, Trash2, AlertTriangle, Check, Users } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@repo/ui/components/ui/command"
import { TableType, TableMenuItem } from "./types"
import EmployeeSearchField, { Employee } from "@/components/fields/employee-search"

interface TablesDisplayProps {
  tableMenuItems: TableMenuItem[]
  visibleTables: Set<TableType>
  getSelectedItems: (type: TableType) => string[]
  getDataForType: (type: TableType) => any[]
  getLoadingForType: (type: TableType) => boolean
  getFilteredDataForType: (type: TableType) => any[]
  isParentSelected: (type: TableType) => boolean
  handleAddItems: (type: TableType, codes: string[]) => void
  handleRemoveItem: (type: TableType, code: string) => void
  handleRemoveItems: (type: TableType, codes: string[]) => void
  toggleAddField: (type: TableType) => void
  openAddFieldType: TableType | null
  setOpenAddFieldType: (type: TableType | null) => void
  filterChildByParent: (childType: TableType, parentType: TableType, parentCodes: string[]) => any[]
  PARENT_FIELD_MAP: Record<string, string>
  // Search states
  subsidiariesSearch: string
  setSubsidiariesSearch: (val: string) => void
  divisionsSearch: string
  setDivisionsSearch: (val: string) => void
  departmentsSearch: string
  setDepartmentsSearch: (val: string) => void
  designationsSearch: string
  setDesignationsSearch: (val: string) => void
  subDepartmentsSearch: string
  setSubDepartmentsSearch: (val: string) => void
  gradesSearch: string
  setGradesSearch: (val: string) => void
  sectionsSearch: string
  setSectionsSearch: (val: string) => void
  employeeCategoriesSearch: string
  setEmployeeCategoriesSearch: (val: string) => void
  contractorSearch: string
  setContractorSearch: (val: string) => void
  locationsSearch: string
  setLocationsSearch: (val: string) => void
  workOrderSearch: string
  setWorkOrderSearch: (val: string) => void
  shiftGroupsSearch: string
  setShiftGroupsSearch: (val: string) => void
  shiftsSearch: string
  setShiftsSearch: (val: string) => void
  contractEmployeesSearch: string
  setContractEmployeesSearch: (val: string) => void
  // Field states
  subsidiariesField: 'code' | 'name'
  setSubsidiariesField: (val: 'code' | 'name') => void
  divisionsField: 'code' | 'name'
  setDivisionsField: (val: 'code' | 'name') => void
  departmentsField: 'code' | 'name'
  setDepartmentsField: (val: 'code' | 'name') => void
  designationsField: 'code' | 'name'
  setDesignationsField: (val: 'code' | 'name') => void
  subDepartmentsField: 'code' | 'name'
  setSubDepartmentsField: (val: 'code' | 'name') => void
  gradesField: 'code' | 'name'
  setGradesField: (val: 'code' | 'name') => void
  sectionsField: 'code' | 'name'
  setSectionsField: (val: 'code' | 'name') => void
  employeeCategoriesField: 'code' | 'name'
  setEmployeeCategoriesField: (val: 'code' | 'name') => void
  contractorField: 'code' | 'name'
  setContractorField: (val: 'code' | 'name') => void
  locationsField: 'code' | 'name'
  setLocationsField: (val: 'code' | 'name') => void
  workOrderField: 'code' | 'name'
  setWorkOrderField: (val: 'code' | 'name') => void
  shiftGroupsField: 'code' | 'name'
  setShiftGroupsField: (val: 'code' | 'name') => void
  shiftsField: 'code' | 'name'
  setShiftsField: (val: 'code' | 'name') => void
  contractEmployeesField: 'code' | 'name'
  setContractEmployeesField: (val: 'code' | 'name') => void
  // Pagination states
  subsidiariesPage: number
  setSubsidiariesPage: (val: number) => void
  divisionsPage: number
  setDivisionsPage: (val: number) => void
  departmentsPage: number
  setDepartmentsPage: (val: number) => void
  designationsPage: number
  setDesignationsPage: (val: number) => void
  subDepartmentsPage: number
  setSubDepartmentsPage: (val: number) => void
  gradesPage: number
  setGradesPage: (val: number) => void
  sectionsPage: number
  setSectionsPage: (val: number) => void
  employeeCategoriesPage: number
  setEmployeeCategoriesPage: (val: number) => void
  contractorPage: number
  setContractorPage: (val: number) => void
  locationsPage: number
  setLocationsPage: (val: number) => void
  workOrderPage: number
  setWorkOrderPage: (val: number) => void
  shiftGroupsPage: number
  setShiftGroupsPage: (val: number) => void
  shiftsPage: number
  setShiftsPage: (val: number) => void
  contractEmployeesPage: number
  setContractEmployeesPage: (val: number) => void
  pageSize: number
  // Additional dependencies for filtering
  selectedSubsidiaries: string[]
  selectedDivisions: string[]
  selectedDepartments: string[]
  selectedSubDepartments: string[]
  selectedDesignations: string[]
  selectedContractors: string[]
  selectedLocations: string[]
  selectedWorkOrders: string[]
  selectedEmployeeCategories: string[]
  selectedSections: string[]
  selectedGrades: string[]
  onSaveAndContinue?: () => void
  viewMode?: boolean
}

// Inline Add Field Component
const InlineAddField = ({
  isOpen,
  data,
  selectedCodes,
  tableItem,
  onSave,
  onRemove,
  onRemoveMultiple,
  loading,
  selectedField,
  onClose,
  visibleTables,
  getSelectedItems,
  getDataForType,
  filterChildByParent,
  PARENT_FIELD_MAP,
  selectedSubsidiaries,
  selectedDivisions,
  selectedDepartments,
  selectedSubDepartments,
  selectedDesignations,
  selectedContractors,
}: {
  isOpen: boolean
  data: any[]
  selectedCodes: string[]
  tableItem: TableMenuItem
  onSave: (codes: string[]) => void
  onRemove: (code: string) => void
  onRemoveMultiple?: (codes: string[]) => void
  loading: boolean
  selectedField: 'code' | 'name'
  onClose: () => void
  visibleTables: Set<TableType>
  getSelectedItems: (type: TableType) => string[]
  getDataForType: (type: TableType) => any[]
  filterChildByParent: (childType: TableType, parentType: TableType, parentCodes: string[]) => any[]
  PARENT_FIELD_MAP: Record<string, string>
  selectedSubsidiaries: string[]
  selectedDivisions: string[]
  selectedDepartments: string[]
  selectedSubDepartments: string[]
  selectedDesignations: string[]
  selectedContractors: string[]
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const parentField = PARENT_FIELD_MAP[tableItem.id]

  const availableItems = useMemo(() => {
    const allData = getDataForType(tableItem.id)
    if (!allData || !Array.isArray(allData)) return []

    if (!parentField) {
      return allData.filter(item => item && item.code)
    }

    let currentField = parentField

    while (currentField) {
      const currentType = currentField as TableType
      const isAncestorVisible = visibleTables.has(currentType)

      if (isAncestorVisible) {
        const ancestorSelected = getSelectedItems(currentType)
        if (ancestorSelected.length > 0) {
          return filterChildByParent(tableItem.id, currentType, ancestorSelected)
        }
        return allData.filter(item => item && item.code)
      }

      const grandParentField = PARENT_FIELD_MAP[currentField]
      if (!grandParentField || grandParentField === '') {
        return allData.filter(item => item && item.code)
      }
      currentField = grandParentField
    }

    return allData.filter(item => item && item.code)
  }, [parentField, tableItem.id, visibleTables, selectedSubsidiaries, selectedDivisions, selectedDepartments, selectedSubDepartments, selectedDesignations, selectedContractors, getDataForType, getSelectedItems, filterChildByParent])

  const filteredData = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()
    if (!query) return availableItems

    return availableItems.filter((item: any) => {
      if (!item || !item.code) return false
      if (selectedField === 'name') {
        return item.name?.toLowerCase().includes(query)
      }
      return item.code?.toLowerCase().includes(query)
    })
  }, [searchTerm, selectedField, availableItems])

  useEffect(() => {
    if (isOpen) {
      setSearchTerm('')
    }
  }, [isOpen, tableItem.id])

  if (!isOpen) return null

  return (
    <div className="flex justify-center">
      <div className="w-2/3 bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3">
        <div className="flex bg-muted/50 rounded-lg border">
          <div className="flex-1 flex items-center bg-background rounded-l-lg">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Search by ${selectedField === 'code' ? 'code' : 'name'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border rounded-lg bg-white">
          <Command shouldFilter={false} className="rounded-lg">
            {filteredData.length > 0 && (
              <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                <button
                  type="button"
                  onClick={() => {
                    const allCodes = filteredData.map((item: any) => item.code)
                    const allSelected = allCodes.every((code: string) => selectedCodes.includes(code))
                    if (allSelected) {
                      const codesToRemove = allCodes.filter(code => selectedCodes.includes(code))
                      if (codesToRemove.length > 0) {
                        if (onRemoveMultiple) {
                          onRemoveMultiple(codesToRemove)
                        } else {
                          codesToRemove.forEach(code => onRemove(code))
                        }
                      }
                    } else {
                      const toAdd = allCodes.filter(code => !selectedCodes.includes(code))
                      if (toAdd.length > 0) {
                        onSave(toAdd)
                      }
                    }
                  }}
                  className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                >
                  <Check
                    className={`h-4 w-4 rounded-sm border ${filteredData.length > 0 &&
                        filteredData.every((item: any) => selectedCodes.includes(item.code))
                        ? 'opacity-100 text-green-600 border-green-500'
                        : 'opacity-70 text-transparent border-gray-300'
                      }`}
                  />
                  <span>Select all ({filteredData.length})</span>
                </button>
              </div>
            )}

            <CommandList className="max-h-[200px]">
              <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                No {tableItem.label.toLowerCase()} found.
              </CommandEmpty>
              <CommandGroup>
                {filteredData.map((item: any) => (
                  <CommandItem
                    key={item.code}
                    value={item.code}
                    onSelect={() => {
                      if (selectedCodes.includes(item.code)) {
                        onRemove(item.code)
                      } else {
                        onSave([item.code])
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={`mr-2 h-4 w-4 rounded-sm border ${selectedCodes.includes(item.code)
                          ? 'opacity-100 text-green-600 border-green-500'
                          : 'opacity-70 text-transparent border-gray-300'
                        }`}
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.name || 'N/A'}</div>
                      <div className="text-xs text-gray-500">Code: {item.code}</div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </div>
    </div>
  )
}

// Component for rendering each table type
const TableTypeCard = ({
  tableItem,
  visibleTables,
  getSelectedItems,
  getDataForType,
  getLoadingForType,
  getFilteredDataForType,
  isParentSelected,
  handleAddItems,
  handleRemoveItem,
  handleRemoveItems,
  toggleAddField,
  openAddFieldType,
  setOpenAddFieldType,
  filterChildByParent,
  PARENT_FIELD_MAP,
  tableMenuItems,
  searchState,
  pageSize,
  selectedSubsidiaries,
  selectedDivisions,
  selectedDepartments,
  selectedSubDepartments,
  selectedDesignations,
  selectedContractors,
  viewMode = false,
}: {
  tableItem: TableMenuItem
  visibleTables: Set<TableType>
  getSelectedItems: (type: TableType) => string[]
  getDataForType: (type: TableType) => any[]
  getLoadingForType: (type: TableType) => boolean
  getFilteredDataForType: (type: TableType) => any[]
  isParentSelected: (type: TableType) => boolean
  handleAddItems: (type: TableType, codes: string[]) => void
  handleRemoveItem: (type: TableType, code: string) => void
  handleRemoveItems: (type: TableType, codes: string[]) => void
  toggleAddField: (type: TableType) => void
  openAddFieldType: TableType | null
  setOpenAddFieldType: (type: TableType | null) => void
  filterChildByParent: (childType: TableType, parentType: TableType, parentCodes: string[]) => any[]
  PARENT_FIELD_MAP: Record<string, string>
  tableMenuItems: TableMenuItem[]
  searchState: any
  pageSize: number
  selectedSubsidiaries: string[]
  selectedDivisions: string[]
  selectedDepartments: string[]
  selectedSubDepartments: string[]
  selectedDesignations: string[]
  selectedContractors: string[]
  viewMode?: boolean
}) => {
  const tableId = tableItem.id
  const Icon = tableItem.icon
  const selectedCodes = getSelectedItems(tableId)
  const parentField = PARENT_FIELD_MAP[tableId]
  const isParentSelectedValue = isParentSelected(tableId)
  const data = isParentSelectedValue ? (parentField ? getFilteredDataForType(tableId) : getDataForType(tableId)) : []
  const loading = getLoadingForType(tableId)

  const codeLabel = {
    subsidiaries: "Subsidiary Code",
    divisions: "Division Code",
    departments: "Department Code",
    subDepartments: "Sub Department Code",
    sections: "Section Code",
    designations: "Designation Code",
    grades: "Grade Code",
    employeeCategories: "Category Code",
    locations: "Location Code",
    contractors: "Contractor Code",
    workOrders: "Work Order Number",
    shiftGroups: "Shift Group Code",
    shifts: "Shift Code",
    contractEmployees: "Employee ID",
  }[tableId]

  const nameLabel = {
    subsidiaries: "Subsidiary Name",
    divisions: "Division Name",
    departments: "Department Name",
    subDepartments: "Sub Department Name",
    sections: "Section Name",
    designations: "Designation Name",
    grades: "Grade Name",
    employeeCategories: "Category Name",
    locations: "Location Name",
    contractors: "Contractor Name",
    workOrders: "Work Order Number",
    shiftGroups: "Shift Group Name",
    shifts: "Shift Name",
    contractEmployees: "Employee Name",
  }[tableId]

  const filteredSelected = useMemo(() => {
    const query = searchState.term.toLowerCase().trim()
    if (!query) return selectedCodes
    return selectedCodes.filter(code => {
      const item = data.find(d => d.code === code)
      if (!item) return false
      if (searchState.field === 'code') {
        return item.code?.toLowerCase().includes(query)
      } else {
        return item.name?.toLowerCase().includes(query)
      }
    })
  }, [selectedCodes, searchState.term, searchState.field, data])

  const paginatedCodes = useMemo(() =>
    filteredSelected.slice((searchState.page - 1) * pageSize, searchState.page * pageSize),
    [filteredSelected, searchState.page, pageSize]
  )

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">{tableItem.label}</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            {selectedCodes.length} {tableItem.label.toLowerCase()} selected
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex bg-muted/50 rounded-lg border flex-1">
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
              <Filter className="w-4 h-4 text-muted-foreground mr-2" />
              <Select
                value={searchState.field}
                onValueChange={(val: 'code' | 'name') => searchState.setField(val)}
              >
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="code" className="text-sm">Code</SelectItem>
                  <SelectItem value="name" className="text-sm">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 flex items-center bg-background rounded-r-lg">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  key={`search-${tableId}-${searchState.field}`}
                  type="text"
                  autoComplete="off"
                  placeholder={`Search by ${searchState.field === 'code' ? 'code' : 'name'}...`}
                  value={searchState.term}
                  onChange={(e) => searchState.set(e.target.value)}
                  className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                />
              </div>
            </div>
          </div>
          {!viewMode && (
            <Button
              type="button"
              onClick={() => toggleAddField(tableId)}
              size="default"
              className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={loading || !isParentSelectedValue}
              title={!isParentSelectedValue && parentField ? (() => {
                let currentField = parentField
                while (currentField) {
                  const currentType = currentField as TableType
                  const isAncestorVisible = visibleTables.has(currentType)
                  if (isAncestorVisible) {
                    const ancestorSelected = getSelectedItems(currentType)
                    if (ancestorSelected.length === 0) {
                      const ancestorMenuItem = tableMenuItems.find(item => item.id === currentField)
                      return `Please select ${ancestorMenuItem?.label || currentField} first`
                    }
                  }
                  const grandParentField = PARENT_FIELD_MAP[currentField]
                  if (!grandParentField || grandParentField === '') break
                  currentField = grandParentField
                }
                return ''
              })() : ''}
            >
              Add {tableItem.label}
            </Button>
          )}
        </div>

        {!isParentSelectedValue && parentField && (() => {
          let currentField = parentField
          let visibleAncestor: { id: string; label: string } | null = null

          while (currentField && !visibleAncestor) {
            const currentType = currentField as TableType
            const isAncestorVisible = visibleTables.has(currentType)

            if (isAncestorVisible) {
              const ancestorSelected = getSelectedItems(currentType)
              if (ancestorSelected.length === 0) {
                const ancestorMenuItem = tableMenuItems.find(item => item.id === currentField)
                visibleAncestor = {
                  id: currentField,
                  label: ancestorMenuItem?.label || currentField
                }
              } else {
                break
              }
            }

            const grandParentField = PARENT_FIELD_MAP[currentField]
            if (!grandParentField || grandParentField === '') break
            currentField = grandParentField
          }

          if (!visibleAncestor) return null

          return (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-900">Parent selection required</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Please select <span className="font-semibold">{visibleAncestor.label}</span> first to enable this selection.
                  </p>
                </div>
              </div>
            </div>
          )
        })()}

        <div className="relative">
          {openAddFieldType === tableId && (
            <div className="absolute top-0 left-0 right-0 z-50">
              <InlineAddField
                isOpen={true}
                data={data}
                selectedCodes={selectedCodes}
                tableItem={tableItem}
                onSave={(codes) => handleAddItems(tableId, codes)}
                onRemove={(code) => handleRemoveItem(tableId, code)}
                onRemoveMultiple={(codes) => handleRemoveItems(tableId, codes)}
                loading={loading}
                selectedField={searchState.field}
                onClose={() => setOpenAddFieldType(null)}
                visibleTables={visibleTables}
                getSelectedItems={getSelectedItems}
                getDataForType={getDataForType}
                filterChildByParent={filterChildByParent}
                PARENT_FIELD_MAP={PARENT_FIELD_MAP}
                selectedSubsidiaries={selectedSubsidiaries}
                selectedDivisions={selectedDivisions}
                selectedDepartments={selectedDepartments}
                selectedSubDepartments={selectedSubDepartments}
                selectedDesignations={selectedDesignations}
                selectedContractors={selectedContractors}
              />
            </div>
          )}

          <div className="border rounded-lg bg-slate-50/40">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    {codeLabel}
                  </TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    {nameLabel}
                  </TableHead>
                  {!viewMode && (
                    <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCodes.length > 0 ? (
                  paginatedCodes.map((code) => {
                    const item = data.find(d => d.code === code)
                    return (
                      <TableRow
                        key={code}
                        className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                      >
                        <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                          {code}
                        </TableCell>
                        <TableCell className="py-1.5 text-sm text-gray-900">
                          {item?.name || code}
                        </TableCell>
                        {!viewMode && (
                          <TableCell className="py-1.5 pr-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                              onClick={() => handleRemoveItem(tableId, code)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={viewMode ? 2 : 3} className="py-8 text-center text-sm text-gray-500">
                      No {tableItem.label.toLowerCase()} selected. Click "Add {tableItem.label}" to select {tableItem.label.toLowerCase()}.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {filteredSelected.length > pageSize && (
              <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                <p className="text-[11px] text-gray-500">
                  Showing{' '}
                  <span className="font-semibold">
                    {Math.min((searchState.page - 1) * pageSize + 1, filteredSelected.length)}-
                    {Math.min(searchState.page * pageSize, filteredSelected.length)}
                  </span>{' '}
                  of <span className="font-semibold">{filteredSelected.length}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    disabled={searchState.page === 1}
                    onClick={() => searchState.setPage(Math.max(1, searchState.page - 1))}
                  >
                    Prev
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-[11px]"
                    disabled={searchState.page * pageSize >= filteredSelected.length}
                    onClick={() => searchState.setPage(searchState.page * pageSize >= filteredSelected.length ? searchState.page : searchState.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Contract Employee Component - Uses EmployeeSearchField
const ContractEmployeeCard = ({
  tableItem,
  getSelectedItems,
  handleAddItems,
  handleRemoveItem,
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
  viewMode = false,
}: {
  tableItem: TableMenuItem
  getSelectedItems: (type: TableType) => string[]
  handleAddItems: (type: TableType, codes: string[]) => void
  handleRemoveItem: (type: TableType, code: string) => void
  selectedSubsidiaries: string[]
  selectedDivisions: string[]
  selectedDepartments: string[]
  selectedSubDepartments: string[]
  selectedSections: string[]
  selectedDesignations: string[]
  selectedGrades: string[]
  selectedEmployeeCategories: string[]
  selectedLocations: string[]
  selectedContractors: string[]
  selectedWorkOrders: string[]
  viewMode?: boolean
}) => {
  const tableId = tableItem.id
  const Icon = tableItem.icon
  const selectedEmployeeIds = getSelectedItems(tableId)
  const [selectedEmployeesMap, setSelectedEmployeesMap] = useState<Map<string, Employee>>(new Map())

  // Update selected employees map when employee list changes
  const handleEmployeeListChange = (employees: Employee[]) => {
    setSelectedEmployeesMap(prev => {
      const newMap = new Map(prev)
      // Update map with employees that are in the selected list
      selectedEmployeeIds.forEach(id => {
        const employee = employees.find(e => e.employeeID === id)
        if (employee) {
          newMap.set(id, employee)
        }
      })
      // Remove employees that are no longer selected
      Array.from(newMap.keys()).forEach(id => {
        if (!selectedEmployeeIds.includes(id)) {
          newMap.delete(id)
        }
      })
      return newMap
    })
  }

  const handleEmployeeSelect = (employee: Employee) => {
    // Add employee ID to selected list if not already selected (allow multiple selections)
    if (!selectedEmployeeIds.includes(employee.employeeID)) {
      handleAddItems(tableId, [employee.employeeID])
      setSelectedEmployeesMap(prev => {
        const newMap = new Map(prev)
        newMap.set(employee.employeeID, employee)
        return newMap
      })
      // Note: The EmployeeSearchField will show the employee name after selection
      // User needs to clear the field (click X button) to search for another employee
    } else {
      // If already selected, remove it (toggle behavior)
      handleRemoveEmployee(employee.employeeID)
    }
  }

  const handleEmployeeClear = () => {
    // This is called when user clears the search field manually
    // We don't want to clear all selected employees, just the search field
    // No action needed - selected employees remain in the list
  }

  const handleRemoveEmployee = (employeeId: string) => {
    handleRemoveItem(tableId, employeeId)
    setSelectedEmployeesMap(prev => {
      const newMap = new Map(prev)
      newMap.delete(employeeId)
      return newMap
    })
  }

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <Icon className="h-4 w-4 text-gray-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">{tableItem.label}</h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            {selectedEmployeeIds.length} {tableItem.label.toLowerCase()} selected
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Employee Search Field */}
        <div className="space-y-2">
          <EmployeeSearchField
            label="Search Contract Employee"
            required={false}
            isOpen={true}
            onSelect={handleEmployeeSelect}
            onClear={handleEmployeeClear}
            onEmployeeListChange={handleEmployeeListChange}
            // OR if you want to keep the individual props approach:
            subsidiaries={selectedSubsidiaries?.length > 0 ? selectedSubsidiaries : undefined}
            divisions={selectedDivisions?.length > 0 ? selectedDivisions : undefined}
            departments={selectedDepartments?.length > 0 ? selectedDepartments : undefined}
            locations={selectedLocations?.length > 0 ? selectedLocations : undefined}
            contractors={selectedContractors?.length > 0 ? selectedContractors : undefined}
          />
          <div className="flex items-start gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-blue-600 mt-0.5">💡</div>
            <div className="flex-1">
              <p className="text-xs text-blue-800 font-medium">Multiple Selection Enabled</p>
              <p className="text-xs text-blue-700 mt-0.5">
                After selecting an employee, click the <strong>X button</strong> in the search field to clear it, then search again to add more employees. You can select multiple employees.
              </p>
            </div>
          </div>
        </div>

        {/* Selected Employees List */}
        {selectedEmployeeIds.length > 0 && (
          <div className="border rounded-lg bg-slate-50/40">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    Employee ID
                  </TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    Employee Name
                  </TableHead>
                  {!viewMode && (
                    <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedEmployeeIds.map((employeeId) => {
                  // Find employee in selectedEmployeesMap or use ID as fallback
                  const employee = selectedEmployeesMap.get(employeeId)
                  const displayName = employee
                    ? `${employee.firstName || ''} ${employee.middleName || ''} ${employee.lastName || ''}`.trim() || employeeId
                    : employeeId

                  return (
                    <TableRow
                      key={employeeId}
                      className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                    >
                      <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                        {employeeId}
                      </TableCell>
                      <TableCell className="py-1.5 text-sm text-gray-900">
                        {displayName}
                      </TableCell>
                      {!viewMode && (
                        <TableCell className="py-1.5 pr-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                            onClick={() => handleRemoveEmployee(employeeId)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {selectedEmployeeIds.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            No {tableItem.label.toLowerCase()} selected. Use the search field above to add employees.
          </div>
        )}
      </div>
    </div>
  )
}

export function TablesDisplay(props: TablesDisplayProps) {
  const {
    tableMenuItems,
    visibleTables,
    getSelectedItems,
    getDataForType,
    getLoadingForType,
    getFilteredDataForType,
    isParentSelected,
    handleAddItems,
    handleRemoveItem,
    handleRemoveItems,
    toggleAddField,
    openAddFieldType,
    setOpenAddFieldType,
    filterChildByParent,
    PARENT_FIELD_MAP,
    pageSize,
    selectedSubsidiaries,
    selectedDivisions,
    selectedDepartments,
    selectedSubDepartments,
    selectedDesignations,
    selectedContractors,
    selectedLocations,
    selectedWorkOrders,
    selectedEmployeeCategories,
    selectedSections,
    selectedGrades,
    onSaveAndContinue,
    viewMode = false,
  } = props

  // Create search state object for each table
  const getSearchState = (tableId: TableType) => {
    const searchStates: Record<TableType, any> = {
      subsidiaries: { term: props.subsidiariesSearch, set: props.setSubsidiariesSearch, page: props.subsidiariesPage, setPage: props.setSubsidiariesPage, field: props.subsidiariesField, setField: props.setSubsidiariesField },
      divisions: { term: props.divisionsSearch, set: props.setDivisionsSearch, page: props.divisionsPage, setPage: props.setDivisionsPage, field: props.divisionsField, setField: props.setDivisionsField },
      departments: { term: props.departmentsSearch, set: props.setDepartmentsSearch, page: props.departmentsPage, setPage: props.setDepartmentsPage, field: props.departmentsField, setField: props.setDepartmentsField },
      subDepartments: { term: props.subDepartmentsSearch, set: props.setSubDepartmentsSearch, page: props.subDepartmentsPage, setPage: props.setSubDepartmentsPage, field: props.subDepartmentsField, setField: props.setSubDepartmentsField },
      sections: { term: props.sectionsSearch, set: props.setSectionsSearch, page: props.sectionsPage, setPage: props.setSectionsPage, field: props.sectionsField, setField: props.setSectionsField },
      designations: { term: props.designationsSearch, set: props.setDesignationsSearch, page: props.designationsPage, setPage: props.setDesignationsPage, field: props.designationsField, setField: props.setDesignationsField },
      grades: { term: props.gradesSearch, set: props.setGradesSearch, page: props.gradesPage, setPage: props.setGradesPage, field: props.gradesField, setField: props.setGradesField },
      employeeCategories: { term: props.employeeCategoriesSearch, set: props.setEmployeeCategoriesSearch, page: props.employeeCategoriesPage, setPage: props.setEmployeeCategoriesPage, field: props.employeeCategoriesField, setField: props.setEmployeeCategoriesField },
      locations: { term: props.locationsSearch, set: props.setLocationsSearch, page: props.locationsPage, setPage: props.setLocationsPage, field: props.locationsField, setField: props.setLocationsField },
      contractors: { term: props.contractorSearch, set: props.setContractorSearch, page: props.contractorPage, setPage: props.setContractorPage, field: props.contractorField, setField: props.setContractorField },
      workOrders: { term: props.workOrderSearch, set: props.setWorkOrderSearch, page: props.workOrderPage, setPage: props.setWorkOrderPage, field: props.workOrderField, setField: props.setWorkOrderField },
      shiftGroups: { term: props.shiftGroupsSearch, set: props.setShiftGroupsSearch, page: props.shiftGroupsPage, setPage: props.setShiftGroupsPage, field: props.shiftGroupsField, setField: props.setShiftGroupsField },
      shifts: { term: props.shiftsSearch, set: props.setShiftsSearch, page: props.shiftsPage, setPage: props.setShiftsPage, field: props.shiftsField, setField: props.setShiftsField },
      contractEmployees: { term: props.contractEmployeesSearch, set: props.setContractEmployeesSearch, page: props.contractEmployeesPage, setPage: props.setContractEmployeesPage, field: props.contractEmployeesField, setField: props.setContractEmployeesField },
    }
    return searchStates[tableId]
  }

  // Validation: Check if all visible tables have at least one selected value
  // Also check if at least one value is selected in the sidebar
  const validationResult = useMemo(() => {
    // If no tables are visible, disable the button
    if (visibleTables.size === 0) {
      return { isValid: false, missingTables: [] }
    }

    const missingTables: { id: TableType; label: string }[] = []
    let hasAnySelection = false

    Array.from(visibleTables).forEach((tableId) => {
      const selectedItems = getSelectedItems(tableId)
      if (selectedItems.length === 0) {
        const tableItem = tableMenuItems.find(item => item.id === tableId)
        if (tableItem) {
          missingTables.push({
            id: tableId,
            label: tableItem.label
          })
        }
      } else {
        // At least one visible table has selections
        hasAnySelection = true
      }
    })

    // Button is enabled only if:
    // 1. At least one value is selected in any visible table
    // 2. All visible tables have at least one selection
    const isValid = hasAnySelection && missingTables.length === 0

    return {
      isValid,
      missingTables
    }
  }, [visibleTables, getSelectedItems, tableMenuItems])

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {tableMenuItems
            .filter(item => visibleTables.has(item.id))
            .map((tableItem) => {
              // Use different component for contract employees
              if (tableItem.id === 'contractEmployees') {
                return (
                  <ContractEmployeeCard
                    key={tableItem.id}
                    tableItem={tableItem}
                    getSelectedItems={getSelectedItems}
                    handleAddItems={handleAddItems}
                    handleRemoveItem={handleRemoveItem}
                    selectedSubsidiaries={selectedSubsidiaries}
                    selectedDivisions={selectedDivisions}
                    selectedDepartments={selectedDepartments}
                    selectedSubDepartments={selectedSubDepartments}
                    selectedSections={selectedSections}
                    selectedDesignations={selectedDesignations}
                    selectedGrades={selectedGrades}
                    selectedEmployeeCategories={selectedEmployeeCategories}
                    selectedLocations={selectedLocations}
                    selectedContractors={selectedContractors}
                    selectedWorkOrders={selectedWorkOrders}
                    viewMode={viewMode}
                  />
                )
              }

              // Use standard TableTypeCard for other table types
              return (
                <TableTypeCard
                  key={tableItem.id}
                  tableItem={tableItem}
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
                  tableMenuItems={tableMenuItems}
                  searchState={getSearchState(tableItem.id)}
                  pageSize={pageSize}
                  selectedSubsidiaries={selectedSubsidiaries}
                  selectedDivisions={selectedDivisions}
                  selectedDepartments={selectedDepartments}
                  selectedSubDepartments={selectedSubDepartments}
                  selectedDesignations={selectedDesignations}
                  selectedContractors={selectedContractors}
                  viewMode={viewMode}
                />
              )
            })}
          {visibleTables.size === 0 && (
            <div className="flex items-center justify-center h-full min-h-[400px]">
              <div className="text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-semibold mb-2">No tables selected</p>
                <p className="text-gray-400 text-sm">Select tables from the left sidebar to view them</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save and Continue Button - Fixed at bottom */}
      <div className="bg-white border-t border-gray-200 p-6">
        <div className="flex justify-center">
          <div className="w-[60%] space-y-3">
            {/* Validation Error Message */}
            {!validationResult.isValid && validationResult.missingTables.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs font-medium text-red-900">
                    Please select at least one value for all visible tables
                  </p>
                </div>
              </div>
            )}

            <Button
              type="button"
              onClick={() => {
                // Validate before proceeding
                if (!validationResult.isValid) {
                  return // Don't proceed if validation fails
                }

                if (onSaveAndContinue) {
                  if (viewMode) return
                  onSaveAndContinue()
                } else {
                  // Fallback - show selected values
                  const allSelectedValues: Record<string, string[]> = {}

                  tableMenuItems.forEach((item) => {
                    const selected = getSelectedItems(item.id)
                    if (selected.length > 0) {
                      allSelectedValues[item.label] = selected
                    }
                  })

                  let alertMessage = "Selected Values:\n\n"

                  if (Object.keys(allSelectedValues).length === 0) {
                    alertMessage = "No values selected."
                  } else {
                    Object.entries(allSelectedValues).forEach(([label, values]) => {
                      alertMessage += `${label}:\n`
                      values.forEach((value) => {
                        alertMessage += `  - ${value}\n`
                      })
                      alertMessage += `\n`
                    })
                  }

                  alert(alertMessage)
                }
              }}
              size="default"
              disabled={!validationResult.isValid || viewMode}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {viewMode ? "View Only" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

