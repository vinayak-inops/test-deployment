"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { AlertCircle, Info, X, Search, Check, Filter } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import ActionButtons from "@/components/common/action-buttons"
import { toast } from "react-toastify"

const validationSchema = yup.object({
  employeeCategoryCode: yup.string().required("Employee Category is required"),
})

type FormData = yup.InferType<typeof validationSchema>

interface EmployeeCategory {
  code: string
  name: string
}

interface AddCategoryPopupProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function AddCategoryPopup({ isOpen, onClose, onSuccess }: AddCategoryPopupProps) {
  const router = useRouter()
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    clearErrors,
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      employeeCategoryCode: "",
    },
    mode: "onChange",
  })

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<EmployeeCategory | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch employee categories using organization/aggregate
  const employeeCategoriesRequestData = useMemo(() => {
    if (!tenantCode) return null
    return {
      criteriaRequests: [
        {
          field: "tenantCode",
          operator: "is",
          value: tenantCode,
        },
      ],
      arrayFilter: {
        arrayField: "employeeCategories",
        filterCriteria: [],
      },
    }
  }, [tenantCode])

  const { data: employeeCategoriesResponse, loading: categoriesLoading, refetch: refetchCategories } = useRequest<any[]>({
    url: employeeCategoriesRequestData ? "organization/aggregate" : "",
    method: "POST",
    data: employeeCategoriesRequestData || [],
    onSuccess: () => {
      // Data processing handled in useMemo
    },
    onError: (error: any) => {
      if (tenantCode) {
        console.error("Error fetching employee categories:", error)
      }
    },
    dependencies: [], // manual refetch pattern
  })

  // Process employee categories from response
  const rawEmployeeCategories = useMemo(() => {
    if (!employeeCategoriesResponse) return []
    
    if (Array.isArray(employeeCategoriesResponse) && employeeCategoriesResponse.length > 0) {
      if (employeeCategoriesResponse[0]?.employeeCategories && Array.isArray(employeeCategoriesResponse[0].employeeCategories)) {
        const allCategories: any[] = []
        employeeCategoriesResponse.forEach((org: any) => {
          if (org?.employeeCategories && Array.isArray(org.employeeCategories)) {
            allCategories.push(...org.employeeCategories)
          }
        })
        return allCategories
      }
      if (employeeCategoriesResponse[0]?.employeeCategoryCode) {
        return employeeCategoriesResponse
      }
    }
    
    return []
  }, [employeeCategoriesResponse])

  // Normalize categories for display
  const employeeCategories = useMemo(() => {
    return rawEmployeeCategories.map((cat: any) => ({
      code: cat.employeeCategoryCode,
      name: cat.employeeCategoryName || cat.employeeCategoryCode,
    }))
  }, [rawEmployeeCategories])

  // Filter categories based on search term
  const filteredCategories = useMemo(() => {
    const query = searchTerm.toLowerCase().trim()
    if (!query) return employeeCategories
    
    return employeeCategories.filter((cat: EmployeeCategory) => {
      return cat.code?.toLowerCase().includes(query) || cat.name?.toLowerCase().includes(query)
    })
  }, [searchTerm, employeeCategories])

  // Initial refetch when popup opens
  useEffect(() => {
    if (isOpen && tenantCode) {
      refetchCategories()
    }
  }, [isOpen, tenantCode, refetchCategories])

  // Reset form when popup opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({ employeeCategoryCode: "" })
      setSearchTerm("")
      setSelectedCategory(null)
      setShowDropdown(false)
      clearErrors()
    }
  }, [isOpen, reset, clearErrors])

  const handleCategorySelect = (category: EmployeeCategory) => {
    setSelectedCategory(category)
    setValue("employeeCategoryCode", category.code, { shouldValidate: true })
    setSearchTerm(category.name || category.code)
    setShowDropdown(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setShowDropdown(true)
    
    // Clear selection if user starts typing something different
    if (selectedCategory) {
      const currentDisplayName = selectedCategory.name || selectedCategory.code
      if (!value.includes(selectedCategory.code) && !currentDisplayName.toLowerCase().includes(value.toLowerCase())) {
        setSelectedCategory(null)
        setValue("employeeCategoryCode", "", { shouldValidate: true })
      }
    }
  }

  const handleSearchFocus = () => {
    setShowDropdown(true)
  }

  const { post: postCategory, loading: postLoading } = usePostRequest<any>({
    url: "employee_category_training_details",
    onSuccess: (data: any) => {
      toast.success("Employee category training details created successfully")

      // Try to extract created _id from response (supports array or single object)
      const createdId =
        Array.isArray(data) && data.length > 0
          ? (data[0]?._id || data[0]?._id?.$oid)
          : (data?._id || data?._id?.$oid)

      if (createdId) {
        router.push(`/employee-management/employee-category-training-details?mode=edit&id=${createdId}`)
      }

      onSuccess?.()
      onClose()
    },
    onError: (error: any) => {
      const errorMsg =
        error?.response?.data?.message || error?.message || "Failed to create employee category training details. Please try again."
      toast.error(errorMsg)
      console.error("POST error:", error)
    },
  })

  const onFormSubmit = async (data: FormData) => {
    if (!selectedCategory || !tenantCode) return

    const payload = {
      tenant: tenantCode,
      action: "insert",
      id: null,
      collectionName: "employee_category_training_details",
      data: {
        employeeCategoryCode: selectedCategory.code,
        tenantCode: tenantCode,
        organizationCode: tenantCode,
        traninings: [],
        createdBy: employeeId || "",
        createdOn: new Date().toISOString(),
      },
    }

    await postCategory(payload)
  }

  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!error) return null
    return (
      <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </div>
    )
  }

  // Backdrop click handler
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Escape key close behavior
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showDropdown) {
          setShowDropdown(false)
        } else {
          onClose()
        }
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", onKey)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, showDropdown])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showDropdown])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-lg">
        <CardHeader className="px-6 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700">Add Employee Category Training Details</CardTitle>
            <button
              onClick={() => { onClose(); }}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
              aria-label="Close popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="px-6 py-4 space-y-5">
          <Alert className="border-0 p-0 text-xs text-gray-600 [&>svg]:text-gray-500 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:left-0 [&>svg]:top-0.5 [&>svg~*]:pl-5">
            <Info />
            <AlertDescription className="m-0">
              Select an employee category to create training details entry.
            </AlertDescription>
          </Alert>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
              Employee Category <span className="text-red-500 normal-case">*</span>
            </label>
            
            <div className="relative" ref={dropdownRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search by code or name..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={handleSearchFocus}
                  className="pl-10 pr-3 py-2 h-10 text-sm focus:ring-0 focus:outline-none w-full placeholder:text-gray-400"
                />
                <input type="hidden" {...register("employeeCategoryCode")} />
              </div>

              {showDropdown && filteredCategories.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <Command shouldFilter={false} className="rounded-lg">
                    <CommandList className="max-h-[200px]">
                      <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                        No employee categories found.
                      </CommandEmpty>
                      <CommandGroup>
                        {filteredCategories.map((cat: EmployeeCategory) => (
                          <CommandItem
                            key={cat.code}
                            value={cat.code}
                            onSelect={() => handleCategorySelect(cat)}
                            className="cursor-pointer"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 rounded-sm border ${
                                selectedCategory?.code === cat.code
                                  ? 'opacity-100 text-green-600 border-green-500'
                                  : 'opacity-70 text-transparent border-gray-300'
                              }`}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{cat.name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">Code: {cat.code}</div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </div>
              )}
            </div>
            <ErrorMessage error={errors.employeeCategoryCode?.message} />
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-1 text-red-800 font-medium text-xs">
                <AlertCircle className="h-4 w-4" />
                Please fix the errors above
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
          <ActionButtons
            layout="end"
            secondaryLabel="Cancel"
            onSecondary={() => { onClose(); }}
            primaryLabel="Submit"
            onPrimary={handleSubmit(onFormSubmit)}
            primaryVariant="default"
            secondaryVariant="secondary"
            primaryLoading={isSubmitting || postLoading}
            className="w-full"
            primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
            secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
          />
        </CardFooter>
      </Card>
    </div>
  )
}

