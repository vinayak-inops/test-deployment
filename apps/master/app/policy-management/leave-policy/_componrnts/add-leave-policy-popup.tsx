"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Check, Trash2, Filter, Search as SearchIcon } from "lucide-react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@repo/ui/components/ui/command"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { SingleSelectField } from "@/components/fields/single-select-field"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { SubFormTitle } from "../../../../components/header/sub-form-title"
import { FormActionsFooter } from "../../../../components/footer/form-actions-footer"
import {
  createOrganizationSchema,
  normalizeOrganizationConfig,
  type OrganizationData,
} from "./forms/schemas/organization-form-schema"

type OptionItem = {
  code: string
  name: string
  subsidiaryCode?: string
}

interface AddLeavePolicyPopupProps {
  open: boolean
  onClose: () => void
  onSaved?: () => void
}

const toOptions = (list: any[], codeKeys: string[], nameKeys: string[]): OptionItem[] =>
  (Array.isArray(list) ? list : [])
    .map((item: any) => {
      const code = codeKeys.map((k) => item?.[k]).find((v) => typeof v === "string" && v.trim()) || ""
      const name = nameKeys.map((k) => item?.[k]).find((v) => typeof v === "string" && v.trim()) || ""
      const subsidiaryCode =
        (typeof item?.subsidiaryCode === "string" && item.subsidiaryCode) ||
        (typeof item?.subsidiary_code === "string" && item.subsidiary_code) ||
        ""
      return { code, name, subsidiaryCode }
    })
    .filter((item) => item.code)

export default function AddLeavePolicyPopup({ open, onClose, onSaved }: AddLeavePolicyPopupProps) {
  const router = useRouter()
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const schema = useMemo(() => createOrganizationSchema(normalizeOrganizationConfig()), [])
  const [showErrors, setShowErrors] = useState(false)
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [categorySearchTerm, setCategorySearchTerm] = useState("")
  const [addCategorySearchTerm, setAddCategorySearchTerm] = useState("")
  const [categorySearchField, setCategorySearchField] = useState<"code" | "name">("name")
  const [categoryPage, setCategoryPage] = useState(1)

  const {
    watch,
    setValue,
    reset,
    setError,
    trigger,
    clearErrors,
    formState: { errors, isValid },
  } = useForm<OrganizationData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      leaveCode: "",
      leaveTitle: "",
      subsidiary: { subsidiaryCode: "", subsidiaryName: "" },
      location: { locationCode: "", locationName: "" },
      designation: { designationCode: "", designationName: "" },
      employeeCategory: [],
    },
  })

  const criteriaRequests = useMemo(
    () => [{ field: "tenantCode", operator: "is", value: tenantCode }],
    [tenantCode]
  )

  const { arrayData: subsidiariesArray, loading: subsidiariesLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests,
    arrayField: "subsidiaries",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: designationsArray, loading: designationsLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests,
    arrayField: "designations",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: employeeCategoriesArray, loading: employeeCategoriesLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests,
    arrayField: "employeeCategories",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: locationsArray, loading: locationsLoading } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests,
    arrayField: "location",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const subsidiaries = useMemo(
    () => toOptions(subsidiariesArray, ["subsidiaryCode", "code", "id"], ["subsidiaryName", "name", "title"]),
    [subsidiariesArray]
  )
  const designations = useMemo(
    () => toOptions(designationsArray, ["designationCode", "code", "id"], ["designationName", "name", "title"]),
    [designationsArray]
  )
  const locations = useMemo(
    () => toOptions(locationsArray, ["locationCode", "code", "id"], ["locationName", "name", "title"]),
    [locationsArray]
  )
  const employeeCategories = useMemo(
    () =>
      toOptions(
        employeeCategoriesArray,
        ["employeeCategoryCode", "categoryCode", "code", "id"],
        ["employeeCategoryName", "categoryName", "name", "title"]
      ),
    [employeeCategoriesArray]
  )

  const selectedSubsidiaryCode = watch("subsidiary.subsidiaryCode")
  const selectedCategories = watch("employeeCategory") || []
  const orgLoading = subsidiariesLoading || designationsLoading || employeeCategoriesLoading || locationsLoading

  const filteredDesignations = useMemo(() => {
    if (!selectedSubsidiaryCode) return designations
    const scoped = designations.filter((item) => (item.subsidiaryCode || "") === selectedSubsidiaryCode)
    return scoped.length > 0 ? scoped : designations
  }, [designations, selectedSubsidiaryCode])

  const { post: postLeavePolicy, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: (response) => {
      const responseData = response?.data && typeof response.data === "object" ? response.data : response
      const businessStatus =
        responseData && typeof responseData === "object" ? (responseData as any).status : undefined

      if (businessStatus === false) {
        setShowErrors(true)

        const normalizeServerFieldPath = (fieldName: string) => {
          const normalized = fieldName.trim()
          if (!normalized) return normalized

          const directMap: Record<string, string> = {
            leaveCode: "leaveCode",
            leaveTitle: "leaveTitle",
            subsidiaryCode: "subsidiary.subsidiaryCode",
            subsidiaryName: "subsidiary.subsidiaryName",
            locationCode: "location.locationCode",
            locationName: "location.locationName",
            designationCode: "designation.designationCode",
            designationName: "designation.designationName",
            employeeCategory: "employeeCategory",
          }

          return directMap[normalized] || normalized
        }

        const applyFieldError = (fieldName: string, message: string) => {
          const normalized = normalizeServerFieldPath(fieldName)
          if (!normalized || !message.trim()) return
          setError(normalized as any, {
            type: "server",
            message,
          })
        }

        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return

            if (typeof message === "string") {
              applyFieldError(fieldName, message)
              return
            }

            if (message && typeof message === "object") {
              Object.entries(message as Record<string, unknown>).forEach(([childKey, childValue]) => {
                if (typeof childValue !== "string") return
                applyFieldError(`${fieldName}.${childKey}`, childValue)
              })
            }
          })
        }
        return
      }

      const createdId =
        response?._id?.$oid ||
        response?._id ||
        response?.id ||
        response?.data?._id?.$oid ||
        response?.data?._id ||
        response?.data?.id

      reset()
      onClose()

      if (createdId) {
        router.push(`/policy-management/leave-policy?form=temp&mode=edit&id=${encodeURIComponent(String(createdId))}`)
        return
      }
      onSaved?.()
    },
    onError: (error) => {
      console.error("Failed to create leave policy:", error)
    },
  })

  const selectedCategoryItems = useMemo(
    () =>
      selectedCategories.map((code: string) => {
        const found = employeeCategories.find((item) => item.code === code)
        return {
          code,
          name: found?.name || "Unknown",
        }
      }),
    [selectedCategories, employeeCategories]
  )

  const availableCategoryOptions = useMemo(
    () => employeeCategories.filter((item) => !selectedCategories.includes(item.code)),
    [employeeCategories, selectedCategories]
  )

  const pageSize = 5

  const filteredSelectedCategories = useMemo(() => {
    const q = categorySearchTerm.toLowerCase().trim()
    if (!q) return selectedCategoryItems
    return selectedCategoryItems.filter((item) => {
      if (categorySearchField === "code") return item.code.toLowerCase().includes(q)
      return item.name.toLowerCase().includes(q)
    })
  }, [selectedCategoryItems, categorySearchTerm, categorySearchField])

  const paginatedSelectedCategories = useMemo(() => {
    const start = (categoryPage - 1) * pageSize
    return filteredSelectedCategories.slice(start, start + pageSize)
  }, [filteredSelectedCategories, categoryPage])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredSelectedCategories.length / pageSize))
    if (categoryPage > maxPage) setCategoryPage(maxPage)
  }, [filteredSelectedCategories.length, categoryPage])

  useEffect(() => {
    if (addCategoryOpen) setAddCategorySearchTerm("")
  }, [addCategoryOpen])

  const addFilteredCategoryOptions = useMemo(() => {
    const q = addCategorySearchTerm.toLowerCase().trim()
    if (!q) return availableCategoryOptions
    return availableCategoryOptions.filter((item) => {
      if (categorySearchField === "code") return item.code.toLowerCase().includes(q)
      return item.name.toLowerCase().includes(q)
    })
  }, [availableCategoryOptions, addCategorySearchTerm, categorySearchField])

  const allAddFilteredSelected =
    addFilteredCategoryOptions.length > 0 &&
    addFilteredCategoryOptions.every((item) => selectedCategories.includes(item.code))

  const handleSave = async () => {
    setShowErrors(true)
    clearErrors()
    const valid = await trigger()
    if (!valid) return

    const values = watch()
    postLeavePolicy({
      tenant: tenantCode,
      action: "insert",
      collectionName: "leave_policy",
      event: "validate",
      ruleId: "leavePolicyValidator",
      data: {
        tenantCode,
        organizationCode: tenantCode,
        createdBy: employeeId || "System",
        createdOn: new Date().toISOString(),
        leaveCode: values.leaveCode,
        leaveTitle: values.leaveTitle,
        leavePolicy: {
          leaveCode: values.leaveCode,
          leaveTitle: values.leaveTitle,
        },
        subsidiary: values.subsidiary,
        location: values.location,
        designation: values.designation,
        employeeCategory: values.employeeCategory || [],
      },
    })
  }

  useEffect(() => {
    if (!open) {
      setShowErrors(false)
      setAddCategoryOpen(false)
      setCategorySearchTerm("")
      setAddCategorySearchTerm("")
      setCategorySearchField("name")
      setCategoryPage(1)
      reset()
      clearErrors()
    }
  }, [open, reset, clearErrors])

  if (!open) return null
  const isViewMode = false
  const shouldShowConfigLoader = orgLoading

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !postLoading) onClose()
      }}
    >
      <div className="bg-transparent w-full max-w-6xl flex flex-col">
        <Card className="w-full max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 shadow-sm">
          <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">Leave Policy - Organization</h2>
            <button
              type="button"
              onClick={onClose}
              disabled={postLoading}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
              aria-label="Close popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <CardContent className="flex-1 px-6 py-4 space-y-6 overflow-y-auto">
            {showErrors && Object.keys(errors).length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Please fix highlighted fields before saving.
              </div>
            )}

            <div className="space-y-3">
              <SubFormTitle title="Leave Identity" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Leave Code *</label>
                  <Input
                    value={watch("leaveCode") || ""}
                    onChange={(e) => setValue("leaveCode", e.target.value, { shouldValidate: true })}
                    placeholder="Enter leave code"
                  />
                  {showErrors && errors.leaveCode?.message && <p className="text-xs text-red-600">{errors.leaveCode.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Leave Title *</label>
                  <Input
                    value={watch("leaveTitle") || ""}
                    onChange={(e) => setValue("leaveTitle", e.target.value, { shouldValidate: true })}
                    placeholder="Enter leave title"
                  />
                  {showErrors && errors.leaveTitle?.message && <p className="text-xs text-red-600">{errors.leaveTitle.message}</p>}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <SubFormTitle title="Organization Mapping" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <SingleSelectField
                  id="subsidiaryCode-popup"
                  label="Subsidiary Code"
                  required
                  placeholder="Select subsidiary"
                  value={watch("subsidiary.subsidiaryCode") || ""}
                  onChange={(value) => {
                    const selected = subsidiaries.find((item) => item.code === value)
                    setValue("subsidiary", { subsidiaryCode: value, subsidiaryName: selected?.name || "" }, { shouldValidate: true })
                    setValue("designation", { designationCode: "", designationName: "" }, { shouldValidate: true })
                  }}
                  options={subsidiaries.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` }))}
                  errorMessage={showErrors ? errors.subsidiary?.subsidiaryCode?.message : undefined}
                  allowOnlyProvidedOptions
                  showOnlyValueInTrigger
                  disabled={orgLoading}
                />

                <SingleSelectField
                  id="locationCode-popup"
                  label="Location Code"
                  required
                  placeholder="Select location"
                  value={watch("location.locationCode") || ""}
                  onChange={(value) => {
                    const selected = locations.find((item) => item.code === value)
                    setValue("location", { locationCode: value, locationName: selected?.name || "" }, { shouldValidate: true })
                  }}
                  options={locations.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` }))}
                  errorMessage={showErrors ? errors.location?.locationCode?.message : undefined}
                  allowOnlyProvidedOptions
                  showOnlyValueInTrigger
                  disabled={orgLoading}
                />

                <SingleSelectField
                  id="designationCode-popup"
                  label="Designation Code"
                  required
                  placeholder={!selectedSubsidiaryCode ? "Select subsidiary first" : "Select designation"}
                  value={watch("designation.designationCode") || ""}
                  onChange={(value) => {
                    const selected = filteredDesignations.find((item) => item.code === value)
                    setValue("designation", { designationCode: value, designationName: selected?.name || "" }, { shouldValidate: true })
                  }}
                  options={filteredDesignations.map((item) => ({ value: item.code, label: `${item.code} - ${item.name}` }))}
                  errorMessage={showErrors ? errors.designation?.designationCode?.message : undefined}
                  allowOnlyProvidedOptions
                  showOnlyValueInTrigger
                  disabled={!selectedSubsidiaryCode || orgLoading}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <SubFormTitle title="Employee Categories" />
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <div className="flex bg-muted/50 rounded-lg border">
                    <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                      <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                      <Select
                        value={categorySearchField}
                        onValueChange={(val: "code" | "name") => setCategorySearchField(val)}
                      >
                        <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="code" className="text-sm">
                            Code
                          </SelectItem>
                          <SelectItem value="name" className="text-sm">
                            Name
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 flex items-center bg-background rounded-r-lg">
                      <div className="relative flex-1">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          autoComplete="off"
                          placeholder={`Search by ${categorySearchField === "code" ? "code" : "name"}...`}
                          value={categorySearchTerm}
                          onChange={(e) => setCategorySearchTerm(e.target.value)}
                          className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                        />
                      </div>
                    </div>
                  </div>

                  {addCategoryOpen && (
                    <div className="absolute z-30 left-0 top-full mt-3 w-[min(720px,100%)]">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3">
                        <div className="flex bg-muted/50 rounded-lg border">
                          <div className="flex-1 flex items-center bg-background rounded-l-lg">
                            <div className="relative flex-1">
                              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                              <Input
                                type="text"
                                placeholder={`Search by ${categorySearchField === "code" ? "code" : "name"}...`}
                                value={addCategorySearchTerm}
                                onChange={(e) => setAddCategorySearchTerm(e.target.value)}
                                className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setAddCategoryOpen(false)}
                            className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                            aria-label="Close"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="border rounded-lg bg-white">
                          <Command shouldFilter={false} className="rounded-lg">
                            {addFilteredCategoryOptions.length > 0 && (
                              <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (allAddFilteredSelected) {
                                      setValue(
                                        "employeeCategory",
                                        selectedCategories.filter(
                                          (code: string) =>
                                            !addFilteredCategoryOptions.some((option) => option.code === code)
                                        ),
                                        { shouldValidate: true }
                                      )
                                    } else {
                                      const merged = [...selectedCategories]
                                      addFilteredCategoryOptions.forEach((option) => {
                                        if (!merged.includes(option.code)) merged.push(option.code)
                                      })
                                      setValue("employeeCategory", merged, { shouldValidate: true })
                                    }
                                  }}
                                  className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                                >
                                  <Check
                                    className={`h-4 w-4 rounded-sm border ${allAddFilteredSelected
                                      ? "opacity-100 text-green-600 border-green-500"
                                      : "opacity-70 text-transparent border-gray-300"
                                      }`}
                                  />
                                  <span>Select all ({addFilteredCategoryOptions.length})</span>
                                </button>
                              </div>
                            )}
                            <CommandList className="max-h-[200px]">
                              <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                                No categories found.
                              </CommandEmpty>
                              <CommandGroup>
                                {addFilteredCategoryOptions.map((item) => {
                                  const isSelected = selectedCategories.includes(item.code)
                                  return (
                                    <CommandItem
                                      key={item.code}
                                      value={`${item.code}-${item.name}`}
                                      onSelect={() => {
                                        if (isSelected) {
                                          setValue(
                                            "employeeCategory",
                                            selectedCategories.filter((code: string) => code !== item.code),
                                            { shouldValidate: true }
                                          )
                                        } else {
                                          setValue("employeeCategory", [...selectedCategories, item.code], {
                                            shouldValidate: true,
                                          })
                                        }
                                      }}
                                      className="cursor-pointer"
                                    >
                                      <Check
                                        className={`mr-2 h-4 w-4 rounded-sm border ${isSelected
                                          ? "opacity-100 text-green-600 border-green-500"
                                          : "opacity-70 text-transparent border-gray-300"
                                          }`}
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{item.name || "N/A"}</div>
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
                  onClick={() => setAddCategoryOpen((prev) => !prev)}
                  size="default"
                  className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                  disabled={orgLoading}
                >
                  Add Categories
                </Button>
              </div>

              {showErrors && errors.employeeCategory && (
                <p className="text-red-500 text-xs">{errors.employeeCategory.message}</p>
              )}

              <div className="border rounded-lg bg-slate-50/40">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                        Category Code
                      </TableHead>
                      <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                        Category Name
                      </TableHead>
                      <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedSelectedCategories.length > 0 ? (
                      paginatedSelectedCategories.map((item) => (
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
                              onClick={() =>
                                setValue(
                                  "employeeCategory",
                                  selectedCategories.filter((code: string) => code !== item.code),
                                  { shouldValidate: true }
                                )
                              }
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="py-8 text-center text-sm text-gray-500">
                          No categories selected. Click &quot;Add Categories&quot; to select categories.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                {filteredSelectedCategories.length > pageSize && (
                  <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                    <p className="text-[11px] text-gray-500">
                      Showing{" "}
                      <span className="font-semibold">
                        {Math.min((categoryPage - 1) * pageSize + 1, filteredSelectedCategories.length)}-
                        {Math.min(categoryPage * pageSize, filteredSelectedCategories.length)}
                      </span>{" "}
                      of <span className="font-semibold">{filteredSelectedCategories.length}</span>
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        disabled={categoryPage === 1}
                        onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}
                      >
                        Prev
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-[11px]"
                        disabled={categoryPage * pageSize >= filteredSelectedCategories.length}
                        onClick={() =>
                          setCategoryPage((p) => (p * pageSize >= filteredSelectedCategories.length ? p : p + 1))
                        }
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>

          <FormActionsFooter
            isViewMode={isViewMode}
            isValid={isValid}
            showErrors={showErrors}
            errorCount={Object.keys(errors).length}
            postLoading={postLoading || shouldShowConfigLoader}
            onSave={handleSave}
            onPreviousTab={onClose}
          />
        </Card>
      </div>
    </div>
  )
}
