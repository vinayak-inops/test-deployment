"use client"

import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { toast } from "react-toastify"
import { X, AlertCircle } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search"
import { useState } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type EWAAllowedWithdrawalItem = {
  _id?: string
  employeeID: string
  limit: number
  withdrawn: number
  available: number
  version?: number
  tenantCode?: string
  organizationCode?: string
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = yup.object({
  employeeID: yup.string().required("Employee ID is required"),
  limit: yup
    .number()
    .typeError("Limit must be a number")
    .min(0, "Limit must be at least 0")
    .required("Limit is required"),
  withdrawn: yup
    .number()
    .typeError("Withdrawn must be a number")
    .min(0, "Withdrawn must be at least 0")
    .required("Withdrawn is required"),
  available: yup
    .number()
    .typeError("Available must be a number")
    .min(0, "Available must be at least 0")
    .required("Available is required"),
})

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean
  isEditMode?: boolean
  isViewMode?: boolean
  editData?: EWAAllowedWithdrawalItem | null
  onClose: () => void
  onSuccess?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddEWAAllowedWithdrawalModal({
  open,
  isEditMode,
  isViewMode,
  editData,
  onClose,
  onSuccess,
}: Props) {
  const tenantCode = useGetTenantCode()
  const [selectedEmployee, setSelectedEmployee] = useState<EmpType | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EWAAllowedWithdrawalItem>({
    resolver: yupResolver(schema),
    defaultValues: {
      employeeID: "",
      limit: 0,
      withdrawn: 0,
      available: 0,
    },
  })

  // ── Populate form on open ──────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return
    if (editData) {
      reset({
        _id: editData._id,
        employeeID: editData.employeeID || "",
        limit: Number(editData.limit ?? 0),
        withdrawn: Number(editData.withdrawn ?? 0),
        available: Number(editData.available ?? 0),
      })
      if (editData.employeeID) {
        setSelectedEmployee({ _id: "", employeeID: editData.employeeID, firstName: "", lastName: "" })
      } else {
        setSelectedEmployee(null)
      }
    } else {
      reset({ employeeID: "", limit: 0, withdrawn: 0, available: 0 })
      setSelectedEmployee(null)
    }
  }, [open, editData, reset])

  // ── Employee handlers ──────────────────────────────────────────────────────

  const handleEmployeeSelect = (emp: EmpType) => {
    setValue("employeeID", emp.employeeID, { shouldValidate: true })
    setSelectedEmployee(emp)
  }

  const handleEmployeeClear = () => {
    setValue("employeeID", "", { shouldValidate: true })
    setSelectedEmployee(null)
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const { post, loading } = usePostRequest<any>({
    url: "EWA_allowed_withdrawl",
    onSuccess: () => toast.success(`Record ${isEditMode ? "updated" : "saved"} successfully`),
    onError: () => toast.error(`Failed to ${isEditMode ? "update" : "save"} record`),
  })

  const onSubmit = async (values: EWAAllowedWithdrawalItem) => {
    const payload = {
      ...values,
      _id: isEditMode ? editData?._id : undefined,
      version: 2,
      tenantCode,
      organizationCode: tenantCode,
    }
    await post({
      tenant: tenantCode,
      action: "insert",
      id: payload._id || null,
      collectionName: "EWA_allowed_withdrawl",
      data: payload,
    })
    onSuccess?.()
    onClose()
  }

  // ── Keyboard / backdrop ────────────────────────────────────────────────────

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose()
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <CardHeader className="shrink-0 px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700">
              {isViewMode ? "View" : isEditMode ? "Edit" : "Add"} EWA Allowed Withdrawal
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

        {/* Body */}
        <CardContent className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Employee Search */}
            <div className="space-y-1">
              <EmployeeSearchField
                key={
                  isEditMode || isViewMode
                    ? `readonly-${watch("employeeID")}`
                    : `edit-${open ? "open" : "close"}`
                }
                label="Employee"
                required
                isOpen={open}
                preSelectedEmployeeId={
                  isEditMode || isViewMode ? watch("employeeID") : undefined
                }
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

            {/* Limit */}
            <div className="space-y-1.5">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Limit <span className="text-red-500 normal-case">*</span>
              </Label>
              <Input
                type="number"
                step="1"
                {...register("limit")}
                disabled={isViewMode}
                className="h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter withdrawal limit"
              />
              {errors.limit && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.limit.message}
                </div>
              )}
            </div>

            {/* Withdrawn */}
            <div className="space-y-1.5">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Withdrawn <span className="text-red-500 normal-case">*</span>
              </Label>
              <Input
                type="number"
                step="1"
                {...register("withdrawn")}
                disabled={isViewMode}
                className="h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter withdrawn amount"
              />
              {errors.withdrawn && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.withdrawn.message}
                </div>
              )}
            </div>

            {/* Available */}
            <div className="space-y-1.5">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Available <span className="text-red-500 normal-case">*</span>
              </Label>
              <Input
                type="number"
                step="1"
                {...register("available")}
                disabled={isViewMode}
                className="h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter available amount"
              />
              {errors.available && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.available.message}
                </div>
              )}
            </div>

          </form>
        </CardContent>

        {/* Footer */}
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
