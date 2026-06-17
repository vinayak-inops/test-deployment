// Types for the organization data
interface Location {
    label: string;
    value: string;
    regionCode?: string;
    countryCode?: string;
    stateCode?: string;
    city?: string;
    pincode?: string;
}

interface Region {
    regionCode: string;
    regionName: string;
}

interface Country {
    countryCode: string;
    countryName: string;
}

interface State {
    countryCode: string;
    stateCode: string;
    stateName: string;
    region: string;
}

interface Subsidiary {
    subsidiaryName?: string;
    subsidiaryCode?: string;
    subsidiaryDescription: string;
    locationCode: string;
    label?: string;
    value?: string;
    organizationCode: string;
}

interface Designation {
    divisionCode: string;
    subsidiaryCode: string;
    label?: string;
    value?: string;
    locationCode: string;
    organizationCode: string;
    designationCode?: string;
    designationName?: string;
    designationDescription: string;
}

interface Grade {
    gradeCode?: string;
    gradeName?: string;
    gradeDescription: string;
    divisionCode: string;
    subsidiaryCode: string;
    locationCode: string;
    organizationCode: string;
    designationCode: string;
    label?: string;
    value?: string;
}

interface Division {
    label?: string;
    value?: string;
    divisionName?: string;
    divisionCode?: string;
    subsidiaryCode: string;
    locationCode: string;
    organizationCode: string;
    divisionDescription: string;
}

interface Department {
    label?: string;
    value?: string;
    divisionCode: string;
    subsidiaryCode: string;
    locationCode: string;
    organizationCode: string;
    departmentName?: string;
    departmentCode?: string;
    departmentDescription: string;
}

interface SubDepartment {
    label?: string;
    value?: string;
    divisionCode: string;
    subsidiaryCode: string;
    locationCode: string;
    organizationCode: string;
    departmentCode: string;
    subDepartmentName?: string;
    subDepartmentCode?: string;
    subDepartmentDescription: string;
}

interface Section {
    label?: string;
    value?: string;
    divisionCode: string;
    subsidiaryCode: string;
    locationCode: string;
    organizationCode: string;
    departmentCode: string;
    subDepartmentCode: string;
    sectionName: string;
    sectionCode: string;
    sectionDescription: string;
}

interface AuditTrail {
    createdBy: string;
    updatedBy: string;
    createdOn: {
        $date: string;
    };
    updatedOn: {
        $date: string;
    };
}

interface EmployeeCategory {
    label?: string;
    value?: string;
    employeeCategoryCode?: string;
    employeeCategoryName?: string;
    employeeCategoryDescription: string;
}

interface SkillLevel {
    label?: string;
    value?: string;
    skilledLevelTitle?: string;
    skilledLevelDescription?: string;
}

interface WagePeriod {
    employeeCategory: {
        employeeCategoryCode: string;
        employeeCategoryName: string;
    };
    wagePeriod: {
        from: number;
        to: number;
    };
}

interface WorkSkill {
    workSkillCode: string;
    workSkillTitle: string;
}

interface NatureOfWork {
    natureOfWorkCode: string;
    natureOfWorkTitle: string;
}

interface Asset {
    assetCode: string;
    assetName: string;
    assetType: string;
}

interface AssetMaster {
    assets: Asset[];
    assetTypes: string[];
}

interface TrainingProgram {
    trainingProgramCode: string;
    trainingProgramTitle: string;
    trainingCategoryCode: string;
}

interface TrainingCategory {
    trainingCategoryCode: string;
    trainingCategoryTitle: string;
}

interface TrainingMaster {
    trainingPrograms: TrainingProgram[];
    trainingCategories: TrainingCategory[];
}

interface Organization {
    _id: {
        $oid: string;
    };
    organizationName: string;
    organizationCode: string;
    addressLine1: string | null;
    addressLine2: string | null;
    city: string;
    pinCode: string;
    state: State[];
    country: Country[];
    logoFileName: string;
    description: string;
    emailId: string;
    contactPersonContactNumber: string;
    registrationNo: string;
    tenantCode: string;
    isActive: number;
    subsidiaries: Subsidiary[];
    designations: Designation[];
    grades: Grade[];
    divisions: Division[];
    departments: Department[];
    subDepartments: SubDepartment[];
    sections: Section[];
    auditTrail: AuditTrail;
    employeeCategories: EmployeeCategory[];
    skillLevels: SkillLevel[];
    wagePeriod: WagePeriod[];
    firstMonthOfFinancialYear: number;
    workSkill: WorkSkill[];
    natureOfWork: NatureOfWork[];
    region: Region[];
    location: Location[];
    assetMaster: AssetMaster;
    trainingMaster: TrainingMaster;
}

// Export the organization data
export const organizationData: Organization = {
    _id: {
        $oid: "6839a36e20fbaf23ae2c410c"
    },
    organizationName: "Ashok Leyland Limited New",
    organizationCode: "ALLNew",
    addressLine1: null,
    addressLine2: null,
    city: "Hosur",
    pinCode: "411029",
    state: [
        {
            countryCode: "IN",
            stateCode: "OR",
            stateName: "Odisha",
            region: "Eastern India"
        },
        {
            countryCode: "IN",
            stateCode: "KA",
            stateName: "Karnataka",
            region: "Southern India"
        },
        {
            countryCode: "IN",
            stateCode: "PB",
            stateName: "Punjab",
            region: "Northern India"
        },
        {
            countryCode: "IN",
            stateCode: "WB",
            stateName: "West Bengal",
            region: "Eastern India"
        },
        {
            countryCode: "IN",
            stateCode: "MH",
            stateName: "Maharashtra",
            region: "Western India"
        },
        {
            countryCode: "IN",
            stateCode: "GJ",
            stateName: "Gujarat",
            region: "Western India"
        },
        {
            countryCode: "IN",
            stateCode: "RJ",
            stateName: "Rajasthan",
            region: "Western India"
        },
        {
            countryCode: "IN",
            stateCode: "TN",
            stateName: "Tamil Nadu",
            region: "Southern India"
        },
        {
            countryCode: "IN",
            stateCode: "MP",
            stateName: "Madhya Pradesh",
            region: "Central India"
        }
    ],
    country: [
        {
            countryCode: "IN",
            countryName: "India"
        },
        {
            countryCode: "US",
            countryName: "United States"
        },
        {
            countryCode: "DE",
            countryName: "Germany"
        },
        {
            countryCode: "BR",
            countryName: "Brazil"
        },
        {
            countryCode: "ZA",
            countryName: "South Africa"
        },
        {
            countryCode: "JP",
            countryName: "Japan"
        },
        {
            countryCode: "FR",
            countryName: "France"
        },
        {
            countryCode: "RU",
            countryName: "Russia"
        },
        {
            countryCode: "AU",
            countryName: "Australia"
        },
        {
            countryCode: "CN",
            countryName: "China"
        }
    ],
    logoFileName: "bb31b165-26ec-4ff0-8580-dfb7520beb37.png",
    description: "Ashok Leyland",
    emailId: "d@d.com",
    contactPersonContactNumber: "3456564",
    registrationNo: "3534646457457",
    tenantCode: "tenant1",
    isActive: 1,
    subsidiaries: [
        {
            label: "Subsidiary-1",
            value: "sub1",
            subsidiaryDescription: "Description of Subsidiary-1",
            locationCode: "LOC001",
            organizationCode: "ALLNew"
        }
    ],
    designations: [
        {
            label: "Designation-1",
            value: "des1",
            divisionCode: "div1",
            subsidiaryCode: "sub1",
            locationCode: "LOC001",
            organizationCode: "ALLNew",
            designationDescription: "Handles team management and operations"
        }
    ],
    grades: [
        {
            label: "Grade-1",
            value: "gr1",
            gradeDescription: "Highest Grade",
            divisionCode: "div1",
            subsidiaryCode: "sub1",
            locationCode: "LOC001",
            organizationCode: "ALLNew",
            designationCode: "des1"
        }
    ],
    divisions: [
        {
            label: "Division-1",
            value: "div1",
            subsidiaryCode: "sub1",
            locationCode: "LOC001",
            organizationCode: "ALLNew",
            divisionDescription: "Description of Division-1"
        }
    ],
    departments: [
        {
            label: "Department-1",
            value: "dept1",
            divisionCode: "div1",
            subsidiaryCode: "sub1",
            locationCode: "LOC001",
            organizationCode: "ALLNew",
            departmentDescription: "Description of Department-1"
        }
    ],
    subDepartments: [
        {
            label: "SubDepartment-1",
            value: "subDept1",
            divisionCode: "div1",
            subsidiaryCode: "sub1",
            locationCode: "LOC001",
            organizationCode: "ALLNew",
            departmentCode: "dept1",
            subDepartmentDescription: "Description of SubDepartment-1"
        }
    ],
    sections: [
        {
            label: "Section-1",
            value: "sec1",
            divisionCode: "div1",
            subsidiaryCode: "sub1",
            locationCode: "LOC001",
            organizationCode: "ALLNew",
            departmentCode: "dept1",
            subDepartmentCode: "subDept1",
            sectionName: "Section-1",
            sectionCode: "sec1",
            sectionDescription: "Description of Section-1"
        }
    ],
    auditTrail: {
        createdBy: "admin",
        updatedBy: "admin",
        createdOn: {
            $date: "2025-03-10T09:00:00.000Z"
        },
        updatedOn: {
            $date: "2025-03-10T09:00:00.000Z"
        }
    },
    employeeCategories: [
        {
            label: "Employee Category-1",
            value: "empCat1",
            employeeCategoryCode: "WKM",
            employeeCategoryName: "WKM",
            employeeCategoryDescription: "Testing categories"
        }
    ],
    skillLevels: [
        {
            skilledLevelTitle: "Low-Skilled",
            skilledLevelDescription: "Entry-level skills"
        },
        {
            skilledLevelTitle: "Semi-Skilled",
            skilledLevelDescription: "Moderate experience"
        },
        {
            skilledLevelTitle: "Highly-Skilled",
            skilledLevelDescription: "High-level expertise"
        }
    ],
    wagePeriod: [
        {
            employeeCategory: {
                employeeCategoryCode: "WKM",
                employeeCategoryName: "WKM"
            },
            wagePeriod: {
                from: 10,
                to: 9
            }
        }
    ],
    firstMonthOfFinancialYear: 1,
    workSkill: [
        {
            workSkillCode: "WSK001",
            workSkillTitle: "Electrician"
        },
        {
            workSkillCode: "WSK002",
            workSkillTitle: "Plumber"
        },
        {
            workSkillCode: "WSK003",
            workSkillTitle: "Carpenter"
        },
        {
            workSkillCode: "WSK004",
            workSkillTitle: "Welder"
        },
        {
            workSkillCode: "WSK005",
            workSkillTitle: "Painter"
        },
        {
            workSkillCode: "WSK006",
            workSkillTitle: "Mason"
        },
        {
            workSkillCode: "WSK007",
            workSkillTitle: "Heavy Equipment Operator"
        },
        {
            workSkillCode: "WSK008",
            workSkillTitle: "HVAC Technician"
        },
        {
            workSkillCode: "WSK009",
            workSkillTitle: "Forklift Operator"
        },
        {
            workSkillCode: "WSK010",
            workSkillTitle: "Security Guard"
        }
    ],
    natureOfWork: [
        {
            natureOfWorkCode: "NOW001",
            natureOfWorkTitle: "Technical"
        },
        {
            natureOfWorkCode: "NOW002",
            natureOfWorkTitle: "Non-Technical"
        },
        {
            natureOfWorkCode: "NOW003",
            natureOfWorkTitle: "Skilled"
        },
        {
            natureOfWorkCode: "NOW004",
            natureOfWorkTitle: "Unskilled"
        },
        {
            natureOfWorkCode: "NOW005",
            natureOfWorkTitle: "Supervisory"
        },
        {
            natureOfWorkCode: "NOW006",
            natureOfWorkTitle: "Clerical"
        },
        {
            natureOfWorkCode: "NOW007",
            natureOfWorkTitle: "Administrative"
        },
        {
            natureOfWorkCode: "NOW008",
            natureOfWorkTitle: "Field Work"
        },
        {
            natureOfWorkCode: "NOW009",
            natureOfWorkTitle: "Maintenance"
        },
        {
            natureOfWorkCode: "NOW010",
            natureOfWorkTitle: "Logistics"
        }
    ],
    region: [
        {
            regionCode: "NE",
            regionName: "North-Eastern India"
        },
        {
            regionCode: "SI",
            regionName: "Southern India"
        },
        {
            regionCode: "NI",
            regionName: "Northern India"
        },
        {
            regionCode: "EI",
            regionName: "Eastern India"
        },
        {
            regionCode: "WI",
            regionName: "Western India"
        },
        {
            regionCode: "CI",
            regionName: "Central India"
        }
    ],
    location: [
        {
            label: "LOC001",
            value: "Mumbai Office"
        },
        {
            label: "LOC004",
            value: "Chennai Office",
            regionCode: "SI",
            countryCode: "IN",
            stateCode: "TN",
            city: "Chennai",
            pincode: "600001"
        },
        {
            label: "LOC005",
            value: "Bengaluru Office",
            regionCode: "SI",
            countryCode: "IN",
            stateCode: "KA",
            city: "Bengaluru",
            pincode: "560001"
        },
        {
            label: "LOC002",
            value: "Delhi Office",
            regionCode: "NI",
            countryCode: "IN",
            stateCode: "DL",
            city: "Delhi",
            pincode: "110001"
        },
        {
            label: "LOC003",
            value: "Kolkata Office",
            regionCode: "EI",
            countryCode: "IN",
            stateCode: "WB",
            city: "Kolkata",
            pincode: "700001"
        },
        {
            label: "LOC006",
            value: "Jaipur Office",
            regionCode: "WI",
            countryCode: "IN",
            stateCode: "RJ",
            city: "Jaipur",
            pincode: "302001"
        },
        {
            label: "LOC007",
            value: "Hyderabad Office",
            regionCode: "SI",
            countryCode: "IN",
            stateCode: "TS",
            city: "Hyderabad",
            pincode: "500001"
        },
        {
            label: "LOC008",
            value: "Lucknow Office",
            regionCode: "NI",
            countryCode: "IN",
            stateCode: "UP",
            city: "Lucknow",
            pincode: "226001"
        },
        {
            label: "LOC009",
            value: "Ahmedabad Office",
            regionCode: "WI",
            countryCode: "IN",
            stateCode: "GJ",
            city: "Ahmedabad",
            pincode: "380001"
        },
        {
            label: "LOC010",
            value: "Bhubaneswar Office",
            regionCode: "EI",
            countryCode: "IN",
            stateCode: "OR",
            city: "Bhubaneswar",
            pincode: "751001"
        }
    ],
    assetMaster: {
        assets: [
            {
                assetCode: "A001",
                assetName: "Drilling Machine",
                assetType: "Returnable"
            },
            {
                assetCode: "A002",
                assetName: "Hammer",
                assetType: "Returnable"
            },
            {
                assetCode: "A003",
                assetName: "Safety Helmet",
                assetType: "Non-Returnable"
            },
            {
                assetCode: "A004",
                assetName: "Wrench",
                assetType: "Returnable"
            },
            {
                assetCode: "A005",
                assetName: "Toolbox",
                assetType: "Non-Returnable"
            }
        ],
        assetTypes: [
                "Returnable",
                "Non-Returnable"
            ]
    },
    trainingMaster: {
        trainingPrograms: [
            {
                trainingProgramCode: "TP001",
                trainingProgramTitle: "Safety Training",
                trainingCategoryCode: "TC001"
            },
            {
                trainingProgramCode: "TP002",
                trainingProgramTitle: "Leadership Training",
                trainingCategoryCode: "TC002"
            },
            {
                trainingProgramCode: "TP003",
                trainingProgramTitle: "Data Security Training",
                trainingCategoryCode: "TC003"
            },
            {
                trainingProgramCode: "TP004",
                trainingProgramTitle: "First Aid Training",
                trainingCategoryCode: "TC001"
            },
            {
                trainingProgramCode: "TP005",
                trainingProgramTitle: "Time Management",
                trainingCategoryCode: "TC002"
            }
        ],
        trainingCategories: [
            {
                trainingCategoryCode: "TC001",
                trainingCategoryTitle: "Safety Training"
            },
            {
                trainingCategoryCode: "TC002",
                trainingCategoryTitle: "Technical Training"
            },
            {
                trainingCategoryCode: "TC003",
                trainingCategoryTitle: "Leadership Training"
            },
            {
                trainingCategoryCode: "TC004",
                trainingCategoryTitle: "Soft Skills Training"
            },
            {
                trainingCategoryCode: "TC005",
                trainingCategoryTitle: "Onboarding Training"
            }
        ]
    }
};

export default organizationData;