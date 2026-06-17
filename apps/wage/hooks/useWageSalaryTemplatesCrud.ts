"use client"

import { useCallback, useEffect, useState } from "react"

type SalaryHead = { salaryHeadCode: string; salaryHeadName: string; amount: number }
type Designation = { designationCode: string; designationName: string }
type Grade = { gradeCode: string; gradeName: string }
type SkillLevel = { skilledLevelTitle: string; skilledLevelDescription: string }
type Subsidiary = { subsidiaryCode: string; subsidiaryName: string }
type EmployeeCategory = { employeeCategoryCode: string; employeeCategoryName: string }

type SalaryTemplate = {
  name: string
  code: string
  subsidiary: Subsidiary
  state: string
  zone: string
  designation: Designation[]
  grade: Grade
  skillLevel: SkillLevel
  effectiveFrom: string
  effectiveTo: string
  asPerMinimumWages: boolean
  remark: string
  independentSalaryHeads: SalaryHead[]
  country: string
  dependentSalaryHeads: string[]
  employeeCategory: EmployeeCategory
  location: string
}

export type WageSalaryTemplateForm = {
  _id?: { $oid: string }
  organizationCode: string
  tenantCode: string
  salaryTemplate: SalaryTemplate
}

interface WageSalaryTemplatesCrudHook {
  record: WageSalaryTemplateForm | null
  setRecord: (value: WageSalaryTemplateForm | null) => void
  upsertRecord: (value: WageSalaryTemplateForm) => void
  deleteRecord: () => void
  reset: () => void
}

export function useWageSalaryTemplatesCrud(initial: WageSalaryTemplateForm | null = null): WageSalaryTemplatesCrudHook {
  const [record, setRecordState] = useState<WageSalaryTemplateForm | null>(initial)

  useEffect(() => {
    setRecordState(initial)
  }, [initial])

  const setRecord = useCallback((value: WageSalaryTemplateForm | null) => {
    setRecordState(value)
  }, [])

  const upsertRecord = useCallback((value: WageSalaryTemplateForm) => {
    setRecordState(value)
  }, [])

  const deleteRecord = useCallback(() => {
    setRecordState(null)
  }, [])

  const reset = useCallback(() => {
    setRecordState(null)
  }, [])

  return { record, setRecord, upsertRecord, deleteRecord, reset }
}