import { useEffect, useRef } from "react"

interface UseWorkOrderAutoSyncParams {
  watchedValues: any
  isViewMode: boolean
  currentMode: string
  auditStatusFormData: any
  getSelectedWorkOrder: (workOrderNumber: string) => any
  getDateForInput: (dateString: string) => string | undefined
  formatDateForDisplay: (dateString: string | undefined) => string
  setValue: any
  onFormDataChange: (data: any) => void
  enabled?: boolean
}

export function useWorkOrderAutoSync({
  watchedValues,
  isViewMode,
  currentMode,
  auditStatusFormData,
  getSelectedWorkOrder,
  getDateForInput,
  formatDateForDisplay,
  setValue,
  onFormDataChange,
  enabled = true,
}: UseWorkOrderAutoSyncParams) {
  const previousWorkOrderNumberRef = useRef<{ [key: number]: string | undefined }>({})

  useEffect(() => {
    if (!enabled) return
    if (isViewMode) return
    const workOrders = watchedValues.workOrder || []
    let anyChanged = false
    const updated = workOrders.map((wo: any, idx: number) => {
      const prevNum = previousWorkOrderNumberRef.current[idx]
      const currNum = wo?.workOrderNumber
      if (currNum && currNum !== prevNum) {
        let selectedWO = getSelectedWorkOrder(currNum)
        if (!selectedWO && auditStatusFormData) {
          const fallbackList = (auditStatusFormData.workOrderMaster ||
            auditStatusFormData.workOrders ||
            auditStatusFormData.contractorWorkOrders ||
            []) as any[]
          selectedWO = Array.isArray(fallbackList) ? fallbackList.find((w: any) => w?.workOrderNumber === currNum) : undefined
        }
        if (selectedWO) {
          const from = getDateForInput(selectedWO.contractPeriodFrom) || ""
          const to = getDateForInput(selectedWO.contractPeriodTo) || ""
          previousWorkOrderNumberRef.current[idx] = currNum
          anyChanged = true
          return {
            ...wo,
            effectiveFrom: from,
            effectiveTo: to,
          }
        }
        previousWorkOrderNumberRef.current[idx] = currNum
      } else if (currNum && prevNum === undefined) {
        previousWorkOrderNumberRef.current[idx] = currNum
      }
      return wo
    })
    if (anyChanged) {
      setValue("workOrder", updated)
      onFormDataChange({
        workOrder: updated.map((wo: any) => ({
          ...wo,
          effectiveFrom: wo.effectiveFrom ? formatDateForDisplay(wo.effectiveFrom) : "",
          effectiveTo: wo.effectiveTo ? formatDateForDisplay(wo.effectiveTo) : "",
        })),
      })
    }
  }, [
    enabled,
    watchedValues.workOrder,
    isViewMode,
    getSelectedWorkOrder,
    auditStatusFormData,
    getDateForInput,
    formatDateForDisplay,
    onFormDataChange,
    setValue,
  ])

  useEffect(() => {
    if (!enabled) return
    if (currentMode !== "edit") return
    const workOrders = watchedValues.workOrder || []
    let anyChanged = false
    const updated = workOrders.map((wo: any) => {
      if (!wo?.workOrderNumber) return wo
      const selectedWO = getSelectedWorkOrder(wo.workOrderNumber)
      if (!selectedWO) return wo
      const from = getDateForInput(selectedWO.contractPeriodFrom)
      const to = getDateForInput(selectedWO.contractPeriodTo)
      const needsFrom = !wo.effectiveFrom && !!from
      const needsTo = !wo.effectiveTo && !!to
      if (needsFrom || needsTo) {
        anyChanged = true
        return {
          ...wo,
          effectiveFrom: needsFrom ? from : wo.effectiveFrom,
          effectiveTo: needsTo ? to : wo.effectiveTo,
        }
      }
      return wo
    })
    if (anyChanged) {
      setValue("workOrder", updated)
      onFormDataChange({
        workOrder: updated.map((wo: any) => ({
          ...wo,
          effectiveFrom: wo.effectiveFrom ? formatDateForDisplay(wo.effectiveFrom) : "",
          effectiveTo: wo.effectiveTo ? formatDateForDisplay(wo.effectiveTo) : "",
        })),
      })
    }
  }, [enabled, currentMode, watchedValues.workOrder, getSelectedWorkOrder, getDateForInput, formatDateForDisplay, onFormDataChange, setValue])
}
