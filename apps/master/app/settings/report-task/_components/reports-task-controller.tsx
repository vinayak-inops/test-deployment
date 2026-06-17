"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useForm, type SubmitHandler, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Save, FileText, GitBranch, Users, Building2, Shield, Clock } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Separator } from "@repo/ui/components/ui/separator"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

import ReportTaskReportsTab from "./report-task-form-tabs/report-task-reports-tab"
import ReportTaskMailGroupsTab from "./report-task-form-tabs/report-task-mail-groups-tab"
import { TableFilterSection } from "./report-task-form-tabs/table-filter-section"
import { SelectReports } from "./report-task-form-tabs/select-reports"
import { StepIndicator } from "./report-task-form-tabs/step-indicator"
import { BasicInformation } from "./report-task-form-tabs/basic-information"
import type { TableMenuItem, TableType } from "./report-task-form-tabs/types"

type SectionId = "basic" | "filters" | "reports" | "mailGroups"

const reportItemSchema = z.object({
  parseID: z.string().optional().default(""),
  reportName: z.string().min(1, "Report name is required"),
  reportTitle: z.string().min(1, "Report title is required"),
  reportDescription: z.string().optional().default(""),
  workflowName: z.string().min(1, "Workflow name is required"),
  status: z.string().optional().default("PENDING"),
  fileName: z.string().optional().default(""),
})

export const reportTaskSchema = z.object({
  schedulerID: z.string().min(1, "Scheduler ID is required"),
  reportSchedulerName: z.string().min(1, "Scheduler name is required"),
  reports: z.array(reportItemSchema).min(1, "At least one report is required"),
  filters: z.object({
    tenantCode: z.string().min(1, "Tenant code is required"),
    organization: z.string().optional().default(""),
    subsidiaries: z.array(z.string()).default([]),
    divisions: z.array(z.string()).default([]),
    location: z.array(z.string()).default([]),
    designations: z.array(z.string()).default([]),
    grades: z.array(z.string()).default([]),
    departments: z.array(z.string()).default([]),
    subDepartments: z.array(z.string()).default([]),
    sections: z.array(z.string()).default([]),
    employeeCategories: z.array(z.string()).default([]),
    contractor: z.array(z.string()).default([]),
    workOrderNumber: z.array(z.string()).default([]),
    shiftGroups: z.array(z.string()).default([]),
    shifts: z.array(z.string()).default([]),
    extension: z.string().optional().default("pdf"),
    toDate: z.string().optional().default(""),
    fromDate: z.string().optional().default(""),
    period: z.string().optional().default(""),
    employeeID: z.array(z.string()).default([]),
  }),
  mailGroup: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  tenantCode: z.string().min(1, "Tenant code is required"),
  organizationCode: z.string().optional().default(""),
}).superRefine((data, ctx) => {
  const period = data.filters?.period || ""
  const fromDate = data.filters?.fromDate || ""
  const toDate = data.filters?.toDate || ""

  if (!period) return
  if (period === "Daily") return

  if (!fromDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["filters", "fromDate"],
      message: "From date is required",
    })
  }
  if (!toDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["filters", "toDate"],
      message: "To date is required",
    })
  }
})

export type ReportTaskFormValues = z.infer<typeof reportTaskSchema> & {
  _id?: string
}

export interface ReportTaskFormProps {
  initialValues?: Partial<ReportTaskFormValues>
  onSubmit?: (data: ReportTaskFormValues) => void
  isOpen?: boolean
  onClose?: () => void
  mode?: "add" | "edit" | "view"
  disabled?: boolean
  activeSection?: SectionId
  submitLoading?: boolean
}

export type ReportTaskTabProps = {
  form: UseFormReturn<ReportTaskFormValues>
  viewMode: boolean
  mode: "add" | "edit" | "view"
  showErrors: boolean
}

function splitCsv(value: string): string[] {
  return value.split(",").map((x) => x.trim()).filter(Boolean)
}

// Helper function to filter out invalid reports
const filterValidReports = (reports: any[] = []) => {
  if (!Array.isArray(reports)) return []
  
  return reports.filter(report => {
    // Check if report has valid data
    const hasValidName = report.reportName && 
                        typeof report.reportName === 'string' &&
                        report.reportName.trim() !== "" &&
                        report.reportName !== "Sample Task"
    
    const hasValidTitle = report.reportTitle && 
                         typeof report.reportTitle === 'string' &&
                         report.reportTitle.trim() !== "" &&
                         report.reportTitle !== "Sample Task"
    
    const hasValidWorkflow = report.workflowName && 
                            typeof report.workflowName === 'string' &&
                            report.workflowName.trim() !== ""
    
    // Also check if it's not an empty/default object
    const isNotEmptyObject = Object.keys(report).some(key => 
      report[key] && report[key].trim && report[key].trim() !== ""
    )
    
    return hasValidName && hasValidTitle && hasValidWorkflow && isNotEmptyObject
  })
}

const tableMenuItems: TableMenuItem[] = [
  { id: 'subsidiaries', label: 'Subsidiaries', icon: GitBranch, parent: 'organization' },
  { id: 'divisions', label: 'Divisions', icon: Users, parent: 'organization' },
  { id: 'departments', label: 'Departments', icon: Building2, parent: 'organization' },
  { id: 'subDepartments', label: 'Sub Departments', icon: Building2, parent: 'organization' },
  { id: 'sections', label: 'Sections', icon: Users, parent: 'organization' },
  { id: 'designations', label: 'Designations', icon: Users, parent: 'organization' },
  { id: 'grades', label: 'Grades', icon: Users, parent: 'organization' },
  { id: 'employeeCategories', label: 'Categories', icon: Users, parent: 'organization' },
  { id: 'contractors', label: 'Contractors', icon: Shield, parent: 'contractor' },
  { id: 'locations', label: 'Locations', icon: Building2, parent: 'organization' },
  { id: 'workOrders', label: 'Work Orders', icon: FileText, parent: 'contractor' },
  { id: 'shiftGroups', label: 'Shift Groups', icon: Clock, parent: 'shift' },
  { id: 'shifts', label: 'Shifts', icon: Clock, parent: 'shift' },
  { id: 'contractEmployees', label: 'Contract Employees', icon: Users, parent: 'contractEmployee' },
];

const emptyFilterData: Record<TableType, string[]> = {
  subsidiaries: [],
  divisions: [],
  departments: [],
  subDepartments: [],
  sections: [],
  designations: [],
  grades: [],
  employeeCategories: [],
  locations: [],
  contractors: [],
  workOrders: [],
  shiftGroups: [],
  shifts: [],
  contractEmployees: [],
}

const reportTaskSteps = [
  { number: 1, label: "Select Scheduler" },
  { number: 2, label: "Reports" },
  { number: 3, label: "Mail Groups" },
  { number: 4, label: "Basic Filter" },
  { number: 5, label: "Basic Information" },
]

export default function ReportTaskController({
  initialValues = {},
  onSubmit,
  isOpen = true,
  onClose,
  mode = "add",
  disabled = false,
  activeSection,
  submitLoading = false,
}: ReportTaskFormProps) {
  const tenantCode = useGetTenantCode()
  const [showErrors, setShowErrors] = useState(false)
  const [showSubmitStepErrors, setShowSubmitStepErrors] = useState(false)
  const [selectedReport, setSelectedReport] = useState<string | null>(
    initialValues.schedulerID || null
  )
  const [currentStep, setCurrentStep] = useState(1)
  const [visibleStepLabel, setVisibleStepLabel] = useState<number | null>(null)
  const [filterData, setFilterData] = useState<Record<TableType, string[]>>(emptyFilterData)

  // Filter initial reports to remove any default values
  const filteredInitialReports = useMemo(() => {
    return filterValidReports(initialValues.reports || [])
  }, [initialValues.reports])

  const form = useForm<ReportTaskFormValues>({
    resolver: zodResolver(reportTaskSchema),
    defaultValues: {
      schedulerID: initialValues.schedulerID || "",
      reportSchedulerName: initialValues.reportSchedulerName || "",
      // Start with empty reports array - NO DEFAULT VALUES
      reports: [],
      filters: {
        tenantCode: initialValues.filters?.tenantCode || tenantCode || "",
        organization: tenantCode || "",
        subsidiaries: initialValues.filters?.subsidiaries || [],
        divisions: initialValues.filters?.divisions || [],
        location: initialValues.filters?.location || [],
        designations: initialValues.filters?.designations || [],
        grades: initialValues.filters?.grades || [],
        departments: initialValues.filters?.departments || [],
        subDepartments: initialValues.filters?.subDepartments || [],
        sections: initialValues.filters?.sections || [],
        employeeCategories: initialValues.filters?.employeeCategories || [],
        contractor: initialValues.filters?.contractor || [],
        workOrderNumber: initialValues.filters?.workOrderNumber || [],
        shiftGroups: initialValues.filters?.shiftGroups || [],
        shifts: initialValues.filters?.shifts || [],
        extension: initialValues.filters?.extension || "pdf",
        toDate: initialValues.filters?.toDate || "",
        fromDate: initialValues.filters?.fromDate || "",
        period: initialValues.filters?.period || "",
        employeeID: initialValues.filters?.employeeID || [],
      },
      mailGroup: initialValues.mailGroup || [],
      isActive: initialValues.isActive ?? true,
      tenantCode: initialValues.tenantCode || tenantCode || "",
      organizationCode: tenantCode || "",
    },
    mode: "onChange",
  })

  const { handleSubmit, trigger, reset, watch, setValue, formState: { isSubmitting, isDirty } } = form
  const viewMode = mode === "view" || disabled

  const watchedReportSchedulerName = watch("reportSchedulerName")
  const watchedReports = watch("reports")
  const watchedMailGroup = watch("mailGroup")

  // Set filtered reports after form is initialized - ONLY if there are valid reports
  useEffect(() => {
    if (filteredInitialReports.length > 0) {
      setValue("reports", filteredInitialReports, { shouldDirty: false })
      setSelectedReport(filteredInitialReports[0]?.parseID || null)
    } else {
      // Ensure reports is empty if no valid reports exist
      setValue("reports", [], { shouldDirty: false })
    }
  }, [filteredInitialReports, setValue])

  const hasReportStepData = useMemo(() => (
    Array.isArray(watchedReports) &&
    watchedReports.length > 0 &&
    watchedReports.some((report) =>
      Boolean(report?.reportName?.trim()) &&
      Boolean(report?.reportTitle?.trim()) &&
      Boolean(report?.workflowName?.trim())
    )
  ), [watchedReports])

  const completedSteps = useMemo(() => {
    if (viewMode) return reportTaskSteps.map((step) => step.number)

    const completed: number[] = []
    const hasFilterSelections = Object.values(filterData).some((items) => items.length > 0)
    const currentPeriod = watch("filters.period")
    const hasBasicInformation =
      Boolean(watch("filters.extension")) &&
      Boolean(currentPeriod) &&
      (currentPeriod === "Daily"
        ? true
        : Boolean(watch("filters.fromDate")) && Boolean(watch("filters.toDate")))

    // Step 1: Select Scheduler - completed if scheduler is selected AND has name
    if (selectedReport && watchedReportSchedulerName?.trim()) {
      completed.push(1)
    }

    // Step 2: Reports - completed if there are valid reports data
    if (hasReportStepData) {
      completed.push(2)
    }

    // Step 3: Mail Groups - completed if has mail groups
    if (watchedMailGroup.length > 0) {
      completed.push(3)
    }

    // Step 4: Basic Filter - completed if has filter selections or reached step
    if (hasFilterSelections) {
      completed.push(4)
    }

    // Step 5: Basic Information - completed if has basic info or reached step
    if (hasBasicInformation) {
      completed.push(5)
    }

    return completed
  }, [currentStep, filterData, hasReportStepData, selectedReport, viewMode, watch, watchedMailGroup.length, watchedReportSchedulerName])

  const failedSteps = useMemo(() => {
    if (!showSubmitStepErrors || viewMode) return []

    const failed: number[] = []
    const hasFilterSelections = Object.values(filterData).some((items) => items.length > 0)

    if (!watchedReportSchedulerName?.trim()) {
      failed.push(1)
    }
    if (!hasReportStepData) {
      failed.push(2)
    }
    if (!Array.isArray(watchedMailGroup) || watchedMailGroup.length === 0) {
      failed.push(3)
    }
    if (!hasFilterSelections) {
      failed.push(4)
    }

    return failed
  }, [filterData, hasReportStepData, showSubmitStepErrors, viewMode, watchedMailGroup, watchedReportSchedulerName])

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      // Filter out any invalid reports when resetting
      const validReports = filterValidReports(initialValues.reports || [])
      
      const filteredInitialValues = {
        ...initialValues,
        reports: validReports,
        schedulerID: initialValues.schedulerID || (validReports[0]?.parseID) || "",
      }
      reset(filteredInitialValues as ReportTaskFormValues)
      setSelectedReport(
        initialValues.schedulerID ||
        validReports[0]?.parseID ||
        null
      )
      setFilterData({
        subsidiaries: initialValues.filters?.subsidiaries || [],
        divisions: initialValues.filters?.divisions || [],
        departments: initialValues.filters?.departments || [],
        subDepartments: initialValues.filters?.subDepartments || [],
        sections: initialValues.filters?.sections || [],
        designations: initialValues.filters?.designations || [],
        grades: initialValues.filters?.grades || [],
        employeeCategories: initialValues.filters?.employeeCategories || [],
        locations: initialValues.filters?.location || [],
        contractors: initialValues.filters?.contractor || [],
        workOrders: initialValues.filters?.workOrderNumber || [],
        shiftGroups: initialValues.filters?.shiftGroups || [],
        shifts: initialValues.filters?.shifts || [],
        contractEmployees: initialValues.filters?.employeeID || [],
      })
    }
  }, [initialValues, reset])

  useEffect(() => {
    if (tenantCode) {
      setValue("tenantCode", tenantCode)
      if (!watch("filters.tenantCode")) setValue("filters.tenantCode", tenantCode)
    }
  }, [tenantCode, setValue, watch])

  useEffect(() => {
    if (!activeSection) return

    const stepBySection: Record<SectionId, number> = {
      basic: 1,
      filters: 4,
      reports: 2,
      mailGroups: 3,
    }

    setCurrentStep(stepBySection[activeSection])
  }, [activeSection])

  const handleFilterDataChange = useCallback((data: Record<TableType, string[]>) => {
    setFilterData(data)
    setValue("filters.subsidiaries", data.subsidiaries, { shouldDirty: true })
    setValue("filters.divisions", data.divisions, { shouldDirty: true })
    setValue("filters.departments", data.departments, { shouldDirty: true })
    setValue("filters.subDepartments", data.subDepartments, { shouldDirty: true })
    setValue("filters.sections", data.sections, { shouldDirty: true })
    setValue("filters.designations", data.designations, { shouldDirty: true })
    setValue("filters.grades", data.grades, { shouldDirty: true })
    setValue("filters.employeeCategories", data.employeeCategories, { shouldDirty: true })
    setValue("filters.location", data.locations, { shouldDirty: true })
    setValue("filters.contractor", data.contractors, { shouldDirty: true })
    setValue("filters.workOrderNumber", data.workOrders, { shouldDirty: true })
    setValue("filters.shiftGroups", data.shiftGroups, { shouldDirty: true })
    setValue("filters.shifts", data.shifts, { shouldDirty: true })
    setValue("filters.employeeID", data.contractEmployees, { shouldDirty: true })
  }, [setValue])

  const handleReportSelection = useCallback((id: string | null) => {
    setSelectedReport(id)
    setValue("schedulerID", id || "", { shouldDirty: true })
  }, [setValue])

  const onSubmitHandler: SubmitHandler<ReportTaskFormValues> = (data) => {
    const payload = {
      ...data,
      tenantCode: tenantCode || data.tenantCode,
      filters: {
        ...data.filters,
        tenantCode: data.filters.tenantCode || tenantCode || "",
      },
      mailGroup: Array.isArray(data.mailGroup) ? data.mailGroup : splitCsv(String(data.mailGroup || "")),
      // Filter out any empty reports before submitting
      reports: filterValidReports(data.reports)
    }
    onSubmit?.(payload)
  }

  const handleSave = async () => {
    setShowSubmitStepErrors(true)
    setShowErrors(true)
    const valid = await trigger()
    if (!valid) return
    await handleSubmit(onSubmitHandler)()
  }

  const handleBasicInformationSubmit = () => {
    if (viewMode) return
    void handleSave()
  }

  const handleCancel = () => {
    reset()
    onClose?.()
  }

  if (!isOpen) return null

  const goToMailGroupsStep = async () => {
    setShowErrors(true)
    const valid = await trigger("reports")
    if (!valid) {
      setCurrentStep(2)
      return
    }
    setCurrentStep(3)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-white shadow-xl border-l border-gray-200 w-full max-w-6xl h-full overflow-hidden flex flex-col rounded-l-lg">
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCancel}
          className="h-8 w-8 rounded-full hover:bg-gray-100 fixed top-4 right-4 z-50 ml-auto"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="flex-1 overflow-hidden bg-gray-50">
          <div className="flex h-full overflow-hidden relative">
            <StepIndicator
              currentStep={currentStep}
              visibleStepLabel={visibleStepLabel}
              completedSteps={completedSteps}
              failedSteps={failedSteps}
              steps={reportTaskSteps}
              onStepChange={setCurrentStep}
              onStepLabelToggle={(step) => setVisibleStepLabel(visibleStepLabel === step ? null : step)}
              onStepLabelClose={() => setVisibleStepLabel(null)}
            />

            {currentStep === 1 && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <SelectReports
                  selectedReport={selectedReport}
                  onSelectionChange={handleReportSelection}
                  onSaveAndContinue={() => {
                    if (viewMode) return
                    setShowErrors(true)
                    if (!selectedReport || !watchedReportSchedulerName?.trim()) return
                    setCurrentStep(2)
                  }}
                  searchLabel="Select scheduler to report task"
                  searchPlaceholder="Report title, category, or keyword"
                  reportSchedulerName={watchedReportSchedulerName}
                  onReportSchedulerNameChange={(value) => {
                    setValue("reportSchedulerName", value, { shouldDirty: true })
                  }}
                  viewMode={viewMode}
                />
              </div>
            )}

            {currentStep === 4 && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <TableFilterSection
                  tableMenuItems={tableMenuItems}
                  onSaveAndContinue={viewMode ? undefined : () => setCurrentStep(5)}
                  onFilterDataChange={handleFilterDataChange}
                  filterData={filterData}
                  viewMode={viewMode}
                />
              </div>
            )}

            {currentStep === 5 && (
              <div className="flex-1 flex flex-col overflow-hidden">
                <BasicInformation
                  extension={watch("filters.extension") || ""}
                  isActive={Boolean(watch("isActive"))}
                  fromDate={watch("filters.fromDate") || ""}
                  toDate={watch("filters.toDate") || ""}
                  period={watch("filters.period") || ""}
                  onExtensionChange={(value) => setValue("filters.extension", value, { shouldDirty: true })}
                  onIsActiveChange={(value) => setValue("isActive", value, { shouldDirty: true })}
                  onFromDateChange={(value) => setValue("filters.fromDate", value, { shouldDirty: true })}
                  onToDateChange={(value) => setValue("filters.toDate", value, { shouldDirty: true })}
                  onPeriodChange={(value) => setValue("filters.period", value, { shouldDirty: true })}
                  onSubmit={handleBasicInformationSubmit}
                  isSubmitting={false}
                  submitLabel={mode === "edit" ? "Save Changes" : "Create Report Task"}
                  viewMode={viewMode}
                />
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex-1 flex flex-col overflow-y-auto">
                <ReportTaskReportsTab
                  form={form}
                  viewMode={viewMode}
                  mode={mode}
                  showErrors={showErrors}
                  onSaveAndContinue={goToMailGroupsStep}
                  continueLabel="Continue"
                />
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex-1 flex flex-col overflow-y-auto p-6">
                <ReportTaskMailGroupsTab
                  form={form}
                  viewMode={viewMode}
                  mode={mode}
                  showErrors={showErrors}
                  onSaveAndContinue={mode === "view" ? undefined : () => setCurrentStep(4)}
                  continueLabel="Continue"
                />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
