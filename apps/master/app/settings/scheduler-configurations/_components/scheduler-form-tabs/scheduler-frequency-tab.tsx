"use client"

import { useEffect } from "react"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Label } from "@repo/ui/components/ui/label"
import { Input } from "@repo/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { SubFormTitle } from "@/components/header/sub-form-title"
import SubformHeadline from "@/components/header/subform-headline"
import type { SchedulerFormValues } from "../scheduler-form-controller"

type Props = {
  form: UseFormReturn<SchedulerFormValues>
  viewMode: boolean
  mode: "add" | "edit" | "view"
  showErrors?: boolean
}

export default function SchedulerFrequencyTab({ form, viewMode, mode, showErrors = false }: Props) {
  const {
    control,
    register,
    setValue,
    formState: { errors },
  } = form

  const months = [
    { label: "January", value: "1" },
    { label: "February", value: "2" },
    { label: "March", value: "3" },
    { label: "April", value: "4" },
    { label: "May", value: "5" },
    { label: "June", value: "6" },
    { label: "July", value: "7" },
    { label: "August", value: "8" },
    { label: "September", value: "9" },
    { label: "October", value: "10" },
    { label: "November", value: "11" },
    { label: "December", value: "12" },
  ]

  const hourOptions = Array.from({ length: 24 }, (_, i) => String(i))
  const minuteOptions = Array.from({ length: 60 }, (_, i) => String(i))
  const dayOfMonthOptions = Array.from({ length: 31 }, (_, i) => `${i + 1}`)
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 31 }, (_, i) => String(currentYear - 10 + i))
  const dayOfWeekOptions = [
    { label: "Monday", value: "1" },
    { label: "Tuesday", value: "2" },
    { label: "Wednesday", value: "3" },
    { label: "Thursday", value: "4" },
    { label: "Friday", value: "5" },
    { label: "Saturday", value: "6" },
    { label: "Sunday", value: "7" },
  ]

  const timezones = [
    "Asia/Kolkata",
    "UTC",
    "America/New_York",
    "Europe/London",
    "Asia/Tokyo",
    "Australia/Sydney",
    "Europe/Paris",
    "America/Los_Angeles",
  ]

  const frequencyTypes = [
    { label: "Custom", value: "custom" },
    { label: "Every Minute", value: "minute" },
    { label: "Hourly", value: "hourly" },
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
    { label: "Yearly", value: "yearly" },
  ]

  const watchedFrequencyType = useWatch({ control, name: "frequency.type" })
  const watchedConfig = useWatch({ control, name: "frequency.config" })
  
  const getErrorMessage = (error: unknown): string | undefined => {
    if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      return (error as { message: string }).message
    }
    return undefined
  }

  const isFieldEnabled = (fieldName: string) => {
    switch (watchedFrequencyType) {
      case "yearly":
        return ["month", "day_of_month", "hour", "minute", "every_years"].includes(fieldName)
      case "monthly":
        return ["day_of_month", "hour", "minute", "every_months"].includes(fieldName)
      case "weekly":
        return ["day_of_week", "hour", "minute", "every_weeks"].includes(fieldName)
      case "daily":
        return ["hour", "minute", "every_days"].includes(fieldName)
      case "hourly":
        return ["minute", "every_hours"].includes(fieldName)
      case "minute":
        return ["every_minutes"].includes(fieldName)
      case "custom":
        return true
      default:
        return false
    }
  }

  const getVisibleFields = () => {
    const fields = []
    
    if (isFieldEnabled("year")) fields.push({ type: "year", label: "Year" })
    if (isFieldEnabled("month")) fields.push({ type: "month", label: "Month" })
    if (isFieldEnabled("day_of_month")) fields.push({ type: "day_of_month", label: "Day of Month" })
    if (isFieldEnabled("day_of_week")) fields.push({ type: "day_of_week", label: "Day of Week" })
    if (isFieldEnabled("hour")) fields.push({ type: "hour", label: "Hour" })
    if (isFieldEnabled("minute")) fields.push({ type: "minute", label: "Minute" })
    if (isFieldEnabled("every_minutes")) fields.push({ type: "every_minutes", label: "Every X Minutes" })
    if (isFieldEnabled("every_hours")) fields.push({ type: "every_hours", label: "Every X Hours" })
    if (isFieldEnabled("every_days")) fields.push({ type: "every_days", label: "Every X Days" })
    if (isFieldEnabled("every_weeks")) fields.push({ type: "every_weeks", label: "Every X Weeks" })
    if (isFieldEnabled("every_months")) fields.push({ type: "every_months", label: "Every X Months" })
    if (isFieldEnabled("every_years")) fields.push({ type: "every_years", label: "Every X Years" })
    
    return fields
  }

  const generateCronExpression = (
    config: SchedulerFormValues["frequency"]["config"],
    frequencyType: SchedulerFormValues["frequency"]["type"]
  ) => {
    const {
      minute,
      hour,
      day_of_month,
      month,
      day_of_week,
      every_minutes,
      every_hours,
      every_days,
      every_weeks,
      every_months,
      every_years,
    } = config
    const second = 0
    switch (frequencyType) {
      case "yearly":
        return every_years && every_years > 0
          ? `${second} ${minute || 0} ${hour || 0} ${day_of_month || 1} ${month || 1} */${every_years}`
          : `${second} ${minute || 0} ${hour || 0} ${day_of_month || 1} ${month || 1} *`
      case "monthly":
        return every_months && every_months > 0
          ? `${second} ${minute || 0} ${hour || 0} ${day_of_month || 1} */${every_months} *`
          : `${second} ${minute || 0} ${hour || 0} ${day_of_month || 1} * *`
      case "weekly":
        return every_weeks && every_weeks > 0
          ? `${second} ${minute || 0} ${hour || 0} * * */${every_weeks}`
          : `${second} ${minute || 0} ${hour || 0} * * ${day_of_week || 1}`
      case "daily":
        return every_days && every_days > 0
          ? `${second} ${minute || 0} ${hour || 0} */${every_days} * *`
          : `${second} ${minute || 0} ${hour || 0} * * *`
      case "hourly":
        return every_hours && every_hours > 0
          ? `${second} ${minute || 0} */${every_hours} * * *`
          : `${second} ${minute || 0} * * * *`
      case "minute":
        return every_minutes && every_minutes > 0
          ? `${second} */${every_minutes} * * * *`
          : `${second} * * * * *`
      default:
        return `${second} ${minute || 0} ${hour || 0} ${day_of_month || "*"} ${month || "*"} ${day_of_week || "*"}`
    }
  }

  useEffect(() => {
    if (!watchedFrequencyType) return
    const allEveryFields: Array<
      "every_minutes" | "every_hours" | "every_days" | "every_weeks" | "every_months" | "every_years"
    > = ["every_minutes", "every_hours", "every_days", "every_weeks", "every_months", "every_years"]

    const keep: Record<SchedulerFormValues["frequency"]["type"], string | null> = {
      custom: null,
      minute: "every_minutes",
      hourly: "every_hours",
      daily: "every_days",
      weekly: "every_weeks",
      monthly: "every_months",
      yearly: "every_years",
    }

    const keepField = keep[watchedFrequencyType]
    for (const f of allEveryFields) {
      if (f !== keepField) {
        setValue(`frequency.config.${f}`, null, { shouldDirty: true, shouldValidate: false })
      }
    }
  }, [watchedFrequencyType, setValue])

  useEffect(() => {
    if (!watchedFrequencyType || !watchedConfig) return
    const cron = generateCronExpression(watchedConfig, watchedFrequencyType)
    setValue("frequency.cron_expression", cron, { shouldDirty: true, shouldValidate: false })
  }, [watchedConfig, watchedFrequencyType, setValue])

  const renderField = (field: { type: string; label: string }) => {
    const isDisabled = viewMode || !isFieldEnabled(field.type)
    const baseInputClass = `h-9 border-gray-300 px-3 py-1.5 text-sm ${isDisabled ? "bg-gray-100 cursor-not-allowed" : ""}`
    
    // Check if field has error
    const hasError = showErrors && errors.frequency?.config?.[field.type as keyof typeof errors.frequency.config]
    const errorClass = hasError ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"

    switch (field.type) {
      case "year":
        return (
          <Controller
            control={control}
            name="frequency.config.year"
            render={({ field: controllerField }) => (
              <Select
                value={String(controllerField.value ?? "")}
                onValueChange={(v) => controllerField.onChange(Number(v))}
                disabled={isDisabled}
              >
                <SelectTrigger className={`${baseInputClass} ${errorClass}`}>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )
      
      case "month":
        return (
          <Controller
            control={control}
            name="frequency.config.month"
            render={({ field: controllerField }) => (
              <Select
                value={String(controllerField.value ?? "")}
                onValueChange={(v) => controllerField.onChange(Number(v))}
                disabled={isDisabled}
              >
                <SelectTrigger className={`${baseInputClass} ${errorClass}`}>
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )
      
      case "day_of_month":
        return (
          <Controller
            control={control}
            name="frequency.config.day_of_month"
            render={({ field: controllerField }) => (
              <Select
                value={String(controllerField.value ?? "")}
                onValueChange={(v) => controllerField.onChange(Number(v))}
                disabled={isDisabled}
              >
                <SelectTrigger className={`${baseInputClass} ${errorClass}`}>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {dayOfMonthOptions.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )
      
      case "day_of_week":
        return (
          <Controller
            control={control}
            name="frequency.config.day_of_week"
            render={({ field: controllerField }) => (
              <Select
                value={String(controllerField.value ?? "")}
                onValueChange={(v) => controllerField.onChange(Number(v))}
                disabled={isDisabled}
              >
                <SelectTrigger className={`${baseInputClass} ${errorClass}`}>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {dayOfWeekOptions.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )
      
      case "hour":
        return (
          <Controller
            control={control}
            name="frequency.config.hour"
            render={({ field: controllerField }) => (
              <Select
                value={String(controllerField.value ?? "")}
                onValueChange={(v) => controllerField.onChange(Number(v))}
                disabled={isDisabled}
              >
                <SelectTrigger className={`${baseInputClass} ${errorClass}`}>
                  <SelectValue placeholder="Select hour" />
                </SelectTrigger>
                <SelectContent>
                  {hourOptions.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )
      
      case "minute":
        return (
          <Controller
            control={control}
            name="frequency.config.minute"
            render={({ field: controllerField }) => (
              <Select
                value={String(controllerField.value ?? "")}
                onValueChange={(v) => controllerField.onChange(Number(v))}
                disabled={isDisabled}
              >
                <SelectTrigger className={`${baseInputClass} ${errorClass}`}>
                  <SelectValue placeholder="Select minute" />
                </SelectTrigger>
                <SelectContent>
                  {minuteOptions.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        )
      
      case "every_minutes":
      case "every_hours":
      case "every_days":
      case "every_weeks":
      case "every_months":
      case "every_years":
        return (
          <Controller
            control={control}
            name={`frequency.config.${field.type}`}
            render={({ field: controllerField }) => (
              <Input
                type="number"
                min="1"
                className={`${baseInputClass} ${errorClass}`}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                value={controllerField.value ?? ""}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === "") {
                    controllerField.onChange(null)
                  } else {
                    controllerField.onChange(Number(value))
                  }
                }}
                disabled={isDisabled}
              />
            )}
          />
        )
      
      default:
        return null
    }
  }

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      <SubformHeadline subformHeadline="Frequency Configuration" />

      <CardContent className="px-6 py-4 space-y-6">
        {showErrors && errors.frequency && Object.keys(errors.frequency).length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Please fix highlighted fields before saving.
          </div>
        )}

        {/* Basic Configuration Section */}
        <div className="space-y-3">
          <SubFormTitle title="Schedule Timing" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Frequency Type */}
            <div className="space-y-2 md:col-span-1">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Frequency Type <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="frequency.type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={viewMode}>
                    <SelectTrigger className={`h-9 px-3 py-1.5 text-sm ${showErrors && getErrorMessage(errors.frequency?.type) ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"} ${viewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {showErrors && getErrorMessage(errors.frequency?.type) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.frequency?.type)}</p>
              )}
            </div>

            {/* Timezone */}
            <div className="space-y-2 md:col-span-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Timezone <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="frequency.timezone"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={viewMode}>
                    <SelectTrigger className={`h-9 px-3 py-1.5 text-sm ${showErrors && getErrorMessage(errors.frequency?.timezone) ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"} ${viewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {showErrors && getErrorMessage(errors.frequency?.timezone) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.frequency?.timezone)}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Dynamic Configuration Fields - 3 columns layout */}
        {getVisibleFields().length > 0 && (
          <div className="space-y-3">
            <SubFormTitle title="Frequency Settings" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getVisibleFields().map((field, index) => {
                const hasError = showErrors && errors.frequency?.config?.[field.type as keyof typeof errors.frequency.config]
                return (
                  <div key={index} className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      {field.label}
                      {field.type.startsWith("every_") && (
                        <span className="text-xs font-normal text-gray-500 ml-1">(positive integer)</span>
                      )}
                    </Label>
                    {renderField(field)}
                    {hasError && (
                      <p className="text-xs text-red-600">
                        {getErrorMessage(errors.frequency?.config?.[field.type as keyof typeof errors.frequency.config])}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Keep cron expression in form state, hidden from UI */}
        <input type="hidden" {...register("frequency.cron_expression")} />
      </CardContent>
    </Card>
  )
}
