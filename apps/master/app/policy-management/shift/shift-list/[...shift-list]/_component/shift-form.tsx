"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { X, Settings, AlertCircle, Users, Calendar } from "lucide-react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Separator } from "@repo/ui/components/ui/separator"
import { FormActionsFooter } from "@/components/footer/form-actions-footer"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { createShiftFormSchema, type ShiftFormData } from "./shift-form-schema"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { toast } from "react-toastify"

export interface ShiftData {
  id?: string
  parseID?: string
  parseId?: string
  shiftCode: string
  shiftName: string
  shiftStart: string
  shiftEnd: string
  firstHalfStart: string
  firstHalfEnd: string
  secondHalfStart: string
  secondHalfEnd: string
  lunchStart: string
  lunchEnd: string
  duration: number
  crossDay: boolean
  flexible: boolean
  flexiFullDayDuration: number
  flexiHalfDayDuration: number
  inAheadMargin: number
  inAboveMargin: number
  outAheadMargin: number
  outAboveMargin: number
  lateInAllowedTime: number
  earlyOutAllowedTime: number
  graceIn: number
  graceOut: number
  earlyOutTime: number
  minimumDurationForFullDay: number
  minimumDurationForHalfDay: number
  minimumExtraMinutesForExtraHours: number
}

interface ShiftFormProps {
  isOpen: boolean
  onClose: () => void
  initialValues?: Partial<ShiftData>
  onSubmit?: (data: ShiftData) => void
  shiftData?: { shift: ShiftData[] }
}

const timeHint = "Use 24:00 for midnight (night shifts)"
const timeInputClassName =
  "[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none [appearance:textfield] [-moz-appearance:textfield]"

function CheckboxBooleanField({
  value,
  onChange,
}: {
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex h-10 items-center rounded-lg border border-gray-200 bg-white px-3">
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(event.target.checked)}
          className="accent-blue-600"
        />
        Yes
      </label>
    </div>
  )
}

export default function ShiftForm({
  isOpen,
  onClose,
  initialValues = {},
  onSubmit,
  shiftData,
}: ShiftFormProps) {
  const [showErrors, setShowErrors] = useState(false)
  const tenantCode = useGetTenantCode()

  const shiftCodes = useMemo(() => {
    if (!shiftData?.shift) return []
    return shiftData.shift.map((shift: ShiftData) => shift.shiftCode)
  }, [shiftData])

  const totalShiftCodes = shiftCodes.length
  const isEditMode = Boolean(initialValues.shiftCode)
  const validationSchema = useMemo(() => createShiftFormSchema(), [])

  const getDefaultValues = useCallback(
    (values: Partial<ShiftData> = {}): ShiftFormData => ({
      shiftCode: values.shiftCode || "",
      shiftName: values.shiftName || "",
      shiftStart: values.shiftStart || "",
      shiftEnd: values.shiftEnd || "",
      firstHalfStart: values.firstHalfStart || "",
      firstHalfEnd: values.firstHalfEnd || "",
      secondHalfStart: values.secondHalfStart || "",
      secondHalfEnd: values.secondHalfEnd || "",
      lunchStart: values.lunchStart || "",
      lunchEnd: values.lunchEnd || "",
      duration: values.duration || 0,
      crossDay: values.crossDay ?? false,
      flexible: values.flexible ?? false,
      flexiFullDayDuration: values.flexiFullDayDuration || 0,
      flexiHalfDayDuration: values.flexiHalfDayDuration || 0,
      inAheadMargin: values.inAheadMargin || 0,
      inAboveMargin: values.inAboveMargin || 0,
      outAheadMargin: values.outAheadMargin || 0,
      outAboveMargin: values.outAboveMargin || 0,
      lateInAllowedTime: values.lateInAllowedTime || 0,
      earlyOutAllowedTime: values.earlyOutAllowedTime || 0,
      graceIn: values.graceIn || 0,
      graceOut: values.graceOut || 0,
      earlyOutTime: values.earlyOutTime || 0,
      minimumDurationForFullDay: values.minimumDurationForFullDay || 0,
      minimumDurationForHalfDay: values.minimumDurationForHalfDay || 0,
      minimumExtraMinutesForExtraHours: values.minimumExtraMinutesForExtraHours || 0,
    }),
    []
  )

  const {
    register,
    control,
    watch,
    reset,
    trigger,
    clearErrors,
    setError,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty, isValid },
  } = useForm<ShiftFormData>({
    resolver: zodResolver(validationSchema),
    defaultValues: getDefaultValues(initialValues),
    mode: "onChange",
  })

  const watchedNumberValues = watch([
    "duration",
    "flexiFullDayDuration",
    "flexiHalfDayDuration",
    "inAheadMargin",
    "inAboveMargin",
    "outAheadMargin",
    "outAboveMargin",
    "lateInAllowedTime",
    "earlyOutAllowedTime",
    "graceIn",
    "graceOut",
    "earlyOutTime",
    "minimumDurationForFullDay",
    "minimumDurationForHalfDay",
    "minimumExtraMinutesForExtraHours",
  ])

  useEffect(() => {
    if (!isOpen) return
    reset(getDefaultValues(initialValues))
    clearErrors()
    setShowErrors(false)
  }, [clearErrors, getDefaultValues, initialValues, isOpen, reset])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) onClose()
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  const normalizeTimeForSubmission = (time: string) => (time === "24:00" ? "00:00" : time)

  const { post: postShift, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response && typeof response === "object" ? response?.data ?? response : response
        const fieldMap: Record<string, keyof ShiftFormData> = {
          shiftCode: "shiftCode",
          shiftName: "shiftName",
          shiftStart: "shiftStart",
          shiftEnd: "shiftEnd",
          firstHalfStart: "firstHalfStart",
          firstHalfEnd: "firstHalfEnd",
          secondHalfStart: "secondHalfStart",
          secondHalfEnd: "secondHalfEnd",
          lunchStart: "lunchStart",
          lunchEnd: "lunchEnd",
          duration: "duration",
          crossDay: "crossDay",
          flexible: "flexible",
          flexiFullDayDuration: "flexiFullDayDuration",
          flexiHalfDayDuration: "flexiHalfDayDuration",
          inAheadMargin: "inAheadMargin",
          inAboveMargin: "inAboveMargin",
          outAheadMargin: "outAheadMargin",
          outAboveMargin: "outAboveMargin",
          lateInAllowedTime: "lateInAllowedTime",
          earlyOutAllowedTime: "earlyOutAllowedTime",
          graceIn: "graceIn",
          graceOut: "graceOut",
          earlyOutTime: "earlyOutTime",
          minimumDurationForFullDay: "minimumDurationForFullDay",
          minimumDurationForHalfDay: "minimumDurationForHalfDay",
          minimumExtraMinutesForExtraHours: "minimumExtraMinutesForExtraHours",
        }

        setShowErrors(true)
        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
            if (typeof message !== "string" || !message.trim()) return
            const normalizedField =
              fieldMap[fieldName] ||
              (fieldName.startsWith("shift.") ? fieldMap[fieldName.split(".").pop() || ""] : undefined)
            if (!normalizedField) return
            setError(normalizedField, { type: "server", message })
          })
        } else {
          toast.error("Failed to save shift. Please try again.")
        }
        return
      }
      toast.success(isEditMode ? "Shift updated successfully!" : "Shift added successfully!")
      if (lastSubmittedRef.current) {
        onSubmit?.(lastSubmittedRef.current)
      }
      onClose()
    },
    onError: (error) => {
      console.error("POST error:", error)
      toast.error("Failed to save shift. Please try again.")
    },
  })

  const lastSubmittedRef = useRef<ShiftData | null>(null)

  const onFormSubmit = (data: ShiftFormData) => {
    const existingParseId =
      (initialValues as any)?.parseID ||
      (initialValues as any)?.parseId ||
      (initialValues as any)?.id
    const parseId = isEditMode ? existingParseId : undefined

    const formattedData: ShiftData = {
      ...data,
      ...(parseId ? { parseID: parseId } : {}),
      shiftStart: normalizeTimeForSubmission(data.shiftStart),
      shiftEnd: normalizeTimeForSubmission(data.shiftEnd),
      firstHalfStart: normalizeTimeForSubmission(data.firstHalfStart),
      firstHalfEnd: normalizeTimeForSubmission(data.firstHalfEnd),
      secondHalfStart: normalizeTimeForSubmission(data.secondHalfStart),
      secondHalfEnd: normalizeTimeForSubmission(data.secondHalfEnd),
      lunchStart: normalizeTimeForSubmission(data.lunchStart),
      lunchEnd: normalizeTimeForSubmission(data.lunchEnd),
      flexiFullDayDuration: data.flexiFullDayDuration || 0,
      flexiHalfDayDuration: data.flexiHalfDayDuration || 0,
      inAheadMargin: data.inAheadMargin || 0,
      inAboveMargin: data.inAboveMargin || 0,
      outAheadMargin: data.outAheadMargin || 0,
      outAboveMargin: data.outAboveMargin || 0,
      lateInAllowedTime: data.lateInAllowedTime || 0,
      earlyOutAllowedTime: data.earlyOutAllowedTime || 0,
      graceIn: data.graceIn || 0,
      graceOut: data.graceOut || 0,
      earlyOutTime: data.earlyOutTime || 0,
      minimumDurationForFullDay: data.minimumDurationForFullDay || 0,
      minimumDurationForHalfDay: data.minimumDurationForHalfDay || 0,
      minimumExtraMinutesForExtraHours: data.minimumExtraMinutesForExtraHours || 0,
    }

    lastSubmittedRef.current = formattedData

    const payload = {
      tenant: tenantCode,
      action: "update",
      id: (shiftData as any)?._id || null,
      collectionName: "shift",
      event: "validate",
      ruleId: "shiftValidator",
      data: {
        shift: [formattedData],
      },
    }
    postShift(payload)
  }

  const handleSave = async () => {
    setShowErrors(true)
    clearErrors()
    const valid = await trigger()
    if (!valid) return
    await handleSubmit(onFormSubmit)()
  }

  const ErrorMessage = ({ error }: { error?: string }) => {
    if (!showErrors || !error) return null
    return (
      <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
        <AlertCircle className="h-3 w-3" />
        {error}
      </div>
    )
  }

  const numberValueMap = useMemo(() => {
    const keys = [
      "duration",
      "flexiFullDayDuration",
      "flexiHalfDayDuration",
      "inAheadMargin",
      "inAboveMargin",
      "outAheadMargin",
      "outAboveMargin",
      "lateInAllowedTime",
      "earlyOutAllowedTime",
      "graceIn",
      "graceOut",
      "earlyOutTime",
      "minimumDurationForFullDay",
      "minimumDurationForHalfDay",
      "minimumExtraMinutesForExtraHours",
    ] as const

    const entries = keys.map((key, index) => [key, watchedNumberValues?.[index]])
    return Object.fromEntries(entries) as Record<(typeof keys)[number], number | undefined>
  }, [watchedNumberValues])

  const getNumberInputClass = (fieldName: keyof typeof numberValueMap, hasError?: boolean) => {
    const isZeroValue = numberValueMap[fieldName] === 0
    const errorClass = showErrors && hasError ? "border-red-500" : ""
    const textClass = isZeroValue ? "text-gray-500" : "text-gray-900"
    return `${errorClass} ${textClass}`.trim()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 bg-black/50 backdrop-blur-sm"
        onClick={() => {
          if (!isSubmitting && !postLoading) onClose()
        }}
      />
      <div className="ml-auto flex h-full w-full max-w-5xl flex-col bg-transparent">
        <Card className="flex h-full max-h-screen w-full flex-col overflow-hidden rounded-none border border-gray-200 shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
            <div>
              <h2 className="text-base font-semibold text-gray-700">
                {initialValues.shiftCode ? "Edit Shift" : "Create Shift"} - Configuration
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Configure shift timing, attendance tolerance, and duration rules.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting || postLoading}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
              aria-label="Close popup"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <CardContent
            className={`flex-1 space-y-6 overflow-y-auto px-6 py-4 ${isEditMode ? "[&_input]:text-gray-500" : ""}`}
          >
            {showErrors && Object.keys(errors).length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Please fix highlighted fields before saving.
              </div>
            )}

            <div className="space-y-3">
              <SubFormTitle title="Basic Information" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Shift Code <span className="text-red-500">*</span>
                    {totalShiftCodes > 0 && (
                      <span className="ml-2 text-[11px] font-normal normal-case text-gray-500">
                        ({totalShiftCodes} existing codes)
                      </span>
                    )}
                  </label>
                  <Input
                    {...register("shiftCode")}
                    placeholder="Enter shift code"
                    readOnly={Boolean(initialValues.shiftCode)}
                    disabled={Boolean(initialValues.shiftCode)}
                    className={
                      initialValues.shiftCode
                        ? "cursor-not-allowed bg-gray-100 text-gray-500"
                        : showErrors && errors.shiftCode
                          ? "border-red-500"
                          : ""
                    }
                  />
                  <ErrorMessage error={errors.shiftCode?.message} />
                  {initialValues.shiftCode && (
                    <p className="text-xs text-blue-600">Shift code cannot be changed in edit mode.</p>
                  )}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Shift Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("shiftName")}
                    placeholder="Enter shift name"
                    className={showErrors && errors.shiftName?.message ? "border-red-500" : ""}
                  />
                  <ErrorMessage error={errors.shiftName?.message} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Shift Start <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    {...register("shiftStart")}
                    className={`${timeInputClassName} ${showErrors && errors.shiftStart?.message ? "border-red-500" : ""}`}
                  />
                  <ErrorMessage error={errors.shiftStart?.message} />
                  <p className="text-xs text-gray-500">{timeHint}</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Shift End <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    {...register("shiftEnd")}
                    className={`${timeInputClassName} ${showErrors && errors.shiftEnd?.message ? "border-red-500" : ""}`}
                  />
                  <ErrorMessage error={errors.shiftEnd?.message} />
                  <p className="text-xs text-gray-500">{timeHint}</p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Duration (minutes) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    {...register("duration", { valueAsNumber: true })}
                    placeholder="540"
                    className={getNumberInputClass("duration", Boolean(errors.duration?.message))}
                  />
                  <ErrorMessage error={errors.duration?.message} />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <SubFormTitle title="Half Day & Lunch Timing" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    First Half Start <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    {...register("firstHalfStart")}
                    className={`${timeInputClassName} ${showErrors && errors.firstHalfStart?.message ? "border-red-500" : ""}`}
                  />
                  <ErrorMessage error={errors.firstHalfStart?.message} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    First Half End <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    {...register("firstHalfEnd")}
                    className={`${timeInputClassName} ${showErrors && errors.firstHalfEnd?.message ? "border-red-500" : ""}`}
                  />
                  <ErrorMessage error={errors.firstHalfEnd?.message} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Second Half Start <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    {...register("secondHalfStart")}
                    className={`${timeInputClassName} ${showErrors && errors.secondHalfStart?.message ? "border-red-500" : ""}`}
                  />
                  <ErrorMessage error={errors.secondHalfStart?.message} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Second Half End <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    {...register("secondHalfEnd")}
                    className={`${timeInputClassName} ${showErrors && errors.secondHalfEnd?.message ? "border-red-500" : ""}`}
                  />
                  <ErrorMessage error={errors.secondHalfEnd?.message} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Lunch Start <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    {...register("lunchStart")}
                    className={`${timeInputClassName} ${showErrors && errors.lunchStart?.message ? "border-red-500" : ""}`}
                  />
                  <ErrorMessage error={errors.lunchStart?.message} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Lunch End <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="time"
                    {...register("lunchEnd")}
                    className={`${timeInputClassName} ${showErrors && errors.lunchEnd?.message ? "border-red-500" : ""}`}
                  />
                  <ErrorMessage error={errors.lunchEnd?.message} />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <SubFormTitle title="Shift Settings" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Cross Day Shift
                  </label>
                  <Controller
                    name="crossDay"
                    control={control}
                    render={({ field }) => <CheckboxBooleanField value={field.value} onChange={field.onChange} />}
                  />
                  <ErrorMessage error={errors.crossDay?.message} />
                  <p className="text-xs text-gray-500">
                    Enable for shifts that span midnight, such as 22:00 to 06:00.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Flexible Shift
                  </label>
                  <Controller
                    name="flexible"
                    control={control}
                    render={({ field }) => <CheckboxBooleanField value={field.value} onChange={field.onChange} />}
                  />
                  <ErrorMessage error={errors.flexible?.message} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Flexi Full Day Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    {...register("flexiFullDayDuration", { valueAsNumber: true })}
                    placeholder="0"
                    className={getNumberInputClass("flexiFullDayDuration", Boolean(errors.flexiFullDayDuration?.message))}
                  />
                  <ErrorMessage error={errors.flexiFullDayDuration?.message} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Flexi Half Day Duration (minutes)
                  </label>
                  <Input
                    type="number"
                    {...register("flexiHalfDayDuration", { valueAsNumber: true })}
                    placeholder="0"
                    className={getNumberInputClass("flexiHalfDayDuration", Boolean(errors.flexiHalfDayDuration?.message))}
                  />
                  <ErrorMessage error={errors.flexiHalfDayDuration?.message} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">In Ahead Margin</label>
                  <Input
                    type="number"
                    {...register("inAheadMargin", { valueAsNumber: true })}
                    placeholder="0"
                    className={getNumberInputClass("inAheadMargin", Boolean(errors.inAheadMargin?.message))}
                  />
                  <ErrorMessage error={errors.inAheadMargin?.message} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">In Above Margin</label>
                  <Input
                    type="number"
                    {...register("inAboveMargin", { valueAsNumber: true })}
                    placeholder="0"
                    className={getNumberInputClass("inAboveMargin", Boolean(errors.inAboveMargin?.message))}
                  />
                  <ErrorMessage error={errors.inAboveMargin?.message} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">Out Ahead Margin</label>
                  <Input
                    type="number"
                    {...register("outAheadMargin", { valueAsNumber: true })}
                    placeholder="0"
                    className={getNumberInputClass("outAheadMargin", Boolean(errors.outAheadMargin?.message))}
                  />
                  <ErrorMessage error={errors.outAheadMargin?.message} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">Out Above Margin</label>
                  <Input
                    type="number"
                    {...register("outAboveMargin", { valueAsNumber: true })}
                    placeholder="0"
                    className={getNumberInputClass("outAboveMargin", Boolean(errors.outAboveMargin?.message))}
                  />
                  <ErrorMessage error={errors.outAboveMargin?.message} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">Late In Allowed</label>
                  <Input
                    type="number"
                    {...register("lateInAllowedTime", { valueAsNumber: true })}
                    placeholder="0"
                    className={getNumberInputClass("lateInAllowedTime", Boolean(errors.lateInAllowedTime?.message))}
                  />
                  <ErrorMessage error={errors.lateInAllowedTime?.message} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">Early Out Allowed</label>
                  <Input
                    type="number"
                    {...register("earlyOutAllowedTime", { valueAsNumber: true })}
                    placeholder="0"
                    className={getNumberInputClass("earlyOutAllowedTime", Boolean(errors.earlyOutAllowedTime?.message))}
                  />
                  <ErrorMessage error={errors.earlyOutAllowedTime?.message} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">Grace In</label>
                  <Input
                    type="number"
                    {...register("graceIn", { valueAsNumber: true })}
                    placeholder="5"
                    className={getNumberInputClass("graceIn", Boolean(errors.graceIn?.message))}
                  />
                  <ErrorMessage error={errors.graceIn?.message} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">Grace Out</label>
                  <Input
                    type="number"
                    {...register("graceOut", { valueAsNumber: true })}
                    placeholder="5"
                    className={getNumberInputClass("graceOut", Boolean(errors.graceOut?.message))}
                  />
                  <ErrorMessage error={errors.graceOut?.message} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="space-y-2 md:col-span-4">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">Early Out Time</label>
                  <Input
                    type="number"
                    {...register("earlyOutTime", { valueAsNumber: true })}
                    placeholder="10"
                    className={getNumberInputClass("earlyOutTime", Boolean(errors.earlyOutTime?.message))}
                  />
                  <ErrorMessage error={errors.earlyOutTime?.message} />
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <SubFormTitle title="Duration Requirements" />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Min Duration for Full Day
                  </label>
                  <Input
                    type="number"
                    {...register("minimumDurationForFullDay", { valueAsNumber: true })}
                    placeholder="360"
                    className={getNumberInputClass(
                      "minimumDurationForFullDay",
                      Boolean(errors.minimumDurationForFullDay?.message)
                    )}
                  />
                  <ErrorMessage error={errors.minimumDurationForFullDay?.message} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Min Duration for Half Day
                  </label>
                  <Input
                    type="number"
                    {...register("minimumDurationForHalfDay", { valueAsNumber: true })}
                    placeholder="180"
                    className={getNumberInputClass(
                      "minimumDurationForHalfDay",
                      Boolean(errors.minimumDurationForHalfDay?.message)
                    )}
                  />
                  <ErrorMessage error={errors.minimumDurationForHalfDay?.message} />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Min Extra Minutes for Extra Hours
                  </label>
                  <Input
                    type="number"
                    {...register("minimumExtraMinutesForExtraHours", { valueAsNumber: true })}
                    placeholder="30"
                    className={getNumberInputClass(
                      "minimumExtraMinutesForExtraHours",
                      Boolean(errors.minimumExtraMinutesForExtraHours?.message)
                    )}
                  />
                  <ErrorMessage error={errors.minimumExtraMinutesForExtraHours?.message} />
                </div>
              </div>
            </div>
          </CardContent>

          <FormActionsFooter
            isViewMode={false}
            isValid={isValid && isDirty}
            showErrors={showErrors}
            errorCount={Object.keys(errors).length}
            postLoading={isSubmitting || postLoading}
            onSave={handleSave}
            onPreviousTab={onClose}
          />
        </Card>
      </div>
    </div>
  )
}
