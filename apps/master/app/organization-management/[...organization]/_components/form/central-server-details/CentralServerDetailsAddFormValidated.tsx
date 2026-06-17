"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Network, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import SingleSelectField from "@/components/fields/single-select-field"
import { createCentralServerDetailsSchema } from "./central-server-details-form-schema"

interface CentralServerDetailsFormData {
  subsidiaryCode?: string
  ipAddress?: string
  port?: string
  userID?: string
  password?: string
}

interface CentralServerDetailsFormModalProps {
  open: boolean
  setOpen: any
  onSuccess?: () => void
  onServerUpdate?: () => Promise<any>
  organizationId?: string
  editData?: any
  isEditMode?: boolean
  deleteValue?: any
}

type CentralServerDetailsFormField =
  | "subsidiaryCode"
  | "ipAddress"
  | "port"
  | "userID"
  | "password"

const INPUT_CLASS = "h-10 border-gray-300 focus-visible:ring-1 focus-visible:ring-blue-500"

export default function CentralServerDetailsAddFormValidated({
  open,
  setOpen,
  onSuccess,
  onServerUpdate,
  organizationId,
  editData,
  isEditMode,
  deleteValue,
}: CentralServerDetailsFormModalProps) {
  const tenantCode = useGetTenantCode()
  const [selectedSubsidiaryCode, setSelectedSubsidiaryCode] = useState<string>("")

  const organizationCriteriaRequests = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const { arrayData: subsidiariesArray } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subsidiaries",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const subsidiaryOptions = useMemo(
    () =>
      (subsidiariesArray || []).map((subsidiary: any) => ({
        label: `${subsidiary.subsidiaryName}`,
        value: subsidiary.subsidiaryCode,
      })),
    [subsidiariesArray]
  )

  const schema = useMemo(
    () => createCentralServerDetailsSchema({}, isEditMode || false, editData),
    [isEditMode, editData]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    setError,
    clearErrors,
  } = useForm<CentralServerDetailsFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subsidiaryCode: "",
      ipAddress: "",
      port: "",
      userID: "",
      password: "",
    },
  })

  const { post: postCentralServerDetails, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, CentralServerDetailsFormField> = {
          subsidiaryCode: "subsidiaryCode",
          ipAddress: "ipAddress",
          port: "port",
          userID: "userID",
          password: "password",
        }

        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalizedField = fieldMap[fieldName] ?? fieldMap[fieldName.split(".").pop() || ""]
          if (!normalizedField) return
          setError(normalizedField, { type: "server", message })
        })
        return
      }

      toast.success("Central server details submitted successfully!")
      if (onSuccess) onSuccess()
      if (onServerUpdate) await onServerUpdate()
      reset()
      setSelectedSubsidiaryCode("")
      setOpen(false)
    },
    onError: (error) => {
      toast.error("Central server details submission failed!")
      console.error("POST error:", error)
    },
  })

  useEffect(() => {
    if (!deleteValue?.subsidiaryCode) return
    handleDeleteItem(deleteValue.subsidiaryCode)
  }, [deleteValue])

  const handleDeleteItem = async (subsidiaryCode: string) => {
    try {
      const postData = {
        tenant: tenantCode,
        action: "delete",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          centralServerDetails: [{ subsidiaryCode }],
        },
      }
      // postCentralServerDetails(postData)
    } catch (error) {
      console.error("Error deleting central server details:", error)
    }
  }

  useEffect(() => {
    if (isEditMode && editData) {
      setValue("subsidiaryCode", editData.subsidiaryCode || "")
      setValue("ipAddress", editData.ipAddress || "")
      setValue("port", editData.port || "")
      setValue("userID", editData.userID || "")
      setValue("password", editData.password || "")
      setSelectedSubsidiaryCode(editData.subsidiaryCode || "")
    } else if (open && !isEditMode) {
      reset()
      setSelectedSubsidiaryCode("")
    }
  }, [isEditMode, editData, setValue, reset, open])

  const handleFormSubmit = async (data: CentralServerDetailsFormData) => {
    try {
      clearErrors()
      const payloadCentralServerDetails = {
        ...(isEditMode && editData ? editData : {}),
        ...data,
      }

      const postData = {
        tenant: tenantCode,
        action: "update",
        collectionName: "organization",
        event: "validate",
        id: organizationId,
        ruleId: "",
        data: {
          centralServerDetails: [payloadCentralServerDetails],
        },
      }
      postCentralServerDetails(postData)
    } catch (error) {
      console.error("Error processing central server details:", error)
    }
  }

  const handleSubsidiarySelect = (subsidiaryCode: string) => {
    setSelectedSubsidiaryCode(subsidiaryCode)
    setValue("subsidiaryCode", subsidiaryCode)
  }

  const handleCancel = () => {
    reset()
    setSelectedSubsidiaryCode("")
    setOpen(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
        <form onSubmit={handleSubmit(handleFormSubmit as SubmitHandler<CentralServerDetailsFormData>)} className="flex h-full w-full flex-col overflow-hidden">
          <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 px-5 py-3">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-gray-100 p-1.5">
                <Network className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {isEditMode ? "Edit Central Server Detail" : "Add New Central Server Detail"}
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {isEditMode
                    ? "Update central server connection information."
                    : "Create a new central server connection entry."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  {subsidiaryOptions.length === 0 ? (
                    <div className="w-full px-3 py-2 rounded-md border border-red-300 bg-red-50 text-sm text-red-600">
                      No subsidiaries available
                    </div>
                  ) : (
                    <SingleSelectField
                      label="Subsidiary Code"
                      required
                      placeholder="Select a subsidiary"
                      value={selectedSubsidiaryCode}
                      onChange={handleSubsidiarySelect}
                      options={subsidiaryOptions}
                      errorMessage={typeof errors.subsidiaryCode?.message === "string" ? errors.subsidiaryCode.message : undefined}
                      disabled={isEditMode}
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ipAddress" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    IP Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ipAddress"
                    {...register("ipAddress")}
                    placeholder="Enter IP address"
                    className={errors.ipAddress?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
                  />
                  {errors.ipAddress?.message && <p className="text-xs text-red-500">{errors.ipAddress.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="port" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Port <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="port"
                    {...register("port")}
                    placeholder="Enter port"
                    className={errors.port?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
                  />
                  {errors.port?.message && <p className="text-xs text-red-500">{errors.port.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="userID" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    User ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="userID"
                    {...register("userID")}
                    placeholder="Enter user ID"
                    className={errors.userID?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
                  />
                  {errors.userID?.message && <p className="text-xs text-red-500">{errors.userID.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="password" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    placeholder="Enter password"
                    className={errors.password?.message ? `${INPUT_CLASS} border-red-500` : INPUT_CLASS}
                  />
                  {errors.password?.message && <p className="text-xs text-red-500">{errors.password.message}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 justify-end gap-2 rounded-b-lg border-t border-gray-200 bg-gray-50 px-5 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              onClick={handleCancel}
              disabled={isSubmitting || postLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 text-white hover:bg-blue-700"
              disabled={isSubmitting || postLoading}
            >
              {postLoading ? "Saving..." : isEditMode ? "Update" : "Save"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
