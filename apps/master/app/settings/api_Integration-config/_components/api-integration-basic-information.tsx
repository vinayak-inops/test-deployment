"use client"

import { useState } from "react"
import { FileText, Info } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import SingleSelectField from "@/components/fields/single-select-field"

interface Props {
  apiName: string
  server: string
  method: string
  url: string
  contentType: string
  requestBodyType: string
  isActive: boolean
  onApiNameChange: (value: string) => void
  onServerChange: (value: string) => void
  onMethodChange: (value: string) => void
  onUrlChange: (value: string) => void
  onContentTypeChange: (value: string) => void
  onRequestBodyTypeChange: (value: string) => void
  onIsActiveChange: (value: boolean) => void
  onContinue: () => void
  viewMode?: boolean
}

export default function ApiIntegrationBasicInformation(props: Props) {
  const isViewMode = props.viewMode === true
  const [errors, setErrors] = useState({
    apiName: "",
    server: "",
    method: "",
    url: "",
  })

  const validateForm = () => {
    const nextErrors = { apiName: "", server: "", method: "", url: "" }
    let hasErrors = false
    if (!props.apiName.trim()) { nextErrors.apiName = "API name is required"; hasErrors = true }
    if (!props.server.trim()) { nextErrors.server = "Server is required"; hasErrors = true }
    if (!props.method.trim()) { nextErrors.method = "Method is required"; hasErrors = true }
    if (!props.url.trim()) { nextErrors.url = "URL is required"; hasErrors = true }
    setErrors(nextErrors)
    return !hasErrors
  }

  const handleContinue = () => {
    if (validateForm()) props.onContinue()
  }

  const isValid = props.apiName.trim() && props.server.trim() && props.method.trim() && props.url.trim()

  // Method options
  const methodOptions = [
    { value: "GET", label: "GET" },
    { value: "POST", label: "POST" },
    { value: "PUT", label: "PUT" },
    { value: "DELETE", label: "DELETE" },
    { value: "PATCH", label: "PATCH" },
    { value: "HEAD", label: "HEAD" },
    { value: "OPTIONS", label: "OPTIONS" },
  ]

  // Request body type options
  const requestBodyTypeOptions = [
    { value: "none", label: "None (No Body)" },
    { value: "json", label: "JSON" },
    { value: "xml", label: "XML" },
    { value: "form-data", label: "Form Data" },
    { value: "x-www-form-urlencoded", label: "URL Encoded" },
    { value: "raw-text", label: "Raw Text" },
    { value: "binary", label: "Binary" },
    { value: "graphql", label: "GraphQL" },
  ]

  // Content-Type options
  const contentTypeOptions = [
    { value: "application/json", label: "application/json" },
    { value: "application/xml", label: "application/xml" },
    { value: "text/xml", label: "text/xml" },
    { value: "application/x-www-form-urlencoded", label: "application/x-www-form-urlencoded" },
    { value: "multipart/form-data", label: "multipart/form-data" },
    { value: "text/plain", label: "text/plain" },
    { value: "text/html", label: "text/html" },
    { value: "application/javascript", label: "application/javascript" },
    { value: "application/octet-stream", label: "application/octet-stream" },
    { value: "application/pdf", label: "application/pdf" },
    { value: "image/jpeg", label: "image/jpeg" },
    { value: "image/png", label: "image/png" },
    { value: "application/graphql", label: "application/graphql" },
  ]

  // Auto-update Content-Type based on Request Body Type selection
  const handleRequestBodyTypeChange = (value: string) => {
    props.onRequestBodyTypeChange(value)
    
    // Auto-select appropriate Content-Type based on body type
    const contentTypeMap: Record<string, string> = {
      "json": "application/json",
      "xml": "application/xml",
      "form-data": "multipart/form-data",
      "x-www-form-urlencoded": "application/x-www-form-urlencoded",
      "raw-text": "text/plain",
      "graphql": "application/graphql",
      "binary": "application/octet-stream",
    }
    
    if (contentTypeMap[value]) {
      props.onContentTypeChange(contentTypeMap[value])
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="w-full max-w-3xl mx-auto space-y-6 mt-6 pb-6">
          {/* Unified Form: API Basic Information */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="px-6 py-3 border-b border-gray-200">
              <div className="flex items-center gap-3 mb-0">
                <div className="p-1.5 bg-gray-100 rounded-lg">
                  <FileText className="h-4 w-4 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">API Basic Information</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Configure API endpoint details and activation status.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 space-y-6">
              <form onSubmit={(e) => { e.preventDefault(); handleContinue(); }} className="space-y-6">
                {/* API Details Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">API Details</h3>
                    <p className="text-sm text-gray-500 mt-1">Set endpoint and payload metadata</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* API Name */}
                    <div className="space-y-2">
                      <Label htmlFor="apiName" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        API Name <span className="text-red-500 normal-case">*</span>
                      </Label>
                      <Input
                        id="apiName"
                        type="text"
                        value={props.apiName}
                        onChange={(e) => props.onApiNameChange(e.target.value)}
                        disabled={isViewMode}
                        placeholder="Enter API name"
                        className={`h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition ${
                          errors.apiName 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                            : ""
                        }`}
                      />
                      {errors.apiName ? (
                        <p className="text-red-500 text-xs mt-1">{errors.apiName}</p>
                      ) : (
                        <p className="text-gray-500 text-xs mt-1">(Required)</p>
                      )}
                    </div>

                    {/* Server */}
                    <div className="space-y-2">
                      <Label htmlFor="server" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Server <span className="text-red-500 normal-case">*</span>
                      </Label>
                      <Input
                        id="server"
                        type="text"
                        value={props.server}
                        onChange={(e) => props.onServerChange(e.target.value)}
                        disabled={isViewMode}
                        placeholder="Enter server URL"
                        className={`h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition ${
                          errors.server 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                            : ""
                        }`}
                      />
                      {errors.server ? (
                        <p className="text-red-500 text-xs mt-1">{errors.server}</p>
                      ) : (
                        <p className="text-gray-500 text-xs mt-1">(Required)</p>
                      )}
                    </div>

                    {/* Method - Using SingleSelectField */}
                    <SingleSelectField
                      label="Method"
                      value={props.method}
                      onChange={props.onMethodChange}
                      disabled={isViewMode}
                      options={methodOptions}
                      placeholder="Select method"
                      showOnlyValueInTrigger={true}
                      allowOnlyProvidedOptions={true}
                      className="space-y-0"
                      errorMessage={errors.method}
                    />

                    {/* URL */}
                    <div className="space-y-2">
                      <Label htmlFor="url" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        URL <span className="text-red-500 normal-case">*</span>
                      </Label>
                      <Input
                        id="url"
                        type="text"
                        value={props.url}
                        onChange={(e) => props.onUrlChange(e.target.value)}
                        disabled={isViewMode}
                        placeholder="Enter endpoint URL"
                        className={`h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition ${
                          errors.url 
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500" 
                            : ""
                        }`}
                      />
                      {errors.url ? (
                        <p className="text-red-500 text-xs mt-1">{errors.url}</p>
                      ) : (
                        <p className="text-gray-500 text-xs mt-1">(Required)</p>
                      )}
                    </div>

                    {/* Request Body Type - Using SingleSelectField */}
                    <SingleSelectField
                      label="Request Body Type"
                      value={props.requestBodyType}
                      onChange={handleRequestBodyTypeChange}
                      disabled={isViewMode}
                      options={requestBodyTypeOptions}
                      placeholder="Select body type"
                      showOnlyValueInTrigger={true}
                      allowOnlyProvidedOptions={true}
                      className="space-y-0"
                    />

                    {/* Content-Type - Using SingleSelectField */}
                    <SingleSelectField
                      label="Content-Type"
                      value={props.contentType}
                      onChange={props.onContentTypeChange}
                      disabled={isViewMode}
                      options={contentTypeOptions}
                      placeholder="Select content type"
                      showOnlyValueInTrigger={true}
                      allowOnlyProvidedOptions={true}
                      className="space-y-0"
                    />
                  </div>
                  
                  {/* Helper text for optional fields */}
                  <div className="text-xs text-gray-500 mt-2">
                    <p>Note: Request Body Type and Content-Type are optional fields.</p>
                  </div>
                </div>

                {/* Activation Status Section */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Activation Status</h3>
                    <p className="text-sm text-gray-500 mt-1">Enable or disable this API configuration</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="isActive" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Is Active
                    </Label>
                    <label htmlFor="isActive" className="inline-flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        id="isActive"
                        type="checkbox"
                        checked={props.isActive}
                        onChange={(e) => props.onIsActiveChange(e.target.checked)}
                        disabled={isViewMode}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Enable this API configuration</span>
                    </label>
                  </div>

                  {/* Info Message */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Info className="h-4 w-4" />
                    When enabled, this API will be available for integration.
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Continue Button - Sticky to bottom */}
      <div className="sticky bottom-0 w-full bg-white border-t border-gray-200 shadow-lg p-6 z-50 mt-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-center">
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!isValid || isViewMode}
              className="w-[71%] h-10 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isViewMode ? "View Only" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
