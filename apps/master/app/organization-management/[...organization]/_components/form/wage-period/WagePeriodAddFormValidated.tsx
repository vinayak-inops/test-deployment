"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Calendar, Users, Check, ChevronsUpDown, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
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
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { createWagePeriodSchema } from "./wage-period-form-schema"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"

interface WagePeriodFormData {
  employeeCategory: {
    employeeCategoryCode?: string
    employeeCategoryName?: string
  }
  from: number
  to: number
}

interface WagePeriodFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type WagePeriodFormField = "employeeCategory.employeeCategoryCode" | "employeeCategory.employeeCategoryName" | "from" | "to"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"

export default function WagePeriodAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: WagePeriodFormModalProps) {
  const tenantCode = useGetTenantCode()
  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const { arrayData: employeeCategoriesArray } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "employeeCategories",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const schema = useMemo(
    () => createWagePeriodSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )
  
  // State for selected employee category
  const [selectedEmployeeCategoryCode, setSelectedEmployeeCategoryCode] = useState<string>("")
  
  // State for dropdown
  const [employeeCategoryDropdownOpen, setEmployeeCategoryDropdownOpen] = useState(false)
  const [employeeCategorySearchValue, setEmployeeCategorySearchValue] = useState("")
  
  // Get employee category options from organization data
  const employeeCategoryOptions = useMemo(
    () =>
      (employeeCategoriesArray || []).map((category: any) => ({
        label: `${category.employeeCategoryName} (${category.employeeCategoryCode})`,
        value: category.employeeCategoryCode,
      })),
    [employeeCategoriesArray]
  )
  
  // Filter function for search
  const filteredEmployeeCategoryOptions = employeeCategoryOptions.filter((option: any) =>
    option.label.toLowerCase().includes(employeeCategorySearchValue.toLowerCase())
  )

  useEffect(() => {
    if (!deleteValue?.employeeCategory?.employeeCategoryCode) return
    void handleDeleteItem(deleteValue.employeeCategory.employeeCategoryCode)
  }, [deleteValue])

  const handleDeleteItem = async (employeeCategoryCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          wagePeriod: [{ employeeCategory: { employeeCategoryCode } }],
        },
      }

      // postWagePeriod(postData)
    } catch (error) {
      console.error("Error deleting wage period:", error)
    }
  }
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
    clearErrors,
    watch,
  } = useForm<WagePeriodFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeCategory: {
        employeeCategoryCode: "",
        employeeCategoryName: "",
      },
      from: undefined,
      to: undefined,
    },
  })

  const { post: postWagePeriod, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, WagePeriodFormField> = {
          employeeCategoryCode: "employeeCategory.employeeCategoryCode",
          employeeCategoryName: "employeeCategory.employeeCategoryName",
          from: "from",
          to: "to",
        }

        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField = fieldMap[fieldName] ?? fieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField, { type: "server", message })
        })
        return
      }

      toast.success("Wage period submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setSelectedEmployeeCategoryCode("")
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Wage period submission failed!")
      console.error("POST error:", error)
    },
  })

  // Populate form with edit data when in edit mode
  useEffect(() => {
    if (isEditMode && editData) {
      const employeeCategoryCode = editData.employeeCategory?.employeeCategoryCode || editData.employeeCategoryCode || ""
      const employeeCategoryName = editData.employeeCategory?.employeeCategoryName || editData.employeeCategoryName || ""
      const fromDay = editData.wagePeriod?.from || editData.from || editData.fromDay || undefined
      const toDay   = editData.wagePeriod?.to   || editData.to   || editData.toDay   || undefined

      setValue("employeeCategory.employeeCategoryCode", employeeCategoryCode)
      setValue("employeeCategory.employeeCategoryName", employeeCategoryName)
      setValue("from", fromDay)
      setValue("to", toDay)
      setSelectedEmployeeCategoryCode(employeeCategoryCode)
    } else if (open && !isEditMode) {
      reset()
      setSelectedEmployeeCategoryCode("")
    }
  }, [isEditMode, editData, setValue, reset, open])

  // Handle employee category selection — name auto-populates from the selected option
  const handleEmployeeCategorySelect = (employeeCategoryCode: string) => {
    const selectedCategory = employeeCategoriesArray?.find((cat: any) => cat.employeeCategoryCode === employeeCategoryCode)
    setSelectedEmployeeCategoryCode(employeeCategoryCode)
    setValue("employeeCategory.employeeCategoryCode", employeeCategoryCode)
    setValue("employeeCategory.employeeCategoryName", selectedCategory?.employeeCategoryName || "")
    setEmployeeCategorySearchValue("")
    setEmployeeCategoryDropdownOpen(false)
  }

  const handleFormSubmit = async (data: WagePeriodFormData) => {
    try {
      clearErrors()
      const payloadWagePeriod = {
        ...(isEditMode && editData ? editData : {}),
        employeeCategory: {
          employeeCategoryCode: data.employeeCategory.employeeCategoryCode,
          employeeCategoryName: data.employeeCategory.employeeCategoryName,
        },
        wagePeriod: {
          from: data.from,
          to: data.to,
        },
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "wagePeriodValidator",
        data: {
          wagePeriod: [payloadWagePeriod],
        },
      }

      postWagePeriod(postData)
    } catch (error) {
      console.error("Error processing wage period:", error)
    }
  }

  const handleCancel = () => {
    reset()
    setSelectedEmployeeCategoryCode("")
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gray-100 p-1.5">
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {isEditMode ? "Edit Wage Period" : "Add New Wage Period"}
              </h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {isEditMode ? "Update wage period information." : "Create a new wage period entry."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<WagePeriodFormData>)} className="space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Employee Category</h3>
              <div className="space-y-2">
                <Label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                  Employee Category
                </Label>
                <Popover open={employeeCategoryDropdownOpen} onOpenChange={setEmployeeCategoryDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={employeeCategoryDropdownOpen}
                      className="h-10 w-full justify-between border-gray-300 font-normal"
                      disabled={isEditMode}
                    >
                      {selectedEmployeeCategoryCode
                        ? employeeCategoryOptions.find((option: any) => option.value === selectedEmployeeCategoryCode)?.label
                        : "Select an employee category"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] bg-white p-0">
                    <Command>
                      <CommandInput
                        placeholder="Search employee categories..."
                        value={employeeCategorySearchValue}
                        onValueChange={setEmployeeCategorySearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>No employee categories found.</CommandEmpty>
                        <CommandGroup className="h-[150px] overflow-y-auto">
                          {filteredEmployeeCategoryOptions.map((option: any) => (
                            <CommandItem
                              key={option.value}
                              value={option.value}
                              onSelect={() => handleEmployeeCategorySelect(option.value)}
                              className={cn(
                                "flex items-center justify-between",
                                selectedEmployeeCategoryCode === option.value && "bg-accent"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{option.label}</span>
                              </div>
                              {selectedEmployeeCategoryCode === option.value && (
                                <Check className="h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.employeeCategory?.employeeCategoryCode?.message && <p className="text-xs text-red-500">{errors.employeeCategory.employeeCategoryCode.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeCategoryName" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                  Employee Category Name
                </Label>
                <Input
                  id="employeeCategoryName"
                  {...register("employeeCategory.employeeCategoryName")}
                  placeholder="Auto-filled when category is selected"
                  className={errors.employeeCategory?.employeeCategoryName?.message ? `${INPUT_CLASS} border-red-500 bg-gray-50` : `${INPUT_CLASS} bg-gray-50`}
                  readOnly
                />
                {errors.employeeCategory?.employeeCategoryName?.message && <p className="text-xs text-red-500">{errors.employeeCategory.employeeCategoryName.message}</p>}
              </div>
            </div>

            <div className="space-y-3 border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900">Wage Period</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="from" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    From (Day)
                  </Label>
                  <Input
                    id="from"
                    type="number"
                    {...register("from", { valueAsNumber: true })}
                    placeholder="Enter from day (1-31)"
                    min="1"
                    max="31"
                    className={errors.from?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
                  />
                  {errors.from?.message && <p className="text-xs text-red-500">{errors.from.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    To (Day)
                  </Label>
                  <Input
                    id="to"
                    type="number"
                    {...register("to", { valueAsNumber: true })}
                    placeholder="Enter to day (1-31)"
                    min="1"
                    max="31"
                    className={errors.to?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
                  />
                  {errors.to?.message && <p className="text-xs text-red-500">{errors.to.message}</p>}
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 rounded-b-lg border-t border-gray-200 bg-gray-50 px-5 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            onClick={handleCancel}
            disabled={isSubmitting || postLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleSubmit(handleFormSubmit as SubmitHandler<WagePeriodFormData>)}
            disabled={isSubmitting || postLoading}
          >
            {postLoading ? "Saving..." : isEditMode ? "Update" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
