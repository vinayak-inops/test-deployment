import { useMemo } from "react"
import type { SalaryHeadItem } from "../schemas/salary-head.schema"

export function useSalaryHeadsValidationErrors(salaryHeads: SalaryHeadItem[]) {
  return useMemo(() => {

    const hasInvalid = salaryHeads.some(
      (x) => !x.salaryHeadCode.trim() || !x.salaryHeadName.trim() || x.amount < 0 || !x.parseID,
    )
    return hasInvalid ? "Each salary head row must have code, name, and valid amount" : ""
  }, [salaryHeads])
}

