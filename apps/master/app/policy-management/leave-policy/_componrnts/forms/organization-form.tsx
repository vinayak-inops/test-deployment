"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@repo/ui/components/ui/command"
import { Separator } from "@repo/ui/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { Trash2, Filter, Search as SearchIcon, Check, X, CalendarCheck } from "lucide-react"
import { SingleSelectField } from "@/components/fields/single-select-field"
import { SubFormTitle } from "../../../../../components/header/sub-form-title"
import { GradientFormHeader } from "@/components/header/form-header"

type OptionItem = {
  code: string
  name: string
  subsidiaryCode?: string
}

interface OrganizationFormProps {
  register?: any
  watch?: any
  setValue?: any
  errors?: any
  isValid?: boolean
  isViewMode?: boolean
  onSave?: () => void
  onPreviousTab?: () => void
  postLoading?: boolean
  showErrors?: boolean
  subsidiaries?: OptionItem[]
  locations?: OptionItem[]
  designations?: OptionItem[]
  employeeCategories?: OptionItem[]
  orgLoading?: boolean
  orgError?: string | boolean | null
  isAddMode?: boolean
  hasStepErrors?: boolean
}

export function OrganizationForm({
  register = () => ({}),
  watch = () => ({}),
  setValue = () => { },
  errors = {},
  isViewMode = false,
  onSave = () => {},
  showErrors = false,
  subsidiaries = [],
  locations = [],
  designations = [],
  employeeCategories = [],
  orgLoading = false,
  orgError = null,
  isAddMode = false,
  hasStepErrors = false,
}: OrganizationFormProps) {
  const values = watch()

  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [categorySearchTerm, setCategorySearchTerm] = useState("")
  const [addCategorySearchTerm, setAddCategorySearchTerm] = useState("")
  const [categorySearchField, setCategorySearchField] = useState<"code" | "name">("name")
  const [categoryPage, setCategoryPage] = useState(1)

  // Check if current step is valid - NOW INCLUDING LOCATION AND DESIGNATION
  const isStepValid = useMemo(() => {
    const hasSubsidiary = values.subsidiary?.subsidiaryCode && 
      values.subsidiary.subsidiaryCode.trim() !== ""
    const hasLeaveCode = values.leaveCode && values.leaveCode.trim() !== ""
    const hasLeaveTitle = values.leaveTitle && values.leaveTitle.trim() !== ""
    const hasLocation = values.location?.locationCode && values.location.locationCode.trim() !== ""
    const hasDesignation = values.designation?.designationCode && values.designation.designationCode.trim() !== ""
    
    return !!(hasSubsidiary && hasLeaveCode && hasLeaveTitle && hasLocation && hasDesignation)
  }, [values.subsidiary, values.leaveCode, values.leaveTitle, values.location, values.designation])

  const filteredDesignations = useMemo(() => designations, [designations])

  const selectedCategories = useMemo(
    () => (Array.isArray(values.employeeCategory) ? values.employeeCategory : []),
    [values.employeeCategory]
  )

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
    return selectedCategoryItems.filter((item: any) => {
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

  // Handle continue button click with validation
  const handleContinue = () => {
    if (isViewMode) return
    
    if (!isStepValid) {
      // Trigger validation errors to show
      if (setValue) {
        // Force validation on required fields
        if (!values.subsidiary?.subsidiaryCode) {
          setValue("subsidiary", { ...values.subsidiary, subsidiaryCode: "" }, { shouldValidate: true })
        }
        if (!values.leaveTitle) {
          setValue("leaveTitle", values.leaveTitle, { shouldValidate: true })
        }
        if (!values.leaveCode) {
          setValue("leaveCode", values.leaveCode, { shouldValidate: true })
        }
        if (!values.location?.locationCode) {
          setValue("location", { ...values.location, locationCode: "" }, { shouldValidate: true })
        }
        if (!values.designation?.designationCode) {
          setValue("designation", { ...values.designation, designationCode: "" }, { shouldValidate: true })
        }
      }
      return
    }
    
    onSave?.()
  }

  // Determine if leave code should be disabled
  // - In ADD mode: Editable (enabled)
  // - In EDIT mode (has id, not add mode, not view mode): Read-only (disabled)
  // - In VIEW mode: Read-only (disabled)
  const isLeaveCodeDisabled = isViewMode || (!isAddMode && !isViewMode && !!values.leaveCode)

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="w-full max-w-4xl mx-auto space-y-6 mt-6 pb-28">
          <Card className="w-full border border-gray-200 bg-white shadow-sm">
            <GradientFormHeader
              icon={CalendarCheck}
              title="Leave Identity & Organization Mapping"
              description="Define the leave code, title and map the leave policy to specific organizational parameters to ensure it applies to the right set of employees."
            />
            <CardContent className="px-6 py-4 space-y-6">
              {showErrors && hasStepErrors && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Please fix highlighted fields before saving.
                </div>
              )}

              {orgLoading ? (
                <div className="py-10 text-center text-sm text-gray-600">Loading organization data...</div>
              ) : (
                <>
                  <div className="space-y-3">
                    <SubFormTitle title="Leave Identity" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Leave Code <span className="text-red-500">*</span>
                        </label>
                        <Input
                          {...register("leaveCode", { required: "Leave code is required" })}
                          readOnly={isLeaveCodeDisabled}
                          disabled={isLeaveCodeDisabled}
                          className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${
                            isLeaveCodeDisabled ? "bg-gray-50 cursor-not-allowed" : "bg-white"
                          } ${
                            showErrors && errors?.leaveCode ? "border-red-500 ring-red-500" : ""
                          }`}
                        />
                        {showErrors && errors?.leaveCode?.message && (
                          <p className="text-xs text-red-600">{errors.leaveCode.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Leave Title <span className="text-red-500">*</span>
                        </label>
                        <Input
                          {...register("leaveTitle", { required: "Leave title is required" })}
                          disabled={isViewMode}
                          className={`h-9 border-gray-300 px-3 py-1.5 text-sm ${
                            isViewMode ? "bg-gray-100 cursor-not-allowed" : ""
                          } ${
                            showErrors && errors?.leaveTitle ? "border-red-500 ring-red-500" : ""
                          }`}
                        />
                        {showErrors && errors?.leaveTitle?.message && (
                          <p className="text-xs text-red-600">{errors.leaveTitle.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <SubFormTitle title="Organization Mapping" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <SingleSelectField
                        id="subsidiaryCode"
                        label="Subsidiary Code"
                        placeholder="Select subsidiary code"
                        disabled={isViewMode}
                        value={values.subsidiary?.subsidiaryCode || ""}
                        onChange={(value) => {
                          const selected = subsidiaries.find((item) => item.code === value)
                          setValue("subsidiary", { subsidiaryCode: value, subsidiaryName: selected?.name || "" }, { shouldValidate: true })
                        }}
                        options={subsidiaries.map((item) => ({
                          value: item.code,
                          label: `${item.code} - ${item.name}`,
                          tooltip: `${item.code} - ${item.name}`,
                        }))}
                        showOnlyValueInTrigger
                        errorMessage={showErrors && errors?.subsidiary?.subsidiaryCode ? errors.subsidiary.subsidiaryCode.message : undefined}
                        allowOnlyProvidedOptions
                        required
                      />

                      <SingleSelectField
                        id="locationCode"
                        label="Location Code"
                        placeholder="Select location code"
                        disabled={isViewMode}
                        value={values.location?.locationCode || ""}
                        onChange={(value) => {
                          const selected = locations.find((item) => item.code === value)
                          setValue("location", { locationCode: value, locationName: selected?.name || "" }, { shouldValidate: true })
                        }}
                        options={locations.map((item) => ({
                          value: item.code,
                          label: `${item.code} - ${item.name}`,
                          tooltip: `${item.code} - ${item.name}`,
                        }))}
                        showOnlyValueInTrigger
                        errorMessage={showErrors && errors?.location?.locationCode ? errors.location.locationCode.message : undefined}
                        allowOnlyProvidedOptions
                        required
                      />

                      <SingleSelectField
                        id="designationCode"
                        label="Designation Code"
                        placeholder="Select designation code"
                        disabled={isViewMode}
                        value={values.designation?.designationCode || ""}
                        onChange={(value) => {
                          const selected = filteredDesignations.find((item) => item.code === value)
                          setValue(
                            "designation",
                            { designationCode: value, designationName: selected?.name || "" },
                            { shouldValidate: true }
                          )
                        }}
                        options={filteredDesignations.map((item) => ({
                          value: item.code,
                          label: `${item.code} - ${item.name}`,
                          tooltip: `${item.code} - ${item.name}`,
                        }))}
                        showOnlyValueInTrigger
                        errorMessage={showErrors && errors?.designation?.designationCode ? errors.designation.designationCode.message : undefined}
                        allowOnlyProvidedOptions
                        required
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

                        {addCategoryOpen && !isViewMode && (
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
                                                (code: string) => !addFilteredCategoryOptions.some((option) => option.code === code)
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

                      {!isViewMode && (
                        <Button
                          type="button"
                          onClick={() => setAddCategoryOpen((prev) => !prev)}
                          size="default"
                          className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                          disabled={orgLoading}
                        >
                          Add Categories
                        </Button>
                      )}
                    </div>

                    {showErrors && errors?.employeeCategory && (
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
                            {!isViewMode && (
                              <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                                Actions
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedSelectedCategories.length > 0 ? (
                            paginatedSelectedCategories.map((item: any) => (
                              <TableRow
                                key={item.code}
                                className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                              >
                                <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                                  {item.code}
                                </TableCell>
                                <TableCell className="py-1.5 text-sm text-gray-900">{item.name}</TableCell>
                                {!isViewMode && (
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
                                )}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={isViewMode ? 2 : 3} className="py-8 text-center text-sm text-gray-500">
                                No categories selected. Click "Add Categories" to select categories.
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
                                setCategoryPage((p) =>
                                  p * pageSize >= filteredSelectedCategories.length ? p : p + 1
                                )
                              }
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {orgError && <div className="text-xs text-red-600">Failed to load organization data.</div>}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 shadow-lg p-6 z-50">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleContinue}
              disabled={isViewMode || orgLoading || !isStepValid}
              className={`w-[71%] h-10 text-white disabled:bg-gray-300 disabled:cursor-not-allowed ${
                !isStepValid && !isViewMode && !orgLoading
                  ? "bg-gray-400"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isViewMode ? "View Only" : orgLoading ? "Loading..." : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
