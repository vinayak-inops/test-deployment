"use client"

import { useState } from "react"
import { Clock, X, Save } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@repo/ui/components/ui/dialog"
import { toast } from "react-toastify"

interface ShiftFormData {
  shiftCode: string
  shiftName: string
  shiftStart: string
  shiftEnd: string
  firstHalfStart: string
  firstHalfEnd: string
  secondHalfStart: string
  secondHalfEnd: string
  lunchStart: string
  lunchEnd: string
  duration: number
  crossDay: boolean
  flexible: boolean
  graceIn: number
  graceOut: number
  description: string
}

interface NewShiftFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ShiftFormData) => void
}

export default function NewShiftForm({ isOpen, onClose, onSubmit }: NewShiftFormProps) {
  const [formData, setFormData] = useState<ShiftFormData>({
    shiftCode: "",
    shiftName: "",
    shiftStart: "",
    shiftEnd: "",
    firstHalfStart: "",
    firstHalfEnd: "",
    secondHalfStart: "",
    secondHalfEnd: "",
    lunchStart: "",
    lunchEnd: "",
    duration: 480,
    crossDay: false,
    flexible: false,
    graceIn: 5,
    graceOut: 5,
    description: ""
  })

  const [errors, setErrors] = useState<Partial<ShiftFormData>>({})

  const validateForm = () => {
    const newErrors: Partial<ShiftFormData> = {}
    
    if (!formData.shiftCode.trim()) {
      newErrors.shiftCode = "Shift code is required"
    }
    if (!formData.shiftName.trim()) {
      newErrors.shiftName = "Shift name is required"
    }
    if (!formData.shiftStart) {
      newErrors.shiftStart = "Shift start time is required"
    }
    if (!formData.shiftEnd) {
      newErrors.shiftEnd = "Shift end time is required"
    }
    if (!formData.firstHalfStart) {
      newErrors.firstHalfStart = "First half start time is required"
    }
    if (!formData.firstHalfEnd) {
      newErrors.firstHalfEnd = "First half end time is required"
    }
    if (!formData.secondHalfStart) {
      newErrors.secondHalfStart = "Second half start time is required"
    }
    if (!formData.secondHalfEnd) {
      newErrors.secondHalfEnd = "Second half end time is required"
    }
    if (!formData.lunchStart) {
      newErrors.lunchStart = "Lunch start time is required"
    }
    if (!formData.lunchEnd) {
      newErrors.lunchEnd = "Lunch end time is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(formData)
      toast.success("Shift created successfully!")
      onClose()
    } else {
      toast.error("Please fill in all required fields")
    }
  }

  const handleInputChange = (field: keyof ShiftFormData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const resetForm = () => {
    setFormData({
      shiftCode: "",
      shiftName: "",
      shiftStart: "",
      shiftEnd: "",
      firstHalfStart: "",
      firstHalfEnd: "",
      secondHalfStart: "",
      secondHalfEnd: "",
      lunchStart: "",
      lunchEnd: "",
      duration: 480,
      crossDay: false,
      flexible: false,
      graceIn: 5,
      graceOut: 5,
      description: ""
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Clock className="h-6 w-6 text-blue-600" />
            Create New Shift
          </DialogTitle>
          <DialogDescription>
            Fill in the details to create a new shift configuration
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="shiftCode" className="text-sm font-medium">
                Shift Code *
              </Label>
              <Input
                id="shiftCode"
                placeholder="SHIFT001"
                value={formData.shiftCode}
                onChange={(e) => handleInputChange("shiftCode", e.target.value.toUpperCase())}
                className={errors.shiftCode ? "border-red-300 focus:border-red-500" : ""}
              />
              {errors.shiftCode && (
                <p className="text-sm text-red-600">{errors.shiftCode}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="shiftName" className="text-sm font-medium">
                Shift Name *
              </Label>
              <Input
                id="shiftName"
                placeholder="Morning Shift"
                value={formData.shiftName}
                onChange={(e) => handleInputChange("shiftName", e.target.value)}
                className={errors.shiftName ? "border-red-300 focus:border-red-500" : ""}
              />
              {errors.shiftName && (
                <p className="text-sm text-red-600">{errors.shiftName}</p>
              )}
            </div>
          </div>

          {/* Shift Times */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Shift Times</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shiftStart" className="text-sm font-medium">
                  Shift Start Time *
                </Label>
                <Input
                  id="shiftStart"
                  type="time"
                  value={formData.shiftStart}
                  onChange={(e) => handleInputChange("shiftStart", e.target.value)}
                  className={errors.shiftStart ? "border-red-300 focus:border-red-500" : ""}
                />
                {errors.shiftStart && (
                  <p className="text-sm text-red-600">{errors.shiftStart}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shiftEnd" className="text-sm font-medium">
                  Shift End Time *
                </Label>
                <Input
                  id="shiftEnd"
                  type="time"
                  value={formData.shiftEnd}
                  onChange={(e) => handleInputChange("shiftEnd", e.target.value)}
                  className={errors.shiftEnd ? "border-red-300 focus:border-red-500" : ""}
                />
                {errors.shiftEnd && (
                  <p className="text-sm text-red-600">{errors.shiftEnd}</p>
                )}
              </div>
            </div>
          </div>

          {/* First Half */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">First Half</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstHalfStart" className="text-sm font-medium">
                  First Half Start *
                </Label>
                <Input
                  id="firstHalfStart"
                  type="time"
                  value={formData.firstHalfStart}
                  onChange={(e) => handleInputChange("firstHalfStart", e.target.value)}
                  className={errors.firstHalfStart ? "border-red-300 focus:border-red-500" : ""}
                />
                {errors.firstHalfStart && (
                  <p className="text-sm text-red-600">{errors.firstHalfStart}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstHalfEnd" className="text-sm font-medium">
                  First Half End *
                </Label>
                <Input
                  id="firstHalfEnd"
                  type="time"
                  value={formData.firstHalfEnd}
                  onChange={(e) => handleInputChange("firstHalfEnd", e.target.value)}
                  className={errors.firstHalfEnd ? "border-red-300 focus:border-red-500" : ""}
                />
                {errors.firstHalfEnd && (
                  <p className="text-sm text-red-600">{errors.firstHalfEnd}</p>
                )}
              </div>
            </div>
          </div>

          {/* Second Half */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Second Half</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="secondHalfStart" className="text-sm font-medium">
                  Second Half Start *
                </Label>
                <Input
                  id="secondHalfStart"
                  type="time"
                  value={formData.secondHalfStart}
                  onChange={(e) => handleInputChange("secondHalfStart", e.target.value)}
                  className={errors.secondHalfStart ? "border-red-300 focus:border-red-500" : ""}
                />
                {errors.secondHalfStart && (
                  <p className="text-sm text-red-600">{errors.secondHalfStart}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondHalfEnd" className="text-sm font-medium">
                  Second Half End *
                </Label>
                <Input
                  id="secondHalfEnd"
                  type="time"
                  value={formData.secondHalfEnd}
                  onChange={(e) => handleInputChange("secondHalfEnd", e.target.value)}
                  className={errors.secondHalfEnd ? "border-red-300 focus:border-red-500" : ""}
                />
                {errors.secondHalfEnd && (
                  <p className="text-sm text-red-600">{errors.secondHalfEnd}</p>
                )}
              </div>
            </div>
          </div>

          {/* Lunch Break */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Lunch Break</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="lunchStart" className="text-sm font-medium">
                  Lunch Start *
                </Label>
                <Input
                  id="lunchStart"
                  type="time"
                  value={formData.lunchStart}
                  onChange={(e) => handleInputChange("lunchStart", e.target.value)}
                  className={errors.lunchStart ? "border-red-300 focus:border-red-500" : ""}
                />
                {errors.lunchStart && (
                  <p className="text-sm text-red-600">{errors.lunchStart}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lunchEnd" className="text-sm font-medium">
                  Lunch End *
                </Label>
                <Input
                  id="lunchEnd"
                  type="time"
                  value={formData.lunchEnd}
                  onChange={(e) => handleInputChange("lunchEnd", e.target.value)}
                  className={errors.lunchEnd ? "border-red-300 focus:border-red-500" : ""}
                />
                {errors.lunchEnd && (
                  <p className="text-sm text-red-600">{errors.lunchEnd}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Additional Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-sm font-medium">
                  Duration (minutes)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  min="0"
                  max="1440"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graceIn" className="text-sm font-medium">
                  Grace In (minutes)
                </Label>
                <Input
                  id="graceIn"
                  type="number"
                  min="0"
                  max="60"
                  value={formData.graceIn}
                  onChange={(e) => handleInputChange("graceIn", parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="graceOut" className="text-sm font-medium">
                  Grace Out (minutes)
                </Label>
                <Input
                  id="graceOut"
                  type="number"
                  min="0"
                  max="60"
                  value={formData.graceOut}
                  onChange={(e) => handleInputChange("graceOut", parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.crossDay}
                  onChange={(e) => handleInputChange("crossDay", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Cross Day Shift</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.flexible}
                  onChange={(e) => handleInputChange("flexible", e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium">Flexible Shift</span>
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter shift description..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
            <Button
              type="submit"
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <Save className="h-4 w-4" />
              <span>Create Shift</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 