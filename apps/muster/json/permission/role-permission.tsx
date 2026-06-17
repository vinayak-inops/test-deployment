export const adminRoleText = {
    _id: "686bb4f752f67193f57dc1ae",
    createdBy: "Inops",
    createdOn: "2025-07-07T10:00:00Z",
    entitlementCode: "ECT-CLMS-ADMIN",
    entitlementName: "Administrator",
    screenPermissions: [
        {
            serviceName: "reports",
            screens: [
                {
                    screenName: "reportsGenerate",
                    route: "/reports/reports",
                    components: [
                        {
                            componentType: "reports-header",
                            tasks: [
                                {
                                    taskType: "reports-generate",
                                },
                            ]
                        },
                        {
                            componentType: "reports-card",
                            tasks: [
                                {
                                    taskType: "reports-status",
                                },
                            ]
                        },
                    ]
                },
                {
                    screenName: "excelFileManager",
                    route: "/reports/reports?mode=all",
                    components: [
                        {
                            componentType: "reportsStatus-header",
                            tasks: [
                                {
                                    taskType: "reports-download",
                                },
                            ]
                        },
                        // {
                        //     componentName: "reportsStatus-bar",
                        //     componentType: "reportsStatus-bar",
                        //     tasks: [
                        //         {
                        //             taskName: "reports-download",
                        //             taskType: "reports-download",
                        //         },
                        //     ]
                        // }
                    ]
                },
            ]
        },
        {
            serviceName: "master",
            screens: [
                {
                    screenName: "organization",
                    route: "/master/organization",
                    components: [
                        {
                            componentType: "organization-header",
                            tasks: [
                                {
                                    taskType: "organization-view",
                                },
                                {
                                    taskType: "organization-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "location",
                    route: "/master/organization/location",
                    components: [
                        {
                            componentType: "location-table",
                            tasks: [
                                {
                                    taskType: "location-add",
                                },
                                {
                                    taskType: "location-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "subsidiaries",
                    route: "/master/organization/subsidiaries",
                    components: [
                        {
                            componentType: "subsidiaries-table",
                            tasks: [
                                {
                                    taskType: "subsidiaries-add",
                                },
                                {
                                    taskType: "subsidiaries-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "divisions",
                    route: "/master/organization/divisions",
                    components: [
                        {
                            componentType: "divisions-table",
                            tasks: [
                                {
                                    taskType: "divisions-add",
                                },
                                {
                                    taskType: "divisions-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "departments",
                    route: "/master/organization/departments",
                    components: [
                        {
                            componentType: "departments-table",
                            tasks: [
                                {
                                    taskType: "departments-add",
                                },
                                {
                                    taskType: "departments-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "designations",
                    route: "/master/organization/designations",
                    components: [
                        {
                            componentType: "designations-table",
                            tasks: [
                                {
                                    taskType: "designations-add",
                                },
                                {
                                    taskType: "designations-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "grades",
                    route: "/master/organization/grades",
                    components: [
                        {
                            componentType: "grades-table",
                            tasks: [
                                {
                                    taskType: "grades-add",
                                },
                                {
                                    taskType: "grades-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "subDepartments",
                    route: "/master/organization/subDepartments",
                    components: [
                        {
                            componentType: "subDepartments-table",
                            tasks: [
                                {
                                    taskType: "subDepartments-add",
                                },
                                {
                                    taskType: "subDepartments-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "subDepartments",
                    route: "/master/organization/subDepartments",
                    components: [
                        {
                            componentType: "subDepartments-table",
                            tasks: [
                                {
                                    taskType: "subDepartments-add",
                                },
                                {
                                    taskType: "subDepartments-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "sections",
                    route: "/master/organization/sections",
                    components: [
                        {
                            componentType: "sections-table",
                            tasks: [
                                {
                                    taskType: "sections-add",
                                },
                                {
                                    taskType: "sections-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "employeeCategories",
                    route: "/master/organization/employeeCategories",
                    components: [
                        {
                            componentType: "employeeCategories-table",
                            tasks: [
                                {
                                    taskType: "employeeCategories-add",
                                },
                                {
                                    taskType: "employeeCategories-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "workSkill",
                    route: "/master/organization/workSkill",
                    components: [
                        {
                            componentType: "workSkill-table",
                            tasks: [
                                {
                                    taskType: "workSkill-add",
                                },
                                {
                                    taskType: "workSkill-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "natureOfWork",
                    route: "/master/organization/natureOfWork",
                    components: [
                        {
                            componentType: "natureOfWork-table",
                            tasks: [
                                {
                                    taskType: "natureOfWork-add",
                                },
                                {
                                    taskType: "natureOfWork-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "assetMaster",
                    route: "/master/organization/assetMaster",
                    components: [
                        {
                            componentType: "assetMaster-table",
                            tasks: [
                                {
                                    taskType: "assetMaster-add",
                                },
                                {
                                    taskType: "assetMaster-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "leaveWages",
                    route: "/master/organization/leave-wages",
                    components: [
                        {
                            componentType: "leaveWages-table",
                            tasks: [
                                {
                                    taskType: "leaveWages-add",
                                },
                                {
                                    taskType: "leaveWages-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "wagePeriod",
                    route: "/master/organization/wagePeriod",
                    components: [
                        {
                            componentType: "wagePeriod-table",
                            tasks: [
                                {
                                    taskType: "wagePeriod-add",
                                },
                                {
                                    taskType: "wagePeriod-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "documentMaster",
                    route: "/master/organization/documentMaster",
                    components: [
                        {
                            componentType: "documentMaster-table",
                            tasks: [
                                {
                                    taskType: "documentMaster-add",
                                },
                                {
                                    taskType: "documentMaster-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "skillLevels",
                    route: "/master/organization/skillLevels",
                    components: [
                        {
                            componentType: "skillLevels-table",
                            tasks: [
                                {
                                    taskType: "skillLevels-add",
                                },
                                {
                                    taskType: "skillLevels-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "reasonCodes",
                    route: "/master/organization/reasonCodes",
                    components: [
                        {
                            componentType: "reasonCodes-table",
                            tasks: [
                                {
                                    taskType: "reasonCodes-add",
                                },
                                {
                                    taskType: "reasonCodes-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "region",
                    route: "/master/organization/region",
                    components: [
                        {
                            componentType: "region-table",
                            tasks: [
                                {
                                    taskType: "region-add",
                                },
                                {
                                    taskType: "region-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "country",
                    route: "/master/organization/country",
                    components: [
                        {
                            componentType: "country-table",
                            tasks: [
                                {
                                    taskType: "country-add",
                                },
                                {
                                    taskType: "country-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "state",
                    route: "/master/organization/state",
                    components: [
                        {
                            componentType: "state-table",
                            tasks: [
                                {
                                    taskType: "state-add",
                                },
                                {
                                    taskType: "state-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "caste",
                    route: "/master/organization/caste",
                    components: [
                        {
                            componentType: "caste-table",
                            tasks: [
                                {
                                    taskType: "caste-add",
                                },
                                {
                                    taskType: "caste-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "contractorEmployee",
                    route: "/master/contractor-employee",
                    components: [
                        {
                            componentType: "contractorEmployee-table",
                            tasks: [
                                {
                                    taskType: "contractorEmployee-add",
                                },
                                {
                                    taskType: "contractorEmployee-edit",
                                },
                                {
                                    taskType: "contractorEmployee-view",
                                },
                                {
                                    taskType: "contractorEmployee-delete",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "contractorEmployee",
                    route: "/master/contractor-employee?mode=add",
                    components: []
                },
                {
                    screenName: "contractorEmployee",
                    route: "/master/contractor-employee?mode=edit",
                    components: []
                },
                {
                    screenName: "contractorEmployee",
                    route: "/master/contractor-employee?mode=view",
                    components: []
                },
                {
                    screenName: "contractor",
                    route: "/master/contractor",
                    components: [
                        {
                            componentType: "contractor-table",
                            tasks: [
                                {
                                    taskType: "contractor-add",
                                },
                                {
                                    taskType: "contractor-edit",
                                },
                                {
                                    taskType: "contractor-view",
                                },
                                {
                                    taskType: "contractor-delete",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "contractorEmployee",
                    route: "/master/contractor?mode=add",
                    components: []
                },
                {
                    screenName: "contractorEmployee",
                    route: "/master/contractor?mode=edit",
                    components: []
                },
                {
                    screenName: "contractorEmployee",
                    route: "/master/contractor?mode=view",
                    components: []
                },
                {
                    screenName: "companyEmployee",
                    route: "/master/company-employee",
                    components: [
                        {
                            componentType: "companyEmployee-table",
                            tasks: [
                                {
                                    taskType: "companyEmployee-add",
                                },
                                {
                                    taskType: "companyEmployee-edit",
                                },
                                {
                                    taskType: "companyEmployee-view",
                                },
                                {
                                    taskType: "companyEmployee-delete",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "contractorEmployee",
                    route: "/master/company-employee?mode=add",
                    components: []
                },
                {
                    screenName: "contractorEmployee",
                    route: "/master/company-employee?mode=edit",
                    components: []
                },
                {
                    screenName: "contractorEmployee",
                    route: "/master/company-employee?mode=view",
                    components: []
                },
                {
                    screenName: "securityPass",
                    route: "/master/security-pass",
                    components: [
                        {
                            componentType: "securityPass-table",
                            tasks: [
                                {
                                    taskType: "securityPass-add",
                                },
                                {
                                    taskType: "securityPass-edit",
                                },
                                {
                                    taskType: "securityPass-view",
                                },
                                {
                                    taskType: "securityPass-delete",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "securityPass",
                    route: "/master/security-pass?mode=add",
                    components: []
                },
                {
                    screenName: "securityPass",
                    route: "/master/security-pass?mode=edit",
                    components: []
                },
                {
                    screenName: "securityPass",
                    route: "/master/security-pass?mode=view",
                    components: []
                },
                {
                    screenName: "employeeShift",
                    route: "/master/employee-shift",
                    components: [
                        {
                            componentType: "employeeShift-table",
                            tasks: [
                                {
                                    taskType: "employeeShift-add",
                                },
                                {
                                    taskType: "employeeShift-edit",
                                },
                                {
                                    taskType: "employeeShift-view",
                                },
                                {
                                    taskType: "employeeShift-delete",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "employeeShift",
                    route: "/master/employee-shift?mode=add",
                    components: []
                },
                {
                    screenName: "employeeShift",
                    route: "/master/employee-shift?mode=edit",
                    components: []
                },
                {
                    screenName: "employeeShift",
                    route: "/master/employee-shift?mode=view",
                    components: []
                },
                {
                    screenName: "policy",
                    route: "",
                    components: [
                    ]
                },
                {
                    screenName: "overTime",
                    route: "/master/policy/over-time",
                    components: [
                        {
                            componentType: "overTime-table",
                            tasks: [
                                {
                                    taskType: "overTime-add",
                                },
                                {
                                    taskType: "overTime-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "holiday",
                    route: "/master/policy/holiday",
                    components: [
                        {
                            componentType: "holiday-table",
                            tasks: [
                                {
                                    taskType: "holiday-add",
                                },
                                {
                                    taskType: "holiday-edit",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "shiftPolicy",
                    route: "/master/shift/shift-list",
                    components: [
                        {
                            componentType: "shiftGroup-header",
                            tasks: [
                                {
                                    taskType: "shiftGroup-add",
                                },
                            ]
                        },
                        {
                            componentType: "shiftGroup-card",
                            tasks: [
                                {
                                    taskType: "shiftGroup-view",
                                },
                                {
                                    taskType: "shiftGroup-edit",
                                },
                                {
                                    taskType: "shifts-all",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "shiftsLists",
                    route: "/master/shift/shift-list?mode=all",
                    components: [
                        {
                            componentType: "shiftsLists-header",
                            tasks: [
                                {
                                    taskType: "shifts-add",
                                },
                            ]
                        },
                        {
                            componentType: "shiftsLists-card",
                            tasks: [
                                {
                                    taskType: "shifts-view",
                                },
                                {
                                    taskType: "shifts-edit",
                                },
                            ]
                        }
                    ]
                },
            ]

        },
        {
            serviceName: "excel-upload",
            screens: [
                {
                    screenName: "excelFileManager",
                    route: "/master/excel-file-manager",
                    components: [
                        {
                            componentType: "upload-button",
                            tasks: [
                                {
                                    taskType: "excel-upload",
                                },
                            ]
                        },
                        {
                            componentType: "excel-template",
                            tasks: [
                                {
                                    taskType: "download-template",
                                },
                            ]
                        },
                        {
                            componentType: "excel-table",
                            tasks: [
                                {
                                    taskType: "status-view",
                                },
                            ]
                        }
                    ]
                },
                {
                    screenName: "excelFileManager",
                    route: "/master/excel-file-manager/upload-statues?mode=all",
                    components: []
                },
            ]
        },
        {
            tileName: "muster",
            serviceName: "muster",
            screens: [
                {
                    screenName: "muster-punch",
                    route: "/muster/punch",
                    tasks: [
                        // {
                        //     taskType: "today-punch",
                        // },
                        // {
                        //     taskType: "today-punch-individual",
                        // },
                        {
                            taskType: "muster-punch",
                        },
                        {
                            taskType: "muster-punch-individual",
                        },
                        {
                            taskType: "Row-punch",
                        },
                        {
                            taskType: "Row-punch-individual",
                        },
                        {
                            taskType: "punch-applications",
                        },
                        {
                            taskType: "punch-applications-apply",
                        }, 
                    ]
                },
                {
                    componentType: "punch-application-form",
                    route: "/muster/punch",
                    tasks: [ 
                        // {
                        //     taskType: "punch-applications-employeeId-fixed",
                        // },
                        {
                            taskType: "punch-applications-employeeId-edit",
                        },
                    ]
                },
                {
                    screenName: "muster-punch-filter",
                    route: "/muster/punch/muster-punch",
                    tasks: []
                },
                {
                    screenName: "muster-punch-filter",
                    route: "/muster/punch/individual-punch",
                    tasks: []
                },
                {
                    componentType: "punch-application",
                    tasks: [ 
                        {
                            taskType: "punch-applications-cancel",
                        },
                        {
                            taskType: "punch-applications-approve",
                        },
                        {
                            taskType: "punch-applications-reject",
                        },
                        {
                            taskType: "punch-applications-know-status",
                        },
                        {
                            taskType: "punch-applications-cancel-request",
                        },
                    ]
                },
                {
                    screenName: "muster-punch-calendar",
                    route: "/muster/punch/individual-punch/calendar/information",
                    tasks: [
                        {
                            taskType: "Add-new-punch",
                        },
                        // {
                        //     taskType: "apply-appliaction",
                        // },
                        {
                            taskType: "know-status-of-application",
                        },
                        // {
                        //     taskType: "punch-editable",
                        // },
                    ]
                },
                {
                    screenName: "muster-punch-calendar",
                    route: "/muster/punch/individual-punch/table/information",
                    tasks: [
                        {
                            taskType: "Add-new-punch",
                        },
                        // {
                        //     taskType: "apply-appliaction",
                        // },
                        {
                            taskType: "know-status-of-application",
                        },
                        {
                            taskType: "punch-editable",
                        },
                    ]
                },
            ]
        }
    ],
    organizationCode: "",
    tenantCode: ""
}

export const adminUserText = {
    employeeID: "FTE001",
    role: "admin"
}