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
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search"
import SingleSelectField, { type SingleSelectOption } from "@/components/fields/single-select-field"

export type EWAEmployeeSettingItem = {
  _id?: string
  employeeID: string
  categoryCode: string
  isBlacklisted: boolean
  isActive: boolean
  allowedPercentage: number
  grossSalary: number
  tenantCode?: string
  organizationCode?: string
}

const schema = yup.object({
  employeeID: yup.string().required("Employee ID is required"),
  categoryCode: yup.string().required("Category code is required"),
  isBlacklisted: yup.boolean().required(),
  isActive: yup.boolean().required(),
  allowedPercentage: yup.number().typeError("Allowed percentage must be a number").min(0).max(100).required("Allowed percentage is required"),
  grossSalary: yup.number().typeError("Gross salary must be a number").min(0).required("Gross salary is required"),
})

type Props = {
  open: boolean
  isEditMode?: boolean
  isViewMode?: boolean
  editData?: EWAEmployeeSettingItem | null
  onClose: () => void
  onSuccess?: () => void
}

export default function AddEWAEmployeeSettingModal({ open, isEditMode, isViewMode, editData, onClose, onSuccess }: Props) {
  const tenantCode = useGetTenantCode()
  const { register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm<EWAEmployeeSettingItem>({
    resolver: yupResolver(schema),
    defaultValues: { employeeID: "", categoryCode: "", isBlacklisted: false, isActive: true, allowedPercentage: 0, grossSalary: 0 },
  })
  const [selectedEmployee, setSelectedEmployee] = useState<EmpType | null>(null)
  const [categoryOptions, setCategoryOptions] = useState<SingleSelectOption[]>([])
  const watchedCategoryCode = watch("categoryCode")

  useRequest<any[]>({
    url: "EWA_withdrawal_category/search",
    method: "POST",
    data: [{ field: "tenantCode", operator: "eq", value: tenantCode || "" }],
    dependencies: [tenantCode],
    onSuccess: (data) => {
      const options = (Array.isArray(data) ? data : [])
        .filter((item) => item?.categoryCode)
        .map((item) => ({
          value: String(item.categoryCode),
          label: String(item.categoryTitle || item.categoryCode),
        }))
      setCategoryOptions(options)
    },
    onError: () => {
      setCategoryOptions([])
    },
  })

  useEffect(() => {
    if (!open) return
    if (editData) {
      reset({
        _id: editData._id,
        employeeID: editData.employeeID || "",
        categoryCode: editData.categoryCode || "",
        isBlacklisted: !!editData.isBlacklisted,
        isActive: !!editData.isActive,
        allowedPercentage: Number(editData.allowedPercentage ?? 0),
        grossSalary: Number(editData.grossSalary ?? 0),
      })
      if (editData.employeeID) {
        setSelectedEmployee({ _id: "", employeeID: editData.employeeID, firstName: "", lastName: "" })
      } else {
        setSelectedEmployee(null)
      }
    } else {
      reset({ employeeID: "", categoryCode: "", isBlacklisted: false, isActive: true, allowedPercentage: 0, grossSalary: 0 })
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

  const handleBlacklistedChange = (isBlacklisted: boolean) => {
    setValue("isBlacklisted", isBlacklisted, { shouldDirty: true, shouldValidate: true })
    if (!isBlacklisted) {
      setValue("isActive", false, { shouldDirty: true, shouldValidate: true })
    }
  }

  const { post, loading } = usePostRequest<any>({
    url: "EWA_employee_settings",
    onSuccess: () => toast.success(`Setting ${isEditMode ? "updated" : "saved"} successfully`),
    onError: () => toast.error(`Failed to ${isEditMode ? "update" : "save"} setting`),
  })

  const onSubmit = async (values: EWAEmployeeSettingItem) => {
    const payload = {
      ...values,
      _id: isEditMode ? editData?._id : undefined,
      tenantCode,
      organizationCode: tenantCode,
    }
    await post({
      tenant: tenantCode,
      action: "insert",
      id: payload._id || null,
      collectionName: "EWA_employee_settings",
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

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <CardHeader className="shrink-0 px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700">
              {isViewMode ? "View" : isEditMode ? "Edit" : "Add"} EWA Employee Setting
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

        <CardContent className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
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
              
              
              {errors.employeeID && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.employeeID.message}
                </div>
              )}
            </div>

            {/* Category Code */}
            <div className="space-y-1.5">
              <SingleSelectField
                id="categoryCode"
                label="Category Code"
                required
                value={watchedCategoryCode || ""}
                onChange={(v) => setValue("categoryCode", v, { shouldValidate: true, shouldDirty: true })}
                options={
                  watchedCategoryCode && !categoryOptions.some((o) => o.value === watchedCategoryCode)
                    ? [{ value: watchedCategoryCode, label: watchedCategoryCode }, ...categoryOptions]
                    : categoryOptions
                }
                placeholder="Select category"
                disabled={isViewMode}
                errorMessage={errors.categoryCode?.message}
                allowOnlyProvidedOptions={false}
              />
            </div>

            {/* Allowed Percentage */}
            <div className="space-y-1.5">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Allowed Percentage <span className="text-red-500 normal-case">*</span>
              </Label>
              <Input 
                type="number" 
                step="0.1" 
                {...register("allowedPercentage")} 
                disabled={isViewMode}
                className="h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter allowed percentage (0-100)"
              />
              {errors.allowedPercentage && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.allowedPercentage.message}
                </div>
              )}
            </div>

            {/* Gross Salary */}
            <div className="space-y-1.5">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Gross Salary <span className="text-red-500 normal-case">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                {...register("grossSalary")}
                disabled={isViewMode}
                className="h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter gross salary"
              />
              {errors.grossSalary && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.grossSalary.message}
                </div>
              )}
            </div>

            {/* Blacklisted Switch */}
            <div className="flex items-center justify-between py-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-gray-700">Blacklisted</Label>
                <p className="text-xs text-gray-500">Mark employee as blacklisted for EWA</p>
              </div>
              <Switch 
                disabled={isViewMode} 
                checked={!!watch("isBlacklisted")} 
                onCheckedChange={handleBlacklistedChange} 
              />
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between py-2 pt-0">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-gray-700">Active</Label>
                <p className="text-xs text-gray-500">Enable or disable this setting</p>
              </div>
              <Switch 
                disabled={isViewMode} 
                checked={!!watch("isActive")} 
                onCheckedChange={(v) => setValue("isActive", v)} 
              />
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
