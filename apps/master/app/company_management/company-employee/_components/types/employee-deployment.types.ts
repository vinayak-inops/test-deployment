// Basic Employee Information Types
export interface BasicInformationData {
  employeeCode: string
  firstName: string
  middleName: string
  lastName: string
  gender: string
  birthDate: string
  bloodGroup: string
  nationality: string
  maritalStatus: string
  joiningDate: string
  emailID: string
  photo?: string
}

// Organizational Structure Types
export interface OrganizationalStructureData {
  subsidiary: {
    subsidiaryCode: string
    subsidiaryName: string
  }
  division: {
    divisionCode: string
    divisionName: string
  }
  department: {
    departmentCode: string
    departmentName: string
  }
  subDepartment: {
    subDepartmentCode: string
    subDepartmentName: string
  }
  section: {
    sectionCode: string
    sectionName: string
  }
}

// Deployment Details Types
export interface DeploymentDetailsData {
  employeeCategory: {
    employeeCategoryCode: string
    employeeCategoryTitle: string
  }
  grade: {
    gradeCode: string
    gradeTitle: string
  }
  designation: {
    designationCode: string
    designationName: string
  }
  location: {
    locationCode: string
    locationName: string
  }
  skillLevel: {
    skilledLevelTitle: string
    skilledLevelDescription: string
  }
}

// Management Hierarchy Types
export interface ManagementHierarchyData {
  manager: string
  employeeCode: string
  firstName: string
  lastName: string
}

// Settings & Remarks Types
export interface SettingsRemarksData {
  effectiveFrom: string
  status: string
  remark: string
  employeeCode: string
  firstName: string
  lastName: string
  departmentName: string
  designationName: string
  locationName: string
  manager: string
}

// Complete Employee Deployment Data
export interface EmployeeDeploymentData {
  // Basic Information
  employeeID: string
  firstName: string
  middleName: string
  lastName: string
  gender: string
  birthDate: string
  bloodGroup: string
  nationality: string
  maritalStatus: string
  joiningDate: string
  emailID: string
  manager: string
  photo?: string

  // Deployment Structure
  deployment: {
    subsidiary: {
      subsidiaryCode: string
      subsidiaryName: string
    }
    division: {
      divisionCode: string
      divisionName: string
    }
    department: {
      departmentCode: string
      departmentName: string
    }
    subDepartment: {
      subDepartmentCode: string
      subDepartmentName: string
    }
    section: {
      sectionCode: string
      sectionName: string
    }
    employeeCategory: {
      employeeCategoryCode: string
      employeeCategoryTitle: string
    }
    grade: {
      gradeCode: string
      gradeTitle: string
    }
    designation: {
      designationCode: string
      designationName: string
    }
    location: {
      locationCode: string
      locationName: string
    }
    skillLevel: {
      skilledLevelTitle: string
      skilledLevelDescription: string
    }
    effectiveFrom: string
    remark: string
  }
} 