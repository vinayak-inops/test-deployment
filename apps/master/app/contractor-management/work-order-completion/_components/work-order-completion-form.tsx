"use client"

import { useForm, SubmitHandler } from "react-hook-form"
import { yupResolver } from "@hookform/resolvers/yup"
import * as yup from "yup"
import SemiPopupWrapper from "@repo/ui/components/popupwrapper/semi-popup-wrapper"
import { CheckCircle } from "lucide-react"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Textarea } from "@repo/ui/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { SingleSelectField } from "@/components/fields/single-select-field"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useEffect, useState } from "react"
import { useQuery } from '@apollo/client'
import { client } from '@repo/ui/hooks/api/dynamic-graphql'
import { gql } from '@apollo/client'
import { useSession } from 'next-auth/react';
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"



interface WorkOrderCompletion {
  contractorCode: string
  workOrderNumber: string
  remarks: string
  createdBy: string
  createdOn: string
}

interface Props {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  editData?: WorkOrderCompletion | null
  isEditMode?: boolean
  isViewMode?: boolean
  deleteValue?: any
  onSuccess?: (saved: any) => void
  onServerUpdate?: () => Promise<any>
}

const schema = yup.object({
  contractorCode: yup.string().required("Contractor code is required"),
  workOrderNumber: yup.string().required("Work order number is required"),
  remarks: yup.string().required("Remarks are required"),
})

export default function WorkOrderCompletionForm({ open, setOpen, editData, isEditMode, isViewMode, deleteValue, onSuccess, onServerUpdate }: Props) {
  const tenantCode = useGetTenantCode()
  const viewMode = !!isViewMode
  const [selectedContractorCode, setSelectedContractorCode] = useState<string>("")
  
  const { post: postCompletion, loading: postLoading } = usePostRequest<any>({
    url: "workOrderCompletion",
  })
  const { data: session, status: sessionStatus } = useSession();

  // GraphQL queries
const FETCH_CONTRACTORS_QUERY = gql`
query FetchContractors {
  fetchContractors(
    criteriaRequests: { field: "tenantCode", operator: "eq", value: ${tenantCode} }
    collection: "contractor"
  ) {
    contractorCode
    workOrders {
      workOrderNumber
    }
    _id
  }
}
`

  // Fetch contractors with nested work orders
  const {
    data: contractorsData,
    error: contractorsError,
    loading: contractorsLoading
  } = useQuery(FETCH_CONTRACTORS_QUERY, {
    client,
    errorPolicy: 'all',
    onCompleted: (data) => {
      if (data?.fetchContractors) {
      }
    },
    onError: (error) => {
      console.error('❌ Error fetching contractors:', error)
    }
  })

  const { register, handleSubmit, setValue, reset, watch, formState: { errors, isSubmitting } } = useForm<WorkOrderCompletion>({
    resolver: yupResolver(schema) as any,
    defaultValues: { 
      contractorCode: "", 
      workOrderNumber: "", 
      remarks: "" 
    }
  })

  useEffect(() => {
    if ((isEditMode || viewMode) && editData) {
      setValue("contractorCode", editData.contractorCode || "")
      setValue("workOrderNumber", editData.workOrderNumber || "")
      setValue("remarks", editData.remarks || "")
      setSelectedContractorCode(editData.contractorCode || "")
    } else {
      reset({ 
        contractorCode: "", 
        workOrderNumber: "", 
        remarks: "" 
      })
      setSelectedContractorCode("")
    }
  }, [isEditMode, viewMode, editData, reset, setValue])

  // Get work orders for selected contractor
  const getWorkOrdersForContractor = (contractorCode: string) => {
    if (!contractorsData?.fetchContractors) return []
    const contractor = contractorsData.fetchContractors.find((c: any) => c.contractorCode === contractorCode)
    return contractor?.workOrders || []
  }

  // Handle contractor selection change
  const handleContractorChange = (contractorCode: string) => {
    setSelectedContractorCode(contractorCode)
    setValue("contractorCode", contractorCode)
    setValue("workOrderNumber", "") // Reset work order number when contractor changes
  }

  const onSubmit: SubmitHandler<WorkOrderCompletion> = async (data) => {
    if (viewMode) return
    
    const payload = {
      tenant: tenantCode,
      action: "insert",
      id: (editData as any)?._id,
      collectionName: "workOrderCompletionApplication",
      event: "application",
      data:{
        tenantCode:tenantCode,
        organizationCode:tenantCode,
        ...data,
        workflowState:"INITIATED",
        workflowName:"WorkOrderCompletionWorkflow",
        stateEvent:"NEXT",
        uploadedBy:session?.user?.name,
        createdBy:editData?.createdBy || session?.user?.name,
        createdOn:new Date().toISOString(),
        appliedDate: new Date().toISOString().split('T')[0],
      }
    }
    await postCompletion(payload)
    onSuccess?.(data)
    await onServerUpdate?.()
    reset()
    setOpen(false)
  }

  const handleCancel = () => {
    reset()
    setOpen(false)
  }

  return (
    <SemiPopupWrapper
      open={open}
      setOpen={setOpen}
      content={{ title: isEditMode ? "Edit Work Order Completion" : "Add Work Order Completion", description: "Manage work order completion requests" }}
    >
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between rounded-t-lg -mx-6 pt-4 mb-2">
          <div className="group cursor-default pl-8">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
                  <CheckCircle className="w-5 h-5 text-gray-700 transition-colors duration-300 group-hover:text-gray-900" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-sm animate-pulse"></div>
              </div>
              <div className="transform transition-all duration-300 group-hover:translate-x-1">
                <h1 className="text-lg font-bold flex items-center gap-2">
                  {viewMode ? "View Work Order Completion" : (isEditMode ? "Edit Work Order Completion" : "Add Work Order Completion")}
                </h1>
                <p className="text-blue-100 text-sm mt-1">
                  {viewMode ? "Read-only" : (isEditMode ? "Update work order completion details" : "Create a new work order completion request")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              {/* Contractor and Work Order Number in same row */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <SingleSelectField
                    key={`contractorCode`}
                    id="contractorCode"
                    label="Contractor"
                    placeholder="Search Contractor"
                    disabled={viewMode}
                    value={watch("contractorCode") || ""}
                    onChange={handleContractorChange}
                    options={contractorsLoading ? [] : (contractorsData?.fetchContractors ?? []).map((contractor: any) => ({
                      value: contractor.contractorCode || "",
                      label: contractor.contractorCode || "",
                      tooltip: contractor.contractorCode || ""
                    }))}
                    showOnlyValueInTrigger
                    className="group"
                    errorMessage={errors.contractorCode ? errors.contractorCode.message : undefined}
                    allowOnlyProvidedOptions
                  />
                </div>

                <div className="space-y-2">
                  <SingleSelectField
                    key={`workOrderNumber-${selectedContractorCode || 'none'}`}
                    id="workOrderNumber"
                    label="Work Order Number"
                    placeholder={selectedContractorCode ? "Search Work Order Number" : "Select contractor first"}
                    disabled={viewMode || !selectedContractorCode}
                    value={watch("workOrderNumber") || ""}
                    onChange={(value) => setValue("workOrderNumber", value)}
                    options={selectedContractorCode ? getWorkOrdersForContractor(selectedContractorCode).map((workOrder: any) => ({
                      value: workOrder.workOrderNumber || "",
                      label: workOrder.workOrderNumber || "",
                      tooltip: workOrder.workOrderNumber || ""
                    })) : []}
                    showOnlyValueInTrigger
                    className="group"
                    errorMessage={errors.workOrderNumber ? errors.workOrderNumber.message : undefined}
                    allowOnlyProvidedOptions
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Remarks <span className="text-red-500">*</span></Label>
                <Textarea
                  {...register("remarks")}
                  placeholder="Enter remarks"
                  className={`min-h-[100px] ${errors.remarks ? 'border-red-500' : ''}`}
                  disabled={viewMode}
                />
                {errors.remarks && <p className="text-sm text-red-500">{errors.remarks.message}</p>}
              </div>
            </div>

            {!viewMode && (
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting || postLoading}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || postLoading} style={{ backgroundColor: '#2d81ff' }} className="hover:opacity-90">{(isSubmitting || postLoading) ? 'Saving...' : isEditMode ? 'Update' : 'Save'}</Button>
              </div>
            )}
          </form>
        </div>
      </div>
    </SemiPopupWrapper>
  )
}