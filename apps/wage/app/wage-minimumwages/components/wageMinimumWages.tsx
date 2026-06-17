"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Button } from "@repo/ui/components/ui/button"
import { Badge } from "@repo/ui/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/ui/popover"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from "@repo/ui/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { SelectSearch } from "@repo/ui/components/ui/select-search"
import { Separator } from "@repo/ui/components/ui/separator"
import { toast } from "react-toastify"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useAuthToken } from "@repo/ui/hooks/auth/useAuthToken"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Trash2, Building2, Calendar, Users, DollarSign, MapPin, Briefcase, GraduationCap, Settings, ArrowLeft, X, Check, ChevronsUpDown } from "lucide-react"
import { useWageSalaryHeads } from "@/hooks/useWageSalaryHeads"
import { useGetTenantCode } from "@/hooks/api/serach/useGetTenantCode"
import { cn } from "@/lib/utils"

// Types matching provided JSON structure
type Location = { locationCode: string; locationName: string }
type SalaryHead = {
	salaryHeadCode: string
	salaryHeadName: string
	amount: number
}

type SkillLevel = {
	skilledLevelTitle: string
	skilledLevelDescription: string
}

type MinimumWageItem = {
	country?: string
	skillLevel: SkillLevel
	salaryHeads: SalaryHead[]
	state: string
	zone: string
	location: string[]
	effectiveFrom: string
	remark: string
}

type WageMinimumWagesForm = {
	_id?: { $oid: string }
	organizationCode: string
	tenantCode: string
	minimumWages: MinimumWageItem[]
}

const emptySalaryHead = (): SalaryHead => ({ salaryHeadCode: "", salaryHeadName: "", amount: 0 })
const emptySkillLevel = (): SkillLevel => ({ skilledLevelTitle: "", skilledLevelDescription: "" })
const emptyMWItem = (): MinimumWageItem => ({
	country: "",
	skillLevel: emptySkillLevel(),
	salaryHeads: [emptySalaryHead()],
	state: "",
	zone: "",
	location: [],
	effectiveFrom: "",
	remark: "",
})

const hasValue = (value: any) => value !== undefined && value !== null && value !== ""

const pickField = (record: any, nested: any, field: string) => {
	return hasValue(record?.[field]) ? record[field] : nested?.[field]
}

const pickAnyField = (record: any, nested: any, fields: string[]) => {
	for (const field of fields) {
		if (hasValue(record?.[field])) return record[field]
		if (hasValue(nested?.[field])) return nested[field]
	}
	return ""
}

const normalizeId = (value: any) => {
	if (!value) return ""
	if (typeof value === "string") return value
	if (typeof value === "object" && value.$oid) return String(value.$oid)
	return String(value)
}

const normalizeDateForInput = (value: any) => {
	if (!value) return ""
	const raw = String(value).trim()
	// Keep date exactly as stored, avoid timezone shifts from toISOString()
	if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
	if (raw.includes("T")) return raw.split("T")[0]
	const parsed = new Date(raw)
	if (Number.isNaN(parsed.getTime())) return ""
	const yyyy = parsed.getFullYear()
	const mm = `${parsed.getMonth() + 1}`.padStart(2, "0")
	const dd = `${parsed.getDate()}`.padStart(2, "0")
	return `${yyyy}-${mm}-${dd}`
}

const normalizeLocation = (value: any) => {
	if (Array.isArray(value)) {
		return value.map(v => String(v).trim()).filter(Boolean).join(",")
	}
	return String(value || "")
}

export default function WageMinimumWages({ scrollToIndex }: { scrollToIndex?: number }) {
	const router = useRouter()
	const searchParams = useSearchParams()
	const id = searchParams.get('id')
	const urlMode = searchParams.get('mode') || 'add'
	const currentMode = (urlMode as 'add' | 'edit' | 'view') || 'add'
	const [form, setForm] = useState<WageMinimumWagesForm>({
		organizationCode: "",
		tenantCode: "",
		minimumWages: [emptyMWItem()],
	})

	const { token, loading: tokenLoading, error: tokenError } = useAuthToken()
	const [countries, setCountries] = useState<Array<{ countryCode: string; countryName: string }>>([])
	const [loadingCountries, setLoadingCountries] = useState(false)
	const [countriesError, setCountriesError] = useState<string | null>(null)
	const [states, setStates] = useState<Array<{ stateCode: string; stateName: string }>>([])
	const [loadingStates, setLoadingStates] = useState(false)
	const [statesError, setStatesError] = useState<string | null>(null)
	const [locations, setLocations] = useState<Array<{ locationCode: string; locationName: string }>>([])
	const [loadingLocations, setLoadingLocations] = useState(false)
	const [locationsError, setLocationsError] = useState<string | null>(null)
	const [dropdownOpen, setDropdownOpen] = useState(false)
	const [searchValue, setSearchValue] = useState("")
	const [showFieldErrors, setShowFieldErrors] = useState(false)

	const [skillLevels, setSkillLevels] = useState<Array<{ skilledLevelTitle: string; skilledLevelDescription: string }>>([])
	const [loadingSkillLevels, setLoadingSkillLevels] = useState(false)
	const [skillLevelsError, setSkillLevelsError] = useState<string | null>(null)
	const tenantCode = useGetTenantCode()
	const submitContextRef = useRef<{ mode: "add" | "edit" | "view"; id: string | null }>({
		mode: "add",
		id: null,
	})

	// Wage Salary Heads for Salary Head Code dropdown
	const { salaryHeads: apiSalaryHeads, loading: salaryHeadsLoading, error: salaryHeadsError } = useWageSalaryHeads()

	const {
		post: postWageMinimumWages,
		loading: postLoading,
	} = usePostRequest<any>({
		url: "wageMinimumWages",
		onSuccess: async (data) => {
			const ctx = submitContextRef.current
			alert(`Minimum Wages ${ctx.mode === "edit" ? "updated" : "created"} successfully.`)
			setTimeout(() => { router.push("/wage-minimumwages") }, 1000)
		},
		onError: (error) => {
			alert(`Failed to ${currentMode === "edit" ? "update" : "save"} Minimum Wages.`)
			console.error("POST error:", error);
		},
	})

	// Fetch single record for edit/view
	const { data: mwData, loading: mwLoading, error: mwError, refetch: fetchMW } = useRequest<any>({
		url: 'wageMinimumWages/search',
		method: 'POST',
		data: [{ field: "_id", value: id, operator: "eq" }],
		onSuccess: (data) => {
			const rows = Array.isArray(data) ? data.filter((entry: any) => entry && entry.isDeleted !== true) : []
			const exactMatch = rows.find((entry: any) => normalizeId(entry?._id) === normalizeId(id))
			const r = exactMatch || rows[0] || null
			if (r) {
				const nestedItem = Array.isArray(r.minimumWages) && r.minimumWages.length > 0 ? r.minimumWages[0] : {}
				const skillLevel = pickField(r, nestedItem, "skillLevel") || {}
				const salaryHeadsRaw = pickField(r, nestedItem, "salaryHeads")
				setForm({
					_id: r._id ? (typeof r._id === 'string' ? { $oid: r._id } : r._id) : undefined,
					organizationCode: r.organizationCode || "",
					tenantCode: r.tenantCode || "",
					minimumWages: [{
						country: pickField(r, nestedItem, "country") || "",
						state: pickField(r, nestedItem, "state") || "",
						zone: pickField(r, nestedItem, "zone") || "",
						location: Array.isArray(pickField(r, nestedItem, "location")) ? pickField(r, nestedItem, "location") : normalizeLocation(pickField(r, nestedItem, "location")).split(",").map(v => v.trim()).filter(Boolean),
						effectiveFrom: normalizeDateForInput(pickField(r, nestedItem, "effectiveFrom")),
						remark: String(pickAnyField(r, nestedItem, ["remark", "remarks", "remarkText"]) || ""),
						skillLevel: {
							skilledLevelTitle: skillLevel?.skilledLevelTitle || "",
							skilledLevelDescription: skillLevel?.skilledLevelDescription || "",
						},
						salaryHeads: Array.isArray(salaryHeadsRaw) && salaryHeadsRaw.length > 0 ? [salaryHeadsRaw[0]].map((h: any) => ({
							salaryHeadCode: h?.salaryHeadCode || "",
							salaryHeadName: h?.salaryHeadName || "",
							amount: Number.isFinite(Number(h?.amount)) ? Number(h.amount) : 0,
						})) : [emptySalaryHead()],
					}]
				})
			}
		},
		onError: (error) => { console.error('Error fetching minimum wages data:', error) },
		dependencies: [id]
	})

	useEffect(() => {
		if (currentMode === 'view' || currentMode === 'edit') { fetchMW() }
	}, [currentMode, id])

	// Fetch countries for dropdown using GraphQL (same pattern as wageProfessionalTax)
	useEffect(() => {
		if (tokenLoading || !token) return
		if (!token || token.trim() === "") {
			setCountriesError("Invalid authentication token")
			return
		}

		setLoadingCountries(true)
		setCountriesError(null)

		const query = `
            query FetchOrganization {
                fetchOrganization(
                    criteriaRequests: [
                        { field: "organizationCode", operator: "is", value: "${tenantCode}" }
                        { field: "tenantCode", operator: "is", value: "${tenantCode}" }
                    ]
                    collection: "organization"
                ) {
                    country {
                        countryCode
                        countryName
                    }
                }
            }
        `;

		const headers = {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token.trim()}`,
			"Accept": "application/json",
		}

		fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`, {
			method: "POST",
			headers,
			mode: "cors",
			credentials: "include",
			body: JSON.stringify({ query })
		})
			.then(res => {
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status} - ${res.statusText}`)
				}
				return res.json()
			})
			.then(data => {
				if (data?.data?.fetchOrganization?.[0]?.country) {
					setCountries(data.data.fetchOrganization[0].country)
				} else {
					setCountriesError("No country data found")
				}
			})
			.catch(err => {
				setCountriesError(`Failed to fetch countries: ${err.message}`)
			})
			.finally(() => setLoadingCountries(false))
	}, [token, tokenLoading])

	// Fetch states for dropdown using GraphQL (same pattern as wageProfessionalTax)
	useEffect(() => {
		if (tokenLoading || !token) return
		if (!token || token.trim() === "") {
			setStatesError("Invalid authentication token")
			return
		}

		setLoadingStates(true)
		setStatesError(null)

		const query = `
			query FetchOrganization {
				fetchOrganization(
					criteriaRequests: [
						{ field: "organizationCode", operator: "is", value: "${tenantCode}" }
						{ field: "tenantCode", operator: "is", value: "${tenantCode}" }
					]
					collection: "organization"
				) {
					state {
						stateCode
						stateName
					}
				}
			}
		`;

		const headers = {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token.trim()}`,
			"Accept": "application/json",
		}

		fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`, {
			method: "POST",
			headers,
			mode: "cors",
			credentials: "include",
			body: JSON.stringify({ query })
		})
			.then(res => {
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status} - ${res.statusText}`)
				}
				return res.json()
			})
			.then(data => {
				if (data?.data?.fetchOrganization?.[0]?.state) {
					setStates(data.data.fetchOrganization[0].state)
				} else {
					setStatesError("No state data found")
				}
			})
			.catch(err => {
				setStatesError(`Failed to fetch states: ${err.message}`)
			})
			.finally(() => setLoadingStates(false))
	}, [token, tokenLoading])

	// Fetch locations for dropdown
	useEffect(() => {
		if (tokenLoading || !token) return
		if (!token || token.trim() === "") {
			setLocationsError("Invalid authentication token")
			return
		}

		setLoadingLocations(true)
		setLocationsError(null)

		const query = `
			query FetchOrganization {
				fetchOrganization(
					criteriaRequests: [
						{ field: "organizationCode", operator: "is", value: "${tenantCode}" }
						{ field: "tenantCode", operator: "is", value: "${tenantCode}" }
					]
					collection: "organization"
				) {
					location {
						locationCode
						locationName
					}
				}
			}
		`

		const headers = {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token.trim()}`,
			Accept: "application/json",
		}

		fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`, {
			method: "POST",
			headers,
			mode: "cors",
			credentials: "include",
			body: JSON.stringify({ query }),
		})
			.then(res => {
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status} - ${res.statusText}`)
				}
				return res.json()
			})
			.then(data => {
				if (data?.data?.fetchOrganization?.[0]?.location) {
					setLocations(data.data.fetchOrganization[0].location)
				} else {
					setLocationsError("No location data found")
				}
			})
			.catch(err => {
				setLocationsError(`Failed to fetch locations: ${err.message}`)
			})
			.finally(() => setLoadingLocations(false))
	}, [token, tokenLoading, tenantCode])

	// Fetch skill levels for dropdown using GraphQL
	useEffect(() => {
		if (tokenLoading || !token) return
		if (!token || token.trim() === "") {
			setSkillLevelsError("Invalid authentication token")
			return
		}

		setLoadingSkillLevels(true)
		setSkillLevelsError(null)

		const query = `
			query FetchOrganization {
				fetchOrganization(
					criteriaRequests: [
						{ field: "organizationCode", operator: "is", value: ${tenantCode} }
						{ field: "tenantCode", operator: "is", value: "${tenantCode}" }
					]
					collection: "organization"
				) {
					skillLevels {
						skilledLevelTitle
						skilledLevelDescription
					}
				}
			}
		`;

		const headers = {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token.trim()}`,
			"Accept": "application/json",
		}

		fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/graphql`, {
			method: "POST",
			headers,
			mode: "cors",
			credentials: "include",
			body: JSON.stringify({ query })
		})
			.then(res => {
				if (!res.ok) {
					throw new Error(`HTTP error! status: ${res.status} - ${res.statusText}`)
				}
				return res.json()
			})
			.then(data => {
				if (data?.data?.fetchOrganization?.[0]?.skillLevels) {
					setSkillLevels(data.data.fetchOrganization[0].skillLevels)
				} else {
					setSkillLevelsError("No skill levels data found")
				}
			})
			.catch(err => {
				setSkillLevelsError(`Failed to fetch skill levels: ${err.message}`)
			})
			.finally(() => setLoadingSkillLevels(false))
	}, [token, tokenLoading])

	// Auto-scroll similar to Professional Tax
	useEffect(() => {
		if (typeof scrollToIndex === "number") {
			const id = `mw-item-${scrollToIndex}`
			const t = setTimeout(() => {
				const el = document.getElementById(id)
				if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
			}, 50)
			return () => clearTimeout(t)
		}
	}, [scrollToIndex, form.minimumWages.length])

	const resetForm = () => setForm({ organizationCode: "", tenantCode: "", minimumWages: [emptyMWItem()] })

	const isViewMode = currentMode === 'view'
	const isEditMode = currentMode === 'edit'
	const isAddMode = currentMode === 'add'

	// Auto-populate organization and tenant codes from tenantCode hook (hidden in UI)
	useEffect(() => {
		if (!tenantCode || !isAddMode) return
		setForm(prev => ({
			...prev,
			organizationCode: tenantCode,
			tenantCode,
		}))
	}, [tenantCode, isAddMode])

	const updateRoot = (key: keyof WageMinimumWagesForm, value: any) => setForm(prev => ({ ...prev, [key]: value }))
	const updateMW = (index: number, updater: (p: MinimumWageItem) => MinimumWageItem) =>
		setForm(prev => ({ ...prev, minimumWages: prev.minimumWages.map((p, i) => (i === index ? updater(p) : p)) }))

	const buildItemFieldErrors = (mw: MinimumWageItem) => {
		const salaryHeadErrors = (mw.salaryHeads || []).map((sh: SalaryHead) => {
			const shErr: { salaryHeadCode?: string; salaryHeadName?: string; amount?: string } = {}
			if (!sh.salaryHeadCode?.trim()) shErr.salaryHeadCode = "Salary Head Code is required."
			if (!sh.salaryHeadName?.trim()) shErr.salaryHeadName = "Salary Head Name is required."
			if (!Number.isFinite(Number(sh.amount)) || Number(sh.amount) <= 0) shErr.amount = "Amount must be greater than 0."
			return shErr
		})

		return {
			country: !mw.country?.trim() ? "Country is required." : "",
			state: !mw.state?.trim() ? "State is required." : "",
			zone: !mw.zone?.trim() ? "Zone is required." : "",
			skillLevel: !mw.skillLevel?.skilledLevelTitle?.trim() ? "Skill Level is required." : "",
			location: mw.location.length === 0
				? "At least one Location Code is required."
				: "",
			effectiveFrom: !mw.effectiveFrom?.trim() ? "Effective From date is required." : "",
			salaryHeads: salaryHeadErrors,
			salaryHeadsGeneral: !mw.salaryHeads || mw.salaryHeads.length === 0 ? "At least one Salary Head is required." : "",
		}
	}

	const itemFieldErrors = useMemo(
		() => form.minimumWages.map(mw => buildItemFieldErrors(mw)),
		[form.minimumWages]
	)

	// Collect validation issues for required fields/dropdowns
	const collectValidationErrors = () => {
		const errors: string[] = []

		form.minimumWages.forEach((mw, index) => {
			if (!mw.country?.trim()) {
				errors.push(`Item ${index + 1}: Country is required.`)
			}
			if (!mw.state?.trim()) {
				errors.push(`Item ${index + 1}: State is required.`)
			}
			if (!mw.zone?.trim()) {
				errors.push(`Item ${index + 1}: Zone is required.`)
			}
			if (!mw.skillLevel?.skilledLevelTitle?.trim()) {
				errors.push(`Item ${index + 1}: Skill Level is required.`)
			}
			const selectedLocations = mw.location
			if (selectedLocations.length === 0) {
				errors.push(`Item ${index + 1}: At least one Location Code is required.`)
			}
			if (!mw.effectiveFrom?.trim()) {
				errors.push(`Item ${index + 1}: Effective From date is required.`)
			}

			// Ensure at least one salary head with basic fields
			if (!mw.salaryHeads || mw.salaryHeads.length === 0) {
				errors.push(`Item ${index + 1}: At least one Salary Head is required.`)
			} else {
				mw.salaryHeads.forEach((sh, shIdx) => {
					if (!sh.salaryHeadCode.trim()) {
						errors.push(`Item ${index + 1}, Salary Head ${shIdx + 1}: Salary Head Code is required.`)
					}
					if (!sh.salaryHeadName.trim()) {
						errors.push(`Item ${index + 1}, Salary Head ${shIdx + 1}: Salary Head Name is required.`)
					}
					if (!Number.isFinite(Number(sh.amount)) || Number(sh.amount) <= 0) {
						errors.push(`Item ${index + 1}, Salary Head ${shIdx + 1}: Amount must be greater than 0.`)
					}
				})
			}
		})

		return errors
	}

	// Form validation for submit/update click
	const validateForm = () => {
		const errors = collectValidationErrors()
		if (errors.length > 0) {
			setShowFieldErrors(true)
			toast.error(errors[0])
			return false
		}

		return true
	}

	const validationErrors = useMemo(() => collectValidationErrors(), [form])
	const isFormValid = validationErrors.length === 0

	// Handle save functionality
	const handleSave = async () => {
		if (!validateForm()) {
			return
		}
		setShowFieldErrors(false)

		// Get the ID string - prioritize form._id.$oid from loaded data, then URL id
		const recordId = currentMode === 'edit'
			? (form._id?.$oid || id || null)
			: (form._id?.$oid || null)

		// Get the first (and only) minimum wage item
		const mwItem = form.minimumWages[0]

		// Prepare data in flat format for backend consistency
		const baseData: any = {
			organizationCode: tenantCode,
			tenantCode: tenantCode,
			country: mwItem.country || "",
			state: mwItem.state || "",
			zone: mwItem.zone || "",
			location: mwItem.location,
			skillLevel: mwItem.skillLevel || emptySkillLevel(),
			salaryHeads: Array.isArray(mwItem.salaryHeads) && mwItem.salaryHeads.length > 0
				? [mwItem.salaryHeads[0]]
				: [emptySalaryHead()],
			effectiveFrom: mwItem.effectiveFrom || "",
			remark: mwItem.remark || "",
			minimumWages: [
				{
					country: mwItem.country || "",
					state: mwItem.state || "",
					zone: mwItem.zone || "",
					location: mwItem.location,
					skillLevel: mwItem.skillLevel || emptySkillLevel(),
					salaryHeads: Array.isArray(mwItem.salaryHeads) && mwItem.salaryHeads.length > 0
						? [mwItem.salaryHeads[0]]
						: [emptySalaryHead()],
					effectiveFrom: mwItem.effectiveFrom || "",
					remark: mwItem.remark || "",
				},
			],
		}

		// Add _id for edit mode if available (backend may need this)
		if (currentMode === 'edit' && recordId) {
			baseData._id = recordId
		}

		// Add timestamp
		if (currentMode === 'edit') {
			baseData.updatedOn = new Date().toISOString()
		} else {
			baseData.createdOn = new Date().toISOString()
		}

		const payload = {
			tenant: tenantCode,
			action: "insert",
			...(recordId ? { id: recordId } : {}),
			collectionName: "wageMinimumWages",
			data: baseData,
		}

		submitContextRef.current = {
			mode: currentMode,
			id: recordId ? String(recordId) : null,
		}

		postWageMinimumWages(payload)
	}

	// delete operation removed per requirements

	// Navigation handlers
	const handleBack = () => {
		router.push('/wage-minimumwages')
	}

	const handleCancel = () => {
		router.push('/wage-minimumwages')
	}

	// Dynamic title/description (matching Salary Heads style)
	const getPageTitle = () => {
		switch (currentMode) {
			case 'add':
				return 'Add New Minimum Wages'
			case 'edit':
				return 'Edit Minimum Wages'
			case 'view':
				return 'View Minimum Wages'
			default:
				return 'Minimum Wages Management'
		}
	}

	const getPageDescription = () => {
		switch (currentMode) {
			case 'add':
				return 'Add new minimum wages and calculation details'
			case 'edit':
				return 'Edit existing minimum wages and calculation details'
			case 'view':
				return 'View minimum wages details (read-only)'
			default:
				return 'Manage minimum wages and calculation details'
		}
	}

	// countries and states come from GraphQL

	const zones = ["Zone-1", "Zone-2", "Zone-3", "Zone-4"]
	const locationOptions = useMemo(
		() =>
			locations.map(loc => ({
				value: loc.locationCode,
				label: `${loc.locationName} (${loc.locationCode})`,
			})),
		[locations]
	)
	const filteredLocationOptions = useMemo(() => {
		const term = searchValue.trim().toLowerCase()
		if (!term) return locationOptions
		return locationOptions.filter(
			opt =>
				opt.value.toLowerCase().includes(term) ||
				opt.label.toLowerCase().includes(term)
		)
	}, [locationOptions, searchValue])

	return (
		<div className="space-y-6">
			{/* Breadcrumb */}
			<div className="flex items-center space-x-2 text-sm text-gray-500">
				<span>Wage Minimum Wages</span>
				<span>/</span>
				<span className="text-gray-900 font-medium">Minimum Wages Management</span>
			</div>

			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Button
						variant="ghost"
						size="sm"
						className="p-2 hover:bg-blue-50"
						onClick={handleBack}
					>
						<ArrowLeft className="w-4 h-4 text-blue-600" />
					</Button>
					<div>
						<h2 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h2>
						<p className="text-gray-600">{getPageDescription()}</p>
					</div>
				</div>
				<div className="flex items-center space-x-3">
					<Button
						variant="outline"
						className="border-gray-300 hover:bg-gray-50 bg-transparent"
						onClick={handleCancel}
					>
						Cancel
					</Button>
				</div>
			</div>

			<div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
						<CardHeader className="pb-8 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white">
							<div className="flex items-center gap-3">
								<div className="p-2 bg-white/20 rounded-lg">
									<Settings className="h-6 w-6" />
								</div>
								<div>
									<CardTitle className="text-2xl font-bold">Wage Minimum Wages</CardTitle>
									<p className="text-blue-100 mt-1">Configure country-wise, state-wise and zone-wise Minimum Wages</p>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-8 space-y-8">
							{/* Minimum Wages Section */}
							<div className="space-y-6">
								<div className="flex items-center gap-3 pb-2 border-b border-blue-200">
									<DollarSign className="h-5 w-5 text-blue-600" />
									<div>
										<h3 className="text-lg font-semibold text-gray-900">Minimum Wages Configuration</h3>
										<p className="text-sm text-gray-600">Define country, state, zone, skill level and salary heads</p>
									</div>
								</div>

								<div className="space-y-6">
									{form.minimumWages.map((mw, idx) => (
										<Card key={idx} id={`mw-item-${idx}`} className="border border-gray-200 shadow-sm">
											<CardContent className="p-6 space-y-6">
												{/** Per item validation reference */}
												{(() => {
													const fieldErrors = itemFieldErrors[idx]
													const hasCountryError = showFieldErrors && !!fieldErrors?.country
													const hasStateError = showFieldErrors && !!fieldErrors?.state
													const hasZoneError = showFieldErrors && !!fieldErrors?.zone
													const hasSkillError = showFieldErrors && !!fieldErrors?.skillLevel
													const hasLocationError = showFieldErrors && !!fieldErrors?.location
													const hasEffectiveFromError = showFieldErrors && !!fieldErrors?.effectiveFrom
													return (
														<>
															<div className="flex items-center gap-3 pb-3 border-b border-gray-200">
																<MapPin className="h-5 w-5 text-blue-600" />
																<h4 className="text-lg font-semibold text-gray-900">Minimum Wage Item </h4>
															</div>

															<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
																<div className="space-y-3">
																	<Label className="text-sm font-medium text-gray-700">Country</Label>
																	<Select value={mw.country || ""} onValueChange={v => updateMW(idx, s => ({ ...s, country: v }))} disabled={loadingCountries || !!countriesError || isViewMode}>
																		<SelectTrigger className={`h-11 rounded-lg ${hasCountryError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
																			<SelectValue placeholder={loadingCountries ? "Loading countries..." : countriesError ? "Error loading countries" : "Select country"} />
																		</SelectTrigger>
																		<SelectContent>
																			{countries.map((c, index) => (
																				<SelectItem key={index} value={c.countryName}>{c.countryName}</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																	{countriesError && (
																		<p className="text-xs text-red-500">{countriesError}</p>
																	)}
																	{showFieldErrors && !!fieldErrors?.country && (
																		<p className="text-xs text-red-500">{fieldErrors.country}</p>
																	)}
																</div>
																<div className="space-y-3">
																	<Label className="text-sm font-medium text-gray-700">State</Label>
																	<Select
																		value={mw.state}
																		onValueChange={v => updateMW(idx, s => ({ ...s, state: v }))}
																		disabled={loadingStates || !!statesError || isViewMode}
																	>
																		<SelectTrigger className={`h-11 rounded-lg ${hasStateError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
																			<SelectValue placeholder={loadingStates ? "Loading states..." : statesError ? "Error loading states" : "Select state"} />
																		</SelectTrigger>
																		<SelectContent>
																			{states.map((s, i) => (
																				<SelectItem key={`${s.stateCode}-${i}`} value={s.stateName}>{s.stateName}</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																	{statesError && (
																		<p className="text-xs text-red-500">{statesError}</p>
																	)}
																	{showFieldErrors && !!fieldErrors?.state && (
																		<p className="text-xs text-red-500">{fieldErrors.state}</p>
																	)}
																</div>
																<div className="space-y-3">
																	<Label className="text-sm font-medium text-gray-700">Zone</Label>
																	<Select value={mw.zone} onValueChange={v => updateMW(idx, s => ({ ...s, zone: v }))} disabled={isViewMode}>
																		<SelectTrigger className={`h-11 rounded-lg ${hasZoneError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
																			<SelectValue placeholder="Select zone" />
																		</SelectTrigger>
																		<SelectContent>
																			{zones.map(z => (
																				<SelectItem key={z} value={z}>{z}</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																	{showFieldErrors && !!fieldErrors?.zone && (
																		<p className="text-xs text-red-500">{fieldErrors.zone}</p>
																	)}
																</div>
																<div className="space-y-3">
																	<Label className="text-sm font-medium text-gray-700">Skill Level</Label>
																	<Select
																		value={mw.skillLevel.skilledLevelTitle}
																		onValueChange={v => {
																			const found = skillLevels.find(sl => sl.skilledLevelTitle === v)
																			updateMW(idx, s => ({
																				...s,
																				skillLevel: {
																					...s.skillLevel,
																					skilledLevelTitle: v,
																					skilledLevelDescription: found?.skilledLevelDescription || s.skillLevel.skilledLevelDescription,
																				},
																			}))
																		}}
																		disabled={loadingSkillLevels || !!skillLevelsError || isViewMode}
																	>
																		<SelectTrigger className={`h-11 rounded-lg ${hasSkillError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
																			<SelectValue placeholder={loadingSkillLevels ? "Loading skill levels..." : skillLevelsError ? "Error loading skill levels" : "Select skill level"} />
																		</SelectTrigger>
																		<SelectContent>
																			{skillLevels.map((sl, i) => (
																				<SelectItem key={`${sl.skilledLevelTitle}-${i}`} value={sl.skilledLevelTitle}>{sl.skilledLevelTitle}</SelectItem>
																			))}
																		</SelectContent>
																	</Select>
																	{skillLevelsError && (
																		<p className="text-xs text-red-500">{skillLevelsError}</p>
																	)}
																	{showFieldErrors && !!fieldErrors?.skillLevel && (
																		<p className="text-xs text-red-500">{fieldErrors.skillLevel}</p>
																	)}
																</div>
															</div>

															<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
																<div className="space-y-3">
																	<Label className="text-sm font-medium text-gray-700">Skill Description</Label>
																	<div className="text-sm rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-gray-600">
																		{mw.skillLevel.skilledLevelDescription || "No description available"}
																	</div>
																</div>
																<div className="space-y-3">
																	<Label className="text-sm font-medium text-gray-700">Effective From</Label>
																	<Input
																		type="date"
																		value={normalizeDateForInput(mw.effectiveFrom)}
																		onChange={e => updateMW(idx, s => ({ ...s, effectiveFrom: e.target.value }))}
																		disabled={isViewMode}
																		className={`h-11 rounded-lg ${hasEffectiveFromError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
																	/>
																	{showFieldErrors && !!fieldErrors?.effectiveFrom && (
																		<p className="text-xs text-red-500">{fieldErrors.effectiveFrom}</p>
																	)}
																</div>
															</div>
															{/* Location Section */}
															<div className="space-y-6">
																<div className="flex items-center gap-3 pb-2 border-b border-blue-200">
																	<MapPin className="h-5 w-5 text-blue-600" />
																	<div>
																		<h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
																		<p className="text-sm text-gray-600">Select location codes for this minimum wage</p>
																	</div>
																</div>

																<div className="space-y-3">
																	<Label className="text-sm font-medium text-gray-700">Location Codes</Label>
																	<Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
																		<PopoverTrigger asChild>
																			<Button
																				variant="outline"
																				role="combobox"
																				aria-expanded={dropdownOpen}
																				className={`h-11 w-full justify-between rounded-lg ${hasLocationError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
																				disabled={loadingLocations || !!locationsError || isViewMode}
																			>
																				{mw.location.length > 0 ? `${mw.location.length} selected` : (loadingLocations ? "Loading locations..." : locationsError ? "Error loading locations" : "Select location codes")}
																				<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
																			</Button>
																		</PopoverTrigger>
																		<PopoverContent className="w-full p-0">
																			<Command>
																				<CommandInput placeholder="Search locations..." value={searchValue} onValueChange={setSearchValue} />
																				<CommandEmpty>No locations found.</CommandEmpty>
																				<CommandGroup className="max-h-64 overflow-auto">
																					{filteredLocationOptions.map((opt) => {
																						const isSelected = mw.location.includes(opt.value)
																						return (
																							<CommandItem
																								key={opt.value}
																								value={opt.value}
																								onSelect={() => {
																									if (isViewMode) return
																									const newLocations = isSelected
																										? mw.location.filter(l => l !== opt.value)
																										: [...mw.location, opt.value]
																									updateMW(idx, s => ({ ...s, location: newLocations }))
																								}}
																							>
																								<Check
																									className={`mr-2 h-4 w-4 ${isSelected ? 'opacity-100' : 'opacity-0'}`}
																								/>
																								{opt.label}
																							</CommandItem>
																						)
																					})}
																				</CommandGroup>
																			</Command>
																		</PopoverContent>
																	</Popover>
																	{locationsError && (
																		<p className="text-xs text-red-500">{locationsError}</p>
																	)}
																	{showFieldErrors && !!fieldErrors?.location && (
																		<p className="text-xs text-red-500">{fieldErrors.location}</p>
																	)}
																	{mw.location.length > 0 && (
																		<div className="flex flex-wrap gap-2 mt-2">
																			{mw.location.map((locCode) => {
																				const loc = locations.find(l => l.locationCode === locCode)
																				return (
																					<Badge key={locCode} variant="secondary" className="text-xs">
																						{loc ? `${loc.locationName} (${locCode})` : locCode}
																					</Badge>
																				)
																			})}
																		</div>
																	)}
																</div>
															</div>

															<div className="space-y-3">
																<Label className="text-sm font-medium text-gray-700">Remark</Label>
																<Input
																	value={mw.remark}
																	onChange={e => updateMW(idx, s => ({ ...s, remark: e.target.value }))}
																	placeholder="Enter any additional remarks"
																	disabled={isViewMode}
																	className={`h-11 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
																/>
															</div>

															{/* Salary Heads Section */}
															<div className="space-y-4 rounded-lg border border-gray-200 p-4 bg-gray-50">
																<div className="flex items-center gap-3 pb-2 border-b border-gray-200">
																	<DollarSign className="h-5 w-5 text-blue-600" />
																	<div>
																		<h5 className="text-base font-semibold text-gray-900">Salary Heads</h5>
																		<p className="text-sm text-gray-600">Define salary heads and amounts</p>
																	</div>
																</div>
																<div className="space-y-4">
																	{showFieldErrors && !!fieldErrors?.salaryHeadsGeneral && (
																		<p className="text-xs text-red-500">{fieldErrors.salaryHeadsGeneral}</p>
																	)}
																	{(mw.salaryHeads || []).map((sh, shIdx) => (
																		<div key={shIdx} className="p-4 bg-white rounded-lg border border-gray-200">
																			<div className="flex items-center justify-between mb-4">
																				<h6 className="text-sm font-medium text-gray-700">Salary Head</h6>
																			</div>
																			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
																				<div className="space-y-2">
																					<Label className="text-sm font-medium text-gray-700">Code</Label>
																					<SelectSearch
																						options={apiSalaryHeads.map((shOpt: any) => ({ value: shOpt.code, label: shOpt.code }))}
																						value={sh.salaryHeadCode || ""}
																						onValueChange={(value) => {
																							if (isViewMode) return
																							const found = apiSalaryHeads.find((opt: any) => opt.code === value)
																							updateMW(idx, s => ({
																								...s,
																								salaryHeads: (s.salaryHeads || []).map((h, i) => i === shIdx ? { ...h, salaryHeadCode: value, salaryHeadName: found?.name || h.salaryHeadName } : h)
																							}))
																						}}
																						placeholder="Select salary head code"
																						disabled={isViewMode}
																						className={`h-10 rounded-lg ${showFieldErrors && !!fieldErrors?.salaryHeads?.[shIdx]?.salaryHeadCode ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300'} bg-gray-50 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
																						searchPlaceholder="Search salary heads..."
																						emptyMessage="No salary heads found."
																					/>
																					{salaryHeadsError && (
																						<p className="text-xs text-red-500">{salaryHeadsError}</p>
																					)}
																					{showFieldErrors && !!fieldErrors?.salaryHeads?.[shIdx]?.salaryHeadCode && (
																						<p className="text-xs text-red-500">{fieldErrors.salaryHeads[shIdx]?.salaryHeadCode}</p>
																					)}
																				</div>
																				<div className="space-y-2">
																					<Label className="text-sm font-medium text-gray-700">Name</Label>
																					<Input
																						value={sh.salaryHeadName}
																						onChange={e => updateMW(idx, s => ({
																							...s,
																							salaryHeads: (s.salaryHeads || []).map((h, i) => i === shIdx ? { ...h, salaryHeadName: e.target.value } : h)
																						}))}
																						placeholder="Enter salary head name"
																						disabled={isViewMode}
																						className={`h-10 rounded-lg ${showFieldErrors && !!fieldErrors?.salaryHeads?.[shIdx]?.salaryHeadName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
																					/>
																					{showFieldErrors && !!fieldErrors?.salaryHeads?.[shIdx]?.salaryHeadName && (
																						<p className="text-xs text-red-500">{fieldErrors.salaryHeads[shIdx]?.salaryHeadName}</p>
																					)}
																				</div>
																				<div className="space-y-2">
																					<Label className="text-sm font-medium text-gray-700">Amount</Label>
																					<Input
																						type="number"
																						value={Number.isFinite(sh.amount) ? sh.amount : 0}
																						onChange={e => updateMW(idx, s => ({
																							...s,
																							salaryHeads: (s.salaryHeads || []).map((h, i) => i === shIdx ? { ...h, amount: Number(e.target.value || 0) } : h)
																						}))}
																						placeholder="0.00"
																						disabled={isViewMode}
																						className={`h-10 rounded-lg ${showFieldErrors && !!fieldErrors?.salaryHeads?.[shIdx]?.amount ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'} ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
																					/>
																					{showFieldErrors && !!fieldErrors?.salaryHeads?.[shIdx]?.amount && (
																						<p className="text-xs text-red-500">{fieldErrors.salaryHeads[shIdx]?.amount}</p>
																					)}
																				</div>
																			</div>
																		</div>
																	))}
																</div>
															</div>
														</>
													)
												})()}
											</CardContent>
										</Card>
									))}
								</div>
							</div>

							{/* Footer Section */}
							<div className="pt-8 border-t border-gray-200">
								<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
									<div className="flex items-center gap-3">
										<Button
											type="button"
											variant="outline"
											onClick={resetForm}
											className="px-6 py-3 h-12 rounded-xl border-2 border-gray-300 hover:bg-gray-50 bg-transparent text-gray-700 hover:text-gray-900 transition-all duration-200 hover:border-gray-400"
										>
											Reset Form
										</Button>
									</div>

									<div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
										<div className="flex items-center gap-3">
											<div className={`w-3 h-3 rounded-full ${isFormValid ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></div>
											<span className="text-sm font-medium text-gray-700">
												{isFormValid ? 'Form is valid and ready to submit' : 'Please complete all required fields'}
											</span>
										</div>
										<Button
											type="button"
											onClick={handleSave}
											disabled={postLoading}
											className="px-8 py-3 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg text-white font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transform hover:-translate-y-0.5"
										>
											{postLoading ? (
												<div className="flex items-center gap-2">
													<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
													{isEditMode ? 'Updating...' : 'Saving...'}
												</div>
											) : (
												isEditMode ? "Update Minimum Wages" : "Save Minimum Wages"
											)}
										</Button>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}