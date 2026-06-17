// Function to get parent field details for a given field name
export function getParentFieldDetails(formStructure: any, fieldName: string): any[] {
  const parentMap: Record<string, string | null> = {};
  const fieldDetails: Record<string, any> = {};

  // Helper to process fields recursively
  function processFields(fields: any[], parent: string | null) {
    for (const field of fields) {
      if (field.name) {
        if (!parentMap[field.name]) {
          parentMap[field.name] = parent;
        }
        fieldDetails[field.name] = {
          name: field.name,
          label: field.label,
          type: field.type,
          tag: field.tag,
          mode: field.mode,
          value: field.value,
          placeholder: field.placeholder,
          options: field.options,
          required: field.required,
          children: field.children,
          classvalue: field.classvalue,
          onChange: field.onChange
        };
        if (field.children && Array.isArray(field.children)) {
          for (const child of field.children) {
            parentMap[child] = field.name;
          }
        }
      }
    }
  }

  // Process all subforms in the form structure
  if (formStructure.subformstructure) {
    for (const subform of formStructure.subformstructure) {
      if (subform.fields) {
        processFields(subform.fields, null);
      }
    }
  }

  // Build array of parent field details
  const parents: any[] = [];
  let current = parentMap[fieldName];
  while (current) {
    if (fieldDetails[current]) {
      parents.push(fieldDetails[current]);
    }
    current = parentMap[current];
  }

  return parents;
}

// Test function to demonstrate getParentFieldDetails
export function testParentFieldDetails(formStructure: any) {
  // Test with different fields
  const testFields = ["section", "subdepartment", "department", "division", "subsidiary", "location", "organization"];
  
  testFields.forEach(fieldName => {
    const parents = getParentFieldDetails(formStructure, fieldName);
    
    if (parents.length === 0) {
    } else {
      
    }
  });
}

// Example usage:
/*
To use this in your code:

import { getParentFieldDetails, testParentFieldDetails } from './parent-child';

// For testing with your form structure:
testParentFieldDetails(yourFormStructure);

// Or for getting parents of a specific field:
const parents = getParentFieldDetails(yourFormStructure, "section");

*/
