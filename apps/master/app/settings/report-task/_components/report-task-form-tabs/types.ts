export type TableType =
  | 'subsidiaries'
  | 'divisions'
  | 'departments'
  | 'subDepartments'
  | 'sections'
  | 'designations'
  | 'grades'
  | 'employeeCategories'
  | 'contractors'
  | 'locations'
  | 'workOrders'
  | 'shiftGroups'
  | 'shifts'
  | 'contractEmployees'

export interface TableMenuItem {
  id: TableType
  label: string
  icon: any
  parent?: string
}

