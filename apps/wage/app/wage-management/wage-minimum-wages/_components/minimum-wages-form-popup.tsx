"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { X, Trash2, Filter, Search as SearchIcon, Check } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useAggregateArrayFetch } from "@/hooks/api/serach/use-aggregate-array-fetch"
import { toast } from "react-toastify"
import ActionButtons from "@/components/fields/buttons/action-buttons"
import SingleSelectField from "@/components/fields/single-select-field"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { Button } from "@repo/ui/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@repo/ui/components/ui/command"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { defaultMinimumWagesPopupValues, minimumWagesPopupSchema, type MinimumWagesPopupValues } from "./schemas/minimum-wages-popup.schema"
import type { MinimumWagesRow } from "./hooks/useMinimumwageSlogic"

const serverFieldMap: Record<string, string> = {
  country: "country",
  state: "state",
  zone: "zone",
  location: "location",
  effectiveFrom: "effectiveFrom",
  remark: "remark",
  "skillLevel.skilledLevelTitle": "skillLevel.skilledLevelTitle",
  "skillLevel.skilledLevelDescription": "skillLevel.skilledLevelDescription",
  skilledLevelTitle: "skillLevel.skilledLevelTitle",
}

type Mode = "add" | "edit" | "view"

type Props = {
  isOpen: boolean
  mode: Mode
  initialValues?: MinimumWagesRow["raw"]
  tenantCode?: string
  employeeId?: string | null
  rowId?: string | null
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

export default function MinimumWagesFormPopup({
  isOpen,
  mode,
  initialValues,
  tenantCode,
  employeeId,
  rowId,
  onClose,
  onSaved,
}: Props) {
  const isViewMode = mode === "view"
  const [loading, setLoading] = useState(false)

  const zoneOptions = [
    { value: "Zone 1", label: "Zone 1" },
    { value: "Zone 2", label: "Zone 2" },
    { value: "Zone 3", label: "Zone 3" },
    { value: "Zone 4", label: "Zone 4" },
  ]

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    reset,
    setValue,
    watch,
    setError,
  } = useForm<MinimumWagesPopupValues>({
    resolver: zodResolver(minimumWagesPopupSchema),
    defaultValues: defaultMinimumWagesPopupValues,
  })

  const formData = watch()

  useEffect(() => {
    if (!isOpen) return
    reset({
      ...defaultMinimumWagesPopupValues,
      country: initialValues?.country ?? "INDIA",
      state: initialValues?.state ?? "",
      zone: initialValues?.zone ?? "",
      location: Array.isArray(initialValues?.location) ? initialValues.location : [],
      skillLevel: {
        skilledLevelTitle: initialValues?.skillLevel?.skilledLevelTitle ?? "",
        skilledLevelDescription: initialValues?.skillLevel?.skilledLevelDescription ?? "",
      },
      effectiveFrom: initialValues?.effectiveFrom ?? "",
      remark: initialValues?.remark ?? "",
    })
  }, [isOpen, initialValues])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) onClose()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose, loading])

  const orgCriteria = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode],
  )
  const { arrayData: countryArray } = useAggregateArrayFetch<any>({ collection: "organization", criteriaRequests: orgCriteria, arrayField: "country", enabled: Boolean(tenantCode), defaultValue: [] })
  const { arrayData: stateArray } = useAggregateArrayFetch<any>({ collection: "organization", criteriaRequests: orgCriteria, arrayField: "state", enabled: Boolean(tenantCode), defaultValue: [] })
  const { arrayData: skillLevelsArray } = useAggregateArrayFetch<any>({ collection: "organization", criteriaRequests: orgCriteria, arrayField: "skillLevels", enabled: Boolean(tenantCode), defaultValue: [] })
  const { arrayData: locationArray } = useAggregateArrayFetch<any>({ collection: "organization", criteriaRequests: orgCriteria, arrayField: "location", enabled: Boolean(tenantCode), defaultValue: [] })

  const countryOptions = useMemo(() => (countryArray || []).map((x: any) => ({ value: x.countryCode, label: x.countryName })), [countryArray])
  const stateOptions = useMemo(() => (stateArray || []).map((x: any) => ({ value: x.stateName || x.stateCode, label: x.stateName || x.stateCode })), [stateArray])
  const skillLevelOptions = useMemo(
    () =>
      (skillLevelsArray || []).map((o: any) => ({
        value: o.title || o.skilledLevelTitle || "",
        label: o.title || o.skilledLevelTitle || "",
        tooltip: o.title || o.skilledLevelTitle || "",
      })),
    [skillLevelsArray],
  )
  const locationOptions = useMemo(
    () =>
      (locationArray || []).map((x: any) => ({
        code: x.locationCode || x.code || x.locationName || "",
        name: x.locationName || x.name || x.locationCode || "",
      })),
    [locationArray],
  )

  const [locationSearchField, setLocationSearchField] = useState<"code" | "name">("name")
  const [locationSearchTerm, setLocationSearchTerm] = useState("")
  const [addLocationSearchTerm, setAddLocationSearchTerm] = useState("")
  const [addLocationOpen, setAddLocationOpen] = useState(false)
  const [locationPage, setLocationPage] = useState(1)
  const pageSize = 5

  const selectedLocationItems = useMemo(
    () => formData.location.map((code) => {
      const found = locationOptions.find((item) => item.code === code)
      return { code, name: found?.name || code }
    }),
    [formData.location, locationOptions],
  )

  const availableLocationOptions = useMemo(
    () => locationOptions.filter((item) => !formData.location.includes(item.code)),
    [locationOptions, formData.location],
  )

  const filteredSelectedLocations = useMemo(() => {
    const q = locationSearchTerm.toLowerCase().trim()
    if (!q) return selectedLocationItems
    return selectedLocationItems.filter((item) =>
      locationSearchField === "code" ? item.code.toLowerCase().includes(q) : item.name.toLowerCase().includes(q),
    )
  }, [selectedLocationItems, locationSearchTerm, locationSearchField])

  const paginatedSelectedLocations = useMemo(() => {
    const start = (locationPage - 1) * pageSize
    return filteredSelectedLocations.slice(start, start + pageSize)
  }, [filteredSelectedLocations, locationPage])

  const addFilteredLocationOptions = useMemo(() => {
    const q = addLocationSearchTerm.toLowerCase().trim()
    if (!q) return availableLocationOptions
    return availableLocationOptions.filter((item) =>
      locationSearchField === "code" ? item.code.toLowerCase().includes(q) : item.name.toLowerCase().includes(q),
    )
  }, [availableLocationOptions, addLocationSearchTerm, locationSearchField])

  const allAddFilteredSelected =
    addFilteredLocationOptions.length > 0 &&
    addFilteredLocationOptions.every((item) => formData.location.includes(item.code))

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredSelectedLocations.length / pageSize))
    if (locationPage > maxPage) setLocationPage(maxPage)
  }, [filteredSelectedLocations.length, locationPage])

  const { post } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const responseData =
        response?.data && typeof response.data === "object" ? response.data : response
      const status = (responseData as any)?.status

      if (status === false) {
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField =
            serverFieldMap[fieldName] ?? serverFieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField as any, { type: "server", message })
        })
        const firstMsg = Object.entries(responseData || {}).find(
          ([k, v]) => k !== "status" && typeof v === "string" && v,
        )?.[1]
        toast.error(typeof firstMsg === "string" ? firstMsg : "Please fix highlighted fields.")
        setLoading(false)
        return
      }

      toast.success(`Minimum Wages ${mode === "edit" ? "updated" : "created"} successfully`)
      await onSaved?.()
      onClose()
      setLoading(false)
    },
    onError: () => {
      toast.error(`Failed to ${mode === "edit" ? "update" : "create"} minimum wages`)
      onClose()
      setLoading(false)
    },
  })

  const onSubmit = async (data: MinimumWagesPopupValues) => {
    setLoading(true)
    await post({
      tenant: tenantCode,
      action: "insert",
      id: mode === "edit" ? rowId || null : null,
      event: "validate",
      collectionName: "wageMinimumWages",
      ruleId: "wageMinimumWagesValidator",
      data: {
        ...data,
        tenantCode,
        organizationCode: tenantCode,
        updatedOn: new Date().toISOString(),
        updatedBy: employeeId ?? null,
      },
    })
  }

  const handleInvalidSubmit = () => {
    toast.error("Please fix the validation errors before saving")
  }

  const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
  const locationError = (errors.location as any)?.message
  const skillTitleError = errors.skillLevel?.skilledLevelTitle?.message

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-4xl flex flex-col">
        <Card className="w-full max-h-[90vh] flex flex-col overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">
                Minimum Wages - {mode === "add" ? "Add New" : mode === "edit" ? "Edit" : "View"}
              </CardTitle>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
            <form onSubmit={handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-6">

              {/* Basic Information Section */}
              <div className="space-y-3">
                <SubFormTitle title="Basic Information" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <SingleSelectField
                      label="Country"
                      value={formData.country}
                      options={countryOptions}
                      disabled={isViewMode}
                      onChange={(v) => setValue("country", v, { shouldValidate: isSubmitted })}
                    />
                    {errors.country?.message && <p className="text-xs text-red-500 mt-1">{errors.country.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <SingleSelectField
                      label="State"
                      value={formData.state}
                      options={stateOptions}
                      disabled={isViewMode}
                      onChange={(v) => setValue("state", v, { shouldValidate: isSubmitted })}
                    />
                    {errors.state?.message && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <SingleSelectField
                      id="skilledLevelTitle"
                      label="Skill Level"
                      required
                      placeholder="Select Skill Level"
                      disabled={isViewMode}
                      value={formData.skillLevel.skilledLevelTitle}
                      onChange={(value) => {
                        const found = (skillLevelsArray || []).find(
                          (o: any) => (o.title || o.skilledLevelTitle || "") === value,
                        )
                        setValue("skillLevel", {
                          skilledLevelTitle: value,
                          skilledLevelDescription: found?.description || found?.skilledLevelDescription || "",
                        }, { shouldValidate: isSubmitted })
                      }}
                      options={skillLevelOptions}
                      showOnlyValueInTrigger
                      allowOnlyProvidedOptions
                      errorMessage={skillTitleError}
                    />
                  </div>
                </div>
              </div>

              {/* Location Details Section */}
              <div className="space-y-3">
                <SubFormTitle title="Location Details" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700">
                      ZONE <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.zone}
                      onValueChange={(v) => setValue("zone", v, { shouldValidate: isSubmitted })}
                      disabled={isViewMode}
                    >
                      <SelectTrigger className={`${fieldStyles} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${errors.zone ? "border-red-500" : ""}`}>
                        <SelectValue placeholder="Select Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {zoneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.zone?.message && <p className="text-xs text-red-500 mt-1">{errors.zone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700">
                      EFFECTIVE FROM <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      type="date"
                      {...register("effectiveFrom")}
                      value={formData.effectiveFrom}
                      disabled={isViewMode}
                      onChange={(e) => setValue("effectiveFrom", e.target.value, { shouldValidate: isSubmitted })}
                      className={`${fieldStyles} ${isViewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"} ${errors.effectiveFrom ? "border-red-500" : ""}`}
                    />
                    {errors.effectiveFrom?.message && <p className="text-xs text-red-500 mt-1">{errors.effectiveFrom.message}</p>}
                  </div>
                </div>

                <div className="space-y-3 md:col-span-2 pt-1">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Locations <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <div className="flex bg-muted/50 rounded-lg border">
                        <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                          <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                          <Select value={locationSearchField} onValueChange={(val: "code" | "name") => setLocationSearchField(val)}>
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
                              placeholder={`Search by ${locationSearchField === "code" ? "code" : "name"}...`}
                              value={locationSearchTerm}
                              onChange={(e) => setLocationSearchTerm(e.target.value)}
                              className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                            />
                          </div>
                        </div>
                      </div>
                      {addLocationOpen && !isViewMode && (
                        <div className="absolute z-30 left-0 top-full mt-3 w-[min(720px,100%)]">
                          <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3">
                            <div className="flex bg-muted/50 rounded-lg border">
                              <div className="flex-1 flex items-center bg-background rounded-l-lg">
                                <div className="relative flex-1">
                                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    type="text"
                                    placeholder={`Search by ${locationSearchField === "code" ? "code" : "name"}...`}
                                    value={addLocationSearchTerm}
                                    onChange={(e) => setAddLocationSearchTerm(e.target.value)}
                                    className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                                  />
                                </div>
                              </div>
                              <button type="button" onClick={() => setAddLocationOpen(false)} className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="border rounded-lg bg-white">
                              <Command shouldFilter={false} className="rounded-lg">
                                {addFilteredLocationOptions.length > 0 && (
                                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (allAddFilteredSelected) {
                                          setValue("location", formData.location.filter((code) => !addFilteredLocationOptions.some((opt) => opt.code === code)), { shouldValidate: isSubmitted })
                                        } else {
                                          const merged = [...formData.location]
                                          addFilteredLocationOptions.forEach((opt) => { if (!merged.includes(opt.code)) merged.push(opt.code) })
                                          setValue("location", merged, { shouldValidate: isSubmitted })
                                        }
                                      }}
                                      className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                                    >
                                      <Check className={`h-4 w-4 rounded-sm border ${allAddFilteredSelected ? "opacity-100 text-green-600 border-green-500" : "opacity-70 text-transparent border-gray-300"}`} />
                                      <span>Select all ({addFilteredLocationOptions.length})</span>
                                    </button>
                                  </div>
                                )}
                                <CommandList className="max-h-[200px]">
                                  <CommandEmpty className="py-4 text-center text-sm text-gray-500">No locations found.</CommandEmpty>
                                  <CommandGroup>
                                    {addFilteredLocationOptions.map((item) => {
                                      const isSelected = formData.location.includes(item.code)
                                      return (
                                        <CommandItem
                                          key={item.code}
                                          value={`${item.code}-${item.name}`}
                                          onSelect={() =>
                                            setValue(
                                              "location",
                                              isSelected
                                                ? formData.location.filter((code) => code !== item.code)
                                                : [...formData.location, item.code],
                                              { shouldValidate: isSubmitted },
                                            )
                                          }
                                          className="cursor-pointer"
                                        >
                                          <Check className={`mr-2 h-4 w-4 rounded-sm border ${isSelected ? "opacity-100 text-green-600 border-green-500" : "opacity-70 text-transparent border-gray-300"}`} />
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
                      <Button type="button" onClick={() => setAddLocationOpen((prev) => !prev)} size="default" className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
                        Add Locations
                      </Button>
                    )}
                  </div>
                  {locationError && <p className="text-red-500 text-xs">{locationError}</p>}
                  <div className={`border rounded-lg bg-slate-50/40 ${locationError ? "border-red-500" : ""}`}>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Location Code</TableHead>
                          <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">Location Name</TableHead>
                          {!isViewMode && <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">Actions</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSelectedLocations.length > 0 ? (
                          paginatedSelectedLocations.map((item) => (
                            <TableRow key={item.code} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                              <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">{item.code}</TableCell>
                              <TableCell className="py-1.5 text-sm text-gray-900">{item.name}</TableCell>
                              {!isViewMode && (
                                <TableCell className="py-1.5 pr-4 text-right">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                                    onClick={() => setValue("location", formData.location.filter((code) => code !== item.code), { shouldValidate: isSubmitted })}
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
                              No locations selected. Click "Add Locations" to select locations.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                    {filteredSelectedLocations.length > pageSize && (
                      <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                        <p className="text-[11px] text-gray-500">
                          Showing <span className="font-semibold">{Math.min((locationPage - 1) * pageSize + 1, filteredSelectedLocations.length)}-{Math.min(locationPage * pageSize, filteredSelectedLocations.length)}</span> of <span className="font-semibold">{filteredSelectedLocations.length}</span>
                        </p>
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[11px]" disabled={locationPage === 1} onClick={() => setLocationPage((p) => Math.max(1, p - 1))}>Prev</Button>
                          <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-[11px]" disabled={locationPage * pageSize >= filteredSelectedLocations.length} onClick={() => setLocationPage((p) => (p * pageSize >= filteredSelectedLocations.length ? p : p + 1))}>Next</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Remarks</Label>
                  <textarea
                    {...register("remark")}
                    disabled={isViewMode}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 shadow-sm resize-none transition mb-0"
                    placeholder="Additional notes or comments..."
                    rows={3}
                  />
                </div>
              </div>

            </form>
          </CardContent>

          <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
            <ActionButtons
              layout="end"
              secondaryLabel="Cancel"
              onSecondary={onClose}
              primaryLabel={isViewMode ? "Close" : "Save Changes"}
              onPrimary={isViewMode ? onClose : handleSubmit(onSubmit, handleInvalidSubmit)}
              primaryLoading={loading}
              primaryDisabled={loading}
              secondaryDisabled={loading}
              className="w-full"
              primaryClassName={isViewMode ? "bg-gray-600 hover:bg-gray-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
              secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
