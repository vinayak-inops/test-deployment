import { useCallback } from 'react';
import { FormField, FormSection } from '../../type/dynamic-form/types';

interface UseTabFormReturn {
  findTabsForm: (section: FormSection, selectedTab: string) => FormSection;
  processTabForm: (section: FormSection) => FormSection;
}

/**
 * Custom hook to manage tab form operations
 * Provides optimized functions for handling tab form updates and processing
 */
export const useTabForm = (): UseTabFormReturn => {
  /**
   * Updates form fields based on tab selection
   * Handles required field states and nested form structures
   */
  const findTabsForm = useCallback((section: FormSection, selectedTab: string): FormSection => {
    // Early return if no fields to process
    if (!section?.fields?.length) return section;

    return {
      ...section,
      fields: section.fields.map((field: any) => {
        // Create updated field with proper required states
        const updatedField: any = {
          ...field,
          backendrequired: field?.required,
          required: field?.required ? section?.tabs?.includes(selectedTab) : field?.required
        };

        // Process nested form structure if exists
        if (field?.subformstructure?.length) {
          const firstTabValue = field?.tabs?.[0]?.value || '';
          updatedField.subformstructure = field.subformstructure.map((subSection: FormSection) =>
            findTabsForm(subSection, firstTabValue)
          );
        }

        return updatedField;
      })
    };
  }, []); // Empty dependency array since this is a pure function

  /**
   * Processes a form section to handle tab form initialization
   * Sets up initial tab states and nested form structures
   */
  const processTabForm = useCallback((section: FormSection): FormSection => {
    // Early return if no fields to process
    if (!section?.fields?.length) return section;

    return {
      ...section,
      fields: section.fields.map((field: any) => {
        // Handle tab form fields
        if (field.tag === "tabs-form" && field?.subformstructure?.length) {
          const firstTabValue = field?.tabs?.[0]?.value;
          if (!firstTabValue) return field;

          return {
            ...field,
            subformstructure: field.subformstructure.map((subSection: FormSection) =>
              findTabsForm(subSection, firstTabValue)
            )
          };
        }

        // Process nested form structure if exists
        if (field?.subformstructure?.length) {
          return {
            ...field,
            subformstructure: field.subformstructure.map(processTabForm)
          };
        }

        return field;
      })
    };
  }, [findTabsForm]); // Depends on findTabsForm

  return {
    findTabsForm,
    processTabForm
  };
}; 