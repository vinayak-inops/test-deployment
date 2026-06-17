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

export type EmployeePenaltyItem = {
  _id?: string
  employeeID: string
  dateOfOffence: string
  actionTaken: string
  adjustmentMonth: number
  adjustmentYear: number
  isCauseShownAgainstFine: boolean
  fineImposed: number
  witnessEmployeeID: string
  witnessName: string
  fineRealisedDate: string
  isAdjusted: boolean
  isIncludedInPayroll: boolean
  offenceDescription: string
  tenantCode?: string
  organizationCode?: string
}

const schema = yup.object({
  employeeID: yup.string().required("Employee is required"),
  dateOfOffence: yup.string().required("Date of offence is required"),
  actionTaken: yup.string().required("Action taken is required"),
  adjustmentMonth: yup.number().typeError("Adjustment month must be a number").min(1).max(12).required("Adjustment month is required"),
  adjustmentYear: yup.number().typeError("Adjustment year must be a number").min(2000).required("Adjustment year is required"),
  isCauseShownAgainstFine: yup.boolean().required(),
  fineImposed: yup.number().typeError("Fine imposed must be a number").min(0).required("Fine imposed is required"),
  witnessEmployeeID: yup.string().required("Witness employee ID is required"),
  witnessName: yup.string().required("Witness name is required"),
  fineRealisedDate: yup.string().required("Fine realised date is required"),
  isAdjusted: yup.boolean().required(),
  isIncludedInPayroll: yup.boolean().required(),
  offenceDescription: yup.string().required("Offence description is required"),
})

type Props = {
  open: boolean
  isEditMode?: boolean
  isViewMode?: boolean
  editData?: EmployeePenaltyItem | null
  onClose: () => void
  onSuccess?: () => void
}

export default function AddEmployeePenaltyModal({ open, isEditMode, isViewMode, editData, onClose, onSuccess }: Props) {
  const tenantCode = useGetTenantCode()
  const { register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm<EmployeePenaltyItem>({
    resolver: yupResolver(schema),
    defaultValues: {
      employeeID: "",
      dateOfOffence: "",
      actionTaken: "",
      adjustmentMonth: 1,
      adjustmentYear: new Date().getFullYear(),
      isCauseShownAgainstFine: false,
      fineImposed: 0,
      witnessEmployeeID: "",
      witnessName: "",
      fineRealisedDate: "",
      isAdjusted: false,
      isIncludedInPayroll: true,
      offenceDescription: "",
    },
  })
  const [selectedEmployee, setSelectedEmployee] = useState<EmpType | null>(null)

  useEffect(() => {
    if (!open) return
    const emptyDefaults: EmployeePenaltyItem = {
      employeeID: "",
      dateOfOffence: "",
      actionTaken: "",
      adjustmentMonth: 1,
      adjustmentYear: new Date().getFullYear(),
      isCauseShownAgainstFine: false,
      fineImposed: 0,
      witnessEmployeeID: "",
      witnessName: "",
      fineRealisedDate: "",
      isAdjusted: false,
      isIncludedInPayroll: true,
      offenceDescription: "",
    }
    if (editData) {
      reset({
        _id: editData._id,
        employeeID: editData.employeeID || "",
        dateOfOffence: editData.dateOfOffence || "",
        actionTaken: editData.actionTaken || "",
        adjustmentMonth: Number(editData.adjustmentMonth ?? 1),
        adjustmentYear: Number(editData.adjustmentYear ?? new Date().getFullYear()),
        isCauseShownAgainstFine: !!editData.isCauseShownAgainstFine,
        fineImposed: Number(editData.fineImposed ?? 0),
        witnessEmployeeID: editData.witnessEmployeeID || "",
        witnessName: editData.witnessName || "",
        fineRealisedDate: editData.fineRealisedDate || "",
        isAdjusted: !!editData.isAdjusted,
        isIncludedInPayroll: !!editData.isIncludedInPayroll,
        offenceDescription: editData.offenceDescription || "",
      })
      setSelectedEmployee(editData.employeeID ? { _id: "", employeeID: editData.employeeID, firstName: "", lastName: "" } : null)
    } else {
      reset(emptyDefaults)
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
    url: "employee_penalties",
    onSuccess: () => toast.success(`Penalty ${isEditMode ? "updated" : "saved"} successfully`),
    onError: () => toast.error(`Failed to ${isEditMode ? "update" : "save"} penalty`),
  })

  const onSubmit = async (values: EmployeePenaltyItem) => {
    const payload: EmployeePenaltyItem = {
      ...values,
      _id: isEditMode ? editData?._id : undefined,
      tenantCode,
      organizationCode: tenantCode,
    }
    await post({
      tenant: tenantCode,
      action: "insert",
      id: payload._id || null,
      collectionName: "employee_penalties",
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
      <Card className="w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <CardHeader className="shrink-0 px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700">
              {isViewMode ? "View" : isEditMode ? "Edit" : "Add"} Employee Penalty
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
              <EmployeeSearchField
                key={(isEditMode || isViewMode) ? `readonly-${watch("employeeID")}` : `edit-${open ? "open" : "close"}`}
                label="Employee"
                required
                isOpen={open}
                preSelectedEmployeeId={(isEditMode || isViewMode) ? watch("employeeID") : undefined}
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
              <input type="hidden" {...register("employeeID")} />
              
              
              {/* {errors.employeeID && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.employeeID.message}
                </div>
              )} */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Date of Offence */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Date of Offence <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  type="date" 
                  {...register("dateOfOffence")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                />
                {errors.dateOfOffence && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.dateOfOffence.message}
                  </div>
                )}
              </div>

              {/* Action Taken */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Action Taken <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  {...register("actionTaken")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder="Enter action taken"
                />
                {errors.actionTaken && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.actionTaken.message}
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
                  placeholder="1-12"
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
                  placeholder="Enter year"
                />
                {errors.adjustmentYear && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.adjustmentYear.message}
                  </div>
                )}
              </div>

              {/* Fine Imposed */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Fine Imposed <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  {...register("fineImposed")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder="Enter fine amount"
                />
                {errors.fineImposed && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.fineImposed.message}
                  </div>
                )}
              </div>

              {/* Fine Realised Date */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Fine Realised Date <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  type="date" 
                  {...register("fineRealisedDate")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                />
                {errors.fineRealisedDate && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.fineRealisedDate.message}
                  </div>
                )}
              </div>

              {/* Witness Employee ID */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Witness Employee ID <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  {...register("witnessEmployeeID")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder="Enter witness employee ID"
                />
                {errors.witnessEmployeeID && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.witnessEmployeeID.message}
                  </div>
                )}
              </div>

              {/* Witness Name */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Witness Name <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  {...register("witnessName")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder="Enter witness name"
                />
                {errors.witnessName && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.witnessName.message}
                  </div>
                )}
              </div>

              {/* Offence Description - Full Width */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Offence Description <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  {...register("offenceDescription")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder="Describe the offence"
                />
                {errors.offenceDescription && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.offenceDescription.message}
                  </div>
                )}
              </div>
            </div>

            {/* Switches */}
            <div className="space-y-4 border-t border-gray-100 pt-4">
              {/* Cause Shown Against Fine */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-gray-700">Cause Shown Against Fine</Label>
                  <p className="text-xs text-gray-500">Whether cause was shown against the fine imposed</p>
                </div>
                <Switch 
                  disabled={isViewMode} 
                  checked={!!watch("isCauseShownAgainstFine")} 
                  onCheckedChange={(v) => setValue("isCauseShownAgainstFine", v)} 
                />
              </div>

              {/* Is Adjusted */}
              <div className="flex items-center justify-between py-2">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium text-gray-700">Is Adjusted</Label>
                  <p className="text-xs text-gray-500">Mark if this penalty has been adjusted</p>
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
                  <p className="text-xs text-gray-500">Include this penalty in payroll processing</p>
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
