"use client"

import { useState, useEffect } from "react"
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { Clock, Calendar, X, User, LogIn, LogOut, MessageSquare, AlertCircle, CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGetTenantCode } from "@/hooks/useGetTenantCode"
import { formatDateTimeIST } from "@/utils/time/time-control"

interface AddedPunchRecord {
  _id: string
  employeeID: string
  punchedTime: string
  transactionTime: string
  inOut: string
  typeOfMovement: string
  readerSerialNumber: string
  uploadTime: string
  attendanceDate: string
  organizationCode: string
  tenantCode: string
  isDeleted: boolean
  state: string
  date: string
  processed: boolean
  remarks?: string
}

interface AddedPunchViewPopupProps {
  isOpen: boolean
  onClose: () => void
  selectedPunchId?: string | null
}

export default function AddedPunchViewPopup({
  isOpen,
  onClose,
  selectedPunchId,
}: AddedPunchViewPopupProps) {
  const [punchData, setPunchData] = useState<AddedPunchRecord | null>(null)
  const tenantCode = useGetTenantCode()

  const {
    data: punchResponse,
    loading: isLoading,
    error: punchError,
    refetch: fetchPunchData
  } = useRequest<any>({
    url: 'muster/data_check/search',
    method: 'POST',
    data: [
      { field: "_id", operator: "eq", value: selectedPunchId },
      { field: "tenantCode", operator: "eq", value: tenantCode }
    ],
    onSuccess: (data) => {
      if (Array.isArray(data) && data.length > 0) {
        setPunchData(data[0])
      } else {
        setPunchData(null)
      }
    },
    onError: (error) => {
      console.error("Error fetching punch data:", error)
      setPunchData(null)
    },
  })

  useEffect(() => {
    if (isOpen && selectedPunchId) {
      fetchPunchData()
    }
  }, [isOpen, selectedPunchId])

  // Reset data when popup closes
  useEffect(() => {
    if (!isOpen) {
      setPunchData(null)
    }
  }, [isOpen])

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
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

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '-'
    return formatDateTimeIST(timeStr)
  }

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full max-w-5xl h-[85vh] flex flex-col rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-700">Added Punch Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
            aria-label="Close popup"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden bg-gray-50">
          {/* Left Side - Punch Details */}
          <div className="w-3/5 flex flex-col bg-white border-r border-gray-100">
            <div className="flex-1 overflow-y-auto px-6 py-4 scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : punchError ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
                  <p className="text-base font-medium text-gray-700">Error loading punch data</p>
                  <p className="text-sm text-gray-500 mt-1">Please try again later</p>
                </div>
              ) : !punchData ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Calendar className="h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-base font-medium text-gray-500">No punch data found</p>
                </div>
              ) : (
                <div className="max-w-2xl">
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <h3 className="text-base font-semibold text-gray-700">Punch Details</h3>
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border ${
                      punchData.processed 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {punchData.processed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-600" />
                      )}
                      <span className="uppercase tracking-wide">{punchData.processed ? 'PROCESSED' : 'PENDING'}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {/* Employee ID */}
                    <div className="flex items-center border-b border-gray-100 pb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Employee ID</label>
                      <span className="text-sm text-gray-900 font-medium">{punchData.employeeID || '-'}</span>
                    </div>

                    {/* Attendance Date */}
                    {punchData.attendanceDate && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Attendance Date</label>
                        <span className="text-sm text-gray-900 font-medium">{formatDate(punchData.attendanceDate)}</span>
                      </div>
                    )}

                    {/* Punched Time */}
                    {punchData.punchedTime && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Punch Time</label>
                        <span className="text-sm text-gray-900 font-medium">{formatTime(punchData.punchedTime)}</span>
                      </div>
                    )}

                    {/* Transaction Time */}
                    {punchData.transactionTime && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Transaction Time</label>
                        <span className="text-sm text-gray-900 font-medium">{formatTime(punchData.transactionTime)}</span>
                      </div>
                    )}

                    {/* Upload Time */}
                    {punchData.uploadTime && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Upload Time</label>
                        <span className="text-sm text-gray-900 font-medium">{formatTime(punchData.uploadTime)}</span>
                      </div>
                    )}

                    {/* In/Out */}
                    {punchData.inOut && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">In/Out</label>
                        <span className="text-sm text-gray-900 font-medium">
                          {punchData.inOut === 'I' ? 'In' : punchData.inOut === 'O' ? 'Out' : punchData.inOut}
                        </span>
                      </div>
                    )}

                    {/* Type of Movement */}
                    {punchData.typeOfMovement && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Type of Movement</label>
                        <span className="text-sm text-gray-900 font-medium">
                          {punchData.typeOfMovement === 'P' ? 'Personal' : punchData.typeOfMovement === 'O' ? 'Official' : punchData.typeOfMovement}
                        </span>
                      </div>
                    )}

                    {/* Reader Serial Number */}
                    {punchData.readerSerialNumber && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Reader Serial</label>
                        <span className="text-sm text-gray-900 font-medium">{punchData.readerSerialNumber}</span>
                      </div>
                    )}

                    {/* State */}
                    {punchData.state && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">State</label>
                        <span className="text-sm text-gray-900 font-medium capitalize">{punchData.state}</span>
                      </div>
                    )}

                    {/* Processed */}
                    <div className="flex items-center border-b border-gray-100 pb-2">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Processed</label>
                      <span className={`text-sm font-medium ${punchData.processed ? 'text-green-600' : 'text-gray-600'}`}>
                        {punchData.processed ? 'Yes' : 'No'}
                      </span>
                    </div>

                    {/* Date */}
                    {punchData.date && (
                      <div className="flex items-center border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0">Date</label>
                        <span className="text-sm text-gray-900 font-medium">{formatTime(punchData.date)}</span>
                      </div>
                    )}

                    {/* Remarks */}
                    {punchData.remarks && (
                      <div className="flex items-start border-b border-gray-100 pb-2">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider w-32 flex-shrink-0 pt-1">Remarks</label>
                        <span className="text-sm text-gray-900 font-medium flex-1">{punchData.remarks}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Status Panel */}
          <div className="w-2/5 flex flex-col bg-gray-50">
            <div className="flex-1 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-400">
              {punchData && punchData.processed ? (
                <div className="flex items-center justify-center h-full px-6 py-4">
                  <div className="text-center">
                    <div className="mb-3">
                      <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                    </div>
                    <p className="text-base font-semibold text-gray-700 mb-1">
                      Punch Processed
                    </p>
                    <p className="text-sm text-gray-500">
                      This punch has been processed and cannot be modified.
                    </p>
                  </div>
                </div>
              ) : punchData ? (
                <div className="flex items-center justify-center h-full px-6 py-4">
                  <div className="text-center">
                    <div className="mb-3">
                      <Clock className="h-12 w-12 text-gray-600 mx-auto" />
                    </div>
                    <p className="text-base font-semibold text-gray-700 mb-1">
                      Punch Pending
                    </p>
                    <p className="text-sm text-gray-500">
                      This punch is pending processing.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full px-6 py-4">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-base font-medium text-gray-500">No punch data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
