import { useCallback } from "react"

type WorkOrderLike = {
  workOrderNumber?: string
  effectiveFrom?: string
  effectiveTo?: string
}

interface UseWorkOrderStatusParams {
  workOrderData: any[]
  isWorkOrderActive: (effectiveFrom: string, effectiveTo: string) => boolean
}

export function useWorkOrderStatus({ workOrderData, isWorkOrderActive }: UseWorkOrderStatusParams) {
  const isWorkOrderExists = useCallback(
    (workOrderNumber?: string) =>
      !!workOrderNumber && !!workOrderData?.some((wo: any) => wo.workOrderNumber === workOrderNumber),
    [workOrderData]
  )

  const getStatusMeta = useCallback(
    (workOrder: WorkOrderLike) => {
      const exists = isWorkOrderExists(workOrder?.workOrderNumber)
      const hasDates = !!workOrder?.effectiveFrom && !!workOrder?.effectiveTo
      const isActive = exists && hasDates ? isWorkOrderActive(workOrder.effectiveFrom || "", workOrder.effectiveTo || "") : false

      return {
        exists,
        isActive,
        hasDates,
        label: !exists ? "Disabled" : isActive ? "Active" : "Inactive",
        containerClass: exists ? "border-gray-200 bg-gray-50" : "border-gray-300 bg-gray-100 opacity-50",
        dotClass: !exists ? "bg-gray-400" : isActive ? "bg-green-500 animate-pulse" : "bg-gray-400",
        helperText: !exists
          ? "Work Order Number not found in contractor data. All fields are disabled."
          : hasDates
          ? isActive
            ? "Currently active work order (Work Order Number, Effective From, and Effective To cannot be edited)"
            : "Inactive work order (all fields can be edited)"
          : "Set dates to determine status",
      }
    },
    [isWorkOrderExists, isWorkOrderActive]
  )

  return {
    isWorkOrderExists,
    getStatusMeta,
  }
}
