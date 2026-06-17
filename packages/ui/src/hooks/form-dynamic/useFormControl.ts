'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { FormField, FormSection, FormStructure } from '../../type/dynamic-form/types';
import { useTabForm } from './useTabForm';

interface UseFormControlProps {
  messenger?: any;
  test?: any;
  department: FormStructure;
  updateFormStructure: React.Dispatch<React.SetStateAction<FormStructure>>;
}

interface UseFormControlReturn {
  fieldUpdateControl: { startingValue: Record<string, any> };
  isSetValueCalledRef: React.MutableRefObject<boolean>;
  getFieldUpdateControlWrapper: (fieldName: string) => { startingValue: Record<string, any> };
  updateFieldControl: (fieldName: string, value: any) => void;
  getFieldUpdateValue: (fieldName: string) => { startingValue: Record<string, any> };
  handleFormStructure: () => void;
}

const useFormControl = (props: UseFormControlProps): UseFormControlReturn => {
  const { messenger, test, department, updateFormStructure } = props;

  // Initialize state with messenger data or empty object
  const [fieldUpdateControl, setFieldUpdateControl] = useState(() => ({
    startingValue: messenger?.organizationData || {}
  }));
  const isSetValueCalledRef = useRef(false);

  // Use the tab form hook for tab-related operations
  const { findTabsForm, processTabForm } = useTabForm();

  // Update field control when test value changes
  useEffect(() => {
    if (test !== undefined) {
      setFieldUpdateControl(prev => ({
        startingValue: {
          ...prev.startingValue,
          ...test
        }
      }));
    }
  }, [test]);

  // Get field update control wrapper
  const getFieldUpdateControlWrapper = useCallback((fieldName: string) => ({
    startingValue: fieldUpdateControl.startingValue
  }), [fieldUpdateControl]);

  // Update field control
  const updateFieldControl = useCallback((fieldName: string, value: any) => {
    setFieldUpdateControl(prev => ({
      startingValue: {
        ...prev.startingValue,
        [fieldName]: value
      }
    }));
  }, []);

  // Get field update value
  const getFieldUpdateValue = useCallback((fieldName: string) => ({
    startingValue: fieldUpdateControl.startingValue[fieldName] || []
  }), [fieldUpdateControl]);

  // Process form structure
  const handleFormStructure = useCallback((): void => {
    updateFormStructure(prev => {
      if (!prev?.subformstructure) return prev;

      return {
        ...prev,
        subformstructure: prev.subformstructure.map(section => {
          if (!section?.fields) return section;

          return {
            ...section,
            fields: section.fields.map((field: any) => {
              // Handle dropdown and multi-select fields
              if ((field.tag === "dropdown" || field.tag === "multi-select-dropdown") && field.name) {
                const fieldValue = fieldUpdateControl.startingValue[field.name];
                if (fieldValue !== undefined) {
                  field.value = Array.isArray(fieldValue) ? [...fieldValue] : fieldValue;
                }
              }

              // Handle tab form fields
              if (field.tag === "tabs-form" && field?.subformstructure) {
                const firstTabValue = field?.tabs?.[0]?.value;
                if (!firstTabValue) return field;

                return {
                  ...field,
                  subformstructure: field.subformstructure.map((subSection: FormSection) =>
                    findTabsForm(subSection, firstTabValue)
                  )
                };
              }

              // Handle nested form structure
              if (field?.subformstructure) {
                return {
                  ...field,
                  subformstructure: field.subformstructure.map(processTabForm)
                };
              }

              return field;
            })
          };
        })
      };
    });
  }, [updateFormStructure, findTabsForm, processTabForm, fieldUpdateControl.startingValue]);

  return {
    fieldUpdateControl,
    isSetValueCalledRef,
    getFieldUpdateControlWrapper,
    updateFieldControl,
    getFieldUpdateValue,
    handleFormStructure
  };
};

export default useFormControl;