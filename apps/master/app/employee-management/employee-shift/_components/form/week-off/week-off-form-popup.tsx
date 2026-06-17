"use client"

import { useEffect, useRef, useState } from "react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Checkbox } from "@repo/ui/components/ui/checkbox"
import { Calendar, X } from "lucide-react"
import { SubFormTitle } from "@/components/header/sub-form-title"
import { weekOffSchema, EMPTY_WEEK_OFF, type WeekOffItem } from "../../schemas/week-off-form-schema"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { toast } from "react-toastify"

// 1 = Monday, 2 = Tuesday, ... 7 = Sunday
const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const

const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"

interface WeekOffFormPopupProps {
  open: boolean
  onClose: () => void
  /** null = Add mode, otherwise Edit mode with this week off */
  initialWeekOff: WeekOffItem | null
  onSubmit: (weekOff: WeekOffItem) => void
  tenantCode?: string
  rowId?: string | null
  collectionName?: string
}

export function WeekOffFormPopup({
  open,
  onClose,
  initialWeekOff,
  onSubmit,
  tenantCode: propTenantCode,
  rowId,
  collectionName = "employee_shift",
}: WeekOffFormPopupProps) {
  const hookTenantCode = useGetTenantCode()
  const tenantCode = propTenantCode || hookTenantCode
  const pendingItemRef = useRef<WeekOffItem | null>(null)

  const [formWeekOff, setFormWeekOff] = useState<WeekOffItem>({ ...EMPTY_WEEK_OFF })
  const [popupShowErrors, setPopupShowErrors] = useState(false)
  const [weekError, setWeekError] = useState("")

  const { post: postValidate, loading: postLoading } = usePostRequest<any>({
    url: "validate",
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response
        Object.entries(responseData || {}).forEach(([fieldName, message]) => {
          if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return
          if (typeof message !== "string" || !message.trim()) return
          if (fieldName === "week" || fieldName.toLowerCase().includes("week")) {
            setWeekError(message)
          }
        })
        return
      }
      if (pendingItemRef.current) {
        onSubmit(pendingItemRef.current)
        pendingItemRef.current = null
      }
    },
    onError: () => {
      toast.error("Week off submission failed!")
    },
  })

  useEffect(() => {
    if (open) {
      setFormWeekOff(initialWeekOff ? { ...initialWeekOff } : { ...EMPTY_WEEK_OFF })
      setPopupShowErrors(false)
      setWeekError("")
    }
  }, [open, initialWeekOff])

  const toggleDay = (dayNum: number) => {
    if (postLoading) return
    setFormWeekOff((prev) => {
      const next = prev.weekOff.includes(dayNum)
        ? prev.weekOff.filter((d) => d !== dayNum)
        : [...prev.weekOff, dayNum].sort((a, b) => a - b)
      return { ...prev, weekOff: next }
    })
  }

  const handleSubmit = () => {
    const result = weekOffSchema.safeParse(formWeekOff)
    if (!result.success) {
      setPopupShowErrors(true)
      return
    }
    setWeekError("")

    const item: WeekOffItem = {
      ...result.data,
      parseID: initialWeekOff?.parseID || crypto.randomUUID(),
    }
    pendingItemRef.current = item

    const { parseID: _parseID, ...payloadWithoutParseID } = item
    const serverPayload = initialWeekOff ? item : payloadWithoutParseID

    
    postValidate({
      tenant: tenantCode,
      action: "update",
      collectionName,
      event: "validate",
      id: rowId,
      ruleId: "",
      data: {
        weekOffs: [serverPayload],
      },
    })
  }

  const handleClose = () => {
    setPopupShowErrors(false)
    setWeekError("")
    onClose()
  }

  const formValidation = weekOffSchema.safeParse(formWeekOff)
  const formErrors = formValidation.success ? {} : formValidation.error.flatten().fieldErrors

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {initialWeekOff !== null ? "Edit Week Off" : "Add Week Off"}
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Set week number and select off days.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
              Week <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              min={1}
              value={formWeekOff.week}
              onChange={(e) => {
                setFormWeekOff((prev) => ({ ...prev, week: Number(e.target.value) || 0 }))
                setWeekError("")
              }}
              className={`${INPUT_CLASS} ${(popupShowErrors && formErrors.week) || weekError ? "border-red-500" : ""}`}
              placeholder="1"
              disabled={postLoading}
            />
            {popupShowErrors && formErrors.week && !weekError && (
              <p className="text-red-500 text-xs" role="alert">
                {(formErrors.week as string[])[0]}
              </p>
            )}
            {weekError && <p className="text-red-500 text-xs">{weekError}</p>}
          </div>

          <div className="space-y-3">
            <SubFormTitle title="Off Days" />
            <p className="text-gray-500 text-xs">Select the days that are off for this week.</p>
            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((name, i) => {
                const dayNum = i + 1
                const checked = formWeekOff.weekOff.includes(dayNum)
                return (
                  <label
                    key={dayNum}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white transition-colors has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50/50 ${
                      postLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleDay(dayNum)}
                      disabled={postLoading}
                    />
                    <span className="text-sm font-medium text-gray-900">{name}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg flex justify-end gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
            onClick={handleClose}
            disabled={postLoading}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleSubmit}
            disabled={postLoading}
          >
            {postLoading ? "Saving..." : initialWeekOff !== null ? "Save" : "Add Row"}
          </Button>
        </div>
      </div>
    </div>
  )
}
