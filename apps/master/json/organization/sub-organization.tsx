import { MapPin, Hash, Globe, Building2, UserCheck, Layers, FolderOpen, GraduationCap, Users, Briefcase, Award, Settings, Package, Eye, Edit, Trash2, Plus, Building } from "lucide-react";
import { FileText } from "lucide-react";

export const popupConfigs: Record<string, any> = {
    location: {
        title: "Location Details",
        description: "Comprehensive location information and management",
        fields: [
            { label: "Location Name", key: "locationName", icon: <MapPin className="w-4 h-4 text-blue-500" /> },
            { label: "Location Code", key: "locationCode", icon: <Hash className="w-4 h-4 text-green-500" /> },
            { label: "Region Code", key: "regionCode", icon: <Globe className="w-4 h-4 text-blue-500" /> },
            { label: "Country Code", key: "countryCode", icon: <Globe className="w-4 h-4 text-green-500" /> },
            { label: "State Code", key: "stateCode", icon: <MapPin className="w-4 h-4 text-purple-500" /> },
            { label: "City", key: "city", icon: <Building2 className="w-4 h-4 text-orange-500" /> },
            { label: "Pincode", key: "pincode", icon: <Hash className="w-4 h-4 text-pink-500" /> },
            { label: "Description", key: "locationDescription", isDescription: true },
        ],
        statusKey: "status"
    },
    subsidiaries: {
        title: "Subsidiary Details",
        description: "Comprehensive subsidiary information and management",
        fields: [
            { label: "Subsidiary Name", key: "subsidiaryName", icon: <Building2 className="w-4 h-4 text-blue-500" /> },
            { label: "Subsidiary Code", key: "subsidiaryCode", icon: <Hash className="w-4 h-4 text-green-500" /> },
            { label: "Description", key: "subsidiaryDescription", isDescription: true },
        ],
        statusKey: "status"
    },
    divisions: {
        title: "Division Details",
        description: "Comprehensive division information and management",
        fields: [
            { label: "Division Name", key: "divisionName", icon: <Layers className="w-4 h-4 text-green-500" /> },
            { label: "Division Code", key: "divisionCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "Subsidiary Code", key: "subsidiaryCode", icon: <Building2 className="w-4 h-4 text-purple-500" /> },
            { label: "Description", key: "divisionDescription", isDescription: true },
        ],
        statusKey: "status"
    },
    areas: {
        title: "Area Details",
        description: "Comprehensive area information and management",
        fields: [
            { label: "Area Name", key: "areaName", icon: <Layers className="w-4 h-4 text-green-500" /> },
            { label: "Area Code", key: "areaCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "Parent Area", key: "parentArea", icon: <Hash className="w-4 h-4 text-purple-500" /> },
            { label: "Subsidiary Code", key: "subsidiaryCode", icon: <Building2 className="w-4 h-4 text-cyan-500" /> },
            { label: "Description", key: "areaDescription", isDescription: true },
        ],
        statusKey: "status"
    },
    designations: {
        title: "Designation Details",
        description: "Comprehensive designation information and management",
        fields: [
            { label: "Designation Name", key: "designationName", icon: <UserCheck className="w-4 h-4 text-violet-500" /> },
            { label: "Designation Code", key: "designationCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "Division Code", key: "divisionCode", icon: <Hash className="w-4 h-4 text-purple-500" /> },
            { label: "Description", key: "designationDescription", isDescription: true },
        ],
        statusKey: "status"
    },
    departments: {
        title: "Department Details",
        description: "Comprehensive department information and management",
        fields: [
            { label: "Department Name", key: "departmentName", icon: <Building2 className="w-4 h-4 text-blue-500" /> },
            { label: "Department Code", key: "departmentCode", icon: <Hash className="w-4 h-4 text-green-500" /> },
            { label: "Division Code", key: "divisionCode", icon: <Hash className="w-4 h-4 text-purple-500" /> },
            { label: "Description", key: "departmentDescription", isDescription: true },
        ],
        statusKey: "status"
    },
    subDepartments: {
        title: "Sub Department Details",
        description: "Comprehensive sub department information and management",
        fields: [
            { label: "Sub Department Name", key: "subDepartmentName", icon: <Settings className="w-4 h-4 text-gray-500" /> },
            { label: "Sub Department Code", key: "subDepartmentCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "Department Code", key: "departmentCode", icon: <Hash className="w-4 h-4 text-purple-500" /> },
            { label: "Description", key: "subDepartmentDescription", isDescription: true },
        ],
        statusKey: "status"
    },
    sections: {
        title: "Section Details",
        description: "Comprehensive section information and management",
        fields: [
            { label: "Section Name", key: "sectionName", icon: <FolderOpen className="w-4 h-4 text-pink-500" /> },
            { label: "Section Code", key: "sectionCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "Sub Department Code", key: "subDepartmentCode", icon: <Hash className="w-4 h-4 text-purple-500" /> },
            { label: "Description", key: "sectionDescription", isDescription: true },
        ],
        statusKey: "status"
    },
    grades: {
        title: "Grade Details",
        description: "Comprehensive grade information and management",
        fields: [
            { label: "Grade Name", key: "gradeName", icon: <GraduationCap className="w-4 h-4 text-teal-500" /> },
            { label: "Grade Code", key: "gradeCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "Description", key: "gradeDescription", isDescription: true },
            { label: "Designation Code", key: "designationCode", icon: <UserCheck className="w-4 h-4 text-purple-500" /> },
        ],
        statusKey: "status"
    },
    employeeCategories: {
        title: "Employee Category Details",
        description: "Comprehensive employee category information and management",
        fields: [
            { label: "Employee Category Name", key: "employeeCategoryName", icon: <Users className="w-4 h-4 text-indigo-500" /> },
            { label: "Employee Category Code", key: "employeeCategoryCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "Description", key: "employeeCategoryDescription", isDescription: true },
        ],
        statusKey: "status"
    },
    natureOfWork: {
        title: "Nature Of Work Details",
        description: "Comprehensive nature of work information and management",
        fields: [
            { label: "Nature Of Work Title", key: "natureOfWorkTitle", icon: <Briefcase className="w-4 h-4 text-orange-500" /> },
            { label: "Nature Of Work Code", key: "natureOfWorkCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "Description", key: "natureOfWorkDescription", isDescription: true },
        ],
        statusKey: "status"
    },
    workSkill: {
        title: "Work Skill Details",
        description: "Comprehensive work skill information and management",
        fields: [
            { label: "Work Skill Title", key: "workSkillTitle", icon: <Award className="w-4 h-4 text-yellow-500" /> },
            { label: "Work Skill Code", key: "workSkillCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "Description", key: "workSkillDescription", isDescription: true },
        ],
        statusKey: "status"
    },
    region: {
        title: "Region Details",
        description: "Comprehensive region information and management",
        fields: [
            { label: "Region Name", key: "regionName", icon: <Globe className="w-4 h-4 text-cyan-500" /> },
            { label: "Region Code", key: "regionCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "Description", key: "regionDescription", isDescription: true },
        ],
        statusKey: "status"
    },
    reasonCodes: {
        title: "Reason Code Details",
        description: "Comprehensive reason code information and management",
        statusKey: "status",
        fields: [
            { label: "Reason Code", key: "reasonCode", icon: <FileText className="w-4 h-4 text-emerald-500" /> },
            { label: "Reason Name", key: "reasonName", icon: <FileText className="w-4 h-4 text-teal-500" /> },
            { label: "Description", key: "reasonDescription", icon: <FileText className="w-4 h-4 text-blue-500" /> }
        ]
    },
    wagePeriod: {
        title: "Wage Period Details",
        description: "Comprehensive wage period information and management",
        statusKey: "status",
        fields: [
            { label: "Employee Category Code", key: "employeeCategory.employeeCategoryCode", icon: <FileText className="w-4 h-4 text-emerald-500" /> },
            { label: "Employee Category Name", key: "employeeCategory.employeeCategoryName", icon: <FileText className="w-4 h-4 text-teal-500" /> },
            { label: "From Day", key: "wagePeriod.from", icon: <FileText className="w-4 h-4 text-blue-500" /> },
            { label: "To Day", key: "wagePeriod.to", icon: <FileText className="w-4 h-4 text-purple-500" /> }
        ]
    },
    skillLevels: {
        title: "Skill Level Details",
        description: "Comprehensive skill level information and management",
        statusKey: "status",
        fields: [
            { label: "Skill Level Title", key: "skilledLevelTitle", icon: <Award className="w-4 h-4 text-purple-500" /> },
            { label: "Description", key: "skilledLevelDescription", isDescription: true },
        ]
    },
    assetMaster: {
        title: "Asset Master Details",
        description: "Comprehensive asset master information and management",
        statusKey: "status",
        fields: [
            { label: "Asset Code", key: "assetCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "Asset Name", key: "assetName", icon: <FolderOpen className="w-4 h-4 text-green-500" /> },
            { label: "Asset Type", key: "assetType", icon: <Package className="w-4 h-4 text-purple-500" /> },
        ]
    },
    documentMaster: {
        title: "Document Master Details",
        description: "Comprehensive document master information and management",
        statusKey: "status",
        fields: [
            { label: "Document Category Code", key: "documentCategoryCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "Document Category Name", key: "documentCategoryName", icon: <FileText className="w-4 h-4 text-green-500" /> },
            { label: "Document Type", key: "documentType", icon: <FileText className="w-4 h-4 text-purple-500" /> },
        ]
    },
    state: {
        title: "State Details",
        description: "Comprehensive state information and management",
        statusKey: "status",
        fields: [
            { label: "State Name", key: "stateName", icon: <FileText className="w-4 h-4 text-blue-500" /> },
            { label: "State Code", key: "stateCode", icon: <Hash className="w-4 h-4 text-green-500" /> },
            { label: "Country Code", key: "countryCode", icon: <Hash className="w-4 h-4 text-purple-500" /> },
        ]
    },
    country: {
        title: "Country Details",
        description: "Comprehensive country information and management",
        statusKey: "status",
        fields: [
            { label: "Country Name", key: "countryName", icon: <FileText className="w-4 h-4 text-blue-500" /> },
            { label: "Country Code", key: "countryCode", icon: <Hash className="w-4 h-4 text-green-500" /> },
        ]
    },
    caste: {
        title: "Caste Details",
        description: "Comprehensive caste information and management",
        statusKey: "status",
        fields: [
            { label: "Caste Name", key: "casteName", icon: <FileText className="w-4 h-4 text-blue-500" /> },
        ]
    },
    leaveWages: {
        title: "Leave Wages Details",
        description: "Comprehensive leave wages information and management",
        statusKey: "status",
        fields: [
            { label: "Skill Level", key: "skillLeavel.skilledLevelTitle", icon: <FileText className="w-4 h-4 text-blue-500" /> },
            { label: "Skill Description", key: "skillLeavel.skilledLevelDescription", icon: <FileText className="w-4 h-4 text-green-500" /> },
            { label: "Basic Wage", key: "basicWage", icon: <FileText className="w-4 h-4 text-purple-500" /> },
            { label: "VDA", key: "VDA", icon: <FileText className="w-4 h-4 text-orange-500" /> },
            { label: "Total", key: "total", icon: <FileText className="w-4 h-4 text-blue-500" /> },
            { label: "EPF", key: "EPF", icon: <FileText className="w-4 h-4 text-red-500" /> },
            { label: "ESI", key: "ESI", icon: <FileText className="w-4 h-4 text-indigo-500" /> },
            { label: "PF Admin Charges", key: "pfAdminCharges", icon: <FileText className="w-4 h-4 text-pink-500" /> }
        ]
    },
    mailGroup: {
        title: "Mail Group Details",
        description: "Comprehensive mail group information and management",
        statusKey: "status",
        fields: [
            { label: "Mail Group Name", key: "mailGroupName", icon: <FileText className="w-4 h-4 text-blue-500" /> },
            { label: "Mail Group Code", key: "mailGroupCode", icon: <Hash className="w-4 h-4 text-green-500" /> },
        ]
    },
    centralServerDetails: {
        title: "Central Server Details",
        description: "Comprehensive central server connection information and management",
        statusKey: "status",
        fields: [
            { label: "Subsidiary Code", key: "subsidiaryCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "IP Address", key: "ipAddress", icon: <FileText className="w-4 h-4 text-green-500" /> },
            { label: "Port", key: "port", icon: <Hash className="w-4 h-4 text-purple-500" /> },
            { label: "User ID", key: "userID", icon: <Users className="w-4 h-4 text-orange-500" /> },
            { label: "Password", key: "password", icon: <FileText className="w-4 h-4 text-rose-500" /> },
        ]
    },
    maxEmployeesPerSubsidiary: {
        title: "Max Employees Per Subsidiary",
        description: "Comprehensive subsidiary employee limit information and management",
        statusKey: "status",
        fields: [
            { label: "Subsidiary Code", key: "subsidiaryCode", icon: <Hash className="w-4 h-4 text-blue-500" /> },
            { label: "Max Active Count Allowed", key: "maxActiveCountAllowed", icon: <Users className="w-4 h-4 text-green-500" /> },
            { label: "Active", key: "active", icon: <FileText className="w-4 h-4 text-purple-500" /> },
            { label: "Parse ID", key: "parseID", icon: <FileText className="w-4 h-4 text-orange-500" /> },
        ]
    },
    globalServerDetails: {
        title: "Global Server Details",
        description: "Comprehensive global server configuration and management",
        statusKey: "status",
        fields: [
            { label: "Server Name", key: "serverName", icon: <FileText className="w-4 h-4 text-blue-500" /> },
            { label: "IP Address", key: "ipAddress", icon: <FileText className="w-4 h-4 text-green-500" /> },
            { label: "Port", key: "port", icon: <Hash className="w-4 h-4 text-purple-500" /> },
            { label: "User ID", key: "userID", icon: <Users className="w-4 h-4 text-orange-500" /> },
            { label: "Password", key: "password", icon: <FileText className="w-4 h-4 text-rose-500" /> },
        ]
    },
    communicationSoftware: {
        title: "Communication Software",
        description: "Comprehensive communication software configuration and management",
        statusKey: "status",
        fields: [
            { label: "IP Address", key: "ipAddress", icon: <FileText className="w-4 h-4 text-blue-500" /> },
            { label: "Port", key: "port", icon: <Hash className="w-4 h-4 text-green-500" /> },
            { label: "Username", key: "username", icon: <Users className="w-4 h-4 text-purple-500" /> },
            { label: "Password", key: "password", icon: <FileText className="w-4 h-4 text-orange-500" /> },
        ]
    },
    trainingCategories: {
        title: "Training Master Details",
        description: "Comprehensive training master information and management",
        statusKey: "status",
        fields: [
            { label: "Training Category Code", key: "trainingCategory.trainingCategoryCode", icon: <FileText className="w-4 h-4 text-blue-500" /> },
            { label: "Training Category Name", key: "trainingCategory.trainingCategoryName", icon: <FileText className="w-4 h-4 text-green-500" /> },
        ]
    },
    trainingPrograms: {
        title: "Training Programs Details",
        description: "Comprehensive training programs information and management",
        statusKey: "status",
        fields: [
            { label: "Training Program Code", key: "trainingProgram.trainingProgramCode", icon: <FileText className="w-4 h-4 text-blue-500" /> },
            { label: "Training Program Name", key: "trainingProgram.trainingProgramName", icon: <FileText className="w-4 h-4 text-green-500" /> },
        ]
    }
};


// Dynamic header configuration based on organization type and mode
export const getHeaderConfig = (organizationType: string, mode: string | null) => {
    const typeConfigs = {
        location: {
            icon: MapPin,
            title: "Location Management",
            color: "from-blue-500 to-indigo-600",
            bgColor: "from-blue-50 to-indigo-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-700"
        },
        subsidiaries: {
            icon: Building2,
            title: "Subsidiary Management",
            color: "from-purple-500 to-pink-600",
            bgColor: "from-purple-50 to-pink-50",
            borderColor: "border-purple-200",
            textColor: "text-purple-700"
        },
        divisions: {
            icon: Layers,
            title: "Division Management",
            color: "from-green-500 to-emerald-600",
            bgColor: "from-green-50 to-emerald-50",
            borderColor: "border-green-200",
            textColor: "text-green-700"
        },
        areas: {
            icon: Layers,
            title: "Area Management",
            color: "from-lime-500 to-green-600",
            bgColor: "from-lime-50 to-green-50",
            borderColor: "border-lime-200",
            textColor: "text-lime-700"
        },
        natureOfWork: {
            icon: Briefcase,
            title: "Nature of Work Management",
            color: "from-orange-500 to-red-600",
            bgColor: "from-orange-50 to-red-50",
            borderColor: "border-orange-200",
            textColor: "text-orange-700"
        },
        workSkill: {
            icon: Award,
            title: "Work Skill Management",
            color: "from-yellow-500 to-amber-600",
            bgColor: "from-yellow-50 to-amber-50",
            borderColor: "border-yellow-200",
            textColor: "text-yellow-700"
        },
        employeeCategories: {
            icon: Users,
            title: "Employee Category Management",
            color: "from-indigo-500 to-purple-600",
            bgColor: "from-indigo-50 to-purple-50",
            borderColor: "border-indigo-200",
            textColor: "text-indigo-700"
        },
        grades: {
            icon: GraduationCap,
            title: "Grade Management",
            color: "from-teal-500 to-cyan-600",
            bgColor: "from-teal-50 to-cyan-50",
            borderColor: "border-teal-200",
            textColor: "text-teal-700"
        },
        sections: {
            icon: FolderOpen,
            title: "Section Management",
            color: "from-pink-500 to-rose-600",
            bgColor: "from-pink-50 to-rose-50",
            borderColor: "border-pink-200",
            textColor: "text-pink-700"
        },
        subDepartments: {
            icon: Settings,
            title: "Sub Department Management",
            color: "from-gray-500 to-slate-600",
            bgColor: "from-gray-50 to-slate-50",
            borderColor: "border-gray-200",
            textColor: "text-gray-700"
        },
        departments: {
            icon: Building2,
            title: "Department Management",
            color: "from-blue-500 to-cyan-600",
            bgColor: "from-blue-50 to-cyan-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-700"
        },
        designations: {
            icon: UserCheck,
            title: "Designation Management",
            color: "from-violet-500 to-purple-600",
            bgColor: "from-violet-50 to-purple-50",
            borderColor: "border-violet-200",
            textColor: "text-violet-700"
        },
        region: {
            icon: Globe,
            title: "Region Management",
            color: "from-cyan-500 to-blue-600",
            bgColor: "from-cyan-50 to-blue-50",
            borderColor: "border-cyan-200",
            textColor: "text-cyan-700"
        },
        reasonCodes: {
            icon: FileText,
            title: "Reason Code Management",
            color: "from-emerald-500 to-teal-600",
            bgColor: "from-emerald-50 to-teal-50",
            borderColor: "border-emerald-200",
            textColor: "text-emerald-700"
        },
        wagePeriod: {
            icon: FileText,
            title: "Wage Period Management",
            color: "from-emerald-500 to-teal-600",
            bgColor: "from-emerald-50 to-teal-50",
            borderColor: "border-emerald-200",
            textColor: "text-emerald-700"
        },
        skillLevels: {
            icon: Award,
            title: "Skill Level Management",
            color: "from-purple-500 to-pink-600",
            bgColor: "from-purple-50 to-pink-50",
            borderColor: "border-purple-200",
            textColor: "text-purple-700"
        },
        assetMaster: {
            icon: FolderOpen,
            title: "Asset Master Management",
            color: "from-blue-500 to-indigo-600",
            bgColor: "from-blue-50 to-indigo-50",
            borderColor: "border-blue-200",
            textColor: "text-blue-700"
        },
        documentMaster: {
            icon: FileText,
            title: "Document Master Management",
            color: "from-green-500 to-emerald-600",
            bgColor: "from-green-50 to-emerald-50",
            borderColor: "border-green-200",
            textColor: "text-green-700"
        },
        state: {
            icon: FileText,
            title: "State Management",
            color: "from-emerald-500 to-teal-600",
            bgColor: "from-emerald-50 to-teal-50",
            borderColor: "border-emerald-200",
            textColor: "text-emerald-700"
        },
        country: {
            icon: FileText,
            title: "Country Management",
            color: "from-emerald-500 to-teal-600",
            bgColor: "from-emerald-50 to-teal-50",
            borderColor: "border-emerald-200",
            textColor: "text-emerald-700"
        },
        caste: {
            icon: FileText,
            title: "Caste Management",
            color: "from-emerald-500 to-teal-600",
            bgColor: "from-emerald-50 to-teal-50",
            borderColor: "border-emerald-200",
            textColor: "text-emerald-700"
        },
        leaveWages: {
            icon: FileText,
            title: "Leave Wages Management",
            color: "from-emerald-500 to-teal-600",
            bgColor: "from-emerald-50 to-teal-50",
            borderColor: "border-emerald-200",
            textColor: "text-emerald-700"
        },
        mailGroup: {
            icon: FileText,
            title: "Mail Group Management",
            color: "from-emerald-500 to-teal-600",
            bgColor: "from-emerald-50 to-teal-50",
            borderColor: "border-emerald-200",
            textColor: "text-emerald-700"
        },
        centralServerDetails: {
            icon: FileText,
            title: "Central Server Details Management",
            color: "from-sky-500 to-cyan-600",
            bgColor: "from-sky-50 to-cyan-50",
            borderColor: "border-sky-200",
            textColor: "text-sky-700"
        },
        maxEmployeesPerSubsidiary: {
            icon: Users,
            title: "Max Employees Per Subsidiary Management",
            color: "from-indigo-500 to-blue-600",
            bgColor: "from-indigo-50 to-blue-50",
            borderColor: "border-indigo-200",
            textColor: "text-indigo-700"
        },
        globalServerDetails: {
            icon: FileText,
            title: "Global Server Details Management",
            color: "from-slate-500 to-gray-700",
            bgColor: "from-slate-50 to-gray-100",
            borderColor: "border-slate-200",
            textColor: "text-slate-700"
        },
        communicationSoftware: {
            icon: FileText,
            title: "Communication Software Management",
            color: "from-cyan-500 to-blue-600",
            bgColor: "from-cyan-50 to-blue-50",
            borderColor: "border-cyan-200",
            textColor: "text-cyan-700"
        },
        trainingCategories: {
            icon: FileText,
            title: "Training Master Management",
            color: "from-emerald-500 to-teal-600",
            bgColor: "from-emerald-50 to-teal-50",
            borderColor: "border-emerald-200",
            textColor: "text-emerald-700"
        },
        trainingPrograms: {
            icon: FileText,
            title: "Training Programs Management",
            color: "from-emerald-500 to-teal-600",
            bgColor: "from-emerald-50 to-teal-50",
            borderColor: "border-emerald-200",
            textColor: "text-emerald-700"
        }
    };

    const modeConfigs = {
        read: {
            title: "View Mode",
            description: "Click on any row to see detailed information",
            icon: Eye,
            actionText: "View Details"
        },
        view: {
            title: "View Mode",
            description: "Click on any row to see detailed information",
            icon: Eye,
            actionText: "View Details"
        },
        edit: {
            title: "Edit Mode",
            description: "Modify existing records and save changes",
            icon: Edit,
            actionText: "Edit Records"
        },
        delete: {
            title: "Delete Mode",
            description: "Select records to remove from the system",
            icon: Trash2,
            actionText: "Delete Records"
        },
        add: {
            title: "Add New",
            description: "Create new records in the system",
            icon: Plus,
            actionText: "Add New Record"
        },
        "": {
            title: "Dashboard",
            description: "Manage organization data and records",
            icon: Building,
            actionText: "Manage Records"
        },
        leaveWages: {
            title: "Leave Wages",
            description: "Manage leave wages information and management",
            icon: FileText,
            actionText: "Manage Records"
        },
        mailGroup: {
            title: "Mail Group",
            description: "Manage mail group information and management",
            icon: FileText,
            actionText: "Manage Records"
        },
        trainingCategories: {
            title: "Training Master",
            description: "Manage training master information and management",
            icon: FileText,
            actionText: "Manage Records"
        },
        trainingPrograms: {
            title: "Training Programs",
            description: "Manage training programs information and management",
            icon: FileText,
            actionText: "Manage Records"
        }
    };

    const typeConfig = typeConfigs[organizationType as keyof typeof typeConfigs] || typeConfigs.location;
    const modeConfig = modeConfigs[mode as keyof typeof modeConfigs] || modeConfigs[""];

    return {
        ...typeConfig,
        ...modeConfig,
        fullTitle: `${typeConfig.title} - ${modeConfig.title}`
    };
};

export default getHeaderConfig;
