import { useEffect, useCallback, useRef } from 'react';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';

interface ModeField {
  field: string;
  value: 'hidden' | 'all-allow';
}

interface Messenger {
  progressbar?: string;
  mode?: ModeField[];
  organizationData?: any;
}

interface UseFieldVisibilityProps {
  messenger: Messenger;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
  organizationData: any;
  fieldUpdateControl: (field: string) => { startingValue: Record<string, any[]> };
  onFieldUpdate?: (fieldName: string, value: any) => void;
}

type FieldName = 'subsidiaries' | 'divisions' | 'departments' | 'subDepartments' | 'sections' | 'designations' | 'location' | 'grades';

const childFieldMap: Record<FieldName, FieldName[]> = {
  subsidiaries: ["divisions", "departments", "subDepartments", "sections", "designations", "grades", "location"],
  divisions: ["departments", "subDepartments", "sections", "designations", "grades"],
  departments: ["subDepartments", "sections"],
  subDepartments: ["sections"],
  designations: ["grades"],
  sections: [],
  location: [],
  grades: []
};

const parentFieldMap: Record<FieldName, FieldName | null> = {
  subsidiaries: null,
  divisions: "subsidiaries",
  departments: "divisions",
  subDepartments: "departments",
  sections: "subDepartments",
  designations: "divisions",
  location: null,
  grades: "designations"
};

export const useFieldVisibility = ({
  messenger,
  setValue,
  watch,
  organizationData,
  fieldUpdateControl,
  onFieldUpdate
}: UseFieldVisibilityProps) => {
  // Keep track of previous mode values
  const prevModeRef = useRef<ModeField[]>([]);

  // Function to get parent field
  const getParentField = useCallback((fieldName: FieldName): FieldName | null => {
    return parentFieldMap[fieldName] || null;
  }, []);

  // Function to reset child fields when parent field changes
  const resetChildFields = useCallback((parentField: FieldName) => {
    const immediateChildren = childFieldMap[parentField] || [];
    
    
    immediateChildren.forEach(childField => {
      // Check if the child field is hidden
      const isChildHidden = messenger?.mode?.some(
        (item: any) => item.field === childField && item.value === 'hidden'
      );


      if (isChildHidden) {
        // If child is hidden, update its children (grandchildren of parent)
        const grandChildren = childFieldMap[childField] || [];
        
        grandChildren.forEach(grandChild => {
          const parentValue = watch(parentField) || [];
          const initialData = fieldUpdateControl("subsidiaries")?.startingValue || {};
          const grandChildData = initialData[grandChild] || [];
          
          // Filter grandchild data based on parent selection
          // parentValue is an array of string codes, not objects
          const filteredGrandChildData = grandChildData.filter((item: any) => {
            if (!item) return false;
            
            switch (grandChild) {
              case "departments":
                return Array.isArray(parentValue) && parentValue.includes(item.divisionCode);
              case "subDepartments":
                return Array.isArray(parentValue) && parentValue.includes(item.departmentCode);
              case "sections":
                return Array.isArray(parentValue) && parentValue.includes(item.subDepartmentCode);
              case "grades":
                return Array.isArray(parentValue) && parentValue.includes(item.designationCode);
              default:
                return false;
            }
          });

          // Store only codes (string values) for hidden grandchildren
          const grandChildCodes = filteredGrandChildData
            .map((entry: any) => entry?.value ?? entry?.code ?? entry?.id)
            .filter(Boolean);
          setValue(grandChild, grandChildCodes, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
          });
          onFieldUpdate?.(grandChild, grandChildCodes);
        });
      } else {
        // If child is not hidden, reset it normally
        setValue(childField, [], {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true
        });
        onFieldUpdate?.(childField, []);
      }
    });
  }, [setValue, onFieldUpdate, messenger?.mode, watch, fieldUpdateControl]);

  // Function to update field value and trigger necessary updates
  const updateFieldValue = useCallback((fieldName: FieldName, value: any[]) => {
    // Normalize values to array of string codes for consistency across components
    const normalizedCodes = Array.isArray(value)
      ? value.map((entry: any) => entry?.value ?? entry?.code ?? entry?.id ?? entry).filter(Boolean)
      : [];
    setValue(fieldName, normalizedCodes, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true
    });
    onFieldUpdate?.(fieldName, normalizedCodes);
    resetChildFields(fieldName);
  }, [setValue, onFieldUpdate, resetChildFields]);

  // Function to handle field updates
  const handleField = useCallback((fieldName: FieldName) => {
    if (!messenger?.mode || !organizationData) return;

    const hiddenFields = new Map(
      messenger.mode
        .filter(field => field.value === 'hidden')
        .map(field => [field.field, true])
    );

    if (hiddenFields.has(fieldName)) {
      // If the field itself is hidden, update its children instead
      const children = childFieldMap[fieldName] || [];
      children.forEach(childField => {
        const parentField = getParentField(childField);
        if (parentField) {
          const parentValue = watch(parentField) || [];
          const initialData = fieldUpdateControl("subsidiaries")?.startingValue || {};
          const childData = initialData[childField] || [];
          
          // Filter child data based on grandparent selection
          // parentValue is an array of string codes, not objects
          const filteredChildData = childData.filter((item: any) => {
            if (!item) return false;
            
            switch (childField) {
              case "departments":
                return Array.isArray(parentValue) && parentValue.includes(item.divisionCode);
              case "subDepartments":
                return Array.isArray(parentValue) && parentValue.includes(item.departmentCode);
              case "sections":
                return Array.isArray(parentValue) && parentValue.includes(item.subDepartmentCode);
              case "grades":
                return Array.isArray(parentValue) && parentValue.includes(item.designationCode);
              default:
                return false;
            }
          });

          // Store only codes (string values) for hidden children
          const childCodes = filteredChildData
            .map((entry: any) => entry?.value ?? entry?.code ?? entry?.id)
            .filter(Boolean);
          setValue(childField, childCodes, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true
          });
          onFieldUpdate?.(childField, childCodes);
        }
      });
      return;
    }

    const parentField = getParentField(fieldName);
    const initialData = fieldUpdateControl("subsidiaries")?.startingValue || {};

    if (!parentField) {
      // Independent field (like location)
      const fieldData = initialData[fieldName] || [];
      updateFieldValue(fieldName, fieldData);
      return;
    }

    // Dependent field - filter based on parent selection
    const parentValue = watch(parentField) || [];
    const fieldData = initialData[fieldName] || [];
    
    const filteredData = fieldData.filter((item: any) => {
      // parentValue is expected to be an array of string codes
      switch (fieldName) {
        case "divisions":
          return Array.isArray(parentValue) && parentValue.includes(item.subsidiaryCode);
        case "departments":
          return Array.isArray(parentValue) && parentValue.includes(item.divisionCode);
        case "subDepartments":
          return Array.isArray(parentValue) && parentValue.includes(item.departmentCode);
        case "sections":
          return Array.isArray(parentValue) && parentValue.includes(item.subDepartmentCode);
        case "designations":
          return Array.isArray(parentValue) && parentValue.includes(item.divisionCode);
        case "grades":
          return Array.isArray(parentValue) && parentValue.includes(item.designationCode);
        case "location":
          return Array.isArray(parentValue) && parentValue.includes(item.locationCode);
        default:
          return false;
      }
    });


    updateFieldValue(fieldName, filteredData);
  }, [messenger?.mode, organizationData, watch, fieldUpdateControl, updateFieldValue, getParentField, childFieldMap, setValue, onFieldUpdate]);

  // Function to check if mode has changed
  const hasModeChanged = useCallback((currentMode: ModeField[] = []) => {
    if (prevModeRef.current.length !== currentMode.length) return true;
    
    return currentMode.some((field, index) => {
      const prevField = prevModeRef.current[index];
      return !prevField || 
             field.field !== prevField.field || 
             field.value !== prevField.value;
    });
  }, []);

  // Function to update fields based on mode changes
  const updateFieldsOnModeChange = useCallback(() => {
    if (!messenger?.mode || !organizationData) return;

    // Check if mode has actually changed
    if (!hasModeChanged(messenger.mode)) return;

    // Update previous mode reference
    prevModeRef.current = [...messenger.mode];

    // Process all fields
    Object.keys(childFieldMap).forEach(field => {
      handleField(field as FieldName);
    });
  }, [messenger?.mode, organizationData, handleField, hasModeChanged]);

  // Effect to watch for field changes
  useEffect(() => {
    const fields = Object.keys(childFieldMap) as FieldName[];
    const unsubscribes: Array<() => void> = [];
    
    fields.forEach(field => {
      const unsubscribe = watch((value, { name }) => {
        if (name === field) {
          const parentField = getParentField(field as FieldName);
          if (parentField) {
            handleField(field as FieldName);
          }
        }
      });

      if (typeof unsubscribe === 'function') {
        unsubscribes.push(unsubscribe);
      }
    });

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [watch, handleField, getParentField]);

  // Return the update function
  return {
    updateFieldsOnModeChange
  };
}; 