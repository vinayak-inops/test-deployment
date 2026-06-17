"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Check, X, ChevronDown, Search } from "lucide-react";
import { cn } from "../../../../utils/shadcnui/cn";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { useWatch } from "react-hook-form";
import { useFormContext } from "../../../../context/FormContext";
import React from "react";

// Types
interface Option {
  value: string;
  label: string;
}

interface Field {
  name: string;
  label: string;
  required?: boolean;
  classvalue?: {
    container?: string;
    field?: string;
  };
}

interface MultiSelectDropdownProps {
  field: Field;
  tag: string;
  fields: any;
}

// Constants
const PARENT_FIELD_MAP: Record<string, string> = {
  subsidiaries: "",
  divisions: "subsidiaries",
  departments: "divisions",
  subDepartments: "departments",
  sections: "subDepartments",
  designations: "divisions",
  location: "",
  grades: "designations",
  employeeCategories: "",
  contractor: "",
  workOrderNumber: "contractor"
};

const SEARCH_DEBOUNCE_MS = 150;

// Custom hooks
const useDropdownState = (fieldName: string) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  
  return { isOpen, setIsOpen, searchValue, setSearchValue, options, setOptions };
};

const useFieldValidation = (field: Field, parentValue: any, fromValue: any, messenger: any) => {
  const parentField = PARENT_FIELD_MAP[field.name];
  
  return useMemo(() => {
    if (!parentField) return { isValid: true, message: "" };
    
    // Special case: if subsidiariesselect is false in messenger.formValue, divisions should be valid
    if (field.name === 'divisions' && parentField === 'subsidiaries') {
      const subsidiariesValue = messenger?.formValue?.subsidiariesselect;
      if (subsidiariesValue === false) {
        return { isValid: true, message: "" };
      }
    }

    // (sections filtering moved to useFilteredOptions)

    // Special cases for sections (child of subDepartments)
    if (field.name === 'sections' && parentField === 'subDepartments') {
      const sectionsSelect = messenger?.formValue?.sectionsselect;
      const subDepartmentsSelect = messenger?.formValue?.subDepartmentsselect;
      const departmentsSelect = messenger?.formValue?.departmentsselect;
      const divisionsSelect = messenger?.formValue?.divisionsselect;
      const subsidiariesSelect = messenger?.formValue?.subsidiariesselect;

      // If sectionsselect is falsey → gate by active higher-level toggles
      if (!sectionsSelect) {
        if (!!subDepartmentsSelect) {
          const selectedSubDepartments = messenger?.formValue?.subDepartments;
          const hasSubDepartmentsSelection = Array.isArray(selectedSubDepartments)
            ? selectedSubDepartments.length > 0
            : Boolean(selectedSubDepartments);
          return hasSubDepartmentsSelection
            ? { isValid: true, message: "" }
            : { isValid: false, message: "Please select sub-departments first to enable this selection" };
        }
        if (!!departmentsSelect) {
          const selectedSubDepartments = messenger?.formValue?.subDepartments;
          const hasSubDepartmentsSelection = Array.isArray(selectedSubDepartments)
            ? selectedSubDepartments.length > 0
            : Boolean(selectedSubDepartments);
          const selectedDepartments = messenger?.formValue?.departments;
          const hasDepartmentsSelection = Array.isArray(selectedDepartments)
            ? selectedDepartments.length > 0
            : Boolean(selectedDepartments);
          return (hasSubDepartmentsSelection || hasDepartmentsSelection)
            ? { isValid: true, message: "" }
            : { isValid: false, message: "Please select departments first to enable this selection" };
        }
        if (!!divisionsSelect) {
          const selectedSubDepartments = messenger?.formValue?.subDepartments;
          const hasSubDepartmentsSelection = Array.isArray(selectedSubDepartments)
            ? selectedSubDepartments.length > 0
            : Boolean(selectedSubDepartments);
          const selectedDivisions = messenger?.formValue?.divisions;
          const hasDivisionsSelection = Array.isArray(selectedDivisions)
            ? selectedDivisions.length > 0
            : Boolean(selectedDivisions);
          return (hasSubDepartmentsSelection || hasDivisionsSelection)
            ? { isValid: true, message: "" }
            : { isValid: false, message: "Please select divisions first to enable this selection" };
        }
        if (!!subsidiariesSelect) {
          const selectedSubDepartments = messenger?.formValue?.subDepartments;
          const hasSubDepartmentsSelection = Array.isArray(selectedSubDepartments)
            ? selectedSubDepartments.length > 0
            : Boolean(selectedSubDepartments);
          const selectedSubsidiaries = messenger?.formValue?.subsidiaries;
          const hasSubsidiariesSelection = Array.isArray(selectedSubsidiaries)
            ? selectedSubsidiaries.length > 0
            : Boolean(selectedSubsidiaries);
          return (hasSubDepartmentsSelection || hasSubsidiariesSelection)
            ? { isValid: true, message: "" }
            : { isValid: false, message: "Please select subsidiaries first to enable this selection" };
        }
        // All higher toggles are off → free selection mode
        return { isValid: true, message: "" };
      }

      // If all higher toggles are falsey → allow editing
      if (!subDepartmentsSelect && !departmentsSelect && !divisionsSelect && !subsidiariesSelect) {
        return { isValid: true, message: "" };
      }

      // When subDepartmentsselect is off and departmentsselect is on
      if (!subDepartmentsSelect && !!departmentsSelect) {
        const selectedSubDepartments = messenger?.formValue?.subDepartments;
        const hasSubDepartmentsSelection = Array.isArray(selectedSubDepartments) ? selectedSubDepartments.length > 0 : Boolean(selectedSubDepartments);
        const selectedDepartments = messenger?.formValue?.departments;
        const hasDepartmentsSelection = Array.isArray(selectedDepartments) ? selectedDepartments.length > 0 : Boolean(selectedDepartments);
        return (hasSubDepartmentsSelection || hasDepartmentsSelection)
          ? { isValid: true, message: "" }
          : { isValid: false, message: "Please select departments first to enable this selection" };
      }

      // When subDepartmentsselect is off and divisionsselect is on
      if (!subDepartmentsSelect && !!divisionsSelect) {
        const selectedSubDepartments = messenger?.formValue?.subDepartments;
        const hasSubDepartmentsSelection = Array.isArray(selectedSubDepartments) ? selectedSubDepartments.length > 0 : Boolean(selectedSubDepartments);
        const selectedDivisions = messenger?.formValue?.divisions;
        const hasDivisionsSelection = Array.isArray(selectedDivisions) ? selectedDivisions.length > 0 : Boolean(selectedDivisions);
        return (hasSubDepartmentsSelection || hasDivisionsSelection)
          ? { isValid: true, message: "" }
          : { isValid: false, message: "Please select divisions first to enable this selection" };
      }

      // When subDepartmentsselect is off and subsidiariesselect is on
      if (!subDepartmentsSelect && !!subsidiariesSelect) {
        const selectedSubDepartments = messenger?.formValue?.subDepartments;
        const hasSubDepartmentsSelection = Array.isArray(selectedSubDepartments) ? selectedSubDepartments.length > 0 : Boolean(selectedSubDepartments);
        const selectedSubsidiaries = messenger?.formValue?.subsidiaries;
        const hasSubsidiariesSelection = Array.isArray(selectedSubsidiaries) ? selectedSubsidiaries.length > 0 : Boolean(selectedSubsidiaries);
        return (hasSubDepartmentsSelection || hasSubsidiariesSelection)
          ? { isValid: true, message: "" }
          : { isValid: false, message: "Please select subsidiaries first to enable this selection" };
      }
    }
    // Special case: allow editing designations without parent when:
    // - designationsselect is false, OR
    // - both divisionsselect and subsidiariesselect are false
    if (field.name === 'designations' && parentField === 'divisions') {
      const designationsSelect = messenger?.formValue?.designationsselect;
      const divisionsSelect = messenger?.formValue?.divisionsselect;
      const subsidiariesSelect = messenger?.formValue?.subsidiariesselect;
      if (!designationsSelect || (!divisionsSelect && !subsidiariesSelect)) {
        return { isValid: true, message: "" };
      }
      // New special case: when divisionsselect is off and subsidiariesselect is on,
      // enable designations once subsidiaries has a value and validate against it
      if (!divisionsSelect && !!subsidiariesSelect) {
        const selectedSubsidiaries = messenger?.formValue?.subsidiaries;
        const hasSubsidiariesSelection = Array.isArray(selectedSubsidiaries)
          ? selectedSubsidiaries.length > 0
          : Boolean(selectedSubsidiaries);
        return hasSubsidiariesSelection
          ? { isValid: true, message: "" }
          : { isValid: false, message: "Please select subsidiaries first to enable this selection" };
      }
    }

    // Special cases for departments (child of divisions)
    if (field.name === 'departments' && parentField === 'divisions') {
      const departmentsSelect = messenger?.formValue?.departmentsselect;
      const divisionsSelect = messenger?.formValue?.divisionsselect;
      const subsidiariesSelect = messenger?.formValue?.subsidiariesselect;

      // If departmentsselect is falsey → allow editing regardless of parent
      if (!departmentsSelect) {
        // When higher-level toggles are active, require corresponding selection(s)
        if (!!divisionsSelect) {
          const selectedDivisions = messenger?.formValue?.divisions;
          const hasDivisionsSelection = Array.isArray(selectedDivisions)
            ? selectedDivisions.length > 0
            : Boolean(selectedDivisions);
          return hasDivisionsSelection
            ? { isValid: true, message: "" }
            : { isValid: false, message: "Please select divisions first to enable this selection" };
        }
        if (!!subsidiariesSelect) {
          const selectedSubsidiaries = messenger?.formValue?.subsidiaries;
          const hasSubsidiariesSelection = Array.isArray(selectedSubsidiaries)
            ? selectedSubsidiaries.length > 0
            : Boolean(selectedSubsidiaries);
          return hasSubsidiariesSelection
            ? { isValid: true, message: "" }
            : { isValid: false, message: "Please select subsidiaries first to enable this selection" };
        }
        // All higher toggles are off → free selection mode
        return { isValid: true, message: "" };
      }

      // If both divisionsselect and subsidiariesselect are falsey → allow editing
      if (!divisionsSelect && !subsidiariesSelect) {
        return { isValid: true, message: "" };
      }

      // When divisionsselect is off and subsidiariesselect is on, enable departments once subsidiaries has selection
      if (!divisionsSelect && !!subsidiariesSelect) {
        const selectedSubsidiaries = messenger?.formValue?.subsidiaries;
        const hasSubsidiariesSelection = Array.isArray(selectedSubsidiaries)
          ? selectedSubsidiaries.length > 0
          : Boolean(selectedSubsidiaries);
        return hasSubsidiariesSelection
          ? { isValid: true, message: "" }
          : { isValid: false, message: "Please select subsidiaries first to enable this selection" };
      }
    }

    // Special cases for subDepartments (child of departments)
    if (field.name === 'subDepartments' && parentField === 'departments') {
      const subDepartmentsSelect = messenger?.formValue?.subDepartmentsselect;
      const departmentsSelect = messenger?.formValue?.departmentsselect;
      const divisionsSelect = messenger?.formValue?.divisionsselect;
      const subsidiariesSelect = messenger?.formValue?.subsidiariesselect;

      // If subDepartmentsselect is falsey → allow editing regardless of parent
      if (!subDepartmentsSelect) {
        // Gate based on currently active higher-level toggles
        if (!!departmentsSelect) {
          const selectedDepartments = messenger?.formValue?.departments;
          const hasDepartmentsSelection = Array.isArray(selectedDepartments)
            ? selectedDepartments.length > 0
            : Boolean(selectedDepartments);
          return hasDepartmentsSelection
            ? { isValid: true, message: "" }
            : { isValid: false, message: "Please select departments first to enable this selection" };
        }
        if (!!divisionsSelect) {
          const selectedDepartments = messenger?.formValue?.departments;
          const hasDepartmentsSelection = Array.isArray(selectedDepartments)
            ? selectedDepartments.length > 0
            : Boolean(selectedDepartments);
          const selectedDivisions = messenger?.formValue?.divisions;
          const hasDivisionsSelection = Array.isArray(selectedDivisions)
            ? selectedDivisions.length > 0
            : Boolean(selectedDivisions);
          return (hasDepartmentsSelection || hasDivisionsSelection)
            ? { isValid: true, message: "" }
            : { isValid: false, message: "Please select divisions first to enable this selection" };
        }
        if (!!subsidiariesSelect) {
          const selectedDepartments = messenger?.formValue?.departments;
          const hasDepartmentsSelection = Array.isArray(selectedDepartments)
            ? selectedDepartments.length > 0
            : Boolean(selectedDepartments);
          const selectedSubsidiaries = messenger?.formValue?.subsidiaries;
          const hasSubsidiariesSelection = Array.isArray(selectedSubsidiaries)
            ? selectedSubsidiaries.length > 0
            : Boolean(selectedSubsidiaries);
          return (hasDepartmentsSelection || hasSubsidiariesSelection)
            ? { isValid: true, message: "" }
            : { isValid: false, message: "Please select subsidiaries first to enable this selection" };
        }
        // All higher toggles are off → free selection mode
        return { isValid: true, message: "" };
      }

      // If all higher toggles are falsey → allow editing
      if (!departmentsSelect && !divisionsSelect && !subsidiariesSelect) {
        return { isValid: true, message: "" };
      }

      // When departmentsselect is off and divisionsselect is on, enable once divisions or departments has selection
      if (!departmentsSelect && !!divisionsSelect) {
        const selectedDepartments = messenger?.formValue?.departments;
        const hasDepartmentsSelection = Array.isArray(selectedDepartments)
          ? selectedDepartments.length > 0
          : Boolean(selectedDepartments);
        const selectedDivisions = messenger?.formValue?.divisions;
        const hasDivisionsSelection = Array.isArray(selectedDivisions)
          ? selectedDivisions.length > 0
          : Boolean(selectedDivisions);
        return (hasDepartmentsSelection || hasDivisionsSelection)
          ? { isValid: true, message: "" }
          : { isValid: false, message: "Please select divisions first to enable this selection" };
      }

      // When departmentsselect is off and subsidiariesselect is on, enable once subsidiaries or departments has selection
      if (!departmentsSelect && !!subsidiariesSelect) {
        const selectedDepartments = messenger?.formValue?.departments;
        const hasDepartmentsSelection = Array.isArray(selectedDepartments)
          ? selectedDepartments.length > 0
          : Boolean(selectedDepartments);
        const selectedSubsidiaries = messenger?.formValue?.subsidiaries;
        const hasSubsidiariesSelection = Array.isArray(selectedSubsidiaries)
          ? selectedSubsidiaries.length > 0
          : Boolean(selectedSubsidiaries);
        return (hasDepartmentsSelection || hasSubsidiariesSelection)
          ? { isValid: true, message: "" }
          : { isValid: false, message: "Please select subsidiaries first to enable this selection" };
      }
    }

    // Special cases for grades (child of designations)
    if (field.name === 'grades' && parentField === 'designations') {
      const gradesSelect = messenger?.formValue?.gradesselect;
      const designationsSelect = messenger?.formValue?.designationsselect;
      const subsidiariesSelect = messenger?.formValue?.subsidiariesselect;
      const divisionsSelect = messenger?.formValue?.divisionsselect;

      // If gradesselect is falsey → allow editing regardless of parent
      if (!gradesSelect) {
        return { isValid: true, message: "" };
      }

      // If both designationsselect and subsidiariesselect are falsey → allow editing
      if (!designationsSelect && !subsidiariesSelect) {
        return { isValid: true, message: "" };
      }

      // When designationsselect is off and subsidiariesselect is on,
      // enable grades once designations has selection or subsidiaries has selection
      if (!designationsSelect && !!subsidiariesSelect) {
        const selectedDesignations = messenger?.formValue?.designations;
        const hasDesignationsSelection = Array.isArray(selectedDesignations)
          ? selectedDesignations.length > 0
          : Boolean(selectedDesignations);
        // Also allow enabling when subsidiaries has a selection even if no designations selected
        const selectedSubsidiaries = messenger?.formValue?.subsidiaries;
        const hasSubsidiariesSelection = Array.isArray(selectedSubsidiaries)
          ? selectedSubsidiaries.length > 0
          : Boolean(selectedSubsidiaries);
        return (hasDesignationsSelection || hasSubsidiariesSelection)
          ? { isValid: true, message: "" }
          : { isValid: false, message: "Please select subsidiaries first to enable this selection" };
      }

      // When designationsselect is off and divisionsselect is on,
      // enable grades once designations or divisions have selection
      if (!designationsSelect && !!divisionsSelect) {
        const selectedDesignations = messenger?.formValue?.designations;
        const hasDesignationsSelection = Array.isArray(selectedDesignations)
          ? selectedDesignations.length > 0
          : Boolean(selectedDesignations);
        const selectedDivisions = messenger?.formValue?.divisions;
        const hasDivisionsSelection = Array.isArray(selectedDivisions)
          ? selectedDivisions.length > 0
          : Boolean(selectedDivisions);
        return (hasDesignationsSelection || hasDivisionsSelection)
          ? { isValid: true, message: "" }
          : { isValid: false, message: "Please select divisions first to enable this selection" };
      }
    }
    
    // Special cases for workOrderNumber (child of contractor)
    if (field.name === 'workOrderNumber' && parentField === 'contractor') {
      const contractorSelect = messenger?.formValue?.contractorselect;
      // If contractorselect is falsey → allow editing regardless of parent
      if (contractorSelect === false) {
        return { isValid: true, message: "" };
      }
      // If contractorselect is true → require contractor selection
      if (contractorSelect === true) {
        const selectedContractor = messenger?.formValue?.contractor;
        const hasContractorSelection = Array.isArray(selectedContractor)
          ? selectedContractor.length > 0
          : Boolean(selectedContractor);
        return hasContractorSelection
          ? { isValid: true, message: "" }
          : { isValid: false, message: "Please select contractor first to enable this selection" };
      }
    }
    
    const hasParentValue = parentValue && Array.isArray(parentValue) && parentValue.length > 0;
    const hasParentFromValue = fromValue?.forlocaluse?.[parentField] && 
      (Array.isArray(fromValue.forlocaluse[parentField]) ? fromValue.forlocaluse[parentField].length > 0 : true);
    
    if (hasParentValue || hasParentFromValue) {
      return { isValid: true, message: "" };
    }
    
    // Check if field is hidden
    const isHidden = messenger?.mode?.some(
      (item: any) => item.field === field.name && item.value === "hidden"
    );
    
    if (isHidden) {
      return { isValid: true, message: "" };
    }
    
    return { 
      isValid: false, 
      message: "Please select a parent field first to enable this selection" 
    };
  }, [parentField, parentValue, fromValue, messenger?.mode, field.name, messenger?.formValue]);
};

const useFilteredOptions = (
  fieldName: string, 
  parentField: string | undefined, 
  parentValue: any, 
  organizationData: any,
  messenger: any
) => {
  return useMemo(() => {
    if (!organizationData) return [];
    
    const fieldData = organizationData[fieldName] || [];
    
    if (!parentField) return fieldData;
    
    const parentValueArray = Array.isArray(parentValue) ? parentValue : [];
    
    // Special case: if subsidiariesselect is false in messenger.formValue, show all divisions
    if (fieldName === 'divisions' && parentField === 'subsidiaries') {
      const subsidiariesValue = messenger?.formValue?.subsidiariesselect;
      if (subsidiariesValue === false) {
        return fieldData; // Show all divisions when subsidiaries is false
      }
    }

    // Special cases for designations filtering
    if (fieldName === 'designations' && parentField === 'divisions') {
      const designationsSelect = messenger?.formValue?.designationsselect;
      const divisionsSelect = messenger?.formValue?.divisionsselect;
      const subsidiariesSelect = messenger?.formValue?.subsidiariesselect;

      // If designationsselect is falsey → show all designations
      if (!designationsSelect) {
        return fieldData;
      }

      // If both divisionsselect and subsidiariesselect are falsey → show all designations
      if (!divisionsSelect && !subsidiariesSelect) {
        return fieldData;
      }

      // If divisionsselect is off but subsidiariesselect is on → filter designations by subsidiaries selection
      if (!divisionsSelect && !!subsidiariesSelect) {
        const selectedSubsidiaries = messenger?.formValue?.subsidiaries;
        const subsArray = Array.isArray(selectedSubsidiaries) ? selectedSubsidiaries : [];
        if (subsArray.length === 0) {
          return [];
        }
        return fieldData.filter((item: any) => subsArray.includes(item.subsidiaryCode));
      }
    }

    // Special cases for departments filtering (child of divisions)
    if (fieldName === 'departments' && parentField === 'divisions') {
      const departmentsSelect = messenger?.formValue?.departmentsselect;
      const divisionsSelect = messenger?.formValue?.divisionsselect;
      const subsidiariesSelect = messenger?.formValue?.subsidiariesselect;

      // If departmentsselect is falsey → show all departments
      if (!departmentsSelect) {
        return fieldData;
      }

      // If both divisionsselect and subsidiariesselect are falsey → show all departments
      if (!divisionsSelect && !subsidiariesSelect) {
        return fieldData;
      }

      // If divisionsselect is off but subsidiariesselect is on → filter departments by selected subsidiaries via divisionCode
      if (!divisionsSelect && !!subsidiariesSelect) {
        const selectedSubsidiaries = messenger?.formValue?.subsidiaries;
        const subsArray = Array.isArray(selectedSubsidiaries) ? selectedSubsidiaries : [];
        if (subsArray.length === 0) {
          return [];
        }
        const allDivisions = organizationData?.divisions || [];
        const allowedDivisionCodes = allDivisions
          .filter((d: any) => subsArray.includes(d.subsidiaryCode))
          .map((d: any) => d.value || d.divisionCode);
        return fieldData.filter((dept: any) => allowedDivisionCodes.includes(dept.divisionCode));
      }
    }

    // Special cases for subDepartments filtering (child of departments)
    if (fieldName === 'subDepartments' && parentField === 'departments') {
      const subDepartmentsSelect = messenger?.formValue?.subDepartmentsselect;
      const departmentsSelect = messenger?.formValue?.departmentsselect;
      const divisionsSelect = messenger?.formValue?.divisionsselect;
      const subsidiariesSelect = messenger?.formValue?.subsidiariesselect;

      // If subDepartmentsselect is falsey → show all subDepartments
      if (!subDepartmentsSelect) {
        return fieldData;
      }

      // If all higher toggles are falsey → show all
      if (!departmentsSelect && !divisionsSelect && !subsidiariesSelect) {
        return fieldData;
      }

      // If departmentsselect is off but divisionsselect is on → filter subDepartments via departments under selected divisions
      if (!departmentsSelect && !!divisionsSelect) {
        const selectedDepartments = messenger?.formValue?.departments;
        const deptArray = Array.isArray(selectedDepartments) ? selectedDepartments : [];
        if (deptArray.length > 0) {
          return fieldData.filter((item: any) => deptArray.includes(item.departmentCode));
        }
        const selectedDivisions = messenger?.formValue?.divisions;
        const divArray = Array.isArray(selectedDivisions) ? selectedDivisions : [];
        if (divArray.length === 0) {
          return [];
        }
        const allDepartments = organizationData?.departments || [];
        const allowedDepartmentCodes = allDepartments
          .filter((d: any) => divArray.includes(d.divisionCode))
          .map((d: any) => d.value || d.departmentCode);
        return fieldData.filter((sd: any) => allowedDepartmentCodes.includes(sd.departmentCode));
      }

      // If departmentsselect is off but subsidiariesselect is on → filter subDepartments via departments under selected subsidiaries
      if (!departmentsSelect && !!subsidiariesSelect) {
        const selectedDepartments = messenger?.formValue?.departments;
        const deptArray = Array.isArray(selectedDepartments) ? selectedDepartments : [];
        if (deptArray.length > 0) {
          return fieldData.filter((item: any) => deptArray.includes(item.departmentCode));
        }
        const selectedSubsidiaries = messenger?.formValue?.subsidiaries;
        const subsArray = Array.isArray(selectedSubsidiaries) ? selectedSubsidiaries : [];
        if (subsArray.length === 0) {
          return [];
        }
        const allDivisions = organizationData?.divisions || [];
        const allowedDivisionCodes = allDivisions
          .filter((d: any) => subsArray.includes(d.subsidiaryCode))
          .map((d: any) => d.value || d.divisionCode);
        const allDepartments = organizationData?.departments || [];
        const allowedDepartmentCodes = allDepartments
          .filter((d: any) => allowedDivisionCodes.includes(d.divisionCode))
          .map((d: any) => d.value || d.departmentCode);
        return fieldData.filter((sd: any) => allowedDepartmentCodes.includes(sd.departmentCode));
      }
    }

    // Special cases for sections filtering (child of subDepartments)
    if (fieldName === 'sections' && parentField === 'subDepartments') {
      const sectionsSelect = messenger?.formValue?.sectionsselect;
      const subDepartmentsSelect = messenger?.formValue?.subDepartmentsselect;
      const departmentsSelect = messenger?.formValue?.departmentsselect;
      const divisionsSelect = messenger?.formValue?.divisionsselect;
      const subsidiariesSelect = messenger?.formValue?.subsidiariesselect;

      // If sectionsselect is falsey → show all sections
      if (!sectionsSelect) {
        return fieldData;
      }

      // If all higher toggles are falsey → show all sections
      if (!subDepartmentsSelect && !departmentsSelect && !divisionsSelect && !subsidiariesSelect) {
        return fieldData;
      }

      // If subDepartmentsselect is off but departmentsselect is on → prefer selected subDepartments, else derive via departments
      if (!subDepartmentsSelect && !!departmentsSelect) {
        const selectedSubDepartments = messenger?.formValue?.subDepartments;
        const sdArray = Array.isArray(selectedSubDepartments) ? selectedSubDepartments : [];
        if (sdArray.length > 0) {
          return fieldData.filter((item: any) => sdArray.includes(item.subDepartmentCode));
        }
        const selectedDepartments = messenger?.formValue?.departments;
        const deptArray = Array.isArray(selectedDepartments) ? selectedDepartments : [];
        if (deptArray.length === 0) {
          return [];
        }
        const allSubDepartments = organizationData?.subDepartments || [];
        const allowedSubDeptCodes = allSubDepartments
          .filter((sd: any) => deptArray.includes(sd.departmentCode))
          .map((sd: any) => sd.value || sd.subDepartmentCode);
        return fieldData.filter((sec: any) => allowedSubDeptCodes.includes(sec.subDepartmentCode));
      }

      // If subDepartmentsselect is off but divisionsselect is on → prefer selected subDepartments, else derive via divisions → departments
      if (!subDepartmentsSelect && !!divisionsSelect) {
        const selectedSubDepartments = messenger?.formValue?.subDepartments;
        const sdArray = Array.isArray(selectedSubDepartments) ? selectedSubDepartments : [];
        if (sdArray.length > 0) {
          return fieldData.filter((item: any) => sdArray.includes(item.subDepartmentCode));
        }
        const selectedDivisions = messenger?.formValue?.divisions;
        const divArray = Array.isArray(selectedDivisions) ? selectedDivisions : [];
        if (divArray.length === 0) {
          return [];
        }
        const allDepartments = organizationData?.departments || [];
        const allowedDepartmentCodes = allDepartments
          .filter((d: any) => divArray.includes(d.divisionCode))
          .map((d: any) => d.value || d.departmentCode);
        const allSubDepartments = organizationData?.subDepartments || [];
        const allowedSubDeptCodes = allSubDepartments
          .filter((sd: any) => allowedDepartmentCodes.includes(sd.departmentCode))
          .map((sd: any) => sd.value || sd.subDepartmentCode);
        return fieldData.filter((sec: any) => allowedSubDeptCodes.includes(sec.subDepartmentCode));
      }

      // If subDepartmentsselect is off but subsidiariesselect is on → prefer selected subDepartments, else derive via subsidiaries → divisions → departments
      if (!subDepartmentsSelect && !!subsidiariesSelect) {
        const selectedSubDepartments = messenger?.formValue?.subDepartments;
        const sdArray = Array.isArray(selectedSubDepartments) ? selectedSubDepartments : [];
        if (sdArray.length > 0) {
          return fieldData.filter((item: any) => sdArray.includes(item.subDepartmentCode));
        }
        const selectedSubsidiaries = messenger?.formValue?.subsidiaries;
        const subsArray = Array.isArray(selectedSubsidiaries) ? selectedSubsidiaries : [];
        if (subsArray.length === 0) {
          return [];
        }
        const allDivisions = organizationData?.divisions || [];
        const allowedDivisionCodes = allDivisions
          .filter((d: any) => subsArray.includes(d.subsidiaryCode))
          .map((d: any) => d.value || d.divisionCode);
        const allDepartments = organizationData?.departments || [];
        const allowedDepartmentCodes = allDepartments
          .filter((d: any) => allowedDivisionCodes.includes(d.divisionCode))
          .map((d: any) => d.value || d.departmentCode);
        const allSubDepartments = organizationData?.subDepartments || [];
        const allowedSubDeptCodes = allSubDepartments
          .filter((sd: any) => allowedDepartmentCodes.includes(sd.departmentCode))
          .map((sd: any) => sd.value || sd.subDepartmentCode);
        return fieldData.filter((sec: any) => allowedSubDeptCodes.includes(sec.subDepartmentCode));
      }
    }

    // Special cases for grades filtering (child of designations)
    if (fieldName === 'grades' && parentField === 'designations') {
      const gradesSelect = messenger?.formValue?.gradesselect;
      const designationsSelect = messenger?.formValue?.designationsselect;
      const subsidiariesSelect = messenger?.formValue?.subsidiariesselect;
      const divisionsSelect = messenger?.formValue?.divisionsselect;

      // If gradesselect is falsey → show all grades
      if (!gradesSelect) {
        return fieldData;
      }

      // If both designationsselect and subsidiariesselect are falsey → show all grades
      if (!designationsSelect && !subsidiariesSelect) {
        return fieldData;
      }

      // If designationsselect is off but subsidiariesselect is on → filter grades by selected designations;
      // if no designations are selected, derive allowable designations from selected subsidiaries
      if (!designationsSelect && !!subsidiariesSelect) {
        const selectedDesignations = messenger?.formValue?.designations;
        const desigArray = Array.isArray(selectedDesignations) ? selectedDesignations : [];
        if (desigArray.length > 0) {
          return fieldData.filter((item: any) => desigArray.includes(item.designationCode));
        }
        const selectedSubsidiaries = messenger?.formValue?.subsidiaries;
        const subsArray = Array.isArray(selectedSubsidiaries) ? selectedSubsidiaries : [];
        if (subsArray.length === 0) {
          return [];
        }
        const allDesignations = organizationData?.designations || [];
        const allowedDesignationCodes = allDesignations
          .filter((d: any) => subsArray.includes(d.subsidiaryCode))
          .map((d: any) => d.value || d.designationCode);
        return fieldData.filter((g: any) => allowedDesignationCodes.includes(g.designationCode));
      }

      // If designationsselect is off but divisionsselect is on → filter grades via designations under selected divisions
      if (!designationsSelect && !!divisionsSelect) {
        const selectedDesignations = messenger?.formValue?.designations;
        const desigArray = Array.isArray(selectedDesignations) ? selectedDesignations : [];
        if (desigArray.length > 0) {
          return fieldData.filter((item: any) => desigArray.includes(item.designationCode));
        }
        const selectedDivisions = messenger?.formValue?.divisions;
        const divArray = Array.isArray(selectedDivisions) ? selectedDivisions : [];
        if (divArray.length === 0) {
          return [];
        }
        const allDesignations = organizationData?.designations || [];
        const allowedDesignationCodes = allDesignations
          .filter((d: any) => divArray.includes(d.divisionCode))
          .map((d: any) => d.value || d.designationCode);
        return fieldData.filter((g: any) => allowedDesignationCodes.includes(g.designationCode));
      }
    }
    
    // Special cases for workOrderNumber filtering (child of contractor)
    if (fieldName === 'workOrderNumber' && parentField === 'contractor') {
      const contractorSelect = messenger?.formValue?.contractorselect;
      // If contractorselect is falsey → show all work order numbers
      if (contractorSelect === false) {
        return fieldData;
      }
      // When contractorselect is true and no contractor is selected → no options
      const selectedContractor = messenger?.formValue?.contractor;
      const contractorArray = Array.isArray(selectedContractor) ? selectedContractor : [];
      if (contractorArray.length === 0) {
        return [];
      }
      // Otherwise, default parent-based filter at the end will handle it as well,
      // but we can be explicit here:
      return fieldData.filter((item: any) => contractorArray.includes(item.contractorCode));
    }
    
    if (parentValueArray.length === 0) return [];
    
    const filterMap: Record<string, (item: any) => boolean> = {
      divisions: (item: any) => parentValueArray.includes(item.subsidiaryCode),
      departments: (item: any) => parentValueArray.includes(item.divisionCode),
      subDepartments: (item: any) => parentValueArray.includes(item.departmentCode),
      sections: (item: any) => parentValueArray.includes(item.subDepartmentCode),
      designations: (item: any) => parentValueArray.includes(item.divisionCode),
      grades: (item: any) => parentValueArray.includes(item.designationCode),
      workOrderNumber: (item: any) => parentValueArray.includes(item.contractorCode),
    };
    
    const filterFn = filterMap[fieldName];
    return filterFn ? fieldData.filter(filterFn) : fieldData;
  }, [fieldName, parentField, parentValue, organizationData, messenger]);
};

const useSearchFilter = (options: Option[], searchValue: string) => {
  return useMemo(() => {
    if (!searchValue.trim()) return options;
    
    const searchLower = searchValue.toLowerCase();
    return options.filter(item => 
      item?.label?.toLowerCase().includes(searchLower)
    );
  }, [options, searchValue]);
};

// Main component
const MultiSelectDropdown = React.memo(
  ({ field, tag, fields }: MultiSelectDropdownProps) => {
    const {
      register,
      errors,
      setValue,
      control,
      fromValue,
      watch,
      onFieldUpdate,
      messenger,
      setMessenger,
      clearErrors
    } = useFormContext();

    // Refs
    const dropdownRef = useRef<HTMLDivElement>(null);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const initializedRef = useRef<Set<string>>(new Set());

    // Custom hooks
    const { isOpen, setIsOpen, searchValue, setSearchValue, options, setOptions } = useDropdownState(field.name);
    
    // Watched values
    const watchedValue = useWatch({
      control,
      name: field.name,
      defaultValue: [],
    });

    const parentField = PARENT_FIELD_MAP[field.name];
    const parentValue = parentField ? useWatch({ control, name: parentField, defaultValue: undefined }) : undefined;

    // Validation and options
    const { isValid: fieldIsValid, message: validationMessage } = useFieldValidation(
      field, parentValue, fromValue, messenger
    );
    
    const filteredOptions = useFilteredOptions(
      field.name, 
      parentField, 
      parentValue, 
      messenger?.organizationData,
      messenger
    );
    
    const availableOptions = useMemo(() => filteredOptions || [], [filteredOptions]);
    const filteredItems = useSearchFilter(availableOptions, searchValue);

    // Selected items logic
    const selectedItems = useMemo(() => {
      if (Array.isArray(watchedValue) && watchedValue.length > 0) {
        return watchedValue;
      }
      if (typeof watchedValue === "string" && watchedValue) {
        return [watchedValue];
      }
      
      if (!initializedRef.current.has(field.name)) {
        const fromValueData = fromValue?.forlocaluse?.[field.name];
        if (fromValueData) {
          if (Array.isArray(fromValueData)) {
            return fromValueData;
          } else if (typeof fromValueData === 'string') {
            return [fromValueData];
          } else {
            return [String(fromValueData)];
          }
        }
      }
      
      return [];
    }, [watchedValue, field.name, fromValue?.forlocaluse]);

    // Effects
    useEffect(() => {
      if (!field?.name || initializedRef.current.has(field.name)) return;

      const currentWatchValue = watch(field.name);
      if (currentWatchValue && (Array.isArray(currentWatchValue) ? currentWatchValue.length > 0 : true)) {
        initializedRef.current.add(field.name);
        return;
      }

      const fromValueData = fromValue?.forlocaluse?.[field.name];
      if (fromValueData && (Array.isArray(fromValueData) ? fromValueData.length > 0 : true)) {
        const valueToSet = Array.isArray(fromValueData) ? fromValueData : [String(fromValueData)];
        
        initializedRef.current.add(field.name);
        setValue(field.name, valueToSet, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        setMessenger?.((prev: any) => ({
          ...prev,
          formValue: {
            ...(prev?.formValue || {}),
            [field.name]: valueToSet,
          },
        }));
      } else {
        initializedRef.current.add(field.name);
      }
    }, [field?.name, fromValue?.forlocaluse, watch, setValue]);

    useEffect(() => {
      setOptions(filteredItems);
    }, [filteredItems]);

    useEffect(() => {
      if (field?.name) {
        initializedRef.current.delete(field.name);
      }
    }, [field?.name]);

    // Parent value change effect
    useEffect(() => {
      if (!parentField) return;
      // Special case: allow editing divisions when subsidiariesselect flag is false in messenger
      if (field.name === 'divisions' && parentField === 'subsidiaries' && messenger?.formValue?.subsidiariesselect === false) {
        return; // Skip clearing or filtering based on parent in this mode
      }

      // Special case: allow editing workOrderNumber when contractorselect flag is false in messenger
      if (field.name === 'workOrderNumber' && parentField === 'contractor' && messenger?.formValue?.contractorselect === false) {
        return; // Skip clearing or filtering based on parent in this mode
      }

      // Special case: allow editing designations when:
      // - designationsselect flag is false OR
      // - both divisionsselect and subsidiariesselect are false
      if (field.name === 'designations' && parentField === 'divisions') {
        const dsel = messenger?.formValue?.designationsselect;
        const vsel = messenger?.formValue?.divisionsselect;
        const ssel = messenger?.formValue?.subsidiariesselect;
        if (dsel === false || (vsel === false && ssel === false)) {
          return;
        }
        // New special case: when divisionsselect is false and subsidiariesselect is true,
        // do not clear based on empty divisions; rely on subsidiaries-based filtering instead
        if (vsel === false && ssel === true) {
          // Proceed with pruning invalid selections against available options, but skip the
          // "parent empty" clearing logic below since parent is divisions and unused here
        }
      }

      // For grades: when designationsselect is false and subsidiariesselect is true,
      // allow keeping current selections and rely on available options pruning
      if (field.name === 'grades' && parentField === 'designations') {
        const dsel = messenger?.formValue?.designationsselect;
        const ssel = messenger?.formValue?.subsidiariesselect;
        if (dsel === false && ssel === true) {
          // no-op, fall through to pruning against available options
        }
      }

      // For grades: when designationsselect is false and divisionsselect is true,
      // also rely on pruning against available options (do not clear on empty designations)
      if (field.name === 'grades' && parentField === 'designations') {
        const dsel = messenger?.formValue?.designationsselect;
        const vsel = messenger?.formValue?.divisionsselect;
        if (dsel === false && vsel === true) {
          // no-op, fall through
        }
      }

      const parentValue = watch(parentField as string);
      const available = filteredOptions || [];
      const validSelectedItems = selectedItems.filter((item: string) => 
        available.some((opt: any) => opt.value === item)
      );
      
      if (selectedItems.length > 0 && validSelectedItems.length !== selectedItems.length) {
        setValue(field.name, validSelectedItems, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        onFieldUpdate?.(field.name, validSelectedItems);
        setMessenger?.((prev: any) => ({
          ...prev,
          formValue: {
            ...(prev?.formValue || {}),
            [field.name]: validSelectedItems,
          },
        }));
      }
      
      // Skip clearing for designations when divisionsselect is false and subsidiariesselect is true
      const skipClearForDesignationsWithSubsidiaries =
        field.name === 'designations' && parentField === 'divisions' &&
        messenger?.formValue?.divisionsselect === false && messenger?.formValue?.subsidiariesselect === true;

      // Skip clearing for departments when divisionsselect is false and subsidiariesselect is true
      const skipClearForDepartmentsWithSubsidiaries =
        field.name === 'departments' && parentField === 'divisions' &&
        messenger?.formValue?.divisionsselect === false && messenger?.formValue?.subsidiariesselect === true;

      // Skip clearing for grades when designationsselect is false and subsidiariesselect is true
      const skipClearForGradesWithSubsidiaries =
        field.name === 'grades' && parentField === 'designations' &&
        messenger?.formValue?.designationsselect === false && messenger?.formValue?.subsidiariesselect === true;

      // Skip clearing for grades when designationsselect is false and divisionsselect is true
      const skipClearForGradesWithDivisions =
        field.name === 'grades' && parentField === 'designations' &&
        messenger?.formValue?.designationsselect === false && messenger?.formValue?.divisionsselect === true;

      // Skip clearing for grades when all relevant parents are off (free selection mode)
      const skipClearForGradesWhenAllParentsOff =
        field.name === 'grades' && parentField === 'designations' &&
        messenger?.formValue?.designationsselect === false && messenger?.formValue?.subsidiariesselect === false;

      // Skip clearing for departments when all relevant parents are off (free selection mode)
      const skipClearForDepartmentsWhenAllParentsOff =
        field.name === 'departments' && parentField === 'divisions' &&
        messenger?.formValue?.divisionsselect === false && messenger?.formValue?.subsidiariesselect === false;

      // Skip clearing for subDepartments when departmentsselect is false and (divisions or subsidiaries) is true
      const skipClearForSubDepartmentsWithParents =
        field.name === 'subDepartments' && parentField === 'departments' &&
        messenger?.formValue?.departmentsselect === false && (messenger?.formValue?.divisionsselect === true || messenger?.formValue?.subsidiariesselect === true);

      // Skip clearing for subDepartments when all higher parents are off (free selection mode)
      const skipClearForSubDepartmentsWhenAllParentsOff =
        field.name === 'subDepartments' && parentField === 'departments' &&
        messenger?.formValue?.departmentsselect === false && messenger?.formValue?.divisionsselect === false && messenger?.formValue?.subsidiariesselect === false;

      // Skip clearing for sections when subDepartmentsselect is false and (departments or divisions or subsidiaries) is true
      const skipClearForSectionsWithParents =
        field.name === 'sections' && parentField === 'subDepartments' &&
        messenger?.formValue?.subDepartmentsselect === false && (
          messenger?.formValue?.departmentsselect === true ||
          messenger?.formValue?.divisionsselect === true ||
          messenger?.formValue?.subsidiariesselect === true
        );

      // Skip clearing for sections when all higher parents are off (free selection mode)
      const skipClearForSectionsWhenAllParentsOff =
        field.name === 'sections' && parentField === 'subDepartments' &&
        messenger?.formValue?.subDepartmentsselect === false &&
        messenger?.formValue?.departmentsselect === false &&
        messenger?.formValue?.divisionsselect === false &&
        messenger?.formValue?.subsidiariesselect === false;

      // Skip clearing for workOrderNumber when contractorselect is false (free selection mode)
      const skipClearForWorkOrderWhenContractorSelectOff =
        field.name === 'workOrderNumber' && parentField === 'contractor' &&
        messenger?.formValue?.contractorselect === false;

      if (!skipClearForDesignationsWithSubsidiaries && !skipClearForDepartmentsWithSubsidiaries && !skipClearForGradesWithSubsidiaries && !skipClearForGradesWithDivisions && !skipClearForGradesWhenAllParentsOff && !skipClearForDepartmentsWhenAllParentsOff && !skipClearForSubDepartmentsWithParents && !skipClearForSubDepartmentsWhenAllParentsOff && !skipClearForSectionsWithParents && !skipClearForSectionsWhenAllParentsOff && !skipClearForWorkOrderWhenContractorSelectOff && ((Array.isArray(parentValue) && parentValue.length === 0) || (!Array.isArray(parentValue) && !parentValue))) {
        if (selectedItems.length > 0) {
          setValue(field.name, [], {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
          onFieldUpdate?.(field.name, []);
          setMessenger?.((prev: any) => ({
            ...prev,
            formValue: {
              ...(prev?.formValue || {}),
              [field.name]: [],
            },
          }));
        }
      }
    }, [field.name, filteredOptions, watch, selectedItems, setValue, onFieldUpdate, parentField, messenger?.formValue?.subsidiariesselect, messenger?.formValue?.designationsselect, messenger?.formValue?.divisionsselect, messenger?.formValue?.gradesselect]);

    // Cleanup and event listeners
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }
      };
    }, [setIsOpen]);

    // Field registration
    useEffect(() => {
      if (!field?.name) return;

      try {
        register(field.name, {
          required: false,
          validate: (value: any) => {
            return true;
          }
        });
      } catch (error) {
      }
    }, [field?.name, field?.required, register]);

    // Event handlers
    const handleItemToggle = useCallback((value: string) => {
      if (!field?.name) return;

      try {
        const currentArray = Array.isArray(watchedValue) ? [...watchedValue] : [];
        const isCurrentlySelected = currentArray.includes(value);
        const newItems = isCurrentlySelected
          ? currentArray.filter((v) => v !== value)
          : [...currentArray, value];

        setValue(field.name, newItems, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        
        onFieldUpdate?.(field.name, newItems);
        setMessenger?.((prev: any) => ({
          ...prev,
          formValue: {
            ...(prev?.formValue || {}),
            [field.name]: newItems,
          },
        }));
        
        if (newItems.length > 0) {
          clearErrors(field.name);
        }
      } catch (error) {
      }
    }, [field?.name, setValue, onFieldUpdate, watchedValue, clearErrors]);

    const handleSelectAllToggle = useCallback(() => {
      if (!field?.name) return;

      try {
        const allValues = availableOptions.map((i: any) => i.value);
        const currentArray = Array.isArray(watchedValue) ? [...watchedValue] : [];
        const allSelected = currentArray.length === allValues.length;
        const newItems = allSelected ? [] : allValues;

        setValue(field.name, newItems, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        
        onFieldUpdate?.(field.name, newItems);
        setMessenger?.((prev: any) => ({
          ...prev,
          formValue: {
            ...(prev?.formValue || {}),
            [field.name]: newItems,
          },
        }));
        
        if (newItems.length > 0) {
          clearErrors(field.name);
        }
      } catch (error) {
      }
    }, [availableOptions, field?.name, setValue, onFieldUpdate, watchedValue, clearErrors]);

    const handleButtonClick = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (!fieldIsValid) return;
      setIsOpen((prev) => !prev);
    }, [fieldIsValid, setIsOpen]);

    const handleItemClick = useCallback((e: React.MouseEvent, value: string) => {
      e.preventDefault();
      e.stopPropagation();
      handleItemToggle(value);
    }, [handleItemToggle]);

    const handleSelectAllClick = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleSelectAllToggle();
    }, [handleSelectAllToggle]);

    const handleRemoveItem = useCallback((e: React.MouseEvent, value: string) => {
      e.preventDefault();
      e.stopPropagation();
      handleItemToggle(value);
    }, [handleItemToggle]);

    const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      const value = e.target.value;
      
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      searchTimeoutRef.current = setTimeout(() => {
        setSearchValue(value);
      }, SEARCH_DEBOUNCE_MS);
    }, [setSearchValue]);

    const getItemLabel = useCallback((value: string) => {
      const item = availableOptions.find((i: any) => i.value === value);
      return item?.label || value;
    }, [availableOptions]);

    // Render helpers
    const renderDropdownButton = () => (
      <Button
        id={`${field.name}-dropdown`}
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-between bg-white border border-gray-200 rounded-lg shadow-sm",
          "hover:border-gray-300 hover:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
          "transition-all duration-200 cursor-pointer",
          isOpen && "border-blue-500 ring-2 ring-blue-500 shadow-lg",
          !fieldIsValid && "opacity-50 blur-[0.5px] cursor-not-allowed bg-gray-100",
          field?.classvalue?.field
        )}
        onClick={handleButtonClick}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        disabled={!fieldIsValid}
      >
        <span
          className={cn(
            "truncate font-medium",
            !selectedItems.length ? "text-gray-500" : "text-gray-900",
            !fieldIsValid && "text-gray-400"
          )}
        >
          {!fieldIsValid 
            ? "Select parent first..."
            : selectedItems.length > 0
            ? `${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} selected`
            : "Select items..."
          }
        </span>
        <div className="flex items-center gap-2">
          {selectedItems.length > 0 && fieldIsValid && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              isOpen ? "transform rotate-180" : "",
              !fieldIsValid && "text-gray-400"
            )}
          />
        </div>
      </Button>
    );

    const renderDropdownModal = () => (
      isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 max-h-[80vh] overflow-hidden"
            role="listbox"
            aria-multiselectable="true"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">{field.label}</h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {selectedItems.length > 0 
                  ? `${selectedItems.length} item${selectedItems.length > 1 ? 's' : ''} selected`
                  : 'Select one or more items'
                }
              </p>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Search items..."
                  value={searchValue}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="overflow-y-scroll max-h-52 pr-1">
              {options?.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <Search className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-500">No items found</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>
                </div>
              ) : (
                <div className="p-2">
                  {/* Select All Button */}
                  <button
                    type="button"
                    className="w-full flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100 mb-2"
                    onClick={handleSelectAllClick}
                    role="option"
                    aria-selected={selectedItems.length === options?.length}
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded border mr-3 transition-all",
                        selectedItems.length === options?.length
                          ? "bg-blue-600 border-blue-600"
                          : "border-gray-300"
                      )}
                    >
                      {selectedItems.length === options?.length && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="font-medium">Select All</span>
                    <span className="ml-auto text-xs text-gray-400">
                      ({options.length} items)
                    </span>
                  </button>
                  
                  {/* Individual Options */}
                  <div className="space-y-1">
                    {options?.map((item: any) => {
                      const selected = selectedItems.includes(item.value);
                      return (
                        <button
                          key={item.value}
                          type="button"
                          className={cn(
                            "w-full flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200",
                            selected && "bg-blue-50 border border-blue-100"
                          )}
                          onClick={(e) => handleItemClick(e, item.value)}
                          role="option"
                          aria-selected={selected}
                        >
                          <div
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded border mr-3 transition-all",
                              selected
                                ? "bg-blue-600 border-blue-600 scale-110"
                                : "border-gray-300"
                            )}
                          >
                            {selected && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className={cn(
                            "transition-colors",
                            selected && "font-medium text-blue-900"
                          )}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedItems.length > 0 && (
                    <span>{selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    );

    const renderSelectedItems = () => (
      selectedItems.length > 0 && fieldIsValid && (
        <div className="mt-2 max-h-[120px] overflow-y-auto pr-1">
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((value: string) => (
              <Badge
                key={value}
                variant="secondary"
                className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full"
              >
                {getItemLabel(value)}
                <button
                  type="button"
                  onClick={(e) => handleRemoveItem(e, value)}
                  className="ml-1.5 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${getItemLabel(value)}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )
    );

    return (
      <div className={`w-full ${field?.classvalue?.container}`}>
        <div className="relative" ref={dropdownRef}>
          <label
            htmlFor={`${field.name}-dropdown`}
            className={cn(
              "block text-sm font-medium mb-1.5",
              fieldIsValid ? "text-gray-700" : "text-gray-400"
            )}
          >
            {field.label}
            {field.required && <span className="text-red-500 ml-1">{(field.name=="location" || field.name=="employeeCategories")?"":"*"}</span>}
            {!fieldIsValid && (
              <span className="text-xs text-gray-400 ml-2 font-normal">
                (Select parent first)
              </span>
            )}
          </label>
          
          {renderDropdownButton()}
          {renderDropdownModal()}
        </div>

        {renderSelectedItems()}

        <input
          type="hidden"
          {...register(field.name, {
            required: false,
            validate: (value: any) => {
              return true;
            }
          })}
        />
        
        
        {!fieldIsValid && (
          <p className="mt-1 text-sm text-gray-500" role="alert">
            {validationMessage}
          </p>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Optimized memo comparison
    return (
      prevProps.field.name === nextProps.field.name &&
      prevProps.field.label === nextProps.field.label &&
      prevProps.field.required === nextProps.field.required &&
      prevProps.field.classvalue?.container === nextProps.field.classvalue?.container &&
      prevProps.field.classvalue?.field === nextProps.field.classvalue?.field
    );
  }
);

export default MultiSelectDropdown;