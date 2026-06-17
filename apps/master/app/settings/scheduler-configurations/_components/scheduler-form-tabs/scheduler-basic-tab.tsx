"use client"

import { Controller, type UseFormReturn } from "react-hook-form"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Label } from "@repo/ui/components/ui/label"
import { Input } from "@repo/ui/components/ui/input"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Switch } from "@repo/ui/components/ui/switch"
import { Separator } from "@repo/ui/components/ui/separator"
import { Button } from "@repo/ui/components/ui/button"
import { Play, Pause, Power, RotateCcw, FileText, Briefcase, Settings, Loader2 } from "lucide-react"
import { SubFormTitle } from "@/components/header/sub-form-title"
import SubformHeadline from "@/components/header/subform-headline"
import type { SchedulerFormValues } from "../scheduler-form-controller"
import { Bell } from "lucide-react"
import { gql, useQuery } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useMemo } from "react"
import { SingleSelectField } from "@/components/fields/single-select-field"

type Props = {
  form: UseFormReturn<SchedulerFormValues>
  viewMode: boolean
  mode: "add" | "edit" | "view"
  showErrors?: boolean
  onSave?: () => void
  onPreviousTab?: () => void
  postLoading?: boolean
}

// GraphQL Query to fetch workflows - WITHOUT criteriaRequests
const FETCH_WORKFLOWS_QUERY = gql`
  query FetchAllWorkflows {
    fetchAllWorkflows(collection: "workflows") {
      _id
      name
      initialState
      states
    }
  }
`

export default function SchedulerBasicTab({
  form,
  viewMode,
  mode,
  showErrors = false,
  onSave,
  onPreviousTab,
  postLoading,
}: Props) {
  const tenantCode = useGetTenantCode()
  
  const {
    register,
    control,
    setValue,
    formState: { errors },
  } = form

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

  // Fetch workflows - Simplified query
  const { data, loading: workflowsLoading, error: workflowsError } = useQuery(FETCH_WORKFLOWS_QUERY, {
    client,
    errorPolicy: "all",
  })

  // Transform workflows data into options format for SingleSelectField
  const workflowOptions = useMemo(() => {
    const workflows = data?.fetchAllWorkflows || []
    return workflows.map((workflow: { _id: string; name: string }) => ({
      value: workflow.name, // Using name as value
      label: workflow.name, // Using name as label
      id: workflow._id,
    }))
  }, [data])

  // Get loading state
  const isLoading = workflowsLoading

  // Get error message
  const errorMessage = workflowsError?.message || (workflowsError && "Failed to load workflows")

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      <SubformHeadline subformHeadline="Scheduler Configuration" />

      <CardContent className="px-6 py-4 space-y-6">
        {showErrors && Object.keys(errors).length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Please fix highlighted fields before saving.
          </div>
        )}

        {/* Scheduler Details Section - 3 Column Layout */}
        <div className="space-y-3">
          <SubFormTitle title="Scheduler Details" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Scheduler Name */}
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Scheduler Name <span className="text-red-500">*</span>
              </Label>
              <Input
                {...register("scheduler_name")}
                placeholder="Enter scheduler name"
                disabled={viewMode}
                className={`h-9 px-3 py-1.5 text-sm ${showErrors && getErrorMessage(errors.scheduler_name) ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"} ${viewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              {showErrors && getErrorMessage(errors.scheduler_name) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.scheduler_name)}</p>
              )}
            </div>

            {/* Scheduler Type */}
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Scheduler Type <span className="text-red-500">*</span>
              </Label>
              <Controller
                control={control}
                name="scheduler_type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange} disabled={viewMode}>
                    <SelectTrigger className={`h-9 px-3 py-1.5 text-sm ${showErrors && getErrorMessage(errors.scheduler_type) ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"} ${viewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Notification">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          <span>Notification</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Job">
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span>Job</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Report">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Report</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="Workflow">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span>Workflow</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {showErrors && getErrorMessage(errors.scheduler_type) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.scheduler_type)}</p>
              )}
            </div>

            {/* Task Name - SingleSelectField for workflows */}
            <div className="space-y-2">
              <Controller
                control={control}
                name="task"
                render={({ field }) => (
                  <SingleSelectField
                    id="task-select"
                    label="Task"
                    required
                    placeholder={isLoading ? "Loading workflows..." : "Select workflow"}
                    value={field.value || ""}
                    onChange={(value) => {
                      field.onChange(value)
                    }}
                    options={workflowOptions}
                    disabled={viewMode || isLoading}
                    errorMessage={showErrors && getErrorMessage(errors.task) ? getErrorMessage(errors.task) : undefined}
                    allowOnlyProvidedOptions
                  />
                )}
              />
              {!isLoading && !errorMessage && workflowOptions.length > 0 && (
                <p className="text-xs text-gray-500">
                  {workflowOptions.length} workflows available. Type to search.
                </p>
              )}
            </div>
          </div>

          {/* Description - Full Width */}
          <div className="space-y-2 mt-2">
            <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              {...register("description")}
              placeholder="Enter scheduler description"
              rows={3}
              disabled={viewMode}
              className={`px-3 py-1.5 text-sm resize-none ${showErrors && getErrorMessage(errors.description) ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"} ${viewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
            />
            {showErrors && getErrorMessage(errors.description) && (
              <p className="text-xs text-red-600">{getErrorMessage(errors.description)}</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Schedule Window Section - 3 Column Layout */}
        <div className="space-y-3">
          <SubFormTitle title="Schedule Window" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                {...register("schedule_window.start_date")}
                disabled={viewMode}
                className={`h-9 px-3 py-1.5 text-sm ${showErrors && getErrorMessage(errors.schedule_window?.start_date) ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"} ${viewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              {showErrors && getErrorMessage(errors.schedule_window?.start_date) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.schedule_window?.start_date)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                {...register("schedule_window.end_date")}
                disabled={viewMode}
                className={`h-9 px-3 py-1.5 text-sm ${showErrors && getErrorMessage(errors.schedule_window?.end_date) ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-gray-300"} ${viewMode ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              {showErrors && getErrorMessage(errors.schedule_window?.end_date) && (
                <p className="text-xs text-red-600">{getErrorMessage(errors.schedule_window?.end_date)}</p>
              )}
            </div>

            {/* Active Status Switch */}
            <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Power className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">Active Status</p>
                  <p className="text-xs text-[#64748b]">Enable or disable this scheduler.</p>
                </div>
              </div>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={viewMode}
                    className="h-6 w-10 bg-[#dfe7f2] data-[state=checked]:bg-[#1e3a8a]"
                  />
                )}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Scheduler Controls Section - 3 Column Layout for non-view modes */}
        {mode !== "view" && (
          <div className="space-y-3">
            <SubFormTitle title="Scheduler Controls" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Start Control Card */}
              <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">Start Scheduler</p>
                    <p className="text-xs text-[#64748b]">Begin scheduler execution.</p>
                  </div>
                </div>
                <Controller
                  control={control}
                  name="start"
                  render={({ field }) => (
                    <Button
                      type="button"
                      onClick={() => {
                        setValue("start", true, { shouldDirty: true })
                        setValue("pause", false, { shouldDirty: true })
                        setValue("restart", false, { shouldDirty: true })
                        setValue("isActive", true, { shouldDirty: true })
                      }}
                      variant={field.value ? "default" : "outline"}
                      className={
                        field.value
                          ? "bg-green-600 hover:bg-green-700 h-8 px-4 text-white"
                          : "border-green-300 text-green-700 hover:bg-green-50 h-8 px-4"
                      }
                    >
                      {field.value ? "Active" : "Start"}
                    </Button>
                  )}
                />
              </div>

              {/* Pause Control Card */}
              <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Pause className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">Pause Scheduler</p>
                    <p className="text-xs text-[#64748b]">Temporarily halt execution.</p>
                  </div>
                </div>
                <Controller
                  control={control}
                  name="pause"
                  render={({ field }) => (
                    <Button
                      type="button"
                      onClick={() => {
                        setValue("start", false, { shouldDirty: true })
                        setValue("pause", true, { shouldDirty: true })
                        setValue("restart", false, { shouldDirty: true })
                        setValue("isActive", true, { shouldDirty: true })
                      }}
                      variant={field.value ? "default" : "outline"}
                      className={
                        field.value
                          ? "bg-amber-500 hover:bg-amber-600 h-8 px-4 text-white"
                          : "border-amber-300 text-amber-700 hover:bg-amber-50 h-8 px-4"
                      }
                    >
                      {field.value ? "Paused" : "Pause"}
                    </Button>
                  )}
                />
              </div>

              {/* Resume Control Card */}
              <div className="rounded-2xl border border-[#e3e8ef] bg-[#f1f5f9] px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">Resume Scheduler</p>
                    <p className="text-xs text-[#64748b]">Resume execution from pause.</p>
                  </div>
                </div>
                <Controller
                  control={control}
                  name="restart"
                  render={({ field }) => (
                    <Button
                      type="button"
                      onClick={() => {
                        setValue("start", false, { shouldDirty: true })
                        setValue("pause", false, { shouldDirty: true })
                        setValue("restart", true, { shouldDirty: true })
                        setValue("isActive", true, { shouldDirty: true })
                      }}
                      variant={field.value ? "default" : "outline"}
                      className={
                        field.value
                          ? "bg-sky-600 hover:bg-sky-700 h-8 px-4 text-white"
                          : "border-sky-300 text-sky-700 hover:bg-sky-50 h-8 px-4"
                      }
                    >
                      {field.value ? "Resumed" : "Resume"}
                    </Button>
                  )}
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {mode !== "view" && onSave && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            {onPreviousTab && (
              <Button
                type="button"
                variant="outline"
                onClick={onPreviousTab}
                disabled={postLoading}
                className="h-9 px-4 text-sm border-gray-300 hover:bg-gray-50"
              >
                Previous
              </Button>
            )}
            <Button
              type="button"
              onClick={onSave}
              disabled={postLoading}
              className="h-9 px-4 text-sm bg-[#1e3a8a] hover:bg-[#1e40af] text-white"
            >
              {postLoading ? "Saving..." : mode === "add" ? "Create Scheduler" : "Save Changes"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
