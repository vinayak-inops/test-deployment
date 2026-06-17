"use client"

import { useCallback, useEffect, useState } from "react"

export type Slab = { from: number; to: number; amount: number }

export type ProfessionalTaxItem = {
  state: string
  effectiveFrom: string
  slabs: Slab[]
  applicableTo: string
}

export type WageProfessionalTaxForm = {
  _id?: { $oid: string }
  organizationCode: string
  tenantCode: string
  professionaTax: ProfessionalTaxItem[]
}

interface WageProfessionalTaxCrudHook {
  record: WageProfessionalTaxForm | null
  setRecord: (value: WageProfessionalTaxForm | null) => void
  upsertRecord: (value: WageProfessionalTaxForm) => void
  deleteRecord: () => void
  reset: () => void
}

export function useWageProfessionalTaxCrud(initial: WageProfessionalTaxForm | null = null): WageProfessionalTaxCrudHook {
  const [record, setRecordState] = useState<WageProfessionalTaxForm | null>(initial)

  useEffect(() => {
    setRecordState(initial)
  }, [initial])

  const setRecord = useCallback((value: WageProfessionalTaxForm | null) => {
    setRecordState(value)
  }, [])

  const upsertRecord = useCallback((value: WageProfessionalTaxForm) => {
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