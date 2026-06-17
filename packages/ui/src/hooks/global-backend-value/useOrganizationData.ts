import { useDynamicQuery } from '../api/dynamic-graphql';

interface Location {
  locationName: string;
  locationCode: string;
}

interface OrganizationField {
  label: string;
  value: string;
  [key: string]: any;
}

interface SubsidiaryField extends OrganizationField {
  location?: {
    locationCode: string;
  };
}

interface OrganizationData {
  _id: string;
  organizationName: string;
  organizationCode: string;
  subsidiaries: SubsidiaryField[];
  designations: OrganizationField[];
  grades: OrganizationField[];
  divisions: OrganizationField[];
  departments: OrganizationField[];
  subDepartments: OrganizationField[];
  sections: OrganizationField[];
  location: Location;
}

interface ParentMap {
  [key: string]: {
    parentField: string;
    parentCodeField: string;
    parentNameField: string;
  };
}

const PARENT_MAPPING: ParentMap = {
  subsidiaries: {
    parentField: 'location',
    parentCodeField: 'locationCode',
    parentNameField: 'locationName'
  },
  designations: {
    parentField: 'divisions',
    parentCodeField: 'divisionCode',
    parentNameField: 'divisionName'
  },
  grades: {
    parentField: 'designations',
    parentCodeField: 'designationCode',
    parentNameField: 'designationName'
  },
  divisions: {
    parentField: 'subsidiaries',
    parentCodeField: 'subsidiaryCode',
    parentNameField: 'subsidiaryName'
  },
  departments: {
    parentField: 'divisions',
    parentCodeField: 'divisionCode',
    parentNameField: 'divisionName'
  },
  subDepartments: {
    parentField: 'departments',
    parentCodeField: 'departmentCode',
    parentNameField: 'departmentName'
  },
  sections: {
    parentField: 'subDepartments',
    parentCodeField: 'subDepartmentCode',
    parentNameField: 'subDepartmentName'
  }
};

const findParentInfo = (
  item: OrganizationField,
  parentField: string,
  parentCodeField: string,
  parentNameField: string,
  data: OrganizationData
): Record<string, string> => {
  const parentCode = item[parentCodeField];
  if (!parentCode) return {};

  const parentItems = data[parentField as keyof OrganizationData] as OrganizationField[];
  if (!parentItems) return {};

  const parent = parentItems.find(p => p.value === parentCode);
  if (!parent) return {};

  // Recursively find parent's parent
  const currentParentMapping = PARENT_MAPPING[parentField as keyof typeof PARENT_MAPPING];
  if (currentParentMapping) {
    const grandParentInfo = findParentInfo(
      parent,
      currentParentMapping.parentField,
      currentParentMapping.parentCodeField,
      currentParentMapping.parentNameField,
      data
    );
    return {
      ...grandParentInfo,
      [`${parentField}Code`]: parentCode,
      [`${parentField}Name`]: parent.label
    };
  }

  return {
    [`${parentField}Code`]: parentCode,
    [`${parentField}Name`]: parent.label
  };
};

export const useOrganizationData = (organizationId: string) => {
  const organizationFields = {
    fields: [
      '_id',
      'organizationName',
      'organizationCode',
      'subsidiaries { subsidiaryName, subsidiaryCode, location { locationCode } }',
      'designations { designationName, designationCode, divisionCode }',
      'grades { gradeName, gradeCode, designationCode }',
      'divisions { divisionName, divisionCode, subsidiaryCode }',
      'departments { departmentName, departmentCode, divisionCode }',
      'subDepartments { subDepartmentName, subDepartmentCode, departmentCode }',
      'sections { sectionName, sectionCode, subDepartmentCode }',
      'location { locationName, locationCode }'
    ]
  };

  const { data: rawData, loading, error } = useDynamicQuery(
    organizationFields,
    'organization',
    'GetOrganizationsById',
    'getOrganizationsById',
    { 
      id: organizationId,
      collection: 'organization'
    }
  );

  
  const transformData = (data: any): OrganizationData | null => {
    if (!data || !data.getOrganizationsById) {
      return null;
    }

    const orgData = data.getOrganizationsById;
    
    const transformedData: OrganizationData = {
      _id: orgData._id || '',
      organizationName: orgData.organizationName || '',
      organizationCode: orgData.organizationCode || '',
      subsidiaries: [],
      designations: [],
      grades: [],
      divisions: [],
      departments: [],
      subDepartments: [],
      sections: [],
      location: {
        locationName: orgData.location?.locationName || '',
        locationCode: orgData.location?.locationCode || ''
      }
    };

    // Transform location first
    if (orgData.location) {
      transformedData.location = {
        locationName: orgData.location.locationName || '',
        locationCode: orgData.location.locationCode || ''
      };
    }

    // Transform subsidiaries
    if (Array.isArray(orgData.subsidiaries)) {
      transformedData.subsidiaries = orgData.subsidiaries.map((subsidiary: any) => ({
        label: subsidiary.subsidiaryName || '',
        value: subsidiary.subsidiaryCode || '',
        locationCode: subsidiary.location?.locationCode || orgData.location?.locationCode || '',
        locationName: orgData.location?.locationName || ''
      }));
    }

    // Transform designations
    if (Array.isArray(orgData.designations)) {
      transformedData.designations = orgData.designations.map((designation: any) => ({
        label: designation.designationName || '',
        value: designation.designationCode || '',
        divisionCode: designation.divisionCode || ''
      }));
    }

    // Transform grades
    if (Array.isArray(orgData.grades)) {
      transformedData.grades = orgData.grades.map((grade: any) => ({
        label: grade.gradeName || '',
        value: grade.gradeCode || '',
        designationCode: grade.designationCode || ''
      }));
    }

    // Transform divisions
    if (Array.isArray(orgData.divisions)) {
      transformedData.divisions = orgData.divisions.map((division: any) => ({
        label: division.divisionName || '',
        value: division.divisionCode || '',
        subsidiaryCode: division.subsidiaryCode || ''
      }));
    }

    // Transform departments
    if (Array.isArray(orgData.departments)) {
      transformedData.departments = orgData.departments.map((department: any) => ({
        label: department.departmentName || '',
        value: department.departmentCode || '',
        divisionCode: department.divisionCode || ''
      }));
    }

    // Transform subDepartments
    if (Array.isArray(orgData.subDepartments)) {
      transformedData.subDepartments = orgData.subDepartments.map((subDept: any) => ({
        label: subDept.subDepartmentName || '',
        value: subDept.subDepartmentCode || '',
        departmentCode: subDept.departmentCode || ''
      }));
    }

    // Transform sections
    if (Array.isArray(orgData.sections)) {
      transformedData.sections = orgData.sections.map((section: any) => ({
        label: section.sectionName || '',
        value: section.sectionCode || '',
        subDepartmentCode: section.subDepartmentCode || ''
      }));
    }

    
    // Process each field that needs parent information
    Object.entries(PARENT_MAPPING).forEach(([field, mapping]) => {
      const items = transformedData[field as keyof OrganizationData] as OrganizationField[];
      
      if (items && Array.isArray(items)) {
        const transformedItems = items.map(item => {
          const parentInfo = findParentInfo(
            item,
            mapping.parentField,
            mapping.parentCodeField,
            mapping.parentNameField,
            transformedData
          );
          return {
            ...item,
            ...parentInfo
          };
        });
        (transformedData[field as keyof OrganizationData] as OrganizationField[]) = transformedItems;
      }
    });
    return transformedData;
  };

  // Ensure rawData is properly structured before transformation
  const processedData = rawData ? transformData(rawData) : null;

  return {
    data: processedData,
    loading,
    error
  };
};

// Example usage:
/*
const { data, loading, error } = useOrganizationData('6818b9d25bae1b825788016b');

// The data will now include parent information for each item
// For example, a section will include:
{
  label: "Section-1",
  value: "sec1",
  subDepartmentCode: "subDept1",
  subDepartmentName: "SubDepartment-1",
  departmentCode: "dept1",
  departmentName: "Department-1",
  divisionCode: "div1",
  divisionName: "Division-1",
  subsidiaryCode: "sub1",
  subsidiaryName: "Subsidiary-1"
}
*/