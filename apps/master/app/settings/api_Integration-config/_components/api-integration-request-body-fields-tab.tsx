"use client"

import { useMemo, useState } from "react"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { Button } from "@repo/ui/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { AlertTriangle, FileJson2, X } from "lucide-react"

export type RequestBodyField = {
  fieldName: string
  internalField: string
  internalDataType: string
  dataType: string
  required: boolean
}

interface Props {
  values: RequestBodyField[]
  onChange: (next: RequestBodyField[]) => void
  onContinue?: () => void
  showErrors?: boolean
  errorMessage?: string
  viewMode?: boolean
}

export default function ApiIntegrationRequestBodyFieldsTab({ 
  values, 
  onChange, 
  onContinue,
  showErrors = false,
  errorMessage,
  viewMode = false,
}: Props) {
  const [editorOpen, setEditorOpen] = useState(false)
  const [editIndex, setEditIndex] = useState<number | null>(null)
  const [fieldName, setFieldName] = useState("")
  const [internalField, setInternalField] = useState("")
  const [internalDataType, setInternalDataType] = useState("")
  const [dataType, setDataType] = useState("")
  const [required, setRequired] = useState(true)

  const rows = useMemo(() => [...values].reverse(), [values])
  const hasNoFields = values.length === 0

  const searchFields = useMemo<ActionTableSearchField<RequestBodyField>[]>(() => [
    { value: "fieldName", label: "Field Name", getValue: (r) => r.fieldName },
    { value: "internalField", label: "Internal Field", getValue: (r) => r.internalField },
  ], [])

  const columns = useMemo<ActionTableColumn<RequestBodyField>[]>(() => [
    { key: "slNo", label: "Sl No", render: (_row, index) => index + 1 },
    { key: "fieldName", label: "Field Name", render: (row) => row.fieldName || "-" },
    { key: "internalField", label: "Internal Field", render: (row) => row.internalField || "-" },
    { key: "internalDataType", label: "Internal Data Type", render: (row) => row.internalDataType || "-" },
    { key: "dataType", label: "Data Type", render: (row) => row.dataType || "-" },
    { key: "required", label: "Required", render: (row) => (row.required ? "Enabled" : "Disabled") },
  ], [])

  const openAdd = () => {
    setEditIndex(null)
    setFieldName("")
    setInternalField("")
    setInternalDataType("")
    setDataType("")
    setRequired(true)
    if (viewMode) return
    setEditorOpen(true)
  }

  const openEdit = (index: number) => {
    const row = values[index]
    if (!row) return
    setEditIndex(index)
    setFieldName(row.fieldName)
    setInternalField(row.internalField)
    setInternalDataType(row.internalDataType)
    setDataType(row.dataType)
    setRequired(row.required)
    if (viewMode) return
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditIndex(null)
    setFieldName("")
    setInternalField("")
    setInternalDataType("")
    setDataType("")
    setRequired(true)
  }

  const saveField = () => {
    if (viewMode || !fieldName.trim() || !internalField.trim()) return
    const payload: RequestBodyField = { 
      fieldName: fieldName.trim(), 
      internalField: internalField.trim(), 
      internalDataType: internalDataType.trim(), 
      dataType: dataType.trim(), 
      required 
    }
    const next = [...values]
    if (editIndex !== null) next[editIndex] = payload
    else next.push(payload)
    onChange(next)
    closeEditor()
  }

  return (
    <div className="flex flex-col h-full items-center pt-6 w-full">
      <div className="bg-white w-full max-w-3xl mx-auto border border-gray-200 rounded-lg shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <FileJson2 className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h2 className="text-[13px] font-semibold text-gray-900 leading-none">
              Request Body Fields ({values.length})
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              Configure request body field mappings.
            </p>
          </div>
        </div>
        <div className="px-6 py-4">
          <div className="relative">
            {editorOpen && (
              <div className="absolute z-50 right-0 top-12 w-[min(720px,100%)]">
                <Card className="w-full max-h-[80vh] flex flex-col overflow-hidden border border-gray-200 shadow-lg">
                  <CardHeader className="shrink-0 px-6 py-3 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold text-gray-700">
                        {editIndex !== null ? "Edit Field" : "Add Field"}
                      </CardTitle>
                      <button 
                        type="button" 
                        onClick={closeEditor} 
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Field Name */}
                      <div className="space-y-2">
                        <Label htmlFor="fieldName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Field Name <span className="text-red-500 normal-case">*</span>
                        </Label>
                        <Input
                          id="fieldName"
                          type="text"
                          value={fieldName}
                          onChange={(e) => setFieldName(e.target.value)}
                          placeholder="Enter field name"
                          className="h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
                        />
                        <p className="text-gray-500 text-xs mt-1">(Required)</p>
                      </div>

                      {/* Internal Field */}
                      <div className="space-y-2">
                        <Label htmlFor="internalField" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Internal Field <span className="text-red-500 normal-case">*</span>
                        </Label>
                        <Input
                          id="internalField"
                          type="text"
                          value={internalField}
                          onChange={(e) => setInternalField(e.target.value)}
                          placeholder="Enter internal field name"
                          className="h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
                        />
                        <p className="text-gray-500 text-xs mt-1">(Required)</p>
                      </div>

                      {/* Internal Data Type */}
                      <div className="space-y-2">
                        <Label htmlFor="internalDataType" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Internal Data Type
                        </Label>
                        <Input
                          id="internalDataType"
                          type="text"
                          value={internalDataType}
                          onChange={(e) => setInternalDataType(e.target.value)}
                          placeholder="e.g., String, Integer, Boolean"
                          className="h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
                        />
                        <p className="text-gray-500 text-xs mt-1">(Optional)</p>
                      </div>

                      {/* Data Type */}
                      <div className="space-y-2">
                        <Label htmlFor="dataType" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Data Type
                        </Label>
                        <Input
                          id="dataType"
                          type="text"
                          value={dataType}
                          onChange={(e) => setDataType(e.target.value)}
                          placeholder="e.g., String, Integer, Boolean"
                          className="h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
                        />
                        <p className="text-gray-500 text-xs mt-1">(Optional)</p>
                      </div>
                    </div>

                    {/* Required Checkbox */}
                    <div className="space-y-2">
                      <Label htmlFor="required" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Required Field
                      </Label>
                      <label htmlFor="required" className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          id="required"
                          type="checkbox"
                          checked={required}
                          onChange={(e) => setRequired(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>Mark this field as required</span>
                      </label>
                    </div>
                  </CardContent>
                  <CardFooter className="shrink-0 px-6 py-3 border-t border-gray-200 justify-end bg-white gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={closeEditor} 
                      className="h-8 px-3"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      className="h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white" 
                      onClick={saveField} 
                      disabled={!fieldName.trim() || !internalField.trim()}
                    >
                      {editIndex !== null ? "Save Changes" : "Add Field"}
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
            <ActionDataTable<RequestBodyField>
              rows={rows}
              columns={columns}
              searchFields={searchFields}
              defaultSearchField="fieldName"
              isViewMode={viewMode}
              onAdd={viewMode ? undefined : openAdd}
              addButtonLabel="Add Request Body Field"
              onEdit={viewMode ? undefined : (rowIndex) => openEdit(values.length - 1 - rowIndex)}
              onDelete={viewMode ? undefined : (rowIndex) => onChange(values.filter((_, i) => i !== values.length - 1 - rowIndex))}
              emptyTitle="No request body fields configured"
              emptyDescription='Use "Add Request Body Field" to create one.'
              getRowKey={(row, index) => `${row.fieldName}-${index}`}
            />
          </div>
        </div>
      </div>
      
      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 shadow-lg p-6 z-50 mt-auto">
        <div className="max-w-3xl mx-auto">
          <div className="w-[71%] mx-auto space-y-3">
            {hasNoFields && showErrors && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <p className="text-xs font-medium text-red-900">
                    {errorMessage || "Add at least one request body field to continue"}
                  </p>
                </div>
              </div>
            )}
            <Button 
              type="button" 
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={onContinue}
              disabled={hasNoFields || viewMode}
            >
              {viewMode ? "View Only" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
