import { useCallback } from 'react';

const flattenObject = (obj: any, prefix = ''): Record<string, any> => {
  return Object.keys(obj).reduce((acc: Record<string, any>, key: string) => {
    const pre = prefix.length ? `${prefix}-` : '';
    
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      // If the value is an object (but not null or array), flatten it recursively
      Object.assign(acc, flattenObject(obj[key], `${pre}${key}`));
    } else {
      // For primitive values or arrays, keep them as is
      acc[`${pre}${key}`] = obj[key];
    }
    
    return acc;
  }, {});
};

const updateFormFields = (formStructure: any, values: Record<string, any>) => {
  const updateFieldsInSection = (section: any) => {
    if (section.fields && Array.isArray(section.fields)) {
      section.fields.forEach((field: any) => {
        // Skip if field or field.name is undefined
        if (!field || typeof field.name === 'undefined') {
          return;
        }

        // Update the field value if it exists in the flattened values
        if (values.hasOwnProperty(field.name)) {
          // Ensure the value is set and not undefined/null
          const newValue = values[field.name];
          if (newValue !== undefined && newValue !== null) {
            field.value = newValue;
          }
        }

        // Handle special cases for nested fields (like maximumApplicationAllowed)
        if (typeof field.name === 'string' && field.name.includes('-')) {
          const [parent, child] = field.name.split('-');
          if (values[parent] && typeof values[parent] === 'object') {
            const nestedValue = values[parent][child];
            if (nestedValue !== undefined && nestedValue !== null) {
              field.value = nestedValue;
            }
          }
        }

        // Handle children fields if they exist
        if (field.children && Array.isArray(field.children)) {
          updateFieldsInSection({ fields: field.children });
        }
      });
    }
  };

  // Update each section in the form structure
  if (formStructure?.subformstructure && Array.isArray(formStructure.subformstructure)) {
    formStructure.subformstructure.forEach((section: any) => {
      if (section) {
        updateFieldsInSection(section);
      }
    });
  }

  return formStructure;
};

export const useDynamicFieldUpdate = () => {
  const updateField = useCallback(
    (value: any, formJson: any) => {
      // Validate inputs
      if (!formJson || typeof formJson !== 'object') {
        console.error('Invalid form JSON provided');
        return formJson;
      }

      // Create a deep copy of the form JSON to avoid mutating the original
      const updatedFormJson = JSON.parse(JSON.stringify(formJson));
      
      // Transform the value to flat structure, ensuring we have an object
      const transformedValue = flattenObject(value || {});

      // Log the transformed values for debugging

      // Update the form structure with the transformed values
      const updatedForm = updateFormFields(updatedFormJson, transformedValue);

      // Log the updated form for debugging

      return updatedForm;
    },
    []
  );

  return { updateField };
};