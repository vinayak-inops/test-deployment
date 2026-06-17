"use client"

import type React from "react"
import SingleSelectField from "@/components/fields/single-select-field"
import { Label } from "@repo/ui/components/ui/label"
import { Input } from "@repo/ui/components/ui/input"
import { Button } from "@repo/ui/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@repo/ui/components/ui/command"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import type { EmploymentDetailsFieldsConfig, EmploymentDetailsFieldKey } from "../schemas/employment-details-schema"
import { useEffect, useMemo, useState } from "react"
import { X, Check, Trash2, Filter, Search as SearchIcon } from "lucide-react"

interface OrganizationalStructureFormProps {
  subOrganization: any
  orgLoading: boolean
  contractorLoading?: boolean
  isViewMode: boolean
  showErrors: boolean
  errors: any
  handleCodeChange: (section: string, subsection: string, code: string) => void
  watchedValues: any
  contractorData: any
  onAreasChange: (codes: string[]) => void
  currentMode?: "add" | "edit" | "view"
  fieldsConfig?: EmploymentDetailsFieldsConfig
  birthDate?: string
}

export function OrganizationalStructureForm({
  subOrganization,
  orgLoading,
  contractorLoading,
  isViewMode,
  showErrors,
  errors,
  handleCodeChange,
  watchedValues,
  contractorData,
  onAreasChange,
  currentMode = "add",
  fieldsConfig = {},
  birthDate,
}: OrganizationalStructureFormProps) {
  const [addAreaOpen, setAddAreaOpen] = useState(false)
  const [areaSearchTerm, setAreaSearchTerm] = useState("")
  const [addAreaSearchTerm, setAddAreaSearchTerm] = useState("")
  const [areaSearchField, setAreaSearchField] = useState<"code" | "name">("name")
  const [areaPage, setAreaPage] = useState(1)

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
    | "areas"
    | "skillLevel"
    | "contractor"
    | "salaryZone"
    | "effectiveFrom",
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
    areas: "deployment.areas",
    skillLevel: "deployment.skillLevel.skilledLevelTitle",
    contractor: "deployment.contractor.contractorCode",
    salaryZone: "deployment.salaryZone",
    effectiveFrom: "deployment.effectiveFrom",
  }

  const isFieldVisible = (section: keyof typeof fieldKeyMap) =>
    fieldsConfig[fieldKeyMap[section]]?.visible ?? true
  const isFieldRequired = (section: keyof typeof fieldKeyMap) =>
    fieldsConfig[fieldKeyMap[section]]?.required ?? true
  const getFieldLabel = (section: keyof typeof fieldKeyMap, fallback: string) =>
    fieldsConfig[fieldKeyMap[section]]?.label || fallback

  // Enhanced handleCodeChange that clears dependent fields and auto-fills names
  const handleHierarchicalCodeChange = (section: string, subsection: string, code: string) => {
    
    // Clear dependent fields based on hierarchy - works for both add and edit modes
    if (subsection === "subsidiary" && code) {
      // Clear all dependent fields when subsidiary changes
      handleCodeChange("deployment", "division", "")
      handleCodeChange("deployment", "department", "")
      handleCodeChange("deployment", "subDepartment", "")
      handleCodeChange("deployment", "section", "")
      // Don't clear location/designation/grade as they are independent
    } else if (subsection === "division" && code) {
      // Clear dependent fields when division changes
      handleCodeChange("deployment", "department", "")
      handleCodeChange("deployment", "subDepartment", "")
      handleCodeChange("deployment", "section", "")
      // Don't clear designation/grade as they are independent
    } else if (subsection === "department" && code) {
      // Clear dependent fields when department changes
      handleCodeChange("deployment", "subDepartment", "")
      handleCodeChange("deployment", "section", "")
    } else if (subsection === "subDepartment" && code) {
      // Clear dependent fields when subDepartment changes
      handleCodeChange("deployment", "section", "")
    } else if (subsection === "contractor" && code) {
      // For contractor, we need to find the name from contractorData and update both code and name
      let contractorName = ""
      if (contractorData && contractorData.length > 0) {
        const contractor = contractorData.find((opt: any) => 
          (opt.code === code) || (opt.contractorCode === code)
        )
        contractorName = contractor?.name || contractor?.contractorName || ""
      }
      
      // Update both contractor code and name using the parent handleCodeChange
      // This will trigger the parent's logic to update the form values
      handleCodeChange(section, subsection, code)
      
      // If we found the contractor name, we can also update it directly for immediate UI feedback
      if (contractorName) {
        // parent handler will set name
      }
      return // Exit early since we've already called handleCodeChange
    }
    
    // Set the selected value - the parent handleCodeChange will handle name auto-filling
    handleCodeChange(section, subsection, code)
  }
  
  // Computed filtered arrays based on selections
  const filteredDivisions = useMemo(() => {
    const subsidiaryCode = watchedValues?.deployment?.subsidiary?.subsidiaryCode;
    if (!subsidiaryCode || !subOrganization.divisions) {
      return [];
    }
    return subOrganization.divisions.filter((division: any) => 
      division.subsidiaryCode === subsidiaryCode
    );
  }, [watchedValues?.deployment?.subsidiary?.subsidiaryCode, subOrganization.divisions, currentMode]);

  const filteredDepartments = useMemo(() => {
    const divisionCode = watchedValues?.deployment?.division?.divisionCode;
    if (!divisionCode || !subOrganization.departments) {
      return [];
    }
    return subOrganization.departments.filter((department: any) => 
      department.divisionCode === divisionCode
    );
  }, [watchedValues?.deployment?.division?.divisionCode, subOrganization.departments, currentMode]);

  const filteredSubDepartments = useMemo(() => {
    const departmentCode = watchedValues?.deployment?.department?.departmentCode;
    if (!departmentCode || !subOrganization.subDepartments) {
      return [];
    }
    return subOrganization.subDepartments.filter((subDept: any) => 
      subDept.departmentCode === departmentCode
    );
  }, [watchedValues?.deployment?.department?.departmentCode, subOrganization.subDepartments, currentMode]);

  const filteredSections = useMemo(() => {
    const subDepartmentCode = watchedValues?.deployment?.subDepartment?.subDepartmentCode;
    const divisionCode = watchedValues?.deployment?.division?.divisionCode;
    const subsidiaryCode = watchedValues?.deployment?.subsidiary?.subsidiaryCode;
    
    if (!subDepartmentCode || !subOrganization.sections) {
      return [];
    }
    return subOrganization.sections.filter((section: any) => 
      section.subDepartmentCode === subDepartmentCode &&
      section.divisionCode === divisionCode &&
      section.subsidiaryCode === subsidiaryCode
    );
  }, [watchedValues?.deployment?.subDepartment?.subDepartmentCode, watchedValues?.deployment?.division?.divisionCode, watchedValues?.deployment?.subsidiary?.subsidiaryCode, subOrganization.sections, currentMode]);

  // Filtered locations based on subsidiary
  const filteredLocations = useMemo(() => {
    if (!subOrganization.location) {
      return [];
    }
    
    const subsidiaryCode = watchedValues?.deployment?.subsidiary?.subsidiaryCode;
    
    // If no subsidiary is selected, show all locations
    if (!subsidiaryCode) {
      return subOrganization.location;
    }
    
    return subOrganization.location.filter((location: any) => 
      location.subsidiaryCode === subsidiaryCode || 
      !location.subsidiaryCode // Include locations that don't have subsidiary restriction
    );
  }, [watchedValues?.deployment?.subsidiary?.subsidiaryCode, subOrganization.location, currentMode]);

  // Designation is independent
  const filteredDesignations = useMemo(() => {
    if (!subOrganization.designations) {
      return [];
    }
    return subOrganization.designations;
  }, [subOrganization.designations, currentMode]);

  // Grade is independent
  const filteredGrades = useMemo(() => {
    if (!subOrganization.grades) {
      return [];
    }
    return subOrganization.grades;
  }, [subOrganization.grades, currentMode]);

  const normalizeAreaCodes = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    }
    if (typeof value === "string" && value.trim().length > 0) {
      return [value]
    }
    return []
  }

  const selectedAreaCodes = normalizeAreaCodes(watchedValues?.deployment?.areas)

  const filteredAreas = useMemo(() => {
    const allAreas = Array.isArray(subOrganization?.areas) ? subOrganization.areas : []
    const subsidiaryCode = watchedValues?.deployment?.subsidiary?.subsidiaryCode

    const scopedAreas = subsidiaryCode
      ? allAreas.filter((area: any) => area?.subsidiaryCode === subsidiaryCode || !area?.subsidiaryCode)
      : allAreas

    return scopedAreas.filter((area: any) => {
      const areaCode = area?.code || area?.areaCode || ""
      return areaCode && !selectedAreaCodes.includes(areaCode)
    })
  }, [subOrganization?.areas, watchedValues?.deployment?.subsidiary?.subsidiaryCode, selectedAreaCodes]);

  const handleAreaRemove = (areaCode: string) => {
    onAreasChange(selectedAreaCodes.filter((code) => code !== areaCode))
  }

  const selectedAreaItems = useMemo(
    () =>
      selectedAreaCodes.map((code) => {
        const found = (subOrganization?.areas || []).find(
          (item: any) => (item?.code || item?.areaCode || "") === code
        )
        return {
          code,
          name: found?.name || found?.areaName || "Unknown",
        }
      }),
    [selectedAreaCodes, subOrganization?.areas]
  )

  const availableAreaOptions = useMemo(
    () => filteredAreas.map((item: any) => ({
      code: item?.code || item?.areaCode || "",
      name: item?.name || item?.areaName || "",
    })),
    [filteredAreas]
  )

  const pageSize = 5

  const filteredSelectedAreas = useMemo(() => {
    const q = areaSearchTerm.toLowerCase().trim()
    if (!q) return selectedAreaItems
    return selectedAreaItems.filter((item) => {
      if (areaSearchField === "code") return item.code.toLowerCase().includes(q)
      return item.name.toLowerCase().includes(q)
    })
  }, [selectedAreaItems, areaSearchTerm, areaSearchField])

  const paginatedSelectedAreas = useMemo(() => {
    const start = (areaPage - 1) * pageSize
    return filteredSelectedAreas.slice(start, start + pageSize)
  }, [filteredSelectedAreas, areaPage])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredSelectedAreas.length / pageSize))
    if (areaPage > maxPage) setAreaPage(maxPage)
  }, [filteredSelectedAreas.length, areaPage])

  useEffect(() => {
    if (addAreaOpen) setAddAreaSearchTerm("")
  }, [addAreaOpen])

  const addFilteredAreaOptions = useMemo(() => {
    const q = addAreaSearchTerm.toLowerCase().trim()
    if (!q) return availableAreaOptions
    return availableAreaOptions.filter((item:any) => {
      if (areaSearchField === "code") return item.code.toLowerCase().includes(q)
      return item.name.toLowerCase().includes(q)
    })
  }, [availableAreaOptions, addAreaSearchTerm, areaSearchField])

  const allAddFilteredSelected =
    addFilteredAreaOptions.length > 0 &&
    addFilteredAreaOptions.every((item:any) => selectedAreaCodes.includes(item.code))

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
        Organizational Structure
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Subsidiary */}
        {isFieldVisible("subsidiary") && (
        <SingleSelectField
          key={`subsidiary`}
          id="subsidiaryCode"
          label={getFieldLabel("subsidiary", "Subsidiary Code")}
          required={isFieldRequired("subsidiary")}
          placeholder={"Select Subsidiary Code"}
          disabled={isViewMode}
            value={watchedValues?.deployment?.subsidiary?.subsidiaryCode} 
          onChange={(value) => handleHierarchicalCodeChange("deployment", "subsidiary", value)}
          options={(subOrganization?.subsidiaries ?? []).map((o: any) => ({
            value: o.code || o.subsidiaryCode || "",
            label: o.name || o.subsidiaryName || "",
            tooltip: o.name || o.subsidiaryName || ""
          }))}
          showOnlyValueInTrigger
          className="space-y-2"
          errorMessage={showErrors && errors.deployment?.subsidiary?.subsidiaryCode ? errors.deployment.subsidiary.subsidiaryCode.message : undefined}
          allowOnlyProvidedOptions
        />
        )}

        {/* Division */}
        {isFieldVisible("division") && (
        <SingleSelectField
            key={`division-${watchedValues?.deployment?.subsidiary?.subsidiaryCode || 'none'}`}
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
            tooltip: o.name || o.divisionName || ""
          }))}
          showOnlyValueInTrigger
          className="space-y-2"
          errorMessage={showErrors && errors.deployment?.division?.divisionCode ? errors.deployment.division.divisionCode.message : undefined}
          allowOnlyProvidedOptions
        />
        )}

        {/* Department */}
        {isFieldVisible("department") && (
        <SingleSelectField
            key={`department-${watchedValues?.deployment?.division?.divisionCode || 'none'}`}
          id="departmentCode"
          label={getFieldLabel("department", "Department Code")}
          required={isFieldRequired("department")}
          placeholder={!watchedValues?.deployment?.division?.divisionCode ? "Select Division first" : "Select Department Code"}
          disabled={isViewMode || !watchedValues?.deployment?.division?.divisionCode}
            value={watchedValues?.deployment?.department?.departmentCode} 
          onChange={(value) => handleHierarchicalCodeChange("deployment", "department", value)}
          options={filteredDepartments.map((o: any) => ({
            value: o.code || o.departmentCode || "",
            label: o.name || o.departmentName || "",
            tooltip: o.name || o.departmentName || ""
          }))}
          showOnlyValueInTrigger
          className="space-y-2"
          errorMessage={showErrors && errors.deployment?.department?.departmentCode ? errors.deployment.department.departmentCode.message : undefined}
          allowOnlyProvidedOptions
        />
        )}

        {/* Sub Department */}
        {isFieldVisible("subDepartment") && (
        <SingleSelectField
            key={`subDepartment-${watchedValues?.deployment?.department?.departmentCode || 'none'}`}
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
            tooltip: o.name || o.subDepartmentName || ""
          }))}
          showOnlyValueInTrigger
          className="space-y-2"
          errorMessage={showErrors && errors.deployment?.subDepartment?.subDepartmentCode ? errors.deployment.subDepartment.subDepartmentCode.message : undefined}
          allowOnlyProvidedOptions
        />
        )}

        {/* Section */}
        {isFieldVisible("section") && (
        <SingleSelectField
             key={`section-${watchedValues?.deployment?.subDepartment?.subDepartmentCode || 'none'}`}
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
            tooltip: o.name || o.sectionName || ""
          }))}
          showOnlyValueInTrigger
          className="space-y-2"
          errorMessage={showErrors && errors.deployment?.section?.sectionCode ? errors.deployment.section.sectionCode.message : undefined}
          allowOnlyProvidedOptions
        />
        )}

        {/* Employee Category */}
        {isFieldVisible("employeeCategory") && (
        <SingleSelectField
          key={`employeeCategory`}
          id="employeeCategoryCode"
          label={getFieldLabel("employeeCategory", "Employee Category Code")}
          required={isFieldRequired("employeeCategory")}
          placeholder="Select Employee Category Code"
          disabled={isViewMode}
            value={watchedValues.deployment?.employeeCategory?.employeeCategoryCode} 
          onChange={(value) => handleHierarchicalCodeChange("deployment", "employeeCategory", value)}
          options={(subOrganization?.employeeCategories ?? []).map((o: any) => ({
            value: o.code || o.employeeCategoryCode || "",
            label: o.name || o.employeeCategoryName || o.employeeCategoryTitle || "",
            tooltip: o.name || o.employeeCategoryName || o.employeeCategoryTitle || ""
          }))}
          showOnlyValueInTrigger
          className="space-y-2"
          errorMessage={showErrors && errors.deployment?.employeeCategory?.employeeCategoryCode ? errors.deployment.employeeCategory.employeeCategoryCode.message : undefined}
          allowOnlyProvidedOptions
        />
        )}

        {/* Designation */}
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
            tooltip: o.name || o.designationName || ""
          }))}
          showOnlyValueInTrigger
          className="space-y-2"
          errorMessage={showErrors && errors.deployment?.designation?.designationCode ? errors.deployment.designation.designationCode.message : undefined}
          allowOnlyProvidedOptions
        />
        )}

        {/* Grade */}
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
            label: o.name || o.gradeName || o.gradeTitle || "",
            tooltip: o.name || o.gradeName || o.gradeTitle || ""
          }))}
          showOnlyValueInTrigger
          className="space-y-2"
          errorMessage={showErrors && errors.deployment?.grade?.gradeCode ? errors.deployment.grade.gradeCode.message : undefined}
          allowOnlyProvidedOptions
        />
        )}

        {/* Location */}
        {isFieldVisible("location") && (
        <SingleSelectField
          key={`location-${watchedValues?.deployment?.subsidiary?.subsidiaryCode || 'all'}`}
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
            tooltip: o.name || o.locationName || ""
          }))}
          showOnlyValueInTrigger
          className="space-y-2"
          errorMessage={showErrors && errors.deployment?.location?.locationCode ? errors.deployment.location.locationCode.message : undefined}
          allowOnlyProvidedOptions
        />
        )}

        {/* Skill Level */}
        {isFieldVisible("skillLevel") && (
        <SingleSelectField
          key={`skillLevel`}
          id="skilledLevelTitle"
          label={getFieldLabel("skillLevel", "Skill Level")}
          required={isFieldRequired("skillLevel")}
          placeholder="Select Skill Level"
          disabled={isViewMode}
            value={watchedValues.deployment?.skillLevel?.skilledLevelTitle} 
          onChange={(value) => handleHierarchicalCodeChange("deployment", "skillLevel", value)}
          options={(subOrganization?.skillLevels ?? []).map((o: any) => ({
            value: o.title || o.skilledLevelTitle || "",
            label: o.title || o.skilledLevelTitle || "",
            tooltip: o.title || o.skilledLevelTitle || ""
          }))}
          showOnlyValueInTrigger
          className="space-y-2"
          errorMessage={showErrors && errors.deployment?.skillLevel?.skilledLevelTitle ? errors.deployment.skillLevel.skilledLevelTitle.message : undefined}
          allowOnlyProvidedOptions
        />
        )}

        {/* Contractor (uses reusable SingleSelectField) */}
        {isFieldVisible("contractor") && (
        <SingleSelectField
          id="contractorCode"
          label={getFieldLabel("contractor", "Contractor Code")}
          required={isFieldRequired("contractor")}
          placeholder="Search Contractor Code"
          disabled={isViewMode}
            value={watchedValues.deployment?.contractor?.contractorCode} 
          onChange={(val) => handleHierarchicalCodeChange("deployment", "contractor", val)}
          options={(contractorData ?? []).map((o: any) => ({
            value: o.code || o.contractorCode || "",
            label: o.name || o.contractorName || "",
            tooltip: o.name || o.contractorName || ""
          }))}
          showOnlyValueInTrigger
          className="space-y-2"
          errorMessage={showErrors && errors.deployment?.contractor?.contractorCode ? errors.deployment.contractor.contractorCode.message : undefined}
          allowOnlyProvidedOptions
        />
        )}

        {/* Salary Zone */}
        {isFieldVisible("salaryZone") && (
        <div className="space-y-2">
          <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
            {getFieldLabel("salaryZone", "Salary Zone")}
            {isFieldRequired("salaryZone") && <span className="text-red-500"> *</span>}
          </Label>
          <Select
            value={watchedValues?.deployment?.salaryZone || ""}
            onValueChange={(value) => handleCodeChange("deployment", "salaryZone", value)}
            disabled={isViewMode}
          >
            <SelectTrigger className="h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900">
              <SelectValue placeholder="Select Salary Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zone1">zone1</SelectItem>
              <SelectItem value="zone2">zone2</SelectItem>
              <SelectItem value="zone3">zone3</SelectItem>
              <SelectItem value="zone4">zone4</SelectItem>
            </SelectContent>
          </Select>
          {showErrors && errors.deployment?.salaryZone?.message && (
            <p className="text-red-500 text-xs">{errors.deployment.salaryZone.message}</p>
          )}
        </div>
        )}

        {/* Effective From */}
        {isFieldVisible("effectiveFrom") && (
        <div className="space-y-2">
          <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
            {getFieldLabel("effectiveFrom", "Effective From")}
            {isFieldRequired("effectiveFrom") && <span className="text-red-500"> *</span>}
          </Label>
          <Input
            type="date"
            value={watchedValues?.deployment?.effectiveFrom || ""}
            onChange={(e) => handleCodeChange("deployment", "effectiveFrom", e.target.value)}
            disabled={isViewMode}
            min={birthDate || undefined}
            className={`h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900 bg-white ${isViewMode ? "bg-gray-100 cursor-not-allowed" : ""} ${showErrors && errors.deployment?.effectiveFrom?.message ? "border-red-500" : ""}`}
          />
          {showErrors && errors.deployment?.effectiveFrom?.message && (
            <p className="text-red-500 text-xs">{errors.deployment.effectiveFrom.message}</p>
          )}
        </div>
        )}

        {/* Areas */}
        {isFieldVisible("areas") && (
          <div className="space-y-3 lg:col-span-3">
            <Label className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
              {getFieldLabel("areas", "Areas")}
              {isFieldRequired("areas") && <span className="text-red-500"> *</span>}
            </Label>

            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <div className="flex bg-muted/50 rounded-lg border">
                  <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                    <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                    <Select value={areaSearchField} onValueChange={(val: "code" | "name") => setAreaSearchField(val)}>
                      <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="code" className="text-sm">Code</SelectItem>
                        <SelectItem value="name" className="text-sm">Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 flex items-center bg-background rounded-r-lg">
                    <div className="relative flex-1">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        autoComplete="off"
                        placeholder={`Search selected by ${areaSearchField === "code" ? "code" : "name"}...`}
                        value={areaSearchTerm}
                        onChange={(e) => setAreaSearchTerm(e.target.value)}
                        className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>

                {addAreaOpen && !isViewMode && (
                  <div className="absolute z-30 left-0 top-full mt-3 w-[min(720px,100%)]">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3">
                      <div className="flex bg-muted/50 rounded-lg border">
                        <div className="flex-1 flex items-center bg-background rounded-l-lg">
                          <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="text"
                              placeholder={`Search by ${areaSearchField === "code" ? "code" : "name"}...`}
                              value={addAreaSearchTerm}
                              onChange={(e) => setAddAreaSearchTerm(e.target.value)}
                              className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAddAreaOpen(false)}
                          className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                          aria-label="Close"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="border rounded-lg bg-white">
                        <Command shouldFilter={false} className="rounded-lg">
                          {addFilteredAreaOptions.length > 0 && (
                            <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  if (allAddFilteredSelected) {
                                    onAreasChange(
                                      selectedAreaCodes.filter(
                                        (code: string) =>
                                          !addFilteredAreaOptions.some((option:any) => option.code === code)
                                      )
                                    )
                                  } else {
                                    const merged = [...selectedAreaCodes]
                                    addFilteredAreaOptions.forEach((option:any) => {
                                      if (!merged.includes(option.code)) merged.push(option.code)
                                    })
                                    onAreasChange(merged)
                                  }
                                }}
                                className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                              >
                                <Check
                                  className={`h-4 w-4 rounded-sm border ${
                                    allAddFilteredSelected
                                      ? "opacity-100 text-green-600 border-green-500"
                                      : "opacity-70 text-transparent border-gray-300"
                                  }`}
                                />
                                <span>Select all ({addFilteredAreaOptions.length})</span>
                              </button>
                            </div>
                          )}
                          <CommandList className="max-h-[200px]">
                            <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                              No areas found.
                            </CommandEmpty>
                            <CommandGroup>
                              {addFilteredAreaOptions.map((item:any) => {
                                const isSelected = selectedAreaCodes.includes(item.code)
                                return (
                                  <CommandItem
                                    key={item.code}
                                    value={`${item.code}-${item.name}`}
                                    onSelect={() => {
                                      if (isSelected) {
                                        onAreasChange(selectedAreaCodes.filter((code: string) => code !== item.code))
                                      } else {
                                        onAreasChange([...selectedAreaCodes, item.code])
                                      }
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 rounded-sm border ${
                                        isSelected
                                          ? "opacity-100 text-green-600 border-green-500"
                                          : "opacity-70 text-transparent border-gray-300"
                                      }`}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium text-sm">{item.name || "N/A"}</div>
                                      <div className="text-xs text-gray-500">Code: {item.code}</div>
                                    </div>
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!isViewMode && (
                <Button
                  type="button"
                  onClick={() => setAddAreaOpen((prev) => !prev)}
                  size="default"
                  className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
                  disabled={orgLoading}
                >
                  Add Areas
                </Button>
              )}
            </div>

            {showErrors && errors.deployment?.areas?.message && (
              <p className="text-red-500 text-xs">{errors.deployment.areas.message}</p>
            )}

            <div className="border rounded-lg bg-slate-50/40">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Area Code
                    </TableHead>
                    <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                      Area Name
                    </TableHead>
                    {!isViewMode && (
                      <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                        Actions
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSelectedAreas.length > 0 ? (
                    paginatedSelectedAreas.map((item) => (
                      <TableRow key={item.code} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                        <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                          {item.code}
                        </TableCell>
                        <TableCell className="py-1.5 text-sm text-gray-900">{item.name}</TableCell>
                        {!isViewMode && (
                          <TableCell className="py-1.5 pr-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                              onClick={() => handleAreaRemove(item.code)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isViewMode ? 2 : 3} className="py-8 text-center text-sm text-gray-500">
                        No areas selected. Click &quot;Add Areas&quot; to select areas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              {filteredSelectedAreas.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
                  <p className="text-[11px] text-gray-500">
                    Showing{" "}
                    <span className="font-semibold">
                      {Math.min((areaPage - 1) * pageSize + 1, filteredSelectedAreas.length)}-
                      {Math.min(areaPage * pageSize, filteredSelectedAreas.length)}
                    </span>{" "}
                    of <span className="font-semibold">{filteredSelectedAreas.length}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      disabled={areaPage === 1}
                      onClick={() => setAreaPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      disabled={areaPage * pageSize >= filteredSelectedAreas.length}
                      onClick={() =>
                        setAreaPage((p) => (p * pageSize >= filteredSelectedAreas.length ? p : p + 1))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
