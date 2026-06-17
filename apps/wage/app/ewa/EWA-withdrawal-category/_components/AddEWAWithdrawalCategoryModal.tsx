"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import { toast } from "react-toastify"
import { X, AlertCircle, SearchIcon, Check, Trash2, Filter } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@repo/ui/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import SingleSelectField from "@/components/fields/single-select-field"
import { useAggregateArrayFetch } from "@/hooks/api/serach/use-aggregate-array-fetch"

// Predefined component options (you can fetch these from an API)
const COMPONENT_OPTIONS = [
  { code: "gross", name: "Gross Salary" },
  { code: "basic", name: "Basic Salary" },
  { code: "hra", name: "HRA" },
  { code: "da", name: "Dearness Allowance" },
  { code: "ta", name: "Travel Allowance" },
  { code: "da_bonus", name: "Dearness Allowance on Bonus" },
  { code: "special_allowance", name: "Special Allowance" },
  { code: "bonus", name: "Bonus" },
  { code: "overtime", name: "Overtime" },
  { code: "commission", name: "Commission" },
]

export type EWAWithdrawalCategoryItem = {
  _id?: string
  categoryTitle: string
  categoryCode: string
  allowedPercentage: number
  maxWithdrawalPerRequest: number
  minWithdrawalPerRequest: number
  maxWithdrawalsPerMonth: number
  coolingPeriodHours: number
  includeComponents: string[]
  isActive: boolean
  tenantCode?: string
  organizationCode?: string
}

const schema = yup.object({
  categoryTitle: yup.string().required("Category title is required"),
  categoryCode: yup.string().required("Category code is required"),
  allowedPercentage: yup.number().typeError("Allowed percentage must be a number").min(0).max(100).required("Allowed percentage is required"),
  maxWithdrawalPerRequest: yup.number().typeError("Max withdrawal must be a number").min(0).required("Max withdrawal per request is required"),
  minWithdrawalPerRequest: yup.number().typeError("Min withdrawal must be a number").min(0).required("Min withdrawal per request is required"),
  maxWithdrawalsPerMonth: yup.number().typeError("Max withdrawals per month must be a number").min(0).required("Max withdrawals per month is required"),
  coolingPeriodHours: yup.number().typeError("Cooling period must be a number").min(0).required("Cooling period is required"),
  includeComponents: yup.array(yup.string().required()).min(1, "At least one component is required").required(),
  isActive: yup.boolean().required(),
})

type Props = {
  open: boolean
  isEditMode?: boolean
  isViewMode?: boolean
  editData?: EWAWithdrawalCategoryItem | null
  onClose: () => void
  onSuccess?: () => void
}

export default function AddEWAWithdrawalCategoryModal({ open, isEditMode, isViewMode, editData, onClose, onSuccess }: Props) {
  const tenantCode = useGetTenantCode()
  const { register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm<EWAWithdrawalCategoryItem>({
    resolver: yupResolver(schema),
    defaultValues: {
      categoryTitle: "",
      categoryCode: "",
      allowedPercentage: 0,
      maxWithdrawalPerRequest: 0,
      minWithdrawalPerRequest: 0,
      maxWithdrawalsPerMonth: 0,
      coolingPeriodHours: 0,
      includeComponents: ["gross"],
      isActive: true,
    },
  })

  const [addComponentOpen, setAddComponentOpen] = useState(false)
  const [componentSearchField, setComponentSearchField] = useState<"code" | "name">("code")
  const [componentSearchTerm, setComponentSearchTerm] = useState("")
  const [addComponentSearchTerm, setAddComponentSearchTerm] = useState("")
  const [componentPage, setComponentPage] = useState(1)
  const pageSize = 5
  const [organizationData, setOrganizationData] = useState<any>({})

  const selectedComponents = watch("includeComponents") || []
  const selectedCategoryCode = watch("categoryCode")

  const organizationCriteriaRequests = useMemo(
    () =>
      tenantCode
        ? [
            {
              field: "tenantCode",
              operator: "is",
              value: tenantCode,
            },
          ]
        : [],
    [tenantCode]
  )

  const { arrayData: categoriesArray } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "employeeCategories",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    setOrganizationData({
      categories: categoriesArray || [],
    })
  }, [categoriesArray])

  const categoryOptions = useMemo(() => {
    const categories = organizationData.categories || []
    if (!categories.length) return []

    return categories
      .filter((item: any) => item?.employeeCategoryTitle || item?.employeeCategoryName || item?.employeeCategoryCode)
      .map((item: any) => ({
        value: item.employeeCategoryTitle || item.employeeCategoryName || item.employeeCategoryCode,
        label: item.employeeCategoryTitle || item.employeeCategoryName || item.employeeCategoryCode,
      }))
  }, [organizationData.categories])

  useEffect(() => {
    if (!open) return
    if (editData) {
      reset({
        _id: editData._id,
        categoryTitle: editData.categoryTitle || "",
        categoryCode: editData.categoryCode || "",
        allowedPercentage: Number(editData.allowedPercentage ?? 0),
        maxWithdrawalPerRequest: Number(editData.maxWithdrawalPerRequest ?? 0),
        minWithdrawalPerRequest: Number(editData.minWithdrawalPerRequest ?? 0),
        maxWithdrawalsPerMonth: Number(editData.maxWithdrawalsPerMonth ?? 0),
        coolingPeriodHours: Number(editData.coolingPeriodHours ?? 0),
        includeComponents: Array.isArray(editData.includeComponents) ? editData.includeComponents : ["gross"],
        isActive: !!editData.isActive,
      })
    } else {
      reset({
        categoryTitle: "",
        categoryCode: "",
        allowedPercentage: 0,
        maxWithdrawalPerRequest: 0,
        minWithdrawalPerRequest: 0,
        maxWithdrawalsPerMonth: 0,
        coolingPeriodHours: 0,
        includeComponents: [],
        isActive: true,
      })
    }
  }, [open, editData, reset])

  const { post, loading } = usePostRequest<any>({
    url: "EWA_withdrawal_category",
    onSuccess: () => toast.success(`Category ${isEditMode ? "updated" : "saved"} successfully`),
    onError: () => toast.error(`Failed to ${isEditMode ? "update" : "save"} category`),
  })

  const onSubmit = async (values: EWAWithdrawalCategoryItem) => {
    const payload: EWAWithdrawalCategoryItem = {
      ...values,
      _id: isEditMode ? editData?._id : undefined,
      tenantCode,
      organizationCode: tenantCode,
    }
    await post({
      tenant: tenantCode,
      action: "insert",
      id: payload._id || null,
      collectionName: "EWA_withdrawal_category",
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

  const handleComponentSelect = (componentCode: string) => {
    const current = selectedComponents
    if (current.includes(componentCode)) {
      setValue("includeComponents", current.filter((c) => c !== componentCode))
    } else {
      setValue("includeComponents", [...current, componentCode])
    }
  }

  const filteredForAddPanel = COMPONENT_OPTIONS.filter((item) => {
    if (!addComponentSearchTerm) return true
    const searchLower = addComponentSearchTerm.toLowerCase()
    if (componentSearchField === "code") {
      return item.code.toLowerCase().includes(searchLower)
    } else {
      return item.name.toLowerCase().includes(searchLower)
    }
  })
  const allAddFilteredSelected =
    filteredForAddPanel.length > 0 &&
    filteredForAddPanel.every((item) => selectedComponents.includes(item.code))
  const addFilteredComponentOptions = filteredForAddPanel.filter((item) => !selectedComponents.includes(item.code))

  const selectedComponentDetails = selectedComponents
    .map((code) => COMPONENT_OPTIONS.find((opt) => opt.code === code))
    .filter((item): item is typeof COMPONENT_OPTIONS[0] => !!item)

  const filteredSelectedComponents = selectedComponentDetails
  const paginatedSelectedComponents = filteredSelectedComponents.slice(
    (componentPage - 1) * pageSize,
    componentPage * pageSize
  )

  const fieldClassName = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition"

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <Card className="w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        <CardHeader className="shrink-0 px-6 py-3 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-700">
              {isViewMode ? "View" : isEditMode ? "Edit" : "Add"} EWA Withdrawal Category
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Category Title (read-only info) */}
              {/* <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Category Title <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input
                  value={watch("categoryTitle") || ""}
                  disabled
                  className={`${fieldClassName} bg-gray-100 cursor-not-allowed`}
                  placeholder="Auto-filled from category code"
                />
                {errors.categoryTitle && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.categoryTitle.message}
                  </div>
                )}
              </div> */}

              {/* Category Code */}
              <div className="space-y-1.5">
                <SingleSelectField
                  label="Category Code"
                  value={selectedCategoryCode || ""}
                  options={categoryOptions.map((opt:any) => ({ value: opt.value, label: opt.value }))}
                  disabled={isViewMode || isEditMode || categoryOptions.length === 0}
                  onChange={(v) => {
                    const selected = (organizationData.categories || []).find(
                      (item: any) => item.employeeCategoryCode === v
                    )
                    setValue("categoryCode", v, { shouldValidate: true })
                    setValue(
                      "categoryTitle",
                      selected?.employeeCategoryTitle || selected?.employeeCategoryName || v,
                      { shouldValidate: true }
                    )
                  }}
                  placeholder={categoryOptions.length === 0 ? "No category codes available" : "Select Category Code"}
                  required
                />
                {watch("categoryTitle") && (
                  <p className="text-xs text-gray-500">
                    Title: <span className="font-medium text-gray-700">{watch("categoryTitle")}</span>
                  </p>
                )}
                {errors.categoryCode && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.categoryCode.message}
                  </div>
                )}
              </div>

              {/* Allowed Percentage */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Allowed Percentage (%) <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  {...register("allowedPercentage")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder="0-100"
                />
                {errors.allowedPercentage && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.allowedPercentage.message}
                  </div>
                )}
              </div>

              {/* Max Withdrawal Per Request */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Max Withdrawal Per Request <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  type="number" 
                  {...register("maxWithdrawalPerRequest")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder="Enter max withdrawal amount"
                />
                {errors.maxWithdrawalPerRequest && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.maxWithdrawalPerRequest.message}
                  </div>
                )}
              </div>

              {/* Min Withdrawal Per Request */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Min Withdrawal Per Request <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  type="number" 
                  {...register("minWithdrawalPerRequest")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder="Enter min withdrawal amount"
                />
                {errors.minWithdrawalPerRequest && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.minWithdrawalPerRequest.message}
                  </div>
                )}
              </div>

              {/* Max Withdrawals Per Month */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Max Withdrawals Per Month <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  type="number" 
                  {...register("maxWithdrawalsPerMonth")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder="Enter max withdrawals per month"
                />
                {errors.maxWithdrawalsPerMonth && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.maxWithdrawalsPerMonth.message}
                  </div>
                )}
              </div>

              {/* Cooling Period Hours */}
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Cooling Period (Hours) <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input 
                  type="number" 
                  {...register("coolingPeriodHours")} 
                  disabled={isViewMode}
                  className={fieldClassName}
                  placeholder="Enter cooling period in hours"
                />
                {errors.coolingPeriodHours && (
                  <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.coolingPeriodHours.message}
                  </div>
                )}
              </div>
            </div>

            {/* Include Components - Multi Select */}
            <div className="space-y-3">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Include Components <span className="text-red-500 normal-case">*</span>
              </Label>
              
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <div className="flex bg-muted/50 rounded-lg border">
                      <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                        <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                        <Select
                          value={componentSearchField}
                          onValueChange={(val: "code" | "name") => setComponentSearchField(val)}
                        >
                          <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="code" className="text-sm">Code</SelectItem>
                            <SelectItem value="name" className="text-sm">Name</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 flex items-center bg-background rounded-r-lg">
                        <div className="relative flex-1">
                          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="text"
                            autoComplete="off"
                            placeholder={`Search by ${componentSearchField === "code" ? "code" : "name"}...`}
                            value={componentSearchTerm}
                            onChange={(e) => setComponentSearchTerm(e.target.value)}
                            className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                          />
                        </div>
                      </div>
                    </div>

                    {addComponentOpen && (
                      <div className="absolute z-30 left-0 top-full mt-3 w-[min(600px,100%)]">
                        <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3">
                          <div className="flex bg-muted/50 rounded-lg border">
                            <div className="flex-1 flex items-center bg-background rounded-l-lg">
                              <div className="relative flex-1">
                                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                  type="text"
                                  placeholder={`Search by ${componentSearchField === "code" ? "code" : "name"}...`}
                                  value={addComponentSearchTerm}
                                  onChange={(e) => setAddComponentSearchTerm(e.target.value)}
                                  className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setAddComponentOpen(false)}
                              className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                              aria-label="Close"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="border rounded-lg bg-white">
                            <Command shouldFilter={false} className="rounded-lg">
                              {addFilteredComponentOptions.length > 0 && (
                                <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (allAddFilteredSelected) {
                                        const remaining = selectedComponents.filter(
                                          (code: string) => !filteredForAddPanel.some((option) => option.code === code)
                                        )
                                        setValue("includeComponents", remaining, { shouldValidate: true })
                                      } else {
                                        const merged = [...selectedComponents]
                                        filteredForAddPanel.forEach((option) => {
                                          if (!merged.includes(option.code)) merged.push(option.code)
                                        })
                                        setValue("includeComponents", merged, { shouldValidate: true })
                                      }
                                    }}
                                    className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                                  >
                                    <Check
                                      className={`h-4 w-4 rounded-sm border ${
                                        allAddFilteredSelected
                                          ? "opacity-100 text-green-600 border-green-500"
                                          : "opacity-70 text-transparent border-gray-300"
                                      }`}
                                    />
                                    <span>Select all ({filteredForAddPanel.length})</span>
                                  </button>
                                </div>
                              )}
                              <CommandList className="max-h-[200px]">
                                <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                                  No components found.
                                </CommandEmpty>
                                <CommandGroup>
                                  {addFilteredComponentOptions.map((item) => {
                                    const isSelected = selectedComponents.includes(item.code)
                                    return (
                                      <CommandItem
                                        key={item.code}
                                        value={`${item.code}-${item.name}`}
                                        onSelect={() => handleComponentSelect(item.code)}
                                        className="cursor-pointer"
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 rounded-sm border ${
                                            isSelected
                                              ? "opacity-100 text-green-600 border-green-500"
                                              : "opacity-70 text-transparent border-gray-300"
                                          }`}
                                        />
                                        <div className="flex-1">
                                          <div className="font-medium text-sm">{item.name}</div>
                                          <div className="text-xs text-gray-500">Code: {item.code}</div>
                                        </div>
                                      </CommandItem>
                                    )
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={() => setAddComponentOpen((prev) => !prev)}
                    size="default"
                    className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                    disabled={isViewMode}
                  >
                    Add Component
                  </Button>
                </div>

                <div className="border rounded-lg bg-slate-50/40">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                          Component Code
                        </TableHead>
                        <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                          Component Name
                        </TableHead>
                        <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSelectedComponents.length > 0 ? (
                        paginatedSelectedComponents.map((item) => (
                          <TableRow
                            key={item.code}
                            className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                          >
                            <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                              {item.code}
                            </TableCell>
                            <TableCell className="py-1.5 text-sm text-gray-900">{item.name}</TableCell>
                            <TableCell className="py-1.5 pr-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                                onClick={() => handleComponentSelect(item.code)}
                                disabled={isViewMode}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="py-8 text-center text-sm text-gray-500">
                            No components selected. Click &quot;Add Component&quot; to select components.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {filteredSelectedComponents.length > pageSize && (
                    <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                      <p className="text-[11px] text-gray-500">
                        Showing{" "}
                        <span className="font-semibold">
                          {Math.min((componentPage - 1) * pageSize + 1, filteredSelectedComponents.length)}-
                          {Math.min(componentPage * pageSize, filteredSelectedComponents.length)}
                        </span>{" "}
                        of <span className="font-semibold">{filteredSelectedComponents.length}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[11px]"
                          disabled={componentPage === 1}
                          onClick={() => setComponentPage((p) => Math.max(1, p - 1))}
                        >
                          Prev
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-6 px-2 text-[11px]"
                          disabled={componentPage * pageSize >= filteredSelectedComponents.length}
                          onClick={() =>
                            setComponentPage((p) =>
                              p * pageSize >= filteredSelectedComponents.length ? p : p + 1
                            )
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                {errors.includeComponents && (
                  <div className="flex items-center gap-1 text-red-500 text-xs">
                    <AlertCircle className="h-3 w-3" />
                    {errors.includeComponents.message}
                  </div>
                )}
              </div>
            </div>

            {/* Active Switch */}
            <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-gray-700">Active</Label>
                <p className="text-xs text-gray-500">Enable or disable this withdrawal category</p>
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
