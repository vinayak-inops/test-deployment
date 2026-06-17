"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Settings, ArrowLeft, RotateCcw, X } from "lucide-react"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

// Validation schema
const auditTrailSchema = z.object({
  createdBy: z.string().min(1, "Created by is required"),
  createdOn: z.string().min(1, "Created on date is required"),
})

type AuditTrailData = z.infer<typeof auditTrailSchema>

interface AuditStatusFormProps {
  formData: any
  onFormDataChange: (data: any) => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
}

// Helper function to convert MongoDB $date to YYYY-MM-DD format
const convertMongoDateToInputDate = (mongoDate: any): string => {
  if (!mongoDate) return ""
  if (typeof mongoDate === "string") return mongoDate
  if (mongoDate.$date) {
    return new Date(mongoDate.$date).toISOString().split('T')[0]
  }
  return ""
}

// Helper function to convert YYYY-MM-DD to MongoDB $date format
const convertInputDateToMongoDate = (inputDate: string): any => {
  if (!inputDate) return null
  return { $date: new Date(inputDate).toISOString() }
}

export function AuditStatusForm({ 
  formData, 
  onFormDataChange, 
  onPreviousTab,
  mode = "add" 
}: AuditStatusFormProps) {
  const [auditTrail, setAuditTrail] = useState<AuditTrailData>({
    createdBy: "",
    createdOn: "",
  })
  const [showErrors, setShowErrors] = useState(false)
  const isInitialMount = useRef(true)
  const lastAuditTrailRef = useRef<AuditTrailData>({
    createdBy: "",
    createdOn: "",
  })
  
  // Get the "id" and "mode" values from the URL query parameters
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const modeParam = searchParams.get("mode");
  const currentMode = (modeParam === "add" || modeParam === "edit" || modeParam === "view") ? modeParam : "add";

  const isViewMode = currentMode === "view"
  const tenantCode = useGetTenantCode()

  // Fetch contractor data
  const {
    data: contractorResponse,
    loading: isLoading,
    error: contractorError,
    refetch: fetchContractor
  } = useRequest<any>({
    url: 'contractor/search',
    method: 'POST',
    data: [
      {
        field: "_id",
        value: id,
        operator: "eq",
      }
    ],
    onSuccess: (data) => { },
    onError: (error) => {
      console.error("Error fetching contractor data:", error);
    },
    dependencies: [id]
  });

  // Fetch data when in view or edit mode
  useEffect(() => {
    if (currentMode === "view" || currentMode === "edit") {
      fetchContractor()
    }
  }, [currentMode]) // Remove fetchContractor from dependencies to prevent infinite loop

  // Populate audit trail from fetched data (primary source)
  useEffect(() => {
    if (contractorResponse && contractorResponse[0] && contractorResponse[0].auditTrail) {
      const auditTrailData = contractorResponse[0].auditTrail;
      setAuditTrail({
        createdBy: auditTrailData.createdBy || "",
        createdOn: convertMongoDateToInputDate(auditTrailData.createdOn),
      })
    }
  }, [contractorResponse])

  // Populate audit trail from formData (fallback)
  useEffect(() => {
    if (formData && formData.auditTrail && !contractorResponse) {
      setAuditTrail({
        createdBy: formData.auditTrail.createdBy || "",
        createdOn: convertMongoDateToInputDate(formData.auditTrail.createdOn),
      })
    }
  }, [formData, contractorResponse])

  // Memoized function to create exact data structure
  const createExactData = useCallback((auditTrailData: AuditTrailData) => {
    return {
      auditTrail: {
        createdBy: auditTrailData.createdBy || "",
        createdOn: convertInputDateToMongoDate(auditTrailData.createdOn),
      }
    }
  }, [])

  // Update form data when audit trail changes - with proper guards
  useEffect(() => {
    // Skip the first render to prevent infinite loop
    if (isInitialMount.current) {
      isInitialMount.current = false
      lastAuditTrailRef.current = auditTrail
      return
    }

    // Check if auditTrail actually changed to prevent unnecessary updates
    const auditTrailChanged = JSON.stringify(auditTrail) !== JSON.stringify(lastAuditTrailRef.current)
    
    if (auditTrailChanged) {
      const exactData = createExactData(auditTrail)
      onFormDataChange(exactData)
      lastAuditTrailRef.current = auditTrail
    }
  }, [auditTrail, createExactData]) // Removed onFormDataChange from dependencies

  // API call for saving audit status
  const {
    post: postAuditStatus,
    loading: postLoading,
  } = usePostRequest<any>({
    url: "contractor",
    onSuccess: (data) => {
    },
    onError: (error) => {
      console.error("Error saving audit status:", error)
    },
  })

  const updateAuditTrail = (field: string, value: string) => {
    const updatedAuditTrail = { ...auditTrail, [field]: value }
    setAuditTrail(updatedAuditTrail)
  }

  const handleSaveAndContinue = async () => {
    setShowErrors(true)
    
    // Validate audit trail
    const validationResult = auditTrailSchema.safeParse(auditTrail)
    if (!validationResult.success) {
      console.error("Validation errors:", validationResult.error.flatten().fieldErrors)
      return
    }

    // Create the exact JSON structure as requested
    const exactData = createExactData(auditTrail)
    
    onFormDataChange(exactData)
    
    if (currentMode === "add") {
      let json = {
        tenant: tenantCode,
        action: "insert",
        id: formData._id || null,
        collectionName: "contractor",
        data: {
          ...exactData,
          organizationCode: tenantCode,
          tenantCode: tenantCode,
          auditStatus: true
        },
      }
      postAuditStatus(json)
    } else if (currentMode === "edit") {
      let json = {
        tenant: tenantCode,
        action: "insert",
        id: contractorResponse?.[0]?._id || formData._id || null,
        collectionName: "contractor",
        data: {
          ...contractorResponse?.[0],
          ...exactData,
          auditStatus: true
        }
      }
      postAuditStatus(json)
    }
  }

  const handleReset = () => {
    const clearedData = {
      createdBy: "",
      createdOn: "",
    }
    setAuditTrail(clearedData)
    onFormDataChange({ auditTrail: {} })
    lastAuditTrailRef.current = clearedData
  }

  const validationResult = auditTrailSchema.safeParse(auditTrail)
  const errors = validationResult.success ? {} : validationResult.error.flatten().fieldErrors

  return (
    <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white/70 backdrop-blur-xl shadow-xl overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-700/90"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Audit & Status</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  Audit trail and system status information
                </CardDescription>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {/* Loading and Error States */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading contractor data...</p>
          </div>
        )}

        {contractorError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 text-sm">Error loading contractor data: {contractorError.message}</p>
          </div>
        )}

        <div className="space-y-8">
          {/* Audit Trail */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Audit Trail
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group">
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Created By <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={auditTrail.createdBy}
                  onChange={(e) => updateAuditTrail("createdBy", e.target.value)}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.createdBy 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-gray-500 focus:ring-gray-500/20"
                  }`}
                  placeholder="Enter creator ID"
                  disabled={isViewMode}
                />
                {errors.createdBy && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.createdBy[0]}
                  </p>
                )}
              </div>
              <div className="group">
                <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Created On <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={auditTrail.createdOn}
                  onChange={(e) => updateAuditTrail("createdOn", e.target.value)}
                  className={`h-10 border-2 focus:ring-4 rounded-xl transition-all duration-300 group-hover:border-gray-300 ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    errors.createdOn 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-gray-500 focus:ring-gray-500/20"
                  }`}
                  disabled={isViewMode}
                />
                {errors.createdOn && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.createdOn[0]}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Status Information
            </h3>
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Contractor Status</p>
                    <p className="text-xs text-gray-500">Active and compliant</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Documentation</p>
                    <p className="text-xs text-gray-500">All documents verified</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Work Orders</p>
                    <p className="text-xs text-gray-500">Active work orders present</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Compliance</p>
                    <p className="text-xs text-gray-500">Meeting all requirements</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            {onPreviousTab && (
              <Button
                type="button"
                variant="outline"
                onClick={onPreviousTab}
                className="px-6 py-3 h-12 rounded-xl border-2 border-gray-300 hover:bg-gray-50 bg-transparent text-gray-700 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            {/* {!isViewMode && (
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="px-6 py-3 h-12 rounded-xl border-2 border-gray-300 hover:bg-gray-50 bg-transparent text-gray-700 hover:text-gray-900 transition-colors"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset Form
              </Button>
            )} */}
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${validationResult.success ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {validationResult.success ? 'All fields completed' : 'Please complete all required fields'}
              </span>
            </div>
            
            {!isViewMode && (
              <Button
                type="button"
                onClick={handleSaveAndContinue}
                disabled={postLoading || !validationResult.success}
                className="px-6 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Contractor
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 