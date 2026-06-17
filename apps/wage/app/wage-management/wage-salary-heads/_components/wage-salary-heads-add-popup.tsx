"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardFooter } from "@repo/ui/components/ui/card"
import { CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Separator } from "@repo/ui/components/ui/separator"
import { Filter, Search as SearchIcon, X, Check, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import SingleSelectField from "@/components/fields/single-select-field"
import { toast } from "react-toastify"
import { defaultWageSalaryHeadValues, wageSalaryHeadSchema, type WageSalaryHeadFormValues } from "./schemas/wage-salary-head-form.schema"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { useKeyclockRoleInfo } from "@/hooks/api/serach/keyclock-role-info"

interface Props {
  isOpen: boolean
  mode?: "add" | "edit"
  recordId?: string | null
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

function safeStr(value: any, fallback = ""): string {
  if (value === null || value === undefined) return fallback
  if (typeof value === "string") return value || fallback
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  return fallback
}

function safeArray(value: any): any[] {
  if (Array.isArray(value)) return value
  return []
}

function safeBoolean(value: any, fallback = false): boolean {
  if (typeof value === "boolean") return value
  return fallback
}

function normalizeWageSalaryHeadValues(value: any): WageSalaryHeadFormValues {
  return {
    name: safeStr(value?.name),
    code: safeStr(value?.code),
    excludedDays: safeArray(value?.excludedDays),
    applicableMonths: safeArray(value?.applicableMonths),
    primarySalaryHead: {
      name: safeStr(value?.primarySalaryHead?.name),
      code: safeStr(value?.primarySalaryHead?.code),
    },
    description: safeStr(value?.description),
    salaryType: (value?.salaryType === "earning" || value?.salaryType === "deduction") ? value.salaryType : "earning",
    calculationType: {
      type: (value?.calculationType?.type === "fixed" || value?.calculationType?.type === "percentage") ? value.calculationType.type : "fixed",
    },
    salaryCalculationBasis: safeStr(value?.salaryCalculationBasis),
    printable: safeBoolean(value?.printable),
  }
}

const getMsg = (err: any): string | undefined =>
  typeof err?.message === "string" ? err.message : undefined

export default function WageSalaryHeadsAddPopup({
  isOpen,
  mode = "add",
  recordId = null,
  onClose,
  onSaved,
}: Props) {
  const tenantCode = useGetTenantCode()
  const { employeeId } = useKeyclockRoleInfo()
  const [loading, setLoading] = useState(false)
  const [fetchingData, setFetchingData] = useState(false)
  const [excludedSearchField, setExcludedSearchField] = useState<"code" | "name">("name")
  const [excludedSearchTerm, setExcludedSearchTerm] = useState("")
  const [addExcludedSearchTerm, setAddExcludedSearchTerm] = useState("")
  const [addExcludedOpen, setAddExcludedOpen] = useState(false)
  const [excludedPage, setExcludedPage] = useState(1)
  const [monthSearchTerm, setMonthSearchTerm] = useState("")
  const [addMonthSearchTerm, setAddMonthSearchTerm] = useState("")
  const [addMonthOpen, setAddMonthOpen] = useState(false)
  const [monthPage, setMonthPage] = useState(1)
  const wasOpenRef = useRef(false)
  const hasFetchedRef = useRef(false)
  const pageSize = 5

  const isEditMode = mode === "edit"
  const isAddMode = mode === "add"

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    reset,
    setValue,
    watch,
    setError,
  } = useForm<WageSalaryHeadFormValues>({
    resolver: zodResolver(wageSalaryHeadSchema),
    defaultValues: defaultWageSalaryHeadValues,
  })

  const formData = watch()

  // ── API Criteria for fetching single record ────────────────────────────────────
  const searchApiCriteria = useMemo(() => {
    if (!recordId || !isEditMode) return null
    const criteria: Array<{ field: string; operator: string; value: any }> = [
      { field: "_id", operator: "eq", value: recordId },
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
    ]
    return criteria
  }, [recordId, isEditMode, tenantCode])

  // ── Fetch single record using POST search ────────────────────────────────────
  const { loading: recordLoading, refetch: fetchRecord } = useRequest<any[]>({
    url: "wageSalaryHeads/search",
    method: "POST",
    data: searchApiCriteria || [],
    dependencies: [searchApiCriteria],
    enabled: Boolean(searchApiCriteria),
    onSuccess: (data: any[]) => {
      const record = Array.isArray(data) && data.length > 0 ? data[0] : null
      if (record) {
        reset(normalizeWageSalaryHeadValues(record))
      } else if (recordId) {
        toast.error("Record not found")
        onClose()
      }
      setFetchingData(false)
    },
    onError: () => {
      toast.error("Failed to load salary head data")
      setFetchingData(false)
      onClose()
    },
  })

  // Fetch salary heads for primary head dropdown
  const salaryHeadCriteria = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "eq", value: tenantCode }] : []),
    [tenantCode],
  )
  const { data: salaryHeadData, loading: salaryHeadLoading } = useRequest<any[]>({
    url: "wageSalaryHeads/search",
    method: "POST",
    data: salaryHeadCriteria,
    dependencies: [tenantCode],
    enabled: Boolean(tenantCode),
  })

  const salaryHeadOptions = useMemo(
    () =>
      (Array.isArray(salaryHeadData) ? salaryHeadData : []).map((item: any) => ({
        value: item?.code || item?.name || "",
        label: `${item?.name || ""} `,
      })),
    [salaryHeadData],
  )

  // ── Load record when in edit mode ────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && recordId && searchApiCriteria) {
        if (!hasFetchedRef.current || !wasOpenRef.current) {
          setFetchingData(true)
          fetchRecord()
          hasFetchedRef.current = true
        }
      } else if (isAddMode) {
        reset(defaultWageSalaryHeadValues)
        hasFetchedRef.current = false
        setFetchingData(false)
      }
      setExcludedPage(1)
      setMonthPage(1)
    } else {
      hasFetchedRef.current = false
      reset(defaultWageSalaryHeadValues)
      setFetchingData(false)
    }
    wasOpenRef.current = isOpen
  }, [isOpen, isEditMode, isAddMode, recordId, searchApiCriteria])

  // Handle primary head selection
  const handlePrimaryHeadSelect = (value: string) => {
    const selected = (Array.isArray(salaryHeadData) ? salaryHeadData : []).find(
      (item: any) => (item?.code || item?.name || "") === value
    )
    if (selected) {
      setValue("primarySalaryHead", {
        name: selected.name || "",
        code: selected.code || "",
      }, { shouldValidate: isSubmitted })
    }
  }

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading && !fetchingData) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, loading, fetchingData])

  const serverFieldMap: Record<string, string> = {
    name: "name",
    code: "code",
    description: "description",
    salaryType: "salaryType",
    calculationType: "calculationType.type",
    "calculationType.type": "calculationType.type",
    salaryCalculationBasis: "salaryCalculationBasis",
    "primarySalaryHead.name": "primarySalaryHead.name",
    "primarySalaryHead.code": "primarySalaryHead.code",
    excludedDays: "excludedDays",
    applicableMonths: "applicableMonths",
  }

  const { post } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return

          const normalizedField =
            serverFieldMap[fieldName] ?? serverFieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField as any, { type: "server", message })
        })
        setLoading(false)
        return
      }

      toast.success(`Salary Head ${isEditMode ? "updated" : "created"} successfully`)
      await onSaved?.()
      setLoading(false)
      onClose()
    },
    onError: () => {
      toast.error(`Failed to ${isEditMode ? "update" : "create"} salary head`)
      setLoading(false)
    },
  })

  const onSubmit = async (data: WageSalaryHeadFormValues) => {
    setLoading(true)
    await post({
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      id: isEditMode ? recordId : null,
      collectionName: "wageSalaryHeads",
      event: "validate",
      ruleId: "wageSalaryHeadValidator",
      data: {
        ...data,
        tenantCode,
        organizationCode: tenantCode,
        updatedBy: employeeId ?? null,
        updatedOn: new Date().toISOString(),
      },
    })
  }

  const handleInvalidSubmit = () => {
    toast.error("Please fix the validation errors before saving")
  }

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading && !fetchingData) {
      onClose()
    }
  }

  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
  const excludedDayOptions = useMemo(
    () => [
      { code: "weekOffs", name: "Week Offs" },
      { code: "leaveDays", name: "Leave Days" },
      { code: "holidays", name: "Holidays" },
    ],
    [],
  )
  const monthOptions = useMemo(
    () => [
      { code: 1, name: "January" }, { code: 2, name: "February" }, { code: 3, name: "March" }, { code: 4, name: "April" },
      { code: 5, name: "May" }, { code: 6, name: "June" }, { code: 7, name: "July" }, { code: 8, name: "August" },
      { code: 9, name: "September" }, { code: 10, name: "October" }, { code: 11, name: "November" }, { code: 12, name: "December" },
    ],
    [],
  )

  const filteredExcludedSelected = useMemo(() => {
    const t = excludedSearchTerm.trim().toLowerCase()
    const selected = excludedDayOptions.filter((x) => formData.excludedDays.includes(x.code))
    if (!t) return selected
    return selected.filter((x) => (excludedSearchField === "code" ? x.code : x.name).toLowerCase().includes(t))
  }, [excludedDayOptions, formData.excludedDays, excludedSearchField, excludedSearchTerm])

  const paginatedExcludedSelected = useMemo(() => {
    const start = (excludedPage - 1) * pageSize
    return filteredExcludedSelected.slice(start, start + pageSize)
  }, [filteredExcludedSelected, excludedPage, pageSize])

  const addFilteredExcluded = useMemo(() => {
    const t = addExcludedSearchTerm.trim().toLowerCase()
    if (!t) return excludedDayOptions
    return excludedDayOptions.filter((x) => x.code.toLowerCase().includes(t) || x.name.toLowerCase().includes(t))
  }, [excludedDayOptions, addExcludedSearchTerm])

  const allAddFilteredExcludedSelected = useMemo(
    () => addFilteredExcluded.length > 0 && addFilteredExcluded.every((item) => formData.excludedDays.includes(item.code)),
    [addFilteredExcluded, formData.excludedDays],
  )

  const filteredMonthSelected = useMemo(() => {
    const t = monthSearchTerm.trim().toLowerCase()
    const selected = monthOptions.filter((x) => formData.applicableMonths.includes(x.code))
    if (!t) return selected
    return selected.filter((x) => x.name.toLowerCase().includes(t) || String(x.code).includes(t))
  }, [monthOptions, formData.applicableMonths, monthSearchTerm])

  const paginatedMonthSelected = useMemo(() => {
    const start = (monthPage - 1) * pageSize
    return filteredMonthSelected.slice(start, start + pageSize)
  }, [filteredMonthSelected, monthPage, pageSize])

  const addFilteredMonths = useMemo(() => {
    const t = addMonthSearchTerm.trim().toLowerCase()
    if (!t) return monthOptions
    return monthOptions.filter((x) => x.name.toLowerCase().includes(t) || String(x.code).includes(t))
  }, [monthOptions, addMonthSearchTerm])

  const allAddFilteredMonthsSelected = useMemo(
    () => addFilteredMonths.length > 0 && addFilteredMonths.every((item) => formData.applicableMonths.includes(item.code)),
    [addFilteredMonths, formData.applicableMonths],
  )

  const applicableMonthsError = (errors.applicableMonths as any)?.message ?? (errors.applicableMonths as any)?.root?.message
  const primaryHeadError = errors.primarySalaryHead?.code?.message ?? errors.primarySalaryHead?.name?.message

  const isLoading = fetchingData || recordLoading || salaryHeadLoading

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-3xl max-h-[90vh] flex flex-col">
        <Card className="border border-gray-200 bg-white shadow-sm flex flex-col h-full overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">
                Wage Salary Head - {isEditMode ? "Edit" : "Add New"}
              </CardTitle>
              <button
                type="button"
                onClick={onClose}
                disabled={loading || isLoading}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="px-6 py-4 overflow-y-auto flex-1">
            {isLoading && (
              <div className="py-12 text-center text-sm text-gray-600">
                Loading salary head data...
              </div>
            )}

            {!isLoading && (
              <form onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-6">

                {/* Basic Information Section */}
                <div className="space-y-3">
                  <SubFormTitle title="Basic Information" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        {...register("name")}
                        className={`${fieldStyles} bg-white ${errors.name ? "border-red-500" : ""}`}
                        placeholder="e.g., Basic Salary, HRA, DA"
                      />
                      {errors.name?.message && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Code <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        {...register("code")}
                        disabled={isEditMode}
                        className={`${fieldStyles} bg-white ${errors.code ? "border-red-500" : ""}`}
                        placeholder="e.g., SAL-BASIC, SAL-HRA"
                      />
                      {errors.code?.message && <p className="text-xs text-red-500 mt-1">{errors.code.message}</p>}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Excluded Days Section */}
                <div className="space-y-3">
                  <SubFormTitle title="Excluded Days" />
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <div className="flex bg-muted/50 rounded-lg border">
                        <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                          <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                          <Select value={excludedSearchField} onValueChange={(val) => setExcludedSearchField(val as "code" | "name")}>
                            <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium focus:ring-0 bg-transparent shadow-none">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="code">Code</SelectItem>
                              <SelectItem value="name">Name</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex-1 flex items-center bg-background rounded-r-lg">
                          <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={excludedSearchTerm}
                              onChange={(e) => {
                                setExcludedSearchTerm(e.target.value)
                                setExcludedPage(1)
                              }}
                              placeholder={`Search by ${excludedSearchField}...`}
                              className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                            />
                          </div>
                        </div>
                      </div>
                      {addExcludedOpen && (
                        <div className="absolute z-30 left-0 top-full mt-3 w-[min(720px,100%)]">
                          <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3">
                            <div className="flex bg-muted/50 rounded-lg border">
                              <div className="flex-1 flex items-center bg-background rounded-l-lg">
                                <div className="relative flex-1">
                                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    value={addExcludedSearchTerm}
                                    onChange={(e) => setAddExcludedSearchTerm(e.target.value)}
                                    placeholder="Search excluded days..."
                                    className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                                  />
                                </div>
                              </div>
                              <button type="button" onClick={() => setAddExcludedOpen(false)} className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="border rounded-lg bg-white">
                              <Command shouldFilter={false} className="rounded-lg">
                                {addFilteredExcluded.length > 0 && (
                                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (allAddFilteredExcludedSelected) {
                                          setValue(
                                            "excludedDays",
                                            formData.excludedDays.filter((code) => !addFilteredExcluded.some((option) => option.code === code)),
                                            { shouldValidate: isSubmitted },
                                          )
                                        } else {
                                          const merged = [...formData.excludedDays]
                                          addFilteredExcluded.forEach((option) => {
                                            if (!merged.includes(option.code)) merged.push(option.code)
                                          })
                                          setValue("excludedDays", merged, { shouldValidate: isSubmitted })
                                        }
                                      }}
                                      className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                                    >
                                      <Check
                                        className={`h-4 w-4 rounded-sm border ${
                                          allAddFilteredExcludedSelected
                                            ? "opacity-100 text-green-600 border-green-500"
                                            : "opacity-70 text-transparent border-gray-300"
                                        }`}
                                      />
                                      <span>Select all ({addFilteredExcluded.length})</span>
                                    </button>
                                  </div>
                                )}
                                <CommandList className="max-h-[200px]">
                                  <CommandEmpty className="py-4 text-center text-sm text-gray-500">No options found.</CommandEmpty>
                                  <CommandGroup>
                                    {addFilteredExcluded.map((item) => {
                                      const isSelected = formData.excludedDays.includes(item.code)
                                      return (
                                        <CommandItem
                                          key={item.code}
                                          value={`${item.code}-${item.name}`}
                                          onSelect={() =>
                                            setValue(
                                              "excludedDays",
                                              isSelected
                                                ? formData.excludedDays.filter((x) => x !== item.code)
                                                : [...formData.excludedDays, item.code],
                                              { shouldValidate: isSubmitted },
                                            )
                                          }
                                          className="cursor-pointer"
                                        >
                                          <Check className={`mr-2 h-4 w-4 rounded-sm border ${isSelected ? "opacity-100 text-green-600 border-green-500" : "opacity-70 text-transparent border-gray-300"}`} />
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
                    <Button type="button" onClick={() => setAddExcludedOpen((prev) => !prev)} size="default" className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
                      Add Excluded Days
                    </Button>
                  </div>

                  <div className="border rounded-lg bg-slate-50/40">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Code</TableHead>
                          <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Name</TableHead>
                          <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedExcludedSelected.length > 0 ? (
                          paginatedExcludedSelected.map((item) => (
                            <TableRow key={item.code} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                              <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">{item.code}</TableCell>
                              <TableCell className="py-1.5 text-sm text-gray-900">{item.name}</TableCell>
                              <TableCell className="py-1.5 pr-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                                  onClick={() =>
                                    setValue(
                                      "excludedDays",
                                      formData.excludedDays.filter((x) => x !== item.code),
                                      { shouldValidate: isSubmitted },
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
                              No excluded days selected. Click "Add Excluded Days" to select days.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    {filteredExcludedSelected.length > pageSize && (
                      <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                        <p className="text-[11px] text-gray-500">
                          Showing{" "}
                          <span className="font-semibold">
                            {Math.min((excludedPage - 1) * pageSize + 1, filteredExcludedSelected.length)}-
                            {Math.min(excludedPage * pageSize, filteredExcludedSelected.length)}
                          </span>{" "}
                          of <span className="font-semibold">{filteredExcludedSelected.length}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[11px]" disabled={excludedPage === 1} onClick={() => setExcludedPage((p) => Math.max(1, p - 1))}>
                            Prev
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            disabled={excludedPage * pageSize >= filteredExcludedSelected.length}
                            onClick={() => setExcludedPage((p) => (p * pageSize >= filteredExcludedSelected.length ? p : p + 1))}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Applicable Months Section */}
                <div className="space-y-3">
                  <div className="flex gap-1">
                    <SubFormTitle title="Applicable Months" />
                    <span className="text-xs text-red-500">*</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <div className="flex bg-muted/50 rounded-lg border">
                        <div className="flex-1 flex items-center bg-background rounded-l-lg">
                          <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={monthSearchTerm}
                              onChange={(e) => {
                                setMonthSearchTerm(e.target.value)
                                setMonthPage(1)
                              }}
                              placeholder="Search month..."
                              className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                            />
                          </div>
                        </div>
                      </div>
                      {addMonthOpen && (
                        <div className="absolute z-30 left-0 top-full mt-3 w-[min(720px,100%)]">
                          <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3">
                            <div className="flex bg-muted/50 rounded-lg border">
                              <div className="flex-1 flex items-center bg-background rounded-l-lg">
                                <div className="relative flex-1">
                                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    value={addMonthSearchTerm}
                                    onChange={(e) => setAddMonthSearchTerm(e.target.value)}
                                    placeholder="Search months..."
                                    className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                                  />
                                </div>
                              </div>
                              <button type="button" onClick={() => setAddMonthOpen(false)} className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="border rounded-lg bg-white">
                              <Command shouldFilter={false} className="rounded-lg">
                                {addFilteredMonths.length > 0 && (
                                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (allAddFilteredMonthsSelected) {
                                          setValue(
                                            "applicableMonths",
                                            formData.applicableMonths.filter((code) => !addFilteredMonths.some((option) => option.code === code)),
                                            { shouldValidate: isSubmitted },
                                          )
                                        } else {
                                          const merged = [...formData.applicableMonths]
                                          addFilteredMonths.forEach((option) => {
                                            if (!merged.includes(option.code)) merged.push(option.code)
                                          })
                                          setValue("applicableMonths", merged, { shouldValidate: isSubmitted })
                                        }
                                      }}
                                      className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                                    >
                                      <Check
                                        className={`h-4 w-4 rounded-sm border ${
                                          allAddFilteredMonthsSelected
                                            ? "opacity-100 text-green-600 border-green-500"
                                            : "opacity-70 text-transparent border-gray-300"
                                        }`}
                                      />
                                      <span>Select all ({addFilteredMonths.length})</span>
                                    </button>
                                  </div>
                                )}
                                <CommandList className="max-h-[200px]">
                                  <CommandEmpty className="py-4 text-center text-sm text-gray-500">No months found.</CommandEmpty>
                                  <CommandGroup>
                                    {addFilteredMonths.map((item) => {
                                      const isSelected = formData.applicableMonths.includes(item.code)
                                      return (
                                        <CommandItem
                                          key={item.code}
                                          value={`${item.code}-${item.name}`}
                                          onSelect={() =>
                                            setValue(
                                              "applicableMonths",
                                              isSelected
                                                ? formData.applicableMonths.filter((x) => x !== item.code)
                                                : [...formData.applicableMonths, item.code],
                                              { shouldValidate: isSubmitted },
                                            )
                                          }
                                          className="cursor-pointer"
                                        >
                                          <Check className={`mr-2 h-4 w-4 rounded-sm border ${isSelected ? "opacity-100 text-green-600 border-green-500" : "opacity-70 text-transparent border-gray-300"}`} />
                                          <div className="flex-1">
                                            <div className="font-medium text-sm">{item.name}</div>
                                            <div className="text-xs text-gray-500">Month: {item.code}</div>
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
                    <Button type="button" onClick={() => setAddMonthOpen((prev) => !prev)} size="default" className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
                      Add Months
                    </Button>
                  </div>

                  {applicableMonthsError && (
                    <p className="text-xs text-red-500">{applicableMonthsError}</p>
                  )}

                  <div className={`border rounded-lg bg-slate-50/40 ${applicableMonthsError ? "border-red-500" : ""}`}>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Month No</TableHead>
                          <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Month Name</TableHead>
                          <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedMonthSelected.length > 0 ? (
                          paginatedMonthSelected.map((item) => (
                            <TableRow key={item.code} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                              <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">{item.code}</TableCell>
                              <TableCell className="py-1.5 text-sm text-gray-900">{item.name}</TableCell>
                              <TableCell className="py-1.5 pr-4 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  type="button"
                                  className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                                  onClick={() =>
                                    setValue(
                                      "applicableMonths",
                                      formData.applicableMonths.filter((x) => x !== item.code),
                                      { shouldValidate: isSubmitted },
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
                              No applicable months selected. Click "Add Months" to select months.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    {filteredMonthSelected.length > pageSize && (
                      <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                        <p className="text-[11px] text-gray-500">
                          Showing{" "}
                          <span className="font-semibold">
                            {Math.min((monthPage - 1) * pageSize + 1, filteredMonthSelected.length)}-
                            {Math.min(monthPage * pageSize, filteredMonthSelected.length)}
                          </span>{" "}
                          of <span className="font-semibold">{filteredMonthSelected.length}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[11px]" disabled={monthPage === 1} onClick={() => setMonthPage((p) => Math.max(1, p - 1))}>
                            Prev
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            disabled={monthPage * pageSize >= filteredMonthSelected.length}
                            onClick={() => setMonthPage((p) => (p * pageSize >= filteredMonthSelected.length ? p : p + 1))}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Primary Head Information Section */}
                <div className="space-y-3">
                  <SubFormTitle title="Primary Head Information" />
                  <SingleSelectField
                    label="Primary Salary Head"
                    placeholder="Select Primary Salary Head"
                    value={formData.primarySalaryHead.code || ""}
                    onChange={handlePrimaryHeadSelect}
                    options={salaryHeadOptions}
                    required={true}
                    disabled={salaryHeadLoading}
                  />
                  {primaryHeadError && <p className="text-xs text-red-500">{primaryHeadError}</p>}
                  {formData.primarySalaryHead.name && formData.primarySalaryHead.code && (
                    <div className="mt-2 p-2 bg-slate-50 rounded-md border border-slate-200">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-medium text-gray-600">Selected:</span>
                        <span className="text-gray-900">{formData.primarySalaryHead.name} ({formData.primarySalaryHead.code})</span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Configuration Section */}
                <div className="space-y-3">
                  <SubFormTitle title="Configuration" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Salary Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.salaryType}
                        onValueChange={(v) => setValue("salaryType", v as "earning" | "deduction", { shouldValidate: isSubmitted })}
                      >
                        <SelectTrigger className={`${fieldStyles} bg-white ${errors.salaryType ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Select Salary Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="earning">Earning</SelectItem>
                          <SelectItem value="deduction">Deduction</SelectItem>
                        </SelectContent>
                      </Select>
                      {getMsg(errors.salaryType) && <p className="text-xs text-red-500 mt-1">{getMsg(errors.salaryType)}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Calculation Type <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.calculationType.type}
                        onValueChange={(v) => setValue("calculationType", { type: v as "fixed" | "percentage" }, { shouldValidate: isSubmitted })}
                      >
                        <SelectTrigger className={`${fieldStyles} bg-white ${errors.calculationType?.type ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Select Calculation Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">Fixed</SelectItem>
                          <SelectItem value="percentage">Percentage</SelectItem>
                        </SelectContent>
                      </Select>
                      {getMsg(errors.calculationType?.type) && <p className="text-xs text-red-500 mt-1">{getMsg(errors.calculationType?.type)}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Salary Calculation Basis <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      {...register("salaryCalculationBasis")}
                      className={`${fieldStyles} bg-white ${errors.salaryCalculationBasis ? "border-red-500" : ""}`}
                      placeholder="e.g., Basic Salary, Gross Salary, CTC"
                    />
                    {errors.salaryCalculationBasis?.message && <p className="text-xs text-red-500 mt-1">{errors.salaryCalculationBasis.message}</p>}
                  </div>

                  {/* Description Field */}
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Description
                    </Label>
                    <textarea
                      {...register("description")}
                      className={`w-full rounded-md border ${errors.description ? "border-red-500" : "border-gray-300"} px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition bg-white min-h-[80px] resize-y`}
                      placeholder="Enter a description for this salary head (optional)"
                      rows={3}
                    />
                    {errors.description?.message && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="printable"
                      checked={formData.printable}
                      onCheckedChange={(v) => setValue("printable", v === true, { shouldValidate: isSubmitted })}
                    />
                    <Label htmlFor="printable" className="text-sm font-normal cursor-pointer">
                      Printable in Pay Slip
                    </Label>
                  </div>
                </div>

              </form>
            )}
          </CardContent>

          <CardFooter className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-3">
            <ActionButtons
              layout="end"
              gap="gap-3"
              secondaryLabel="Cancel"
              onSecondary={onClose}
              primaryLabel="Save Changes"
              onPrimary={handleSubmit(onSubmit, handleInvalidSubmit)}
              primaryLoading={loading}
              primaryDisabled={loading || isLoading}
              secondaryDisabled={loading || isLoading}
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
