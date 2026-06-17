"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@repo/ui/components/ui/dialog"
import { cn } from "@repo/ui/lib/utils"
import { DetailedRequestModal } from "./detailed-request-modal"
import LeaveOfAbsenceModal from "./leave-of-absence-modal"
import { useLeaveCodes } from "../../../hooks/useLeaveCodes"
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken"

// Transformed leave type for dropdown
interface LeaveType {
  id: string
  label: string
  category: string
}

interface RequestAbsenceModalProps {
  isOpen: boolean
  onClose: () => void
  selectedDates: number[]
  currentDate: Date
  onDateDelete?: (dateToDelete: number) => void
  selectedEmployeeId: string
}

export function RequestAbsenceModal({ isOpen, onClose, selectedDates, currentDate, onDateDelete, selectedEmployeeId }: RequestAbsenceModalProps) {
  const [selectedAbsenceType, setSelectedAbsenceType] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [showDetailedModal, setShowDetailedModal] = useState(false)
  const [showLeaveOfAbsenceModal, setShowLeaveOfAbsenceModal] = useState(false)
  const [showTimeAwayDropdown, setShowTimeAwayDropdown] = useState(false)
  const [showLeaveOfAbsenceDropdown, setShowLeaveOfAbsenceDropdown] = useState(false)
  const [selectedLeaveType, setSelectedLeaveType] = useState("")
  const [selectedAbsenceLeaveType, setSelectedAbsenceLeaveType] = useState("")
  
  const { token, loading: tokenLoading, error: tokenError } = useAuthToken();

  // Use the leave codes hook - only pass token when available
  const { leaveCodes, loading, error } = useLeaveCodes("")

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const formatDate = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dayName = dayNames[date.getDay()]
    const monthName = monthNames[date.getMonth()].substring(0, 3)
    return `${dayName}, ${monthName} ${day}`
  }

  // Transform leave codes to absence types and leave types
  const absenceTypes = [
    { id: "Time Away", label: "Time Away" },
    { id: "Leave of Absence", label: "Leave of Absence" },
  ]

  // Filter leave codes by category
  const timeAwayLeaveTypes: LeaveType[] = leaveCodes
    .filter(code => code.leaveCategory === "Time Away")
    .map(code => ({
      id: code.leaveCode,
      label: code.leaveCodeWithTitle,
      category: code.leaveCategory
    }))

  const leaveOfAbsenceTypes: LeaveType[] = leaveCodes
    .filter(code => code.leaveCategory === "Leave of Absence")
    .map(code => ({
      id: code.leaveCode,
      label: code.leaveCodeWithTitle,
      category: code.leaveCategory
    }))

  const filteredAbsenceTypes = absenceTypes.filter((type) =>
    type.label.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAbsenceTypeSelect = (typeId: string) => {
    if (typeId === "Time Away") {
      // If clicking the same type, toggle the dropdown
      if (typeId === "Time Away") {
        setShowTimeAwayDropdown(!showTimeAwayDropdown)
        setShowLeaveOfAbsenceDropdown(false)
      } else if (typeId === "Leave of Absence") {
        setShowLeaveOfAbsenceDropdown(!showLeaveOfAbsenceDropdown)
        setShowTimeAwayDropdown(false)
      }
    } else {
      // If clicking a different type, select it and show its dropdown
      setSelectedAbsenceType(typeId)
      if (typeId === "Time Away") {
        setShowTimeAwayDropdown(true)
        setShowLeaveOfAbsenceDropdown(false)
        setSelectedAbsenceLeaveType("")
      } else if (typeId === "Leave of Absence") {
        setShowLeaveOfAbsenceDropdown(true)
        setShowTimeAwayDropdown(false)
        setSelectedLeaveType("")
      } else {
        setShowTimeAwayDropdown(false)
        setShowLeaveOfAbsenceDropdown(false)
        setSelectedLeaveType("")
        setSelectedAbsenceLeaveType("")
      }
    }
  }


  const handleLeaveTypeSelect = (leaveTypeId: string) => {
    setSelectedLeaveType(leaveTypeId)
    setSelectedAbsenceType("Time Away") // Ensure absence type is set
    setSelectedAbsenceLeaveType("") // Clear Leave of Absence selection
    // Close the dropdown after selection
    setShowTimeAwayDropdown(false)
  }

  const handleAbsenceLeaveTypeSelect = (leaveTypeId: string) => {
    setSelectedAbsenceLeaveType(leaveTypeId)
    setSelectedAbsenceType("Leave of Absence") // Ensure absence type is set
    setSelectedLeaveType("") // Clear Time Away selection
    // Close the dropdown after selection
    setShowLeaveOfAbsenceDropdown(false)
  }

  const handleSubmit = () => {
    if (selectedAbsenceType === "Time Away") {
      if (selectedLeaveType) {
        setShowDetailedModal(true)
      }
    } else if (selectedAbsenceType === "Leave of Absence") {
      if (selectedAbsenceLeaveType) {
        setShowLeaveOfAbsenceModal(true)
      }
    }
  }

  const handleDetailedModalClose = () => {
    setShowDetailedModal(false)
    onClose()
  }

  const handleDetailedModalBack = () => {
    setShowDetailedModal(false)
  }

  const handleLeaveOfAbsenceModalClose = () => {
    setShowLeaveOfAbsenceModal(false)
    onClose()
  }

  const handleLeaveOfAbsenceModalBack = () => {
    setShowLeaveOfAbsenceModal(false)
  }

  const isSubmitDisabled = !selectedAbsenceType || 
    (selectedAbsenceType === "Time Away" && !selectedLeaveType) ||
    (selectedAbsenceType === "Leave of Absence" && !selectedAbsenceLeaveType)
  return (
    <>
      <Dialog open={isOpen && !showDetailedModal && !showLeaveOfAbsenceModal} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl p-0 gap-0 bg-white rounded-lg shadow-xl" aria-describedby="request-absence-description">
          {/* Header */}
          <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 space-y-0">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle className="text-base font-semibold text-slate-900">Request Absence</DialogTitle>
                <DialogDescription id="request-absence-description" className="sr-only">
                  Modal for requesting absence from work
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Content */}
          <div className="px-6 pb-6">
            {/* Request Dates Section */}
            <div className="mb-6 h-[100px] overflow-y-auto">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Request Dates</h3>
              <div className="space-y-1">
                {selectedDates
                  .sort((a, b) => a - b)
                  .map((date) => (
                    <div key={date} className="text-xs text-slate-700">
                      {formatDate(date)}
                    </div>
                  ))}
              </div>
            </div>

            {/* Type of Absence Section */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Type of Absence</h3>
                <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">?</span>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative mb-3">
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10 bg-slate-50 border-slate-200"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="flex flex-col space-y-0.5">
                    <div className="w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-slate-400"></div>
                    <div className="w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-slate-400"></div>
                  </div>
                </div>
              </div>

              {/* Absence Type Options */}
              <div className="space-y-1 ">
                {filteredAbsenceTypes.slice(0, 2).map((type) => (
                  <div key={type.id}>
                    <button
                      onClick={() => handleAbsenceTypeSelect(type.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 rounded-md border text-left transition-colors",
                        selectedAbsenceType === type.id
                          ? "bg-blue-50 border-blue-200"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100",
                      )}
                    >
                      <div className="flex flex-col ">
                        <span className="text-xs font-medium text-slate-900">{type.label}</span>
                        {type.id === "Time Away" && selectedLeaveType && (
                          <span className="text-xs text-blue-600 mt-1">
                            Selected: {timeAwayLeaveTypes.find(lt => lt.id === selectedLeaveType)?.label || selectedLeaveType}
                          </span>
                        )}
                        {type.id === "Leave of Absence" && selectedAbsenceLeaveType && (
                          <span className="text-xs text-blue-600 mt-1">
                            Selected: {leaveOfAbsenceTypes.find(lt => lt.id === selectedAbsenceLeaveType)?.label || selectedAbsenceLeaveType}
                          </span>
                        )}
                      </div>
                      {type.id === "Time Away" ? (
                        showTimeAwayDropdown ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )
                      ) : type.id === "Leave of Absence" ? (
                        showLeaveOfAbsenceDropdown ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )
                      ) : null}
                    </button>
                    
                    {/* Time Away Dropdown */}
                    {type.id === "Time Away" && showTimeAwayDropdown && (
                      <div className="mt-2 ml-4 border-l-2 border-blue-200 pl-4 h-[200px] overflow-y-auto">
                        <div className="space-y-2">
                          {tokenLoading ? (
                            <div className="text-xs text-slate-500 p-2">Loading authentication...</div>
                          ) : tokenError ? (
                            <div className="text-xs text-red-600 p-2 bg-red-50 border border-red-200 rounded">
                              Authentication Error: {tokenError.message}
                            </div>
                          ) : loading ? (
                            <div className="text-xs text-slate-500 p-2">Loading leave types...</div>
                          ) : error ? (
                            <div className="text-xs text-red-600 p-2 bg-red-50 border border-red-200 rounded">
                              Error: {error}
                            </div>
                          ): timeAwayLeaveTypes.length === 0 ? (
                            <div className="text-xs text-slate-500 p-2">No Time Away leave types available</div>
                          ) : (
                            timeAwayLeaveTypes.map((leaveType) => (
                              <label
                                key={leaveType.id}
                                className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-slate-50"
                              >
                                <input
                                  type="radio"
                                  name="leaveType"
                                  value={leaveType.id}
                                  checked={selectedLeaveType === leaveType.id}
                                  onChange={(e) => handleLeaveTypeSelect(e.target.value)}
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <div className="flex flex-col">
                                  <span className="text-xs text-slate-700">{leaveType.label}</span>
                                </div>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Leave of Absence Dropdown */}
                    {type.id === "Leave of Absence" && showLeaveOfAbsenceDropdown && (
                      <div className="mt-2 ml-4 border-l-2 border-blue-200 pl-4">
                        <div className="space-y-2">
                          {tokenLoading ? (
                            <div className="text-xs text-slate-500 p-2">Loading authentication...</div>
                          ) : tokenError ? (
                            <div className="text-xs text-red-600 p-2 bg-red-50 border border-red-200 rounded">
                              Authentication Error: {tokenError.message}
                            </div>
                          ) : loading ? (
                            <div className="text-xs text-slate-500 p-2">Loading leave types...</div>
                          ) : error ? (
                            <div className="text-xs text-red-600 p-2 bg-red-50 border border-red-200 rounded">
                              Error: {error}
                            </div>
                          ): leaveOfAbsenceTypes.length === 0 ? (
                            <div className="text-xs text-slate-500 p-2">No Leave of Absence types available</div>
                          ) : (
                            leaveOfAbsenceTypes.map((leaveType) => (
                              <label
                                key={leaveType.id}
                                className="flex items-center space-x-3 cursor-pointer p-2 rounded-md hover:bg-slate-50"
                              >
                                <input
                                  type="radio"
                                  name="absenceLeaveType"
                                  value={leaveType.id}
                                  checked={selectedAbsenceLeaveType === leaveType.id}
                                  onChange={(e) => handleAbsenceLeaveTypeSelect(e.target.value)}
                                  className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                                />
                                <span className="text-xs text-slate-700">{leaveType.label}</span>
                              </label>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6 py-2 text-slate-700 border-slate-300 hover:bg-slate-50 bg-transparent"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detailed Request Modal */}
      <DetailedRequestModal
        isOpen={showDetailedModal}
        onClose={handleDetailedModalClose}
        onBack={handleDetailedModalBack}
        selectedDates={selectedDates}
        currentDate={currentDate}
        selectedLeaveType={selectedLeaveType}
        selectedEmployeeId={selectedEmployeeId}
      />

      {/* Leave of Absence Modal */}
      <LeaveOfAbsenceModal
        isOpen={showLeaveOfAbsenceModal}
        onClose={handleLeaveOfAbsenceModalClose}
        onBack={handleLeaveOfAbsenceModalBack}
        selectedAbsenceType={selectedAbsenceLeaveType}
        selectedEmployeeId={selectedEmployeeId}
      />
    </>
  )
}
