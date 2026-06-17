"use client"

import React, { useEffect, useState } from 'react'
import { Settings, X, CheckCircle2, AlertCircle, Search } from 'lucide-react'
import EnhancedHeader from '@/components/common/enhanced-header'
import Table from '@repo/ui/components/table-dynamic/data-table'
import { useRequest } from '@repo/ui/hooks/api/useGetRequest'
import { useSession } from 'next-auth/react'
import { usePostRequest } from '@repo/ui/hooks/api/usePostRequest'
import { useForm } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select'
import { Input } from '@repo/ui/components/ui/input'
import EmployeeCategorySettingPopup from './employee-category-setting-popup'
import { useGetTenantCode } from '@/hooks/api/search/useGetTenantCode'
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";

function EmployeeCategorySettingPage() {
	const [isFormOpen, setIsFormOpen] = React.useState(false)
	const [rows, setRows] = React.useState<any[]>([])
    const [mode, setMode] = React.useState<any>({mode:"add",id:null})
    const [readOnly, setReadOnly] = React.useState(false)
    const [showSuccess, setShowSuccess] = React.useState(false)
    const [formData, setFormData] = React.useState<Partial<EmployeeCategorySettingsForm> | null>(null)
    const { data: session } = useSession()
    // permissions handled centrally
    const [duplication, setDuplication] = useState<any>([]);
    const tenantCode = useGetTenantCode()

    

    // Centralized role-permissions
    const contractorEmployee = "employeeCategorySetting"
    const { responseData: rolePermissions } = useRolePermissions({
        serviceName: "setting",
        screenName: contractorEmployee,
    });
    const viewMode = rolePermissions?.view || false;
    const editMode = rolePermissions?.edit || false;
    const addMode = rolePermissions?.add || false;
    const deleteMode = rolePermissions?.delete || false;
    const formatDateTime = (value: any) => {
        if (!value) return ""
        const date = new Date(value)
        if (isNaN(date.getTime())) return String(value)
        return date.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      }

    

    // Optional: could redirect if no permissions; keeping UI consistent with other screens
	// Fetch list of settings
	const { refetch } = useRequest<any[]>({
		url: `map/employee_category_setting/search?tenantCode=${tenantCode}`,
		onSuccess: (resp) => {
			const list = resp || []
            const duplication = list.map((item: any) => ({
                employeeCategoryCode: item.employeeCategoryCode || item.employeeCategory || '',
            }))
            setDuplication(duplication)
			const flat = list.map((item: any) => ({
				_id: item._id,
				employeeCategory: item.employeeCategory || item.employeeCategoryCode || '',
                allowMobileApp: item.genericSettings?.allowMobileApp ?? false,
                includeHolidayInPresentDays: item.genericSettings?.includeHolidayInPresentDays ?? false,
                // allowAttendanceFromMobileApp: item.genericSettings?.allowAttendanceFromMobileApp ?? false,
                // autoMarkPresent: item.genericSettings?.autoMarkPresent ?? false,
                // earlyOutAllowedTime: item.shiftGraceSettings?.earlyOutAllowedTime ?? 0,
                // graceIn: item.shiftGraceSettings?.graceIn ?? 0,
                // graceOut: item.shiftGraceSettings?.graceOut ?? 0,
                outAheadMargin: item.shiftGraceSettings?.outAheadMargin ?? 0,
                createdOn: formatDateTime(item.createdOn),
                createdBy: item.createdBy || "",
			}))
			setRows(flat)
		},
		onError: () => {
			setRows([])
		},
	})

	useEffect(() => {
		refetch()
	}, [])

    

    React.useEffect(() => {
        // popup now fetches by id internally; keep effect for future but no-op
    }, [isFormOpen, mode?.mode, mode?.id])

	const functionalityList = {
        tabletype: {
            type: "data",
            classvalue: {
                container: "col-span-12 mb-2",
                tableheder: {
                    container: "bg-[#f8fafc]",
                },
                label: "text-gray-600",
                field: "p-1",
            },
        },
        columnfunctionality: {
            draggable: {
                status: true,
            },
            handleRenameColumn: {
                status: true,
            },
            slNumber: {
                status: true,
            },
            selectCheck: {
                status: false,
            },
            activeColumn: {
                status: true,
            },
        },
        textfunctionality: {
            expandedCells: {
                status: true,
            },
        },
        filterfunctionality: {
            handleSortAsc: {
                status: true,
            },
            handleSortDesc: {
                status: true,
            },
            search: {
                status: true,
            },
        },
        outsidetablefunctionality: {
            paginationControls: {
                status: true,
                start: "",
                end: "",
            },
            entriesPerPageSelector: {
                status: false,
            },
        },
        buttons: {
            save: {
                label: "Save",
                status: false,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: () => {},
            },
            submit: {
                label: "Submit",
                status: false,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: () =>{},
            },
            addnew: {
                label: "Add New",
                status: addMode,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: () => {
                    setIsFormOpen(true)
                    setMode({mode:"add",id:null})
                    },
            },
            cancel: {
                label: "Cancel",
                status: false,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",

                },
                function: () => {},
            },
            actionDelete: {
                label: "Delete",
                status: deleteMode,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: (item: any) => {
                    },
            },
            actionLink: {
                label: "link",
                status: viewMode,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: (item: any) => {  
                    setIsFormOpen(true)
                    setMode({mode:"view",id:item._id})
                },
            },
            
            actionEdit: {
                label: "Edit",
                status: editMode,
                classvalue: {
                    container: "col-span-12 mb-2",
                    label: "text-gray-600",
                    field: "p-1",
                },
                function: (data: any) => {
                    setIsFormOpen(true)
                    setMode({mode:"edit",id:data._id})
                },
            },
        },
    }

	const handleFormSubmit = async () => {
        setMode({mode:"add",id:null})
		setIsFormOpen(false)
		await refetch()
	}

    // Types
    type GenericSettings = {
        allowMobileApp: boolean
        includeHolidayInPresentDays: boolean
        allowAttendanceFromMobileApp: boolean
        autoMarkPresent: boolean
        includeLeaveInPresentDays: boolean
        allowEmail: boolean
        ceilingLimitApplicableForPFContribution: boolean
        allowEmailNotification: boolean
        temporaryEmployee: boolean
        allowManualSwipesFromWeb: boolean
        excludeWeekOffFromPayableDays: boolean
    }

    type ShiftGraceSettings = {
        earlyOutAllowedTime: number
        graceOut: number
        graceIn: number
        outAheadMargin: number
        inAheadMargin: number
        inAboveMargin: number
        lateInAllowedTime: number
        outAboveMargin: number
        lunchHourDeduction: boolean
    }

    type EmployeeCategorySettingsForm = {
        genericSettings: GenericSettings
        shiftGraceSettings: ShiftGraceSettings
        employeeCategory: string
    }

    const validationSchema: yup.ObjectSchema<EmployeeCategorySettingsForm> = yup.object({
        genericSettings: yup.object({
            allowMobileApp: yup.boolean().required(),
            includeHolidayInPresentDays: yup.boolean().required(),
            allowAttendanceFromMobileApp: yup.boolean().required(),
            autoMarkPresent: yup.boolean().required(),
            includeLeaveInPresentDays: yup.boolean().required(),
            allowEmail: yup.boolean().required(),
            ceilingLimitApplicableForPFContribution: yup.boolean().required(),
            allowEmailNotification: yup.boolean().required(),
            temporaryEmployee: yup.boolean().required(),
            allowManualSwipesFromWeb: yup.boolean().required(),
            excludeWeekOffFromPayableDays: yup.boolean().required(),
        }).required(),
        shiftGraceSettings: yup.object({
            earlyOutAllowedTime: yup.number().typeError('Must be a number').min(0).max(600).required('Required'),
            graceOut: yup.number().typeError('Must be a number').min(0).max(120).required('Required'),
            graceIn: yup.number().typeError('Must be a number').min(0).max(120).required('Required'),
            outAheadMargin: yup.number().typeError('Must be a number').min(0).max(600).required('Required'),
            inAheadMargin: yup.number().typeError('Must be a number').min(0).max(600).required('Required'),
            inAboveMargin: yup.number().typeError('Must be a number').min(0).max(600).required('Required'),
            lateInAllowedTime: yup.number().typeError('Must be a number').min(0).max(600).required('Required'),
            outAboveMargin: yup.number().typeError('Must be a number').min(0).max(600).required('Required'),
            lunchHourDeduction: yup.boolean().required(),
        }).required(),
        employeeCategory: yup
            .string()
            .required('Employee category is required'),
    }) as yup.ObjectSchema<EmployeeCategorySettingsForm>

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

	// Submission hook and handler
	const { post: postEmployeeCategorySetting, loading: postLoading } = usePostRequest<any>({
		url: 'employee_category_setting',
		onSuccess: async () => {
			setShowSuccess(true)
			setReadOnly(true)
			setTimeout(async () => {
				await handleFormSubmit()
			}, 300)
		},
		onError: (error) => {
			console.error('Error saving employee category settings:', error)
		},
	})

	const submitForm = (data: EmployeeCategorySettingsForm) => {
		try {
			const isEdit = mode?.mode === 'edit' && mode?.id
			const payload = {
				tenant: tenantCode,
				action: isEdit ? 'update' : 'insert',
				id: isEdit ? mode.id : null,
				collectionName: 'employee_category_setting',
				data: {
					organizationCode: tenantCode,
					tenantCode: tenantCode,
					...data,
					uploadedBy: session?.user?.name || 'user',
					createdOn: new Date().toISOString(),
				},
			}
			postEmployeeCategorySetting(payload)
		} catch {}
	}

	// Inline InnerForm
	function InnerForm({
		formData,
		readOnly,
		onSubmit,
	}: {
		formData?: Partial<EmployeeCategorySettingsForm> | null
		readOnly: boolean
		onSubmit: (data: EmployeeCategorySettingsForm) => void
	}) {
		const {
			register,
			handleSubmit,
			formState: { errors },
			reset,
			watch,
			setValue,
		} = useForm<EmployeeCategorySettingsForm>({
			resolver: yupResolver(validationSchema),
			defaultValues: {
				genericSettings: {
					allowMobileApp: formData?.genericSettings?.allowMobileApp ?? true,
					includeHolidayInPresentDays: formData?.genericSettings?.includeHolidayInPresentDays ?? true,
					allowAttendanceFromMobileApp: formData?.genericSettings?.allowAttendanceFromMobileApp ?? true,
					autoMarkPresent: formData?.genericSettings?.autoMarkPresent ?? true,
					includeLeaveInPresentDays: formData?.genericSettings?.includeLeaveInPresentDays ?? true,
					allowEmail: formData?.genericSettings?.allowEmail ?? true,
					ceilingLimitApplicableForPFContribution: formData?.genericSettings?.ceilingLimitApplicableForPFContribution ?? true,
					allowEmailNotification: formData?.genericSettings?.allowEmailNotification ?? true,
					temporaryEmployee: formData?.genericSettings?.temporaryEmployee ?? false,
					allowManualSwipesFromWeb: formData?.genericSettings?.allowManualSwipesFromWeb ?? true,
					excludeWeekOffFromPayableDays: formData?.genericSettings?.excludeWeekOffFromPayableDays ?? false,
				},
				shiftGraceSettings: {
					earlyOutAllowedTime: formData?.shiftGraceSettings?.earlyOutAllowedTime ?? 0,
					graceOut: formData?.shiftGraceSettings?.graceOut ?? 5,
					graceIn: formData?.shiftGraceSettings?.graceIn ?? 5,
					outAheadMargin: formData?.shiftGraceSettings?.outAheadMargin ?? 0,
					inAheadMargin: formData?.shiftGraceSettings?.inAheadMargin ?? 0,
					inAboveMargin: formData?.shiftGraceSettings?.inAboveMargin ?? 0,
					lateInAllowedTime: formData?.shiftGraceSettings?.lateInAllowedTime ?? 0,
					outAboveMargin: formData?.shiftGraceSettings?.outAboveMargin ?? 0,
					lunchHourDeduction: formData?.shiftGraceSettings?.lunchHourDeduction ?? true,
				},
				employeeCategory: formData?.employeeCategory || '',
			},
		})

		React.useEffect(() => {
			if (formData) {
				reset(formData as EmployeeCategorySettingsForm)
			}
		}, [formData, reset])

		// Load categories
		const { data: orgData } = useRequest<any[]>({ url: `map/organization/search?tenantCode=${tenantCode}` })
		const categories = Array.isArray(orgData) && orgData[0]?.employeeCategories ? orgData[0].employeeCategories : []
		const [categorySearch, setCategorySearch] = React.useState('')
		const selectedCategory = watch('employeeCategory')

		const submitHandler = (data: EmployeeCategorySettingsForm) => onSubmit(data)

		return (
			<form id="employee-category-form" onSubmit={handleSubmit(submitHandler)} className="space-y-6 p-6 max-w-5xl mx-auto">
				<div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-2">
					<label className="block text-sm font-semibold text-gray-700">Employee Category <span className="text-red-500">*</span></label>
					<Select value={selectedCategory} onValueChange={(val) => setValue('employeeCategory', val)} disabled={readOnly}>
						<SelectTrigger className={errors.employeeCategory ? fieldErrorStyles : fieldStyles}>
							<SelectValue placeholder="Search or select employee category" />
						</SelectTrigger>
						<SelectContent position="popper" className="z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg max-h-[300px]">
							<div className="p-2 border-b border-gray-200">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
									<Input placeholder="Search by code or name..." value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} className="pl-10 h-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" disabled={readOnly} />
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
								return <SelectItem key={code} value={code} disabled={readOnly}>{code} - {name}</SelectItem>
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
					<ErrorMessage error={errors.employeeCategory?.message} />
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
								<input type="checkbox" {...register(`genericSettings.${key}` as const)} className={switchStyles} disabled={readOnly} />
							</label>
						))}
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
									<input type="number" step="1" min={0} {...register(`shiftGraceSettings.${key}` as const)} className={errors.shiftGraceSettings?.[key] ? fieldErrorStyles : fieldStyles} disabled={readOnly} />
									<span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">min</span>
								</div>
								<ErrorMessage error={errors.shiftGraceSettings?.[key]?.message as string | undefined} />
							</div>
						))}

						<label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-white hover:border-blue-300 transition">
							<span className="text-sm text-gray-700">Lunch Hour Deduction</span>
							<input type="checkbox" {...register('shiftGraceSettings.lunchHourDeduction')} className={switchStyles} disabled={readOnly} />
						</label>
					</div>
				</div>

				<button id="employee-category-reset" type="button" onClick={() => reset()} className="hidden">Reset</button>
			</form>
		)
	}


	return (
		<div className=" px-12 py-6">
			<EnhancedHeader
				title={"Employee Category Settings"}
				description={"Configure category-wide attendance and grace rules"}
				IconComponent={Settings}
				recordCount={rows.length}
				organizationType={"Employee Category"}
				lastSync={2}
				uptime={99.9}
			/>

			{rows.length >= 0 && <Table functionalityList={functionalityList} data={[...rows].reverse()} />}

			{isFormOpen && (
				<EmployeeCategorySettingPopup
					isOpen={isFormOpen}
					onClose={async () => { setIsFormOpen(false); await refetch(); setMode({mode:'add', id:null}); }}
					mode={mode}
                    duplication={duplication}
				/>
			)}
		</div>
	)
}

export default EmployeeCategorySettingPage
