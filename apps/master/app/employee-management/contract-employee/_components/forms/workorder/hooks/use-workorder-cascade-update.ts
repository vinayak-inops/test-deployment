import { useEffect, useRef } from "react"

interface UseWorkOrderCascadeUpdateParams {
  watchedValues: any
  isViewMode: boolean
  autoUpdateEffectiveFrom: (workOrderNumber: string, effectiveTo: string, currentIndex: number) => string | null
  handleDateChange: (index: number, field: "effectiveFrom" | "effectiveTo", value: string) => void
  setValue: any
  enabled?: boolean
}

export function useWorkOrderCascadeUpdate({
  watchedValues,
  isViewMode,
  autoUpdateEffectiveFrom,
  handleDateChange,
  setValue,
  enabled = true,
}: UseWorkOrderCascadeUpdateParams) {
  const autoUpdateRef = useRef<{ [key: number]: boolean }>({})

  useEffect(() => {
    if (!enabled) return
    if (isViewMode) return

    const workOrders = watchedValues.workOrder || []
    let hasUpdates = false

    workOrders.forEach((workOrder: any, index: number) => {
      if (workOrder.effectiveTo && index < workOrders.length - 1) {
        const nextIndex = index + 1
        const nextWorkOrder = workOrders[nextIndex]

        if (nextWorkOrder) {
          const suggestedFrom = autoUpdateEffectiveFrom(nextWorkOrder.workOrderNumber || "", workOrder.effectiveTo, nextIndex)

          if (suggestedFrom && nextWorkOrder.effectiveFrom !== suggestedFrom) {
            if (!autoUpdateRef.current[nextIndex]) {
              autoUpdateRef.current[nextIndex] = true
              hasUpdates = true

              setTimeout(() => {
                setValue(`workOrder.${nextIndex}.effectiveFrom`, suggestedFrom)
                handleDateChange(nextIndex, "effectiveFrom", suggestedFrom)

                setTimeout(() => {
                  autoUpdateRef.current[nextIndex] = false
                }, 1000)
              }, 100)
            }
          }
        }
      }
    })

    Object.keys(autoUpdateRef.current).forEach((key) => {
      const index = parseInt(key)
      if (index >= workOrders.length || !workOrders[index]?.effectiveTo) {
        delete autoUpdateRef.current[index]
      }
    })

    void hasUpdates
  }, [enabled, watchedValues.workOrder, isViewMode, autoUpdateEffectiveFrom, handleDateChange, setValue])

  useEffect(() => {
    if (!enabled) return
    if (isViewMode) return

    const workOrders = watchedValues.workOrder || []

    workOrders.forEach((workOrder: any, index: number) => {
      if (workOrder.effectiveTo && index < workOrders.length - 1) {
        const nextIndex = index + 1
        const nextWorkOrder = workOrders[nextIndex]

        if (nextWorkOrder && !nextWorkOrder.effectiveFrom) {
          const suggestedFrom = autoUpdateEffectiveFrom(nextWorkOrder.workOrderNumber || "", workOrder.effectiveTo, nextIndex)
          if (suggestedFrom) {
            setTimeout(() => {
              setValue(`workOrder.${nextIndex}.effectiveFrom`, suggestedFrom)
              handleDateChange(nextIndex, "effectiveFrom", suggestedFrom)
            }, 50)
          }
        }
      }
    })
  }, [enabled, watchedValues.workOrder?.map((wo: any) => wo.effectiveTo).join(","), watchedValues.workOrder, isViewMode, autoUpdateEffectiveFrom, handleDateChange, setValue])
}
