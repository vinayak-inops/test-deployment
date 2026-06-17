"use client"

import { useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Settings, X, Save } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

import SchedulerBasicTab from "./scheduler-form-tabs/scheduler-basic-tab"
import SchedulerFrequencyTab from "./scheduler-form-tabs/scheduler-frequency-tab"
import SchedulerLastExecutionTab from "./scheduler-form-tabs/scheduler-last-execution-tab"
import SchedulerNotificationTab from "./scheduler-form-tabs/scheduler-notification-tab"

type SectionId = "basic" | "frequency" | "lastExecution" | "notifications"

export const schedulerSchema = z.object({
  scheduler_name: z.string().min(1, "Scheduler name is required"),
  scheduler_type: z.enum(["Notification", "Job", "Report", "Workflow"], {
    required_error: "Scheduler type is required",
  }),
  task: z.string().min(1, "Task is required"),
  description: z.string().min(1, "Description is required"),
  isActive: z.boolean().default(true),
  start: z.boolean().default(false),
  pause: z.boolean().default(false),
  restart: z.boolean().default(false),
  frequency: z.object({
    type: z.enum(["custom", "daily", "weekly", "monthly", "yearly", "hourly", "minute"]),
    config: z.object({
      year: z.coerce.number(),
      month: z.coerce.number(),
      day_of_month: z.coerce.number(),
      day_of_week: z.coerce.number(),
      hour: z.coerce.number(),
      minute: z.coerce.number(),
      every_minutes: z.coerce.number().nullable(),
      every_hours: z.coerce.number().nullable(),
      every_days: z.coerce.number().nullable(),
      every_weeks: z.coerce.number().nullable(),
      every_months: z.coerce.number().nullable(),
      every_years: z.coerce.number().nullable(),
    }),
    cron_expression: z.string().min(1, "Cron expression is required"),
    timezone: z.string().min(1, "Timezone is required"),
  }),
  schedule_window: z.object({
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
  }),
  last_execution: z.object({
    last_scheduled_at: z.string().nullable(),
    last_started_at: z.string().nullable(),
    last_finished_at: z.string().nullable(),
    last_run_status: z.string().nullable(),
    error_message: z.string().nullable(),
  }),
  notification_settings: z.object({
    on_success: z.array(z.string().email("Invalid email")),
    on_failure: z.array(z.string().email("Invalid email")),
    channels: z.array(z.string()),
  }),
})

export type SchedulerFormValues = z.infer<typeof schedulerSchema> & {
  _id?: string
  organizationCode?: string
  tenantCode?: string
  audit?: {
    created_by: string
    created_at: string
    updated_by: string | null
    updated_at: string | null
  }
}

interface SchedulerFormProps {
  initialValues?: Partial<SchedulerFormValues>
  onSubmit?: (data: SchedulerFormValues) => void
  isOpen?: boolean
  onClose?: () => void
  mode?: "add" | "edit" | "view"
  disabled?: boolean
  activeSection?: SectionId
  submitLoading?: boolean
}

const INPUT_CLASS = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
const LABEL_CLASS = "block text-xs font-medium text-gray-700 uppercase tracking-wide"
const TEXTAREA_CLASS = "border-gray-300 px-3 py-2 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
const DISABLED_CLASS = "bg-gray-100 cursor-not-allowed"

export default function SchedulerFormController({
  initialValues = {},
  onSubmit,
  isOpen = true,
  onClose,
  mode = "add",
  disabled = false,
  activeSection,
  submitLoading = false,
}: SchedulerFormProps) {
  const tenantCode = useGetTenantCode()
  const [showErrors, setShowErrors] = useState(false)
  
  // Refs for each section
  const basicRef = useRef<HTMLDivElement>(null)
  const frequencyRef = useRef<HTMLDivElement>(null)
  const lastExecutionRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  const form = useForm<SchedulerFormValues>({
    resolver: zodResolver(schedulerSchema),
    defaultValues: {
      scheduler_name: initialValues.scheduler_name || "",
      scheduler_type: initialValues.scheduler_type || "Notification",
      task: initialValues.task || "",
      description: initialValues.description || "",
      isActive: initialValues.isActive ?? true,
      start: initialValues.start ?? false,
      pause: initialValues.pause ?? false,
      restart: initialValues.restart ?? false,
      frequency: {
        type: initialValues.frequency?.type || "custom",
        config: {
          year: Number(initialValues.frequency?.config?.year ?? 0),
          month: Number(initialValues.frequency?.config?.month ?? 0),
          day_of_month: Number(initialValues.frequency?.config?.day_of_month ?? 0),
          day_of_week: Number(initialValues.frequency?.config?.day_of_week ?? 0),
          hour: Number(initialValues.frequency?.config?.hour ?? 0),
          minute: Number(initialValues.frequency?.config?.minute ?? 0),
          every_minutes: initialValues.frequency?.config?.every_minutes ?? null,
          every_hours: initialValues.frequency?.config?.every_hours ?? null,
          every_days: initialValues.frequency?.config?.every_days ?? null,
          every_weeks: initialValues.frequency?.config?.every_weeks ?? null,
          every_months: initialValues.frequency?.config?.every_months ?? null,
          every_years: initialValues.frequency?.config?.every_years ?? null,
        },
        cron_expression: initialValues.frequency?.cron_expression || "0 0 0 * * *",
        timezone: initialValues.frequency?.timezone || "Asia/Kolkata",
      },
      schedule_window: initialValues.schedule_window || {
        start_date: "",
        end_date: "",
      },
      last_execution: initialValues.last_execution || {
        last_scheduled_at: null,
        last_started_at: null,
        last_finished_at: null,
        last_run_status: null,
        error_message: null,
      },
      notification_settings: initialValues.notification_settings || {
        on_success: [],
        on_failure: [],
        channels: ["email"],
      },
    },
    mode: "onChange",
  })

  const {
    handleSubmit,
    trigger,
    reset,
    watch,
    setValue,
    formState: { isSubmitting, isDirty },
  } = form

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      reset(initialValues as SchedulerFormValues)
    }
  }, [initialValues, reset])

  const watchedFrequencyType = watch("frequency.type")
  const watchedConfig = watch("frequency.config")
  const watchedStart = watch("start")
  const watchedPause = watch("pause")
  const watchedRestart = watch("restart")
  const watchedIsActive = watch("isActive")

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
    const cron = generateCronExpression(watchedConfig, watchedFrequencyType)
    setValue("frequency.cron_expression", cron, { shouldDirty: true })
  }, [watchedConfig, watchedFrequencyType, setValue])

  useEffect(() => {
    // Cancel state: deactivate and clear all action flags.
    if (!watchedIsActive) {
      if (watchedStart) setValue("start", false, { shouldDirty: true, shouldValidate: false })
      if (watchedPause) setValue("pause", false, { shouldDirty: true, shouldValidate: false })
      if (watchedRestart) setValue("restart", false, { shouldDirty: true, shouldValidate: false })
      return
    }

    // Mutually exclusive action flags when active.
    if (watchedStart) {
      if (watchedPause) setValue("pause", false, { shouldDirty: true, shouldValidate: false })
      if (watchedRestart) setValue("restart", false, { shouldDirty: true, shouldValidate: false })
      return
    }

    if (watchedPause) {
      if (watchedStart) setValue("start", false, { shouldDirty: true, shouldValidate: false })
      if (watchedRestart) setValue("restart", false, { shouldDirty: true, shouldValidate: false })
      return
    }

    if (watchedRestart) {
      if (watchedStart) setValue("start", false, { shouldDirty: true, shouldValidate: false })
      if (watchedPause) setValue("pause", false, { shouldDirty: true, shouldValidate: false })
    }
  }, [watchedStart, watchedPause, watchedRestart, watchedIsActive, setValue])

  const onSubmitHandler: SubmitHandler<SchedulerFormValues> = (data) => {
    if (onSubmit) onSubmit({ ...data, tenantCode: tenantCode || data.tenantCode })
  }

  const handleSave = async () => {
    setShowErrors(true)
    const valid = await trigger()
    if (!valid) return
    await handleSubmit(onSubmitHandler)()
  }

  // Scroll to section when activeSection changes
  useEffect(() => {
    if (!activeSection) return

    const map: Record<SectionId, RefObject<HTMLDivElement | null>> = {
      basic: basicRef,
      frequency: frequencyRef,
      lastExecution: lastExecutionRef,
      notifications: notificationsRef,
    }

    const sectionRef = map[activeSection]
    if (sectionRef?.current) {
      sectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest"
      })
    }
  }, [activeSection])

  if (!isOpen) return null

  const viewMode = mode === "view" || disabled

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-white shadow-xl border-l border-gray-200 w-full max-w-5xl h-full overflow-hidden flex flex-col rounded-l-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Settings className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {mode === "edit" ? "Edit Scheduler" : mode === "view" ? "View Scheduler" : "Add Scheduler"}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Configure scheduler details, frequency, execution and notifications</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <Card className="border-0 shadow-none rounded-none">
            <CardContent className="px-6 py-6 space-y-8">
              
              {/* Basic Details Section */}
              <div id="basic" ref={basicRef} className="scroll-mt-4">
                <SchedulerBasicTab
                  form={form}
                  viewMode={viewMode}
                  mode={mode}
                  showErrors={showErrors}
                />
              </div>

              <Separator />

              {/* Frequency Section */}
              <div id="frequency" ref={frequencyRef} className="scroll-mt-4">
                <SchedulerFrequencyTab
                  form={form}
                  viewMode={viewMode}
                  mode={mode}
                  showErrors={showErrors}
                />
              </div>

              <Separator />

              {/* Last Execution Section */}
              <div id="lastExecution" ref={lastExecutionRef} className="scroll-mt-4">
                <SchedulerLastExecutionTab form={form} mode={mode} viewMode={viewMode} showErrors={showErrors} />
              </div>

              <Separator />

              {/* Notifications Section */}
              <div id="notifications" ref={notificationsRef} className="scroll-mt-4">
                <SchedulerNotificationTab
                  form={form}
                  viewMode={viewMode}
                  mode={mode}
                  showErrors={showErrors}
                />
              </div>

            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white rounded-b-lg flex justify-end gap-3 flex-shrink-0">
          <Button variant="outline" size="default" className="bg-white hover:bg-gray-50" onClick={onClose}>
            Cancel
          </Button>
          {mode !== "view" && (
            <Button
              size="default"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleSave}
              disabled={submitLoading || isSubmitting || (!isDirty && mode === "edit")}
            >
              <Save className="h-4 w-4 mr-2" />
              {submitLoading ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Scheduler"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
