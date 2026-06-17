"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Controller, type UseFormReturn } from "react-hook-form"
import ActionDataTable, { type ActionTableColumn, type ActionTableSearchField } from "@/components/common/action-data-table"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Separator } from "@repo/ui/components/ui/separator"
import { SubFormTitle } from "@/components/header/sub-form-title"
import SubformHeadline from "@/components/header/subform-headline"
import { Mail, Bell, AlertCircle, CheckCircle, MessageSquare, Slack, Tv, Trash2, X, Users, UserPlus } from "lucide-react"
import { SingleSelectField } from "@/components/fields/single-select-field"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { gql, useQuery } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import type { SchedulerFormValues } from "../scheduler-form-controller"

type EmailRow = { email: string }
const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

const FETCH_COMPANY_EMPLOYEE_QUERY = gql`
  query FetchCompanyEmployee($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchCompanyEmployee(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      employeeID
      emailID
      middleName
      firstName
      lastName
      isDeleted
    }
  }
`

type EmailTableSectionProps = {
  title: string
  description: string
  icon: ReactNode
  rows: string[]
  onChange: (next: string[]) => void
  viewMode: boolean
  showErrors: boolean
  errorMessage?: string
  keyPrefix: string
  emailOptions: Array<{ value: string; label: string }>
}

function EmailTableSection({
  title,
  description,
  icon,
  rows,
  onChange,
  viewMode,
  showErrors,
  errorMessage,
  keyPrefix,
  emailOptions,
}: EmailTableSectionProps) {
  const [emailInput, setEmailInput] = useState("")
  const [selectedEmailFromDropdown, setSelectedEmailFromDropdown] = useState("")
  const [localInputError, setLocalInputError] = useState("")
  const [addFormOpen, setAddFormOpen] = useState(false)
  const [emailSelectionMode, setEmailSelectionMode] = useState<"existing" | "new">("existing")

  // Sort rows to show newly added emails at the top (reverse order)
  const tableRows = useMemo<EmailRow[]>(() => {
    return rows.map((email) => ({ email })).reverse()
  }, [rows])

  const columns = useMemo<ActionTableColumn<EmailRow>[]>(
    () => [
      {
        key: "slNo",
        label: "Sl No",
        render: (_row, index) => index + 1,
      },
      {
        key: "email",
        label: "Email",
        render: (row) => row.email,
      },
      {
        key: "action",
        label: "Action",
        render: (_row, index) =>
          viewMode ? null : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full text-slate-400 hover:text-red-600 hover:bg-slate-100"
              title="Remove"
              aria-label="Remove email"
              onClick={() => onChange(rows.filter((_email, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ),
      },
    ],
    [onChange, rows, viewMode]
  )

  const searchFields = useMemo<ActionTableSearchField<EmailRow>[]>(
    () => [{ value: "email", label: "Email", getValue: (row) => row.email }],
    []
  )

  const addEmail = (raw: string) => {
    const nextEmails = raw
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .filter((item) => isValidEmail(item))
      .filter((item, idx, arr) => arr.indexOf(item) === idx)

    if (!nextEmails.length) {
      setLocalInputError("Enter a valid email address")
      return
    }

    const merged = [...rows]
    for (const email of nextEmails) {
      if (!merged.includes(email)) merged.push(email)
    }

    onChange(merged)
    setEmailInput("")
    setSelectedEmailFromDropdown("")
    setLocalInputError("")
    setAddFormOpen(false)
    setEmailSelectionMode("existing")
  }

  const handleAddClick = () => {
    if (emailSelectionMode === "existing" && selectedEmailFromDropdown) {
      addEmail(selectedEmailFromDropdown)
    } else if (emailSelectionMode === "new" && emailInput) {
      addEmail(emailInput)
    }
  }

  return (
    <div className="space-y-3">
      <SubFormTitle title={title} />

      <div className="">
        <div className="space-y-4">
          <div className="relative">
            <div className="space-y-4">
              {addFormOpen && !viewMode && (
                <div className="absolute z-30 right-0 top-12 w-[min(520px,100%)]">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-4 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">Add Email Address</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAddFormOpen(false)
                          setEmailSelectionMode("existing")
                          setEmailInput("")
                          setSelectedEmailFromDropdown("")
                          setLocalInputError("")
                        }}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <Separator />

                    {/* Selection Mode Toggle */}
                    <div className="space-y-3">
                      <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                        Choose Email Source
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setEmailSelectionMode("existing")}
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                            emailSelectionMode === "existing"
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <Users className="h-4 w-4" />
                          <span className="text-sm font-medium">Existing Employee</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEmailSelectionMode("new")}
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                            emailSelectionMode === "new"
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          <UserPlus className="h-4 w-4" />
                          <span className="text-sm font-medium">New Email</span>
                        </button>
                      </div>
                    </div>

                    <Separator />

                    {/* Dynamic Field Based on Selection */}
                    {emailSelectionMode === "existing" ? (
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Select Employee
                        </Label>
                        <SingleSelectField
                          id={`${keyPrefix}-email-select`}
                          label=""
                          placeholder="Search by employee name or email"
                          value={selectedEmailFromDropdown}
                          onChange={(v) => {
                            setSelectedEmailFromDropdown(v)
                            if (localInputError) setLocalInputError("")
                          }}
                          options={emailOptions}
                          allowOnlyProvidedOptions
                        />
                        <p className="text-xs text-[#64748b]">
                          Select an employee from the dropdown
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                          Email Address(es)
                        </Label>
                        <Input
                          value={emailInput}
                          onChange={(e) => {
                            setEmailInput(e.target.value)
                            if (localInputError) setLocalInputError("")
                          }}
                          placeholder="Enter email address(es), comma separated"
                          className="h-9 border-gray-300 px-3 py-1.5 text-sm"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddClick()
                            }
                          }}
                        />
                        <p className="text-xs text-[#64748b]">
                          Type custom email address(es), comma separated for multiple
                        </p>
                      </div>
                    )}

                    {localInputError && <p className="text-xs text-red-600">{localInputError}</p>}

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAddFormOpen(false)
                          setEmailSelectionMode("existing")
                          setEmailInput("")
                          setSelectedEmailFromDropdown("")
                          setLocalInputError("")
                        }}
                        className="h-8 px-3"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 px-3 bg-[#1e3a8a] hover:bg-[#1e40af] text-white"
                        onClick={handleAddClick}
                        disabled={
                          emailSelectionMode === "existing"
                            ? !selectedEmailFromDropdown.trim()
                            : !emailInput.trim()
                        }
                      >
                        Add Email
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className={showErrors && errorMessage ? "rounded-md border border-red-500 p-2" : ""}>
                <ActionDataTable<EmailRow>
                rows={tableRows}
                columns={viewMode ? columns.filter((c) => c.key !== "action") : columns}
                searchFields={searchFields}
                defaultSearchField="email"
                isViewMode={viewMode}
                onAdd={!viewMode ? () => setAddFormOpen(true) : undefined}
                addButtonLabel="Add Email"
                emptyTitle={`No ${description.toLowerCase()} configured`}
                emptyDescription='Click "Add Email" to add one.'
                getRowKey={(row) => `${keyPrefix}-${row.email}`}
              />
              </div>

              {showErrors && errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MultiSelectChannels({
  value,
  onChange,
  options,
  disabled = false,
}: {
  value: string[]
  onChange: (v: string[]) => void
  options: { label: string; value: string; icon: ReactNode }[]
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {options.map((option) => {
        const isSelected = value?.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              if (disabled) return
              const newValue = isSelected
                ? value.filter((v: string) => v !== option.value)
                : [...(value || []), option.value]
              onChange(newValue)
            }}
            disabled={disabled}
            className={`
              relative flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200
              ${isSelected 
                ? 'border-[#1e3a8a] bg-blue-50 shadow-sm' 
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }
              ${disabled ? 'cursor-default' : 'cursor-pointer'}
            `}
          >
            <div className={`
              flex h-5 w-5 items-center justify-center rounded border-2 transition-all
              ${isSelected 
                ? 'border-[#1e3a8a] bg-[#1e3a8a]' 
                : 'border-gray-300 bg-white'
              }
            `}>
              {isSelected && (
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <div className={`
                p-1.5 rounded-lg transition-all
                ${isSelected ? 'text-[#1e3a8a]' : 'text-gray-500'}
              `}>
                {option.icon}
              </div>
              <span className={`
                text-sm font-medium transition-all
                ${isSelected ? 'text-[#1e3a8a]' : 'text-gray-700'}
              `}>
                {option.label}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

type Props = {
  form: UseFormReturn<SchedulerFormValues>
  viewMode: boolean
  mode: "add" | "edit" | "view"
  showErrors?: boolean
}

export default function SchedulerNotificationTab({ form, viewMode, mode: _mode, showErrors = false }: Props) {
  const tenantCode = useGetTenantCode()
  const {
    control,
    formState: { errors },
  } = form

  const { data } = useQuery(FETCH_COMPANY_EMPLOYEE_QUERY, {
    client,
    variables: {
      criteriaRequests: [{ field: "tenantCode", operator: "eq", value: tenantCode || "" }],
      collection: "company_employee",
    },
    skip: !tenantCode,
    errorPolicy: "all",
  })

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

  const notificationChannels = [
    { label: "Email", value: "email", icon: <Mail className="h-4 w-4" /> },
    { label: "SMS", value: "sms", icon: <MessageSquare className="h-4 w-4" /> },
    { label: "Slack", value: "slack", icon: <Slack className="h-4 w-4" /> },
    { label: "Teams", value: "teams", icon: <Tv className="h-4 w-4" /> },
  ]

  const hasErrors = errors.notification_settings && Object.keys(errors.notification_settings).length > 0
  
  // Shows only name in dropdown, email is the value
  const employeeEmailOptions = useMemo(() => {
    const employees = (data?.fetchCompanyEmployee as Array<{
      isDeleted?: boolean;
      emailID?: string | { primaryEmailID?: string } | null;
      firstName?: string;
      middleName?: string;
      lastName?: string;
      employeeID?: string;
    }>) || []
    
    const emailMap = new Map<string, string>()
    
    employees
      .filter((rec) => rec?.isDeleted !== true)
      .filter((rec) => {
        // Handle emailID which could be string or object
        let email = ""
        if (rec?.emailID) {
          if (typeof rec.emailID === "object" && "primaryEmailID" in rec.emailID) {
            email = rec.emailID.primaryEmailID || ""
          } else if (typeof rec.emailID === "string") {
            email = rec.emailID
          }
        }
        return email && isValidEmail(email.trim().toLowerCase())
      })
      .forEach((rec) => {
        // Extract email
        let email = ""
        if (rec?.emailID) {
          if (typeof rec.emailID === "object" && "primaryEmailID" in rec.emailID) {
            email = rec.emailID.primaryEmailID || ""
          } else if (typeof rec.emailID === "string") {
            email = rec.emailID
          }
        }
        
        const normalizedEmail = email.trim().toLowerCase()
        
        // Only add if email not already in map
        if (!emailMap.has(normalizedEmail)) {
          // Construct full name (without email)
          const nameParts = [rec.firstName, rec.middleName, rec.lastName].filter(Boolean)
          const fullName = nameParts.length > 0 ? nameParts.join(" ") : ""
          
          // Create label showing only the name
          const label = fullName || normalizedEmail // Fallback to email if no name exists
          
          emailMap.set(normalizedEmail, label)
        }
      })
    
    // Convert map to array of options
    return Array.from(emailMap.entries()).map(([value, label]) => ({
      value,
      label,
    }))
  }, [data])

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      <SubformHeadline subformHeadline="Notification Configuration" />

      <CardContent className="px-6 py-4 space-y-6">
        {showErrors && hasErrors && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Please fix highlighted fields before saving.
          </div>
        )}

        {/* Success Notifications */}
        <Controller
          control={control}
          name="notification_settings.on_success"
          render={({ field }) => (
            <EmailTableSection
              title="Success Notifications"
              description="Success Emails"
              icon={<CheckCircle className="h-4 w-4 text-green-600" />}
              rows={field.value || []}
              onChange={field.onChange}
              viewMode={viewMode}
              showErrors={showErrors}
              errorMessage={getErrorMessage(errors.notification_settings?.on_success)}
              keyPrefix="success"
              emailOptions={employeeEmailOptions}
            />
          )}
        />

        <Separator />

        {/* Failure Notifications */}
        <Controller
          control={control}
          name="notification_settings.on_failure"
          render={({ field }) => (
            <EmailTableSection
              title="Failure Notifications"
              description="Failure Emails"
              icon={<AlertCircle className="h-4 w-4 text-red-600" />}
              rows={field.value || []}
              onChange={field.onChange}
              viewMode={viewMode}
              showErrors={showErrors}
              errorMessage={getErrorMessage(errors.notification_settings?.on_failure)}
              keyPrefix="failure"
              emailOptions={employeeEmailOptions}
            />
          )}
        />

        <Separator />

        {/* Notification Channels - Improved Design */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#1e3a8a]" />
            <SubFormTitle title="Notification Channels" />
          </div>
          
          <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50/50 to-white p-5">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold text-gray-900">Delivery Channels</Label>
                <p className="text-xs text-gray-500 mt-1">Select one or more channels to receive notifications</p>
              </div>
              
              <Controller
                control={control}
                name="notification_settings.channels"
                render={({ field }) => (
                  <MultiSelectChannels
                    value={field.value || []}
                    onChange={field.onChange}
                    options={notificationChannels}
                    disabled={viewMode}
                  />
                )}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}