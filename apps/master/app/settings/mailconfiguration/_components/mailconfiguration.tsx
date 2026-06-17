"use client"

import React, { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { X, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Switch } from "@repo/ui/components/ui/switch"

// Validation schema
const mailConfigurationSchema = z.object({
  outgoingHost: z.string().min(1, "Outgoing host is required"),
  outgoingPort: z.number().min(1, "Outgoing port is required").max(65535, "Port must be between 1 and 65535"),
  authentication: z.object({
    required: z.boolean().default(true),
    username: z.string().optional(),
    password: z.string().optional(),
  }).refine((data) => {
    if (data.required) {
      return data.username && data.username.length > 0 && data.password && data.password.length > 0;
    }
    return true;
  }, {
    message: "Username and password are required when authentication is enabled",
    path: ["username"],
  }),
  enableSsl: z.boolean().default(true),
  enableTsl: z.boolean().default(false),
  timeoutInSeconds: z.number().min(0, "Timeout must be 0 or greater").default(0),
  defaultFromEmail: z.string().email("Invalid email address").min(1, "Default from email is required"),
  isActive: z.boolean().default(true),
})

type MailConfigurationFormData = z.infer<typeof mailConfigurationSchema>

interface MailConfigurationFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MailConfigurationFormData) => void | Promise<void>
  initialData?: {
    outgoingHost?: string
    outgoingPort?: number
    authentication?: {
      required?: boolean
      username?: string
      password?: string
    }
    enableSsl?: boolean
    enableTsl?: boolean
    timeoutInSeconds?: number
    defaultFromEmail?: string
    isActive?: boolean
  }
  mode?: 'add' | 'edit' | 'view'
}

export function MailConfigurationForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode = 'add',
}: MailConfigurationFormProps) {
  const isViewMode = mode === 'view'
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<MailConfigurationFormData>({
    resolver: zodResolver(mailConfigurationSchema),
    defaultValues: {
      outgoingHost: initialData?.outgoingHost || "",
      outgoingPort: initialData?.outgoingPort || 587,
      authentication: {
        required: initialData?.authentication?.required ?? true,
        username: initialData?.authentication?.username || "",
        password: initialData?.authentication?.password || "",
      },
      enableSsl: initialData?.enableSsl ?? true,
      enableTsl: initialData?.enableTsl ?? false,
      timeoutInSeconds: initialData?.timeoutInSeconds ?? 0,
      defaultFromEmail: initialData?.defaultFromEmail || "",
      isActive: initialData?.isActive ?? true,
    },
  })

  const authRequired = watch("authentication.required")
  const enableSslValue = watch("enableSsl")
  const enableTslValue = watch("enableTsl")
  const isActiveValue = watch("isActive")

  // Reset form when initialData changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        outgoingHost: initialData?.outgoingHost || "",
        outgoingPort: initialData?.outgoingPort || 587,
        authentication: {
          required: initialData?.authentication?.required ?? true,
          username: initialData?.authentication?.username || "",
          password: initialData?.authentication?.password || "",
        },
        enableSsl: initialData?.enableSsl ?? true,
        enableTsl: initialData?.enableTsl ?? false,
        timeoutInSeconds: initialData?.timeoutInSeconds ?? 0,
        defaultFromEmail: initialData?.defaultFromEmail || "",
        isActive: initialData?.isActive ?? true,
      })
    }
  }, [isOpen, initialData, reset])

  const onFormSubmit = async (data: MailConfigurationFormData) => {
    try {
      await onSubmit(data)
      reset()
      onClose()
    } catch (error) {
      console.error("Error submitting form:", error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-semibold text-gray-800">
              Mail Configuration Details
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Outgoing Host */}
            <div className="space-y-2">
              <Label htmlFor="outgoingHost" className="text-sm font-medium text-gray-700">
                Outgoing Host <span className="text-red-500">*</span>
              </Label>
              <Input
                id="outgoingHost"
                {...register("outgoingHost")}
                placeholder="Enter outgoing host (e.g., smtp.gmail.com)"
                className="w-full"
                disabled={isViewMode}
              />
              {errors.outgoingHost && (
                <p className="text-sm text-red-500">{errors.outgoingHost.message}</p>
              )}
            </div>

            {/* Outgoing Port */}
            <div className="space-y-2">
              <Label htmlFor="outgoingPort" className="text-sm font-medium text-gray-700">
                Outgoing Port <span className="text-red-500">*</span>
              </Label>
              <Input
                id="outgoingPort"
                type="number"
                {...register("outgoingPort", { valueAsNumber: true })}
                placeholder="Enter outgoing port (e.g., 587)"
                className="w-full"
                disabled={isViewMode}
              />
              {errors.outgoingPort && (
                <p className="text-sm text-red-500">{errors.outgoingPort.message}</p>
              )}
            </div>

            {/* Authentication Section */}
            <div className="space-y-4 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <Label htmlFor="authRequired" className="text-sm font-medium text-gray-700">
                  Authentication Required
                </Label>
                <Switch
                  id="authRequired"
                  checked={authRequired}
                  onCheckedChange={(checked) => !isViewMode && setValue("authentication.required", checked)}
                  disabled={isViewMode}
                />
              </div>

              {authRequired && (
                <>
                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                      Username <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="username"
                      {...register("authentication.username")}
                      placeholder="Enter username/email"
                      className="w-full"
                      disabled={isViewMode}
                    />
                    {errors.authentication?.username && (
                      <p className="text-sm text-red-500">{errors.authentication.username.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      {...register("authentication.password")}
                      placeholder="Enter password"
                      className="w-full"
                      disabled={isViewMode}
                    />
                    {errors.authentication?.password && (
                      <p className="text-sm text-red-500">{errors.authentication.password.message}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* SSL/TSL Settings */}
            <div className="grid grid-cols-2 gap-4">
              {/* Enable SSL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableSsl" className="text-sm font-medium text-gray-700">
                    Enable SSL
                  </Label>
                  <Switch
                    id="enableSsl"
                    checked={enableSslValue}
                    onCheckedChange={(checked) => !isViewMode && setValue("enableSsl", checked)}
                    disabled={isViewMode}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enable Secure Socket Layer encryption
                </p>
              </div>

              {/* Enable TSL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="enableTsl" className="text-sm font-medium text-gray-700">
                    Enable TSL
                  </Label>
                  <Switch
                    id="enableTsl"
                    checked={enableTslValue}
                    onCheckedChange={(checked) => !isViewMode && setValue("enableTsl", checked)}
                    disabled={isViewMode}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Enable Transport Layer Security
                </p>
              </div>
            </div>

            {/* Timeout */}
            <div className="space-y-2">
              <Label htmlFor="timeoutInSeconds" className="text-sm font-medium text-gray-700">
                Timeout (in seconds)
              </Label>
              <Input
                id="timeoutInSeconds"
                type="number"
                {...register("timeoutInSeconds", { valueAsNumber: true })}
                placeholder="Enter timeout in seconds (0 for no timeout)"
                className="w-full"
                disabled={isViewMode}
              />
              {errors.timeoutInSeconds && (
                <p className="text-sm text-red-500">{errors.timeoutInSeconds.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Connection timeout in seconds (0 means no timeout)
              </p>
            </div>

            {/* Default From Email */}
            <div className="space-y-2">
              <Label htmlFor="defaultFromEmail" className="text-sm font-medium text-gray-700">
                Default From Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="defaultFromEmail"
                type="email"
                {...register("defaultFromEmail")}
                placeholder="Enter default from email address"
                className="w-full"
                disabled={isViewMode}
              />
              {errors.defaultFromEmail && (
                <p className="text-sm text-red-500">{errors.defaultFromEmail.message}</p>
              )}
            </div>

            {/* Is Active */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Is Active
                </Label>
                <Switch
                  id="isActive"
                  checked={isActiveValue}
                  onCheckedChange={(checked) => !isViewMode && setValue("isActive", checked)}
                  disabled={isViewMode}
                />
              </div>
              <p className="text-xs text-gray-500">
                Enable or disable this mail configuration
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex items-center gap-2 text-gray-700 hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
                {isViewMode ? 'Close' : 'Cancel'}
              </Button>
              {!isViewMode && (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Check className="h-4 w-4" />
                  Save
                </Button>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}