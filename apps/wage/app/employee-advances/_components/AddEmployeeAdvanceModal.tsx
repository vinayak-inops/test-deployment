"use client"

import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { toast } from "react-toastify"
import { X, AlertCircle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@repo/ui/components/ui/switch"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search"

export type EmployeeAdvanceItem = {
  _id?: string
  transactionDate: string
  amount: number
  adjustmentMonth: number
  adjustmentYear: number
  isAdjusted: boolean
  isIncludedInPayroll: boolean
  description: string
  employeeID: string
  tenantCode?: string
  organizationCode?: string
}

const schema = yup.object({
  transactionDate: yup.string().required("Transaction date is required"),
  amount: yup.number().typeError("Amount must be a number").min(0).required("Amount is required"),
  adjustmentMonth: yup.number().typeError("Adjustment month must be a number").min(1).max(12).required("Adjustment month is required"),
  adjustmentYear: yup.number().typeError("Adjustment year must be a number").min(2000).required("Adjustment year is required"),
  isAdjusted: yup.boolean().required(),
  isIncludedInPayroll: yup.boolean().required(),
  description: yup.string().required("Description is required"),
  employeeID: yup.string().required("Employee is required"),
})

type Props = {
  open: boolean
  isEditMode?: boolean
  isViewMode?: boolean
  editData?: EmployeeAdvanceItem | null
  onClose: () => void
  onSuccess?: () => void
}

export default function AddEmployeeAdvanceModal({ open, isEditMode, isViewMode, editData, onClose, onSuccess }: Props) {
  const tenantCode = useGetTenantCode()
  const { register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm<EmployeeAdvanceItem>({
    resolver: yupResolver(schema),
    defaultValues: {
      transactionDate: "",
      amount: 0,
      adjustmentMonth: 1,
      adjustmentYear: new Date().getFullYear(),
      isAdjusted: false,
      isIncludedInPayroll: true,
      description: "",
      employeeID: "",
    },
  })
  const [selectedEmployee, setSelectedEmployee] = useState<EmpType | null>(null)

  useEffect(() => {
    if (!open) return
    if (editData) {
      reset({
        _id: editData._id,
        transactionDate: editData.transactionDate || "",
        amount: Number(editData.amount ?? 0),
        adjustmentMonth: Number(editData.adjustmentMonth ?? 1),
        adjustmentYear: Number(editData.adjustmentYear ?? new Date().getFullYear()),
        isAdjusted: !!editData.isAdjusted,
        isIncludedInPayroll: !!editData.isIncludedInPayroll,
        description: editData.description || "",
        employeeID: editData.employeeID || "",
      })
      setSelectedEmployee(editData.employeeID ? { _id: "", employeeID: editData.employeeID, firstName: "", lastName: "" } : null)
    } else {
      reset({
        transactionDate: "",
        amount: 0,
        adjustmentMonth: 1,
        adjustmentYear: new Date().getFullYear(),
        isAdjusted: false,
        isIncludedInPayroll: true,
        description: "",
        employeeID: "",
      })
      setSelectedEmployee(null)
    }
  }, [open, editData, reset])

  const handleEmployeeSelect = (emp: EmpType) => {
    setValue("employeeID", emp.employeeID, { shouldValidate: true })
    setSelectedEmployee(emp)
  }

  const handleEmployeeClear = () => {
    setValue("employeeID", "", { shouldValidate: true })
    setSelectedEmployee(null)
  }

  const { post, loading } = usePostRequest<any>({
    url: "employee_advances",
    onSuccess: () => toast.success(`Advance ${isEditMode ? "updated" : "saved"} successfully`),
    onError: () => toast.error(`Failed to ${isEditMode ? "update" : "save"} advance`),
  })

  const onSubmit = async (values: EmployeeAdvanceItem) => {
    const payload: EmployeeAdvanceItem = {
      ...values,
      _id: isEditMode ? editData?._id : undefined,
      tenantCode,
      organizationCode: tenantCode,
    }
    await post({
      tenant: tenantCode,
      action: "insert",
      id: payload._id || null,
      collectionName: "employee_advances",
      data: payload,
    })
    onSuccess?.()
    onClose()
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose()
      }
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [open, onClose])

  if (!open) return null

  const fieldClassName = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <CardHeader className="shrink-0 px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700">
              {isViewMode ? "View" : isEditMode ? "Edit" : "Add"} Employee Advance
            </CardTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              aria-label="Close popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Employee Search */}
            <div className="space-y-3">
              <div className={isEditMode || isViewMode ? "[&_button[title='Clear selection']]:hidden" : ""}>
                <EmployeeSearchField
                  label="Employee"
                  required
                  isOpen={open}
                  preSelectedEmployeeId={isEditMode || isViewMode ? watch("employeeID") : undefined}
                  errorText={errors.employeeID?.message}
                  onSelect={handleEmployeeSelect}
                  onClear={handleEmployeeClear}
                            // OR if you want to keep the individual props approach:
              subsidiaries={undefined}
              divisions={undefined}
              departments={undefined}
              locations={undefined}
              contractors={undefined}
                />
              </div>
              <input type="hidden" {...register("employeeID")} />
             
              
              {/* {errors.employeeID && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.employeeID.message}
                </div>
              )} */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Transaction Date */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Transaction Date <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  type="date" 
                  {...register("transactionDate")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                />
                {errors.transactionDate && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.transactionDate.message}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Amount <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  {...register("amount")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder="0.00"
                />
                {errors.amount && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.amount.message}
                  </div>
                )}
              </div>

              {/* Adjustment Month */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Adjustment Month <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  type="number" 
                  {...register("adjustmentMonth")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder="1 (January) - 12 (December)"
                />
                {errors.adjustmentMonth && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.adjustmentMonth.message}
                  </div>
                )}
              </div>

              {/* Adjustment Year */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Adjustment Year <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  type="number" 
                  {...register("adjustmentYear")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder={`e.g., ${new Date().getFullYear()}`}
                />
                {errors.adjustmentYear && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.adjustmentYear.message}
                  </div>
                )}
              </div>

              {/* Description - Full Width */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Description <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  {...register("description")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder="Enter advance description/reason"
                />
                {errors.description && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.description.message}
                  </div>
                )}
              </div>
            </div>

            {/* Switches */}
            <div className="space-y-4 border-t border-gray-100 pt-4">
              {/* Is Adjusted */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-gray-700">Is Adjusted</Label>
                  <p className="text-xs text-gray-500">Mark if this advance has been adjusted in the system</p>
                </div>
                <Switch 
                  disabled={isViewMode} 
                  checked={!!watch("isAdjusted")} 
                  onCheckedChange={(v) => setValue("isAdjusted", v)} 
                />
              </div>

              {/* Included In Payroll */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-gray-700">Included In Payroll</Label>
                  <p className="text-xs text-gray-500">Include this advance in payroll processing calculations</p>
                </div>
                <Switch 
                  disabled={isViewMode} 
                  checked={!!watch("isIncludedInPayroll")} 
                  onCheckedChange={(v) => setValue("isIncludedInPayroll", v)} 
                />
              </div>
            </div>
          </form>
        </CardContent>

        <CardFooter className="shrink-0 px-6 py-3 border-t border-gray-200 justify-end bg-white">
          {isViewMode ? (
            <ActionButtons
              layout="end"
              secondaryLabel="Close"
              onSecondary={onClose}
              className="w-full"
              secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
            />
          ) : (
            <ActionButtons
              layout="end"
              secondaryLabel="Cancel"
              onSecondary={onClose}
              primaryLabel={isEditMode ? "Update" : "Submit"}
              onPrimary={handleSubmit(onSubmit)}
              primaryLoading={isSubmitting || loading}
              className="w-full"
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
            />
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
