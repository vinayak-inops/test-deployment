/**
 * Utility functions for handling dynamic form operations
 */

import { FormField, FormSection, FormStructure } from '../../type/dynamic-form/types';

/**
 * Extracts default values from the form structure
 * Recursively traverses the form structure to build a flat object of field values
 * @param department - The form structure to extract values from
 * @returns Record of field names and their default values
 */
export const getDefaultValuesFromStructure = (department: FormStructure): Record<string, any> => {
  const defaultValues: Record<string, any> = {};

  const traverse = (fields: FormField[]) => {
    fields?.forEach((field) => {
      if (field.name) {
        defaultValues[field.name] = field.value ?? "";
      }
      if (field.children) {
        traverse(field.children);
      }
    });
  };

  department.subformstructure?.forEach((section) => {
    traverse(section.fields || []);
  });

  return defaultValues;
};

/**
 * Processes a form section, handling special cases like table forms
 * For table forms, it creates dynamic fields based on the table data
 * @param section - The form section to process
 * @returns Processed form section with dynamic fields if applicable
 */
export const processSection = (section: FormSection): FormSection => {
  if (section.formtype === "table-form") {
    const tableFormField:any = section.fields.find(
      (f) => f.type === "table-form"
    );
    const baseFields = section.fields.filter(
      (f) => f.formgrid === "table-form"
    );

    if (!tableFormField || !tableFormField.tabledata) return section;

    const dynamicFields: any[] = [];

    // Create dynamic fields for each row in the table
    tableFormField.tabledata.forEach((row:any) => {
      Object.entries(row).forEach(([key, value]) => {
        if (key === "_id") return;
        const templateField = baseFields.find((f) => f.name === key);
        if (templateField) {
          dynamicFields.push({
            ...templateField,
            name: `${row._id}-${key}`,
            value: value
          });
        } 
      });
    });

    return {
      ...section,
      fields: [tableFormField, ...dynamicFields],
    };
  }

  // Process nested form structures
  return {
    ...section,
    fields: section.fields.map((field:any) => {
      if (field.subformstructure && field.subformstructure.length > 0) {
        return {
          ...field,
          subformstructure: field.subformstructure.map(processSection),
        };
      }
      return field;
    }),
  };
}; 