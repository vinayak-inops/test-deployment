"use client"

import type { UseFormReturn } from "react-hook-form"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Label } from "@repo/ui/components/ui/label"
import { Input } from "@repo/ui/components/ui/input"
import { Separator } from "@repo/ui/components/ui/separator"
import { SubFormTitle } from "@/components/header/sub-form-title"
import SubformHeadline from "@/components/header/subform-headline"
import { Calendar, Clock, Activity, AlertCircle } from "lucide-react"
import type { SchedulerFormValues } from "../scheduler-form-controller"

type Props = {
  form: UseFormReturn<SchedulerFormValues>
  viewMode: boolean
  mode: "add" | "edit" | "view"
  showErrors?: boolean
}

export default function SchedulerLastExecutionTab({ form, viewMode, mode, showErrors = false }: Props) {
  const {
    register,
    watch,
    formState: { errors },
  } = form

  const watched = watch()
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

  // Determine status color and icon based on last_run_status
  const getStatusDisplay = () => {
    const status = watched.last_execution?.last_run_status?.toLowerCase()
    switch (status) {
      case "success":
      case "completed":
        return { color: "text-green-600", bg: "bg-green-50", border: "border-green-200", icon: Activity, text: "Success" }
      case "failed":
      case "error":
        return { color: "text-red-600", bg: "bg-red-50", border: "border-red-200", icon: AlertCircle, text: "Failed" }
      case "running":
      case "in-progress":
        return { color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", icon: Activity, text: "Running" }
      default:
        return { color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", icon: Clock, text: "Not Executed" }
    }
  }

  const statusDisplay = getStatusDisplay()
  const StatusIcon = statusDisplay.icon

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      <SubformHeadline subformHeadline="Last Execution Details" />

      <CardContent className="px-6 py-4 space-y-6">
        {showErrors && errors.last_execution && Object.keys(errors.last_execution).length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Please fix highlighted fields before saving.
          </div>
        )}

        

        {/* Execution Timeline - 3 Column Layout */}
        <div className="space-y-3">
          <SubFormTitle title="Execution Timeline" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Last Scheduled At
              </Label>
              <div className="relative">
                <Input
                  type="datetime-local"
                  {...register("last_execution.last_scheduled_at")}
                  disabled={viewMode}
                  className={`pl-9 h-9 border-gray-300 px-3 py-1.5 text-sm ${viewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Last Started At
              </Label>
              <div className="relative">
                <Input
                  type="datetime-local"
                  {...register("last_execution.last_started_at")}
                  disabled={viewMode}
                  className={`pl-9 h-9 border-gray-300 px-3 py-1.5 text-sm ${viewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Last Finished At
              </Label>
              <div className="relative">
                <Input
                  type="datetime-local"
                  {...register("last_execution.last_finished_at")}
                  disabled={viewMode}
                  className={`pl-9 h-9 border-gray-300 px-3 py-1.5 text-sm ${viewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                />
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Execution Details - 3 Column Layout */}
        <div className="space-y-3">
          <SubFormTitle title="Execution Details" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Last Run Status
              </Label>
              <div className="relative">
                <Input
                  {...register("last_execution.last_run_status")}
                  placeholder="e.g., success, failed, running"
                  disabled={viewMode}
                  className={`pl-9 h-9 border-gray-300 px-3 py-1.5 text-sm ${viewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                />
              </div>
              {showErrors && getErrorMessage(errors.last_execution?.last_run_status) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.last_execution?.last_run_status)}</p>
              )}
            </div>

            {/* Error Message - Takes 2 columns */}
            <div className="space-y-2 md:col-span-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Error Message
              </Label>
              <div className="relative">
                <Input
                  {...register("last_execution.error_message")}
                  placeholder="No error recorded"
                  disabled={viewMode}
                  className={`pl-9 h-9 border-gray-300 px-3 py-1.5 text-sm ${viewMode ? "bg-gray-100 cursor-not-allowed" : "bg-white"}`}
                />
              </div>
              {showErrors && getErrorMessage(errors.last_execution?.error_message) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.last_execution?.error_message)}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
