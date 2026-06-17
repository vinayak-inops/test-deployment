"use client";

import React, { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import { toast } from "react-toastify";
import { X, AlertCircle } from "lucide-react";
import { useSession } from 'next-auth/react';
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode';
import ActionButtons from "@/components/common/action-buttons";
import EmployeeSearchField, { type Employee as EmpType } from "@/components/fields/employee-search";


export type BestEmployeeNominationItem = {
  _id?: string;
  date?: string;
  employeeID: string;
  nominationYear: string;
  tenantCode?: string;
  organizationCode?: string;
}

const schema = yup
  .object({
    date: yup.string().optional(),
    employeeID: yup.string().required("Employee is required"),
    nominationYear: yup
      .string()
      .required("Nomination year is required")
      .matches(/^\d{4}-\d{4}$/, "Format must be YYYY-YYYY")
      .test("one-year-gap", "Nomination year must span exactly one year", (val) => {
        if (!val) return false
        const [start, end] = val.split("-").map((v) => Number(v))
        if (Number.isNaN(start) || Number.isNaN(end)) return false
        return end - start === 1
      }),
    _id: yup.string().optional(),
    tenantCode: yup.string().optional(),
    organizationCode: yup.string().optional(),
  })
  .required()

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  editData?: BestEmployeeNominationItem | null;
  isEditMode?: boolean;
  isViewMode?: boolean;
  onSuccess?: (saved: BestEmployeeNominationItem) => void;
  onServerUpdate?: () => Promise<any>;
}

// months/years removed; nominationYear is derived from date

export default function BestEmployeeNominationForm({ open, setOpen, editData, isEditMode, isViewMode, onSuccess, onServerUpdate }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<BestEmployeeNominationItem>({
    resolver: yupResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      date: "",
      employeeID: "",
      nominationYear: "",
    },
  })

  const { data: session, status: sessionStatus } = useSession();
  const tenantCode = useGetTenantCode();
  const [selectedEmployee, setSelectedEmployee] = useState<EmpType | null>(null)
  const [selectedNominationYear, setSelectedNominationYear] = useState<string>("")

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => {
    const startYear = currentYear - 5 + i;
    const endYear = startYear + 1;
    return `${startYear}-${endYear}`;
  });

  // Initialize form for edit/view/add
  useEffect(() => {
    if ((isEditMode || isViewMode) && editData) {
      // Date is automatically set on submit, no need to set it here
      setValue("employeeID", editData.employeeID || "")
      if ((editData as any)?.nominationYear) {
        setValue("nominationYear", (editData as any).nominationYear)
        setSelectedNominationYear((editData as any).nominationYear)
      }
      // Set selected employee for display
      if (editData.employeeID) {
        setSelectedEmployee({
          _id: '',
          employeeID: editData.employeeID,
          firstName: '',
          lastName: ''
        })
      }
    } else if (open) {
      reset()
      setSelectedEmployee(null)
      setSelectedNominationYear("")
    }
  }, [isEditMode, isViewMode, editData, setValue, reset, open])

  const handleEmployeeSelect = (emp: EmpType) => {
    setValue("employeeID", emp.employeeID, { shouldValidate: true })
    setSelectedEmployee(emp)
  }

  const handleEmployeeClear = () => {
    setValue("employeeID", "", { shouldValidate: true })
    setSelectedEmployee(null)
  }

  const { post: postNomination, loading: postLoading } = usePostRequest<any>({
    url: "best_employee_nomination",
    onSuccess: (data) => {
      toast.success("Nomination saved successfully")
      onSuccess?.(data)
    },
    onError: (error) => {
      toast.error("Failed to save nomination")
      console.error("POST error:", error)
    },
  })

  const onSubmit: Parameters<typeof handleSubmit>[0] = async (formData) => {
    // Get current date in yyyy-mm-dd format (always use submission date)
    const currentDate = new Date().toISOString().split('T')[0];
    
    const payload: BestEmployeeNominationItem = {
      _id: isEditMode ? (editData as any)?._id : undefined,
      date: currentDate, // Always use current submission date
      employeeID: (formData as BestEmployeeNominationItem).employeeID,
      nominationYear: (formData as BestEmployeeNominationItem).nominationYear,
      tenantCode: tenantCode,
      organizationCode: tenantCode,
    }

    const postData = {
      tenant: tenantCode,
      action: "insert",
      id: (payload as any)._id || null,
      collectionName: "best_employee_nomination",
      data: {
        ...payload,
        tenantCode: tenantCode,
        organizationCode: tenantCode,
        createdBy: session?.user?.name,
        createdOn: new Date().toISOString()
      },
    }

    await postNomination(postData)
    await onServerUpdate?.()
    setOpen(false)
  }

  // Removed month/year watches; nominationYear is derived from date

  // Popup behaviors like EmployeeForm
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setOpen(false)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        setOpen(false)
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
  }, [open, setOpen])

  if (!open) return null

  // Input styles aligned with add-new-punch-form
  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <CardHeader className="shrink-0 px-6 py-3 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">Best Employee Nomination</CardTitle>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          {/* Form Content */}
          <CardContent className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Employee Search */}
              <div className="space-y-3">
                <EmployeeSearchField
                  label="Employee"
                  required
                  isOpen={open}
                  preSelectedEmployeeId={isViewMode ? watch("employeeID") : undefined}
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
                {/* Hidden input to submit selected employeeID */}
                <input type="hidden" {...register("employeeID")}/>
                {/* Display selected employee */}
                
              </div>

              {/* Nomination Year */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Nomination Year <span className="text-red-500 normal-case">*</span>
                  </Label>
                  <Select
                    value={selectedNominationYear}
                    onValueChange={(value) => {
                      setSelectedNominationYear(value)
                      setValue("nominationYear", value, { shouldValidate: true })
                    }}
                    disabled={isViewMode}
                  >
                    <SelectTrigger className={`h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition ${(errors as any).nominationYear ? "border-red-300 focus:ring-red-500 focus:border-red-500" : ""}`}>
                      <SelectValue placeholder="Select nomination year" />
                    </SelectTrigger>
                    <SelectContent className="z-[9999]">
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {/* Hidden input to submit selected nominationYear */}
                  <input type="hidden" {...register("nominationYear")}/>
                  {/* Display selected nomination year */}
                  {selectedNominationYear && (
                    <div className="text-xs text-gray-600 flex items-start gap-2 bg-gray-50 px-2.5 py-1.5 rounded-md">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                      <div>
                        <span className="font-medium text-green-700">Selected:</span> <span className="text-gray-700">{selectedNominationYear}</span>
                      </div>
                    </div>
                  )}
                  {(errors as any).nominationYear && (
                    <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <AlertCircle className="h-3 w-3" />
                      {(errors as any).nominationYear.message}
                    </div>
                  )}
                </div>
              </div>


            </form>
          </CardContent>

          {/* Footer */}
          <CardFooter className="shrink-0 px-6 py-3 border-t border-gray-200 justify-end bg-white">
            {isViewMode ? (
              <ActionButtons
                layout="end"
                secondaryLabel="Close"
                onSecondary={() => setOpen(false)}
                className="w-full"
                secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
              />
            ) : (
              <ActionButtons
                layout="end"
                secondaryLabel="Cancel"
                onSecondary={() => setOpen(false)}
                primaryLabel={isEditMode ? "Update" : "Submit"}
                onPrimary={handleSubmit(onSubmit)}
                primaryLoading={isSubmitting || postLoading}
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
