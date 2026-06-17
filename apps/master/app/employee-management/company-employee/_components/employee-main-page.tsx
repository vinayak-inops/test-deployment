"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import ContractorTableWrapper from "./contractor-table-wrapper"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useHierarchyFilters } from "@/hooks/hierarchy/useHierarchyFilters"
import { encryptEmployeeData } from "@/hooks/crypto-js/emp-url-crypto"
import type { FilterSelections } from "@/components/common/step-by-step-filter"
import { Input } from "@repo/ui/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"

type SearchField = "employeeID" | "firstName" | "lastName" | "aadharNumber" | "currentWorkOrderNumber"

const toEmployeeRow = (item: any) => ({
  _id: typeof item._id === "object" && item._id?.$oid ? item._id : { $oid: item._id || "" },
  organizationCode: item?.organizationCode || "",
  tenantCode: item?.tenantCode || "",
  employeeID: item?.employeeID || "",
  firstName: item?.firstName || "",
  middleName: item?.middleName || "",
  lastName: item?.lastName || "",
  fatherHusbandName: item?.fatherHusbandName || "",
  gender: item?.gender || "",
  birthDate: item?.birthDate || "",
  bloodGroup: item?.bloodGroup || "",
  nationality: item?.nationality || "",
  maritalStatus: item?.maritalStatus || "",
  marriageDate: item?.marriageDate || "",
  referenceBy: item?.referenceBy || "",
  caste: item?.caste || "",
  identificationMark: item?.identificationMark || "",
  photo: item?.photo || "",
  isDeleted: item?.isDeleted ?? false,
  updatedOn: item?.updatedOn || "",
  updatedBy: item?.updatedBy || "",
  wdmsID: item?.wdmsID || "",

  // Dates
  dateOfJoining: item?.dateOfJoining || "",
  contractFrom: item?.contractFrom || "",
  contractTo: item?.contractTo || "",
  contractPeriod: item?.contractPeriod || 0,
  dateOfLeaving: item?.dateOfLeaving || "",
  relievingDate: item?.relievingDate || "",
  resignationDate: item?.resignationDate || "",

  // Work
  paymentMode: item?.paymentMode || "",
  currentWorkOrderNumber: item?.currentWorkOrderNumber || "",
  defaultShiftGroupCode: item?.defaultShiftGroupCode || "",
  manager: item?.manager || "",
  superviser: item?.superviser || "",
  remark: item?.remark || "",
  quotaUtilizationCountForSchool: item?.quotaUtilizationCountForSchool ?? 0,

  // IDs / numbers
  aadharNumber: item?.aadharNumber || "",
  panNumber: item?.panNumber || "",
  uanNumber: item?.uanNumber || "",
  esiNumber: item?.esiNumber || "",
  pfNumber: item?.pfNumber || "",
  insuranceNumber: item?.insuranceNumber || "",
  mediclaimPolicyNumber: item?.mediclaimPolicyNumber || "",
  WCPolicyNumber: item?.WCPolicyNumber || "",
  accidentPolicyNumber: item?.accidentPolicyNumber || "",

  // Verification
  backgroundVerificationRemark: item?.backgroundVerificationRemark || "",
  medicalVerificationRemark: item?.medicalVerificationRemark || "",

  // Address
  address: item?.address || {
    permanentAddress: {
      addressLine1: "",
      addressLine2: "",
      country: "",
      state: "",
      city: "",
      pinCode: "",
    },
    temporaryAddress: {
      addressLine1: "",
      addressLine2: "",
      country: "",
      state: "",
      city: "",
      pinCode: "",
    },
  },

  // Deployment
  deployment: item?.deployment || {
    contractor: { contractorCode: "", contractorName: "" },
    subsidiary: { subsidiaryCode: "", subsidiaryName: "" },
    division: { divisionCode: "", divisionName: "" },
    department: { departmentCode: "", departmentName: "" },
    section: { sectionCode: "", sectionName: "" },
    subDepartment: { subDepartmentCode: "", subDepartmentName: "" },
    employeeCategory: { employeeCategoryCode: "", employeeCategoryName: "" },
    grade: { gradeCode: "", gradeName: "" },
    designation: { designationCode: "", designationName: "" },
    location: { locationCode: "", locationName: "" },
    skillLevel: { skilledLevelTitle: "", skilledLevelDescription: "" },
    effectiveFrom: "",
    areas: [],
    remark: "",
  },

  // Status
  status: item?.status || {
    currentStatus: "",
    notToReHire: false,
    onNoticePeriod: false,
    relievingDate: "",
    resignationDate: "",
  },

  // Contact
  contactNumber: item?.contactNumber || {
    primaryContactNo: "",
    secondaryContactNumber: "",
    emergencyContactNo1: "",
    emergencyContactNo2: "",
    emergencyContactPerson1: "",
    emergencyContactPerson2: "",
  },
  emailID: item?.emailID || { primaryEmailID: "", secondaryEmailID: "" },

  // Bank
  bankDetails: item?.bankDetails || {
    bankName: "",
    branchName: "",
    accountNumber: "",
    ifscCode: "",
  },

  // Skills & work
  workSkill: item?.workSkill || { workSkillCode: "", workSkillTitle: "" },
  natureOfWork: item?.natureOfWork || { natureOfWorkCode: "", natureOfWorkTitle: "" },
  busDetail: item?.busDetail || { busNumber: "", busRegistrationNumber: "", route: "" },
  rejoin: item?.rejoin || { isRejoining: false, oldEmployeeCode: "" },

  // Documents
  passport: item?.passport || { passportNumber: "", passportExpiryDate: "", passportPath: "" },
  labourCard: item?.labourCard || { labourCardNumber: "", labourCardExpiryDate: "", labourCardPath: "" },
  workPermit: item?.workPermit || { workpermitNumber: "", workpermitExpiryDate: "", workPermitPath: "" },

  // Arrays
  workOrder: item?.workOrder || [],
  cards: item?.cards || [],
  assetAllocated: item?.assetAllocated || [],
  educations: item?.educations || [],
  penalty: item?.penalty || [],
  wcPolicies: item?.wcPolicies || [],
  bonus: item?.bonus || [],
  advance: item?.advance || [],
  pfNominee: item?.pfNominee || [],
  gratuityNominee: item?.gratuityNominee || [],
  childrenAdmission: item?.childrenAdmission || [],
  accidentRegister: item?.accidentRegister || [],
  policeVerification: item?.policeVerification || [],
  uploadedDocuments: item?.uploadedDocuments || [],
})

interface EmployeeMainPageProps {
  tenantCode?: string
  userEntitlement: any
  filterSelections: FilterSelections
  filtersApplied: boolean
  itemsPerPage?: number
  rolePermissions: {
    view: boolean
    edit: boolean
    delete: boolean
  }
  loginEmployeeId?: string | null
  onDelete: (employee: any) => void
}

export default function EmployeeMainPage({
  tenantCode,
  userEntitlement,
  filterSelections,
  filtersApplied,
  itemsPerPage: itemsPerPageProp = 5,
  rolePermissions,
  loginEmployeeId,
  onDelete,
}: EmployeeMainPageProps) {
  const router = useRouter()
  const [employeeData, setEmployeeData] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageProp)
  const [searchField, setSearchField] = useState<SearchField>("employeeID")
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const hierarchyFilters = useHierarchyFilters(filterSelections)
  const effectiveHierarchyFilters = useMemo(() => {
    const filters: Record<string, any> = {}

    if (Array.isArray(userEntitlement?.subsidiary) && userEntitlement.subsidiary.length > 0) {
      filters.subsidiary = userEntitlement.subsidiary
    }
    if (Array.isArray(userEntitlement?.division) && userEntitlement.division.length > 0) {
      filters.division = userEntitlement.division
    }
    if (Array.isArray(userEntitlement?.department) && userEntitlement.department.length > 0) {
      filters.department = userEntitlement.department
    }
    if (Array.isArray(userEntitlement?.location) && userEntitlement.location.length > 0) {
      filters.location = userEntitlement.location
    }
    if (Array.isArray(userEntitlement?.contractor) && userEntitlement.contractor.length > 0) {
      filters.contractor = userEntitlement.contractor
    }

    return {
      ...filters,
      ...hierarchyFilters,
    }
  }, [hierarchyFilters, userEntitlement])
  const offset = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage])
  const limit = itemsPerPage

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 400)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const emptyRequestData = useMemo(
    () => ({
      hierarchyFilters: effectiveHierarchyFilters,
      criteriaRequests: [
        { field: "tenantCode", operator: "eq", value: tenantCode || "" },
        { field: "createdOn", operator: "desc", value: "" },
      ],
      userEntitlement,
    }),
    [tenantCode, effectiveHierarchyFilters, userEntitlement]
  )

  const INACTIVE_STATUSES = ["Inactive", "Terminated", "Resigned"]

  const apiCriteria = useMemo(
    () => [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
      { field: "createdOn", operator: "desc", value: "" },
      selectedStatus
        ? { field: "status.currentStatus", operator: "eq", value: selectedStatus }
        : { field: "status.currentStatus", operator: "nin", value: INACTIVE_STATUSES },
      ...(debouncedSearchTerm.trim()
        ? [{ field: searchField, operator: "like", value: debouncedSearchTerm.trim() }]
        : []),
    ],
    [tenantCode, searchField, debouncedSearchTerm, selectedStatus]
  )

  const countRequestData = useMemo(() => {
    if (!filtersApplied) return emptyRequestData
    return {
      hierarchyFilters: effectiveHierarchyFilters,
      criteriaRequests: apiCriteria,
      userEntitlement,
    }
  }, [filtersApplied, emptyRequestData, effectiveHierarchyFilters, apiCriteria, userEntitlement])

  const searchRequestData = useMemo(() => {
    if (!filtersApplied) return emptyRequestData
    return {
      hierarchyFilters: effectiveHierarchyFilters,
      criteriaRequests: apiCriteria,
      userEntitlement,
    }
  }, [filtersApplied, emptyRequestData, effectiveHierarchyFilters, apiCriteria, userEntitlement])

  const { refetch: refetchCount } = useRequest<any>({
    url: "contract_employee/count/searchWithHierarchy",
    method: "POST",
    data: countRequestData,
    onSuccess: (data: any) => {
      if (filtersApplied && data !== null && data !== undefined) {
        setTotalCount(data || 0)
      }
    },
    onError: (error: any) => {
      if (filtersApplied) {
        console.error("Error fetching contract employee count:", error)
      }
    },
    dependencies: [],
  })

  const { loading: isLoadingEmployee, refetch: refetchContractorEmployee } = useRequest<any>({
    url: `contract_employee/searchWithHierarchy?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: searchRequestData,
    onSuccess: (data) => {
      if (filtersApplied && data !== null && data !== undefined) {
        const active = (Array.isArray(data) ? data : []).filter((item: any) => item?.isDeleted !== true)
        setEmployeeData(active.map(toEmployeeRow))
      }
    },
    onError: (error) => {
      if (filtersApplied) {
        console.error("Error fetching contract employee data:", error)
        setEmployeeData([])
      }
    },
    dependencies: [],
  })

  useEffect(() => {
    if (!filtersApplied) return
    refetchCount()
    refetchContractorEmployee()
  }, [filtersApplied, countRequestData, searchRequestData])

  useEffect(() => {
    if (filtersApplied && currentPage > 0) {
      refetchContractorEmployee()
    }
  }, [currentPage, filtersApplied])

  useEffect(() => {
    setCurrentPage(1)
  }, [filterSelections])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchField, debouncedSearchTerm, selectedStatus])

  useEffect(() => {
    setCurrentPage(1)
  }, [itemsPerPage])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

  return (
    <>
      <div className="py-4 px-6 pb-0">
        <div className="flex bg-muted/50 rounded-lg border max-w-7xl mx-auto">
          <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-52">
            <Select value={searchField} onValueChange={(value) => setSearchField(value as SearchField)}>
              <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employeeID">Employee ID</SelectItem>
                <SelectItem value="firstName">First Name</SelectItem>
                <SelectItem value="lastName">Last Name</SelectItem>
                <SelectItem value="aadharNumber">Aadhar Number</SelectItem>
                <SelectItem value="currentWorkOrderNumber">Work Order No.</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 flex items-center bg-background min-w-0">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder={`Search by ${searchField.replace(/([A-Z])/g, " $1").toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent w-full placeholder:text-gray-400"
              />
            </div>
          </div>
          <div className="flex items-center bg-background border-l px-3 py-2 w-52">
            <Select
              value={selectedStatus ?? "__all__"}
              onValueChange={(value) => setSelectedStatus(value === "__all__" ? null : value)}
            >
              <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Active</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Terminated">Terminated</SelectItem>
                <SelectItem value="Resigned">Resigned</SelectItem>
                <SelectItem value="convertedIntoCompanyEmployee">Converted to Company</SelectItem>
                <SelectItem value="convertedFTC">Converted FTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center bg-background border-l rounded-r-lg px-3 py-2 w-36">
            <Select
              value={String(itemsPerPage)}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 / page</SelectItem>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <ContractorTableWrapper
      employeeData={employeeData}
      loading={isLoadingEmployee}
      externalPagination={{
        currentPage,
        totalPages: Math.ceil(totalCount / itemsPerPage),
        totalItems: totalCount,
        itemsPerPage,
        startIndex,
        endIndex,
        onPageChange: handlePageChange,
      }}
      rolePermissions={rolePermissions}
      onEdit={(employee: any) => {
        const employeeIdValue =
          typeof employee._id === "object" && employee._id?.$oid ? employee._id.$oid : String(employee._id || "")
        const encryptedData = encryptEmployeeData({ employeeId: loginEmployeeId || "", _id: employeeIdValue })
        router.push(`/employee-management/contract-employee?form=cont&mode=edit&id=${encryptedData}`)
      }}
      onView={(employee: any) => {
        const employeeIdValue =
          typeof employee._id === "object" && employee._id?.$oid ? employee._id.$oid : String(employee._id || "")
        const encryptedData = encryptEmployeeData({ employeeId: loginEmployeeId || "", _id: employeeIdValue })
        router.push(`/employee-management/contract-employee?form=cont&mode=view&id=${encryptedData}`)
      }}
      onDelete={onDelete}
    />
    </>
  )
}
