import { useCallback } from 'react';
import { FormField, FormSection, FormStructure } from '../../type/dynamic-form/types';
import { Dispatch, SetStateAction } from 'react';
import { useTabForm } from './useTabForm';

interface UseFieldUpdateProps {
  updateFormStructure: Dispatch<SetStateAction<FormStructure>>;
}

interface UseFieldUpdateReturn {
  handleFieldUpdate: (fieldName: string, value: any) => void;
  handleTabUpdate: (fieldName: string, selectedTab: string) => void;
}

export const useFieldUpdate = ({ updateFormStructure }: UseFieldUpdateProps): UseFieldUpdateReturn => {
  // Use the tab form hook for tab-related operations
  const { findTabsForm } = useTabForm();

  // Memoize the field update handler with optimized change detection
  const handleFieldUpdate = useCallback((fieldName: string, value: any) => {
    updateFormStructure((prev: FormStructure) => {
      let hasChanges = false;
      
      const updateFieldInSection = (section: FormSection): FormSection => {
        // Early return if no fields to update
        if (!section.fields?.length) return section;

        const updatedFields = section.fields.map((field:any) => {
          // Direct field match
          if (field.name === fieldName) {
            if (field.value !== value) {
              hasChanges = true;
              return { ...field, value };
            }
            return field;
          }

          // Handle nested fields
          if (field.subformstructure?.length) {
            const updatedSubform = field.subformstructure.map(updateFieldInSection);
            if (updatedSubform !== field.subformstructure) {
              hasChanges = true;
              return { ...field, subformstructure: updatedSubform };
            }
          }

          return field;
        });

        // Only create new section if there are changes
        if (hasChanges || updatedFields !== section.fields) {
          return { ...section, fields: updatedFields };
        }
        return section;
      };

      // Early return if no changes
      const updatedSubformstructure = prev.subformstructure.map(updateFieldInSection);
      if (!hasChanges && updatedSubformstructure === prev.subformstructure) {
        return prev;
      }

      return {
        ...prev,
        subformstructure: updatedSubformstructure
      };
    });
  }, [updateFormStructure]);

  // Memoize the tab update handler with optimized change detection
  const handleTabUpdate = useCallback((fieldName: string, selectedTab: string) => {
    updateFormStructure((prev: FormStructure) => {
      let hasChanges = false;
      
      const updateTabsInSection = (section: FormSection): FormSection => {
        // Early return if no fields to update
        if (!section.fields?.length) return section;

        const updatedFields = section.fields.map((field:any) => {
          // Handle tab form fields
          if (field.name === fieldName && field.tag === "tabs-form") {
            if (field?.subformstructure?.length) {
              const updatedSubform = field.subformstructure.map((subSection:any) =>
                findTabsForm(subSection, selectedTab)
              );
              if (updatedSubform !== field.subformstructure) {
                hasChanges = true;
                return { ...field, subformstructure: updatedSubform };
              }
            }
          }

          // Handle nested fields
          if (field.subformstructure?.length) {
            const updatedSubform = field.subformstructure.map(updateTabsInSection);
            if (updatedSubform !== field.subformstructure) {
              hasChanges = true;
              return { ...field, subformstructure: updatedSubform };
            }
          }

          return field;
        });

        // Only create new section if there are changes
        if (hasChanges || updatedFields !== section.fields) {
          return { ...section, fields: updatedFields };
        }
        return section;
      };

      // Early return if no changes
      const updatedSubformstructure = prev.subformstructure.map(updateTabsInSection);
      if (!hasChanges && updatedSubformstructure === prev.subformstructure) {
        return prev;
      }

      return {
        ...prev,
        subformstructure: updatedSubformstructure
      };
    });
  }, [updateFormStructure, findTabsForm]);

  return {
    handleFieldUpdate,
    handleTabUpdate
  };
}; 