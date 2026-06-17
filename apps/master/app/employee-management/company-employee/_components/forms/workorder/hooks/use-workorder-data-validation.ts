import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from "react"

interface UseWorkOrderDataValidationParams {
  watchedValues: any
  workOrderData: any[]
  currentMode: string
  auditStatusFormData: any
  getSelectedWorkOrder: (workOrderNumber: string) => any
  getDateForInput: (dateString: string) => string | undefined
  formatDateForDisplay: (dateString: string | undefined) => string
  setWorkOrderValidationErrors: Dispatch<SetStateAction<{ [key: number]: string[] }>>
  showDateValidationError: (message: string) => void
  setValue: any
  onFormDataChange: (data: any) => void
  enabled?: boolean
}

export function useWorkOrderDataValidation({
  watchedValues,
  workOrderData,
  currentMode,
  auditStatusFormData,
  getSelectedWorkOrder,
  getDateForInput,
  formatDateForDisplay,
  setWorkOrderValidationErrors,
  showDateValidationError,
  setValue,
  onFormDataChange,
  enabled = true,
}: UseWorkOrderDataValidationParams) {
  const hasClearedForOpenRef = useRef(false)
  const hasValidatedForOpenRef = useRef(false)

  const validateExistingWorkOrders = useCallback(() => {
    if (!auditStatusFormData?.workOrder || !workOrderData) {
      showDateValidationError("⚠️ No work order data available for validation")
      return
    }

    const validationErrors: { [key: number]: string[] } = {}
    let hasErrors = false
    let summaryMessage = ""

    auditStatusFormData.workOrder.forEach((workOrder: any, actualIndex: number) => {
      if (workOrder.workOrderNumber) {
        const selectedWO = workOrderData.find((wo: any) => wo.workOrderNumber === workOrder.workOrderNumber)

        if (!selectedWO) {
          validationErrors[actualIndex] = [`❌ Work Order ${workOrder.workOrderNumber} not found in current data`]
          hasErrors = true
          summaryMessage += `\n• Work Order ${workOrder.workOrderNumber}: Not found in current data`
        } else {
          const existingFromDate = workOrder.effectiveFrom ? getDateForInput(workOrder.effectiveFrom) : ""
          const existingToDate = workOrder.effectiveTo ? getDateForInput(workOrder.effectiveTo) : ""
          const currentFromDate = getDateForInput(selectedWO.contractPeriodFrom)
          const currentToDate = getDateForInput(selectedWO.contractPeriodTo)

          const workOrderErrors: string[] = []
          let hasDateIssues = false

          if (existingFromDate && currentFromDate && currentToDate) {
            const existingFrom = new Date(existingFromDate)
            const contractFrom = new Date(currentFromDate)
            const contractTo = new Date(currentToDate)

            if (!isNaN(existingFrom.getTime()) && !isNaN(contractFrom.getTime()) && !isNaN(contractTo.getTime())) {
              if (existingFrom < contractFrom) {
                workOrderErrors.push(
                  `⚠️ Effective From (${formatDateForDisplay(workOrder.effectiveFrom)}) is before contract start (${formatDateForDisplay(selectedWO.contractPeriodFrom)})`
                )
                hasDateIssues = true
              } else if (existingFrom > contractTo) {
                workOrderErrors.push(
                  `⚠️ Effective From (${formatDateForDisplay(workOrder.effectiveFrom)}) is after contract end (${formatDateForDisplay(selectedWO.contractPeriodTo)})`
                )
                hasDateIssues = true
              }
            }
          }

          if (existingToDate && currentToDate && existingFromDate && currentFromDate) {
            const existingTo = new Date(existingToDate)
            const existingFrom = new Date(existingFromDate)
            const contractFrom = new Date(currentFromDate)
            const contractTo = new Date(currentToDate)

            if (
              !isNaN(existingTo.getTime()) &&
              !isNaN(existingFrom.getTime()) &&
              !isNaN(contractFrom.getTime()) &&
              !isNaN(contractTo.getTime())
            ) {
              const existingToOnly = new Date(existingTo.getFullYear(), existingTo.getMonth(), existingTo.getDate())
              const existingFromOnly = new Date(
                existingFrom.getFullYear(),
                existingFrom.getMonth(),
                existingFrom.getDate()
              )

              if (existingToOnly < existingFromOnly) {
                workOrderErrors.push(
                  `⚠️ Effective To (${formatDateForDisplay(workOrder.effectiveTo)}) must be greater than or equal to Effective From (${formatDateForDisplay(workOrder.effectiveFrom)})`
                )
                hasDateIssues = true
              } else if (existingTo < contractFrom) {
                workOrderErrors.push(
                  `⚠️ Effective To (${formatDateForDisplay(workOrder.effectiveTo)}) is before contract start (${formatDateForDisplay(selectedWO.contractPeriodFrom)})`
                )
                hasDateIssues = true
              }
            }
          }

          if (hasDateIssues) {
            validationErrors[actualIndex] = workOrderErrors
            hasErrors = true
            summaryMessage += `\n• Work Order ${workOrder.workOrderNumber}: Date validation issues`
          } else {
            validationErrors[actualIndex] = []
          }
        }
      }
    })

    if (hasErrors) {
      setWorkOrderValidationErrors(validationErrors)
      showDateValidationError(`⚠️ Work Order validation issues detected:${summaryMessage}`)
    } else {
      setWorkOrderValidationErrors({})
      showDateValidationError("✅ All Work Orders validated successfully! No issues found.")
    }
  }, [
    auditStatusFormData,
    workOrderData,
    getDateForInput,
    formatDateForDisplay,
    setWorkOrderValidationErrors,
    showDateValidationError,
  ])

  const clearInvalidDates = useCallback(() => {
    const updatedWorkOrders = [...(watchedValues.workOrder || [])]
    let hasChanges = false

    updatedWorkOrders.forEach((workOrder, actualIndex) => {
      if (workOrder.workOrderNumber && (workOrder.effectiveFrom || workOrder.effectiveTo)) {
        const selectedWO = getSelectedWorkOrder(workOrder.workOrderNumber)
        if (selectedWO) {
          const contractFromStr = getDateForInput(selectedWO.contractPeriodFrom)
          const contractToStr = getDateForInput(selectedWO.contractPeriodTo)

          let needsUpdate = false
          const updatedWorkOrder = { ...workOrder }

          if (!contractFromStr || !contractToStr) {
            updatedWorkOrder.effectiveFrom = ""
            updatedWorkOrder.effectiveTo = ""
            needsUpdate = true
          } else {
            const contractFrom = new Date(contractFromStr)
            const contractTo = new Date(contractToStr)

            if (isNaN(contractFrom.getTime()) || isNaN(contractTo.getTime())) {
              updatedWorkOrder.effectiveFrom = ""
              updatedWorkOrder.effectiveTo = ""
              needsUpdate = true
            } else {
              if (workOrder.effectiveFrom) {
                const fromDate = new Date(workOrder.effectiveFrom)
                if (isNaN(fromDate.getTime()) || fromDate < contractFrom) {
                  updatedWorkOrder.effectiveFrom = ""
                  needsUpdate = true
                }
              }

              if (workOrder.effectiveTo) {
                const toDate = new Date(workOrder.effectiveTo)
                if (isNaN(toDate.getTime()) || toDate < contractFrom) {
                  updatedWorkOrder.effectiveTo = ""
                  needsUpdate = true
                }
              }

              if (updatedWorkOrder.effectiveFrom && updatedWorkOrder.effectiveTo) {
                const fromDate = new Date(updatedWorkOrder.effectiveFrom)
                const toDate = new Date(updatedWorkOrder.effectiveTo)
                const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
                const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
                if (toDateOnly < fromDateOnly) {
                  updatedWorkOrder.effectiveTo = ""
                  needsUpdate = true
                }
              }
            }
          }

          if (needsUpdate) {
            updatedWorkOrders[actualIndex] = updatedWorkOrder
            hasChanges = true
            setWorkOrderValidationErrors((prev) => {
              const newErrors = { ...prev }
              delete newErrors[actualIndex]
              return newErrors
            })
          }
        }
      }
    })

    if (hasChanges) {
      setValue("workOrder", updatedWorkOrders)
      onFormDataChange({ workOrder: updatedWorkOrders })
      showDateValidationError("Invalid dates have been cleared from the form")
    }
  }, [
    watchedValues.workOrder,
    getSelectedWorkOrder,
    getDateForInput,
    setWorkOrderValidationErrors,
    setValue,
    onFormDataChange,
    showDateValidationError,
  ])

  useEffect(() => {
    if (!enabled) {
      hasClearedForOpenRef.current = false
      hasValidatedForOpenRef.current = false
      return
    }

    if (!workOrderData || workOrderData.length === 0) return

    if (!hasClearedForOpenRef.current) {
      hasClearedForOpenRef.current = true
      setTimeout(() => clearInvalidDates(), 100)
    }

    if (currentMode === "edit" && auditStatusFormData?.workOrder && !hasValidatedForOpenRef.current) {
      hasValidatedForOpenRef.current = true
      validateExistingWorkOrders()
    }
  }, [enabled, workOrderData?.length, currentMode, auditStatusFormData?.workOrder, clearInvalidDates, validateExistingWorkOrders])

  return {
    validateExistingWorkOrders,
    clearInvalidDates,
  }
}
