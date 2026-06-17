"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { GitBranch, X, Check, Search as SearchIcon, Trash2, Filter } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@repo/ui/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import SingleSelectField from "@/components/fields/single-select-field"
import { createAreaSchema } from "./area-form-schema"

interface AreaFormData {
  areaCode?: string
  areaName?: string
  parentArea?: string[] | string
  areaDescription?: string
  subsidiaryCode: string
}

interface AreaFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onAddSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type AreaFormField =
  | "areaCode"
  | "areaName"
  | "parentArea"
  | "areaDescription"
  | "subsidiaryCode"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"
const TEXTAREA_CLASS = "min-h-[96px] border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500 resize-none"

export default function AreaAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onAddSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: AreaFormModalProps) {
  const tenantCode = useGetTenantCode()
  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const [selectedSubsidiaryCode, setSelectedSubsidiaryCode] = useState<string>("")
  const [selectedParentArea, setSelectedParentArea] = useState<string[]>([])
  const [addParentAreaOpen, setAddParentAreaOpen] = useState(false)
  const [parentAreaSearchTerm, setParentAreaSearchTerm] = useState("")
  const [addParentAreaSearchTerm, setAddParentAreaSearchTerm] = useState("")
  const [parentAreaSearchField, setParentAreaSearchField] = useState<"code" | "name">("name")
  const [parentAreaPage, setParentAreaPage] = useState(1)

  const { arrayData: subsidiariesArray, refetch: refetchSubsidiaries } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subsidiaries",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const { arrayData: areasArray, refetch: refetchAreas } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "areas",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  useEffect(() => {
    if (!tenantCode) return
    void refetchSubsidiaries()
    void refetchAreas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  const subsidiaryOptions = useMemo(
    () =>
      (subsidiariesArray || []).map((subsidiary: any) => ({
        label: `${subsidiary.subsidiaryName} (${subsidiary.subsidiaryCode})`,
        value: subsidiary.subsidiaryCode,
      })),
    [subsidiariesArray]
  )

  const parentAreaOptions = useMemo(() => {
    const currentAreaCode = editData?.areaCode
    return (areasArray || [])
      .filter((area: any) => area.subsidiaryCode === selectedSubsidiaryCode)
      .filter((area: any) => area.areaCode !== currentAreaCode)
      .map((area: any) => ({
        code: area.areaCode,
        name: area.areaName || "",
      }))
  }, [areasArray, selectedSubsidiaryCode, editData?.areaCode])

  const schema = useMemo(
    () => createAreaSchema({}, isEditMode || false, editData),
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
  } = useForm<AreaFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      areaCode: "",
      areaName: "",
      parentArea: [],
      areaDescription: "",
      subsidiaryCode: "",
    },
  })

  const resetAreaFormState = () => {
    reset()
    setSelectedSubsidiaryCode("")
    setSelectedParentArea([])
    setAddParentAreaOpen(false)
    setParentAreaSearchTerm("")
    setAddParentAreaSearchTerm("")
    setParentAreaSearchField("name")
    setParentAreaPage(1)
  }

  useEffect(() => {
    if (!deleteValue?.areaCode) return
    void handleDeleteItem(deleteValue.areaCode)
  }, [deleteValue])

  const { post: postArea, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, AreaFormField> = {
          areaCode: "areaCode",
          areaName: "areaName",
          parentArea: "parentArea",
          areaDescription: "areaDescription",
          subsidiaryCode: "subsidiaryCode",
        }

        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField = fieldMap[fieldName] ?? fieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField as any, { type: "server", message })
        })
        return
      }

      if (isEditMode) {
        toast.success("Area submitted successfully!")
      } else {
        onAddSuccess?.()
      }
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      resetAreaFormState()
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Area submission failed!")
      console.error("POST error:", error)
    },
  })

  const handleDeleteItem = async (areaCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          areas: [{ areaCode }],
        },
      }
      // postArea(postData)
      void postData
    } catch (error) {
      console.error("Error deleting area:", error)
    }
  }

  useEffect(() => {
    if (isEditMode && editData) {
      const existingParentArea = Array.isArray(editData.parentArea)
        ? editData.parentArea.filter((code: unknown): code is string => typeof code === "string")
        : typeof editData.parentArea === "string" && editData.parentArea.trim()
          ? [editData.parentArea]
          : []
      setValue("areaCode", editData.areaCode || "")
      setValue("areaName", editData.areaName || "")
      setValue("parentArea", existingParentArea)
      setValue("areaDescription", editData.areaDescription || "")
      setValue("subsidiaryCode", editData.subsidiaryCode || "")
      setSelectedSubsidiaryCode(editData.subsidiaryCode || "")
      setSelectedParentArea(existingParentArea)
    } else if (open && !isEditMode) {
      resetAreaFormState()
    }
  }, [isEditMode, editData, setValue, open])

  const handleFormSubmit = async (data: AreaFormData) => {
    try {
      clearErrors()
      const payloadArea = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
        subsidiaryCode: selectedSubsidiaryCode,
        parentArea: selectedParentArea.length > 0 ? selectedParentArea : null,
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "areaValidator",
        data: {
          areas: [payloadArea],
        },
      }
      postArea(postData)
    } catch (error) {
      console.error("Error processing area:", error)
    }
  }

  const handleSubsidiarySelect = (subsidiaryCode: string) => {
    setSelectedSubsidiaryCode(subsidiaryCode)
    setValue("subsidiaryCode", subsidiaryCode)
    setSelectedParentArea([])
    setValue("parentArea", [])
    setParentAreaPage(1)
  }

  const handleParentAreaSelect = (areaCode: string) => {
    const next = selectedParentArea.includes(areaCode)
      ? selectedParentArea.filter((code) => code !== areaCode)
      : [...selectedParentArea, areaCode]
    setSelectedParentArea(next)
    setValue("parentArea", next)
  }

  const selectedParentAreaItems = useMemo(() => {
    return selectedParentArea.map((code) => {
      const found = parentAreaOptions.find((item) => item.code === code)
      return { code, name: found?.name || "Unknown" }
    })
  }, [selectedParentArea, parentAreaOptions])

  const availableParentAreaOptions = useMemo(
    () => parentAreaOptions.filter((item) => !selectedParentArea.includes(item.code)),
    [parentAreaOptions, selectedParentArea]
  )

  const pageSize = 5

  const filteredSelectedParentAreas = useMemo(() => {
    const q = parentAreaSearchTerm.toLowerCase().trim()
    if (!q) return selectedParentAreaItems
    return selectedParentAreaItems.filter((item) => {
      if (parentAreaSearchField === "code") return item.code.toLowerCase().includes(q)
      return item.name.toLowerCase().includes(q)
    })
  }, [selectedParentAreaItems, parentAreaSearchTerm, parentAreaSearchField])

  const paginatedSelectedParentAreas = useMemo(() => {
    const start = (parentAreaPage - 1) * pageSize
    return filteredSelectedParentAreas.slice(start, start + pageSize)
  }, [filteredSelectedParentAreas, parentAreaPage])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredSelectedParentAreas.length / pageSize))
    if (parentAreaPage > maxPage) setParentAreaPage(maxPage)
  }, [filteredSelectedParentAreas.length, parentAreaPage])

  useEffect(() => {
    if (addParentAreaOpen) setAddParentAreaSearchTerm("")
  }, [addParentAreaOpen])

  const addFilteredParentAreaOptions = useMemo(() => {
    const q = addParentAreaSearchTerm.toLowerCase().trim()
    if (!q) return availableParentAreaOptions
    return availableParentAreaOptions.filter((item) => {
      if (parentAreaSearchField === "code") return item.code.toLowerCase().includes(q)
      return item.name.toLowerCase().includes(q)
    })
  }, [availableParentAreaOptions, addParentAreaSearchTerm, parentAreaSearchField])

  const allAddFilteredSelected =
    addFilteredParentAreaOptions.length > 0 &&
    addFilteredParentAreaOptions.every((item) => selectedParentArea.includes(item.code))

  const handleCancel = () => {
    resetAreaFormState()
    setOpen(false)
  }

  return open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<AreaFormData>)} className="w-full h-full flex flex-col overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <GitBranch className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {isEditMode ? "Edit Area" : "Add New Area"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {isEditMode ? "Update area information." : "Create a new area entry."}
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
            <div className="space-y-3 mb-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="areaCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Area Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="areaCode"
                    {...register("areaCode")}
                    placeholder="Enter area code"
                    className={`${INPUT_CLASS} ${errors.areaCode?.message ? "border-red-500" : ""}`}
                    disabled={isEditMode}
                  />
                  {errors.areaCode?.message && <p className="text-xs text-red-500">{errors.areaCode.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="areaName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Area Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="areaName"
                    {...register("areaName")}
                    placeholder="Enter area name"
                    className={`${INPUT_CLASS} ${errors.areaName?.message ? "border-red-500" : ""}`}
                  />
                  {errors.areaName?.message && <p className="text-xs text-red-500">{errors.areaName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="areaDescription" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Description
                </Label>
                <Textarea
                  id="areaDescription"
                  {...register("areaDescription")}
                  placeholder="Enter area description"
                  rows={3}
                  className={TEXTAREA_CLASS}
                />
              </div>
            </div>

            <div className="border-t border-gray-200 mt-4  space-y-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Area Assignment</h4>
                <p className="text-xs text-gray-500 mt-0.5">Assign subsidiary and parent area.</p>
              </div>

              <div className="space-y-2">
                {subsidiaryOptions.length === 0 ? (
                  <div className="w-full px-3 py-2 rounded-md border border-red-300 bg-red-50 text-sm text-red-600">
                    No subsidiaries available
                  </div>
                ) : (
                  <SingleSelectField
                    label="Subsidiary"
                    required
                    placeholder="Select a subsidiary"
                    value={selectedSubsidiaryCode}
                    onChange={handleSubsidiarySelect}
                    options={subsidiaryOptions}
                    errorMessage={typeof errors.subsidiaryCode?.message === "string" ? errors.subsidiaryCode.message : undefined}
                  />
                )}
              </div>

              <div className="space-y-2">
                {!selectedSubsidiaryCode ? (
                  <div className="w-full px-3 py-2 rounded-md border border-gray-300 bg-gray-50 text-sm text-gray-500">
                    First select a subsidiary
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Parent Area</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <div className="flex bg-muted/50 rounded-lg border">
                          <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                            <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                            <Select
                              value={parentAreaSearchField}
                              onValueChange={(val: "code" | "name") => setParentAreaSearchField(val)}
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
                                placeholder={`Search by ${parentAreaSearchField === "code" ? "code" : "name"}...`}
                                value={parentAreaSearchTerm}
                                onChange={(e) => setParentAreaSearchTerm(e.target.value)}
                                className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                              />
                            </div>
                          </div>
                        </div>

                        {addParentAreaOpen && (
                          <div className="absolute z-30 left-0 top-full mt-3 w-[min(720px,100%)]">
                            <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3">
                              <div className="flex bg-muted/50 rounded-lg border">
                                <div className="flex-1 flex items-center bg-background rounded-l-lg">
                                  <div className="relative flex-1">
                                    <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                      type="text"
                                      placeholder={`Search by ${parentAreaSearchField === "code" ? "code" : "name"}...`}
                                      value={addParentAreaSearchTerm}
                                      onChange={(e) => setAddParentAreaSearchTerm(e.target.value)}
                                      className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                                    />
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setAddParentAreaOpen(false)}
                                  className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                                  aria-label="Close"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="border rounded-lg bg-white">
                                <Command shouldFilter={false} className="rounded-lg">
                                  {addFilteredParentAreaOptions.length > 0 && (
                                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (allAddFilteredSelected) {
                                            setValue(
                                              "parentArea",
                                              selectedParentArea.filter(
                                                (code: string) =>
                                                  !addFilteredParentAreaOptions.some((option) => option.code === code)
                                              )
                                            )
                                            setSelectedParentArea(
                                              selectedParentArea.filter(
                                                (code: string) =>
                                                  !addFilteredParentAreaOptions.some((option) => option.code === code)
                                              )
                                            )
                                          } else {
                                            const merged = [...selectedParentArea]
                                            addFilteredParentAreaOptions.forEach((option) => {
                                              if (!merged.includes(option.code)) merged.push(option.code)
                                            })
                                            setValue("parentArea", merged)
                                            setSelectedParentArea(merged)
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
                                        <span>Select all ({addFilteredParentAreaOptions.length})</span>
                                      </button>
                                    </div>
                                  )}
                                  <CommandList className="max-h-[200px]">
                                    <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                                      No parent areas found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {addFilteredParentAreaOptions.map((item) => {
                                        const isSelected = selectedParentArea.includes(item.code)
                                        return (
                                          <CommandItem
                                            key={item.code}
                                            value={`${item.code}-${item.name}`}
                                            onSelect={() => handleParentAreaSelect(item.code)}
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
                        onClick={() => setAddParentAreaOpen((prev) => !prev)}
                        size="default"
                        className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                      >
                        Add Parent Area
                      </Button>
                    </div>

                    <div className="border rounded-lg bg-slate-50/40">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50 hover:bg-slate-50">
                            <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                              Parent Area Code
                            </TableHead>
                            <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                              Parent Area Name
                            </TableHead>
                            <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedSelectedParentAreas.length > 0 ? (
                            paginatedSelectedParentAreas.map((item) => (
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
                                    onClick={() => handleParentAreaSelect(item.code)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="py-8 text-center text-sm text-gray-500">
                                No parent areas selected. Click &quot;Add Parent Area&quot; to select parent areas.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                      {filteredSelectedParentAreas.length > pageSize && (
                        <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                          <p className="text-[11px] text-gray-500">
                            Showing{" "}
                            <span className="font-semibold">
                              {Math.min((parentAreaPage - 1) * pageSize + 1, filteredSelectedParentAreas.length)}-
                              {Math.min(parentAreaPage * pageSize, filteredSelectedParentAreas.length)}
                            </span>{" "}
                            of <span className="font-semibold">{filteredSelectedParentAreas.length}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[11px]"
                              disabled={parentAreaPage === 1}
                              onClick={() => setParentAreaPage((p) => Math.max(1, p - 1))}
                            >
                              Prev
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-[11px]"
                              disabled={parentAreaPage * pageSize >= filteredSelectedParentAreas.length}
                              onClick={() =>
                                setParentAreaPage((p) =>
                                  p * pageSize >= filteredSelectedParentAreas.length ? p : p + 1
                                )
                              }
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                    {typeof errors.parentArea?.message === "string" && (
                      <p className="text-red-500 text-xs">{errors.parentArea.message}</p>
                    )}
                  </div>
                )}
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
              disabled={isSubmitting || postLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSubmitting || postLoading}
            >
              {postLoading ? "Saving..." : isEditMode ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  ) : null
}
