"use client"

import { useEffect, useMemo, useState } from "react"
import { X, AlertCircle, Info } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import ActionButtons from "@/components/common/action-buttons"
import type { TrainingItem } from "../types"
import { trainingSchema, EMPTY_TRAINING } from "../schemas/training-schema"

type FormMode = "add" | "edit"

interface TrainingFormPopupProps {
  isOpen: boolean
  mode: FormMode
  initialValues?: TrainingItem
  onClose: () => void
  onSubmit: (item: TrainingItem) => Promise<void> | void
}

export default function TrainingFormPopup({ isOpen, mode, initialValues, onClose, onSubmit }: TrainingFormPopupProps) {
  const isEdit = mode === "edit"

  const [formData, setFormData] = useState<TrainingItem>(EMPTY_TRAINING)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  const title = useMemo(() => (isEdit ? "Edit Training" : "Add Training"), [isEdit])
  const subtitle = useMemo(
    () => (isEdit ? "Update training details (code cannot be changed)" : "Create a new training entry for this category"),
    [isEdit]
  )

  useEffect(() => {
    if (!isOpen) return
    setErrors({})
    setLoading(false)
    setFormData({
      ...EMPTY_TRAINING,
      ...(initialValues || {}),
      notifyPriorDays:
        typeof initialValues?.notifyPriorDays === "number" ? initialValues.notifyPriorDays : EMPTY_TRAINING.notifyPriorDays,
      blockingEnabled:
        typeof initialValues?.blockingEnabled === "boolean" ? initialValues.blockingEnabled : EMPTY_TRAINING.blockingEnabled,
      notificationEnabled:
        typeof initialValues?.notificationEnabled === "boolean"
          ? initialValues.notificationEnabled
          : EMPTY_TRAINING.notificationEnabled,
    })
  }, [isOpen, initialValues])

  const fieldStyles =
    "h-9 border border-gray-300 px-3 py-1.5 text-sm rounded-md focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition w-full"

  const validate = () => {
    const result = trainingSchema.safeParse({
      ...formData,
      notifyPriorDays: Number(formData.notifyPriorDays ?? 0),
      blockingEnabled: !!formData.blockingEnabled,
      notificationEnabled: !!formData.notificationEnabled,
    })
    if (result.success) {
      setErrors({})
      return true
    }
    const next: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const key = issue.path[0] as string
      if (key && !next[key]) next[key] = issue.message
    }
    setErrors(next)
    return false
  }

  const submit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await onSubmit({
        ...formData,
        trainingCode: (formData.trainingCode || "").trim(),
        trainingName: (formData.trainingName || "").trim(),
        trainingDescrition: (formData.trainingDescrition || "").trim(),
        notifyPriorDays: Number(formData.notifyPriorDays || 0),
        blockingEnabled: !!formData.blockingEnabled,
        notificationEnabled: !!formData.notificationEnabled,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose()
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-4xl flex flex-col">
        <Card className="w-full max-h-[90vh] flex flex-col overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">{title}</CardTitle>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
            <Alert className="border-0 p-0 text-xs text-gray-600 [&>svg]:text-gray-500 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:left-0 [&>svg]:top-0.5 [&>svg~*]:pl-5">
              <Info />
              <AlertDescription className="m-0">
                {subtitle}. <span className="font-semibold">Training Code</span> is not editable in edit mode.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Training Code <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input
                  value={formData.trainingCode || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, trainingCode: e.target.value }))}
                  className={`${fieldStyles} ${isEdit ? "bg-gray-100 text-gray-700 cursor-not-allowed" : ""}`}
                  disabled={isEdit}
                />
                {errors.trainingCode && <p className="text-red-500 text-xs">{errors.trainingCode}</p>}
              </div>

              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Training Name <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input
                  value={formData.trainingName || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, trainingName: e.target.value }))}
                  className={fieldStyles}
                />
                {errors.trainingName && <p className="text-red-500 text-xs">{errors.trainingName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Start Date <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.startDate || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, startDate: e.target.value }))}
                  className={fieldStyles}
                />
                {errors.startDate && <p className="text-red-500 text-xs">{errors.startDate}</p>}
              </div>

              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  End Date <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.endDate || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, endDate: e.target.value }))}
                  min={formData.startDate || undefined}
                  className={fieldStyles}
                />
                {errors.endDate && <p className="text-red-500 text-xs">{errors.endDate}</p>}
              </div>

              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Valid Till <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.validTill || ""}
                  onChange={(e) => setFormData((p) => ({ ...p, validTill: e.target.value }))}
                  min={formData.endDate || formData.startDate || undefined}
                  className={fieldStyles}
                />
                {errors.validTill && <p className="text-red-500 text-xs">{errors.validTill}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  Notify Prior Days <span className="text-red-500 normal-case">*</span>
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={9999}
                  value={String(formData.notifyPriorDays ?? 0)}
                  onChange={(e) => setFormData((p) => ({ ...p, notifyPriorDays: Number(e.target.value || 0) }))}
                  className={fieldStyles}
                />
                {errors.notifyPriorDays && <p className="text-red-500 text-xs">{errors.notifyPriorDays}</p>}
              </div>

              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Blocking Enabled</Label>
                <label className="flex items-center gap-2 h-9 px-3 rounded-md border border-gray-300 bg-white">
                  <input
                    type="checkbox"
                    checked={!!formData.blockingEnabled}
                    onChange={(e) => setFormData((p) => ({ ...p, blockingEnabled: e.target.checked }))}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">Enable</span>
                </label>
              </div>

              <div className="space-y-2">
                <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Notification Enabled</Label>
                <label className="flex items-center gap-2 h-9 px-3 rounded-md border border-gray-300 bg-white">
                  <input
                    type="checkbox"
                    checked={!!formData.notificationEnabled}
                    onChange={(e) => setFormData((p) => ({ ...p, notificationEnabled: e.target.checked }))}
                    className="h-4 w-4 accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">Enable</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">Description</Label>
              <textarea
                value={formData.trainingDescrition || ""}
                onChange={(e) => setFormData((p) => ({ ...p, trainingDescrition: e.target.value }))}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 shadow-sm resize-none transition"
                rows={3}
              />
            </div>

            {Object.keys(errors).length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-1 text-red-800 font-medium text-xs">
                  <AlertCircle className="h-4 w-4" />
                  Please fix the errors above
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
            <ActionButtons
              layout="end"
              secondaryLabel="Cancel"
              onSecondary={onClose}
              primaryLabel={isEdit ? "SAVE" : "ADD"}
              onPrimary={submit}
              primaryLoading={loading}
              className="w-full"
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}


