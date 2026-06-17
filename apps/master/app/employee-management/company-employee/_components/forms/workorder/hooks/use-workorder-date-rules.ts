import { useCallback } from "react"

interface UseWorkOrderDateRulesParams {
  watchedValues: any
  getSelectedWorkOrder: (workOrderNumber: string) => any
  getDateForInput: (dateString: string) => string | undefined
  formatDateForDisplay: (dateString: string | undefined) => string
}

export function useWorkOrderDateRules({
  watchedValues,
  getSelectedWorkOrder,
  getDateForInput,
  formatDateForDisplay,
}: UseWorkOrderDateRulesParams) {
  const isDateWithinContractPeriod = useCallback(
    (workOrderNumber: string, dateToCheck: string): boolean => {
      const selectedWO = getSelectedWorkOrder(workOrderNumber)
      if (!selectedWO || !dateToCheck) return false

      const contractFromStr = getDateForInput(selectedWO.contractPeriodFrom)
      const contractToStr = getDateForInput(selectedWO.contractPeriodTo)

      if (!contractFromStr || !contractToStr) return false

      const contractFrom = new Date(contractFromStr)
      const contractTo = new Date(contractToStr)
      const checkDate = new Date(dateToCheck)

      if (isNaN(contractFrom.getTime()) || isNaN(contractTo.getTime()) || isNaN(checkDate.getTime())) {
        return false
      }

      const checkDateOnly = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate())
      const contractFromOnly = new Date(contractFrom.getFullYear(), contractFrom.getMonth(), contractFrom.getDate())
      const contractToOnly = new Date(contractTo.getFullYear(), contractTo.getMonth(), contractTo.getDate())

      return checkDateOnly >= contractFromOnly && checkDateOnly <= contractToOnly
    },
    [getSelectedWorkOrder, getDateForInput]
  )

  const isEffectiveFromValid = useCallback((effectiveFrom: string, effectiveTo: string): boolean => {
    if (!effectiveFrom || !effectiveTo) return true

    const fromDate = new Date(effectiveFrom)
    const toDate = new Date(effectiveTo)

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return false

    const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
    const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())
    const oneDayBefore = new Date(toDateOnly)
    oneDayBefore.setDate(oneDayBefore.getDate() - 1)

    return fromDateOnly <= oneDayBefore
  }, [])

  const isWorkOrderActive = useCallback((effectiveFrom: string, effectiveTo: string): boolean => {
    if (!effectiveFrom || !effectiveTo) return false

    const today = new Date()
    const fromDate = new Date(effectiveFrom)
    const toDate = new Date(effectiveTo)

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return false

    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const fromDateOnly = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate())
    const toDateOnly = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate())

    return todayOnly >= fromDateOnly && todayOnly <= toDateOnly
  }, [])

  const getSuggestedEffectiveFromDate = useCallback(
    (workOrderNumber: string, currentIndex: number) => {
      const selectedWO = getSelectedWorkOrder(workOrderNumber)
      if (!selectedWO) return null

      const contractFromStr = getDateForInput(selectedWO.contractPeriodFrom)
      if (!contractFromStr) return null

      const contractFrom = new Date(contractFromStr)
      if (isNaN(contractFrom.getTime())) return null

      const existingWorkOrders = watchedValues.workOrder || []
      let latestEndDate = contractFrom

      for (let i = 0; i < existingWorkOrders.length; i++) {
        if (i === currentIndex) continue

        const existingWO = existingWorkOrders[i]
        if (existingWO.workOrderNumber === workOrderNumber && existingWO.effectiveTo) {
          const existingToDate = new Date(existingWO.effectiveTo)
          if (!isNaN(existingToDate.getTime()) && existingToDate > latestEndDate) {
            latestEndDate = existingToDate
          }
        }
      }

      const nextDay = new Date(latestEndDate)
      nextDay.setDate(nextDay.getDate() + 1)
      return nextDay.toISOString().split("T")[0]
    },
    [getSelectedWorkOrder, getDateForInput, watchedValues.workOrder]
  )

  const getAutoEffectiveFromDate = useCallback(
    (workOrderNumber: string, currentIndex: number) => {
      const selectedWO = getSelectedWorkOrder(workOrderNumber)
      if (!selectedWO) return null

      const contractFromStr = getDateForInput(selectedWO.contractPeriodFrom)
      if (!contractFromStr) return null

      const contractFrom = new Date(contractFromStr)
      if (isNaN(contractFrom.getTime())) return null

      const existingWorkOrders = watchedValues.workOrder || []
      let latestEndDate = contractFrom

      for (let i = 0; i < existingWorkOrders.length; i++) {
        if (i === currentIndex) continue

        const existingWO = existingWorkOrders[i]
        if (existingWO.effectiveTo) {
          const existingToDate = new Date(existingWO.effectiveTo)
          if (!isNaN(existingToDate.getTime()) && existingToDate > latestEndDate) {
            latestEndDate = existingToDate
          }
        }
      }

      const nextDay = new Date(latestEndDate)
      nextDay.setDate(nextDay.getDate() + 1)
      return nextDay.toISOString().split("T")[0]
    },
    [getSelectedWorkOrder, getDateForInput, watchedValues.workOrder]
  )

  const autoUpdateEffectiveFrom = useCallback(
    (workOrderNumber: string, effectiveTo: string, _currentIndex: number) => {
      if (!effectiveTo) return null

      const toDate = new Date(effectiveTo)
      if (isNaN(toDate.getTime())) return null

      const fromDate = new Date(toDate)
      fromDate.setDate(fromDate.getDate() + 1)

      if (workOrderNumber) {
        const selectedWO = getSelectedWorkOrder(workOrderNumber)
        if (selectedWO) {
          const contractFromStr = getDateForInput(selectedWO.contractPeriodFrom)
          const contractToStr = getDateForInput(selectedWO.contractPeriodTo)

          if (contractFromStr && contractToStr) {
            const contractFrom = new Date(contractFromStr)
            const contractTo = new Date(contractToStr)

            if (fromDate < contractFrom) {
              return contractFromStr
            }
            if (fromDate > contractTo) {
              return contractToStr
            }
          }
        }
      }

      return fromDate.toISOString().split("T")[0]
    },
    [getSelectedWorkOrder, getDateForInput]
  )

  const getMinEffectiveFromDate = useCallback(
    (workOrderNumber: string, currentIndex: number): string | undefined => {
      const selectedWO = getSelectedWorkOrder(workOrderNumber)
      if (!selectedWO) return undefined

      const contractFromStr = getDateForInput(selectedWO.contractPeriodFrom)
      if (!contractFromStr) return undefined

      const contractFrom = new Date(contractFromStr)
      if (isNaN(contractFrom.getTime())) return undefined

      const existingWorkOrders = watchedValues.workOrder || []
      let latestEndDate = contractFrom

      for (let i = 0; i < existingWorkOrders.length; i++) {
        if (i === currentIndex) continue

        const existingWO = existingWorkOrders[i]
        if (existingWO.workOrderNumber === workOrderNumber && existingWO.effectiveTo) {
          const existingToDate = new Date(existingWO.effectiveTo)
          if (!isNaN(existingToDate.getTime()) && existingToDate > latestEndDate) {
            latestEndDate = existingToDate
          }
        }
      }

      if (latestEndDate.getTime() === contractFrom.getTime()) {
        return contractFromStr
      }

      const nextDay = new Date(latestEndDate)
      nextDay.setDate(nextDay.getDate() + 1)
      return nextDay.toISOString().split("T")[0]
    },
    [getSelectedWorkOrder, getDateForInput, watchedValues.workOrder]
  )

  const checkForOverlappingDates = useCallback(
    (workOrderNumber: string, effectiveFrom: string, _effectiveTo: string, currentIndex: number) => {
      if (!effectiveFrom || !workOrderNumber) return null

      const selectedWO = getSelectedWorkOrder(workOrderNumber)
      if (!selectedWO) return null

      const contractFromStr = getDateForInput(selectedWO.contractPeriodFrom)
      const contractToStr = getDateForInput(selectedWO.contractPeriodTo)

      if (!contractFromStr || !contractToStr) {
        return "Contract period dates are missing"
      }

      const contractFrom = new Date(contractFromStr)
      const contractTo = new Date(contractToStr)
      const inputFromDate = new Date(effectiveFrom)

      if (isNaN(contractFrom.getTime()) || isNaN(contractTo.getTime()) || isNaN(inputFromDate.getTime())) {
        return "Invalid date format"
      }

      if (inputFromDate < contractFrom) {
        return `Effective From cannot be before contract start (${formatDateForDisplay(selectedWO.contractPeriodFrom)})`
      }

      const inputFromDateOnly = new Date(inputFromDate.getFullYear(), inputFromDate.getMonth(), inputFromDate.getDate())
      const contractToOnly = new Date(contractTo.getFullYear(), contractTo.getMonth(), contractTo.getDate())

      if (inputFromDateOnly > contractToOnly) {
        return `Effective From cannot be after contract end (${formatDateForDisplay(selectedWO.contractPeriodTo)}). Please select a date between ${formatDateForDisplay(selectedWO.contractPeriodFrom)} and ${formatDateForDisplay(selectedWO.contractPeriodTo)} (inclusive).`
      }

      const existingWorkOrders = watchedValues.workOrder || []
      for (let i = 0; i < existingWorkOrders.length; i++) {
        if (i === currentIndex) continue

        const existingWO = existingWorkOrders[i]
        if (existingWO.workOrderNumber === workOrderNumber && existingWO.effectiveTo) {
          const existingToDate = new Date(existingWO.effectiveTo)
          void existingToDate
        }
      }

      return null
    },
    [getSelectedWorkOrder, getDateForInput, formatDateForDisplay, watchedValues.workOrder]
  )

  return {
    isDateWithinContractPeriod,
    isEffectiveFromValid,
    isWorkOrderActive,
    getSuggestedEffectiveFromDate,
    getAutoEffectiveFromDate,
    autoUpdateEffectiveFrom,
    getMinEffectiveFromDate,
    checkForOverlappingDates,
  }
}
