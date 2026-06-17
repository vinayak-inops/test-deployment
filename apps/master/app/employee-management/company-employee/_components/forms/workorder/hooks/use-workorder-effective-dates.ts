import { useCallback } from "react"

interface UseWorkOrderEffectiveDatesParams {
  workOrderData: any[]
  getSelectedWorkOrder: (workOrderNumber: string) => any
  getDateForInput: (dateString: string) => string | undefined
  formatDateForDisplay: (dateString: string | undefined) => string
  getMinEffectiveFromDate: (workOrderNumber: string, currentIndex: number) => string | undefined
  checkForOverlappingDates: (
    workOrderNumber: string,
    effectiveFrom: string,
    effectiveTo: string,
    currentIndex: number
  ) => string | null
}

export function useWorkOrderEffectiveDates({
  workOrderData,
  getSelectedWorkOrder,
  getDateForInput,
  formatDateForDisplay,
  getMinEffectiveFromDate,
  checkForOverlappingDates,
}: UseWorkOrderEffectiveDatesParams) {
  const isWorkOrderExists = useCallback(
    (workOrderNumber?: string) =>
      !!workOrderNumber && !!workOrderData?.some((wo: any) => wo.workOrderNumber === workOrderNumber),
    [workOrderData]
  )

  const isDateFieldDisabled = useCallback(
    (isViewMode: boolean, workOrderNumber?: string) => {
      if (isViewMode) return true
      return !isWorkOrderExists(workOrderNumber)
    },
    [isWorkOrderExists]
  )

  const getEffectiveFromMinDate = useCallback(
    (workOrderNumber: string, currentIndex: number) => {
      const selectedWO = getSelectedWorkOrder(workOrderNumber)
      if (!selectedWO) return undefined
      const minDate = getMinEffectiveFromDate(workOrderNumber, currentIndex)
      return minDate || undefined
    },
    [getSelectedWorkOrder, getMinEffectiveFromDate]
  )

  const getEffectiveFromMaxDate = useCallback(
    (workOrderNumber: string) => {
      const selectedWO = getSelectedWorkOrder(workOrderNumber)
      const contractToStr = selectedWO ? getDateForInput(selectedWO.contractPeriodTo) : null

      if (!contractToStr) return undefined

      const contractTo = new Date(contractToStr)
      if (isNaN(contractTo.getTime())) return undefined

      return contractToStr
    },
    [getSelectedWorkOrder, getDateForInput]
  )

  const getEffectiveToMinDate = useCallback(
    (workOrder: any) => {
      const selectedWO = getSelectedWorkOrder(workOrder.workOrderNumber)
      const effectiveFromDate = workOrder.effectiveFrom ? new Date(workOrder.effectiveFrom) : null
      const contractFromStr = selectedWO ? getDateForInput(selectedWO.contractPeriodFrom) : null

      if (!contractFromStr) return undefined

      const contractFrom = new Date(contractFromStr)
      if (isNaN(contractFrom.getTime())) return undefined

      if (effectiveFromDate && contractFrom) {
        return effectiveFromDate > contractFrom ? effectiveFromDate.toISOString().split("T")[0] : contractFromStr
      }

      return contractFromStr
    },
    [getSelectedWorkOrder, getDateForInput]
  )

  const getEffectiveToMaxDate = useCallback(
    (workOrderNumber: string) => {
      const selectedWO = getSelectedWorkOrder(workOrderNumber)
      const contractToStr = selectedWO ? getDateForInput(selectedWO.contractPeriodTo) : null

      if (!contractToStr) return undefined

      const contractTo = new Date(contractToStr)
      if (isNaN(contractTo.getTime())) return undefined

      return contractToStr
    },
    [getSelectedWorkOrder, getDateForInput]
  )

  const validateEffectiveFromSelection = useCallback(
    (workOrder: any, selectedDate: string, actualIndex: number) => {
      const selectedWO = getSelectedWorkOrder(workOrder.workOrderNumber)
      if (!selectedWO || !selectedDate) return null

      const contractFromStr = getDateForInput(selectedWO.contractPeriodFrom)
      const contractToStr = getDateForInput(selectedWO.contractPeriodTo)

      if (!contractFromStr || !contractToStr) {
        return "Contract period dates are missing"
      }

      const contractFrom = new Date(contractFromStr)
      const contractTo = new Date(contractToStr)
      const inputDate = new Date(selectedDate)

      if (isNaN(inputDate.getTime())) {
        return "Invalid date format"
      }

      if (inputDate < contractFrom) {
        return `Selected date ${formatDateForDisplay(selectedDate)} is before the selected Work Order's contract start date (${formatDateForDisplay(selectedWO.contractPeriodFrom)})`
      }

      const inputDateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate())
      const contractToOnly = new Date(contractTo.getFullYear(), contractTo.getMonth(), contractTo.getDate())
      if (inputDateOnly > contractToOnly) {
        return `Selected date ${formatDateForDisplay(selectedDate)} is after the selected Work Order's contract end date (${formatDateForDisplay(selectedWO.contractPeriodTo)}). Please select a date between ${formatDateForDisplay(selectedWO.contractPeriodFrom)} and ${formatDateForDisplay(selectedWO.contractPeriodTo)} (inclusive).`
      }

      const minAllowedDate = getMinEffectiveFromDate(workOrder.workOrderNumber, actualIndex)
      if (minAllowedDate && selectedDate < minAllowedDate) {
        return `Effective From cannot be before ${formatDateForDisplay(minAllowedDate)}. This date conflicts with existing work order end dates. Please ensure there is at least one day gap between work orders.`
      }

      const overlapError = checkForOverlappingDates(
        workOrder.workOrderNumber,
        selectedDate,
        workOrder.effectiveTo || "",
        actualIndex
      )
      if (overlapError) return overlapError

      return null
    },
    [getSelectedWorkOrder, getDateForInput, formatDateForDisplay, getMinEffectiveFromDate, checkForOverlappingDates]
  )

  const validateEffectiveToSelection = useCallback(
    (workOrder: any, selectedDate: string, actualIndex: number) => {
      const selectedWO = getSelectedWorkOrder(workOrder.workOrderNumber)
      if (!selectedWO || !selectedDate) return null

      const contractFromStr = getDateForInput(selectedWO.contractPeriodFrom)
      const contractToStr = getDateForInput(selectedWO.contractPeriodTo)

      if (!contractFromStr || !contractToStr) {
        return "Contract period dates are missing"
      }

      const contractFrom = new Date(contractFromStr)
      const inputDate = new Date(selectedDate)
      const effectiveFromDate = workOrder.effectiveFrom ? new Date(workOrder.effectiveFrom) : null

      if (isNaN(inputDate.getTime())) {
        return "Invalid date format"
      }

      if (inputDate < contractFrom) {
        return `Date cannot be before ${formatDateForDisplay(selectedWO.contractPeriodFrom)}`
      }

      if (effectiveFromDate) {
        const inputDateOnly = new Date(inputDate.getFullYear(), inputDate.getMonth(), inputDate.getDate())
        const effectiveFromDateOnly = new Date(
          effectiveFromDate.getFullYear(),
          effectiveFromDate.getMonth(),
          effectiveFromDate.getDate()
        )

        if (inputDateOnly < effectiveFromDateOnly) {
          return `Effective To date must be greater than or equal to Effective From date (${formatDateForDisplay(workOrder.effectiveFrom || "")})`
        }
      }

      const overlapError = checkForOverlappingDates(
        workOrder.workOrderNumber,
        workOrder.effectiveFrom || "",
        selectedDate,
        actualIndex
      )
      if (overlapError) return overlapError

      return null
    },
    [getSelectedWorkOrder, getDateForInput, formatDateForDisplay, checkForOverlappingDates]
  )

  return {
    isWorkOrderExists,
    isDateFieldDisabled,
    getEffectiveFromMinDate,
    getEffectiveFromMaxDate,
    getEffectiveToMinDate,
    getEffectiveToMaxDate,
    validateEffectiveFromSelection,
    validateEffectiveToSelection,
  }
}
