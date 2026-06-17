// Function to update the value for the field in form structure
export const updateFieldValue = (
  fields: any,
  targetName: string,
  newValue: string
) => {
  return fields.map((field: any) => {
    if (field.name === targetName) {
      // If the field matches, update its value
      return { ...field, value: newValue };
    }

    // If the field has children, search recursively
    if (field.children && field.children.length > 0) {
      return {
        ...field,
        children: updateFieldValue(field.children, targetName, newValue),
      };
    }

    return field; // Return the field unchanged if no match
  });
};

export const findUpdatedObject = (fields:any, targetName:string, newValue:string) => {
  for (let field of fields) {
    // If the field matches, update its value and return the updated object
    if (field.name === targetName) {
      return { ...field, value: newValue };
    }

    // If the field has children, search recursively
    if (field.children && field.children.length > 0) {
      const updatedChild = findUpdatedObject(
        field.children,
        targetName,
        newValue
      );
      if (updatedChild) {
        return {
          ...field,
          children: field.children.map((child:any) =>
            child.name === updatedChild.name ? updatedChild : child
          ),
        };
      }
    }
  }

  return null; // Return null if no match is found
};

export const removeFieldOptions = (child: any, setValue: any): any => {
  setValue(child.name, "");
  return {
    ...child,
    options: [], // Clear options
    children: child.children ? child.children.map((c: any) => removeFieldOptions(c, setValue)) : [],
  };
};

export const updateFieldOptions = (
  fields: any[],
  targetName: string,
  newOptions: any[],
  setValue: any
): any[] => {
  return fields.map((field) => {
    if (field.name === targetName) {
      let updatedChildren = field.children
        ? field.children.map((child: any) => removeFieldOptions(child, setValue))
        : [];

      // If there's a next linked field, set its options with new values
      if (updatedChildren.length > 0) {
        updatedChildren[0] = {
          ...updatedChildren[0],
          options: newOptions,
        };
      }

      return {
        ...field,
        children: updatedChildren,
        options: field.options, // Keep original options for the parent
      };
    }

    // Recursively search and update child fields
    if (field.children && field.children.length > 0) {
      return {
        ...field,
        children: updateFieldOptions(field.children, targetName, newOptions, setValue),
      };
    }

    return field; // Return unchanged
  });
};

export const groupTableFormFields = (input: any[][]) => {
  const result: any[] = [];

  input.forEach((section: any[]) => {
    // Find the table-form field
    const tableForm = section.find((f: any) => f.type === "table-form");
    if (!tableForm || !Array.isArray(tableForm.tabledata)) return;

    // Get all fields except the table-form field
    const fields = section.filter(field => field.type !== "table-form");
    
    // Process each row in tabledata
    tableForm.tabledata.forEach((row: any, rowIndex: number) => {
      const rowFields: Record<string, any[]> = {};
      
      // Process each field and create a copy with modified name
      fields.forEach((field: any) => {
        const columnName = field.columnsname;
        if (!columnName) return;

        // Create a deep copy of the field
        const fieldCopy = { 
          ...field,
          name: `${tableForm.name}-${field.name}-table${rowIndex + 1}`,
          value: row[columnName],
          columnsname: columnName
        };
        
        // Initialize array for this column if it doesn't exist
        if (!rowFields[columnName]) {
          rowFields[columnName] = [];
        }
        
        // Add the field to the array for this column
        rowFields[columnName].push(fieldCopy);
      });

      // Add the row's fields to the result array
      result.push(rowFields);
    });
  });

  return result;
};

// utils/deepCloneWithFunctions.ts
export const deepCloneWithFunctions = (obj: any): any => {
  if (obj === null || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map(deepCloneWithFunctions);
  }

  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepCloneWithFunctions(obj[key]);
    }
  }
  return cloned;
};


