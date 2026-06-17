export function extractAndGroupFieldss(fields: any) {
    let result: any[] = [];
  
    // Recursive function to traverse and collect fields
    function traverse(field: any) {
      if (field.displayOrder !== undefined) {
        result.push(field);
      }
      if (field.children) {
        field.children.forEach(traverse);
      }
    }
  
    // Traverse all fields
    fields?.forEach(traverse);
  
    // Sort by displayOrder
    result.sort((a, b) => a.displayOrder - b.displayOrder);
  
    // Group fields based on fieldgrid
    let groupedFields: any = {};
    result.forEach((field) => {
      let grid = field.fieldGrid || 1; // Default to 1 if fieldgrid is missing
      if (!groupedFields[grid]) {
        groupedFields[grid] = [];
      }
      groupedFields[grid].push(field);
    });
  
    // Convert object to an array
    return Object.values(groupedFields);
  }