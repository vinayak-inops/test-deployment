import { useCallback, useRef } from 'react';
import { FieldValues, UseFormSetValue } from 'react-hook-form';
import { FormStructure, FormField } from '../../type/dynamic-form/types';

interface UseFormSubmissionProps {
  department: FormStructure;
  setValue: UseFormSetValue<FieldValues>;
  id?: string;
}

interface UseFormSubmissionReturn {
  safeSetValue: (name: string, value: any, options?: any) => void;
  onSubmit: (data: FieldValues) => void;
  handleFormSubmit: (e: React.FormEvent) => boolean;
  isSetValueCalledRef: React.MutableRefObject<boolean>;
}

export const useFormSubmission = ({ department, setValue, id }: UseFormSubmissionProps): UseFormSubmissionReturn => {
  const isSetValueCalledRef = useRef(false);

  /**
   * Safely updates form values while preventing form submission
   * Uses setTimeout to break the event chain and prevent unwanted submissions
   */
  const safeSetValue = useCallback(
    (name: string, value: any, options?: any) => {
      if (!setValue) {
        return;
      }

      isSetValueCalledRef.current = true;
      setTimeout(() => {
        try {
          setValue(name, value, options);
          setTimeout(() => {
            isSetValueCalledRef.current = false;
          }, 100);
        } catch (error) {
          isSetValueCalledRef.current = false;
        }
      }, 0);
    },
    [setValue]
  );

  /**
   * Handles form submission
   * Updates department data and triggers save action if configured
   */
  const onSubmit = useCallback((data: FieldValues) => {
    if (isSetValueCalledRef.current) return;

    const updateDepartment: FormStructure = JSON.parse(JSON.stringify(department));

    // Recursively update field values in the department structure
    const traverse = (field: FormField) => {
      if (field.displayOrder !== undefined) {
        Object.entries(data).forEach(([key, value]) => {
          if (field.name === key) {
            field.value = value;
          }
        });
      }
      if (field.children) {
        field.children.forEach(traverse);
      }
    };

    // Update all fields in the form structure
    if (updateDepartment.subformstructure?.length > 0) {
      updateDepartment.subformstructure.forEach((elem) => {
        elem.fields?.forEach(traverse);
      });
    }

    // Execute save action if configured
    department.actions?.forEach((action) => {
      if (action.action === "save" && typeof action.function === "function") {
        action.function(updateDepartment, data, id);
      }
    });
  }, [department, id]);

  /**
   * Prevents form submission if a value was just set programmatically
   */
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    if (isSetValueCalledRef.current) {
      e.preventDefault();
      return false;
    }
    return true;
  }, []);

  return {
    safeSetValue,
    onSubmit,
    handleFormSubmit,
    isSetValueCalledRef
  };
}; 