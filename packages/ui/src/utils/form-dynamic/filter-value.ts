
export const filterValue = (
  fieldUpdateControl: (field: string) => { startingValue: Record<string, any[]> },
  fieldName: string,
  watch: (field: string) => any[],
) => {
  // Define child field relationships
  const childFieldMap: Record<string, string[]> = {
    subsidiaries: ["divisions"],
    divisions: ["departments", "designations"],
    departments: ["subdepartments"],
    subdepartments: ["sections"],
    sections: [],
    designations: ["grades"],
    grades: []
  };

  const childFields = childFieldMap[fieldName] || [];
  const orgData = fieldUpdateControl("subsidiaries")?.startingValue || {};
  const selectedValues = watch(fieldName) || [];
  
  // Create an object to store filtered arrays for each child field
  const filteredData: Record<string, any[]> = {};
  
  // Initialize arrays for each child field
  childFields.forEach(field => {
    filteredData[field] = [];
    
    if (!orgData[field]) return;

    // Filter items based on parent-child relationship
    orgData[field].forEach(item => {
      if (!item) return;

      const shouldInclude = selectedValues.some(selected => {
        if (!selected) return false;

        switch (fieldName) {
          case "subsidiaries":
            return field === "location" || field === "divisions" 
              ? item.subsidiaryCode === selected
              : false;
          
          case "divisions":
            return field === "departments" || field === "designations"
              ? item.divisionCode === selected
              : false;
          
          case "departments":
            return field === "subdepartments"
              ? item.departmentCode === selected
              : false;
          
          case "subdepartments":
            return field === "sections"
              ? item.subDepartmentCode === selected
              : false;
          
          case "designations":
            return field === "grades"
              ? item.designationCode === selected
              : false;
          
          default:
            return false;
        }
      });

      if (shouldInclude) {
        (filteredData[field] as any[]).push(item);
      }
    });
  });

  return filteredData;
};
