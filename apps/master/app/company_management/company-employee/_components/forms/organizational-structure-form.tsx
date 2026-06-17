"use client"

import SingleSelectField from "@/components/fields/single-select-field"
import type { EmploymentDetailsFieldsConfig, EmploymentDetailsFieldKey } from "../schemas/employment-details-schema"
import { useMemo } from "react"

interface OrganizationalStructureFormProps {
  subOrganization: any
  orgLoading: boolean
  isViewMode: boolean
  showErrors: boolean
  errors: any
  handleCodeChange: (section: string, subsection: string, code: string) => void
  watchedValues: any
  fieldsConfig?: EmploymentDetailsFieldsConfig
}

export function OrganizationalStructureForm({
  subOrganization,
  isViewMode,
  showErrors,
  errors,
  handleCodeChange,
  watchedValues,
  fieldsConfig = {},
}: OrganizationalStructureFormProps) {
  const fieldKeyMap: Record<
    | "subsidiary"
    | "division"
    | "department"
    | "subDepartment"
    | "section"
    | "employeeCategory"
    | "designation"
    | "grade"
    | "location"
    | "skillLevel",
    EmploymentDetailsFieldKey
  > = {
    subsidiary: "deployment.subsidiary.subsidiaryCode",
    division: "deployment.division.divisionCode",
    department: "deployment.department.departmentCode",
    subDepartment: "deployment.subDepartment.subDepartmentCode",
    section: "deployment.section.sectionCode",
    employeeCategory: "deployment.employeeCategory.employeeCategoryCode",
    designation: "deployment.designation.designationCode",
    grade: "deployment.grade.gradeCode",
    location: "deployment.location.locationCode",
    skillLevel: "deployment.skillLevel.skillLevelTitle",
  }

  const isFieldVisible = (section: keyof typeof fieldKeyMap) =>
    fieldsConfig[fieldKeyMap[section]]?.visible ?? true
  const isFieldRequired = (section: keyof typeof fieldKeyMap) =>
    fieldsConfig[fieldKeyMap[section]]?.required ?? true
  const getFieldLabel = (section: keyof typeof fieldKeyMap, fallback: string): string =>
    fieldsConfig[fieldKeyMap[section]]?.label || fallback

  const companionFieldKeyMap: Partial<
    Record<keyof typeof fieldKeyMap, EmploymentDetailsFieldKey>
  > = {
    subsidiary: "deployment.subsidiary.subsidiaryName",
    division: "deployment.division.divisionName",
    department: "deployment.department.departmentName",
    subDepartment: "deployment.subDepartment.subDepartmentName",
    section: "deployment.section.sectionName",
    employeeCategory: "deployment.employeeCategory.employeeCategoryTitle",
    designation: "deployment.designation.designationName",
    grade: "deployment.grade.gradeTitle",
    location: "deployment.location.locationName",
    skillLevel: "deployment.skillLevel.skillLevelDescription",
  }

  const getNestedError = (path: string) =>
    path.split(".").reduce<any>((acc, key) => (acc ? acc[key] : undefined), errors)

  const getFieldErrorMessage = (section: keyof typeof fieldKeyMap) => {
    if (!showErrors) return undefined
    const codeError = getNestedError(fieldKeyMap[section])?.message
    if (typeof codeError === "string" && codeError.trim()) return codeError
    const companionKey = companionFieldKeyMap[section]
    if (!companionKey) return undefined
    const companionError = getNestedError(companionKey)?.message
    if (typeof companionError === "string" && companionError.trim()) return companionError
    return undefined
  }

  const handleHierarchicalCodeChange = (section: string, subsection: string, code: string) => {
    if (subsection === "subsidiary" && code) {
      handleCodeChange("deployment", "division", "")
      handleCodeChange("deployment", "department", "")
      handleCodeChange("deployment", "subDepartment", "")
      handleCodeChange("deployment", "section", "")
      // Don't clear designation/grade as they are independent
    } else if (subsection === "division" && code) {
      handleCodeChange("deployment", "department", "")
      handleCodeChange("deployment", "subDepartment", "")
      handleCodeChange("deployment", "section", "")
      // Don't clear designation/grade as they are independent
    } else if (subsection === "department" && code) {
      handleCodeChange("deployment", "subDepartment", "")
      handleCodeChange("deployment", "section", "")
    } else if (subsection === "subDepartment" && code) {
      handleCodeChange("deployment", "section", "")
    }

    handleCodeChange(section, subsection, code)
  }

  const filteredDivisions = useMemo(() => {
    const subsidiaryCode = watchedValues?.deployment?.subsidiary?.subsidiaryCode
    if (!subsidiaryCode || !subOrganization.divisions) return []
    return subOrganization.divisions.filter((division: any) => division.subsidiaryCode === subsidiaryCode)
  }, [watchedValues?.deployment?.subsidiary?.subsidiaryCode, subOrganization.divisions])

  const filteredDepartments = useMemo(() => {
    const divisionCode = watchedValues?.deployment?.division?.divisionCode
    if (!divisionCode || !subOrganization.departments) return []
    return subOrganization.departments.filter((department: any) => department.divisionCode === divisionCode)
  }, [watchedValues?.deployment?.division?.divisionCode, subOrganization.departments])

  const filteredSubDepartments = useMemo(() => {
    const departmentCode = watchedValues?.deployment?.department?.departmentCode
    if (!departmentCode || !subOrganization.subDepartments) return []
    return subOrganization.subDepartments.filter((subDept: any) => subDept.departmentCode === departmentCode)
  }, [watchedValues?.deployment?.department?.departmentCode, subOrganization.subDepartments])

  const filteredSections = useMemo(() => {
    const subDepartmentCode = watchedValues?.deployment?.subDepartment?.subDepartmentCode
    const divisionCode = watchedValues?.deployment?.division?.divisionCode
    const subsidiaryCode = watchedValues?.deployment?.subsidiary?.subsidiaryCode
    if (!subDepartmentCode || !subOrganization.sections) return []
    return subOrganization.sections.filter(
      (section: any) =>
        section.subDepartmentCode === subDepartmentCode &&
        section.divisionCode === divisionCode &&
        section.subsidiaryCode === subsidiaryCode
    )
  }, [
    watchedValues?.deployment?.subDepartment?.subDepartmentCode,
    watchedValues?.deployment?.division?.divisionCode,
    watchedValues?.deployment?.subsidiary?.subsidiaryCode,
    subOrganization.sections,
  ])

  const filteredLocations = useMemo(() => {
    if (!subOrganization.location) return []
    const subsidiaryCode = watchedValues?.deployment?.subsidiary?.subsidiaryCode
    if (!subsidiaryCode) return subOrganization.location
    return subOrganization.location.filter(
      (location: any) => location.subsidiaryCode === subsidiaryCode || !location.subsidiaryCode
    )
  }, [watchedValues?.deployment?.subsidiary?.subsidiaryCode, subOrganization.location])

  const filteredDesignations = useMemo(() => {
    if (!subOrganization.designations) return []
    return subOrganization.designations
  }, [subOrganization.designations])

  const filteredGrades = useMemo(() => {
    if (!subOrganization.grades) return []
    return subOrganization.grades
  }, [subOrganization.grades])

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">Organizational Structure</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {isFieldVisible("subsidiary") && (
          <SingleSelectField
            id="subsidiaryCode"
            label={getFieldLabel("subsidiary", "Subsidiary Code")}
            required={isFieldRequired("subsidiary")}
            placeholder="Select Subsidiary Code"
            disabled={isViewMode}
            value={watchedValues?.deployment?.subsidiary?.subsidiaryCode}
            onChange={(value) => handleHierarchicalCodeChange("deployment", "subsidiary", value)}
            options={(subOrganization?.subsidiaries ?? []).map((o: any) => ({
              value: o.code || o.subsidiaryCode || "",
              label: o.name || o.subsidiaryName || "",
              tooltip: o.name || o.subsidiaryName || "",
            }))}
            showOnlyValueInTrigger
            className="space-y-2"
            errorMessage={getFieldErrorMessage("subsidiary")}
            allowOnlyProvidedOptions
          />
        )}

        {isFieldVisible("division") && (
          <SingleSelectField
            key={`division-${watchedValues?.deployment?.subsidiary?.subsidiaryCode || "none"}`}
            id="divisionCode"
            label={getFieldLabel("division", "Division Code")}
            required={isFieldRequired("division")}
            placeholder={!watchedValues?.deployment?.subsidiary?.subsidiaryCode ? "Select Subsidiary first" : "Select Division Code"}
            disabled={isViewMode || !watchedValues?.deployment?.subsidiary?.subsidiaryCode}
            value={watchedValues?.deployment?.division?.divisionCode}
            onChange={(value) => handleHierarchicalCodeChange("deployment", "division", value)}
            options={filteredDivisions.map((o: any) => ({
              value: o.code || o.divisionCode || "",
              label: o.name || o.divisionName || "",
              tooltip: o.name || o.divisionName || "",
            }))}
            showOnlyValueInTrigger
            className="space-y-2"
            errorMessage={getFieldErrorMessage("division")}
            allowOnlyProvidedOptions
          />
        )}

        {isFieldVisible("department") && (
          <SingleSelectField
            key={`department-${watchedValues?.deployment?.division?.divisionCode || "none"}`}
            id="departmentCode"
            label={getFieldLabel("department", "Department Code")}
            required={isFieldRequired("department")}
            placeholder={!watchedValues?.deployment?.division?.divisionCode ? "Select Division first" : "Select Department Code"}
            disabled={isViewMode}
            value={watchedValues?.deployment?.department?.departmentCode}
            onChange={(value) => handleHierarchicalCodeChange("deployment", "department", value)}
            options={filteredDepartments.map((o: any) => ({
              value: o.code || o.departmentCode || "",
              label: o.name || o.departmentName || "",
              tooltip: o.name || o.departmentName || "",
            }))}
            showOnlyValueInTrigger
            className="space-y-2"
            errorMessage={getFieldErrorMessage("department")}
            allowOnlyProvidedOptions
          />
        )}

        {isFieldVisible("subDepartment") && (
          <SingleSelectField
            key={`subDepartment-${watchedValues?.deployment?.department?.departmentCode || "none"}`}
            id="subDepartmentCode"
            label={getFieldLabel("subDepartment", "Sub Department Code")}
            required={isFieldRequired("subDepartment")}
            placeholder={!watchedValues?.deployment?.department?.departmentCode ? "Select Department first" : "Select Sub Department Code"}
            disabled={isViewMode || !watchedValues?.deployment?.department?.departmentCode}
            value={watchedValues?.deployment?.subDepartment?.subDepartmentCode}
            onChange={(value) => handleHierarchicalCodeChange("deployment", "subDepartment", value)}
            options={filteredSubDepartments.map((o: any) => ({
              value: o.code || o.subDepartmentCode || "",
              label: o.name || o.subDepartmentName || "",
              tooltip: o.name || o.subDepartmentName || "",
            }))}
            showOnlyValueInTrigger
            className="space-y-2"
            errorMessage={getFieldErrorMessage("subDepartment")}
            allowOnlyProvidedOptions
          />
        )}

        {isFieldVisible("section") && (
          <SingleSelectField
            key={`section-${watchedValues?.deployment?.subDepartment?.subDepartmentCode || "none"}`}
            id="sectionCode"
            label={getFieldLabel("section", "Section Code")}
            required={isFieldRequired("section")}
            placeholder={!watchedValues?.deployment?.subDepartment?.subDepartmentCode ? "Select Sub Department first" : "Select Section Code"}
            disabled={isViewMode || !watchedValues?.deployment?.subDepartment?.subDepartmentCode}
            value={watchedValues?.deployment?.section?.sectionCode}
            onChange={(value) => handleHierarchicalCodeChange("deployment", "section", value)}
            options={filteredSections.map((o: any) => ({
              value: o.code || o.sectionCode || "",
              label: o.name || o.sectionName || "",
              tooltip: o.name || o.sectionName || "",
            }))}
            showOnlyValueInTrigger
            className="space-y-2"
            errorMessage={getFieldErrorMessage("section")}
            allowOnlyProvidedOptions
          />
        )}

        {isFieldVisible("employeeCategory") && (
          <SingleSelectField
            id="employeeCategoryCode"
            label={getFieldLabel("employeeCategory", "Employee Category Code")}
            required={isFieldRequired("employeeCategory")}
            placeholder="Select Employee Category Code"
            disabled={isViewMode}
            value={watchedValues.deployment?.employeeCategory?.employeeCategoryCode}
            onChange={(value) => handleHierarchicalCodeChange("deployment", "employeeCategory", value)}
            options={(subOrganization?.employeeCategories ?? []).map((o: any) => ({
              value: o.code || o.employeeCategoryCode || "",
              label: o.title || o.employeeCategoryTitle || o.name || "",
              tooltip: o.title || o.employeeCategoryTitle || o.name || "",
            }))}
            showOnlyValueInTrigger
            className="space-y-2"
            errorMessage={getFieldErrorMessage("employeeCategory")}
            allowOnlyProvidedOptions
          />
        )}

        {isFieldVisible("designation") && (
          <SingleSelectField
            key={`designation`}
            id="designationCode"
            label={getFieldLabel("designation", "Designation Code")}
            required={isFieldRequired("designation")}
            placeholder="Select Designation Code"
            disabled={isViewMode}
            value={watchedValues?.deployment?.designation?.designationCode}
            onChange={(value) => handleHierarchicalCodeChange("deployment", "designation", value)}
            options={filteredDesignations.map((o: any) => ({
              value: o.code || o.designationCode || "",
              label: o.name || o.designationName || "",
              tooltip: o.name || o.designationName || "",
            }))}
            showOnlyValueInTrigger
            className="space-y-2"
            errorMessage={getFieldErrorMessage("designation")}
            allowOnlyProvidedOptions
          />
        )}

        {isFieldVisible("grade") && (
          <SingleSelectField
            key={`grade`}
            id="gradeCode"
            label={getFieldLabel("grade", "Grade Code")}
            required={isFieldRequired("grade")}
            placeholder="Select Grade Code"
            disabled={isViewMode}
            value={watchedValues?.deployment?.grade?.gradeCode}
            onChange={(value) => handleHierarchicalCodeChange("deployment", "grade", value)}
            options={filteredGrades.map((o: any) => ({
              value: o.code || o.gradeCode || "",
              label: o.title || o.gradeTitle || o.name || "",
              tooltip: o.title || o.gradeTitle || o.name || "",
            }))}
            showOnlyValueInTrigger
            className="space-y-2"
            errorMessage={getFieldErrorMessage("grade")}
            allowOnlyProvidedOptions
          />
        )}

        {isFieldVisible("location") && (
          <SingleSelectField
            key={`location-${watchedValues?.deployment?.subsidiary?.subsidiaryCode || "all"}`}
            id="locationCode"
            label={getFieldLabel("location", "Location Code")}
            required={isFieldRequired("location")}
            placeholder="Select Location Code"
            disabled={isViewMode}
            value={watchedValues?.deployment?.location?.locationCode}
            onChange={(value) => handleHierarchicalCodeChange("deployment", "location", value)}
            options={filteredLocations.map((o: any) => ({
              value: o.code || o.locationCode || "",
              label: o.name || o.locationName || "",
              tooltip: o.name || o.locationName || "",
            }))}
            showOnlyValueInTrigger
            className="space-y-2"
            errorMessage={getFieldErrorMessage("location")}
            allowOnlyProvidedOptions
          />
        )}

        {isFieldVisible("skillLevel") && (
          <SingleSelectField
            id="skillLevelTitle"
            label={getFieldLabel("skillLevel", "Skill Level")}
            required={isFieldRequired("skillLevel")}
            placeholder="Select Skill Level"
            disabled={isViewMode}
            value={watchedValues.deployment?.skillLevel?.skillLevelTitle}
            onChange={(value) => handleHierarchicalCodeChange("deployment", "skillLevel", value)}
            options={(subOrganization?.skillLevels ?? []).map((o: any) => ({
              value: o.title || o.skillLevelTitle || o.skilledLevelTitle || "",
              label: o.title || o.skillLevelTitle || o.skilledLevelTitle || "",
              tooltip: o.title || o.skillLevelTitle || o.skilledLevelTitle || "",
            }))}
            showOnlyValueInTrigger
            className="space-y-2"
            errorMessage={getFieldErrorMessage("skillLevel")}
            allowOnlyProvidedOptions
          />
        )}
      </div>
    </div>
  )
}

