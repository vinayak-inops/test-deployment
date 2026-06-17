"use client"

import { useEffect, useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Server } from "lucide-react"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { toast } from "react-toastify"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { FormActionsFooter } from "@/components/footer/form-actions-footer"
import { GradientFormHeader } from "@/components/header/form-header"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { createGlobalServerDetailsSchema } from "./global-server-details-form-schema"

interface GlobalServerDetailsData {
  serverName: string
  ipAddress: string
  port: string
  userID: string
  password: string
}

interface GlobalServerDetailsFormProps {
  organizationId?: string
  isViewMode?: boolean
}

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

const EMPTY_VALUES: GlobalServerDetailsData = {
  serverName: "",
  ipAddress: "",
  port: "",
  userID: "",
  password: "",
}

export default function GlobalServerDetailsForm({
  organizationId,
  isViewMode = false,
}: GlobalServerDetailsFormProps) {
  const tenantCode = useGetTenantCode()
  const [showErrors, setShowErrors] = useState(false)
  const schema = useMemo(() => createGlobalServerDetailsSchema(), [])

  const {
    register,
    formState: { errors, isValid },
    reset,
    setError,
    clearErrors,
    trigger,
    getValues,
  } = useForm<GlobalServerDetailsData>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY_VALUES,
    mode: "onChange",
  })

  const { loading: isLoading, refetch: fetchOrganization } = useRequest<any>({
    url: "organization/search",
    method: "POST",
    data: [
      {
        field: "tenantCode",
        operator: "eq",
        value: tenantCode,
      },
    ],
    onSuccess: (data) => {
      if (!Array.isArray(data) || !data[0]) {
        reset(EMPTY_VALUES)
        return
      }

      const details = data[0]?.globalServerDetails || {}
      reset({
        serverName: details.serverName || "",
        ipAddress: details.ipAddress || "",
        port: details.port || "",
        userID: details.userID || "",
        password: details.password || "",
      })
    },
    onError: (error) => {
      console.error("Error fetching global server details:", error)
    },
    dependencies: [tenantCode],
  })

  useEffect(() => {
    if (!tenantCode) return
    void fetchOrganization()
  }, [tenantCode])

  const { post: postGlobalServerDetails, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: async (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        setShowErrors(true)
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, keyof GlobalServerDetailsData> = {
          serverName: "serverName",
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

      toast.success("Global server details saved successfully!")
      await fetchOrganization()
    },
    onError: (error) => {
      console.error("Error saving global server details:", error)
      toast.error("Global server details submission failed!")
    },
  })

  const handleSave = async () => {
    if (isViewMode || !organizationId) return
    setShowErrors(true)
    clearErrors()

    const valid = await trigger()
    if (!valid) return

    postGlobalServerDetails({
      tenant: tenantCode,
      action: "update",
      collectionName: "organization",
      event: "validate",
      id: organizationId,
      ruleId: "",
      data: {
        globalServerDetails: getValues(),
      },
    })
  }

  return (
    <Card className="w-full overflow-hidden border border-gray-200 shadow-sm">
      <GradientFormHeader
        icon={Server}
        title="Global Server Details"
        description="Configure the primary global sync server connection."
      />

      <CardContent className="space-y-6 px-6 py-4">
        {showErrors && Object.keys(errors).length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Please fix highlighted fields before saving.
          </div>
        )}

        <div className="space-y-3">
          <SubFormTitle title="Connection Details" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="serverName" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                Server Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="serverName"
                {...register("serverName")}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "cursor-not-allowed bg-gray-100" : ""}`}
                placeholder="e.g., GLOBAL_SYNC"
              />
              {showErrors && errors.serverName?.message && <p className="text-xs text-red-600">{errors.serverName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ipAddress" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                IP Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="ipAddress"
                {...register("ipAddress")}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "cursor-not-allowed bg-gray-100" : ""}`}
                placeholder="e.g., 192.168.5.15"
              />
              {showErrors && errors.ipAddress?.message && <p className="text-xs text-red-600">{errors.ipAddress.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="port" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                Port <span className="text-red-500">*</span>
              </Label>
              <Input
                id="port"
                {...register("port")}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "cursor-not-allowed bg-gray-100" : ""}`}
                placeholder="e.g., 999"
              />
              {showErrors && errors.port?.message && <p className="text-xs text-red-600">{errors.port.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="userID" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                User ID <span className="text-red-500">*</span>
              </Label>
              <Input
                id="userID"
                {...register("userID")}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "cursor-not-allowed bg-gray-100" : ""}`}
                placeholder="e.g., admin"
              />
              {showErrors && errors.userID?.message && <p className="text-xs text-red-600">{errors.userID.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="password" className="block text-xs font-medium uppercase tracking-wide text-gray-700">
                Password <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                disabled={isViewMode}
                className={`${INPUT_CLASS} ${isViewMode ? "cursor-not-allowed bg-gray-100" : ""}`}
                placeholder="Enter password"
              />
              {showErrors && errors.password?.message && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
          </div>
        </div>

        {isLoading && <div className="text-sm text-gray-500">Loading global server details...</div>}
      </CardContent>

      <FormActionsFooter
        isViewMode={isViewMode}
        isValid={isValid}
        showErrors={showErrors}
        errorCount={Object.keys(errors).length}
        postLoading={postLoading}
        onSave={handleSave}
      />
    </Card>
  )
}
