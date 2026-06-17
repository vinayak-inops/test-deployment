"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Separator } from "@repo/ui/components/ui/separator"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { Workflow, Activity, Hash, X, FileText, AlertTriangle } from "lucide-react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { SingleSelectField, type SingleSelectOption } from "@/components/fields/single-select-field"
import type { ReportTaskTabProps } from "../reports-task-controller"

type ReportRow = {
  reportName: string
  reportTitle: string
  workflowName: string
  status: string
  fileName: string
  parseID: string
  reportDescription: string
}

// Empty template - NOT a default value, just a template for new entries
const emptyReportRow: ReportRow = {
  reportName: "",
  reportTitle: "",
  workflowName: "",
  status: "INITIATED",
  fileName: "",
  parseID: "",
  reportDescription: "",
}

type ReportOptionFromAPI = {
  value?: string
  label?: string
  workflowName?: string
  description?: string
}

type ReportItemFromAPI = {
  options?: ReportOptionFromAPI[]
}

export default function ReportTaskReportsTab({
  form,
  viewMode,
  showErrors = false,
  onSaveAndContinue,
  continueLabel = "Continue",
}: ReportTaskTabProps & { onSaveAndContinue?: () => void; continueLabel?: string }) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form

  const tenantCode = useGetTenantCode()
  const values = watch("reports") || []
  
  // CRITICAL: Filter out ANY empty or default report entries
  const filteredValues = useMemo(() => {
    if (!Array.isArray(values)) return []
    
    return values.filter(report => {
      // Check if this is a valid report with actual data
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
      
      // Also check if the report has any meaningful data
      const hasMeaningfulData = hasValidName || hasValidTitle || hasValidWorkflow
      
      return hasValidName && hasValidTitle && hasValidWorkflow && hasMeaningfulData
    })
  }, [values])
  
  const [editorOpen, setEditorOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [draft, setDraft] = useState<ReportRow>(emptyReportRow)

  const {
    data: reportsData,
    refetch: refetchReports,
  } = useRequest<ReportItemFromAPI[]>({
    url: "tenantReportConfiguration/search",
    method: "POST",
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode,
      },
    ],
    dependencies: [tenantCode],
  })

  useEffect(() => {
    if (tenantCode) {
      refetchReports()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  const hasErrors = Array.isArray(errors.reports) && errors.reports.length > 0
  const hasNoReports = filteredValues.length === 0

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

  // Create rows from filtered values - this will be empty if no valid reports exist
  const rows = useMemo<ReportRow[]>(() => {
    // If no filtered values, return empty array
    if (!filteredValues.length) return []
    
    return filteredValues.map((row) => ({
      reportName: row.reportName || "",
      reportTitle: row.reportTitle || "",
      workflowName: row.workflowName || "",
      status: row.status || "",
      fileName: row.fileName || "",
      parseID: row.parseID || "",
      reportDescription: row.reportDescription || "",
    })).reverse()
  }, [filteredValues])

  const searchFields = useMemo<ActionTableSearchField<ReportRow>[]>(() => [
    { value: "reportName", label: "Report Name", getValue: (row) => row.reportName },
    { value: "reportTitle", label: "Report Title", getValue: (row) => row.reportTitle },
  ], [])

  const columns = useMemo<ActionTableColumn<ReportRow>[]>(() => [
    { key: "slNo", label: "Sl No", render: (_row, index) => index + 1 },
    { key: "reportName", label: "Report Name", render: (row) => row.reportName || "-" },
    { key: "reportTitle", label: "Report Title", render: (row) => row.reportTitle || "-" },
    { key: "reportDescription", label: "Description", render: (row) => row.reportDescription || "-" },
  ], [])

  const reportOptions = useMemo<SingleSelectOption[]>(() => {
    const options = Array.isArray(reportsData) ? (reportsData[0]?.options || []) : []
    if (!options.length) return []

    const unique = new Map<string, string>()
    for (const report of options) {
      const reportName = (report.value || "").trim()
      if (!reportName || unique.has(reportName)) continue
      unique.set(reportName, (report.label || report.workflowName || reportName).trim())
    }

    return Array.from(unique.entries()).map(([reportName, workflowName]) => ({
      value: reportName,
      label: workflowName || reportName,
      tooltip: workflowName,
    }))
  }, [reportsData])

  const workflowByReportName = useMemo(() => {
    const map = new Map<string, string>()
    const options = Array.isArray(reportsData) ? (reportsData[0]?.options || []) : []
    for (const report of options) {
      const reportName = (report.value || "").trim()
      if (!reportName || map.has(reportName)) continue
      map.set(reportName, (report.workflowName || report.label || reportName).trim())
    }
    return map
  }, [reportsData])

  const toOriginalIndex = (displayIndex: number) => filteredValues.length - 1 - displayIndex

  const openAdd = () => {
    setEditIndex(null)
    setDraft(emptyReportRow)
    setEditorOpen(true)
  }

  const openEdit = (index: number) => {
    const current = filteredValues[index]
    if (!current) return

    setEditIndex(index)
    setDraft({
      reportName: current.reportName || "",
      reportTitle: current.reportTitle || "",
      workflowName: current.workflowName || "",
      status: current.status || "INITIATED",
      fileName: current.fileName || "",
      parseID: current.parseID || "",
      reportDescription: current.reportDescription || "",
    })
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditIndex(null)
    setDraft(emptyReportRow)
  }

  const updateDraft = (field: keyof ReportRow, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }))
  }

  const handleReportNameChange = (value: string) => {
    const workflowName = workflowByReportName.get(value) || ""
    setDraft((prev) => ({
      ...prev,
      reportName: value,
      workflowName: workflowName || prev.workflowName,
    }))
  }

  const handleSaveReport = () => {
    // Don't save if it's empty
    if (!draft.reportName.trim() || !draft.reportTitle.trim()) {
      return
    }
    
    const nextValues = [...filteredValues]

    if (editIndex !== null) {
      nextValues[editIndex] = draft
    } else {
      nextValues.push(draft)
    }

    setValue("reports", nextValues, { shouldDirty: true, shouldValidate: false }) // Don't validate immediately
    closeEditor()
  }

  const handleDelete = (index: number) => {
    const nextValues = filteredValues.filter((_, currentIndex) => currentIndex !== index)
    setValue("reports", nextValues, { shouldDirty: true, shouldValidate: false }) // Don't validate immediately
  }

  const handleContinue = () => {
    // Set showErrors to true to display validation errors
    if (onSaveAndContinue) {
      // Trigger validation on the form
      setValue("reports", filteredValues, { shouldValidate: true })
      onSaveAndContinue()
    }
  }

  const editorErrors = editIndex !== null && Array.isArray(errors.reports) ? errors.reports[editIndex] : undefined
  const disableSave = !draft.reportName.trim() || !draft.reportTitle.trim()

  return (
    <div className="flex flex-col h-full items-center pt-6 w-full">
      <div className="bg-white w-full max-w-3xl mx-auto border border-gray-200 rounded-lg shadow-sm">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
        <div className="p-1.5 bg-blue-100 rounded-lg">
          <FileText className="h-4 w-4 text-blue-600" />
        </div>
        <div>
          <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
            Report Entries ({filteredValues.length})
          </h2>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
            Add or update report configuration details.
          </p>
        </div>
      </div>

      <div className="px-6 py-4 space-y-6">
        {/* Error messages only show after Continue button is clicked */}
        {/* {showErrors && hasErrors && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Please fix highlighted report fields before saving.
          </div>
        )} */}

        {/* Show validation error when no reports exist - only after Continue button click */}
        {/* {showErrors && hasNoReports && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>At least one report is required. Please add a report to continue.</span>
          </div>
        )} */}

        <div className="relative">
          {editorOpen && !viewMode && (
            <div className="absolute z-50 right-0 top-12 w-[min(560px,100%)]">
              <Card className="w-full max-h-[80vh] flex flex-col overflow-hidden border border-gray-200 shadow-lg">
                <CardHeader className="shrink-0 px-6 py-3 border-b border-gray-200 bg-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-gray-700">
                      {editIndex !== null ? "Edit Report" : "Add Report"}
                    </CardTitle>
                    <button
                      type="button"
                      onClick={closeEditor}
                      className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                      aria-label="Close popup"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 overflow-y-auto px-6 py-4 space-y-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <SingleSelectField
                        label="Report Name"
                        required
                        placeholder="Select report name"
                        value={draft.reportName}
                        onChange={handleReportNameChange}
                        options={reportOptions}
                        showOnlyValueInTrigger={false}
                        errorMessage={showErrors ? getErrorMessage(editorErrors?.reportName) : undefined}
                        allowOnlyProvidedOptions
                        showValueInOptions={false}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Report Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={draft.reportTitle}
                        onChange={(e) => updateDraft("reportTitle", e.target.value)}
                        placeholder="Report Title"
                        className={`h-9 border-gray-300 ${showErrors && getErrorMessage(editorErrors?.reportTitle) ? "" : ""}`}
                      />
                    </div>

                    <div className="space-y-2">
                      {/* Hidden fields (still submitted to backend, not editable here) */}
                      <input type="hidden" value={draft.workflowName} readOnly />
                      <input type="hidden" value={draft.status} readOnly />
                      <input type="hidden" value={draft.fileName} readOnly />
                      <input type="hidden" value={draft.parseID} readOnly />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Report Description</Label>
                    <Textarea
                      value={draft.reportDescription}
                      onChange={(e) => updateDraft("reportDescription", e.target.value)}
                      rows={3}
                      placeholder="Report Description"
                      className="border-gray-300 text-sm"
                    />
                  </div>
                </CardContent>

                <CardFooter className="shrink-0 px-6 py-3 border-t border-gray-200 justify-end bg-white gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={closeEditor} className="h-8 px-3">
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSaveReport}
                    disabled={disableSave}
                  >
                    {editIndex !== null ? "Save Changes" : "Add Report"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}

          {/* Only show red border after Continue button is clicked */}
          <div className={showErrors && (hasErrors || hasNoReports) ? "" : ""}>
            <ActionDataTable<ReportRow>
              rows={rows}
              columns={columns}
              searchFields={searchFields}
              defaultSearchField="reportName"
              isViewMode={viewMode}
              onAdd={!viewMode ? openAdd : undefined}
              addButtonLabel="Add Report"
              onEdit={!viewMode ? (rowIndex) => openEdit(toOriginalIndex(rowIndex)) : undefined}
              onDelete={!viewMode ? (rowIndex) => handleDelete(toOriginalIndex(rowIndex)) : undefined}
              emptyTitle="No reports configured"
              emptyDescription='Use "Add Report" to create one.'
              getRowKey={(row, index) => `${row.reportName || "report"}-${toOriginalIndex(index)}`}
            />
          </div>
        </div>
      </div>
    </div>

      {/* Unified Save Button - Sticky to bottom - Disabled until at least one report is added */}
      {!viewMode && onSaveAndContinue && (
        <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 shadow-lg p-6 z-50 mt-auto">
          <div className="max-w-3xl mx-auto">
            <div className="w-[71%] mx-auto space-y-3">
              {hasNoReports && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                    <p className="text-xs font-medium text-red-900">
                      Add at least one report to continue
                    </p>
                  </div>
                </div>
              )}
              <Button
                type="button"
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleContinue}
                disabled={hasNoReports}
              >
                {continueLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
