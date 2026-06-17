"use client"

import React, { useEffect, useState } from 'react'
import { X, AlertCircle, Save, Edit } from 'lucide-react'
import { usePostRequest } from '@repo/ui/hooks/api/usePostRequest'
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { useForm, Controller } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import ActionButtons from '@/components/common/action-buttons'
import { useGetTenantCode } from '@/hooks/useGetTenantCode'

interface Props {
  isOpen: boolean
  onClose: () => void
  mode?: { mode: 'add' | 'edit' | 'view'; id?: string | null }
  employeeId?: string
  selectedId?: string
  onSuccess?: () => void
  canApproveSuspected?: boolean
}

// Types for form data
interface SuspectedPunchDataForm {
  punchedTime: string
  transactionTime: string
  inOut: string
  typeOfMovement: string
  uploadTime: string
  attendanceDate: string
  employeeID: string
  state: string
  date: string
  processed: boolean
  failureDescription: string
}

const validationSchema: yup.ObjectSchema<SuspectedPunchDataForm> = yup.object({
  punchedTime: yup.string().required('Punched time is required'),
  transactionTime: yup.string().required('Transaction time is required'),
  inOut: yup.string().oneOf(['I', 'O'], 'Must be I or O').required('In/Out is required'),
  typeOfMovement: yup.string().oneOf(['', 'P', 'O'], 'Must be P, O, or empty').required('Type of movement is required'),
  uploadTime: yup.string().required('Upload time is required'),
  attendanceDate: yup.string().required('Attendance date is required'),
  employeeID: yup.string().required('Employee ID is required'),
  state: yup.string().oneOf(['new', 'processed'], 'Must be new or processed').required('State is required'),
  date: yup.string().required('Date is required'),
  processed: yup.boolean().required('Processed status is required'),
  failureDescription: yup.string().required('Failure description is required'),
})

const fieldStyles = "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition"
const fieldErrorStyles = "h-9 border-red-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-red-500 focus:border-red-500 transition"
const switchStyles = 'h-5 w-5 accent-blue-600'

function ErrorMessage({ error }: { error?: string }) {
  if (!error) return null
  return (
    <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
      <AlertCircle className="h-3 w-3" />
      {error}
    </div>
  )
}

// Normalize API datetime strings to yyyy-MM-ddTHH:mm for input[type=datetime-local]
function toDateTimeLocal(value: string): string {
  if (!value) return ''
  // If already in desired format, trim to minutes
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 16)
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    // Fallback: try slicing
    return value.slice(0, 16)
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  const yyyy = date.getFullYear()
  const mm = pad(date.getMonth() + 1)
  const dd = pad(date.getDate())
  const hh = pad(date.getHours())
  const min = pad(date.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

export default function SuspectedPunchDataForm({ isOpen, onClose, mode, employeeId, selectedId, onSuccess, canApproveSuspected = false }: Props) {
  const [showSuccess, setShowSuccess] = useState(false)
  const isViewMode = (mode?.mode || 'add') === 'view'
  const isEditMode = (mode?.mode || 'add') === 'edit'
  const tenantCode = useGetTenantCode

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    control,
  } = useForm<SuspectedPunchDataForm>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      punchedTime: '',
      transactionTime: '',
      inOut: '',
      typeOfMovement: '',
      uploadTime: '',
      attendanceDate: '',
      employeeID: employeeId || '',
      state: '',
      date: '',
      processed: false,
      failureDescription: '',
    }
  })
  const uploadTimeValue = watch('uploadTime')
  const dateValue = watch('date')
  const typeOfMovementValue = watch('typeOfMovement')
  const failureDescriptionValue = watch('failureDescription')

  const {
    data: attendanceResponse,
    loading: attendanceLoading,
    error: attendanceError,
    refetch: refetchById
  } = useRequest<any>({
    url: 'muster/suspectedPunches/search',
    method: 'POST',
    data: [
        { field: "_id", operator: "eq", value: selectedId  }
    ],
    onSuccess: (resp) => {

        const item: any = Array.isArray(resp) ? resp[0] : resp
        if (!item) return
  
        const payload: SuspectedPunchDataForm = {
          punchedTime: toDateTimeLocal(item.punchedTime || ''),
          transactionTime: toDateTimeLocal(item.transactionTime || ''),
          inOut: item.inOut || '',
          typeOfMovement: item.typeOfMovement || 'NONE',
          uploadTime: toDateTimeLocal(item.uploadTime || ''),
          attendanceDate: (item.attendanceDate || '').slice(0, 10),
          employeeID: item.employeeID || employeeId || '',
          state: item.state || '',
          date: toDateTimeLocal(item.date || ''),
          processed: !!item.processed,
          failureDescription: item.failureDescription || '',
        }
        reset(payload, { keepDefaultValues: false })
      },
    onError: (error) => {
      console.error("Error fetching attendance data:", error);
    },
    dependencies: [mode?.id]
  });

 

  // Post request for saving data
  const { post: deletePunchData, loading: postLoading } = usePostRequest<any>({
    url: 'muster/suspectedPunches',
    onSuccess: (resp) => {
      setShowSuccess(true)
      // Call the success callback to refresh parent data
      if (onSuccess) {
        onSuccess()
      }
    },
    onError: () => {
      alert('Error saving data. Please try again.')
    },
  })


  // Post request for saving data
  const { post: dataCheck, loading: dataCheckLoading } = usePostRequest<any>({
    url: 'muster/data_check',
    onSuccess: (resp) => {
      setShowSuccess(true)
      onClose()
      // Call the success callback to refresh parent data
      if (onSuccess) {
        onSuccess()
      }
    },
    onError: () => {
      alert('Error checking data. Please try again.')
    },
  })

  // Load form data when mode changes
  useEffect(() => {
    if (!isOpen) return
      refetchById()
  }, [selectedId])

  // Update employeeID when employeeId prop changes
  useEffect(() => {
    if (employeeId) {
      setValue('employeeID', employeeId)
    }
  }, [employeeId])

  const handleSubmitForm = (data: SuspectedPunchDataForm) => {
    // Omit failureDescription from payload
    const { failureDescription, ...restData } = data;

    // Convert "NONE" back to empty string for typeOfMovement
    const submitData = {
      ...restData,
      typeOfMovement: restData.typeOfMovement === 'NONE' ? '' : restData.typeOfMovement,
    };

    const postData = {
      tenant:tenantCode,
      action: "delete",
      id: selectedId,
      collectionName: "suspectedPunches",
      data: {
        _id: selectedId,
        ...submitData,
      },
    };
    deletePunchData(postData)

    const checkData = {
      tenant: tenantCode,
      action: "insert",
      id: null,
      collectionName: "data_check",
      data: {
        ...submitData,
        isDeleted:attendanceResponse[0].isDeleted,
        tenantCode:attendanceResponse[0].tenantCode,
        organizationCode:attendanceResponse[0].organizationCode,
        readerSerialNumber:"MANUAL",
        state:"new",
        processed:false,
        uploadTime:attendanceResponse[0].uploadTime,
      },
    };

    dataCheck(checkData)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
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
      document.body.style.overflow = "hidden" // Prevent background scroll
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
        <Card className="w-full max-h-[80vh] flex flex-col overflow-hidden">
          <CardHeader className="px-6 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-gray-700">
                Suspected Punch Data - {(mode?.mode || 'add').toString().toUpperCase()}
              </CardTitle>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
                aria-label="Close popup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardHeader>

          {/* Form Content */}
          <CardContent className="flex-1 px-6 py-4 space-y-5 overflow-y-auto">
            <form id="punch-data-form" onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Employee ID <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Input
                      type="text"
                      {...register('employeeID')}
                      className={errors.employeeID ? fieldErrorStyles : fieldStyles}
                      disabled={true}
                      placeholder="EMP001"
                    />
                    <ErrorMessage error={errors.employeeID?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      State <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Controller
                      name="state"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={isViewMode}>
                          <SelectTrigger className={errors.state ? fieldErrorStyles : fieldStyles}>
                            <SelectValue placeholder="Select State" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="processed">Processed</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <ErrorMessage error={errors.state?.message} />
                  </div>
                </div>
              </div>

              {/* Time Information */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Punched Time <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      {...register('punchedTime')}
                      className={errors.punchedTime ? fieldErrorStyles : fieldStyles}
                      disabled={true}
                    />
                    <ErrorMessage error={errors.punchedTime?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Transaction Time <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Input
                      type="datetime-local"
                      {...register('transactionTime')}
                      className={errors.transactionTime ? fieldErrorStyles : fieldStyles}
                      disabled={isViewMode}
                    />
                    <ErrorMessage error={errors.transactionTime?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Upload Time <span className="text-red-500 normal-case">*</span>
                      {!uploadTimeValue && (
                        <span className="ml-2 text-[11px] font-normal text-gray-500 italic">
                          None
                        </span>
                      )}
                    </Label>
                    <Input
                      type="datetime-local"
                      {...register('uploadTime')}
                      className={errors.uploadTime ? fieldErrorStyles : fieldStyles}
                      disabled={true}
                    />
                    <ErrorMessage error={errors.uploadTime?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Attendance Date <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Input
                      type="date"
                      {...register('attendanceDate')}
                      className={errors.attendanceDate ? fieldErrorStyles : fieldStyles}
                      disabled={isViewMode}
                    />
                    <ErrorMessage error={errors.attendanceDate?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Date <span className="text-red-500 normal-case">*</span>
                      {!dateValue && (
                        <span className="ml-2 text-[11px] font-normal text-gray-500 italic">
                          None
                        </span>
                      )}
                    </Label>
                    <Input
                      type="datetime-local"
                      {...register('date')}
                      className={errors.date ? fieldErrorStyles : fieldStyles}
                      disabled={true}
                    />
                    <ErrorMessage error={errors.date?.message} />
                  </div>
                </div>
              </div>

              {/* Punch Details */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      In/Out Status <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <Controller
                      name="inOut"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={isViewMode}>
                          <SelectTrigger className={errors.inOut ? fieldErrorStyles : fieldStyles}>
                            <SelectValue placeholder="Select In/Out" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="I">IN</SelectItem>
                            <SelectItem value="O">OUT</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <ErrorMessage error={errors.inOut?.message} />
                  </div>

                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Type of Movement <span className="text-red-500 normal-case">*</span>
                      {!typeOfMovementValue && (
                        <span className="ml-2 text-[11px] font-normal text-gray-500 italic">
                          None
                        </span>
                      )}
                    </Label>
                    <Controller
                      name="typeOfMovement"
                      control={control}
                      render={({ field }) => (
                        <Select 
                          value={field.value || 'NONE'} 
                          onValueChange={(value) => field.onChange(value === 'NONE' ? '' : value)} 
                          disabled={isViewMode}
                        >
                          <SelectTrigger className={errors.typeOfMovement ? fieldErrorStyles : fieldStyles}>
                            <SelectValue placeholder="Select Movement Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">None</SelectItem>
                            <SelectItem value="P">P</SelectItem>
                            <SelectItem value="O">O</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <ErrorMessage error={errors.typeOfMovement?.message} />
                  </div>
                </div>
              </div>

              {/* Status and Settings */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                      Processed <span className="text-red-500 normal-case">*</span>
                    </Label>
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...register('processed')}
                          className={switchStyles}
                          disabled={isViewMode}
                        />
                        <span className="text-sm text-gray-700">Mark as processed</span>
                      </label>
                    </div>
                    <ErrorMessage error={errors.processed?.message} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                    Failure Description <span className="text-red-500 normal-case">*</span>
                  </Label>
                  <input type="hidden" {...register('failureDescription')} />
                  <div className="w-full text-sm text-gray-700 py-1">
                    {failureDescriptionValue || (
                      <span className="text-gray-400 italic">No failure description available</span>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </CardContent>

          {/* Footer */}
          <CardFooter className="px-6 py-3 border-t border-gray-200 justify-end">
            <ActionButtons
              layout="end"
              secondaryLabel="Cancel"
              onSecondary={onClose}
              primaryLabel={canApproveSuspected ? (mode?.mode === 'edit' ? 'Update Data' : 'Save Data') : undefined}
              onPrimary={() => {
                const form = document.getElementById('punch-data-form') as HTMLFormElement
                if (form) {
                  form.requestSubmit()
                }
              }}
              primaryLoading={postLoading || dataCheckLoading}
              className="w-full"
              primaryClassName="bg-blue-600 hover:bg-blue-700 text-white"
              secondaryClassName="bg-gray-200 hover:bg-gray-300 text-gray-800"
              primaryDisabled={isViewMode}
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}