"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Separator } from "@repo/ui/components/ui/separator";
import { Building2, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import { OrganizationalStructureForm } from "./organizational-structure-form";
import SingleSelectField from "@/components/fields/single-select-field";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useAggregateArrayFetch } from "@/hooks/api/search/use-aggregate-array-fetch";
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure";
import { usePostRequest } from "@repo/ui/hooks/api/usePostRequest";
import {
  createEmploymentDetailsSchema,
  normalizeEmploymentDetailsConfig,
  type EmploymentDetailsData,
  type EmploymentDetailsFieldKey,
  type EmploymentDetailsFieldsConfig,
  type EmploymentDetailsTabConfig,
} from "../schemas/employment-details-schema";
import { FormActionsFooter } from "../../../../../components/footer/form-actions-footer";
import { GradientFormHeader } from "../../../../../components/header/form-header";
import { SubFormTitle } from "../../../../../components/header/sub-form-title";
import { toast } from "react-toastify";
import { useKeyclockRoleInfo } from "@/hooks/api/search/keyclock-role-info"


interface EmploymentDetailsFormProps {
  employeeRecordId?: string | null;
  onNextTab?: () => void;
  onPreviousTab?: () => void;
  mode?: "add" | "edit" | "view";
  employeeSearchUrl?: string;
  employeeCollectionUrl?: string;
  onSaved?: () => void;
  onSubmit?: (data: any) => void;
}

export function EmploymentDetailsForm({
  employeeRecordId = null,
  onPreviousTab,
  mode,
  employeeSearchUrl = "contract_employee/search",
  employeeCollectionUrl = "contract_employee",
  onSaved,
}: EmploymentDetailsFormProps) {
  const fieldClassName = (hasError: boolean, disabled: boolean) =>
    `h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white ${
      disabled ? "bg-gray-100 cursor-not-allowed" : ""
    } ${hasError ? "border-red-500 focus:border-red-500" : ""}`;

  const [auditStatusFormData, setAuditStatusFormData] = useState<any>(null);
  const [showErrors, setShowErrors] = useState(false);
  const [subOrganization, setSubOrganization] = useState<any>({});
  const [companyEmpData, setCompanyEmpData] = useState<any[]>([]);
    const { employeeId: loginEmployeeId } = useKeyclockRoleInfo()

  const tenantCode = useGetTenantCode();
  const { formStructure } = useCollectionFormStructure({
    collectionName: "company_employee_form_structure",
  });

  const { post: postEmploymentDetails, loading: postLoading } =
    usePostRequest<any>({
      url: employeeCollectionUrl,
      onSuccess: (response) => {
        const status = response?.status ?? response?.data?.status ?? true;
        if (!status) {
          setShowErrors(true);
          const responseData =
            response?.data && typeof response.data === "object"
              ? response.data
              : response;

          const applyFieldError = (fieldName: string, message: string) => {
            const normalized = fieldName.trim();
            if (!normalized || !message.trim()) return;
            setError(normalized as any, {
              type: "server",
              message,
            });
          };

          if (responseData && typeof responseData === "object") {
            Object.entries(responseData).forEach(([fieldName, message]) => {
              if (
                fieldName === "status" ||
                fieldName === "_id" ||
                fieldName === "id"
              )
                return;

              if (typeof message === "string") {
                applyFieldError(fieldName, message);
                return;
              }

              if (message && typeof message === "object") {
                Object.entries(message as Record<string, unknown>).forEach(
                  ([childKey, childValue]) => {
                    if (typeof childValue !== "string") return;
                    applyFieldError(`${fieldName}.${childKey}`, childValue);
                  },
                );
              }
            });
          }
          return;
        }

        toast.success("Employee data saved successfully!");
        void fetchEmployee();
        onSaved?.();
      },
      onError: (error) => {
        console.error("Error saving employment details:", error);
      },
    });

  const employmentDetailsConfig = useMemo(
    () =>
      normalizeEmploymentDetailsConfig(
        (formStructure?.employmentDetails as
          | EmploymentDetailsFieldsConfig
          | EmploymentDetailsTabConfig
          | undefined) ?? undefined,
      ),
    [formStructure],
  );

  const employmentDetailsSchema = useMemo(
    () =>
      createEmploymentDetailsSchema({
        tabRequired: employmentDetailsConfig.tabRequired,
        fields: employmentDetailsConfig.fields,
      }),
    [employmentDetailsConfig],
  );

  const isFieldVisible = (field: EmploymentDetailsFieldKey) =>
    employmentDetailsConfig.fields[field]?.visible ?? true;

  const isFieldRequired = (
    field: EmploymentDetailsFieldKey,
    requiredByDefault = false,
  ) => employmentDetailsConfig.fields[field]?.required ?? requiredByDefault;

  const getFieldLabel = (field: EmploymentDetailsFieldKey, fallback: string) =>
    employmentDetailsConfig.fields[field]?.label || fallback;

  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const resolvedEmployeeRecordId = employeeRecordId || id;
  const currentMode = mode ?? "add";
  const isViewMode = currentMode === "view";

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
    [tenantCode],
  );

  const {
    arrayData: subsidiariesArray,
    loading: subsidiariesLoading,
    error: subsidiariesError,
    refetch: refetchSubsidiaries,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subsidiaries",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  });
  const {
    arrayData: divisionsArray,
    loading: divisionsLoading,
    error: divisionsError,
    refetch: refetchDivisions,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "divisions",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  });
  const {
    arrayData: departmentsArray,
    loading: departmentsLoading,
    error: departmentsError,
    refetch: refetchDepartments,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "departments",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  });
  const {
    arrayData: subDepartmentsArray,
    loading: subDepartmentsLoading,
    error: subDepartmentsError,
    refetch: refetchSubDepartments,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "subDepartments",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  });
  const {
    arrayData: sectionsArray,
    loading: sectionsLoading,
    error: sectionsError,
    refetch: refetchSections,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "sections",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  });
  const {
    arrayData: employeeCategoriesArray,
    loading: employeeCategoriesLoading,
    error: employeeCategoriesError,
    refetch: refetchEmployeeCategories,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "employeeCategories",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  });
  const {
    arrayData: gradesArray,
    loading: gradesLoading,
    error: gradesError,
    refetch: refetchGrades,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "grades",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  });
  const {
    arrayData: designationsArray,
    loading: designationsLoading,
    error: designationsError,
    refetch: refetchDesignations,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "designations",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  });
  const {
    arrayData: locationsArray,
    loading: locationsLoading,
    error: locationsError,
    refetch: refetchLocations,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "location",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  });
  const {
    arrayData: skillLevelsArray,
    loading: skillLevelsLoading,
    error: skillLevelsError,
    refetch: refetchSkillLevels,
  } = useAggregateArrayFetch<any>({
    collection: "organization",
    criteriaRequests: organizationCriteriaRequests,
    arrayField: "skillLevels",
    enabled: Boolean(tenantCode),
    defaultValue: [],
  });

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
    skillLevelsLoading;

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
    skillLevelsError;

  useEffect(() => {
    if (!tenantCode) return;
    void refetchSubsidiaries();
    void refetchDivisions();
    void refetchDepartments();
    void refetchSubDepartments();
    void refetchSections();
    void refetchEmployeeCategories();
    void refetchGrades();
    void refetchDesignations();
    void refetchLocations();
    void refetchSkillLevels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantCode]);

  useEffect(() => {
    if (orgError) {
      console.error("Error loading organization data:", orgError);
    }
  }, [orgError]);

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
      skillLevels: skillLevelsArray || [],
    });
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
    skillLevelsArray,
  ]);

  const companyEmployeeCriteria = useMemo(
    () =>
      tenantCode
        ? [
            {
              field: "tenantCode",
              value: tenantCode,
              operator: "eq",
            },
            { field: "manager", operator: "ne", value: loginEmployeeId },
          ]
        : [],
    [tenantCode],
  );

  const { refetch: fetchCompanyEmp } = useRequest<any[]>({
    url: "company_employee/search",
    method: "POST",
    data: companyEmployeeCriteria,
    onSuccess: (data: any) => {
      const activeCompanyEmp = (data || []).filter(
        (rec: any) => rec?.isDeleted !== true,
      );
      setCompanyEmpData(activeCompanyEmp);
    },
  });

  useEffect(() => {
    if (!tenantCode) return;
    fetchCompanyEmp();
  }, [tenantCode]);

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
        setAuditStatusFormData(data[0]);
      }
    },
    onError: (error) => {
      console.error("Error fetching employee data:", error);
    },
    dependencies: [resolvedEmployeeRecordId, employeeSearchUrl],
  });

  useEffect(() => {
    if (!resolvedEmployeeRecordId || currentMode === "add") return;
    void fetchEmployee();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedEmployeeRecordId, currentMode, employeeSearchUrl]);

  const {
    register,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
    setError,
    clearErrors,
  } = useForm<EmploymentDetailsData>({
    resolver: zodResolver(employmentDetailsSchema),
    defaultValues: {
      manager: auditStatusFormData?.manager || "",
      wasContractEmployee: auditStatusFormData?.wasContractEmployee ?? false,
      deployment: {
        subsidiary: {
          subsidiaryCode:
            auditStatusFormData?.deployment?.subsidiary?.subsidiaryCode || "",
          subsidiaryName:
            auditStatusFormData?.deployment?.subsidiary?.subsidiaryName || "",
        },
        division: {
          divisionCode:
            auditStatusFormData?.deployment?.division?.divisionCode || "",
          divisionName:
            auditStatusFormData?.deployment?.division?.divisionName || "",
        },
        department: {
          departmentCode:
            auditStatusFormData?.deployment?.department?.departmentCode || "",
          departmentName:
            auditStatusFormData?.deployment?.department?.departmentName || "",
        },
        subDepartment: {
          subDepartmentCode:
            auditStatusFormData?.deployment?.subDepartment?.subDepartmentCode ||
            "",
          subDepartmentName:
            auditStatusFormData?.deployment?.subDepartment?.subDepartmentName ||
            "",
        },
        section: {
          sectionCode:
            auditStatusFormData?.deployment?.section?.sectionCode || "",
          sectionName:
            auditStatusFormData?.deployment?.section?.sectionName || "",
        },
        employeeCategory: {
          employeeCategoryCode:
            auditStatusFormData?.deployment?.employeeCategory
              ?.employeeCategoryCode || "",
          employeeCategoryTitle:
            auditStatusFormData?.deployment?.employeeCategory
              ?.employeeCategoryTitle ||
            auditStatusFormData?.deployment?.employeeCategory
              ?.employeeCategoryName ||
            "",
        },
        grade: {
          gradeCode: auditStatusFormData?.deployment?.grade?.gradeCode || "",
          gradeTitle:
            auditStatusFormData?.deployment?.grade?.gradeTitle ||
            auditStatusFormData?.deployment?.grade?.gradeName ||
            "",
        },
        designation: {
          designationCode:
            auditStatusFormData?.deployment?.designation?.designationCode || "",
          designationName:
            auditStatusFormData?.deployment?.designation?.designationName || "",
        },
        location: {
          locationCode:
            auditStatusFormData?.deployment?.location?.locationCode || "",
          locationName:
            auditStatusFormData?.deployment?.location?.locationName || "",
        },
        skillLevel: {
          skillLevelTitle:
            auditStatusFormData?.deployment?.skillLevel?.skillLevelTitle ||
            auditStatusFormData?.deployment?.skillLevel?.skilledLevelTitle ||
            "",
          skillLevelDescription:
            auditStatusFormData?.deployment?.skillLevel
              ?.skillLevelDescription ||
            auditStatusFormData?.deployment?.skillLevel
              ?.skilledLevelDescription ||
            "",
        },
        effectiveFrom: auditStatusFormData?.deployment?.effectiveFrom || "",
        remark: auditStatusFormData?.deployment?.remark || "",
      },
    },
    mode: "onChange",
  });

  const watchedValues = watch();

  useEffect(() => {
    const effectiveFrom = watchedValues.deployment?.effectiveFrom;
    const birthDate = auditStatusFormData?.birthDate;
    if (effectiveFrom && birthDate) {
      if (new Date(effectiveFrom) < new Date(birthDate)) {
        setError("deployment.effectiveFrom", {
          type: "manual",
          message: "Effective From date must be after Date of Birth",
        });
      } else {
        clearErrors("deployment.effectiveFrom");
      }
    }
  }, [watchedValues.deployment?.effectiveFrom, auditStatusFormData?.birthDate, setError, clearErrors]);

  useEffect(() => {
    if (!auditStatusFormData) return;

    setValue("manager", auditStatusFormData.manager || "");
    setValue(
      "wasContractEmployee",
      auditStatusFormData.wasContractEmployee ?? false,
    );
    setValue("deployment", {
      subsidiary: {
        subsidiaryCode:
          auditStatusFormData?.deployment?.subsidiary?.subsidiaryCode || "",
        subsidiaryName:
          auditStatusFormData?.deployment?.subsidiary?.subsidiaryName || "",
      },
      division: {
        divisionCode:
          auditStatusFormData?.deployment?.division?.divisionCode || "",
        divisionName:
          auditStatusFormData?.deployment?.division?.divisionName || "",
      },
      department: {
        departmentCode:
          auditStatusFormData?.deployment?.department?.departmentCode || "",
        departmentName:
          auditStatusFormData?.deployment?.department?.departmentName || "",
      },
      subDepartment: {
        subDepartmentCode:
          auditStatusFormData?.deployment?.subDepartment?.subDepartmentCode ||
          "",
        subDepartmentName:
          auditStatusFormData?.deployment?.subDepartment?.subDepartmentName ||
          "",
      },
      section: {
        sectionCode:
          auditStatusFormData?.deployment?.section?.sectionCode || "",
        sectionName:
          auditStatusFormData?.deployment?.section?.sectionName || "",
      },
      employeeCategory: {
        employeeCategoryCode:
          auditStatusFormData?.deployment?.employeeCategory
            ?.employeeCategoryCode || "",
        employeeCategoryTitle:
          auditStatusFormData?.deployment?.employeeCategory
            ?.employeeCategoryTitle ||
          auditStatusFormData?.deployment?.employeeCategory
            ?.employeeCategoryName ||
          "",
      },
      grade: {
        gradeCode: auditStatusFormData?.deployment?.grade?.gradeCode || "",
        gradeTitle:
          auditStatusFormData?.deployment?.grade?.gradeTitle ||
          auditStatusFormData?.deployment?.grade?.gradeName ||
          "",
      },
      designation: {
        designationCode:
          auditStatusFormData?.deployment?.designation?.designationCode || "",
        designationName:
          auditStatusFormData?.deployment?.designation?.designationName || "",
      },
      location: {
        locationCode:
          auditStatusFormData?.deployment?.location?.locationCode || "",
        locationName:
          auditStatusFormData?.deployment?.location?.locationName || "",
      },
      skillLevel: {
        skillLevelTitle:
          auditStatusFormData?.deployment?.skillLevel?.skillLevelTitle ||
          auditStatusFormData?.deployment?.skillLevel?.skilledLevelTitle ||
          "",
        skillLevelDescription:
          auditStatusFormData?.deployment?.skillLevel?.skillLevelDescription ||
          auditStatusFormData?.deployment?.skillLevel
            ?.skilledLevelDescription ||
          "",
      },
      effectiveFrom: auditStatusFormData?.deployment?.effectiveFrom || "",
      remark: auditStatusFormData?.deployment?.remark || "",
    });
    void trigger();
  }, [auditStatusFormData, setValue, trigger]);

  const handleCodeChange = (
    section: string,
    subsection: string,
    code: string,
  ) => {
    let name = "";

    if (subOrganization) {
      switch (subsection) {
        case "subsidiary": {
          const subsidiary = subOrganization.subsidiaries?.find(
            (opt: any) => opt.code === code || opt.subsidiaryCode === code,
          );
          name = subsidiary?.name || subsidiary?.subsidiaryName || "";
          setValue("deployment.division.divisionCode", "");
          setValue("deployment.division.divisionName", "");
          setValue("deployment.department.departmentCode", "");
          setValue("deployment.department.departmentName", "");
          setValue("deployment.subDepartment.subDepartmentCode", "");
          setValue("deployment.subDepartment.subDepartmentName", "");
          setValue("deployment.section.sectionCode", "");
          setValue("deployment.section.sectionName", "");

          break;
        }
        case "division": {
          const division = subOrganization.divisions?.find(
            (opt: any) => opt.code === code || opt.divisionCode === code,
          );
          name = division?.name || division?.divisionName || "";
          setValue("deployment.department.departmentCode", "");
          setValue("deployment.department.departmentName", "");
          setValue("deployment.subDepartment.subDepartmentCode", "");
          setValue("deployment.subDepartment.subDepartmentName", "");
          setValue("deployment.section.sectionCode", "");
          setValue("deployment.section.sectionName", "");

          break;
        }
        case "department": {
          const department = subOrganization.departments?.find(
            (opt: any) => opt.code === code || opt.departmentCode === code,
          );
          name = department?.name || department?.departmentName || "";
          setValue("deployment.subDepartment.subDepartmentCode", "");
          setValue("deployment.subDepartment.subDepartmentName", "");
          setValue("deployment.section.sectionCode", "");
          setValue("deployment.section.sectionName", "");
          break;
        }
        case "subDepartment": {
          const subDept = subOrganization.subDepartments?.find(
            (opt: any) => opt.code === code || opt.subDepartmentCode === code,
          );
          name = subDept?.name || subDept?.subDepartmentName || "";
          setValue("deployment.section.sectionCode", "");
          setValue("deployment.section.sectionName", "");
          break;
        }
        case "section": {
          const section = subOrganization.sections?.find(
            (opt: any) => opt.code === code || opt.sectionCode === code,
          );
          name = section?.name || section?.sectionName || "";
          break;
        }
        case "employeeCategory": {
          const category = subOrganization.employeeCategories?.find(
            (opt: any) =>
              opt.code === code || opt.employeeCategoryCode === code,
          );
          name =
            category?.title ||
            category?.employeeCategoryTitle ||
            category?.name ||
            "";
          break;
        }
        case "grade": {
          const grade = subOrganization.grades?.find(
            (opt: any) => opt.code === code || opt.gradeCode === code,
          );
          name = grade?.title || grade?.gradeTitle || grade?.name || "";
          break;
        }
        case "designation": {
          const designation = subOrganization.designations?.find(
            (opt: any) => opt.code === code || opt.designationCode === code,
          );
          name = designation?.name || designation?.designationName || "";
          break;
        }
        case "location": {
          const location = subOrganization.location?.find(
            (opt: any) => opt.code === code || opt.locationCode === code,
          );
          name = location?.name || location?.locationName || "";
          break;
        }
        case "skillLevel": {
          const skillLevel = subOrganization.skillLevels?.find(
            (opt: any) =>
              opt.title === code ||
              opt.skillLevelTitle === code ||
              opt.skilledLevelTitle === code,
          );
          name =
            skillLevel?.description ||
            skillLevel?.skillLevelDescription ||
            skillLevel?.skilledLevelDescription ||
            "";
          // Schema requires description; fallback to selected title when description is absent.
          if (!name && code) {
            name = code;
          }
          break;
        }
      }
    }

    // Some datasets provide code only; keep required name/title fields non-empty.
    if (!name && code) {
      name = code;
    }

    if (section === "deployment") {
      switch (subsection) {
        case "subsidiary":
          setValue("deployment.subsidiary.subsidiaryCode", code);
          setValue("deployment.subsidiary.subsidiaryName", name);
          void trigger("deployment.subsidiary.subsidiaryCode");
          break;
        case "division":
          setValue("deployment.division.divisionCode", code);
          setValue("deployment.division.divisionName", name);
          void trigger("deployment.division.divisionCode");
          break;
        case "department":
          setValue("deployment.department.departmentCode", code);
          setValue("deployment.department.departmentName", name);
          void trigger("deployment.department.departmentCode");
          break;
        case "subDepartment":
          setValue("deployment.subDepartment.subDepartmentCode", code);
          setValue("deployment.subDepartment.subDepartmentName", name);
          void trigger("deployment.subDepartment.subDepartmentCode");
          break;
        case "section":
          setValue("deployment.section.sectionCode", code);
          setValue("deployment.section.sectionName", name);
          void trigger("deployment.section.sectionCode");
          break;
        case "employeeCategory":
          setValue("deployment.employeeCategory.employeeCategoryCode", code);
          setValue("deployment.employeeCategory.employeeCategoryTitle", name);
          void trigger("deployment.employeeCategory.employeeCategoryCode");
          break;
        case "grade":
          setValue("deployment.grade.gradeCode", code);
          setValue("deployment.grade.gradeTitle", name);
          void trigger("deployment.grade.gradeCode");
          break;
        case "designation":
          setValue("deployment.designation.designationCode", code);
          setValue("deployment.designation.designationName", name);
          void trigger("deployment.designation.designationCode");
          break;
        case "location":
          setValue("deployment.location.locationCode", code);
          setValue("deployment.location.locationName", name);
          void trigger("deployment.location.locationCode");
          break;
        case "skillLevel":
          setValue("deployment.skillLevel.skillLevelTitle", code);
          setValue("deployment.skillLevel.skillLevelDescription", name);
          void trigger("deployment.skillLevel.skillLevelTitle");
          break;
      }
    }
  };

  const handleSave = async () => {
    setShowErrors(true);
    const valid = await trigger();
    if (!valid) return;

    const formValues = watch();
    const effectiveFrom = formValues.deployment?.effectiveFrom;
    const birthDate = auditStatusFormData?.birthDate;
    if (effectiveFrom && birthDate && new Date(effectiveFrom) < new Date(birthDate)) {
      setError("deployment.effectiveFrom", {
        type: "manual",
        message: "Effective From date must be after Date of Birth",
      });
      return;
    }

    const isEditMode =
      currentMode === "edit" && Boolean(resolvedEmployeeRecordId);
    const isDraftMode = employeeSearchUrl == "draft/company_employee/search";
    const payload = {
      tenant: tenantCode,
      action: isEditMode ? "update" : "insert",
      ...(isEditMode ? { id: resolvedEmployeeRecordId } : {}),
      collectionName: "company_employee",
      event: "validate",
      ruleId: "",
      data: {
        ...formValues,
        ...(isDraftMode
          ? {
              employmentDetailstab: true,
            }
          : {}),
      },
    };
    postEmploymentDetails(payload);
  };

  return (
    <Card className="w-full border border-gray-200 shadow-sm overflow-hidden">
      {postLoading && (
        <div className="fixed inset-0 z-50 bg-black/10 backdrop-blur-[1px] flex items-center justify-center">
          <div className="rounded-md bg-white shadow px-4 py-2 text-sm font-medium text-gray-700 flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Saving employment details...</span>
          </div>
        </div>
      )}

      <GradientFormHeader
        icon={Building2}
        title="Employment Details"
        description="Employment deployment information"
      />

      <CardContent className="flex-1 px-6 py-4 space-y-4 overflow-y-auto">
        {showErrors && Object.keys(errors).length > 0 && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Please fix highlighted fields before continuing.
          </div>
        )}

        <div className="space-y-8">
          <div>
            <SubFormTitle title="Employment Status" className="mb-2" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {isFieldVisible("wasContractEmployee") && (
                <div className="space-y-2 group">
                  <Label
                    htmlFor="wasContractEmployee"
                    className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                  >
                    {getFieldLabel(
                      "wasContractEmployee",
                      "Was Contract Employee",
                    )}{" "}
                    {isFieldRequired("wasContractEmployee", true) && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <Select
                    value={String(watchedValues.wasContractEmployee ?? false)}
                    onValueChange={(value) => {
                      setValue("wasContractEmployee", value === "true");
                      void trigger("wasContractEmployee");
                    }}
                    disabled={isViewMode}
                  >
                    <SelectTrigger
                      className={fieldClassName(
                        Boolean(showErrors && errors.wasContractEmployee),
                        isViewMode,
                      )}
                    >
                      <SelectValue placeholder="Select option" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2 bg-white">
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                  {showErrors && errors.wasContractEmployee && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.wasContractEmployee.message as string}
                    </p>
                  )}
                </div>
              )}

              {isFieldVisible("deployment.effectiveFrom") && (
                <div className="space-y-2 group">
                  <Label
                    htmlFor="effectiveFrom"
                    className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                  >
                    {getFieldLabel(
                      "deployment.effectiveFrom",
                      "Effective From",
                    )}{" "}
                    {isFieldRequired("deployment.effectiveFrom") && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <Input
                    id="effectiveFrom"
                    type="date"
                    {...register("deployment.effectiveFrom")}
                    disabled={isViewMode}
                    min={auditStatusFormData?.birthDate || undefined}
                    className={fieldClassName(
                      Boolean(showErrors && errors.deployment?.effectiveFrom),
                      isViewMode,
                    )}
                  />
                  {showErrors && errors.deployment?.effectiveFrom && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.deployment.effectiveFrom.message as string}
                    </p>
                  )}
                </div>
              )}

              {isFieldVisible("deployment.remark") && (
                <div className="space-y-2 group">
                  <Label
                    htmlFor="remark"
                    className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
                  >
                    {getFieldLabel("deployment.remark", "Remark")}{" "}
                    {isFieldRequired("deployment.remark") && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <Input
                    id="remark"
                    {...register("deployment.remark")}
                    disabled={isViewMode}
                    className={fieldClassName(
                      Boolean(showErrors && errors.deployment?.remark),
                      isViewMode,
                    )}
                    placeholder="Enter remark"
                  />
                  {showErrors && errors.deployment?.remark && (
                    <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                      <X className="h-3 w-3" />
                      {errors.deployment.remark.message as string}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          <OrganizationalStructureForm
            subOrganization={subOrganization}
            orgLoading={orgLoading}
            isViewMode={isViewMode}
            showErrors={showErrors}
            errors={errors}
            handleCodeChange={handleCodeChange}
            watchedValues={watchedValues}
            fieldsConfig={employmentDetailsConfig.fields}
          />

          <Separator />

          <div>
            <SubFormTitle title="Management Hierarchy" className="mb-2" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {isFieldVisible("manager") && (
                <SingleSelectField
                  id="manager"
                  label={getFieldLabel("manager", "Manager")}
                  required={isFieldRequired("manager", true)}
                  placeholder="Search Manager (Employee ID)"
                  disabled={isViewMode}
                  value={watchedValues.manager || ""}
                  onChange={(val) => {
                    setValue("manager", val);
                    void trigger("manager");
                  }}
                  options={(companyEmpData ?? []).map((emp: any) => ({
                    value: emp.employeeID || "",
                    label: emp.name || "",
                    tooltip: emp.name || "",
                  }))}
                  showOnlyValueInTrigger
                  className="space-y-2"
                  errorMessage={
                    showErrors && (errors as any).manager
                      ? ((errors as any).manager.message as string)
                      : undefined
                  }
                  allowOnlyProvidedOptions
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>

      <FormActionsFooter
        onPreviousTab={onPreviousTab}
        isViewMode={isViewMode}
        isValid={isValid}
        showErrors={showErrors}
        errorCount={Object.keys(errors).length}
        postLoading={postLoading}
        onSave={handleSave}
      />
    </Card>
  );
}
