"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Separator } from "@repo/ui/components/ui/separator"
import { Building2, MapPin, Users, Edit3, Plus, X, FileText, UserCog, UserCheck, UserPlus } from "lucide-react"

// Type definitions for shift info
type ShiftGroup = {
  shiftGroupCode: string
  shiftGroupName: string
}
type Subsidiary = {
  subsidiaryCode: string
  subsidiaryName: string
}
type Location = {
  locationCode: string
  locationName: string
}
type ShiftInfoData = {
  shiftGroup: ShiftGroup
  subsidiary: Subsidiary
  location: Location
  employeeCategory: string[]
  numberOfShifts: number
}
interface ShiftInfoProps {
  isOpen?: boolean // for consistency, but not required
  onClose?: () => void
}

// Category details mapping
const CATEGORY_DETAILS: Record<string, { label: string; color: string; icon: React.ReactNode; description: string }> = {
  WKM: {
    label: "Workman",
    color: "bg-blue-100 text-blue-800",
    icon: <UserCog className="w-3 h-3 mr-1" />,
    description: "Workman (WKM)",
  },
  Cat2: {
    label: "Category 2",
    color: "bg-green-100 text-green-800",
    icon: <UserCheck className="w-3 h-3 mr-1" />,
    description: "Skilled Worker (Cat2)",
  },
  Cat3: {
    label: "Category 3",
    color: "bg-yellow-100 text-yellow-800",
    icon: <UserPlus className="w-3 h-3 mr-1" />,
    description: "Trainee (Cat3)",
  },
}

export default function ShiftInfo({ onClose }: ShiftInfoProps) {
  const router = useRouter()
  const [isEditingCategories, setIsEditingCategories] = useState(false)
  const [categories, setCategories] = useState(["WKM", "Cat2", "Cat3"])
  const [newCategory, setNewCategory] = useState("")
  const popupRef = useRef<HTMLDivElement>(null)

  // Static shift info (could be props in future)
  const staticShiftInfo: ShiftInfoData = {
    shiftGroup: {
      shiftGroupCode: "A",
      shiftGroupName: "First Group",
    },
    subsidiary: {
      subsidiaryCode: "sub001",
      subsidiaryName: "subsidiary001",
    },
    location: {
      locationCode: "001",
      locationName: "Bangalore",
    },
    employeeCategory: categories,
    numberOfShifts: 5,
  }

  // Add new category
  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      setCategories([...categories, newCategory.trim()])
      setNewCategory("")
    }
  }
  // Remove category
  const handleRemoveCategory = (categoryToRemove: string) => {
    setCategories(categories.filter((cat) => cat !== categoryToRemove))
  }
  // Add on Enter
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddCategory()
    }
  }
  // Close logic
  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      router.push("/muster/punch")
    }
  }
  // Backdrop click closes popup
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }
  // Escape key closes popup
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
    // eslint-disable-next-line
  }, [])

  // Main render
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={popupRef}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Shift Information
            </h2>
            <p className="text-blue-100 text-sm mt-1">View and manage shift details</p>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
            aria-label="Close popup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Basic Information Section */}
          <div className="mb-8"> {/* Increased margin below section */}
            <h3 className="text-sm font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-300"> {/* More bottom margin and padding */}
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> {/* Increased gap */}
          {/* Subsidiary */}
              <div className="space-y-3"> {/* More vertical space */}
                <div className="flex items-center space-x-2"> {/* More space between icon and label */}
                  <Building2 className="w-4 h-4 text-blue-600" /> {/* Slightly larger icon */}
                  <span className="text-xs font-medium text-gray-700">Subsidiary</span>
                </div>
                <div className="pl-6 space-y-2 text-sm"> {/* More left padding, larger text */}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Code:</span>
                    <span className="font-medium">{staticShiftInfo.subsidiary.subsidiaryCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{staticShiftInfo.subsidiary.subsidiaryName}</span>
            </div>
            </div>
          </div>
          {/* Location */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-medium text-gray-700">Location</span>
                </div>
                <div className="pl-6 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Code:</span>
                    <span className="font-medium">{staticShiftInfo.location.locationCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{staticShiftInfo.location.locationName}</span>
                  </div>
                </div>
            </div>
            </div>
          </div>

          <Separator className="my-6" /> {/* More vertical space between sections */}

          {/* Employee Categories Section */}
          <div className="mb-2"> {/* Less margin below, more above due to separator */}
            <div className="flex items-center justify-between mb-3"> {/* More margin below title row */}
              <h3 className="text-sm font-semibold text-gray-800 pb-2 border-b border-gray-300 flex-1">
                Employee Categories
              </h3>
              <Button
                variant={isEditingCategories ? "destructive" : "outline"}
                size="sm"
                onClick={() => setIsEditingCategories(!isEditingCategories)}
                className="ml-4 h-7 px-3 text-xs" /* More left margin, slightly taller button */
              >
                {isEditingCategories ? (
                  <>
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3 h-3 mr-1" />
                    Manage
                  </>
                )}
              </Button>
            </div>
            <div className="space-y-3"> {/* More vertical space */}
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-4 h-4 text-indigo-600" /> {/* Larger icon */}
                <span className="text-xs font-medium text-gray-700">Active Categories ({categories.length})</span>
              </div>
              {/* Category Display/Edit */}
              <div className="pl-6"> {/* More left padding */}
                {isEditingCategories ? (
                  <div className="space-y-3">
                    {/* Add new category */}
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter new category"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <Button
                        onClick={handleAddCategory}
                        size="sm"
                        disabled={!newCategory.trim()}
                        className="h-7 px-3 text-xs"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    {/* Editable categories */}
                    <div className="flex flex-wrap gap-2">
                      {categories.map((category, index) => {
                        const details = CATEGORY_DETAILS[category] || {
                          label: category,
                          color: "bg-gray-100 text-gray-800",
                          icon: <Users className="w-3 h-3 mr-1" />,
                          description: category,
                        }
                        return (
                          <Badge
                            key={index}
                            variant="secondary"
                            className={`px-3 py-1 text-xs flex items-center ${details.color} hover:bg-opacity-80 cursor-pointer group`}
                            title={details.description}
                          >
                            {details.icon}
                            {details.label}
                            <button
                              onClick={() => handleRemoveCategory(category)}
                              className="ml-1 text-indigo-600 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category, index) => {
                      const details = CATEGORY_DETAILS[category] || {
                        label: category,
                        color: "bg-gray-100 text-gray-800",
                        icon: <Users className="w-3 h-3 mr-1" />,
                        description: category,
                      }
                      return (
                        <Badge
                          key={index}
                          variant="secondary"
                          className={`px-3 py-1 text-xs flex items-center ${details.color}`}
                          title={details.description}
                        >
                          {details.icon}
                          {details.label}
                        </Badge>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-200 rounded-b-xl">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
          </div>
      </div>
    </div>
  )
} 
