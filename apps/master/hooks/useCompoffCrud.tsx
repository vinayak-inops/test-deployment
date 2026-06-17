"use client"

import { useCallback, useEffect, useState } from "react"

export type Rounding = {
  from: number
  to: number
  roundOffTo: number
}

export type CompOffPolicy = {
  compOffPolicyCode: string
  compOffPolicyTitle: string
  generateOnWeekDay: boolean
  generateOnWeekOff: boolean
  generateOnHoliday: boolean
  halfDayCompOffApplicable: boolean
  expireCompOffAtYearEnd: boolean
  compOffExpiryDays: number
  backDateCompOffAllowed: boolean
  maxBackDaysAllowed: number
  allowDuringNoticePeriod: boolean
  compOffMonthlyLimit: number
  deductLunchBreakForCompOff: boolean
  cannotCombineWith: {
    prefix: string[]
    postfix: string[]
  }
  compOffApplicationRequired: boolean
  compOffGenerationUnit: string
  minimumMinutesToGetFullCompOff: number
  minimumMinutesToGetHalfCompOff: number
  multiplierForWeekDay: number
  multiplierForWeekOff: number
  multiplierForHoliday: number
  forHolidayAndWeekOffOverlap: {
    multiplierWithoutWorking: number
    multiplierForWorking: number
  }
  autoApprove: boolean
  daysUntilAutoApproval: number
  rounding: Rounding[]
}

export type CompOffForm = {
  _id?: { $oid: string }
  organizationCode: string
  tenantCode: string
  subsidiary: {
    subsidiaryCode: string
    subsidiaryName: string
  }
  location: {
    locationCode: string
    locationName: string
  }
  designation: {
    designationCode: string
    designationName: string
  }
  employeeCategory: string[]
  compOffPolicy: CompOffPolicy
}

interface CompOffCrudHook {
  record: CompOffForm | null
  setRecord: (value: CompOffForm | null) => void
  upsertRecord: (value: CompOffForm) => void
  deleteRecord: () => void
  reset: () => void
}

export function useCompOffCrud(initial: CompOffForm | null = null): CompOffCrudHook {
  const [record, setRecordState] = useState<CompOffForm | null>(initial)

  useEffect(() => {
    setRecordState(initial)
  }, [initial])

  const setRecord = useCallback((value: CompOffForm | null) => {
    setRecordState(value)
  }, [])

  const upsertRecord = useCallback((value: CompOffForm) => {
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
