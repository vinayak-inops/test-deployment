"use client"

import React, { useEffect } from 'react'
import { X, Settings, CheckCircle2, AlertCircle, Search, ChevronDown, ChevronUp, MoreVertical } from 'lucide-react'
import { usePostRequest } from '@repo/ui/hooks/api/usePostRequest'
import { useSession } from 'next-auth/react'
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select'
import { Input } from '@repo/ui/components/ui/input'
import { Button } from '@repo/ui/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/components/ui/dropdown-menu'
import { SuccessPopup } from '@/components/success-popup'
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode'
import { EmployeeCategorySettingsForm } from '@/validation/employee-category-setting/employee-category-setting'
import { validationSchema } from '@/validation/employee-category-setting/employee-category-setting'

interface Props {
  isOpen: boolean
  onClose: () => void
  mode?: { mode: 'add' | 'edit' | 'view'; id?: string | null }
  duplication?: any[]
}



const fieldStyles =
  'w-full h-11 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition hover:border-blue-400'

const fieldErrorStyles =
  'w-full h-10 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:shadow-lg shadow-sm transition hover:border-red-400'

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

// removed InnerForm; form is inlined in default component

export default function EmployeeCategorySettingPopup({ isOpen, onClose, mode, duplication }: Props) {
  const { data: session } = useSession()
  const [showSuccess, setShowSuccess] = React.useState(false)
  const isViewMode = (mode?.mode || 'add') === 'view'
  const isEditMode = (mode?.mode || 'add') === 'edit'
  const [showPassword, setShowPassword] = React.useState(false)

  // State for managing view mode
  const [showAllNotificationSettings, setShowAllNotificationSettings] = React.useState(false)

  const { post: postEmployeeCategorySetting, loading: postLoading } = usePostRequest<any>({
    url: 'employee_category_setting',
    onSuccess: (resp) => {
      setShowSuccess(true)
      // Auto-close success popup and the form popup after a short delay
      setTimeout(() => {
        setShowSuccess(false)
        onClose()
      }, 1500)
      // Don't auto-close, let user see the success message and close manually
      // or wait for backend confirmation
    },
    onError: (error) => {
      console.error('Error saving employee category settings:', error)
      // Show error message to user
      alert('Error saving settings. Please try again.')
    },
  })
  const tenantCode = useGetTenantCode()

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Prepare fetcher for edit/view to hydrate form
  const { refetch: refetchById } = useRequest<any[]>({
    url: `map/employee_category_setting/search?_id=${mode?.id ?? ''}`,
    onSuccess: (resp) => {
      const item: any = Array.isArray(resp) ? resp[0] : resp
      if (!item) return

      const payload: EmployeeCategorySettingsForm = {
        employeeCategoryCode: String(item.employeeCategory || item.employeeCategoryCode || ''),
        genericSettings: {
          allowMobileApp: !!item.genericSettings?.allowMobileApp,
          includeHolidayInPresentDays: !!item.genericSettings?.includeHolidayInPresentDays,
          allowAttendanceFromMobileApp: !!item.genericSettings?.allowAttendanceFromMobileApp,
          autoMarkPresent: !!item.genericSettings?.autoMarkPresent,
          includeLeaveInPresentDays: !!item.genericSettings?.includeLeaveInPresentDays,
          allowEmail: !!item.genericSettings?.allowEmail,
          ceilingLimitApplicableForPFContribution: !!item.genericSettings?.ceilingLimitApplicableForPFContribution,
          allowEmailNotification: !!item.genericSettings?.allowEmailNotification,
          temporaryEmployee: !!item.genericSettings?.temporaryEmployee,
          allowManualSwipesFromWeb: !!item.genericSettings?.allowManualSwipesFromWeb,
          excludeWeekOffFromPayableDays: !!item.genericSettings?.excludeWeekOffFromPayableDays,
        },
        shiftGraceSettings: {
          earlyOutAllowedTime: Number(item.shiftGraceSettings?.earlyOutAllowedTime ?? 0),
          graceOut: Number(item.shiftGraceSettings?.graceOut ?? 0),
          graceIn: Number(item.shiftGraceSettings?.graceIn ?? 0),
          outAheadMargin: Number(item.shiftGraceSettings?.outAheadMargin ?? 0),
          inAheadMargin: Number(item.shiftGraceSettings?.inAheadMargin ?? 0),
          inAboveMargin: Number(item.shiftGraceSettings?.inAboveMargin ?? 0),
          lateInAllowedTime: Number(item.shiftGraceSettings?.lateInAllowedTime ?? 0),
          outAboveMargin: Number(item.shiftGraceSettings?.outAboveMargin ?? 0),
          lunchHourDeduction: !!item.shiftGraceSettings?.lunchHourDeduction,
        },
        // Ensure default week offs hydrate in edit/view mode
        defaultWeekOffs: (Array.isArray(item.defaultWeekOffs) ? item.defaultWeekOffs : []).map((w: any) => ({
          week: Number(w?.week ?? 0),
          weekOff: Array.isArray(w?.weekOff) ? w.weekOff.map((d: any) => Number(d)).filter((n: number) => !Number.isNaN(n)) : [],
        })),
        notificationSettings: (Array.isArray(item.notificationSettings) ? item.notificationSettings : []).map((n: any) => ({
          propertyName: n?.propertyName || "",
          notifyPriorDays: Number(n?.notifyPriorDays ?? 0),
          isActive: !!n?.isActive,
          mailGroup: n?.mailGroup || "",
          autoBlockEnabled: !!n?.autoBlockEnabled,
          notifyEnabled: !!n?.notifyEnabled,
        })),
        levelOfApprovals: {
          leaveApprovalLevel: Number(item.levelOfApprovals?.leaveApprovalLevel ?? 0),
          punchApprovalLevel: Number(item.levelOfApprovals?.punchApprovalLevel ?? 0),
          outDutyApprovalLevel: Number(item.levelOfApprovals?.outDutyApprovalLevel ?? 0),
          shiftApprovalLevel: Number(item.levelOfApprovals?.shiftApprovalLevel ?? 0),
        },
        sourceEmailAddess: item?.sourceEmailAddess || '',
        sourceEmailPassward: item?.sourceEmailPassward || '',
        createdOn: item?.createdOn || '',
        createdBy: item?.createdBy || '',
      }


      // force full sync to avoid partial stale fields
      reset(payload, { keepDefaultValues: false })

      // Ensure the form state is properly synchronized
      setTimeout(() => {
      }, 100)
    },
  })

  React.useEffect(() => {
    if (!isOpen) return


    if ((mode?.mode === 'edit' || mode?.mode === 'view') && mode?.id) {
      refetchById()
      return
    }

    // clear for add mode
    reset({
      employeeCategoryCode: '',
      genericSettings: {
        allowMobileApp: false,
        includeHolidayInPresentDays: false,
        allowAttendanceFromMobileApp: false,
        autoMarkPresent: false,
        includeLeaveInPresentDays: false,
        allowEmail: false,
        ceilingLimitApplicableForPFContribution: false,
        allowEmailNotification: false,
        temporaryEmployee: false,
        allowManualSwipesFromWeb: false,
        excludeWeekOffFromPayableDays: false,
      },
      shiftGraceSettings: {
        earlyOutAllowedTime: 0,
        graceOut: 0,
        graceIn: 0,
        outAheadMargin: 0,
        inAheadMargin: 0,
        inAboveMargin: 0,
        lateInAllowedTime: 0,
        outAboveMargin: 0,
        lunchHourDeduction: false,
      },
      notificationSettings: [
        {
          propertyName: "",
          notifyPriorDays: 0,
          isActive: false,
          mailGroup: "",
          autoBlockEnabled: false,
          notifyEnabled: false,
        }
      ],
      levelOfApprovals: {
        leaveApprovalLevel: 0,
        punchApprovalLevel: 0,
        outDutyApprovalLevel: 0,
        shiftApprovalLevel: 0,
      },
      sourceEmailAddess: '',
      sourceEmailPassward: '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode?.mode, mode?.id])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
    trigger,
    setError,
    clearErrors,
  } = useForm<EmployeeCategorySettingsForm>({
    resolver: yupResolver(validationSchema),
  })

  // Add mode starts empty; edit/view are hydrated from backend in refetch above

  // Load categories
  const { data: orgData, refetch: refetchOrgData } = useRequest<any[]>({ url: `map/organization/search?tenantCode=${tenantCode}` })
  const categories = Array.isArray(orgData) && orgData[0]?.employeeCategories ? orgData[0].employeeCategories : []
  const [categorySearch, setCategorySearch] = React.useState('')
  const selectedCategory = String(watch('employeeCategoryCode') || '')
  // Mail group options from organization data (supports multiple possible keys)
  const mailGroupOptions = React.useMemo(() => {
    const root = Array.isArray(orgData) ? orgData[0] : undefined
    const raw = root?.mailGroups || root?.mailGroup || root?.mailgroups || []
    if (!Array.isArray(raw)) return []
    return raw.map((mg: any) => ({
      label: (mg?.name || mg?.mailGroupName || mg?.label || mg) as string,
      value: (mg?.code || mg?.mailGroupCode || mg?.value || mg) as string,
    })).filter((o: any) => o.value)
  }, [orgData])
  const [mailGroupSearch, setMailGroupSearch] = React.useState('')

  useEffect(() => {
    refetchOrgData();
  }, []);
  // Debug log for selectedCategory
  React.useEffect(() => {
  }, [selectedCategory])

  // Live duplicate enforcement: mark error as soon as a duplicate is selected
  React.useEffect(() => {
    const isAdd = (mode?.mode || 'add') !== 'edit'
    if (!isAdd) return
    if (!duplication || !Array.isArray(duplication)) return
    const isDup = duplication.some((rec: any) => String(rec?.employeeCategoryCode || rec?.employeeCategory || '') === String(selectedCategory))
    if (isDup) {
      setError('employeeCategoryCode' as any, { type: 'manual', message: 'This employee category already has settings' })
    } else {
      clearErrors('employeeCategoryCode' as any)
    }
  }, [selectedCategory, duplication, mode?.mode, setError, clearErrors])

  // Watch for form changes and update selectedCategory
  const watchedEmployeeCategory = watch('employeeCategoryCode')
  React.useEffect(() => {
    if (watchedEmployeeCategory !== selectedCategory) {
    }
  }, [watchedEmployeeCategory, selectedCategory])

  const handleSubmitForm = (data: EmployeeCategorySettingsForm) => {
    // Block duplicates on submit in add mode
    if ((mode?.mode || 'add') !== 'edit' && duplication && Array.isArray(duplication)) {
      const isDup = duplication.some((rec: any) => String(rec?.employeeCategoryCode || rec?.employeeCategory || '') === String(data.employeeCategoryCode))
      if (isDup) {
        setError('employeeCategoryCode' as any, { type: 'manual', message: 'This employee category already has settings' })
        return
      }
    }
    let post
    if (mode?.mode === 'edit') {
      post = {
        ...data,
        _id: mode?.id,
        organizationCode: tenantCode,
        tenantCode: tenantCode,
        uploadedBy: session?.user?.name || '',
        updatedOn: new Date().toISOString(),
      }
    } else {
      post = {
        organizationCode: tenantCode,
        tenantCode: tenantCode,
        ...data,
        createdBy: session?.user?.name || '',
        createdOn: new Date().toISOString(),
      }
    }
    try {
      const json = {
        tenant: tenantCode,
        action: (mode?.mode === 'edit' && mode?.id) ? 'insert' : 'insert',
        id: (mode?.mode === 'edit' && mode?.id) ? mode.id : null,
        collectionName: 'employee_category_setting',
        data: post,
      }
      postEmployeeCategorySetting(json)
    } catch { }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-11 w-11 md:h-12 md:w-12 rounded-xl bg-white grid place-items-center shadow">
                  <Settings className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
                </div>
                <span className="absolute -top-1 -left-1 h-3 w-3 rounded-full bg-green-400 ring-2 ring-blue-600" />
              </div>
              <div className="leading-snug">
                <h2 className="text-white text-lg md:text-xl font-semibold">Employee Category Settings</h2>
                <p className="text-blue-100 text-xs md:text-sm">Mode: {(mode?.mode || 'add').toString().toUpperCase()}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-amber-300 hover:text-white rounded-full p-1.5 transition-colors" aria-label="Close popup">
              <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>
        </div>

        {showSuccess && (
          <div className="px-5 md:px-6 py-3 bg-green-50 text-green-700 flex items-center justify-between border-b border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">Saved successfully</span>
            </div>
          </div>
        )}

        <form id="employee-category-form" onSubmit={handleSubmit(handleSubmitForm)} className="flex-1 overflow-y-auto space-y-6 p-6 max-w-5xl mx-auto w-full">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Employee Category <span className="text-red-500">*</span></label>
            <Select key={`employeeCategory-${mode?.mode}-${mode?.id || 'new'}-${selectedCategory}`} value={selectedCategory} onValueChange={(val) => {
              setValue('employeeCategoryCode', val)

              // Trigger form validation and update
              trigger('employeeCategoryCode')

              // Duplicate validation on change (only in add mode)
              if ((mode?.mode || 'add') !== 'edit' && duplication && Array.isArray(duplication)) {
                const isDup = duplication.some((rec: any) => String(rec?.employeeCategoryCode || rec?.employeeCategory || '') === String(val))
                if (isDup) {
                  setError('employeeCategoryCode' as any, { type: 'manual', message: 'This employee category already has settings' })
                } else {
                  clearErrors('employeeCategoryCode' as any)
                }
              }

              // Update the form data immediately
              const updatedData = {
                ...watch(),
                employeeCategoryCode: val
              }
            }} disabled={isViewMode || isEditMode}>
              <SelectTrigger className={errors.employeeCategoryCode ? fieldErrorStyles : fieldStyles}>
                <SelectValue placeholder="Search or select employee category" />
              </SelectTrigger>
              <SelectContent position="popper" className="z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px]">
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search by code or name..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} className="pl-10 h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" disabled={isViewMode} />
                  </div>
                </div>
                {(categories && categories.length > 0 ? categories.filter((c: any) => {
                  if (!categorySearch) return true
                  const code = (c.code || c.employeeCategoryCode || '').toString().toLowerCase()
                  const name = (c.name || c.employeeCategoryName || c.employeeCategoryTitle || '').toString().toLowerCase()
                  const term = categorySearch.toLowerCase()
                  return code.includes(term) || name.includes(term)
                }) : []).map((c: any) => {
                  const code = c.code || c.employeeCategoryCode || ''
                  const name = c.name || c.employeeCategoryName || c.employeeCategoryTitle || 'Unknown'
                  const isAdd = (mode?.mode || 'add') !== 'edit'
                  const isDup = isAdd && duplication && Array.isArray(duplication) && duplication.some((rec: any) => String(rec?.employeeCategoryCode || rec?.employeeCategory || '') === String(code))
                  const disableOption = isDup && String(code) !== String(selectedCategory)
                  return <SelectItem key={String(code)} value={String(code)} disabled={disableOption}>{String(code)} - {name}{disableOption ? ' (already configured)' : ''}</SelectItem>
                })}
                {categories && categorySearch && categories.filter((c: any) => {
                  const code = (c.code || c.employeeCategoryCode || '').toString().toLowerCase()
                  const name = (c.name || c.employeeCategoryName || c.employeeCategoryTitle || '').toString().toLowerCase()
                  const term = categorySearch.toLowerCase()
                  return code.includes(term) || name.includes(term)
                }).length === 0 && (
                    <SelectItem value="no-results" disabled>No results for "{categorySearch}"</SelectItem>
                  )}
              </SelectContent>
            </Select>
            <ErrorMessage error={errors.employeeCategoryCode?.message} />
            {(() => {
              const val = selectedCategory
              const isAdd = (mode?.mode || 'add') !== 'edit'
              const isDup = isAdd && duplication && Array.isArray(duplication) && duplication.some((rec: any) => String(rec?.employeeCategoryCode || rec?.employeeCategory || '') === String(val))
              return isDup ? (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  Employee category already configured
                </div>
              ) : null
            })()}
          </div>

          {/* Email Settings */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
            <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
              Email Settings
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Source Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  {...register('sourceEmailAddess')}
                  className={errors.sourceEmailAddess ? fieldErrorStyles : fieldStyles}
                  placeholder="name@example.com"
                  disabled={isViewMode}
                />
                <ErrorMessage error={errors.sourceEmailAddess?.message} />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Source Email Password <span className="text-red-500">*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('sourceEmailPassward')}
                    className={errors.sourceEmailPassward ? fieldErrorStyles : fieldStyles}
                    placeholder="Enter email password"
                    disabled={isViewMode}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-600 hover:text-gray-900"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isViewMode}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <ErrorMessage error={errors.sourceEmailPassward?.message} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
            <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
              Generic Settings
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {([
                ['allowMobileApp', 'Allow Mobile App'],
                ['includeHolidayInPresentDays', 'Include Holiday In Present Days'],
                ['allowAttendanceFromMobileApp', 'Allow Attendance From Mobile App'],
                ['autoMarkPresent', 'Auto Mark Present'],
                ['includeLeaveInPresentDays', 'Include Leave In Present Days'],
                ['allowEmail', 'Allow Email'],
                ['ceilingLimitApplicableForPFContribution', 'PF Contribution Ceiling Limit Applicable'],
                ['allowEmailNotification', 'Allow Email Notification'],
                ['temporaryEmployee', 'Temporary Employee'],
                ['allowManualSwipesFromWeb', 'Allow Manual Swipes From Web'],
                ['excludeWeekOffFromPayableDays', 'Exclude Week Off From Payable Days'],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300 transition">
                  <span className="text-sm text-gray-700">{label}</span>
                  <input type="checkbox" {...register(`genericSettings.${key}` as const)} className={switchStyles} disabled={isViewMode} />
                </label>
              ))}
            </div>
          </div>

          {/* Default Week Offs */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                Default Week Offs
              </div>
              {!isViewMode && (
                <Button
                  type="button"
                  onClick={() => {
                    const list = watch('defaultWeekOffs') || []
                    const usedWeeks = list.map(w => w.week).filter(n => !isNaN(n))
                    const availableWeeks = [1, 2, 3, 4, 5].filter(w => !usedWeeks.includes(w))
                    
                    if (availableWeeks.length === 0) {
                      alert('All week numbers (1-5) are already used')
                      return
                    }
                    
                    const nextWeek = availableWeeks[0]
                    const newRow = { week: nextWeek, weekOff: [] as number[] }
                    setValue('defaultWeekOffs', [...list, newRow], { shouldValidate: true })
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  + Add Week
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {(watch('defaultWeekOffs') || []).map((row, idx) => {
                const list = watch('defaultWeekOffs') || []
                const current = list[idx] || { week: 1, weekOff: [] as number[] }
                const weekError = (errors as any)?.defaultWeekOffs?.[idx]?.week?.message as string | undefined
                const weekOffError = (errors as any)?.defaultWeekOffs?.[idx]?.weekOff?.message as string | undefined
                const days = [1,2,3,4,5,6,7]
                return (
                  <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Week (1-5)</label>
                        <input
                          type="number"
                          min={1}
                          max={5}
                          value={current.week ?? ''}
                          onChange={(e) => setValue(`defaultWeekOffs.${idx}.week` as const, Number(e.target.value), { shouldValidate: true })}
                          className="w-full h-11 rounded-xl border border-gray-200 px-3"
                          disabled={isViewMode}
                        />
                        <ErrorMessage error={weekError} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Week Off Days (1=Mon ... 7=Sun)</label>
                        <div className="flex flex-wrap gap-2">
                          {days.map((d) => {
                            const checked = Array.isArray(current.weekOff) && current.weekOff.includes(d)
                            return (
                              <label key={d} className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 bg-white">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const set = new Set<number>(current.weekOff || [])
                                    if (e.target.checked) set.add(d); else set.delete(d)
                                    setValue(`defaultWeekOffs.${idx}.weekOff` as const, Array.from(set).sort((a,b)=>a-b), { shouldValidate: true })
                                  }}
                                  disabled={isViewMode}
                                  className="h-4 w-4 accent-blue-600"
                                />
                                <span className="text-sm text-gray-700">{d}</span>
                              </label>
                            )
                          })}
                        </div>
                        <ErrorMessage error={weekOffError} />
                      </div>
                    </div>
                    {!isViewMode && (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (watch('defaultWeekOffs') || []).filter((_, i) => i !== idx)
                            setValue('defaultWeekOffs', updated, { shouldValidate: true })
                          }}
                          className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
            <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
              Shift Grace Settings
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {([
                ['earlyOutAllowedTime', 'Early Out Allowed'],
                ['graceOut', 'Grace Out'],
                ['graceIn', 'Grace In'],
                ['outAheadMargin', 'Out Ahead Margin'],
                ['inAheadMargin', 'In Ahead Margin'],
                ['inAboveMargin', 'In Above Margin'],
                ['lateInAllowedTime', 'Late In Allowed'],
                ['outAboveMargin', 'Out Above Margin'],
              ] as const).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{label} <span className="text-gray-500 font-normal">(min)</span> <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="number" step="1" min={0} {...register(`shiftGraceSettings.${key}` as const)} className={errors.shiftGraceSettings?.[key] ? fieldErrorStyles : fieldStyles} disabled={isViewMode} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">min</span>
                  </div>
                  <ErrorMessage error={errors.shiftGraceSettings?.[key]?.message as string | undefined} />
                </div>
              ))}

              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300 transition">
                <span className="text-sm text-gray-700">Lunch Hour Deduction</span>
                <input type="checkbox" {...register('shiftGraceSettings.lunchHourDeduction')} className={switchStyles} disabled={isViewMode} />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
            <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
              Level of Approvals
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {([
                ['leaveApprovalLevel', 'Leave Approval Level'],
                ['punchApprovalLevel', 'Punch Approval Level'],
                ['outDutyApprovalLevel', 'Out Duty Approval Level'],
                ['shiftApprovalLevel', 'Shift Approval Level'],
              ] as const).map(([key, label]) => (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">{label}</label>
                  <input
                    type="number"
                    step="1"
                    min={0}
                    {...register(`levelOfApprovals.${key}` as const)}
                    className={errors.levelOfApprovals?.[key] ? fieldErrorStyles : fieldStyles}
                    disabled={isViewMode}
                  />
                  <ErrorMessage error={errors.levelOfApprovals?.[key]?.message as string | undefined} />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500"></span>
                Notification Settings ({(watch('notificationSettings')?.length || 0)})
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-2 py-2 h-10 rounded-xl border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white border border-gray-200 shadow-lg rounded-lg">
                    <DropdownMenuItem
                      onClick={() => setShowAllNotificationSettings(!showAllNotificationSettings)}
                      className="cursor-pointer hover:bg-gray-50 px-3 py-2 text-sm"
                    >
                      {showAllNotificationSettings ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-2 text-gray-600" />
                          View Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-2 text-gray-600" />
                          View All ({(watch('notificationSettings')?.length || 0)} settings)
                        </>
                      )}
                    </DropdownMenuItem>
                    {/* Future menu items can be added here */}
                  </DropdownMenuContent>
                </DropdownMenu>
                {!isViewMode && (
                  <>
                    <Button
                      type="button"
                      onClick={() => {
                        const currentSettings = watch('notificationSettings') || []
                        const newSetting = {
                          propertyName: "",
                          notifyPriorDays: 0,
                          isActive: false,
                          mailGroup: "",
                          autoBlockEnabled: false,
                          notifyEnabled: false,
                        }
                        setValue('notificationSettings', [...currentSettings, newSetting])
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                    >
                      + Add Notification Setting
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {[...(watch('notificationSettings') || [])].reverse().map((notification, originalIndex) => {
                const list = watch('notificationSettings') || []
                const actualIndex = (list.length || 0) - 1 - originalIndex

                // Show only the most recently added notification setting (first in reverse order) when showAllNotificationSettings is false
                if (!showAllNotificationSettings && originalIndex !== 0) {
                  return null
                }

                return (
                  <div key={actualIndex} className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-700">
                        {actualIndex === (list.length || 0) - 1 ? "Latest Notification Setting (last update)" : `Notification ${actualIndex + 1}`}
                      </h4>
                      {!isViewMode && (
                        <button
                          type="button"
                          onClick={() => {
                            const currentSettings = watch('notificationSettings') || []
                            const updatedSettings = currentSettings.filter((_, i) => i !== actualIndex)
                            if (updatedSettings.length === 0) {
                              // Ensure at least one notification setting remains
                              updatedSettings.push({
                                propertyName: "",
                                notifyPriorDays: 0,
                                isActive: false,
                                mailGroup: "",
                              })
                            }
                            setValue('notificationSettings', updatedSettings)
                          }}
                          className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-100 transition-colors"
                          disabled={watch('notificationSettings')?.length === 1}
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Property Name</label>
                        <input
                          type="text"
                          {...register(`notificationSettings.${actualIndex}.propertyName` as const)}
                          className={errors.notificationSettings?.[actualIndex]?.propertyName ? fieldErrorStyles : fieldStyles}
                          placeholder="e.g., LabourCard"
                          disabled={isViewMode}
                        />
                        <ErrorMessage error={errors.notificationSettings?.[actualIndex]?.propertyName?.message} />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Notify Prior Days</label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="365"
                          {...register(`notificationSettings.${actualIndex}.notifyPriorDays` as const)}
                          className={errors.notificationSettings?.[actualIndex]?.notifyPriorDays ? fieldErrorStyles : fieldStyles}
                          placeholder="10"
                          disabled={isViewMode}
                        />
                        <ErrorMessage error={errors.notificationSettings?.[actualIndex]?.notifyPriorDays?.message} />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:border-blue-300 transition">
                          <span className="text-sm text-gray-700">Active</span>
                          <input
                            type="checkbox"
                            {...register(`notificationSettings.${actualIndex}.isActive` as const)}
                            className={switchStyles}
                            disabled={isViewMode}
                          />
                        </label>
                        <ErrorMessage error={errors.notificationSettings?.[actualIndex]?.isActive?.message as string | undefined} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Mail Group</label>
                        <Select
                          value={watch(`notificationSettings.${actualIndex}.mailGroup`) || ""}
                          onValueChange={(val) => {
                            setValue(`notificationSettings.${actualIndex}.mailGroup`, val, { shouldValidate: true })
                          }}
                          disabled={isViewMode}
                        >
                          <SelectTrigger className={errors.notificationSettings?.[actualIndex]?.mailGroup ? fieldErrorStyles : fieldStyles}>
                            <SelectValue placeholder={mailGroupOptions.length ? "Search or select mail group" : "Enter mail group"} />
                          </SelectTrigger>
                          <SelectContent position="popper" className="z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px]">
                            <div className="p-2 border-b border-gray-200">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  placeholder="Search mail groups..."
                                  value={mailGroupSearch}
                                  onChange={(e) => setMailGroupSearch(e.target.value)}
                                  className="pl-10 h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                  disabled={isViewMode}
                                />
                              </div>
                              {errors.notificationSettings?.[actualIndex]?.mailGroup?.message && (
                                <div className="text-red-500 text-xs mt-1">
                                  {errors.notificationSettings?.[actualIndex]?.mailGroup?.message as string}
                                </div>
                              )}
                            </div>
                            {mailGroupOptions.length > 0 ? (
                              mailGroupOptions
                                .filter(o => {
                                  if (!mailGroupSearch) return true
                                  const s = mailGroupSearch.toLowerCase()
                                  return o.label?.toLowerCase?.().includes(s) || o.value?.toLowerCase?.().includes(s)
                                })
                                .map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label || o.value}
                                  </SelectItem>
                                ))
                            ) : (
                              <SelectItem value="no-data" disabled>No mail groups available</SelectItem>
                            )}
                            {mailGroupOptions.length > 0 && mailGroupSearch && mailGroupOptions.filter(o => {
                              const s = mailGroupSearch.toLowerCase()
                              return o.label?.toLowerCase?.().includes(s) || o.value?.toLowerCase?.().includes(s)
                            }).length === 0 && (
                                <SelectItem value="no-results" disabled>No results for "{mailGroupSearch}"</SelectItem>
                              )}
                          </SelectContent>
                        </Select>
                        <ErrorMessage error={errors.notificationSettings?.[actualIndex]?.mailGroup?.message} />
                        
                      </div>
                      {/* New toggles */}
                      <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:border-blue-300 transition">
                        <span className="text-sm text-gray-700">Auto Block Enabled</span>
                        <input
                          type="checkbox"
                          {...register(`notificationSettings.${actualIndex}.autoBlockEnabled` as const)}
                          className={switchStyles}
                          disabled={isViewMode}
                        />
                      </label>
                      <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:border-blue-300 transition">
                        <span className="text-sm text-gray-700">Notify Enabled</span>
                        <input
                          type="checkbox"
                          {...register(`notificationSettings.${actualIndex}.notifyEnabled` as const)}
                          className={switchStyles}
                          disabled={isViewMode}
                        />
                      </label>
                    </div>
                  </div>
                )
              })}


            </div>
          </div>

          {/* no hidden reset trigger; form is controlled */}
        </form>

        <div className="flex justify-between items-center px-5 md:px-6 py-4 border-t">
          <div className="text-xs text-gray-500">{postLoading ? 'Saving...' : ''}</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 h-10 rounded-md font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">Cancel</button>
            {!isViewMode && (
              <button
                type="submit"
                form="employee-category-form"
                disabled={postLoading}
                className="px-6 py-2 h-10 rounded-md font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Settings
              </button>
            )}
          </div>
        </div>
      </div>
      {/* Success Popup Modal */}
      <SuccessPopup
        isOpen={showSuccess}
        onClose={() => { setShowSuccess(false); onClose(); }}
        title="Settings Saved"
        message="Employee category settings have been saved successfully."
      />
    </div>
  )
}

