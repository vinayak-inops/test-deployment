"use client"

import { useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { X, Bell } from "lucide-react"
import SingleSelectField from "@/components/fields/single-select-field"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { toast } from "react-toastify"
import {
  notificationSettingsSchema,
  type NotificationSettingsFormData,
  NOTIFICATION_SETTINGS_DEFAULT,
} from "./notification-settings-schema"

export type NotificationSettingItem = {
  parseID?: string
  propertyName: string
  mailGroup: string
  notifyPriorDays: number
  notifyEnabled: boolean
  autoBlockEnabled: boolean
  isActive: boolean
}

type FormData = NotificationSettingsFormData

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"

const DEFAULT_VALUES: FormData = NOTIFICATION_SETTINGS_DEFAULT

type Props = {
  open: boolean
  isViewMode?: boolean
  initialItem: NotificationSettingItem | null
  onClose: () => void
  onSubmit: (item: NotificationSettingItem) => void
  tenantCode?: string
  rowId?: string | null
}

export default function NotificationSettingsFormPopup({
  open,
  isViewMode,
  initialItem,
  onClose,
  onSubmit,
  tenantCode: propTenantCode,
  rowId,
}: Props) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode
  const pendingItemRef = useRef<NotificationSettingItem | null>(null)

  const mailGroupCriteria = useMemo(
    () => (tenantCode ? [{ field: "tenantCode", operator: "is", value: tenantCode }] : []),
    [tenantCode]
  )

  const { arrayData: mailGroupOptions, loading: mailGroupLoading } =
    useAggregateArrayFetch<{ mailGroupCode?: string; mailGroupName?: string }>({
      collection: "organization",
      criteriaRequests: mailGroupCriteria,
      arrayField: "mailGroup",
      enabled: Boolean(tenantCode) && open,
      defaultValue: [],
    })

  const { post: postNotification, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        const fieldMap: Record<string, keyof FormData> = {
          propertyName: "propertyName",
          mailGroup: "mailGroup",
          notifyPriorDays: "notifyPriorDays",
        }
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          const normalized = fieldMap[fieldName] ?? fieldMap[fieldName.split(".").pop() || ""]
          if (!normalized) return
          setError(normalized, { type: "server", message })
        })
        return
      }
      if (pendingItemRef.current) {
        onSubmit(pendingItemRef.current)
        pendingItemRef.current = null
      }
    },
    onError: () => {
      toast.error("Notification setting submission failed!")
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    setError,
  } = useForm<FormData>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (!open) return
    reset(
      initialItem
        ? {
            parseID: initialItem.parseID,
            propertyName: initialItem.propertyName,
            mailGroup: initialItem.mailGroup,
            notifyPriorDays: initialItem.notifyPriorDays,
            notifyEnabled: initialItem.notifyEnabled,
            autoBlockEnabled: initialItem.autoBlockEnabled,
            isActive: initialItem.isActive,
          }
        : { ...DEFAULT_VALUES, parseID: crypto.randomUUID() }
    )
  }, [open, initialItem, reset])

  if (!open) return null

  const handleFormSubmit = (data: FormData) => {
    const item: NotificationSettingItem = {
      parseID: data.parseID || initialItem?.parseID || crypto.randomUUID(),
      propertyName: data.propertyName,
      mailGroup: data.mailGroup,
      notifyPriorDays: data.notifyPriorDays,
      notifyEnabled: data.notifyEnabled,
      autoBlockEnabled: data.autoBlockEnabled,
      isActive: data.isActive,
    }
    pendingItemRef.current = item

    const { parseID: _parseID, ...payloadWithoutParseID } = item
    const serverPayload = initialItem ? item : payloadWithoutParseID

    postNotification({
      tenant: tenantCode,
      action: "update",
      collectionName: "employee_category_setting",
      event: "validate",
      id: rowId,
      ruleId: "employeeCategorySettingNotificationSettingsValidator",
      data: {
        notificationSettings: [serverPayload],
      },
    })
  }

  const notifyEnabled = watch("notifyEnabled")
  const autoBlockEnabled = watch("autoBlockEnabled")
  const isActive = watch("isActive")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="w-full h-full flex flex-col overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <Bell className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {initialItem ? "Edit Notification" : "Add Notification"}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Fill notification setting details.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
            <SubFormTitle title="Notification Details" />
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Property Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("propertyName")}
                  className={`${INPUT_CLASS} ${errors.propertyName ? "border-red-500" : ""}`}
                  placeholder="e.g. LABOUR CARD"
                  disabled={isViewMode}
                />
                {errors.propertyName?.message && (
                  <p className="text-red-500 text-xs">{errors.propertyName.message}</p>
                )}
              </div>

              <SingleSelectField
                label="Mail Group"
                required
                placeholder={mailGroupLoading ? "Loading..." : "Select mail group"}
                value={watch("mailGroup")}
                onChange={(val) => setValue("mailGroup", val, { shouldValidate: true })}
                options={mailGroupOptions.map((mg) => ({
                  value: mg.mailGroupCode || mg.mailGroupName || "",
                  label: mg.mailGroupName || mg.mailGroupCode || "",
                }))}
                isLoading={mailGroupLoading}
                disabled={isViewMode}
                errorMessage={errors.mailGroup?.message}
                allowOnlyProvidedOptions={false}
              />

              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Notify Prior Days <span className="text-red-500">*</span>
                </Label>
                <Input
                  {...register("notifyPriorDays", { valueAsNumber: true })}
                  className={`${INPUT_CLASS} ${errors.notifyPriorDays ? "border-red-500" : ""}`}
                  type="number"
                  min={0}
                  placeholder="0"
                  disabled={isViewMode}
                />
                {errors.notifyPriorDays?.message && (
                  <p className="text-red-500 text-xs">{errors.notifyPriorDays.message}</p>
                )}
              </div>

              <div className="space-y-3 pt-1">
                <SubFormTitle title="Flags" />
                {[
                  { key: "notifyEnabled" as const, label: "Notify Enabled", value: notifyEnabled },
                  { key: "autoBlockEnabled" as const, label: "Auto Block Enabled", value: autoBlockEnabled },
                  { key: "isActive" as const, label: "Is Active", value: isActive },
                ].map(({ key, label, value }) => (
                  <label
                    key={key}
                    className={`flex items-center gap-2 text-sm text-gray-700 ${isViewMode ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => !isViewMode && setValue(key, e.target.checked)}
                      disabled={isViewMode}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
              onClick={onClose}
              disabled={postLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={Boolean(isViewMode) || postLoading}
            >
              {postLoading ? "Saving..." : initialItem ? "Save" : "Add Row"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
