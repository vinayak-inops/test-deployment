"use client"

import { Building2 } from "lucide-react"
import { TableType, TableMenuItem } from "./types"
import { TableContentArea } from "./table-content-area"

interface TableContentProps {
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
  pageSize: number
  // Additional props for filtering
  filterChildByParent: (childType: TableType, parentType: TableType, parentCodes: string[]) => any[]
  PARENT_FIELD_MAP: Record<string, string>
}

export function TableContent({
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
  subsidiariesSearch,
  setSubsidiariesSearch,
  divisionsSearch,
  setDivisionsSearch,
  departmentsSearch,
  setDepartmentsSearch,
  designationsSearch,
  setDesignationsSearch,
  subDepartmentsSearch,
  setSubDepartmentsSearch,
  gradesSearch,
  setGradesSearch,
  sectionsSearch,
  setSectionsSearch,
  employeeCategoriesSearch,
  setEmployeeCategoriesSearch,
  contractorSearch,
  setContractorSearch,
  locationsSearch,
  setLocationsSearch,
  workOrderSearch,
  setWorkOrderSearch,
  shiftGroupsSearch,
  setShiftGroupsSearch,
  shiftsSearch,
  setShiftsSearch,
  subsidiariesField,
  setSubsidiariesField,
  divisionsField,
  setDivisionsField,
  departmentsField,
  setDepartmentsField,
  designationsField,
  setDesignationsField,
  subDepartmentsField,
  setSubDepartmentsField,
  gradesField,
  setGradesField,
  sectionsField,
  setSectionsField,
  employeeCategoriesField,
  setEmployeeCategoriesField,
  contractorField,
  setContractorField,
  locationsField,
  setLocationsField,
  workOrderField,
  setWorkOrderField,
  shiftGroupsField,
  setShiftGroupsField,
  shiftsField,
  setShiftsField,
  subsidiariesPage,
  setSubsidiariesPage,
  divisionsPage,
  setDivisionsPage,
  departmentsPage,
  setDepartmentsPage,
  designationsPage,
  setDesignationsPage,
  subDepartmentsPage,
  setSubDepartmentsPage,
  gradesPage,
  setGradesPage,
  sectionsPage,
  setSectionsPage,
  employeeCategoriesPage,
  setEmployeeCategoriesPage,
  contractorPage,
  setContractorPage,
  locationsPage,
  setLocationsPage,
  workOrderPage,
  setWorkOrderPage,
  shiftGroupsPage,
  setShiftGroupsPage,
  shiftsPage,
  setShiftsPage,
  pageSize,
  filterChildByParent,
  PARENT_FIELD_MAP,
}: TableContentProps) {
  return (
    <div className="flex-1 flex flex-col relative">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Render only visible table types */}
          {tableMenuItems
            .filter(item => visibleTables.has(item.id))
            .map((tableItem) => (
              <TableContentArea
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
                pageSize={pageSize}
                filterChildByParent={filterChildByParent}
                PARENT_FIELD_MAP={PARENT_FIELD_MAP}
                tableMenuItems={tableMenuItems}
              />
            ))}
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
    </div>
  )
}

