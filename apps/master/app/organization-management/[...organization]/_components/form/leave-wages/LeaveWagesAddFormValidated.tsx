"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calculator, Award, Check, ChevronsUpDown, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { Button } from "@repo/ui/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/ui/components/ui/popover"
import { cn } from "@repo/ui/utils/shadcnui/cn"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { createLeaveWagesSchema } from "./leave-wages-form-schema"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"

interface LeaveWagesFormData {
  skillLevel?: string
  basicWage: number
  VDA: number
  total: number
  EPF: number
  ESI: number
  pfAdminCharges: number
  includeEPF: boolean
  includeESI: boolean
  includePFAdmin: boolean
}

interface LeaveWagesFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type LeaveWagesFormField = "skillLevel" | "basicWage" | "VDA" | "total" | "EPF" | "ESI" | "pfAdminCharges"

const INPUT_CLASS = "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"

export default function LeaveWagesFormModal({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue
}: LeaveWagesFormModalProps) {
  const tenantCode = useGetTenantCode()
  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const { arrayData: skillLevelsArray } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "skillLevels",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>("")
  const [skillLevelDropdownOpen, setSkillLevelDropdownOpen] = useState(false)
  const [skillLevelSearchValue, setSkillLevelSearchValue] = useState("")

  const skillLevelOptions = (skillLevelsArray || []).map((level: any) => ({
    label: level.skilledLevelTitle,
    value: level.skilledLevelTitle,
    description: level.skilledLevelDescription
  }))

  const filteredSkillLevelOptions = skillLevelOptions.filter((option: any) =>
    option.label.toLowerCase().includes(skillLevelSearchValue.toLowerCase())
  )

  const schema = useMemo(
    () => createLeaveWagesSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
  } = useForm<LeaveWagesFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      skillLevel: "",
      basicWage: 0,
      VDA: 0,
      total: 0,
      EPF: 0,
      ESI: 0,
      pfAdminCharges: 0,
      includeEPF: true,
      includeESI: true,
      includePFAdmin: true,
    },
  })

  const basicWage = watch("basicWage") || 0
  const VDA = watch("VDA") || 0
  const includeEPF = watch("includeEPF")
  const includeESI = watch("includeESI")
  const includePFAdmin = watch("includePFAdmin")

  useEffect(() => {
    const total = basicWage + VDA
    setValue("total", total)

    if (includeEPF) {
      const epfAmount = total * 0.12
      setValue("EPF", Math.round(epfAmount * 100) / 100)
    } else {
      setValue("EPF", 0)
    }

    if (includeESI) {
      const esiAmount = total * 0.0325
      setValue("ESI", Math.round(esiAmount * 100) / 100)
    } else {
      setValue("ESI", 0)
    }

    if (includePFAdmin) {
      const pfAdminAmount = total * 0.01
      setValue("pfAdminCharges", Math.round(pfAdminAmount * 100) / 100)
    } else {
      setValue("pfAdminCharges", 0)
    }
  }, [basicWage, VDA, includeEPF, includeESI, includePFAdmin, setValue])

  useEffect(() => {
    if (!deleteValue) return
    const targetSkillLevel = deleteValue.skillLeavel?.skilledLevelTitle || deleteValue.skillLevel
    if (!targetSkillLevel) return
    handleDeleteItem(targetSkillLevel)
  }, [deleteValue])

  const handleDeleteItem = async (skillLevel: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          leaveWages: [{ skillLeavel: { skilledLevelTitle: skillLevel } }],
        },
      }
      // postLeaveWages(postData)
    } catch (error) {
      console.error("Error deleting leave wages:", error)
    }
  }

  useEffect(() => {
    if (isEditMode && editData) {
      const skillLevel = editData.skillLeavel?.skilledLevelTitle || editData.skillLevel || ""
      const basicWageValue = editData.basicWage || 0
      const vdaValue = editData.VDA || 0
      const totalValue = editData.total || 0
      const epfValue = editData.EPF || 0
      const esiValue = editData.ESI || 0
      const pfAdminValue = editData.pfAdminCharges || 0

      setValue("skillLevel", skillLevel)
      setValue("basicWage", basicWageValue)
      setValue("VDA", vdaValue)
      setValue("total", totalValue)
      setValue("EPF", epfValue)
      setValue("ESI", esiValue)
      setValue("pfAdminCharges", pfAdminValue)
      setSelectedSkillLevel(skillLevel)
      setValue("includeEPF", epfValue > 0)
      setValue("includeESI", esiValue > 0)
      setValue("includePFAdmin", pfAdminValue > 0)
    } else if (open && !isEditMode) {
      reset()
      setSelectedSkillLevel("")
    }
  }, [isEditMode, editData, setValue, reset, open])

  const { post: postLeaveWages, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return

          let normalizedField: LeaveWagesFormField | null = null
          if (fieldName.includes("skilledLevelTitle") || fieldName.includes("skillLevel")) normalizedField = "skillLevel"
          if (fieldName.includes("basicWage")) normalizedField = "basicWage"
          if (fieldName.includes("VDA")) normalizedField = "VDA"
          if (fieldName.includes("total")) normalizedField = "total"
          if (fieldName.includes("EPF")) normalizedField = "EPF"
          if (fieldName.includes("ESI")) normalizedField = "ESI"
          if (fieldName.includes("pfAdminCharges")) normalizedField = "pfAdminCharges"
          if (!normalizedField) return

          setError(normalizedField, { type: "server", message })
        })
        return
      }

      toast.success("Leave wages submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setSelectedSkillLevel("")
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Leave wages submission failed!")
      console.error("POST error:", error)
    },
  })

  const handleFormSubmit = async (data: LeaveWagesFormData) => {
    try {
      clearErrors()
      const transformedData = {
        skillLeavel: {
          skilledLevelTitle: data.skillLevel,
          skilledLevelDescription: skillLevelOptions.find((opt: { value: string; description: string }) => opt.value === data.skillLevel)?.description || ""
        },
        basicWage: data.basicWage,
        VDA: data.VDA,
        total: data.total || 0,
        EPF: data.EPF || 0,
        ESI: data.ESI || 0,
        pfAdminCharges: data.pfAdminCharges || 0
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "leaveWageValidator",
        data: {
          leaveWages: [transformedData],
        },
      }

      postLeaveWages(postData)
    } catch (error) {
      console.error("Error processing leave wages:", error)
    }
  }

  const handleSkillLevelSelect = (skillLevel: string) => {
    setSelectedSkillLevel(skillLevel)
    setValue("skillLevel", skillLevel)
    setSkillLevelSearchValue("")
    setSkillLevelDropdownOpen(false)
  }

  const handleCancel = () => {
    reset()
    setSelectedSkillLevel("")
    setOpen(false)
  }

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<LeaveWagesFormData>)} className="w-full h-full flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Calculator className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {isEditMode ? "Edit Leave Wages" : "Add New Leave Wages"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {isEditMode ? "Update leave wages information." : "Create a new leave wages entry with detailed calculations."}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
            <div className="space-y-3">

              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Skill Level <span className="text-red-500">*</span>
                </label>
                {skillLevelOptions.length === 0 ? (
                  <div className="w-full px-3 py-2 rounded-md border border-red-300 bg-red-50 text-sm text-red-600">
                    No skill levels available. Please add skill levels first.
                  </div>
                ) : (
                  <Popover open={skillLevelDropdownOpen} onOpenChange={setSkillLevelDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={skillLevelDropdownOpen}
                        className="w-full justify-between bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
                        disabled={isEditMode}
                      >
                        {selectedSkillLevel || "Select Skill Level"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white">
                      <Command>
                        <CommandInput
                          placeholder="Search skill levels..."
                          value={skillLevelSearchValue}
                          onValueChange={setSkillLevelSearchValue}
                        />
                        <CommandList>
                          <CommandEmpty>No skill levels found.</CommandEmpty>
                          <CommandGroup className="h-[150px] overflow-y-auto">
                            {filteredSkillLevelOptions.map((option: any) => (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => handleSkillLevelSelect(option.value)}
                                className={cn(
                                  "flex items-center justify-between",
                                  selectedSkillLevel === option.value && "bg-accent"
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <Award className="h-4 w-4" />
                                  <div>
                                    <span>{option.label}</span>
                                    {option.description && (
                                      <p className="text-xs text-gray-500">{option.description}</p>
                                    )}
                                  </div>
                                </div>
                                {selectedSkillLevel === option.value && (
                                  <Check className="h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
                {errors.skillLevel && (
                  <p className="text-xs text-red-500">{errors.skillLevel.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Basic Wage (Rs.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("basicWage", { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className={`${INPUT_CLASS} ${errors.basicWage ? "border-red-500" : ""}`}
                  />
                  {errors.basicWage && (
                    <p className="text-xs text-red-500">{errors.basicWage.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    VDA (Rs.) <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("VDA", { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className={`${INPUT_CLASS} ${errors.VDA ? "border-red-500" : ""}`}
                  />
                  {errors.VDA && (
                    <p className="text-xs text-red-500">{errors.VDA.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Calculations</h4>
                <p className="text-xs text-gray-500 mt-0.5">Review totals and enabled deductions.</p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Total (Basic Wage + VDA)</span>
                  <span className="text-lg font-bold text-blue-900">Rs. {watch("total")?.toFixed(2) || "0.00"}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900">Deductions & Charges</h4>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <input
                      {...register("includeEPF")}
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <label className="text-sm font-medium text-gray-700">EPF (12% of total)</label>
                      <p className="text-xs text-gray-500">Employee Provident Fund</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Rs. {watch("EPF")?.toFixed(2) || "0.00"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <input
                      {...register("includeESI")}
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <label className="text-sm font-medium text-gray-700">ESI (3.25% of total)</label>
                      <p className="text-xs text-gray-500">Employee State Insurance</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Rs. {watch("ESI")?.toFixed(2) || "0.00"}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <input
                      {...register("includePFAdmin")}
                      type="checkbox"
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <label className="text-sm font-medium text-gray-700">PF Admin Charges (1% of total)</label>
                      <p className="text-xs text-gray-500">Provident Fund Administrative Charges</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    Rs. {watch("pfAdminCharges")?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-900">Final Total</span>
                  <span className="text-xl font-bold text-green-900">
                    Rs. {((watch("total") || 0) + (watch("EPF") || 0) + (watch("ESI") || 0) + (watch("pfAdminCharges") || 0)).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Total + EPF + ESI + PF Admin Charges
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting || postLoading}
            >
              {postLoading ? "Processing..." : isEditMode ? "Update Leave Wages" : "Add Leave Wages"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  ) : null
}
