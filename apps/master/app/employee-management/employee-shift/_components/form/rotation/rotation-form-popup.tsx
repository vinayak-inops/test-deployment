"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/components/ui/command"
import { Clock, X, Users, Search, ChevronsUpDown } from "lucide-react"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { rotationSchema, EMPTY_ROTATION, type RotationItem } from "../../schemas/rotation-form-schema"
import { useEmployeeShiftGraphql } from "@/hooks/api/useEmployeeShiftGraphql"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

interface RotationFormPopupProps {
  open: boolean
  onClose: () => void
  /** null = Add mode, otherwise Edit mode with this rotation */
  initialRotation: RotationItem | null
  onSubmit: (rotation: RotationItem) => void
  tenantCode: string | null | undefined
  rowId?: string | null
  collectionName?: string
}

export function RotationFormPopup({
  open,
  onClose,
  initialRotation,
  onSubmit,
  tenantCode,
  rowId,
  collectionName = "employee_shift",
}: RotationFormPopupProps) {
  const pendingItemRef = useRef<RotationItem | null>(null)

  const [formRotation, setFormRotation] = useState<RotationItem>({ ...EMPTY_ROTATION })
  const [popupShowErrors, setPopupShowErrors] = useState(false)
  const [shiftGroupSearch, setShiftGroupSearch] = useState("")
  const [shiftSearch, setShiftSearch] = useState("")
  const [addShiftGroupOpen, setAddShiftGroupOpen] = useState(false)
  const [addShiftOpen, setAddShiftOpen] = useState(false)

  const [daysError, setDaysError] = useState("")
  const [priorityError, setPriorityError] = useState("")
  const [shiftGroupCodeError, setShiftGroupCodeError] = useState("")
  const [shiftCodeError, setShiftCodeError] = useState("")

  const { hierarchyFilters: empHierarchyFilters } = useEmpHierarchy()
  const hierarchyFiltersForHook = useMemo(() => {
    if (!empHierarchyFilters) return undefined
    const withCategories = empHierarchyFilters as { categories?: string[] }
    return {
      subsidiaries: empHierarchyFilters.subsidiaries,
      locations: empHierarchyFilters.locations,
      categories: withCategories.categories,
    }
  }, [empHierarchyFilters])

  const { shiftGroups, shiftGroupsLoading, shiftGroupsError, shiftOptions } = useEmployeeShiftGraphql({
    tenantCode,
    shiftGroupCode: formRotation.shiftGroupCode,
    shiftGroupSearch: shiftGroupSearch.trim(),
  })

  const filteredShiftOptions = useMemo(() => {
    const q = shiftSearch.trim().toLowerCase()
    if (!q) return shiftOptions
    return shiftOptions.filter(
      (s) =>
        (s.shiftCode || "").toLowerCase().includes(q) ||
        (s.shiftName || "").toLowerCase().includes(q)
    )
  }, [shiftOptions, shiftSearch])

  const clearServerErrors = () => {
    setDaysError("")
    setPriorityError("")
    setShiftGroupCodeError("")
    setShiftCodeError("")
  }

  const { post: postValidate, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const key = fieldName.toLowerCase()
          if (key === "days" || key.includes("days")) setDaysError(message)
          else if (key === "priority" || key.includes("priority")) setPriorityError(message)
          else if (key === "shiftgroupcode" || key.includes("shiftgroup") || key.includes("shift_group")) setShiftGroupCodeError(message)
          else if (key === "shiftcode" || key.includes("shiftcode") || key.includes("shift_code")) setShiftCodeError(message)
        })
        return
      }
      if (pendingItemRef.current) {
        onSubmit(pendingItemRef.current)
        pendingItemRef.current = null
      }
    },
    onError: () => {
      toast.error("Rotation submission failed!")
    },
  })

  useEffect(() => {
    if (open) {
      setFormRotation(initialRotation ? { ...initialRotation } : { ...EMPTY_ROTATION })
      setPopupShowErrors(false)
      clearServerErrors()
      setShiftGroupSearch("")
      setShiftSearch("")
      setAddShiftGroupOpen(false)
      setAddShiftOpen(false)
    }
  }, [open, initialRotation])

  const shiftGroupNameFor = (code: string) => shiftGroups.find((g) => g.shiftGroupCode === code)?.shiftGroupName ?? ""
  const shiftNameFor = (code: string) => shiftOptions.find((s) => s.shiftCode === code)?.shiftName ?? ""
  const displayShiftGroup = (code: string) => (code ? `${shiftGroupNameFor(code) || code} (${code})` : "—")
  const displayShift = (code: string) => (code ? `${shiftNameFor(code) || code} (${code})` : "—")

  const handleSubmit = () => {
    const result = rotationSchema.safeParse(formRotation)
    if (!result.success) {
      setPopupShowErrors(true)
      return
    }
    clearServerErrors()

    const item: RotationItem = {
      ...result.data,
      parseID: initialRotation?.parseID || crypto.randomUUID(),
    }
    pendingItemRef.current = item

    const { parseID: _parseID, ...payloadWithoutParseID } = item
    const serverPayload = initialRotation ? item : payloadWithoutParseID

    postValidate({
      tenant: tenantCode,
      action: "update",
      collectionName,
      event: "validate",
      id: rowId,
      ruleId: "",
      data: {
        rotation: [serverPayload],
      },
    })
  }

  const handleClose = () => {
    setPopupShowErrors(false)
    clearServerErrors()
    onClose()
  }

  const formValidation = rotationSchema.safeParse(formRotation)
  const formErrors = formValidation.success ? {} : formValidation.error.flatten().fieldErrors

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Clock className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialRotation !== null ? "Edit Rotation Row" : "Add Rotation Row"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Set days, priority, and shift for this step.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div className="space-y-3">
            <SubFormTitle title="Rotation Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Days <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={formRotation.days}
                  onChange={(e) => {
                    setFormRotation((p) => ({ ...p, days: Number(e.target.value) || 0 }))
                    setDaysError("")
                  }}
                  className={`${INPUT_CLASS} ${(popupShowErrors && formErrors.days) || daysError ? "border-red-500" : ""}`}
                  placeholder="5"
                  disabled={postLoading}
                />
                {popupShowErrors && formErrors.days && !daysError && (
                  <p className="text-red-500 text-xs" role="alert">
                    {(formErrors.days as string[])[0]}
                  </p>
                )}
                {daysError && <p className="text-red-500 text-xs">{daysError}</p>}
              </div>

              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Priority <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={formRotation.priority}
                  onChange={(e) => {
                    setFormRotation((p) => ({ ...p, priority: Number(e.target.value) || 0 }))
                    setPriorityError("")
                  }}
                  className={`${INPUT_CLASS} ${(popupShowErrors && formErrors.priority) || priorityError ? "border-red-500" : ""}`}
                  placeholder="1"
                  disabled={postLoading}
                />
                {popupShowErrors && formErrors.priority && !priorityError && (
                  <p className="text-red-500 text-xs" role="alert">
                    {(formErrors.priority as string[])[0]}
                  </p>
                )}
                {priorityError && <p className="text-red-500 text-xs">{priorityError}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <SubFormTitle title="Shift Assignment" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Shift Group <span className="text-red-500">*</span>
                </Label>
                <Popover open={addShiftGroupOpen} onOpenChange={postLoading ? undefined : setAddShiftGroupOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={postLoading}
                      className={`relative w-full h-10 border rounded-lg pl-10 pr-10 text-left transition-all bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                        (popupShowErrors && formErrors.shiftGroupCode) || shiftGroupCodeError ? "border-red-500" : ""
                      }`}
                    >
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <span className="block truncate text-sm text-gray-700">
                        {shiftGroupsLoading
                          ? "Loading..."
                          : formRotation.shiftGroupCode
                            ? displayShiftGroup(formRotation.shiftGroupCode)
                            : "Search by shift group code or name"}
                      </span>
                      <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl">
                    <Command shouldFilter={false} className="bg-white">
                      <div className="p-2 border-b border-gray-200 sticky top-0 z-10 bg-white">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <CommandInput
                            value={shiftGroupSearch}
                            onValueChange={setShiftGroupSearch}
                            placeholder="Search..."
                            className="pl-8 h-9"
                          />
                        </div>
                      </div>
                      <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                        {!tenantCode?.trim() ? (
                          <CommandEmpty>Tenant code required to load shift groups</CommandEmpty>
                        ) : shiftGroupsError ? (
                          <CommandEmpty>Failed to load shift groups</CommandEmpty>
                        ) : shiftGroups.length === 0 ? (
                          <CommandEmpty>No shift group found</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {shiftGroups.map((sg) => (
                              <CommandItem
                                key={sg.shiftGroupCode}
                                value={`${sg.shiftGroupCode} - ${sg.shiftGroupName}`}
                                onSelect={() => {
                                  setFormRotation((p) => ({
                                    ...p,
                                    shiftGroupCode: sg.shiftGroupCode,
                                    shiftCode: "",
                                  }))
                                  setShiftGroupCodeError("")
                                  setAddShiftGroupOpen(false)
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{sg.shiftGroupName || sg.shiftGroupCode}</div>
                                  <div className="text-xs text-gray-500">Code: {sg.shiftGroupCode}</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {popupShowErrors && formErrors.shiftGroupCode && !shiftGroupCodeError && (
                  <p className="text-red-500 text-xs" role="alert">
                    {(formErrors.shiftGroupCode as string[])[0]}
                  </p>
                )}
                {shiftGroupCodeError && <p className="text-red-500 text-xs">{shiftGroupCodeError}</p>}
                <p className="text-gray-500 text-xs mt-1">Search by code or name</p>
              </div>

              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Shift <span className="text-red-500">*</span>
                </Label>
                <Popover open={addShiftOpen} onOpenChange={postLoading ? undefined : setAddShiftOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      disabled={!formRotation.shiftGroupCode || postLoading}
                      className={`relative w-full h-10 border rounded-lg pl-10 pr-10 text-left transition-all bg-white border-gray-300 hover:border-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed ${
                        (popupShowErrors && formErrors.shiftCode) || shiftCodeError ? "border-red-500" : ""
                      }`}
                    >
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <span className="block truncate text-sm text-gray-700">
                        {formRotation.shiftGroupCode
                          ? formRotation.shiftCode
                            ? displayShift(formRotation.shiftCode)
                            : "Select shift (code / name)"
                          : "Select a shift group first"}
                      </span>
                      <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[520px] bg-white border border-gray-200 rounded-lg shadow-xl">
                    <Command shouldFilter={false} className="bg-white">
                      <div className="p-2 border-b border-gray-200 sticky top-0 z-10 bg-white">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <CommandInput
                            value={shiftSearch}
                            onValueChange={setShiftSearch}
                            placeholder="Search shift..."
                            className="pl-8 h-9"
                          />
                        </div>
                      </div>
                      <CommandList className="max-h-[260px] overflow-y-auto bg-white">
                        {filteredShiftOptions.length === 0 ? (
                          <CommandEmpty>No shift found</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {filteredShiftOptions.map((s, i) => (
                              <CommandItem
                                key={`${s.shiftCode}-${s.shiftName}-${i}`}
                                value={`${s.shiftCode} - ${s.shiftName}`}
                                onSelect={() => {
                                  setFormRotation((p) => ({ ...p, shiftCode: s.shiftCode }))
                                  setShiftCodeError("")
                                  setAddShiftOpen(false)
                                }}
                                className="cursor-pointer"
                              >
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{s.shiftName || s.shiftCode}</div>
                                  <div className="text-xs text-gray-500">Code: {s.shiftCode}</div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {popupShowErrors && formErrors.shiftCode && !shiftCodeError && (
                  <p className="text-red-500 text-xs" role="alert">
                    {(formErrors.shiftCode as string[])[0]}
                  </p>
                )}
                {shiftCodeError && <p className="text-red-500 text-xs">{shiftCodeError}</p>}
                <p className="text-gray-500 text-xs mt-1">Select shift for this rotation step</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            onClick={handleClose}
            disabled={postLoading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
            disabled={postLoading}
          >
            {postLoading ? "Saving..." : initialRotation !== null ? "Save" : "Add Row"}
          </Button>
        </div>
      </div>
    </div>
  )
}
