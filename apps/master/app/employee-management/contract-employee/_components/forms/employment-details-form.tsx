"use client"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent } from "@repo/ui/components/ui/card"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Separator } from "@repo/ui/components/ui/separator"
import { Building2, X, History } from "lucide-react"
import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { gql, useQuery, useLazyQuery } from "@apollo/client"
import { OrganizationalStructureForm } from "./organizational-structure-form"
import SingleSelectField from "@/components/fields/single-select-field"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch"
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy"
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"
import { useUserEntitlement } from "@/hooks/hierarchy/useUserEntitlement"
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure"
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest"
import { useAuditPayload } from "@/hooks/api/useAuditPayload"
import {
  createEmploymentDetailsSchema,
  normalizeEmploymentDetailsConfig,
  type EmploymentDetailsData,
  type EmploymentDetailsFieldKey,
  type EmploymentDetailsFieldsConfig,
  type EmploymentDetailsTabConfig,
} from "../schemas/employment-details-schema"
import { FormActionsFooter } from "../../../../../components/footer/form-actions-footer"
import { GradientFormHeader } from "../../../../../components/header/form-header"
import { SubFormTitle } from "../../../../../components/header/sub-form-title"
import { toast } from "react-toastify"

interface EmploymentDetailsFormProps {
  employeeRecordId?: string | null
  onNextTab?: () => void
  onPreviousTab?: () => void
  mode?: "add" | "edit" | "view"
  employeeSearchUrl?: string
  employeeCollectionUrl?: string
}

// Payment mode options (static since not in organization API)
const paymentModeOptions = [
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Cash", label: "Cash" },
  { value: "Cheque", label: "Cheque" },
]

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
  }
  if (typeof value === "string" && value.trim().length > 0) {
    return [value]
  }
  return []
}

const FETCH_CONTRACTORS_QUERY = gql`
  query FetchContractors($criteriaRequests: [CriteriaRequest!]!, $collection: String!, $offset: Int, $limit: Int) {
    fetchContractors(
      criteriaRequests: $criteriaRequests
      collection: $collection
      offset: $offset
      limit: $limit
    ) {
      contractorCode
      contractorName
    }
  }
`

const FETCH_COMPANY_EMPLOYEE_QUERY = gql`
  query FetchCompanyEmployee($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchCompanyEmployee(criteriaRequests: $criteriaRequests, collection: $collection) {
      _id
      employeeID
      firstName
      middleName
      lastName
    }
  }
`

export function EmploymentDetailsForm({ 
  employeeRecordId = null,
  onNextTab, 
  onPreviousTab,
  mode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl="contract_employee",
}: EmploymentDetailsFormProps) {
  const fieldClassName = (hasError: boolean, disabled: boolean) =>
    `h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white ${
      disabled ? "bg-gray-100 cursor-not-allowed" : ""
    } ${
      hasError
        ? "border-red-500 focus:border-red-500"
        : ""
    }`

  const [auditStatusFormData, setAuditStatusFormData] = useState<any>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [subOrganization, setSubOrganization] = useState<any>({})
  const [contractorData, setContractorData] = useState<any[]>([])
  const [companyEmpData, setCompanyEmpData] = useState<any[]>([])
  const tenantCode = useGetTenantCode()
  const { hierarchyFilters } = useEmpHierarchy()
  const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()
  const userEntitlement = useUserEntitlement(loginEmployeeId, hierarchyFilters)
  const { formStructure } = useCollectionFormStructure({
    collectionName: "contract_employee_strcture",
  })
  const {
    post: postEmploymentDetails,
    loading: postLoading,
  } = usePostRequest<any>({
    url: employeeCollectionUrl,
    onSuccess: (response) => {
      const status = response?.status ?? response?.data?.status
      if (!status) {
        setShowErrors(true)
        const responseData =
          response?.data && typeof response.data === "object" ? response.data : response

        const applyFieldError = (fieldName: string, message: string) => {
          const normalized = fieldName.trim()
          if (!normalized || !message.trim()) return
          setError(normalized as any, {
            type: "server",
            message,
          })
        }

        if (responseData && typeof responseData === "object") {
          Object.entries(responseData).forEach(([fieldName, message]) => {
            if (fieldName === "status" || fieldName === "_id" || fieldName === "id") return

            if (typeof message === "string") {
              applyFieldError(fieldName, message)
              return
            }

            if (message && typeof message === "object") {
              Object.entries(message as Record<string, unknown>).forEach(([childKey, childValue]) => {
                if (typeof childValue !== "string") return
                applyFieldError(`${fieldName}.${childKey}`, childValue)
              })
            }
          })
        }
        return
      }

      toast.success("Employee data saved successfully!");
      void fetchEmployee()
    },
    onError: (error) => {
      console.error("Error saving employment details:", error)
    },
  })
  const {
    post: postSaveHistory,
    loading: saveHistoryLoading,
  } = usePostRequest<any>({
    url: "deploymentHistory",
    onSuccess: () => {
      toast.success("Deployment history saved successfully!")
    },
    onError: (error) => {
      console.error("Error saving deployment history:", error)
      toast.error("Failed to save deployment history.")
    },
  })
  const employmentDetailsConfig = useMemo(
    () =>
      normalizeEmploymentDetailsConfig(
        (formStructure?.employmentDetails as
          | EmploymentDetailsFieldsConfig
          | EmploymentDetailsTabConfig
          | undefined) ?? undefined
      ),
    [formStructure]
  )
  const employmentDetailsSchema = useMemo(
    () =>
      createEmploymentDetailsSchema({
        tabRequired: employmentDetailsConfig.tabRequired,
        fields: employmentDetailsConfig.fields,
      }),
    [employmentDetailsConfig]
  )

  const isFieldVisible = (field: EmploymentDetailsFieldKey) =>
    employmentDetailsConfig.fields[field]?.visible ?? true

  const isFieldRequired = (field: EmploymentDetailsFieldKey, requiredByDefault = false) =>
    employmentDetailsConfig.fields[field]?.required ?? requiredByDefault

  const getFieldLabel = (field: EmploymentDetailsFieldKey, fallback: string) =>
    employmentDetailsConfig.fields[field]?.label || fallback


  // Get the "id" and "mode" values from the URL query parameters
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const resolvedEmployeeRecordId = employeeRecordId || id
  const currentMode = mode ?? "add"
  const isViewMode = currentMode === "view"
  const [debouncedTenantCode, setDebouncedTenantCode] = useState("")

  useEffect(() => {
    if (!tenantCode) {
      setDebouncedTenantCode("")
      return
    }

    const debounceTimer = setTimeout(() => {
      setDebouncedTenantCode(tenantCode)
    }, 350)

    return () => clearTimeout(debounceTimer)
  }, [tenantCode])

  const [contractorHasMore, setContractorHasMore] = useState(false)
  const contractorSearchRef = useRef("")
  const contractorOffsetRef = useRef(0)
  const isContractorAppendRef = useRef(false)

  const [runContractorQuery, { loading: contractorLoading }] = useLazyQuery(FETCH_CONTRACTORS_QUERY, {
    client,
    fetchPolicy: "network-only",
    onCompleted: (data: any) => {
      const contractors = Array.isArray(data?.fetchContractors)
        ? data.fetchContractors.filter((rec: any) => rec?.isDeleted !== true)
        : []
      if (isContractorAppendRef.current) {
        setContractorData((prev) => [...prev, ...contractors])
      } else {
        setContractorData(contractors)
      }
      setContractorHasMore(contractors.length === 20)
    },
    onError: (error: any) => {
      console.error("Error fetching contractors:", error)
    },
  })

  const fetchContractorsData = useCallback(
    (search: string, offset: number) => {
      if (!debouncedTenantCode) return
      contractorSearchRef.current = search
      contractorOffsetRef.current = offset
      isContractorAppendRef.current = offset > 0
      runContractorQuery({
        variables: {
          criteriaRequests: [
            { field: "tenantCode", operator: "eq", value: debouncedTenantCode },
            ...(Array.isArray(userEntitlement.contractor) && userEntitlement.contractor.length > 0
              ? [{ field: "contractorCode", operator: "in", value: userEntitlement.contractor }]
              : []),
            ...(search.trim()
              ? [{ field: "contractorName", operator: "like", value: search.trim() }]
              : []),
          ],
          collection: "contractor",
          offset,
          limit: 20,
        },
      })
    },
    [debouncedTenantCode, userEntitlement.contractor, runContractorQuery]
  )

  const handleContractorOpen = useCallback(
    (open: boolean) => {
      if (open) fetchContractorsData("", 0)
    },
    [fetchContractorsData]
  )

  const handleContractorSearch = useCallback(
    (search: string) => {
      fetchContractorsData(search, 0)
    },
    [fetchContractorsData]
  )

  const handleContractorLoadMore = useCallback(() => {
    fetchContractorsData(contractorSearchRef.current, contractorOffsetRef.current + 20)
  }, [fetchContractorsData])

  const companyEmployeeQueryVariables = useMemo(
    () => ({
      criteriaRequests: [{ field: "tenantCode", operator: "eq", value: tenantCode }],
      collection: "company_employee",
    }),
    [tenantCode]
  )

  useQuery(FETCH_COMPANY_EMPLOYEE_QUERY, {
    client,
    variables: companyEmployeeQueryVariables,
    skip: !tenantCode,
    fetchPolicy: "network-only",
    onCompleted: (data: any) => {
      const employees = Array.isArray(data?.fetchCompanyEmployee) ? data.fetchCompanyEmployee : []
      setCompanyEmpData(
        employees
          .filter((emp: any) => emp?.isDeleted !== true)
          .map((emp: any) => ({
            employeeID: emp?.employeeID || "",
            name: [emp?.firstName, emp?.middleName, emp?.lastName].filter(Boolean).join(" "),
          }))
      )
    },
    onError: (error: any) => {
      console.error("Error fetching company employees:", error)
      setCompanyEmpData([])
    },
  })

  

  const organizationCriteriaRequests = useMemo(
    () =>
      tenantCode
        ? [
            {
              field: "tenantCode",
              operator: "is",
              value: tenantCode,
            },
          ]
        : [],
    [tenantCode]
  )

  const { arrayData: subsidiariesArray, loading: subsidiariesLoading, error: subsidiariesError, refetch: refetchSubsidiaries } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subsidiaries",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: divisionsArray, loading: divisionsLoading, error: divisionsError, refetch: refetchDivisions } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "divisions",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: departmentsArray, loading: departmentsLoading, error: departmentsError, refetch: refetchDepartments } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "departments",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: subDepartmentsArray, loading: subDepartmentsLoading, error: subDepartmentsError, refetch: refetchSubDepartments } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subDepartments",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: sectionsArray, loading: sectionsLoading, error: sectionsError, refetch: refetchSections } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "sections",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: employeeCategoriesArray, loading: employeeCategoriesLoading, error: employeeCategoriesError, refetch: refetchEmployeeCategories } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "employeeCategories",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: gradesArray, loading: gradesLoading, error: gradesError, refetch: refetchGrades } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "grades",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: designationsArray, loading: designationsLoading, error: designationsError, refetch: refetchDesignations } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "designations",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: locationsArray, loading: locationsLoading, error: locationsError, refetch: refetchLocations } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "location",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: areasArray, loading: areasLoading, error: areasError, refetch: refetchAreas } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "areas",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: skillLevelsArray, loading: skillLevelsLoading, error: skillLevelsError, refetch: refetchSkillLevels } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "skillLevels",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: workSkillsArray, loading: workSkillsLoading, error: workSkillsError, refetch: refetchWorkSkills } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "workSkill",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })
  const { arrayData: natureOfWorkArray, loading: natureOfWorkLoading, error: natureOfWorkError, refetch: refetchNatureOfWork } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "natureOfWork",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  })

  const orgLoading =
    subsidiariesLoading ||
    divisionsLoading ||
    departmentsLoading ||
    subDepartmentsLoading ||
    sectionsLoading ||
    employeeCategoriesLoading ||
    gradesLoading ||
    designationsLoading ||
    locationsLoading ||
    areasLoading ||
    skillLevelsLoading ||
    workSkillsLoading ||
    natureOfWorkLoading

  const orgError =
    subsidiariesError ||
    divisionsError ||
    departmentsError ||
    subDepartmentsError ||
    sectionsError ||
    employeeCategoriesError ||
    gradesError ||
    designationsError ||
    locationsError ||
    areasError ||
    skillLevelsError ||
    workSkillsError ||
    natureOfWorkError

  useEffect(() => {
    if (!tenantCode) return

    void refetchSubsidiaries()
    void refetchDivisions()
    void refetchDepartments()
    void refetchSubDepartments()
    void refetchSections()
    void refetchEmployeeCategories()
    void refetchGrades()
    void refetchDesignations()
    void refetchLocations()
    void refetchAreas()
    void refetchSkillLevels()
    void refetchWorkSkills()
    void refetchNatureOfWork()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode])

  useEffect(() => {
    if (orgError) {
      console.error("Error loading organization data:", orgError)
    }
  }, [orgError])

  useEffect(() => {
    setSubOrganization({
      subsidiaries: subsidiariesArray || [],
      divisions: divisionsArray || [],
      departments: departmentsArray || [],
      subDepartments: subDepartmentsArray || [],
      sections: sectionsArray || [],
      employeeCategories: employeeCategoriesArray || [],
      grades: gradesArray || [],
      designations: designationsArray || [],
      location: locationsArray || [],
      areas: areasArray || [],
      skillLevels: skillLevelsArray || [],
      workSkills: workSkillsArray || [],
      natureOfWork: natureOfWorkArray || [],
      contractors: contractorData || [],
    })
  }, [
    subsidiariesArray,
    divisionsArray,
    departmentsArray,
    subDepartmentsArray,
    sectionsArray,
    employeeCategoriesArray,
    gradesArray,
    designationsArray,
    locationsArray,
    areasArray,
    skillLevelsArray,
    workSkillsArray,
    natureOfWorkArray,
    contractorData,
  ])
  const { refetch: fetchEmployee } = useRequest<any>({
    url: employeeSearchUrl,
    method: "POST",
    data: [
      {
        field: "_id",
        value: resolvedEmployeeRecordId,
        operator: "eq",
      },
    ],
    onSuccess: (data) => {
      if (Array.isArray(data) && data[0] && data[0].isDeleted !== true) {
        setAuditStatusFormData(data[0])
      }
    },
    onError: (error) => {
      console.error("Error fetching employee data:", error)
    },
    dependencies: [resolvedEmployeeRecordId, employeeSearchUrl],
  })

  useEffect(() => {
    if (!resolvedEmployeeRecordId || currentMode === "add") return
    void fetchEmployee()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedEmployeeRecordId, currentMode, employeeSearchUrl])

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    setError,
    trigger,
    clearErrors,
  } = useForm<EmploymentDetailsData>({
    resolver: zodResolver(employmentDetailsSchema),
    defaultValues: {
      dateOfJoining: auditStatusFormData?.dateOfJoining || "" ,
      contractFrom: auditStatusFormData?.contractFrom || "",
      contractTo: auditStatusFormData?.contractTo || "",
      contractPeriod: auditStatusFormData?.contractPeriod || 0,
      rejoin: { isRejoining: auditStatusFormData?.rejoin?.isRejoining || false, oldEmployeeCode: auditStatusFormData?.rejoin?.oldEmployeeCode || "" },
      workSkill: { workSkillCode: auditStatusFormData?.workSkill?.workSkillCode || "", workSkillTitle: auditStatusFormData?.workSkill?.workSkillTitle || "" },
      paymentMode: auditStatusFormData?.paymentMode || "",
      deployment: {
        subsidiary: { subsidiaryCode: auditStatusFormData?.deployment?.subsidiary?.subsidiaryCode || "", subsidiaryName: auditStatusFormData?.deployment?.subsidiary?.subsidiaryName || "" },
        division: { divisionCode: auditStatusFormData?.deployment?.division?.divisionCode || "", divisionName: auditStatusFormData?.deployment?.division?.divisionName || "" },
        department: { departmentCode: auditStatusFormData?.deployment?.department?.departmentCode || "", departmentName: auditStatusFormData?.deployment?.department?.departmentName || "" },
        subDepartment: { subDepartmentCode: auditStatusFormData?.deployment?.subDepartment?.subDepartmentCode || "", subDepartmentName: auditStatusFormData?.deployment?.subDepartment?.subDepartmentName || "" },
        section: { sectionCode: auditStatusFormData?.deployment?.section?.sectionCode || "", sectionName: auditStatusFormData?.deployment?.section?.sectionName || "" },
        employeeCategory: { employeeCategoryCode: auditStatusFormData?.deployment?.employeeCategory?.employeeCategoryCode || "", employeeCategoryName: auditStatusFormData?.deployment?.employeeCategory?.employeeCategoryName || "" },
        grade: { gradeCode: auditStatusFormData?.deployment?.grade?.gradeCode || "", gradeName: auditStatusFormData?.deployment?.grade?.gradeName || "" },
        designation: { designationCode: auditStatusFormData?.deployment?.designation?.designationCode || "", designationName: auditStatusFormData?.deployment?.designation?.designationName || "" },
        location: { 
          locationCode: auditStatusFormData?.deployment?.location?.locationCode || "", 
          locationName: auditStatusFormData?.deployment?.location?.locationName || "",
          countryCode: auditStatusFormData?.deployment?.location?.countryCode || "",
          stateCode: auditStatusFormData?.deployment?.location?.stateCode || "",
        },
        skillLevel: { skilledLevelTitle: auditStatusFormData?.deployment?.skillLevel?.skilledLevelTitle || "", skilledLevelDescription: auditStatusFormData?.deployment?.skillLevel?.skilledLevelDescription || "" },
        contractor: { contractorCode: auditStatusFormData?.deployment?.contractor?.contractorCode || "", contractorName: auditStatusFormData?.deployment?.contractor?.contractorName || "" },
        areas: normalizeStringArray(auditStatusFormData?.deployment?.areas),
        salaryZone: auditStatusFormData?.deployment?.salaryZone || "",
        effectiveFrom: auditStatusFormData?.deployment?.effectiveFrom || "",
      },
      natureOfWork: { natureOfWorkCode: auditStatusFormData?.natureOfWork?.natureOfWorkCode || "", natureOfWorkTitle: auditStatusFormData?.natureOfWork?.natureOfWorkTitle || "" },

      manager: auditStatusFormData?.manager || "",
      superviser: auditStatusFormData?.superviser || "",
      backgroundVerificationRemark: auditStatusFormData?.backgroundVerificationRemark || "",
    },
    mode: "onChange",
  })
  const auditEntityId = String(
    resolvedEmployeeRecordId ||
      auditStatusFormData?._id ||
      auditStatusFormData?.employeeID ||
      auditStatusFormData?.employeeId ||
      "",
  )
  const auditPayload = useAuditPayload({
    entityName: "contract_employee",
    entityID: auditEntityId,
  })

  const watchedValues = watch()

  // Validate dateOfJoining against birthDate in real-time
  useEffect(() => {
    const dateOfJoining = watch("dateOfJoining")
    const birthDate = auditStatusFormData?.birthDate
    if (dateOfJoining && birthDate) {
      if (new Date(dateOfJoining) < new Date(birthDate)) {
        setError("dateOfJoining", {
          type: "manual",
          message: "Date of Joining must be after Date of Birth",
        })
      } else {
        clearErrors("dateOfJoining")
      }
    }
  }, [watch("dateOfJoining"), auditStatusFormData?.birthDate])

  // Effect to automatically calculate contract period when dates change
  useEffect(() => {
    const contractFrom = watch("contractFrom");
    const contractTo = watch("contractTo");

    if (contractFrom && contractTo) {
      const period = calculateContractPeriod(contractFrom, contractTo);
      const currentPeriod = watch("contractPeriod");

      // Only update if the period has actually changed to prevent unnecessary re-renders
      if (currentPeriod !== period) {
        setValue("contractPeriod", period);
      }
    }
  }, [watch("contractFrom"), watch("contractTo"), setValue, watch]);


  // Populate form after fetching employee record data
  useEffect(() => {
    if (!auditStatusFormData) return

    setValue("dateOfJoining", auditStatusFormData.dateOfJoining || "")
    setValue("contractFrom", auditStatusFormData.contractFrom || "")
    setValue("contractTo", auditStatusFormData.contractTo || "")
    setValue("contractPeriod", auditStatusFormData.contractPeriod || 0)
    setValue("rejoin", auditStatusFormData.rejoin || { isRejoining: false, oldEmployeeCode: "" })
    setValue("workSkill", auditStatusFormData.workSkill || { workSkillCode: "", workSkillTitle: "" })
    setValue("paymentMode", auditStatusFormData.paymentMode || "")
    const deploymentValue = auditStatusFormData.deployment || {
      subsidiary: { subsidiaryCode: "", subsidiaryName: "" },
      division: { divisionCode: "", divisionName: "" },
      department: { departmentCode: "", departmentName: "" },
      subDepartment: { subDepartmentCode: "", subDepartmentName: "" },
      section: { sectionCode: "", sectionName: "" },
      employeeCategory: { employeeCategoryCode: "", employeeCategoryName: "" },
      grade: { gradeCode: "", gradeName: "" },
      designation: { designationCode: "", designationName: "" },
      location: { locationCode: "", locationName: "", countryCode: "", stateCode: "" },
      skillLevel: { skilledLevelTitle: "", skilledLevelDescription: "" },
      contractor: { contractorCode: "", contractorName: "" },
      areas: [],
      salaryZone: "",
      effectiveFrom: "",
    }
    setValue("deployment", {
      ...deploymentValue,
      areas: normalizeStringArray(deploymentValue.areas),
      effectiveFrom: deploymentValue.effectiveFrom || "",
    })
    setValue("natureOfWork", auditStatusFormData.natureOfWork || { natureOfWorkCode: "", natureOfWorkTitle: "" })
    setValue("manager", auditStatusFormData.manager || "")
    setValue("superviser", auditStatusFormData.superviser || "")
    setValue("backgroundVerificationRemark", auditStatusFormData.backgroundVerificationRemark || "")
    void trigger()
  }, [auditStatusFormData, setValue, trigger])

  
  // Helper function to calculate contract period in months
  const calculateContractPeriod = (fromDate: string, toDate: string): number => {
    if (!fromDate || !toDate) return 0;
    
    const from = new Date(fromDate);
    const to = new Date(toDate);
    
    if (from >= to) return 0;
    
    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.ceil(diffDays / 30.44); // Average days per month
    
    return months;
  };

  const handleCodeChange = (section: string, subsection: string, code: string) => {
    let name = ""
    
    // Find corresponding name based on selected code from API data
    if (subOrganization) {
      switch (subsection) {
        case "subsidiary":
          const subsidiary = subOrganization.subsidiaries?.find((opt: any) => 
            (opt.code === code) || (opt.subsidiaryCode === code)
          )
          name = subsidiary?.name || subsidiary?.subsidiaryName || ""
          
          // Clear dependent fields when subsidiary changes - works for both add and edit modes
          setValue("deployment.division.divisionCode", "")
          setValue("deployment.division.divisionName", "")
          setValue("deployment.department.departmentCode", "")
          setValue("deployment.department.departmentName", "")
          setValue("deployment.subDepartment.subDepartmentCode", "")
          setValue("deployment.subDepartment.subDepartmentName", "")
          setValue("deployment.section.sectionCode", "")
          setValue("deployment.section.sectionName", "")
          setValue("deployment.areas", [])
          // Trigger re-render to update child dropdowns
          trigger(["deployment.division.divisionCode", "deployment.department.departmentCode", "deployment.subDepartment.subDepartmentCode", "deployment.section.sectionCode", "deployment.areas"])
          // Force re-render for add mode
          setTimeout(() => {
            trigger()
          }, 0)
          // Don't clear location as it can be independent of subsidiary
          break
        case "division":
          const division = subOrganization.divisions?.find((opt: any) => 
            (opt.code === code) || (opt.divisionCode === code)
          )
          name = division?.name || division?.divisionName || ""
          
          // Clear dependent fields when division changes - works for both add and edit modes
          setValue("deployment.department.departmentCode", "")
          setValue("deployment.department.departmentName", "")
          setValue("deployment.subDepartment.subDepartmentCode", "")
          setValue("deployment.subDepartment.subDepartmentName", "")
          setValue("deployment.section.sectionCode", "")
          setValue("deployment.section.sectionName", "")
          // Trigger re-render to update child dropdowns
          trigger(["deployment.department.departmentCode", "deployment.subDepartment.subDepartmentCode", "deployment.section.sectionCode"])
          // Force re-render for add mode
          setTimeout(() => {
            trigger()
          }, 0)
          break
        case "department":
          const department = subOrganization.departments?.find((opt: any) => 
            (opt.code === code) || (opt.departmentCode === code)
          )
          name = department?.name || department?.departmentName || ""
          
          // Clear dependent fields when department changes - works for both add and edit modes
          setValue("deployment.subDepartment.subDepartmentCode", "")
          setValue("deployment.subDepartment.subDepartmentName", "")
          setValue("deployment.section.sectionCode", "")
          setValue("deployment.section.sectionName", "")
          // Trigger re-render to update child dropdowns
          trigger(["deployment.subDepartment.subDepartmentCode", "deployment.section.sectionCode"])
          // Force re-render for add mode
          setTimeout(() => {
            trigger()
          }, 0)
          break
        case "subDepartment":
          const subDept = subOrganization.subDepartments?.find((opt: any) => 
            (opt.code === code) || (opt.subDepartmentCode === code)
          )
          name = subDept?.name || subDept?.subDepartmentName || ""
          
          // Clear dependent fields when subDepartment changes - works for both add and edit modes
          setValue("deployment.section.sectionCode", "")
          setValue("deployment.section.sectionName", "")
          // Trigger re-render to update child dropdowns
          trigger(["deployment.section.sectionCode"])
          // Force re-render for add mode
          setTimeout(() => {
            trigger()
          }, 0)
          break
        case "section":
          const section = subOrganization.sections?.find((opt: any) => 
            (opt.code === code) || (opt.sectionCode === code)
          )
          name = section?.name || section?.sectionName || ""
          break
        case "employeeCategory":
          const category = subOrganization.employeeCategories?.find((opt: any) => 
            (opt.code === code) || (opt.employeeCategoryCode === code)
          )
          name = category?.name || category?.employeeCategoryName || category?.title || ""
          break
        case "grade":
          const grade = subOrganization.grades?.find((opt: any) => 
            (opt.code === code) || (opt.gradeCode === code)
          )
          name = grade?.name || grade?.gradeName || grade?.gradeTitle || ""
          break
        case "designation":
          const designation = subOrganization.designations?.find((opt: any) => 
            (opt.code === code) || (opt.designationCode === code)
          )
          name = designation?.name || designation?.designationName || ""
          break
        case "location":
          const location = subOrganization.location?.find((opt: any) => 
            (opt.code === code) || (opt.locationCode === code)
          )
          name = location?.name || location?.locationName || ""
          break
        case "skillLevel":
          const skillLevel = subOrganization.skillLevels?.find((opt: any) => 
            (opt.title === code) || (opt.skilledLevelTitle === code)
          )
          name = skillLevel?.description || skillLevel?.skilledLevelDescription || ""
          break
        case "contractor":
          const contractorFromData = Array.isArray(contractorData)
            ? contractorData.find((opt: any) => (opt.code === code) || (opt.contractorCode === code))
            : undefined
          const contractorFromOrg = subOrganization.contractors?.find((opt: any) => 
            (opt.code === code) || (opt.contractorCode === code)
          )
          const contractor = contractorFromData || contractorFromOrg
          name = contractor?.name || contractor?.contractorName || ""
          break
        case "salaryZone":
          name = code
          break
        case "workSkill":
          const workSkill = subOrganization.workSkills?.find((opt: any) => 
            (opt.code === code) || (opt.workSkillCode === code)
          )
          name = workSkill?.title || workSkill?.workSkillTitle || ""
          break
        case "natureOfWork":
          const natureOfWork = subOrganization.natureOfWork?.find((opt: any) => 
            (opt.code === code) || (opt.natureOfWorkCode === code)
          )
          name = natureOfWork?.title || natureOfWork?.natureOfWorkTitle || ""
          break
      }
    }


    if (section === "deployment") {
      // Handle deployment nested structure with proper field mapping
      switch (subsection) {
        case "subsidiary":
          setValue("deployment.subsidiary.subsidiaryCode", code)
          setValue("deployment.subsidiary.subsidiaryName", name)
          // Trigger re-render to update child dropdowns
          trigger("deployment.subsidiary.subsidiaryCode")
          break
        case "division":
          setValue("deployment.division.divisionCode", code)
          setValue("deployment.division.divisionName", name)
          // Trigger re-render to update child dropdowns
          trigger("deployment.division.divisionCode")
          break
        case "department":
          setValue("deployment.department.departmentCode", code)
          setValue("deployment.department.departmentName", name)
          // Trigger re-render to update child dropdowns
          trigger("deployment.department.departmentCode")
          break
        case "subDepartment":
          setValue("deployment.subDepartment.subDepartmentCode", code)
          setValue("deployment.subDepartment.subDepartmentName", name)
          // Trigger re-render to update child dropdowns
          trigger("deployment.subDepartment.subDepartmentCode")
          break
        case "section":
          setValue("deployment.section.sectionCode", code)
          setValue("deployment.section.sectionName", name)
          // Trigger re-render to update child dropdowns
          trigger("deployment.section.sectionCode")
          break
        case "employeeCategory":
          setValue("deployment.employeeCategory.employeeCategoryCode", code)
          setValue("deployment.employeeCategory.employeeCategoryName", name)
          // Trigger re-render to update child dropdowns
          trigger("deployment.employeeCategory.employeeCategoryCode")
          break
        case "grade":
          setValue("deployment.grade.gradeCode", code)
          setValue("deployment.grade.gradeName", name)
          // Trigger re-render to update child dropdowns
          trigger("deployment.grade.gradeCode")
          break
        case "designation":
          setValue("deployment.designation.designationCode", code)
          setValue("deployment.designation.designationName", name)
          // Trigger re-render to update child dropdowns
          trigger("deployment.designation.designationCode")
          break
        case "location":
          // Find the full location object to get countryCode and stateCode
          const locationObj = subOrganization.location?.find((opt: any) => 
            (opt.code === code) || (opt.locationCode === code)
          )
          setValue("deployment.location.locationCode", code)
          setValue("deployment.location.locationName", name)
          setValue("deployment.location.countryCode" as any, locationObj?.countryCode || "")
          setValue("deployment.location.stateCode" as any, locationObj?.stateCode || "")
          // Trigger re-render to update child dropdowns
          trigger("deployment.location.locationCode")
          break
        case "skillLevel":
          setValue("deployment.skillLevel.skilledLevelTitle", code)
          setValue("deployment.skillLevel.skilledLevelDescription", name)
          // Trigger re-render to update child dropdowns
          trigger("deployment.skillLevel.skilledLevelTitle")
          break
        case "contractor":
          setValue("deployment.contractor.contractorCode" as any, code)
          setValue("deployment.contractor.contractorName" as any, name)
          // Trigger re-render to update child dropdowns
          trigger("deployment.contractor.contractorCode")
          break
        case "salaryZone":
          setValue("deployment.salaryZone", code)
          trigger("deployment.salaryZone")
          break
        case "effectiveFrom":
          setValue("deployment.effectiveFrom" as any, code)
          trigger("deployment.effectiveFrom" as any)
          // Validate against birthDate immediately on change
          const birthDateVal = auditStatusFormData?.birthDate
          if (code && birthDateVal && new Date(code) < new Date(birthDateVal)) {
            setError("deployment.effectiveFrom", {
              type: "manual",
              message: "Effective From date must be after Date of Birth",
            })
          } else {
            clearErrors("deployment.effectiveFrom")
          }
          break
      }
    } else {
      // Handle other sections (workSkill, natureOfWork, etc.)
      if (section === "workSkill") {
        setValue("workSkill.workSkillCode", code)
        setValue("workSkill.workSkillTitle", name)
        // Trigger re-render to update child dropdowns
        trigger("workSkill.workSkillCode" as any)
      } else if (section === "natureOfWork") {
        setValue("natureOfWork.natureOfWorkCode", code)
        setValue("natureOfWork.natureOfWorkTitle", name)
        // Trigger re-render to update child dropdowns
        trigger("natureOfWork.natureOfWorkCode" as any)
      } else {
        setValue(`${section}.${subsection}Code` as any, code)
        setValue(`${section}.${subsection}Name` as any, name)
        // Trigger re-render to update child dropdowns
        trigger(`${section}.${subsection}Code` as any)
      }
    }
    
    // Keep updates local to this form; parent sync removed by design.
  }

  const handleAreasChange = (codes: string[]) => {
    setValue("deployment.areas", normalizeStringArray(codes))
    void trigger("deployment.areas")
  }

  const handleSaveAndContinue = async () => {
    setShowErrors(true)
    clearErrors()
    const formValues = watch()
    const valid = await trigger()
    if (!valid) return

    const birthDate = auditStatusFormData?.birthDate
    if (formValues.dateOfJoining && birthDate && new Date(formValues.dateOfJoining) < new Date(birthDate)) {
      setError("dateOfJoining", {
        type: "manual",
        message: "Date of Joining must be after Date of Birth",
      })
      return
    }

    const effectiveFrom = formValues.deployment?.effectiveFrom
    if (effectiveFrom && birthDate && new Date(effectiveFrom) < new Date(birthDate)) {
      setError("deployment.effectiveFrom", {
        type: "manual",
        message: "Effective From date must be after Date of Birth",
      })
      return
    }

    const isEditMode = currentMode === "edit" && Boolean(resolvedEmployeeRecordId)
    const shouldSetEmploymentDetailsTab = employeeSearchUrl === "draft/contract_employee/search"
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: resolvedEmployeeRecordId } : {}),
      collectionName: "contract_employee",
      event: "validate",
      ruleId: "",
      data: {
        ...formValues,
        ...(shouldSetEmploymentDetailsTab ? { employmentDetailstab: true } : {}),
      },
      audit: auditPayload,
    }

    postEmploymentDetails(payload)
  }

  const handleSaveHistory = () => {
    const workOrders = Array.isArray(auditStatusFormData?.workOrder) ? auditStatusFormData.workOrder : []
    const today = new Date()
    const todayStr = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0"),
    ].join("-")

    const activeWorkOrder = workOrders.find((workOrderItem: any) => {
      const effectiveFrom = workOrderItem?.effectiveFrom || ""
      const effectiveTo = workOrderItem?.effectiveTo || ""
      return effectiveFrom <= todayStr && todayStr <= effectiveTo
    })

    const historyPayload = {
      organizationCode: tenantCode,
      tenantCode,
      employeeID:
        auditStatusFormData?.employeeID ||
        auditStatusFormData?.employeeId ||
        "",
      workOrderNumber: activeWorkOrder?.workOrderNumber || "",
      effectiveFrom: activeWorkOrder?.effectiveFrom || "",
      effectiveTo: activeWorkOrder?.effectiveTo || "",
      deployment: auditStatusFormData?.deployment || {},
      createdOn: new Date().toISOString(),
      updatedOn: new Date().toISOString(),
      workflowState: "APPROVED",
    }

    postSaveHistory({
      tenant: tenantCode,
      action: "insert",
      id: null,
      collectionName: "deploymentHistory",
      data: historyPayload,
      audit: auditPayload,
    })
  }

  const handleSave = async () => {
    await handleSaveAndContinue()
  }

  const handleContinue = async () => {
    setShowErrors(true)
    const valid = await trigger()
    if (!valid) return
    if (onNextTab) onNextTab()
  }

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      {(postLoading || saveHistoryLoading) && (
          <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
            <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>{saveHistoryLoading ? "Saving deployment history..." : "Saving employment details..."}</span>
            </div>
          </div>
        )}
      <GradientFormHeader
        icon={Building2}
        title="Employment Details"
        description="Employment information such as contract details, etc."
      />
      <CardContent className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
        {showErrors && Object.keys(errors).length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Please fix highlighted fields before continuing.
          </div>
        )}
        <div className="space-y-8">
          {/* Basic Employment Information */}
          <div>
            <SubFormTitle
              title="Basic Employment Information"
              className="mb-2"
            />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {isFieldVisible("dateOfJoining") && (
              <div className="space-y-2 group">
                <Label htmlFor="dateOfJoining" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getFieldLabel("dateOfJoining", "Date of Joining")} {isFieldRequired("dateOfJoining") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="dateOfJoining"
                  type="date"
                  {...register("dateOfJoining")}
                  min={auditStatusFormData?.birthDate || undefined}
                  max={watchedValues.contractFrom ? watchedValues.contractFrom : undefined}
                  disabled={isViewMode}
                  className={`h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.dateOfJoining) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {showErrors && errors.dateOfJoining && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.dateOfJoining.message}
                  </p>
                )}
                {/* Helpful guidance text */}
                <p className="text-xs text-gray-500 mt-1">
                  Must be after Date of Birth and earlier than or equal to Contract From date
                </p>
              </div>
              )}

              {isFieldVisible("contractFrom") && (
              <div className="space-y-2 group">
                <Label htmlFor="contractFrom" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getFieldLabel("contractFrom", "Contract From")} {isFieldRequired("contractFrom", true) && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="contractFrom"
                  type="date"
                  {...register("contractFrom")}
                  disabled={isViewMode}
                  className={`h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && (errors.contractFrom || errors.root?.contractTo || errors.dateOfJoining)) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {showErrors && errors.contractFrom && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.contractFrom.message}
                  </p>
                )}
                {/* Helpful guidance text */}
                <p className="text-xs text-gray-500 mt-1">
                  Start date of the contract (must be after or equal to Date of Joining)
                </p>
                {/* Show date validation error */}
                {showErrors && errors.root?.contractTo && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.root.contractTo.message}
                  </p>
                )}
                {/* Show Date of Joining validation error */}
                {showErrors && errors.dateOfJoining && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.dateOfJoining.message}
                  </p>
                )}
                {/* Success indicator when dates are valid */}
                {watchedValues.dateOfJoining && watchedValues.contractFrom && 
                 new Date(watchedValues.dateOfJoining) <= new Date(watchedValues.contractFrom) &&
                 watchedValues.contractFrom && watchedValues.contractTo && 
                 new Date(watchedValues.contractFrom) <= new Date(watchedValues.contractTo) && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    All dates are valid
                  </p>
                )}
              </div>
              )}

              {isFieldVisible("contractTo") && (
              <div className="space-y-2 group">
                <Label htmlFor="contractTo" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getFieldLabel("contractTo", "Contract To")} {isFieldRequired("contractTo", true) && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="contractTo"
                  type="date"
                  {...register("contractTo")}
                  disabled={isViewMode}
                  min={watchedValues.contractFrom ? watchedValues.contractFrom : undefined}
                  className={`h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && (errors.contractTo || errors.root?.contractTo)) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}
                />
                {showErrors && (errors.contractTo || errors.root?.contractTo) && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.contractTo?.message || errors.root?.contractTo?.message}
                  </p>
                )}
                {/* Helpful guidance text */}
                <p className="text-xs text-gray-500 mt-1">
                  Must be later than or equal to Contract From date (can be any future or past date)
                </p>
                {/* Success indicator when dates are valid */}
                {watchedValues.contractFrom && watchedValues.contractTo && 
                 new Date(watchedValues.contractFrom) <= new Date(watchedValues.contractTo) && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Dates are valid
                  </p>
                )}
              </div>
              )}

              {isFieldVisible("contractPeriod") && (
              <div className="space-y-2 group">
                <Label htmlFor="contractPeriod" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getFieldLabel("contractPeriod", "Contract Period (Months)")} <span className="text-xs text-gray-500 font-normal">(Auto-calculated)</span>
                </Label>
                <Input
                  id="contractPeriod"
                  type="number"
                  {...register("contractPeriod", { valueAsNumber: true })}
                  disabled={true}
                  className="h-9 border-gray-300 px-3 py-1.5 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">
                  Automatically calculated from Contract From and Contract To dates
                </p>
              </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Rejoin Information */}
          <div>
            <SubFormTitle
              title="Rejoin Information"
              className="mb-2"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {isFieldVisible("rejoin.isRejoining") && (
              <div className="space-y-2 group">
                <Label htmlFor="isRejoining" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getFieldLabel("rejoin.isRejoining", "Is Rejoining")} {isFieldRequired("rejoin.isRejoining", true) && <span className="text-red-500">*</span>}
                </Label>
                <Select
                  value={watchedValues.rejoin?.isRejoining?.toString()}
                  onValueChange={(value) => {
                    setValue("rejoin.isRejoining", value === "true")
                    void trigger("rejoin.isRejoining")
                  }}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={fieldClassName(Boolean(showErrors && errors.rejoin?.isRejoining), isViewMode)}>
                    <SelectValue placeholder="Select rejoining status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 bg-white">
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              )}

              {isFieldVisible("rejoin.oldEmployeeCode") && (
              <div className="space-y-2 group">
                <Label htmlFor="oldEmployeeCode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getFieldLabel("rejoin.oldEmployeeCode", "Old Employee Code")} {isFieldRequired("rejoin.oldEmployeeCode") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="oldEmployeeCode"
                  {...register("rejoin.oldEmployeeCode")}
                  disabled={isViewMode}
                  className={fieldClassName(Boolean(showErrors && errors.rejoin?.oldEmployeeCode), isViewMode)}
                  placeholder="Enter old employee code"
                />
                {showErrors && errors.rejoin?.oldEmployeeCode && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.rejoin.oldEmployeeCode.message}
                  </p>
                )}
              </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Work Skill & Payment */}
          <div>
            <SubFormTitle
              title="Work Skill, Payment & Nature Of Work"
              className="mb-2"
            />
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {isFieldVisible("workSkill.workSkillCode") && (
              <SingleSelectField
                id="workSkillCode"
                label={getFieldLabel("workSkill.workSkillCode", "Work Skill Code")}
                required={isFieldRequired("workSkill.workSkillCode", true)}
                placeholder="Select Work Skill Code"
                disabled={isViewMode}
                value={watchedValues.workSkill?.workSkillCode}
                onChange={(value) => handleCodeChange("workSkill", "workSkill", value)}
                options={(subOrganization?.workSkills ?? []).map((o: any) => ({
                  value: o.code || o.workSkillCode || "",
                  label: o.title || o.workSkillTitle || "",
                  tooltip: o.title || o.workSkillTitle || ""
                }))}
                showOnlyValueInTrigger
                className="space-y-2"
                errorMessage={showErrors && (errors.workSkill?.workSkillCode as any) ? (errors.workSkill?.workSkillCode as any).message : undefined}
                allowOnlyProvidedOptions
              />
              )}

              {isFieldVisible("paymentMode") && (
              <div className="space-y-2 group">
                <Label htmlFor="paymentMode" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getFieldLabel("paymentMode", "Payment Mode")} {isFieldRequired("paymentMode", true) && <span className="text-red-500">*</span>}
                </Label>
                <Select
                  value={watchedValues.paymentMode}
                  onValueChange={(value) => setValue("paymentMode", value)}
                  disabled={isViewMode}
                >
                  <SelectTrigger className={`h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white ${
                    isViewMode 
                      ? "bg-gray-100 cursor-not-allowed" 
                      : ""
                  } ${
                    (showErrors && errors.paymentMode) 
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" 
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                  }`}>
                    <SelectValue placeholder="Select payment mode" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-2 bg-white">
                    {paymentModeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {showErrors && errors.paymentMode && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.paymentMode.message}
                  </p>
                )}
              </div>
              )}

              {isFieldVisible("backgroundVerificationRemark") && (
              <div className="space-y-2 group">
                <Label htmlFor="backgroundVerificationRemark" className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
                  {getFieldLabel("backgroundVerificationRemark", "Background Verification Remark")} {isFieldRequired("backgroundVerificationRemark") && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="backgroundVerificationRemark"
                  {...register("backgroundVerificationRemark")}
                  disabled={isViewMode}
                  className={fieldClassName(Boolean(showErrors && errors.backgroundVerificationRemark), isViewMode)}
                  placeholder="Enter verification remark"
                />
                {showErrors && errors.backgroundVerificationRemark && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    {errors.backgroundVerificationRemark.message}
                  </p>
                )}
              </div>
              )}

              {isFieldVisible("natureOfWork.natureOfWorkCode") && (
              <SingleSelectField
                id="natureOfWorkCode"
                label={getFieldLabel("natureOfWork.natureOfWorkCode", "Nature Of Work Code")}
                required={isFieldRequired("natureOfWork.natureOfWorkCode", true)}
                placeholder="Select Nature Of Work Code"
                disabled={isViewMode}
                value={watchedValues.natureOfWork?.natureOfWorkCode}
                onChange={(value) => handleCodeChange("natureOfWork", "natureOfWork", value)}
                options={(subOrganization?.natureOfWork ?? []).map((o: any) => ({
                  value: o.code || o.natureOfWorkCode || "",
                  label: o.title || o.natureOfWorkTitle || "",
                  tooltip: o.title || o.natureOfWorkTitle || ""
                }))}
                showOnlyValueInTrigger
                className="space-y-2"
                errorMessage={showErrors && (errors.natureOfWork?.natureOfWorkCode as any) ? (errors.natureOfWork?.natureOfWorkCode as any).message : undefined}
                allowOnlyProvidedOptions
              />
              )}
            </div>
          </div>

          <Separator />

          {/* Organizational Structure */}
          <OrganizationalStructureForm
            subOrganization={subOrganization}
            orgLoading={orgLoading}
            contractorLoading={contractorLoading}
            isViewMode={isViewMode}
            showErrors={showErrors}
            errors={errors}
            handleCodeChange={handleCodeChange}
            watchedValues={watchedValues}
            contractorData={contractorData}
            onAreasChange={handleAreasChange}
            currentMode={currentMode}
            fieldsConfig={employmentDetailsConfig.fields}
            contractorIsLoading={contractorLoading}
            contractorHasMore={contractorHasMore}
            onContractorLoadMore={handleContractorLoadMore}
            onContractorSearch={handleContractorSearch}
            onContractorOpen={handleContractorOpen}
            birthDate={auditStatusFormData?.birthDate}
          />

          <Separator />

          {/* Management Hierarchy */}
          <div>
            <SubFormTitle
              title="Management Hierarchy"
              className="mb-2"
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {isFieldVisible("manager") && (
              <SingleSelectField
                id="manager"
                label={getFieldLabel("manager", "Manager")}
                required={isFieldRequired("manager")}
                placeholder="Select Manager"
                disabled={isViewMode}
                value={watchedValues.manager || ""}
                onChange={(value) => {
                  setValue("manager", value)
                  void trigger("manager")
                }}
                options={(companyEmpData ?? []).map((emp: any) => ({
                  value: emp.employeeID || "",
                  label: emp.name || emp.employeeID || "",
                  tooltip: emp.name || emp.employeeID || "",
                }))}
                showOnlyValueInTrigger
                className="space-y-2"
                errorMessage={showErrors && (errors as any).manager ? ((errors as any).manager.message as string) : undefined}
                allowOnlyProvidedOptions
              />
              )}

              {isFieldVisible("superviser") && (
              <SingleSelectField
                id="superviser"
                label={getFieldLabel("superviser", "Supervisor")}
                required={isFieldRequired("superviser")}
                placeholder="Select Supervisor"
                disabled={isViewMode}
                value={watchedValues.superviser || ""}
                onChange={(value) => {
                  setValue("superviser", value)
                  void trigger("superviser")
                }}
                options={(companyEmpData ?? []).map((emp: any) => ({
                  value: emp.employeeID || "",
                  label: emp.name || emp.employeeID || "",
                  tooltip: emp.name || emp.employeeID || "",
                }))}
                showOnlyValueInTrigger
                className="space-y-2"
                errorMessage={showErrors && errors.superviser ? (errors.superviser.message as string) : undefined}
                allowOnlyProvidedOptions
              />
              )}
            </div>
          </div>
        </div>

      </CardContent>
      {!isViewMode && currentMode === "edit" && (
        <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-gray-600">
            Save deployment history before updating deployment details.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={handleSaveHistory}
            disabled={postLoading || saveHistoryLoading || !auditStatusFormData}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <History className="h-4 w-4 mr-2" />
            Save History
          </Button>
        </div>
      )}
      <FormActionsFooter
        onPreviousTab={onPreviousTab}
        isViewMode={isViewMode}
        isValid={isValid}
        showErrors={showErrors}
        errorCount={Object.keys(errors).length}
        postLoading={postLoading || saveHistoryLoading}
        onSave={handleSave}
      />
    </Card>
  )
}