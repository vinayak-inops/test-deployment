import { label, tr } from "framer-motion/client";

export const progressform = {
    component: "form",
    mode: "view",
    title: "Basic Filter",
    description:
        "An organization is a structured group working toward shared goals.",
    classvalue: "grid-cols-12 gap-0 pt-4 mt-4",
    baseurl: "api/sectiondetails",
    subformstructure: [
        {
            formgrid: 1,
            title: "",
            classvalue: "col-span-12 pt-0  gap-2 p-2 ",
            component: {
                container: "col-span-4",
                title: {
                    container: "rounded-md mb-2",
                    heading: "text-2xl",
                    description: "text-sm",
                },
            },
            validationRules: {
                required: ["logoupload"],
            },
            fields: [
                {
                    type: "progress-form",
                    tag: "progress-form",
                    label: "",
                    value: true,
                    name: "progress-basic",
                    classvalue: {
                        container: "col-span-12 ",
                        label: "text-gray-600",
                        field: "p-1",
                    },
                    options: [
                        {
                            label: "Select Report", completed: false, value: "Select Report", status: "firststate"
                        },
                        {
                            label: "Basic Filter", completed: false, value: "Basic Filter", status: "notstarted",
                            children: ["progress-basic"],
                            requiredfields: ["selectreport"],
                            // functions: [
                            //     {
                            //         function: "validateRequiredFields",
                            //         fieldsUpdate: [
                            //             {
                            //                 name: "progress-basic",
                            //                 feildnkeys: [
                            //                     {
                            //                         name: "activeTab",
                            //                         value: "none",
                            //                         checkcondition: "switch",
                            //                         switch: [
                            //                             {
                            //                                 case: "noerror",
                            //                                 value: "Basic Filter"
                            //                             }
                            //                         ],
                            //                         backendcall: false,
                            //                     },
                            //                 ],
                            //             },
                            //         ],
                            //     },
                            // ],
                        },
                        {
                            label: "Date Selection", completed: false, value: "Date Selection",
                            status: "notstarted",
                            children: ["progress-basic"],
                            requiredfields: ["selectreport", "organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectfilterationkey", "filervalue", "queryfilter"],
                            // functions: [
                            //     {
                            //         function: "validateRequiredFields",
                            //         fieldsUpdate: [
                            //             {
                            //                 name: "progress-basic",
                            //                 feildnkeys: [
                            //                     {
                            //                         name: "activeTab",
                            //                         value: "none",
                            //                         checkcondition: "switch",
                            //                         switch: [
                            //                             {
                            //                                 case: "noerror",
                            //                                 value: "Date Selection"
                            //                             }
                            //                         ],
                            //                         backendcall: false,
                            //                     },
                            //                 ],
                            //             },
                            //         ],
                            //     },
                            // ],
                        },
                        {
                            label: "Preview", completed: false, value: "Preview", status: "notstarted",
                            children: ["progress-basic", "emp-select"],
                            requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "selectfilterationkey", "filervalue", "queryfilter"],
                            // functions: [
                            //     {
                            //         function: "validateRequiredFields",
                            //         fieldsUpdate: [
                            //             {
                            //                 name: "progress-basic",
                            //                 feildnkeys: [
                            //                     {
                            //                         name: "activeTab",
                            //                         value: "none",
                            //                         checkcondition: "switch",
                            //                         switch: [
                            //                             {
                            //                                 case: "noerror",
                            //                                 value: "Report Preview"
                            //                             }
                            //                         ],
                            //                         backendcall: false,
                            //                     },
                            //                 ],
                            //             },
                            //         ],
                            //     },
                            // ],
                        },
                        // {
                        //     label: "Report Status", completed: false, value: "Report Status", status: "notstarted",
                        //     children: ["progress-basic"],
                        //     requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "start-report-generate", "selectfilterationkey", "filervalue", "queryfilter"],
                        //     functions: [
                        //         {
                        //             function: "validateRequiredFields",
                        //             fieldsUpdate: [
                        //                 {
                        //                     name: "progress-basic",
                        //                     feildnkeys: [
                        //                         {
                        //                             name: "activeTab",
                        //                             value: "none",
                        //                             checkcondition: "switch",
                        //                             switch: [
                        //                                 {
                        //                                     case: "noerror",
                        //                                     value: "Report Status"
                        //                                 }
                        //                             ],
                        //                             backendcall: false,
                        //                         },
                        //                     ],
                        //                 },
                        //             ],
                        //         },
                        //     ],
                        // },
                    ],
                    children: ["progress-basic"],
                    onChange: [
                        // {
                        //     event: "updatechild",
                        //     fieldsUpdate: [
                        //         {
                        //             name: "progress-basic",
                        //             feildnkeys: [
                        //                 {
                        //                     name: "activeTab",
                        //                     value: "none",
                        //                     checkcondition: "switch",
                        //                     switch: [
                        //                         {
                        //                             case: "Select Report",
                        //                             value: "Select Report"
                        //                         },
                        //                         {
                        //                             case: "Basic Filter",
                        //                             value: "Basic Filter"
                        //                         },
                        //                         {
                        //                             case: "Date Selection",
                        //                             value: "Date Selection"
                        //                         },
                        //                         {
                        //                             case: "Generate Report",
                        //                             value: "Generate Report"
                        //                         },
                        //                     ],
                        //                     backendcall: false,
                        //                 },
                        //             ],
                        //         },
                        //     ],
                        // },
                    ],
                    required: false,
                    mode: "super-edit",
                    icon: "",
                    formgrid: "none",
                    displayOrder: 1,
                    activeTab: "Select Report",
                    subformstructure: [
                        {
                            formgrid: 6,
                            title: "",
                            classvalue: "col-span-12 gap-4",
                            validationRules: {
                                required: ["logoupload"],
                            },
                            formtype: "tabs-form",
                            tabs: ["Select Report"],
                            fields: [
                                {
                                    type: "tabs-form",
                                    tag: "tabs-form",
                                    label: "Talbe Form",
                                    formname: "table-form",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    name: "report-tabs",
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                    tabs: [
                                        {
                                            id: "All", label: "All", value: "All", fieldNames: [],
                                            children: ["selectreport"],
                                            functions: [
                                                {
                                                    function: "getReports",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "selectreport",
                                                            feildnkeys: [
                                                                {
                                                                    name: "options",
                                                                    api: {
                                                                        function: "getReports",
                                                                        backendcall: true,
                                                                        url: "tenantReportConfiguration/6827076ad74e6f59df5f2166",
                                                                        method: "GET",
                                                                        headers: {
                                                                            "Content-Type": "application/json"
                                                                        }
                                                                    },
                                                                    checkcondition: "selectedvalue",
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                }
                                            ],
                                        },
                                        {
                                            id: "Contractor Employee", label: "Contractor Employee", value: "Contractor Employee", fieldNames: [],
                                            children: ["selectreport"],
                                            functions: [
                                                {
                                                    function: "filterNonNestedOptions",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "selectreport",
                                                            feildnkeys: [
                                                                {
                                                                    name: "options",
                                                                    checkcondition: "selectedvalue",
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                    fromField: "selectreport",
                                                }
                                            ],
                                        },
                                        {
                                            id: "Shift",
                                            label: "Shift",
                                            value: "Shift",
                                            fieldNames: ["username", "email", "role"],
                                            children: ["selectreport"],
                                            functions: [
                                                {
                                                    function: "filterNonNestedOptions",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "selectreport",
                                                            feildnkeys: [
                                                                {
                                                                    name: "options",
                                                                    checkcondition: "selectedvalue",
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                    fromField: "selectreport",
                                                }
                                            ],
                                        },
                                        {
                                            id: "Attendance",
                                            label: "Attendance",
                                            value: "Attendance",
                                            fieldNames: ["street", "city", "zip"],
                                            children: ["selectreport"],
                                            functions: [
                                                {
                                                    function: "filterNonNestedOptions",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "selectreport",
                                                            feildnkeys: [
                                                                {
                                                                    name: "options",
                                                                    checkcondition: "selectedvalue",
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                    fromField: "selectreport",
                                                }
                                            ],
                                        },
                                        {
                                            id: "Leave",
                                            label: "Leave",
                                            value: "Leave",
                                            fieldNames: ["companyName", "industry", "location"],
                                            children: ["selectreport"],
                                            functions: [
                                                {
                                                    function: "filterNonNestedOptions",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "selectreport",
                                                            feildnkeys: [
                                                                {
                                                                    name: "options",
                                                                    checkcondition: "selectedvalue",
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                    fromField: "selectreport",
                                                }
                                            ],
                                        },
                                        {
                                            id: "Application",
                                            label: "Application",
                                            value: "Application",
                                            fieldNames: ["theme", "notifications", "privacy"],
                                            children: ["selectreport"],
                                            functions: [
                                                {
                                                    function: "filterNonNestedOptions",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "selectreport",
                                                            feildnkeys: [
                                                                {
                                                                    name: "options",
                                                                    checkcondition: "selectedvalue",
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                    fromField: "selectreport",
                                                }
                                            ],
                                        },
                                        {
                                            id: "Salary",
                                            label: "Salary",
                                            value: "Salary",
                                            fieldNames: ["theme", "notifications", "privacy"],
                                            children: ["selectreport"],
                                            functions: [
                                                {
                                                    function: "filterNonNestedOptions",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "selectreport",
                                                            feildnkeys: [
                                                                {
                                                                    name: "options",
                                                                    checkcondition: "selectedvalue",
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                    fromField: "selectreport",
                                                }
                                            ],
                                        },
                                        {
                                            id: "Other",
                                            label: "Other",
                                            value: "Other",
                                            fieldNames: ["theme", "notifications", "privacy"],
                                            children: ["selectreport"],
                                            functions: [
                                                {
                                                    function: "filterNonNestedOptions",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "selectreport",
                                                            feildnkeys: [
                                                                {
                                                                    name: "options",
                                                                    checkcondition: "selectedvalue",
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                    fromField: "selectreport",
                                                }
                                            ],
                                        },
                                    ],
                                    subformstructure: [
                                        {
                                            formgrid: 2,
                                            title: "",
                                            classvalue: "col-span-12 gap-2 p-2",
                                            validationRules: {
                                                required: ["logoupload"],
                                            },
                                            component: {
                                                container: "col-span-4 pt-8 bg-gray-100 pl-2",
                                                title: {
                                                    container: "bg-gray-100 p-2 mb-6 rounded-md",
                                                    heading: "text-2xl",
                                                    description: "text-sm",
                                                },
                                            },
                                            tabs: ["All", "Contractor Employee", "Shift", "Attendance", "Leave", "Application", "Salary", "Other"],
                                            fields: [
                                                {
                                                    tag: "dummy",
                                                    formgrid: "none",
                                                    mode: "super-edit",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-12 h-12 mb-2",
                                                    },
                                                },
                                                {
                                                    tag: "dummy",
                                                    formgrid: "none",
                                                    mode: "super-edit",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-3 mb-2",
                                                    },
                                                },
                                                {
                                                    type: "text",
                                                    tag: "multi-select",
                                                    label: "Select Reports",
                                                    name: "selectreport",
                                                    placeholder: "",
                                                    value: [],
                                                    classvalue: {
                                                        container: "col-span-6 mb-0",
                                                        label: "text-gray-600",
                                                        field: "p-1",
                                                    },
                                                    mode: "all-allow",
                                                    required: true,
                                                    icon: "",
                                                    children: [],
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                                {
                                                    tag: "dummy",
                                                    formgrid: "none",
                                                    mode: "super-edit",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-12 h-12 mb-2",
                                                    },
                                                },
                                            ],
                                        },
                                        {
                                            formgrid: 2,
                                            title: "",
                                            classvalue: "col-span-12 gap-4",
                                            validationRules: {
                                                required: ["logoupload"],
                                            },

                                            tabs: ["All", "Contractor Employee", "Shift", "Attendance", "Leave", "Application", "Salary", "Other"],
                                            formtype: "table-form",
                                            fields: [
                                                {
                                                    tag: "dummy",
                                                    formgrid: "none",
                                                    mode: "super-edit",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-9 mb-2",
                                                    },
                                                },
                                                {
                                                    type: "button",
                                                    tag: "button",
                                                    label: "Save and Continue",
                                                    classvalue: {
                                                        container: "col-span-3 mb-2 ",
                                                        label: "text-gray-600",
                                                        button: "bg-[#2563eb] text-white",
                                                    },
                                                    children: ["progress-basic", "emp-select"],
                                                    requiredfields: ["selectreport"],
                                                    functions: [
                                                        {
                                                            function: "validateRequiredFields",
                                                            fieldsUpdate: [
                                                                {
                                                                    name: "progress-basic",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "activeTab",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: "Basic Filter"
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                        {
                                                                            name: "options",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: [
                                                                                        {
                                                                                            label: "Select Report", completed: true, value: "Select Report", status: "firststate"
                                                                                        },
                                                                                        {
                                                                                            label: "Basic Filter", completed: false, value: "Basic Filter", status: "working",
                                                                                            children: ["progress-basic"],
                                                                                            requiredfields: ["selectreport"],
                                                                                            functions: [
                                                                                                {
                                                                                                    function: "validateRequiredFields",
                                                                                                    fieldsUpdate: [
                                                                                                        {
                                                                                                            name: "progress-basic",
                                                                                                            feildnkeys: [
                                                                                                                {
                                                                                                                    name: "activeTab",
                                                                                                                    value: "none",
                                                                                                                    checkcondition: "switch",
                                                                                                                    switch: [
                                                                                                                        {
                                                                                                                            case: "noerror",
                                                                                                                            value: "Basic Filter"
                                                                                                                        }
                                                                                                                    ],
                                                                                                                    backendcall: false,
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                        {
                                                                                            label: "Date Selection", completed: false, value: "Date Selection",
                                                                                            status: "notstarted",
                                                                                            children: ["progress-basic"],
                                                                                            requiredfields: ["selectreport", "organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                            functions: [
                                                                                                {
                                                                                                    function: "validateRequiredFields",
                                                                                                    fieldsUpdate: [
                                                                                                        {
                                                                                                            name: "progress-basic",
                                                                                                            feildnkeys: [
                                                                                                                {
                                                                                                                    name: "activeTab",
                                                                                                                    value: "none",
                                                                                                                    checkcondition: "switch",
                                                                                                                    switch: [
                                                                                                                        {
                                                                                                                            case: "noerror",
                                                                                                                            value: "Date Selection"
                                                                                                                        }
                                                                                                                    ],
                                                                                                                    backendcall: false,
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                        {
                                                                                            label: "Preview", completed: false, value: "Preview", status: "notstarted",
                                                                                            children: ["progress-basic", "emp-select"],
                                                                                            requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                            functions: [
                                                                                                {
                                                                                                    function: "validateRequiredFields",
                                                                                                    fieldsUpdate: [
                                                                                                        {
                                                                                                            name: "progress-basic",
                                                                                                            feildnkeys: [
                                                                                                                {
                                                                                                                    name: "activeTab",
                                                                                                                    value: "none",
                                                                                                                    checkcondition: "switch",
                                                                                                                    switch: [
                                                                                                                        {
                                                                                                                            case: "noerror",
                                                                                                                            value: "Report Preview"
                                                                                                                        }
                                                                                                                    ],
                                                                                                                    backendcall: false,
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                        {
                                                                                            label: "Report Status", completed: false, value: "Report Status", status: "notstarted",
                                                                                            children: ["progress-basic"],
                                                                                            requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "start-report-generate", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                            functions: [
                                                                                                {
                                                                                                    function: "validateRequiredFields",
                                                                                                    fieldsUpdate: [
                                                                                                        {
                                                                                                            name: "progress-basic",
                                                                                                            feildnkeys: [
                                                                                                                {
                                                                                                                    name: "activeTab",
                                                                                                                    value: "none",
                                                                                                                    checkcondition: "switch",
                                                                                                                    switch: [
                                                                                                                        {
                                                                                                                            case: "noerror",
                                                                                                                            value: "Report Status"
                                                                                                                        }
                                                                                                                    ],
                                                                                                                    backendcall: false,
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                    ],
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            function: "localStorage",
                                                            storageName: "report-generate",
                                                            storageType: "local",
                                                            storageKey: "selectreport",
                                                            storageValue: ["selectreport"],
                                                        }
                                                    ],
                                                    mode: "super-edit",
                                                    icon: "Next",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            formgrid: 6,
                            title: "",
                            classvalue: "col-span-12 gap-4",
                            validationRules: {
                                required: ["logoupload"],
                            },
                            formtype: "tabs-form",
                            tabs: ["Basic Filter"],
                            fields: [
                                {
                                    type: "tabs-form",
                                    tag: "tabs-form",
                                    label: "Talbe Form",
                                    formname: "table-form",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    name: "filter-tabs",
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                    tabs: [
                                        {
                                            id: "Basic Filter", label: "Basic Filter", value: "Basic Filter", fieldNames: [],
                                            children: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "queryfilter", "selectfilterationkey", "filervalue"],
                                            onChange: [
                                                {
                                                    event: "updatechild",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "organization",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "location",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },

                                                        {
                                                            name: "division",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "department",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },

                                                        {
                                                            name: "subdepartment",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },

                                                        {
                                                            name: "section",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "subsidiary",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },

                                                        {
                                                            name: "queryfilter",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "selectfilterationkey",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "filervalue",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            id: "Simple Filter",
                                            label: "Simple Filter",
                                            value: "Simple Filter",
                                            fieldNames: ["username", "email", "role"],
                                            children: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "queryfilter", "selectfilterationkey", "filervalue"],
                                            onChange: [
                                                {
                                                    event: "updatechild",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "organization",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "location",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },

                                                        {
                                                            name: "division",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "department",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },

                                                        {
                                                            name: "subdepartment",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },

                                                        {
                                                            name: "section",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "subsidiary",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },

                                                        {
                                                            name: "queryfilter",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "selectfilterationkey",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "filervalue",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            id: "Query Filter",
                                            label: "Query Filter",
                                            value: "Query Filter",
                                            fieldNames: ["street", "city", "zip"],
                                            children: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "queryfilter", "selectfilterationkey", "filervalue"],
                                            onChange: [
                                                {
                                                    event: "updatechild",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "organization",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "location",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },

                                                        {
                                                            name: "division",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "department",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },

                                                        {
                                                            name: "subdepartment",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },

                                                        {
                                                            name: "section",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "subsidiary",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },

                                                        {
                                                            name: "queryfilter",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "selectfilterationkey",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "filervalue",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    subformstructure: [
                                        {
                                            formgrid: 1,
                                            title: "",
                                            name: "basic-container",
                                            classvalue: "col-span-12 mb-6 rounded-md ",
                                            component: {
                                                container: "col-span-12",
                                                title: {
                                                    container: "bg-gray-100 p-2 bg-gray-100 rounded-md mb-6 pb-6",
                                                    heading: "text-2xl ",
                                                    description: "text-sm",
                                                },
                                            },
                                            validationRules: {
                                                required: ["logoupload"],
                                            },
                                            tabs: ["Basic Filter"],
                                            fields: [
                                                {
                                                    tag: "container-section",
                                                    formgrid: "none",
                                                    mode: "super-edit",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-12 mb-2",
                                                    },
                                                    subformstructure: [
                                                        // {
                                                        //     formgrid: 1,
                                                        //     title: "Select Filteration Parameters",
                                                        //     name: "progress-basic",
                                                        //     classvalue: "col-span-3 mb-6 rounded-md ",
                                                        //     component: {
                                                        //         container: "col-span-12 pt-8 bg-gray-100  border-r  ",
                                                        //         title: {
                                                        //             container: "bg-gray-100 p-2 bg-gray-100 rounded-md mb-6 pb-6",
                                                        //             heading: "text-2xl ",
                                                        //             description: "text-sm",
                                                        //         },
                                                        //     },
                                                        //     validationRules: {
                                                        //         required: ["logoupload"],
                                                        //     },
                                                        //     tabs: ["Basic Filter"],
                                                        //     fields: [
                                                        //         {
                                                        //             type: "checkbox",
                                                        //             tag: "checkbox",
                                                        //             label: "",
                                                        //             value: true,
                                                        //             name: "organizationselect",
                                                        //             placeholder: "Organization",
                                                        //             classvalue: {
                                                        //                 container: "col-span-12 mb-2 mt-8",
                                                        //                 label: "text-gray-600",
                                                        //                 field: "p-1",
                                                        //             },
                                                        //             onChange: [
                                                        //                 {
                                                        //                     event: "updatechild",
                                                        //                     fieldsUpdate: [
                                                        //                         {
                                                        //                             name: "organization",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                                 {
                                                        //                                     name: "required",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: true
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: false
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                         {
                                                        //                             name: "preview-organization",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                     ],
                                                        //                 },
                                                        //             ],
                                                        //             children: ["organization", "preview-organization"],
                                                        //             required: false,
                                                        //             mode: "super-edit",
                                                        //             icon: "",
                                                        //             formgrid: "none",
                                                        //             displayOrder: 1,
                                                        //         },
                                                        //         {
                                                        //             type: "checkbox",
                                                        //             tag: "checkbox",
                                                        //             label: "",
                                                        //             value: true,
                                                        //             name: "locationselect",
                                                        //             placeholder: "Location",
                                                        //             classvalue: {
                                                        //                 container: "col-span-12 mb-2",
                                                        //                 label: "text-gray-600",
                                                        //                 field: "p-1",
                                                        //             },
                                                        //             onChange: [
                                                        //                 {
                                                        //                     event: "updatechild",
                                                        //                     fieldsUpdate: [
                                                        //                         {
                                                        //                             name: "location",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                                 {
                                                        //                                     name: "required",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: true
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: false
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                         {
                                                        //                             name: "preview-location",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                     ],
                                                        //                 },
                                                        //             ],
                                                        //             children: ["location", "preview-location"],
                                                        //             required: false,
                                                        //             mode: "super-edit",
                                                        //             icon: "",
                                                        //             formgrid: "none",
                                                        //             displayOrder: 1,
                                                        //         },
                                                        //         {
                                                        //             type: "checkbox",
                                                        //             tag: "checkbox",
                                                        //             label: "",
                                                        //             value: true,
                                                        //             name: "subsidiaryselect",
                                                        //             placeholder: "subsidiary",

                                                        //             classvalue: {
                                                        //                 container: "col-span-12 mb-2",
                                                        //                 label: "text-gray-600",
                                                        //                 field: "p-1",
                                                        //             },
                                                        //             onChange: [
                                                        //                 {
                                                        //                     event: "updatechild",
                                                        //                     fieldsUpdate: [
                                                        //                         {
                                                        //                             name: "subsidiary",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                                 {
                                                        //                                     name: "required",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: true
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: false
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                         {
                                                        //                             name: "preview-subsidiary",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                     ],
                                                        //                 },
                                                        //             ],
                                                        //             children: ["subsidiary", "preview-subsidiary"],
                                                        //             required: false,
                                                        //             mode: "super-edit",
                                                        //             icon: "",
                                                        //             formgrid: "none",
                                                        //             displayOrder: 1,
                                                        //         },
                                                        //         {
                                                        //             type: "checkbox",
                                                        //             tag: "checkbox",
                                                        //             label: "",
                                                        //             value: true,
                                                        //             name: "divisionselect",
                                                        //             placeholder: "division",
                                                        //             classvalue: {
                                                        //                 container: "col-span-12 mb-2",
                                                        //                 label: "text-gray-600",
                                                        //                 field: "p-1",
                                                        //             },
                                                        //             onChange: [
                                                        //                 {
                                                        //                     event: "updatechild",
                                                        //                     fieldsUpdate: [
                                                        //                         {
                                                        //                             name: "division",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                                 {
                                                        //                                     name: "required",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: true
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: false
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                         {
                                                        //                             name: "preview-division",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                     ],
                                                        //                 },
                                                        //             ],
                                                        //             children: ["division", "preview-division"],
                                                        //             required: false,
                                                        //             mode: "super-edit",
                                                        //             icon: "",
                                                        //             formgrid: "none",
                                                        //             displayOrder: 1,
                                                        //         },
                                                        //         {
                                                        //             type: "checkbox",
                                                        //             tag: "checkbox",
                                                        //             label: "",
                                                        //             value: true,
                                                        //             name: "departmentselect",
                                                        //             placeholder: "department",
                                                        //             classvalue: {
                                                        //                 container: "col-span-12 mb-2",
                                                        //                 label: "text-gray-600",
                                                        //                 field: "p-1",
                                                        //             },
                                                        //             onChange: [
                                                        //                 {
                                                        //                     event: "updatechild",
                                                        //                     fieldsUpdate: [
                                                        //                         {
                                                        //                             name: "department",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                                 {
                                                        //                                     name: "required",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: true
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: false
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                         {
                                                        //                             name: "preview-department",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                     ],
                                                        //                 },
                                                        //             ],
                                                        //             children: ["department", "preview-department"],
                                                        //             required: false,
                                                        //             mode: "super-edit",
                                                        //             icon: "",
                                                        //             formgrid: "none",
                                                        //             displayOrder: 1,
                                                        //         },
                                                        //         {
                                                        //             type: "checkbox",
                                                        //             tag: "checkbox",
                                                        //             label: "",
                                                        //             value: true,
                                                        //             name: "subDepartmentselect",
                                                        //             placeholder: "Sub Department",
                                                        //             classvalue: {
                                                        //                 container: "col-span-12 mb-2",
                                                        //                 label: "text-gray-600",
                                                        //                 field: "p-1",
                                                        //             },
                                                        //             onChange: [
                                                        //                 {
                                                        //                     event: "updatechild",
                                                        //                     fieldsUpdate: [
                                                        //                         {
                                                        //                             name: "subdepartment",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                                 {
                                                        //                                     name: "required",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: true
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: false
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                         {
                                                        //                             name: "preview-subdepartment",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                     ],
                                                        //                 },
                                                        //             ],
                                                        //             children: ["subdepartment", "preview-subdepartment"],
                                                        //             required: false,
                                                        //             mode: "super-edit",
                                                        //             icon: "",
                                                        //             formgrid: "none",
                                                        //             displayOrder: 1,
                                                        //         },
                                                        //         {
                                                        //             type: "checkbox",
                                                        //             tag: "checkbox",
                                                        //             label: "",
                                                        //             value: true,
                                                        //             name: "Sectionselect",
                                                        //             placeholder: "section",
                                                        //             classvalue: {
                                                        //                 container: "col-span-12 mb-2",
                                                        //                 label: "text-gray-600",
                                                        //                 field: "p-1",
                                                        //             },
                                                        //             onChange: [
                                                        //                 {
                                                        //                     event: "updatechild",
                                                        //                     fieldsUpdate: [
                                                        //                         {
                                                        //                             name: "section",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                                 {
                                                        //                                     name: "required",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: true
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: false
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                         {
                                                        //                             name: "preview-section",
                                                        //                             feildnkeys: [
                                                        //                                 {
                                                        //                                     name: "mode",
                                                        //                                     value: "none",
                                                        //                                     checkcondition: "switch",
                                                        //                                     switch: [
                                                        //                                         {
                                                        //                                             case: true,
                                                        //                                             value: "all-allow"
                                                        //                                         },
                                                        //                                         {
                                                        //                                             case: false,
                                                        //                                             value: "hidden"
                                                        //                                         }
                                                        //                                     ],
                                                        //                                     backendcall: false,
                                                        //                                 },
                                                        //                             ],
                                                        //                         },
                                                        //                     ],
                                                        //                 },
                                                        //             ],
                                                        //             children: ["section", "preview-section"],
                                                        //             required: false,
                                                        //             mode: "super-edit",
                                                        //             icon: "",
                                                        //             formgrid: "none",
                                                        //             displayOrder: 1,
                                                        //         },
                                                        //     ],
                                                        // },
                                                        {
                                                            formgrid: 2,
                                                            title: "Filter The Data",
                                                            classvalue: "col-span-12 mb-6 rounded-md ",
                                                            validationRules: {
                                                                required: ["logoupload"],
                                                            },
                                                            component: {
                                                                container: "col-span-12 pt-8 bg-gray-100  border-r  ",
                                                                title: {
                                                                    container: "bg-gray-100 p-2 bg-gray-100 rounded-md mb-6 pb-6",
                                                                    heading: "text-2xl ",
                                                                    description: "text-sm",
                                                                },
                                                            },
                                                            tabs: ["Basic Filter"],
                                                            fields: [
                                                                {
                                                                    type: "text",
                                                                    tag: "multi-select",
                                                                    label: "Organization",
                                                                    name: "organization",
                                                                    placeholder: "",
                                                                    value: [],
                                                                    classvalue: {
                                                                        container: "col-span-4 mb-0",
                                                                        label: "text-gray-600",
                                                                        field: "p-1",
                                                                    },
                                                                    mode: "all-allow",
                                                                    children: ["location"],
                                                                    required: true,
                                                                    icon: "",
                                                                    options: [
                                                                        { value: "apple", label: "Apple" },
                                                                        { value: "banana", label: "Banana" },
                                                                        { value: "orange", label: "Orange" },
                                                                        { value: "strawberry", label: "Strawberry" },
                                                                        { value: "grape", label: "Grape" },
                                                                        { value: "watermelon", label: "Watermelon" },
                                                                        { value: "pineapple", label: "Pineapple" },
                                                                        { value: "mango", label: "Mango" },
                                                                        { value: "kiwi", label: "Kiwi" },
                                                                        { value: "peach", label: "Peach" },
                                                                    ],
                                                                    onChange: [
                                                                        {
                                                                            event: "updatechild",
                                                                            fieldsUpdate: [
                                                                                {
                                                                                    name: "location",
                                                                                    feildnkeys: [
                                                                                        {
                                                                                            name: "options",
                                                                                            value: [
                                                                                                { value: "apple", label: "Apple" },
                                                                                                { value: "banana", label: "Banana" },
                                                                                                { value: "orange", label: "Orange" },
                                                                                                { value: "strawberry", label: "Strawberry" },
                                                                                                { value: "grape", label: "Grape" },
                                                                                                { value: "watermelon", label: "Watermelon" },
                                                                                                { value: "pineapple", label: "Pineapple" },
                                                                                                { value: "mango", label: "Mango" },
                                                                                                { value: "kiwi", label: "Kiwi" },
                                                                                                { value: "peach", label: "Peach" },
                                                                                            ],
                                                                                            checkcondition: "directaddvalue",
                                                                                            backendcall: false,
                                                                                            api: {


                                                                                            }
                                                                                        },
                                                                                    ],
                                                                                },
                                                                            ],
                                                                        },
                                                                    ],
                                                                    formgrid: "none",
                                                                    displayOrder: 1,
                                                                },
                                                                {
                                                                    type: "text",

                                                                    tag: "multi-select",
                                                                    label: "Location",
                                                                    name: "location",
                                                                    placeholder: "",
                                                                    value: [],
                                                                    classvalue: {
                                                                        container: "col-span-4 mb-0",
                                                                        label: "text-gray-600",
                                                                        field: "p-1",
                                                                    },
                                                                    onChange: [
                                                                        {
                                                                            event: "updatechild",
                                                                            fieldsUpdate: [
                                                                                {
                                                                                    name: "subsidiary",
                                                                                    feildnkeys: [
                                                                                        {
                                                                                            name: "options",
                                                                                            value: [
                                                                                                { value: "apple", label: "Apple" },
                                                                                                { value: "banana", label: "Banana" },
                                                                                                { value: "orange", label: "Orange" },
                                                                                                { value: "strawberry", label: "Strawberry" },
                                                                                                { value: "grape", label: "Grape" },
                                                                                                { value: "watermelon", label: "Watermelon" },
                                                                                                { value: "pineapple", label: "Pineapple" },
                                                                                                { value: "mango", label: "Mango" },
                                                                                                { value: "kiwi", label: "Kiwi" },
                                                                                                { value: "peach", label: "Peach" },
                                                                                            ],
                                                                                            checkcondition: "directaddvalue",
                                                                                            backendcall: false,
                                                                                        },
                                                                                    ],
                                                                                },
                                                                            ],
                                                                        },
                                                                    ],
                                                                    mode: "all-allow",
                                                                    children: ["subsidiary"],
                                                                    required: true,
                                                                    icon: "",
                                                                    options: [],
                                                                    formgrid: "none",
                                                                    displayOrder: 1,
                                                                },
                                                                {
                                                                    type: "text",
                                                                    tag: "multi-select",
                                                                    label: "Subsidiary",
                                                                    name: "subsidiary",
                                                                    placeholder: "",
                                                                    value: [],
                                                                    classvalue: {
                                                                        container: "col-span-4 mb-0",
                                                                        label: "text-gray-600",
                                                                        field: "p-1",
                                                                    },
                                                                    mode: "all-allow",
                                                                    children: ["division"],
                                                                    required: true,
                                                                    icon: "",
                                                                    onChange: [
                                                                        {
                                                                            event: "updatechild",
                                                                            fieldsUpdate: [
                                                                                {
                                                                                    name: "division",
                                                                                    feildnkeys: [
                                                                                        {
                                                                                            name: "options",
                                                                                            value: [
                                                                                                { value: "apple", label: "Apple" },
                                                                                                { value: "banana", label: "Banana" },
                                                                                                { value: "orange", label: "Orange" },
                                                                                                { value: "strawberry", label: "Strawberry" },
                                                                                                { value: "grape", label: "Grape" },
                                                                                                { value: "watermelon", label: "Watermelon" },
                                                                                                { value: "pineapple", label: "Pineapple" },
                                                                                                { value: "mango", label: "Mango" },
                                                                                                { value: "kiwi", label: "Kiwi" },
                                                                                                { value: "peach", label: "Peach" },
                                                                                            ],
                                                                                            checkcondition: "directaddvalue",
                                                                                            backendcall: false,
                                                                                        },
                                                                                    ],
                                                                                },
                                                                            ],
                                                                        },
                                                                    ],
                                                                    options: [],
                                                                    formgrid: "none",
                                                                    displayOrder: 1,
                                                                },
                                                                {
                                                                    type: "text",
                                                                    tag: "multi-select",
                                                                    label: "Division",
                                                                    name: "division",
                                                                    placeholder: "",
                                                                    value: [],
                                                                    classvalue: {
                                                                        container: "col-span-4 mb-0",
                                                                        label: "text-gray-600",
                                                                        field: "p-1",
                                                                    },
                                                                    mode: "all-allow",
                                                                    children: ["department"],
                                                                    required: true,
                                                                    icon: "",
                                                                    onChange: [
                                                                        {
                                                                            event: "updatechild",
                                                                            fieldsUpdate: [
                                                                                {
                                                                                    name: "department",
                                                                                    feildnkeys: [
                                                                                        {
                                                                                            name: "options",
                                                                                            value: [
                                                                                                { value: "apple", label: "Apple" },
                                                                                                { value: "banana", label: "Banana" },
                                                                                                { value: "orange", label: "Orange" },
                                                                                                { value: "strawberry", label: "Strawberry" },
                                                                                                { value: "grape", label: "Grape" },
                                                                                                { value: "watermelon", label: "Watermelon" },
                                                                                                { value: "pineapple", label: "Pineapple" },
                                                                                                { value: "mango", label: "Mango" },
                                                                                                { value: "kiwi", label: "Kiwi" },
                                                                                                { value: "peach", label: "Peach" },
                                                                                            ],
                                                                                            checkcondition: "directaddvalue",
                                                                                            backendcall: false,
                                                                                        },
                                                                                    ],
                                                                                },
                                                                            ],
                                                                        },
                                                                    ],
                                                                    options: [],
                                                                    formgrid: "none",
                                                                    displayOrder: 1,
                                                                },
                                                                {
                                                                    type: "text",
                                                                    tag: "multi-select",
                                                                    label: "Department",
                                                                    name: "department",
                                                                    placeholder: "",
                                                                    value: [],
                                                                    classvalue: {
                                                                        container: "col-span-4 mb-0",
                                                                        label: "text-gray-600",
                                                                        field: "p-1",
                                                                    },
                                                                    onChange: [
                                                                        {
                                                                            event: "updatechild",
                                                                            fieldsUpdate: [
                                                                                {
                                                                                    name: "subdepartment",
                                                                                    feildnkeys: [
                                                                                        {
                                                                                            name: "options",
                                                                                            value: [
                                                                                                { value: "apple", label: "Apple" },
                                                                                                { value: "banana", label: "Banana" },
                                                                                                { value: "orange", label: "Orange" },
                                                                                                { value: "strawberry", label: "Strawberry" },
                                                                                                { value: "grape", label: "Grape" },
                                                                                                { value: "watermelon", label: "Watermelon" },
                                                                                                { value: "pineapple", label: "Pineapple" },
                                                                                                { value: "mango", label: "Mango" },
                                                                                                { value: "kiwi", label: "Kiwi" },
                                                                                                { value: "peach", label: "Peach" },
                                                                                            ],
                                                                                            checkcondition: "directaddvalue",
                                                                                            backendcall: false,
                                                                                        },
                                                                                    ],
                                                                                },
                                                                            ],
                                                                        },
                                                                    ],
                                                                    mode: "all-allow",
                                                                    children: ["subdepartment"],
                                                                    required: true,
                                                                    icon: "",
                                                                    options: [],
                                                                    formgrid: "none",
                                                                    displayOrder: 1,
                                                                },
                                                                {
                                                                    type: "text",
                                                                    tag: "multi-select",
                                                                    label: "Sub Department",
                                                                    name: "subdepartment",
                                                                    placeholder: "",
                                                                    value: [],
                                                                    classvalue: {
                                                                        container: "col-span-4 mb-0",
                                                                        label: "text-gray-600",
                                                                        field: "p-1",
                                                                    },
                                                                    onChange: [
                                                                        {
                                                                            event: "updatechild",
                                                                            fieldsUpdate: [
                                                                                {
                                                                                    name: "section",
                                                                                    feildnkeys: [
                                                                                        {
                                                                                            name: "options",
                                                                                            value: [
                                                                                                { value: "apple", label: "Apple" },
                                                                                                { value: "banana", label: "Banana" },
                                                                                                { value: "orange", label: "Orange" },
                                                                                                { value: "strawberry", label: "Strawberry" },
                                                                                                { value: "grape", label: "Grape" },
                                                                                                { value: "watermelon", label: "Watermelon" },
                                                                                                { value: "pineapple", label: "Pineapple" },
                                                                                                { value: "mango", label: "Mango" },
                                                                                                { value: "kiwi", label: "Kiwi" },
                                                                                                { value: "peach", label: "Peach" },
                                                                                            ],
                                                                                            checkcondition: "directaddvalue",
                                                                                            backendcall: false,
                                                                                        },
                                                                                    ],
                                                                                },
                                                                            ],
                                                                        },
                                                                    ],
                                                                    mode: "all-allow",
                                                                    children: ["section"],
                                                                    required: true,
                                                                    icon: "",
                                                                    options: [],
                                                                    formgrid: "none",
                                                                    displayOrder: 1,
                                                                },
                                                                {
                                                                    type: "text",
                                                                    tag: "multi-select",
                                                                    label: "Section",
                                                                    name: "section",
                                                                    placeholder: "",
                                                                    value: [],
                                                                    classvalue: {
                                                                        container: "col-span-4 mb-0",
                                                                        label: "text-gray-600",
                                                                        field: "p-1",
                                                                    },
                                                                    mode: "all-allow",
                                                                    children: [],
                                                                    required: tr,
                                                                    icon: "",
                                                                    options: [],
                                                                    formgrid: "none",
                                                                    displayOrder: 1,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            formgrid: 4,
                                                            title: "",
                                                            classvalue: "col-span-12 gap-4",
                                                            validationRules: {
                                                                required: ["logoupload"],
                                                            },
                                                            tabs: ["Basic Filter"],
                                                            formtype: "table-form",
                                                            fields: [
                                                                {
                                                                    tag: "dummy",
                                                                    formgrid: "none",
                                                                    mode: "super-edit",
                                                                    displayOrder: 1,
                                                                    classvalue: {
                                                                        container: "col-span-6 mb-2",
                                                                    },
                                                                },
                                                                {
                                                                    type: "button",
                                                                    tag: "button",
                                                                    label: "Back",
                                                                    classvalue: {
                                                                        container: "col-span-3 mb-2",
                                                                        label: "text-gray-600",
                                                                        button: "bg-red-500 text-white",
                                                                    },
                                                                    children: ["progress-basic"],
                                                                    onChange: [
                                                                        {
                                                                            event: "updatechild",
                                                                            fieldsUpdate: [
                                                                                {
                                                                                    name: "progress-basic",
                                                                                    feildnkeys: [
                                                                                        {
                                                                                            name: "activeTab",
                                                                                            value: "Select Report",
                                                                                            checkcondition: "directaddvalue",
                                                                                            backendcall: false,
                                                                                        },
                                                                                    ],
                                                                                },
                                                                            ],
                                                                        },
                                                                    ],
                                                                    mode: "super-edit",
                                                                    icon: "XCircle",
                                                                    formgrid: "none",
                                                                    displayOrder: 1,
                                                                },
                                                                {
                                                                    type: "button",
                                                                    tag: "button",
                                                                    label: "Next",
                                                                    classvalue: {
                                                                        container: "col-span-3 mb-2 ",
                                                                        label: "text-gray-600",
                                                                        button: "bg-[#2563eb] text-white",
                                                                    },

                                                                    children: ["progress-basic"],
                                                                    requiredfields: ["selectreport", "organization", "location", "division", "department", "subdepartment", "section", "subsidiary"],
                                                                    functions: [
                                                                        {
                                                                            function: "validateRequiredFields",
                                                                            fieldsUpdate: [
                                                                                {
                                                                                    name: "progress-basic",
                                                                                    feildnkeys: [
                                                                                        {
                                                                                            name: "activeTab",
                                                                                            value: "none",
                                                                                            checkcondition: "switch",
                                                                                            switch: [
                                                                                                {
                                                                                                    case: "noerror",
                                                                                                    value: "Date Selection"
                                                                                                }
                                                                                            ],
                                                                                            backendcall: false,
                                                                                        },

                                                                                        {
                                                                                            name: "options",
                                                                                            checkcondition: "switch",
                                                                                            switch: [
                                                                                                {
                                                                                                    case: "noerror",
                                                                                                    value: [
                                                                                                        {
                                                                                                            label: "Select Report", completed: true, value: "Select Report", status: "firststate"
                                                                                                        },
                                                                                                        {
                                                                                                            label: "Filter", completed: true, value: "Filter", status: "completed",
                                                                                                            children: ["progress-basic"],
                                                                                                            requiredfields: ["selectreport"],
                                                                                                            functions: [
                                                                                                                {
                                                                                                                    function: "validateRequiredFields",
                                                                                                                    fieldsUpdate: [
                                                                                                                        {
                                                                                                                            name: "progress-basic",
                                                                                                                            feildnkeys: [
                                                                                                                                {
                                                                                                                                    name: "activeTab",
                                                                                                                                    value: "none",
                                                                                                                                    checkcondition: "switch",
                                                                                                                                    switch: [
                                                                                                                                        {
                                                                                                                                            case: "noerror",
                                                                                                                                            value: "Basic Filter"
                                                                                                                                        }
                                                                                                                                    ],
                                                                                                                                    backendcall: false,
                                                                                                                                },
                                                                                                                            ],
                                                                                                                        },
                                                                                                                    ],
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                        {
                                                                                                            label: "Date Selection", completed: false, value: "Date Selection",
                                                                                                            status: "working",
                                                                                                            children: ["progress-basic"],
                                                                                                            requiredfields: ["selectreport", "organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                                            functions: [
                                                                                                                {
                                                                                                                    function: "validateRequiredFields",
                                                                                                                    fieldsUpdate: [
                                                                                                                        {
                                                                                                                            name: "progress-basic",
                                                                                                                            feildnkeys: [
                                                                                                                                {
                                                                                                                                    name: "activeTab",
                                                                                                                                    value: "none",
                                                                                                                                    checkcondition: "switch",
                                                                                                                                    switch: [
                                                                                                                                        {
                                                                                                                                            case: "noerror",
                                                                                                                                            value: "Date Selection"
                                                                                                                                        }
                                                                                                                                    ],
                                                                                                                                    backendcall: false,
                                                                                                                                },
                                                                                                                            ],
                                                                                                                        },
                                                                                                                    ],
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                        {
                                                                                                            label: "Preview", completed: false, value: "Preview", status: "notstarted",
                                                                                                            children: ["progress-basic", "emp-select"],
                                                                                                            requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                                            functions: [
                                                                                                                {
                                                                                                                    function: "validateRequiredFields",
                                                                                                                    fieldsUpdate: [
                                                                                                                        {
                                                                                                                            name: "progress-basic",
                                                                                                                            feildnkeys: [
                                                                                                                                {
                                                                                                                                    name: "activeTab",
                                                                                                                                    value: "none",
                                                                                                                                    checkcondition: "switch",
                                                                                                                                    switch: [
                                                                                                                                        {
                                                                                                                                            case: "noerror",
                                                                                                                                            value: "Report Preview"
                                                                                                                                        }
                                                                                                                                    ],
                                                                                                                                    backendcall: false,
                                                                                                                                },
                                                                                                                            ],
                                                                                                                        },
                                                                                                                    ],
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                        {
                                                                                                            label: "Report Status", completed: false, value: "Report Status", status: "notstarted",
                                                                                                            children: ["progress-basic"],
                                                                                                            requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "start-report-generate", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                                            functions: [
                                                                                                                {
                                                                                                                    function: "validateRequiredFields",
                                                                                                                    fieldsUpdate: [
                                                                                                                        {
                                                                                                                            name: "progress-basic",
                                                                                                                            feildnkeys: [
                                                                                                                                {
                                                                                                                                    name: "activeTab",
                                                                                                                                    value: "none",
                                                                                                                                    checkcondition: "switch",
                                                                                                                                    switch: [
                                                                                                                                        {
                                                                                                                                            case: "noerror",
                                                                                                                                            value: "Report Status"
                                                                                                                                        }
                                                                                                                                    ],
                                                                                                                                    backendcall: false,
                                                                                                                                },
                                                                                                                            ],
                                                                                                                        },
                                                                                                                    ],
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                }
                                                                                            ],
                                                                                            backendcall: false,
                                                                                        },
                                                                                    ],
                                                                                },
                                                                                {
                                                                                    name: "options",
                                                                                    checkcondition: "switch",
                                                                                    switch: [
                                                                                        {
                                                                                            case: "noerror",
                                                                                            value: [
                                                                                                {
                                                                                                    label: "Select Report", completed: true, value: "Select Report", status: "firststate"
                                                                                                },
                                                                                                {
                                                                                                    label: "Filter", completed: true, value: "Filter", status: "completed",
                                                                                                    children: ["progress-basic"],
                                                                                                    requiredfields: ["selectreport"],
                                                                                                    functions: [
                                                                                                        {
                                                                                                            function: "validateRequiredFields",
                                                                                                            fieldsUpdate: [
                                                                                                                {
                                                                                                                    name: "progress-basic",
                                                                                                                    feildnkeys: [
                                                                                                                        {
                                                                                                                            name: "activeTab",
                                                                                                                            value: "none",
                                                                                                                            checkcondition: "switch",
                                                                                                                            switch: [
                                                                                                                                {
                                                                                                                                    case: "noerror",
                                                                                                                                    value: "Basic Filter"
                                                                                                                                }
                                                                                                                            ],
                                                                                                                            backendcall: false,
                                                                                                                        },
                                                                                                                    ],
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                                {
                                                                                                    label: "Date Selection", completed: false, value: "Date Selection",
                                                                                                    status: "working",
                                                                                                    children: ["progress-basic"],
                                                                                                    requiredfields: ["selectreport", "organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                                    functions: [
                                                                                                        {
                                                                                                            function: "validateRequiredFields",
                                                                                                            fieldsUpdate: [
                                                                                                                {
                                                                                                                    name: "progress-basic",
                                                                                                                    feildnkeys: [
                                                                                                                        {
                                                                                                                            name: "activeTab",
                                                                                                                            value: "none",
                                                                                                                            checkcondition: "switch",
                                                                                                                            switch: [
                                                                                                                                {
                                                                                                                                    case: "noerror",
                                                                                                                                    value: "Date Selection"
                                                                                                                                }
                                                                                                                            ],
                                                                                                                            backendcall: false,
                                                                                                                        },
                                                                                                                    ],
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                                {
                                                                                                    label: "Preview", completed: false, value: "Preview", status: "notstarted",
                                                                                                    children: ["progress-basic", "emp-select"],
                                                                                                    requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                                    functions: [
                                                                                                        {
                                                                                                            function: "validateRequiredFields",
                                                                                                            fieldsUpdate: [
                                                                                                                {
                                                                                                                    name: "progress-basic",
                                                                                                                    feildnkeys: [
                                                                                                                        {
                                                                                                                            name: "activeTab",
                                                                                                                            value: "none",
                                                                                                                            checkcondition: "switch",
                                                                                                                            switch: [
                                                                                                                                {
                                                                                                                                    case: "noerror",
                                                                                                                                    value: "Report Preview"
                                                                                                                                }
                                                                                                                            ],
                                                                                                                            backendcall: false,
                                                                                                                        },
                                                                                                                    ],
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                                {
                                                                                                    label: "Report Status", completed: false, value: "Report Status", status: "notstarted",
                                                                                                    children: ["progress-basic"],
                                                                                                    requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "start-report-generate", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                                    functions: [
                                                                                                        {
                                                                                                            function: "validateRequiredFields",
                                                                                                            fieldsUpdate: [
                                                                                                                {
                                                                                                                    name: "progress-basic",
                                                                                                                    feildnkeys: [
                                                                                                                        {
                                                                                                                            name: "activeTab",
                                                                                                                            value: "none",
                                                                                                                            checkcondition: "switch",
                                                                                                                            switch: [
                                                                                                                                {
                                                                                                                                    case: "noerror",
                                                                                                                                    value: "Report Status"
                                                                                                                                }
                                                                                                                            ],
                                                                                                                            backendcall: false,
                                                                                                                        },
                                                                                                                    ],
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            ],
                                                                                        }
                                                                                    ],
                                                                                    backendcall: false,
                                                                                },
                                                                                {
                                                                                    name: "preview-filervalue",
                                                                                    feildnkeys: [
                                                                                        {
                                                                                            name: "mode",
                                                                                            value: "none",
                                                                                            checkcondition: "switch",
                                                                                            switch: [
                                                                                                {
                                                                                                    case: "noerror",
                                                                                                    value: "hidden"
                                                                                                }
                                                                                            ],
                                                                                            backendcall: false,
                                                                                        },
                                                                                    ],
                                                                                },
                                                                                {
                                                                                    name: "preview-selectfilterationkey",
                                                                                    feildnkeys: [
                                                                                        {
                                                                                            name: "mode",
                                                                                            value: "none",
                                                                                            checkcondition: "switch",
                                                                                            switch: [
                                                                                                {
                                                                                                    case: "noerror",
                                                                                                    value: "hidden"
                                                                                                }
                                                                                            ],
                                                                                            backendcall: false,
                                                                                        },
                                                                                    ],
                                                                                },
                                                                                {
                                                                                    name: "preview-queryfilter",
                                                                                    feildnkeys: [
                                                                                        {
                                                                                            name: "mode",
                                                                                            value: "none",
                                                                                            checkcondition: "switch",
                                                                                            switch: [
                                                                                                {
                                                                                                    case: "noerror",
                                                                                                    value: "hidden"
                                                                                                }
                                                                                            ],
                                                                                            backendcall: false,
                                                                                        },
                                                                                    ],
                                                                                },
                                                                            ],
                                                                        },
                                                                        {
                                                                            function: "localStorage",
                                                                            storageName: "basicfilter",
                                                                            storageType: "local",
                                                                            storageValue: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary"],
                                                                        }
                                                                    ],
                                                                    mode: "super-edit",
                                                                    icon: "Save",
                                                                    formgrid: "none",
                                                                    displayOrder: 1,
                                                                },
                                                            ],
                                                        },
                                                    ]
                                                },
                                            ]
                                        },
                                        {
                                            formgrid: 2,
                                            title: "Filter The Data",
                                            classvalue: "col-span-12 mb-6 rounded-md ",
                                            validationRules: {
                                                required: ["logoupload"],
                                            },
                                            component: {
                                                container: "col-span-12 pt-8 bg-gray-100  border-r  ",
                                                title: {
                                                    container: "bg-gray-100 p-2 bg-gray-100 rounded-md mb-6 pb-6",
                                                    heading: "text-2xl ",
                                                    description: "text-sm",
                                                },
                                            },
                                            tabs: ["Simple Filter"],
                                            fields: [
                                                {
                                                    type: "text",
                                                    tag: "multi-select",
                                                    label: "Select Filteration Key",
                                                    name: "selectfilterationkey",
                                                    placeholder: "",
                                                    value: [],
                                                    classvalue: {
                                                        container: "col-span-3 mb-0",
                                                        label: "text-gray-600",
                                                        field: "p-1",
                                                    },
                                                    mode: "all-allow",
                                                    children: ["filervalue"],
                                                    required: true,
                                                    icon: "",
                                                    options: [
                                                        { value: "apple", label: "Apple" },
                                                        { value: "banana", label: "Banana" },
                                                        { value: "orange", label: "Orange" },
                                                        { value: "strawberry", label: "Strawberry" },
                                                        { value: "grape", label: "Grape" },
                                                        { value: "watermelon", label: "Watermelon" },
                                                        { value: "pineapple", label: "Pineapple" },
                                                        { value: "mango", label: "Mango" },
                                                        { value: "kiwi", label: "Kiwi" },
                                                        { value: "peach", label: "Peach" },
                                                    ],
                                                    onChange: [
                                                        {
                                                            event: "updatechild",
                                                            fieldsUpdate: [
                                                                {
                                                                    name: "filervalue",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "options",
                                                                            value: [
                                                                                { value: "apple", label: "Apple" },
                                                                                { value: "banana", label: "Banana" },
                                                                                { value: "orange", label: "Orange" },
                                                                                { value: "strawberry", label: "Strawberry" },
                                                                                { value: "grape", label: "Grape" },
                                                                                { value: "watermelon", label: "Watermelon" },
                                                                                { value: "pineapple", label: "Pineapple" },
                                                                                { value: "mango", label: "Mango" },
                                                                                { value: "kiwi", label: "Kiwi" },
                                                                                { value: "peach", label: "Peach" },
                                                                            ],
                                                                            checkcondition: "directaddvalue",
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                                {
                                                    tag: "dummy",
                                                    formgrid: "none",
                                                    mode: "super-edit",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-9 h-12 mb-2",
                                                    },
                                                },
                                                {
                                                    tag: "dummy",
                                                    formgrid: "none",
                                                    mode: "super-edit",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-3 h-12 mb-2",
                                                    },
                                                },
                                                {
                                                    type: "text",

                                                    tag: "multi-select",
                                                    label: "Filter The List",
                                                    name: "filervalue",
                                                    placeholder: "",
                                                    value: [],
                                                    classvalue: {
                                                        container: "col-span-6 mb-0",
                                                        label: "text-gray-600",
                                                        field: "p-1",
                                                    },
                                                    mode: "all-allow",
                                                    children: [],
                                                    required: true,
                                                    icon: "",
                                                    options: [],
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                                {
                                                    tag: "dummy",
                                                    formgrid: "none",
                                                    mode: "super-edit",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-3 h-12 mb-2",
                                                    },
                                                },
                                                {
                                                    tag: "dummy",
                                                    formgrid: "none",
                                                    mode: "super-edit",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-6 mb-2",
                                                    },
                                                },
                                                {
                                                    type: "button",
                                                    tag: "button",
                                                    label: "Back",
                                                    classvalue: {
                                                        container: "col-span-3 mb-2",
                                                        label: "text-gray-600",
                                                        button: "bg-red-500 text-white",
                                                    },
                                                    children: ["progress-basic"],
                                                    onChange: [
                                                        {
                                                            event: "updatechild",
                                                            fieldsUpdate: [
                                                                {
                                                                    name: "progress-basic",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "activeTab",
                                                                            value: "Select Report",
                                                                            checkcondition: "directaddvalue",
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                    mode: "super-edit",
                                                    icon: "XCircle",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                                {
                                                    type: "button",
                                                    tag: "button",
                                                    label: "Save & Next",
                                                    classvalue: {
                                                        container: "col-span-3 mb-2 ",
                                                        label: "text-gray-600",
                                                        button: "bg-[#2563eb] text-white",
                                                    },

                                                    children: ["progress-basic"],
                                                    requiredfields: ["selectreport", "filervalue"],
                                                    functions: [
                                                        {
                                                            function: "validateRequiredFields",
                                                            fieldsUpdate: [
                                                                {
                                                                    name: "progress-basic",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "activeTab",
                                                                            value: "none",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: "Date Selection"
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                        {
                                                                            name: "options",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: [
                                                                                        {
                                                                                            label: "Select Report", completed: true, value: "Select Report", status: "firststate"
                                                                                        },
                                                                                        {
                                                                                            label: "Filter", completed: true, value: "Filter", status: "completed",
                                                                                            children: ["progress-basic"],
                                                                                            requiredfields: ["selectreport"],
                                                                                            functions: [
                                                                                                {
                                                                                                    function: "validateRequiredFields",
                                                                                                    fieldsUpdate: [
                                                                                                        {
                                                                                                            name: "progress-basic",
                                                                                                            feildnkeys: [
                                                                                                                {
                                                                                                                    name: "activeTab",
                                                                                                                    value: "none",
                                                                                                                    checkcondition: "switch",
                                                                                                                    switch: [
                                                                                                                        {
                                                                                                                            case: "noerror",
                                                                                                                            value: "Basic Filter"
                                                                                                                        }
                                                                                                                    ],
                                                                                                                    backendcall: false,
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                        {
                                                                                            label: "Date Selection", completed: false, value: "Date Selection",
                                                                                            status: "working",
                                                                                            children: ["progress-basic"],
                                                                                            requiredfields: ["selectreport", "organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                            functions: [
                                                                                                {
                                                                                                    function: "validateRequiredFields",
                                                                                                    fieldsUpdate: [
                                                                                                        {
                                                                                                            name: "progress-basic",
                                                                                                            feildnkeys: [
                                                                                                                {
                                                                                                                    name: "activeTab",
                                                                                                                    value: "none",
                                                                                                                    checkcondition: "switch",
                                                                                                                    switch: [
                                                                                                                        {
                                                                                                                            case: "noerror",
                                                                                                                            value: "Date Selection"
                                                                                                                        }
                                                                                                                    ],
                                                                                                                    backendcall: false,
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                        {
                                                                                            label: "Preview", completed: false, value: "Preview", status: "notstarted",
                                                                                            children: ["progress-basic", "emp-select"],
                                                                                            requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                            functions: [
                                                                                                {
                                                                                                    function: "validateRequiredFields",
                                                                                                    fieldsUpdate: [
                                                                                                        {
                                                                                                            name: "progress-basic",
                                                                                                            feildnkeys: [
                                                                                                                {
                                                                                                                    name: "activeTab",
                                                                                                                    value: "none",
                                                                                                                    checkcondition: "switch",
                                                                                                                    switch: [
                                                                                                                        {
                                                                                                                            case: "noerror",
                                                                                                                            value: "Report Preview"
                                                                                                                        }
                                                                                                                    ],
                                                                                                                    backendcall: false,
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                        {
                                                                                            label: "Report Status", completed: false, value: "Report Status", status: "notstarted",
                                                                                            children: ["progress-basic"],
                                                                                            requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "start-report-generate", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                            functions: [
                                                                                                {
                                                                                                    function: "validateRequiredFields",
                                                                                                    fieldsUpdate: [
                                                                                                        {
                                                                                                            name: "progress-basic",
                                                                                                            feildnkeys: [
                                                                                                                {
                                                                                                                    name: "activeTab",
                                                                                                                    value: "none",
                                                                                                                    checkcondition: "switch",
                                                                                                                    switch: [
                                                                                                                        {
                                                                                                                            case: "noerror",
                                                                                                                            value: "Report Status"
                                                                                                                        }
                                                                                                                    ],
                                                                                                                    backendcall: false,
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                    ],
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                                {
                                                                    name: "preview-organization",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "mode",
                                                                            value: "none",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: "hidden"
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                                {
                                                                    name: "preview-location",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "mode",
                                                                            value: "none",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: "hidden"
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                                {
                                                                    name: "preview-subsidiary",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "mode",
                                                                            value: "none",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: "hidden"
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                                {
                                                                    name: "preview-division",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "mode",
                                                                            value: "none",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: "hidden"
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                                {
                                                                    name: "preview-department",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "mode",
                                                                            value: "none",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: "hidden"
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                                {
                                                                    name: "preview-subdepartment",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "mode",
                                                                            value: "none",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: "hidden"
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                                {
                                                                    name: "preview-section",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "mode",
                                                                            value: "none",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: "hidden"
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                                {
                                                                    name: "preview-queryfilter",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "mode",
                                                                            value: "none",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: "hidden"
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            function: "localStorage",
                                                            storageName: "basicfilter",
                                                            storageType: "local",
                                                            storageValue: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary"],
                                                        }
                                                    ],
                                                    mode: "super-edit",
                                                    icon: "Save",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                            ],
                                        },
                                        {
                                            formgrid: 2,
                                            title: "Filter The Data",
                                            classvalue: "col-span-12 mb-6 rounded-md ",
                                            validationRules: {
                                                required: ["logoupload"],
                                            },
                                            component: {
                                                container: "col-span-12 pt-8 bg-gray-100  border-r  ",
                                                title: {
                                                    container: "bg-gray-100 p-2 bg-gray-100 rounded-md mb-6 pb-6",
                                                    heading: "text-2xl ",
                                                    description: "text-sm",
                                                },
                                            },
                                            tabs: ["Query Filter"],
                                            fields: [
                                                {
                                                    tag: "dummy",
                                                    formgrid: "none",
                                                    mode: "super-edit",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-3 mb-2",
                                                    },
                                                },
                                                {
                                                    type: "text",
                                                    tag: "textarea",
                                                    label: "Write Query",
                                                    name: "queryfilter",
                                                    placeholder: "",
                                                    value: [],
                                                    classvalue: {
                                                        container: "col-span-6 mb-0",
                                                        label: "text-gray-600",
                                                        field: "p-1",
                                                    },
                                                    mode: "all-allow",
                                                    children: [],
                                                    required: true,
                                                    icon: "",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                                {
                                                    tag: "dummy",
                                                    formgrid: "none",
                                                    mode: "super-edit",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-3 h-12 mb-2",
                                                    },
                                                },
                                                {
                                                    tag: "dummy",
                                                    formgrid: "none",
                                                    mode: "super-edit",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-6 mb-2",
                                                    },
                                                },
                                                {
                                                    type: "button",
                                                    tag: "button",
                                                    label: "Back",
                                                    classvalue: {
                                                        container: "col-span-3 mb-2 mt-12",
                                                        label: "text-gray-600",
                                                        button: "bg-red-500 text-white",
                                                    },
                                                    children: ["progress-basic"],
                                                    onChange: [
                                                        {
                                                            event: "updatechild",
                                                            fieldsUpdate: [
                                                                {
                                                                    name: "progress-basic",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "activeTab",
                                                                            value: "Select Report",
                                                                            checkcondition: "directaddvalue",
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                    mode: "super-edit",
                                                    icon: "XCircle",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                                {
                                                    type: "button",
                                                    tag: "button",
                                                    label: "Next",
                                                    classvalue: {
                                                        container: "col-span-3 mb-2 mt-12",
                                                        label: "text-gray-600",
                                                        button: "bg-[#2563eb] text-white",
                                                    },
                                                    children: ["progress-basic"],
                                                    requiredfields: ["selectreport", "queryfilter"],
                                                    functions: [
                                                        {
                                                            function: "validateRequiredFields",
                                                            fieldsUpdate: [
                                                                {
                                                                    name: "progress-basic",
                                                                    feildnkeys: [
                                                                        {
                                                                            name: "activeTab",
                                                                            value: "none",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: "Date Selection"
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                        {
                                                                            name: "options",
                                                                            checkcondition: "switch",
                                                                            switch: [
                                                                                {
                                                                                    case: "noerror",
                                                                                    value: [
                                                                                        {
                                                                                            label: "Select Report", completed: true, value: "Select Report", status: "firststate"
                                                                                        },
                                                                                        {
                                                                                            label: "Filter", completed: true, value: "Filter", status: "completed",
                                                                                            children: ["progress-basic"],
                                                                                            requiredfields: ["selectreport"],
                                                                                            functions: [
                                                                                                {
                                                                                                    function: "validateRequiredFields",
                                                                                                    fieldsUpdate: [
                                                                                                        {
                                                                                                            name: "progress-basic",
                                                                                                            feildnkeys: [
                                                                                                                {
                                                                                                                    name: "activeTab",
                                                                                                                    value: "none",
                                                                                                                    checkcondition: "switch",
                                                                                                                    switch: [
                                                                                                                        {
                                                                                                                            case: "noerror",
                                                                                                                            value: "Basic Filter"
                                                                                                                        }
                                                                                                                    ],
                                                                                                                    backendcall: false,
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                        {
                                                                                            label: "Date Selection", completed: false, value: "Date Selection",
                                                                                            status: "working",
                                                                                            children: ["progress-basic"],
                                                                                            requiredfields: ["selectreport", "organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                            functions: [
                                                                                                {
                                                                                                    function: "validateRequiredFields",
                                                                                                    fieldsUpdate: [
                                                                                                        {
                                                                                                            name: "progress-basic",
                                                                                                            feildnkeys: [
                                                                                                                {
                                                                                                                    name: "activeTab",
                                                                                                                    value: "none",
                                                                                                                    checkcondition: "switch",
                                                                                                                    switch: [
                                                                                                                        {
                                                                                                                            case: "noerror",
                                                                                                                            value: "Date Selection"
                                                                                                                        }
                                                                                                                    ],
                                                                                                                    backendcall: false,
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                        {
                                                                                            label: "Preview", completed: false, value: "Preview", status: "notstarted",
                                                                                            children: ["progress-basic", "emp-select"],
                                                                                            requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                            functions: [
                                                                                                {
                                                                                                    function: "validateRequiredFields",
                                                                                                    fieldsUpdate: [
                                                                                                        {
                                                                                                            name: "progress-basic",
                                                                                                            feildnkeys: [
                                                                                                                {
                                                                                                                    name: "activeTab",
                                                                                                                    value: "none",
                                                                                                                    checkcondition: "switch",
                                                                                                                    switch: [
                                                                                                                        {
                                                                                                                            case: "noerror",
                                                                                                                            value: "Report Preview"
                                                                                                                        }
                                                                                                                    ],
                                                                                                                    backendcall: false,
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                        {
                                                                                            label: "Report Status", completed: false, value: "Report Status", status: "notstarted",
                                                                                            children: ["progress-basic"],
                                                                                            requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "start-report-generate", "selectfilterationkey", "filervalue", "queryfilter"],
                                                                                            functions: [
                                                                                                {
                                                                                                    function: "validateRequiredFields",
                                                                                                    fieldsUpdate: [
                                                                                                        {
                                                                                                            name: "progress-basic",
                                                                                                            feildnkeys: [
                                                                                                                {
                                                                                                                    name: "activeTab",
                                                                                                                    value: "none",
                                                                                                                    checkcondition: "switch",
                                                                                                                    switch: [
                                                                                                                        {
                                                                                                                            case: "noerror",
                                                                                                                            value: "Report Status"
                                                                                                                        }
                                                                                                                    ],
                                                                                                                    backendcall: false,
                                                                                                                },
                                                                                                            ],
                                                                                                        },
                                                                                                    ],
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                    ],
                                                                                }
                                                                            ],
                                                                            backendcall: false,
                                                                        },
                                                                    ],
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            function: "localStorage",
                                                            storageName: "basicfilter",
                                                            storageType: "local",
                                                            storageValue: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary"],
                                                        }
                                                    ],
                                                    mode: "super-edit",
                                                    icon: "Save",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            formgrid: 7,
                            title: "",
                            classvalue: "col-span-12 gap-4",
                            validationRules: {
                                required: ["logoupload"],
                            },
                            formtype: "tabs-form",
                            tabs: ["Date Selection"],
                            fields: [
                                {
                                    type: "tabs-form",
                                    tag: "tabs-form",
                                    label: "Talbe Form",
                                    formname: "table-form",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    name: "date-tabs",
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                    tabs: [
                                        {
                                            id: "Today", label: "Toady", value: "Today",
                                            children: ["selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate"],
                                            onChange: [
                                                {
                                                    event: "updatechild",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "selectdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "weekstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "weekenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "monthstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "monthenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "yearstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "yearenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "complexstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "complexenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            id: "Weekly",
                                            label: "Weekly",
                                            value: "Weekly",
                                            fieldNames: ["street", "city", "zip"],
                                            children: ["selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate"],
                                            onChange: [
                                                {
                                                    event: "updatechild",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "selectdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "weekstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "weekenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "monthstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "monthenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "yearstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "yearenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "complexstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "complexenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            id: "Montly",
                                            label: "Monthly",
                                            value: "Monthly",
                                            fieldNames: ["username", "email", "role"],
                                            children: ["selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate"],
                                            onChange: [
                                                {
                                                    event: "updatechild",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "selectdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "weekstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "weekenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "monthstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "monthenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "yearstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "yearenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "complexstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "complexenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            id: "Yearly",
                                            label: "Yearly",
                                            value: "Yearly",
                                            fieldNames: ["username", "email", "role"],
                                            children: ["selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate"],
                                            onChange: [
                                                {
                                                    event: "updatechild",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "selectdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "weekstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "weekenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "monthstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "monthenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "yearstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "yearenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "complexstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "complexenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            id: "Complex",
                                            label: "Complex",
                                            value: "Complex",
                                            fieldNames: ["username", "email", "role"],
                                            children: ["selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate"],
                                            onChange: [
                                                {
                                                    event: "updatechild",
                                                    fieldsUpdate: [
                                                        {
                                                            name: "selectdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "weekstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "weekenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "monthstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "monthenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "yearstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "yearenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: false,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "complexstartdate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                        {
                                                            name: "complexenddate",
                                                            feildnkeys: [
                                                                {
                                                                    name: "required",
                                                                    value: true,
                                                                    checkcondition: "directaddvalue",
                                                                    backendcall: false,
                                                                },
                                                            ],
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    subformstructure: [
                                        {
                                            formgrid: 1,
                                            title: "Date Selection",
                                            name: "progress-basic",
                                            classvalue: "col-span-12 mb-6 rounded-md ",
                                            component: {
                                                container: "col-span-12 pt-8 bg-gray-100  border-r  ",
                                                title: {
                                                    container: "bg-gray-100 p-2 bg-gray-100 rounded-md mb-6 pb-6",
                                                    heading: "text-2xl ",
                                                    description: "text-sm",
                                                },
                                            },
                                            validationRules: {
                                                required: ["logoupload"],
                                            },
                                            tabs: ["Today"],
                                            fields: [
                                                {
                                                    type: "date",
                                                    tag: "input",
                                                    label: "Select Date",
                                                    name: "selectdate",
                                                    placeholder: "",
                                                    value: [],
                                                    classvalue: {
                                                        container: "col-span-3 mb-0",
                                                        label: "text-gray-600",
                                                        field: "p-1",
                                                    },
                                                    functions: [
                                                        {
                                                            function: "toDayDate",
                                                            fieldsUpdate: [

                                                            ],
                                                        },
                                                    ],
                                                    mode: "all-allow",
                                                    children: [],
                                                    required: true,
                                                    icon: "",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                            ],
                                        },
                                        {
                                            formgrid: 2,
                                            title: "Date Selection",
                                            name: "progress-basic",
                                            classvalue: "col-span-12 mb-6 rounded-md ",
                                            component: {
                                                container: "col-span-12 pt-8 bg-gray-100  border-r  ",
                                                title: {
                                                    container: "bg-gray-100 p-2 bg-gray-100 rounded-md mb-6 pb-6",
                                                    heading: "text-2xl ",
                                                    description: "text-sm",
                                                },
                                            },
                                            validationRules: {
                                                required: ["logoupload"],
                                            },
                                            tabs: ["Weekly"],
                                            fields: [
                                                {
                                                    type: "date",
                                                    tag: "input",
                                                    label: "Week Start Date",
                                                    name: "weekstartdate",
                                                    placeholder: "",
                                                    value: [],
                                                    classvalue: {
                                                        container: "col-span-3 mb-0",
                                                        label: "text-gray-600",
                                                        field: "p-1",
                                                    },
                                                    mode: "all-allow",
                                                    children: [],
                                                    required: true,
                                                    icon: "",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                                {
                                                    type: "date",
                                                    tag: "input",
                                                    label: "Week End Date",
                                                    name: "weekenddate",
                                                    placeholder: "",
                                                    value: [],
                                                    classvalue: {
                                                        container: "col-span-3 mb-0",
                                                        label: "text-gray-600",
                                                        field: "p-1",
                                                    },
                                                    functions: [
                                                        {
                                                            function: "weeklyGap",
                                                            parameters: { weekstartdate: "weekstartdate", weekenddate: "weekenddate", maxWeeks: 1 },
                                                            fieldsUpdate: [
                                                            ],
                                                        },
                                                    ],
                                                    mode: "all-allow",
                                                    children: [],
                                                    required: true,
                                                    icon: "",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                            ],
                                        },
                                        {
                                            formgrid: 3,
                                            title: "Date Selection",
                                            name: "progress-basic",
                                            classvalue: "col-span-12 mb-6 rounded-md ",
                                            component: {
                                                container: "col-span-12 pt-8 bg-gray-100  border-r  ",
                                                title: {
                                                    container: "bg-gray-100 p-2 bg-gray-100 rounded-md mb-6 pb-6",
                                                    heading: "text-2xl ",
                                                    description: "text-sm",
                                                },
                                            },
                                            validationRules: {
                                                required: ["logoupload"],
                                            },
                                            tabs: ["Monthly"],
                                            fields: [
                                                {
                                                    type: "date",
                                                    tag: "input",
                                                    label: "Month Start Date",
                                                    name: "monthstartdate",
                                                    placeholder: "",
                                                    value: [],
                                                    classvalue: {
                                                        container: "col-span-3 mb-0",
                                                        label: "text-gray-600",
                                                        field: "p-1",
                                                    },
                                                    mode: "all-allow",
                                                    children: [],
                                                    required: true,
                                                    icon: "",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                                {
                                                    type: "date",
                                                    tag: "input",
                                                    label: "Month End Date",
                                                    name: "monthenddate",
                                                    placeholder: "",
                                                    value: [],
                                                    classvalue: {
                                                        container: "col-span-3 mb-0",
                                                        label: "text-gray-600",
                                                        field: "p-1",
                                                    },
                                                    mode: "all-allow",
                                                    children: [],
                                                    required: true,
                                                    icon: "",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                            ],
                                        },
                                        {
                                            formgrid: 3,
                                            title: "Date Selection",
                                            name: "progress-basic",
                                            classvalue: "col-span-12 mb-6 rounded-md ",
                                            component: {
                                                container: "col-span-12 pt-8 bg-gray-100  border-r  ",
                                                title: {
                                                    container: "bg-gray-100 p-2 bg-gray-100 rounded-md mb-6 pb-6",
                                                    heading: "text-2xl ",
                                                    description: "text-sm",
                                                },
                                            },
                                            validationRules: {
                                                required: ["logoupload"],
                                            },
                                            tabs: ["Yearly"],
                                            fields: [
                                                {
                                                    type: "date",
                                                    tag: "input",
                                                    label: "Year Start Date",
                                                    name: "yearstartdate",
                                                    placeholder: "",
                                                    value: [],
                                                    classvalue: {
                                                        container: "col-span-3 mb-0",
                                                        label: "text-gray-600",
                                                        field: "p-1",
                                                    },
                                                    mode: "all-allow",
                                                    children: [],
                                                    required: true,
                                                    icon: "",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                                {
                                                    type: "date",
                                                    tag: "input",
                                                    label: "Year End Date",
                                                    name: "yearenddate",
                                                    placeholder: "",
                                                    value: [],
                                                    classvalue: {
                                                        container: "col-span-3 mb-0",
                                                        label: "text-gray-600",
                                                        field: "p-1",
                                                    },
                                                    mode: "all-allow",
                                                    children: [],
                                                    required: true,
                                                    icon: "",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                            ],
                                        },
                                        {
                                            formgrid: 3,
                                            title: "Date Selection",
                                            name: "progress-basic",
                                            classvalue: "col-span-12 mb-6 rounded-md ",
                                            component: {
                                                container: "col-span-12 pt-8 bg-gray-100  border-r  ",
                                                title: {
                                                    container: "bg-gray-100 p-2 bg-gray-100 rounded-md mb-6 pb-6",
                                                    heading: "text-2xl ",
                                                    description: "text-sm",
                                                },
                                            },
                                            validationRules: {
                                                required: ["logoupload"],
                                            },
                                            tabs: ["Complex"],
                                            fields: [
                                                {
                                                    type: "date",
                                                    tag: "input",
                                                    label: "Start Date",
                                                    name: "complexstartdate",
                                                    placeholder: "",
                                                    value: [],
                                                    classvalue: {
                                                        container: "col-span-3 mb-0",
                                                        label: "text-gray-600",
                                                        field: "p-1",
                                                    },
                                                    mode: "all-allow",
                                                    children: [],
                                                    required: true,
                                                    icon: "",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                                {
                                                    type: "date",
                                                    tag: "input",
                                                    label: " End Date",
                                                    name: "complexenddate",
                                                    placeholder: "",
                                                    value: [],
                                                    classvalue: {
                                                        container: "col-span-3 mb-0",
                                                        label: "text-gray-600",
                                                        field: "p-1",
                                                    },
                                                    mode: "all-allow",
                                                    children: [],
                                                    required: true,
                                                    icon: "",
                                                    formgrid: "none",
                                                    displayOrder: 1,
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                        {
                            formgrid: 3,
                            title: "",
                            classvalue: "col-span-12 gap-4",
                            validationRules: {
                                required: ["logoupload"],
                            },
                            tabs: ["Select Employer"],
                            formtype: "table-form",
                            fields: [
                                {
                                    type: "table-form",
                                    tag: "table-form",
                                    label: "Talbe Form",
                                    name: "emp-select",
                                    formname: "table-form",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    tabledata: [],
                                    funtinality: {
                                        tabletype: {
                                            type: "data",
                                            classvalue: {
                                                container: "col-span-12 mb-2",
                                                tableheder: {
                                                    container: "bg-[#2461e8]",
                                                },
                                                label: "text-gray-600",
                                                field: "p-1",
                                            },
                                        },
                                        columnfunctionality: {
                                            draggable: {
                                                status: true,
                                            },
                                            handleRenameColumn: {
                                                status: true,
                                            },
                                            slNumber: {
                                                status: false,
                                            },
                                            selectCheck: {
                                                status: false,
                                                functions: ["handleSelectAll", "handleIndividualSelect"]
                                            },
                                            activeColumn: {
                                                status: false,
                                            },
                                        },
                                        textfunctionality: {
                                            expandedCells: {
                                                status: true,
                                            },
                                        },
                                        filterfunctionality: {
                                            handleSortAsc: {
                                                status: true,
                                            },
                                            handleSortDesc: {
                                                status: true,
                                            },
                                            search: {
                                                status: true,
                                            },
                                        },
                                        outsidetablefunctionality: {
                                            paginationControls: {
                                                status: true,
                                                start: "",
                                                end: "",
                                            },
                                            entriesPerPageSelector: {
                                                status: false,
                                            },
                                        },
                                        buttons: {
                                            save: {
                                                label: "Save",
                                                status: false,
                                                classvalue: {
                                                    container: "col-span-12 mb-2",
                                                    label: "text-gray-600",
                                                    field: "p-1",
                                                },
                                                function: () => {},
                                            },
                                            submit: {
                                                label: "Submit",
                                                status: false,
                                                classvalue: {
                                                    container: "col-span-12 mb-2",
                                                    label: "text-gray-600",
                                                    field: "p-1",
                                                },
                                                function: () => {},
                                            },
                                            addnew: {
                                                label: "Add New",
                                                status: false,
                                                classvalue: {
                                                    container: "col-span-12 mb-2",
                                                    label: "text-gray-600",
                                                    field: "p-1",
                                                },
                                                function: () => {},
                                            },
                                            cancel: {
                                                label: "Cancel",
                                                status: false,
                                                classvalue: {
                                                    container: "col-span-12 mb-2",
                                                    label: "text-gray-600",
                                                    field: "p-1",
                                                },
                                                function: () => {},
                                            },
                                            actionDelete: {
                                                label: "Delete",
                                                status: false,
                                                classvalue: {
                                                    container: "col-span-12 mb-2",
                                                    label: "text-gray-600",
                                                    field: "p-1",
                                                },
                                                function: (id: string) => {},
                                            },
                                            actionLink: {
                                                label: "link",
                                                status: false,
                                                classvalue: {
                                                    container: "col-span-12 mb-2",
                                                    label: "text-gray-600",
                                                    field: "p-1",
                                                },
                                                function: (item: any) => {},
                                            },
                                            actionEdit: {
                                                label: "Edit",
                                                status: false,
                                                classvalue: {
                                                    container: "col-span-12 mb-2",
                                                    label: "text-gray-600",
                                                    field: "p-1",
                                                },
                                                function: (id: string) => {},
                                            },
                                        },
                                    },
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                    columnsname: ["number1", "age1", "otpdate1", "finaldate1"],
                                },
                            ],
                        },
                        {
                            formgrid: 5,
                            title: "",
                            classvalue: "col-span-12 gap-4",
                            validationRules: {
                                required: ["logoupload"],
                            },
                            tabs: ["Select Employer"],
                            formtype: "table-form",
                            fields: [
                                {
                                    tag: "dummy",
                                    formgrid: "none",
                                    mode: "super-edit",
                                    displayOrder: 1,
                                    classvalue: {
                                        container: "col-span-6 mb-2",
                                    },
                                },
                                {
                                    type: "button",
                                    tag: "button",
                                    label: "Back",
                                    classvalue: {
                                        container: "col-span-3 mb-2",
                                        label: "text-gray-600",
                                        button: "bg-red-500 text-white",
                                    },
                                    mode: "super-edit",
                                    icon: "XCircle",
                                    formgrid: "none",
                                    displayOrder: 1,
                                    children: ["progress-basic"],
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "progress-basic",
                                                    feildnkeys: [
                                                        {
                                                            name: "activeTab",
                                                            value: "Basic Filter",
                                                            checkcondition: "directaddvalue",
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "button",
                                    tag: "button",
                                    label: "Save",
                                    classvalue: {
                                        container: "col-span-3 mb-2 ",
                                        label: "text-gray-600",
                                        button: "bg-[#2563eb] text-white",
                                    },
                                    children: ["progress-basic", "emp-select"],
                                    requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary"],
                                    functions: [
                                        {
                                            function: "validateRequiredFields",
                                            fieldsUpdate: [
                                                {
                                                    name: "progress-basic",
                                                    feildnkeys: [
                                                        {
                                                            name: "activeTab",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: "noerror",
                                                                    value: "Generate Report"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                                {
                                                    name: "emp-select",
                                                    feildnkeys: [
                                                        {
                                                            name: "tabledata",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: "noerror",
                                                                    value: [
                                                                        {
                                                                            _id: "1",
                                                                            employerName: "Tech Solutions Inc",
                                                                            registrationNumber: "REG123456",
                                                                            taxId: "TAX789012",
                                                                            industry: "Information Technology",
                                                                            employeeCount: "250",
                                                                            foundedYear: "2010",
                                                                            annualRevenue: "5000000",
                                                                            address: "123 Tech Park, Silicon Valley",
                                                                            city: "San Francisco",
                                                                            state: "CA",
                                                                            country: "USA",
                                                                            postalCode: "94105",
                                                                            contactPerson: "John Smith",
                                                                            contactEmail: "john@techsolutions.com",
                                                                            contactPhone: "+1-555-0123",
                                                                            website: "www.techsolutions.com",
                                                                            businessType: "Corporation",
                                                                            ownershipType: "Private",
                                                                            complianceStatus: "Compliant",
                                                                            lastAuditDate: "2024-01-15",
                                                                            certifications: "ISO 9001, ISO 27001",
                                                                            benefits: "Health, Dental, 401K",
                                                                            workCulture: "Innovative",
                                                                            remotePolicy: "Hybrid",
                                                                            officeLocations: "3",
                                                                            trainingPrograms: "Yes",
                                                                            diversityScore: "85",
                                                                            employeeRetention: "92%",
                                                                            marketPosition: "Leader",
                                                                            growthRate: "15%",
                                                                            sustainabilityScore: "88",
                                                                        },
                                                                        {
                                                                            _id: "2",
                                                                            employerName: "Global Manufacturing Co",
                                                                            registrationNumber: "REG789012",
                                                                            taxId: "TAX345678",
                                                                            industry: "Manufacturing",
                                                                            employeeCount: "1200",
                                                                            foundedYear: "1995",
                                                                            annualRevenue: "15000000",
                                                                            address: "456 Industrial Zone",
                                                                            city: "Detroit",
                                                                            state: "MI",
                                                                            country: "USA",
                                                                            postalCode: "48201",
                                                                            contactPerson: "Sarah Johnson",
                                                                            contactEmail: "sarah@globalmfg.com",
                                                                            contactPhone: "+1-555-0124",
                                                                            website: "www.globalmfg.com",
                                                                            businessType: "Corporation",
                                                                            ownershipType: "Public",
                                                                            complianceStatus: "Compliant",
                                                                            lastAuditDate: "2024-02-01",
                                                                            certifications: "ISO 9001, ISO 14001",
                                                                            benefits: "Full Benefits Package",
                                                                            workCulture: "Traditional",
                                                                            remotePolicy: "On-site",
                                                                            officeLocations: "5",
                                                                            trainingPrograms: "Yes",
                                                                            diversityScore: "78",
                                                                            employeeRetention: "88%",
                                                                            marketPosition: "Established",
                                                                            growthRate: "8%",
                                                                            sustainabilityScore: "82",
                                                                        },
                                                                        {
                                                                            _id: "3",
                                                                            employerName: "Healthcare Partners LLC",
                                                                            registrationNumber: "REG345678",
                                                                            taxId: "TAX901234",
                                                                            industry: "Healthcare",
                                                                            employeeCount: "800",
                                                                            foundedYear: "2005",
                                                                            annualRevenue: "12000000",
                                                                            address: "789 Medical Center Dr",
                                                                            city: "Boston",
                                                                            state: "MA",
                                                                            country: "USA",
                                                                            postalCode: "02108",
                                                                            contactPerson: "Dr. Michael Brown",
                                                                            contactEmail: "michael@healthcarepartners.com",
                                                                            contactPhone: "+1-555-0125",
                                                                            website: "www.healthcarepartners.com",
                                                                            businessType: "LLC",
                                                                            ownershipType: "Private",
                                                                            complianceStatus: "Compliant",
                                                                            lastAuditDate: "2024-01-20",
                                                                            certifications: "JCI, ISO 9001",
                                                                            benefits: "Comprehensive Healthcare",
                                                                            workCulture: "Patient-Centric",
                                                                            remotePolicy: "Flexible",
                                                                            officeLocations: "8",
                                                                            trainingPrograms: "Yes",
                                                                            diversityScore: "92",
                                                                            employeeRetention: "95%",
                                                                            marketPosition: "Leading",
                                                                            growthRate: "12%",
                                                                            sustainabilityScore: "90",
                                                                        },
                                                                        {
                                                                            _id: "4",
                                                                            employerName: "Green Energy Solutions",
                                                                            registrationNumber: "REG567890",
                                                                            taxId: "TAX234567",
                                                                            industry: "Renewable Energy",
                                                                            employeeCount: "450",
                                                                            foundedYear: "2015",
                                                                            annualRevenue: "8000000",
                                                                            address: "321 Solar Street",
                                                                            city: "Austin",
                                                                            state: "TX",
                                                                            country: "USA",
                                                                            postalCode: "78701",
                                                                            contactPerson: "Emma Wilson",
                                                                            contactEmail: "emma@greenenergy.com",
                                                                            contactPhone: "+1-555-0126",
                                                                            website: "www.greenenergy.com",
                                                                            businessType: "Corporation",
                                                                            ownershipType: "Private",
                                                                            complianceStatus: "Compliant",
                                                                            lastAuditDate: "2024-02-15",
                                                                            certifications: "ISO 14001, LEED",
                                                                            benefits: "Green Benefits Package",
                                                                            workCulture: "Sustainable",
                                                                            remotePolicy: "Hybrid",
                                                                            officeLocations: "4",
                                                                            trainingPrograms: "Yes",
                                                                            diversityScore: "88",
                                                                            employeeRetention: "90%",
                                                                            marketPosition: "Emerging",
                                                                            growthRate: "25%",
                                                                            sustainabilityScore: "95",
                                                                        },
                                                                        {
                                                                            _id: "5",
                                                                            employerName: "FinTech Innovations",
                                                                            registrationNumber: "REG901234",
                                                                            taxId: "TAX567890",
                                                                            industry: "Financial Technology",
                                                                            employeeCount: "300",
                                                                            foundedYear: "2018",
                                                                            annualRevenue: "6000000",
                                                                            address: "789 Wall Street",
                                                                            city: "New York",
                                                                            state: "NY",
                                                                            country: "USA",
                                                                            postalCode: "10005",
                                                                            contactPerson: "David Chen",
                                                                            contactEmail: "david@fintechinnovations.com",
                                                                            contactPhone: "+1-555-0127",
                                                                            website: "www.fintechinnovations.com",
                                                                            businessType: "Corporation",
                                                                            ownershipType: "Private",
                                                                            complianceStatus: "Compliant",
                                                                            lastAuditDate: "2024-02-10",
                                                                            certifications: "ISO 27001, PCI DSS",
                                                                            benefits: "Financial Wellness Package",
                                                                            workCulture: "Fast-Paced",
                                                                            remotePolicy: "Remote-First",
                                                                            officeLocations: "2",
                                                                            trainingPrograms: "Yes",
                                                                            diversityScore: "82",
                                                                            employeeRetention: "85%",
                                                                            marketPosition: "Disruptor",
                                                                            growthRate: "35%",
                                                                            sustainabilityScore: "75",
                                                                        }
                                                                    ],
                                                                },
                                                                {
                                                                    case: "all-condition",
                                                                    value: []
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                                {
                                                    name: "progress-basic",
                                                    feildnkeys: [
                                                        {
                                                            name: "options",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: "noerror",
                                                                    value: [
                                                                        {
                                                                            label: "Filter", completed: true, value: "Filter", status: "firststate"
                                                                        },
                                                                        {
                                                                            label: "Select Employer", completed: true, value: "Select Employer",
                                                                            status: "notstarted",
                                                                            children: ["progress-basic", "emp-select"],
                                                                            requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary"],
                                                                            functions: [
                                                                                {
                                                                                    function: "validateRequiredFields",
                                                                                    fieldsUpdate: [
                                                                                        {
                                                                                            name: "progress-basic",
                                                                                            feildnkeys: [
                                                                                                {
                                                                                                    name: "activeTab",
                                                                                                    value: "none",
                                                                                                    checkcondition: "switch",
                                                                                                    switch: [
                                                                                                        {
                                                                                                            case: "noerror",
                                                                                                            value: "Select Employer"
                                                                                                        }
                                                                                                    ],
                                                                                                    backendcall: false,
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                        {
                                                                                            name: "emp-select",
                                                                                            feildnkeys: [
                                                                                                {
                                                                                                    name: "tabledata",
                                                                                                    checkcondition: "switch",
                                                                                                    switch: [
                                                                                                        {
                                                                                                            case: "noerror",
                                                                                                            value: [
                                                                                                                {
                                                                                                                    _id: "1",
                                                                                                                    employerName: "Tech Solutions Inc",
                                                                                                                    registrationNumber: "REG123456",
                                                                                                                    taxId: "TAX789012",
                                                                                                                    industry: "Information Technology",
                                                                                                                    employeeCount: "250",
                                                                                                                    foundedYear: "2010",
                                                                                                                    annualRevenue: "5000000",
                                                                                                                    address: "123 Tech Park, Silicon Valley",
                                                                                                                    city: "San Francisco",
                                                                                                                    state: "CA",
                                                                                                                    country: "USA",
                                                                                                                    postalCode: "94105",
                                                                                                                    contactPerson: "John Smith",
                                                                                                                    contactEmail: "john@techsolutions.com",
                                                                                                                    contactPhone: "+1-555-0123",
                                                                                                                    website: "www.techsolutions.com",
                                                                                                                    businessType: "Corporation",
                                                                                                                    ownershipType: "Private",
                                                                                                                    complianceStatus: "Compliant",
                                                                                                                    lastAuditDate: "2024-01-15",
                                                                                                                    certifications: "ISO 9001, ISO 27001",
                                                                                                                    benefits: "Health, Dental, 401K",
                                                                                                                    workCulture: "Innovative",
                                                                                                                    remotePolicy: "Hybrid",
                                                                                                                    officeLocations: "3",
                                                                                                                    trainingPrograms: "Yes",
                                                                                                                    diversityScore: "85",
                                                                                                                    employeeRetention: "92%",
                                                                                                                    marketPosition: "Leader",
                                                                                                                    growthRate: "15%",
                                                                                                                    sustainabilityScore: "88",
                                                                                                                },
                                                                                                                {
                                                                                                                    _id: "2",
                                                                                                                    employerName: "Global Manufacturing Co",
                                                                                                                    registrationNumber: "REG789012",
                                                                                                                    taxId: "TAX345678",
                                                                                                                    industry: "Manufacturing",
                                                                                                                    employeeCount: "1200",
                                                                                                                    foundedYear: "1995",
                                                                                                                    annualRevenue: "15000000",
                                                                                                                    address: "456 Industrial Zone",
                                                                                                                    city: "Detroit",
                                                                                                                    state: "MI",
                                                                                                                    country: "USA",
                                                                                                                    postalCode: "48201",
                                                                                                                    contactPerson: "Sarah Johnson",
                                                                                                                    contactEmail: "sarah@globalmfg.com",
                                                                                                                    contactPhone: "+1-555-0124",
                                                                                                                    website: "www.globalmfg.com",
                                                                                                                    businessType: "Corporation",
                                                                                                                    ownershipType: "Public",
                                                                                                                    complianceStatus: "Compliant",
                                                                                                                    lastAuditDate: "2024-02-01",
                                                                                                                    certifications: "ISO 9001, ISO 14001",
                                                                                                                    benefits: "Full Benefits Package",
                                                                                                                    workCulture: "Traditional",
                                                                                                                    remotePolicy: "On-site",
                                                                                                                    officeLocations: "5",
                                                                                                                    trainingPrograms: "Yes",
                                                                                                                    diversityScore: "78",
                                                                                                                    employeeRetention: "88%",
                                                                                                                    marketPosition: "Established",
                                                                                                                    growthRate: "8%",
                                                                                                                    sustainabilityScore: "82",
                                                                                                                },
                                                                                                                {
                                                                                                                    _id: "3",
                                                                                                                    employerName: "Healthcare Partners LLC",
                                                                                                                    registrationNumber: "REG345678",
                                                                                                                    taxId: "TAX901234",
                                                                                                                    industry: "Healthcare",
                                                                                                                    employeeCount: "800",
                                                                                                                    foundedYear: "2005",
                                                                                                                    annualRevenue: "12000000",
                                                                                                                    address: "789 Medical Center Dr",
                                                                                                                    city: "Boston",
                                                                                                                    state: "MA",
                                                                                                                    country: "USA",
                                                                                                                    postalCode: "02108",
                                                                                                                    contactPerson: "Dr. Michael Brown",
                                                                                                                    contactEmail: "michael@healthcarepartners.com",
                                                                                                                    contactPhone: "+1-555-0125",
                                                                                                                    website: "www.healthcarepartners.com",
                                                                                                                    businessType: "LLC",
                                                                                                                    ownershipType: "Private",
                                                                                                                    complianceStatus: "Compliant",
                                                                                                                    lastAuditDate: "2024-01-20",
                                                                                                                    certifications: "JCI, ISO 9001",
                                                                                                                    benefits: "Comprehensive Healthcare",
                                                                                                                    workCulture: "Patient-Centric",
                                                                                                                    remotePolicy: "Flexible",
                                                                                                                    officeLocations: "8",
                                                                                                                    trainingPrograms: "Yes",
                                                                                                                    diversityScore: "92",
                                                                                                                    employeeRetention: "95%",
                                                                                                                    marketPosition: "Leading",
                                                                                                                    growthRate: "12%",
                                                                                                                    sustainabilityScore: "90",
                                                                                                                },
                                                                                                                {
                                                                                                                    _id: "4",
                                                                                                                    employerName: "Green Energy Solutions",
                                                                                                                    registrationNumber: "REG567890",
                                                                                                                    taxId: "TAX234567",
                                                                                                                    industry: "Renewable Energy",
                                                                                                                    employeeCount: "450",
                                                                                                                    foundedYear: "2015",
                                                                                                                    annualRevenue: "8000000",
                                                                                                                    address: "321 Solar Street",
                                                                                                                    city: "Austin",
                                                                                                                    state: "TX",
                                                                                                                    country: "USA",
                                                                                                                    postalCode: "78701",
                                                                                                                    contactPerson: "Emma Wilson",
                                                                                                                    contactEmail: "emma@greenenergy.com",
                                                                                                                    contactPhone: "+1-555-0126",
                                                                                                                    website: "www.greenenergy.com",
                                                                                                                    businessType: "Corporation",
                                                                                                                    ownershipType: "Private",
                                                                                                                    complianceStatus: "Compliant",
                                                                                                                    lastAuditDate: "2024-02-15",
                                                                                                                    certifications: "ISO 14001, LEED",
                                                                                                                    benefits: "Green Benefits Package",
                                                                                                                    workCulture: "Sustainable",
                                                                                                                    remotePolicy: "Hybrid",
                                                                                                                    officeLocations: "4",
                                                                                                                    trainingPrograms: "Yes",
                                                                                                                    diversityScore: "88",
                                                                                                                    employeeRetention: "90%",
                                                                                                                    marketPosition: "Emerging",
                                                                                                                    growthRate: "25%",
                                                                                                                    sustainabilityScore: "95",
                                                                                                                },
                                                                                                                {
                                                                                                                    _id: "5",
                                                                                                                    employerName: "FinTech Innovations",
                                                                                                                    registrationNumber: "REG901234",
                                                                                                                    taxId: "TAX567890",
                                                                                                                    industry: "Financial Technology",
                                                                                                                    employeeCount: "300",
                                                                                                                    foundedYear: "2018",
                                                                                                                    annualRevenue: "6000000",
                                                                                                                    address: "789 Wall Street",
                                                                                                                    city: "New York",
                                                                                                                    state: "NY",
                                                                                                                    country: "USA",
                                                                                                                    postalCode: "10005",
                                                                                                                    contactPerson: "David Chen",
                                                                                                                    contactEmail: "david@fintechinnovations.com",
                                                                                                                    contactPhone: "+1-555-0127",
                                                                                                                    website: "www.fintechinnovations.com",
                                                                                                                    businessType: "Corporation",
                                                                                                                    ownershipType: "Private",
                                                                                                                    complianceStatus: "Compliant",
                                                                                                                    lastAuditDate: "2024-02-10",
                                                                                                                    certifications: "ISO 27001, PCI DSS",
                                                                                                                    benefits: "Financial Wellness Package",
                                                                                                                    workCulture: "Fast-Paced",
                                                                                                                    remotePolicy: "Remote-First",
                                                                                                                    officeLocations: "2",
                                                                                                                    trainingPrograms: "Yes",
                                                                                                                    diversityScore: "82",
                                                                                                                    employeeRetention: "85%",
                                                                                                                    marketPosition: "Disruptor",
                                                                                                                    growthRate: "35%",
                                                                                                                    sustainabilityScore: "75",
                                                                                                                }
                                                                                                            ],
                                                                                                        },
                                                                                                        {
                                                                                                            case: "all-condition",
                                                                                                            value: []
                                                                                                        }
                                                                                                    ],
                                                                                                    backendcall: false,
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                    ],
                                                                                },
                                                                            ],
                                                                        },
                                                                        {
                                                                            label: "Generate Report", completed: false, value: "Generate Report", status: "notstarted",
                                                                            children: ["progress-basic", "emp-select"],
                                                                            requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary"],
                                                                            functions: [
                                                                                {
                                                                                    function: "validateRequiredFields",
                                                                                    fieldsUpdate: [
                                                                                        {
                                                                                            name: "progress-basic",
                                                                                            feildnkeys: [
                                                                                                {
                                                                                                    name: "activeTab",
                                                                                                    value: "none",
                                                                                                    checkcondition: "switch",
                                                                                                    switch: [
                                                                                                        {
                                                                                                            case: "noerror",
                                                                                                            value: "Select Employer"
                                                                                                        }
                                                                                                    ],
                                                                                                    backendcall: false,
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                        {
                                                                                            name: "emp-select",
                                                                                            feildnkeys: [
                                                                                                {
                                                                                                    name: "tabledata",
                                                                                                    checkcondition: "switch",
                                                                                                    switch: [
                                                                                                        {
                                                                                                            case: "noerror",
                                                                                                            value: [
                                                                                                                {
                                                                                                                    _id: "1",
                                                                                                                    employerName: "Tech Solutions Inc",
                                                                                                                    registrationNumber: "REG123456",
                                                                                                                    taxId: "TAX789012",
                                                                                                                    industry: "Information Technology",
                                                                                                                    employeeCount: "250",
                                                                                                                    foundedYear: "2010",
                                                                                                                    annualRevenue: "5000000",
                                                                                                                    address: "123 Tech Park, Silicon Valley",
                                                                                                                    city: "San Francisco",
                                                                                                                    state: "CA",
                                                                                                                    country: "USA",
                                                                                                                    postalCode: "94105",
                                                                                                                    contactPerson: "John Smith",
                                                                                                                    contactEmail: "john@techsolutions.com",
                                                                                                                    contactPhone: "+1-555-0123",
                                                                                                                    website: "www.techsolutions.com",
                                                                                                                    businessType: "Corporation",
                                                                                                                    ownershipType: "Private",
                                                                                                                    complianceStatus: "Compliant",
                                                                                                                    lastAuditDate: "2024-01-15",
                                                                                                                    certifications: "ISO 9001, ISO 27001",
                                                                                                                    benefits: "Health, Dental, 401K",
                                                                                                                    workCulture: "Innovative",
                                                                                                                    remotePolicy: "Hybrid",
                                                                                                                    officeLocations: "3",
                                                                                                                    trainingPrograms: "Yes",
                                                                                                                    diversityScore: "85",
                                                                                                                    employeeRetention: "92%",
                                                                                                                    marketPosition: "Leader",
                                                                                                                    growthRate: "15%",
                                                                                                                    sustainabilityScore: "88",
                                                                                                                },
                                                                                                                {
                                                                                                                    _id: "2",
                                                                                                                    employerName: "Global Manufacturing Co",
                                                                                                                    registrationNumber: "REG789012",
                                                                                                                    taxId: "TAX345678",
                                                                                                                    industry: "Manufacturing",
                                                                                                                    employeeCount: "1200",
                                                                                                                    foundedYear: "1995",
                                                                                                                    annualRevenue: "15000000",
                                                                                                                    address: "456 Industrial Zone",
                                                                                                                    city: "Detroit",
                                                                                                                    state: "MI",
                                                                                                                    country: "USA",
                                                                                                                    postalCode: "48201",
                                                                                                                    contactPerson: "Sarah Johnson",
                                                                                                                    contactEmail: "sarah@globalmfg.com",
                                                                                                                    contactPhone: "+1-555-0124",
                                                                                                                    website: "www.globalmfg.com",
                                                                                                                    businessType: "Corporation",
                                                                                                                    ownershipType: "Public",
                                                                                                                    complianceStatus: "Compliant",
                                                                                                                    lastAuditDate: "2024-02-01",
                                                                                                                    certifications: "ISO 9001, ISO 14001",
                                                                                                                    benefits: "Full Benefits Package",
                                                                                                                    workCulture: "Traditional",
                                                                                                                    remotePolicy: "On-site",
                                                                                                                    officeLocations: "5",
                                                                                                                    trainingPrograms: "Yes",
                                                                                                                    diversityScore: "78",
                                                                                                                    employeeRetention: "88%",
                                                                                                                    marketPosition: "Established",
                                                                                                                    growthRate: "8%",
                                                                                                                    sustainabilityScore: "82",
                                                                                                                },
                                                                                                                {
                                                                                                                    _id: "3",
                                                                                                                    employerName: "Healthcare Partners LLC",
                                                                                                                    registrationNumber: "REG345678",
                                                                                                                    taxId: "TAX901234",
                                                                                                                    industry: "Healthcare",
                                                                                                                    employeeCount: "800",
                                                                                                                    foundedYear: "2005",
                                                                                                                    annualRevenue: "12000000",
                                                                                                                    address: "789 Medical Center Dr",
                                                                                                                    city: "Boston",
                                                                                                                    state: "MA",
                                                                                                                    country: "USA",
                                                                                                                    postalCode: "02108",
                                                                                                                    contactPerson: "Dr. Michael Brown",
                                                                                                                    contactEmail: "michael@healthcarepartners.com",
                                                                                                                    contactPhone: "+1-555-0125",
                                                                                                                    website: "www.healthcarepartners.com",
                                                                                                                    businessType: "LLC",
                                                                                                                    ownershipType: "Private",
                                                                                                                    complianceStatus: "Compliant",
                                                                                                                    lastAuditDate: "2024-01-20",
                                                                                                                    certifications: "JCI, ISO 9001",
                                                                                                                    benefits: "Comprehensive Healthcare",
                                                                                                                    workCulture: "Patient-Centric",
                                                                                                                    remotePolicy: "Flexible",
                                                                                                                    officeLocations: "8",
                                                                                                                    trainingPrograms: "Yes",
                                                                                                                    diversityScore: "92",
                                                                                                                    employeeRetention: "95%",
                                                                                                                    marketPosition: "Leading",
                                                                                                                    growthRate: "12%",
                                                                                                                    sustainabilityScore: "90",
                                                                                                                },
                                                                                                                {
                                                                                                                    _id: "4",
                                                                                                                    employerName: "Green Energy Solutions",
                                                                                                                    registrationNumber: "REG567890",
                                                                                                                    taxId: "TAX234567",
                                                                                                                    industry: "Renewable Energy",
                                                                                                                    employeeCount: "450",
                                                                                                                    foundedYear: "2015",
                                                                                                                    annualRevenue: "8000000",
                                                                                                                    address: "321 Solar Street",
                                                                                                                    city: "Austin",
                                                                                                                    state: "TX",
                                                                                                                    country: "USA",
                                                                                                                    postalCode: "78701",
                                                                                                                    contactPerson: "Emma Wilson",
                                                                                                                    contactEmail: "emma@greenenergy.com",
                                                                                                                    contactPhone: "+1-555-0126",
                                                                                                                    website: "www.greenenergy.com",
                                                                                                                    businessType: "Corporation",
                                                                                                                    ownershipType: "Private",
                                                                                                                    complianceStatus: "Compliant",
                                                                                                                    lastAuditDate: "2024-02-15",
                                                                                                                    certifications: "ISO 14001, LEED",
                                                                                                                    benefits: "Green Benefits Package",
                                                                                                                    workCulture: "Sustainable",
                                                                                                                    remotePolicy: "Hybrid",
                                                                                                                    officeLocations: "4",
                                                                                                                    trainingPrograms: "Yes",
                                                                                                                    diversityScore: "88",
                                                                                                                    employeeRetention: "90%",
                                                                                                                    marketPosition: "Emerging",
                                                                                                                    growthRate: "25%",
                                                                                                                    sustainabilityScore: "95",
                                                                                                                },
                                                                                                                {
                                                                                                                    _id: "5",
                                                                                                                    employerName: "FinTech Innovations",
                                                                                                                    registrationNumber: "REG901234",
                                                                                                                    taxId: "TAX567890",
                                                                                                                    industry: "Financial Technology",
                                                                                                                    employeeCount: "300",
                                                                                                                    foundedYear: "2018",
                                                                                                                    annualRevenue: "6000000",
                                                                                                                    address: "789 Wall Street",
                                                                                                                    city: "New York",
                                                                                                                    state: "NY",
                                                                                                                    country: "USA",
                                                                                                                    postalCode: "10005",
                                                                                                                    contactPerson: "David Chen",
                                                                                                                    contactEmail: "david@fintechinnovations.com",
                                                                                                                    contactPhone: "+1-555-0127",
                                                                                                                    website: "www.fintechinnovations.com",
                                                                                                                    businessType: "Corporation",
                                                                                                                    ownershipType: "Private",
                                                                                                                    complianceStatus: "Compliant",
                                                                                                                    lastAuditDate: "2024-02-10",
                                                                                                                    certifications: "ISO 27001, PCI DSS",
                                                                                                                    benefits: "Financial Wellness Package",
                                                                                                                    workCulture: "Fast-Paced",
                                                                                                                    remotePolicy: "Remote-First",
                                                                                                                    officeLocations: "2",
                                                                                                                    trainingPrograms: "Yes",
                                                                                                                    diversityScore: "82",
                                                                                                                    employeeRetention: "85%",
                                                                                                                    marketPosition: "Disruptor",
                                                                                                                    growthRate: "35%",
                                                                                                                    sustainabilityScore: "75",
                                                                                                                }
                                                                                                            ],
                                                                                                        },
                                                                                                        {
                                                                                                            case: "all-condition",
                                                                                                            value: []
                                                                                                        }
                                                                                                    ],
                                                                                                    backendcall: false,
                                                                                                },
                                                                                            ],
                                                                                        },
                                                                                    ],
                                                                                },
                                                                            ],
                                                                        },
                                                                    ]
                                                                },
                                                                {
                                                                    case: "all-condition",
                                                                    value: []
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    mode: "super-edit",
                                    icon: "Save",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                            ],
                        },
                        {
                            formgrid: 5,
                            title: "Report Preview",
                            description:
                                "This document offers a snapshot of key data and insights compiled for preliminary review.",
                            classvalue: "col-span-12 gap-4",
                            validationRules: {
                                required: ["logoupload"],
                            },
                            formtype: "preview-section",
                            tabs: ["Report Preview"],
                            fields: [
                                {
                                    tag: "preview-section",
                                    formgrid: "none",
                                    mode: "super-edit",
                                    displayOrder: 1,
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                    },
                                    subformstructure: [
                                        {
                                            formgrid: 5,
                                            title: "",
                                            classvalue: "col-span-12 gap-4",
                                            validationRules: {
                                                required: ["logoupload"],
                                            },
                                            tabs: ["Select Employer"],
                                            formtype: "table-form",
                                            fields: [
                                                {
                                                    tag: "value-array",
                                                    formgrid: "none",
                                                    label: "Selected Report",
                                                    mode: "super-edit",
                                                    previewName: "selectreport",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-6 flex flex-col gap-2",
                                                    },
                                                    name: "preview-selectreport",
                                                    functions: [
                                                        {
                                                            function: "getValeFromWatch",
                                                            storageName: "selectreport",
                                                            storageType: "local",
                                                        }
                                                    ]
                                                },
                                            ],
                                        },
                                        {
                                            formgrid: 5,
                                            title: "",
                                            classvalue: "col-span-12 gap-4",
                                            validationRules: {
                                                required: ["logoupload"],
                                            },
                                            formtype: "table-form",
                                            fields: [
                                                {
                                                    tag: "value-array",
                                                    formgrid: "none",
                                                    label: "Organization",
                                                    mode: "super-edit",
                                                    previewName: "organization",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-4 flex flex-col gap-2",
                                                    },
                                                    name: "preview-organization",
                                                    functions: [
                                                        {
                                                            function: "getValeFromWatch",
                                                            storageName: "organization",
                                                            storageType: "local",
                                                        }
                                                    ]
                                                },
                                                {
                                                    tag: "value-array",
                                                    formgrid: "none",
                                                    label: "Location",
                                                    mode: "super-edit",
                                                    previewName: "location",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-4 flex flex-col gap-2",
                                                    },
                                                    name: "preview-location",
                                                    functions: [
                                                        {
                                                            function: "getValeFromWatch",
                                                            storageName: "location",
                                                            storageType: "local",
                                                        }
                                                    ]
                                                },
                                                {
                                                    tag: "value-array",
                                                    formgrid: "none",
                                                    label: "Subsidiary",
                                                    mode: "super-edit",
                                                    previewName: "subsidiary",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-4 flex flex-col gap-2",
                                                    },
                                                    name: "preview-subsidiary",
                                                    functions: [
                                                        {
                                                            function: "getValeFromWatch",
                                                            storageName: "subsidiary",
                                                            storageType: "local",
                                                        }
                                                    ]
                                                },
                                                {
                                                    tag: "value-array",
                                                    formgrid: "none",
                                                    label: "Division",
                                                    mode: "super-edit",
                                                    previewName: "division",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-4 flex flex-col gap-2",
                                                    },
                                                    name: "preview-division",
                                                    functions: [
                                                        {
                                                            function: "getValeFromWatch",
                                                            storageName: "division",
                                                            storageType: "local",
                                                        }
                                                    ]
                                                },
                                                {
                                                    tag: "value-array",
                                                    formgrid: "none",
                                                    label: "Department",
                                                    mode: "super-edit",
                                                    previewName: "department",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-4 flex flex-col gap-2",
                                                    },
                                                    name: "preview-department",
                                                    functions: [
                                                        {
                                                            function: "getValeFromWatch",
                                                            storageName: "department",
                                                            storageType: "local",
                                                        }
                                                    ]
                                                },
                                                {
                                                    tag: "value-array",
                                                    formgrid: "none",
                                                    label: "Department",
                                                    mode: "super-edit",
                                                    previewName: "department",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-4 flex flex-col gap-2",
                                                    },
                                                    name: "preview-department",
                                                    functions: [
                                                        {
                                                            function: "getValeFromWatch",
                                                            storageName: "department",
                                                            storageType: "local",
                                                        }
                                                    ]
                                                },
                                                {
                                                    tag: "value-array",
                                                    formgrid: "none",
                                                    label: "Sub Department",
                                                    mode: "super-edit",
                                                    previewName: "subdepartment",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-4 flex flex-col gap-2",
                                                    },
                                                    name: "preview-subdepartment",
                                                    functions: [
                                                        {
                                                            function: "getValeFromWatch",
                                                            storageName: "subdepartment",
                                                            storageType: "local",
                                                        }
                                                    ]
                                                },
                                                {
                                                    tag: "value-array",
                                                    formgrid: "none",
                                                    label: "Section",
                                                    mode: "super-edit",
                                                    previewName: "section",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-4 flex flex-col gap-2",
                                                    },
                                                    name: "preview-section",
                                                    functions: [
                                                        {
                                                            function: "getValeFromWatch",
                                                            storageName: "section",
                                                            storageType: "local",
                                                        }
                                                    ]
                                                },
                                            ],
                                        },
                                        {
                                            formgrid: 6,
                                            title: "",
                                            classvalue: "col-span-12 gap-4",
                                            validationRules: {
                                                required: ["logoupload"],
                                            },
                                            formtype: "table-form",
                                            fields: [
                                                {
                                                    tag: "value-array",
                                                    formgrid: "none",
                                                    label: "Select Filteration Key",
                                                    mode: "super-edit",
                                                    previewName: "selectfilterationkey",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-4 flex flex-col gap-2",
                                                    },
                                                    name: "preview-selectfilterationkey",
                                                    functions: [
                                                        {
                                                            function: "getValeFromWatch",
                                                            storageName: "selectfilterationkey",
                                                            storageType: "local",
                                                        }
                                                    ]
                                                },
                                                {
                                                    tag: "value-array",
                                                    formgrid: "none",
                                                    label: "Filter The List",
                                                    mode: "super-edit",
                                                    previewName: "filervalue",
                                                    displayOrder: 1,
                                                    classvalue: {
                                                        container: "col-span-4 flex flex-col gap-2",
                                                    },
                                                    name: "preview-filervalue",
                                                    functions: [
                                                        {
                                                            function: "getValeFromWatch",
                                                            storageName: "filervalue",
                                                            storageType: "local",
                                                        }
                                                    ]
                                                },
                                            ],
                                        },
                                    ]
                                },
                            ],
                        },
                    ],
                }
            ],
        },
    ],
};

export const reportFormStructure = {
    component: "form",
    mode: "view",
    title: "",
    description:
        "",
    classvalue: "grid-cols-12 gap-0 pt-4 mt-4",
    baseurl: "api/sectiondetails",
    subformstructure: [
        {
            formgrid: 1,
            title: "",
            classvalue: "col-span-12 pt-0  gap-2 p-2 ",
            component: {
                container: "col-span-4",
                title: {
                    container: "rounded-md mb-2",
                    heading: "text-2xl",
                    description: "text-sm",
                },
            },
            validationRules: {
                required: ["logoupload"],
            },
            fields: [
                {
                    type: "progress-form",
                    tag: "progress-form",
                    label: "",
                    value: true,
                    name: "progress-basic",
                    classvalue: {
                        container: "col-span-12 ",
                        label: "text-gray-600",
                        field: "p-1",
                    },
                    options: [
                        {
                            label: "Select Report", completed: false, value: "Select Report", status: "firststate",
                            parentFields: {
                                localstorage: "policyDiscription",
                                field: ["reportName"],
                            },
                            requiredfields: [],
                            selectFields: {
                                localstorage: "policyDiscription",
                                field: [],
                            },
                            childrenFields: {
                                localstorage: "policyDiscription",
                                field: [],
                            },
                        },
                        {
                            label: "Employee Filter", completed: false, value: "Employee Filter", status: "notstarted",
                            children: ["progress-basic"],
                            parentFields: {
                                localstorage: "policyDiscription",
                                field: ["subsidiaries", "reportName"],
                            },
                            requiredfields: ["reportName"],
                            selectFields: {
                                localstorage: "policyDiscription",
                                field: ["reportName"],
                            },
                            childrenFields: {
                                localstorage: "policyDiscription",
                                field: ["reportName"],
                            },
                        },
                        {
                            label: "Basic Information", completed: false, value: "Basic Information",
                            status: "notstarted",
                            children: ["progress-basic"],
                            requiredfields: ["selectreport", "organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectfilterationkey", "filervalue", "queryfilter"],
                            parentFields: {
                                localstorage: "policyDiscription",
                                field: ["toDate", "fromDate", "period", "workflowName", "reportTitle", "extension", "subsidiaries", "reportName"],
                            },
                            selectFields: {
                                localstorage: "policyDiscription",
                                field: ["subsidiaries", "reportName"],
                            },
                            childrenFields: {
                                localstorage: "policyDiscription",
                                field: ["subsidiaries", "reportName"],
                            },
                        },
                        {
                            label: "Preview", completed: false, value: "Preview", status: "notstarted",
                            children: ["progress-basic", "emp-select"],
                            requiredfields: ["reportName", "subsidiaries", "toDate", "fromDate", "period", "workflowName", "reportTitle", "extension"],
                            parentFields: {
                                localstorage: "policyDiscription",
                                field: ["toDate", "fromDate", "period", "workflowName", "reportTitle", "extension", "subsidiaries", "reportName", "generatereport"],
                            },
                            selectFields: {
                                localstorage: "policyDiscription",
                                field: ["toDate", "fromDate", "period", "workflowName", "reportTitle", "extension", "subsidiaries", "reportName"],
                            },
                            childrenFields: {
                                localstorage: "policyDiscription",
                                field: ["toDate", "fromDate", "period", "workflowName", "reportTitle", "extension", "subsidiaries", "reportName"],
                            },
                        },
                        // {
                        //     label: "Report Status", completed: false, value: "Report Status", status: "notstarted",
                        //     children: ["progress-basic"],
                        //     requiredfields: ["reportName", "subsidiaries", "toDate", "fromDate", "period", "workflowName", "reportTitle", "extension", "generatereport"],
                        //     parentFields: {
                        //         localstorage: "policyDiscription",
                        //         field: ["toDate", "fromDate", "period", "workflowName", "reportTitle", "extension", "subsidiaries", "reportName", "generatereport", "reportStatus"],
                        //     },
                        //     selectFields: {
                        //         localstorage: "policyDiscription",
                        //         field: ["toDate", "fromDate", "period", "workflowName", "reportTitle", "extension", "subsidiaries", "reportName", "generatereport"],
                        //     },
                        //     childrenFields: {
                        //         localstorage: "policyDiscription",
                        //         field: ["toDate", "fromDate", "period", "workflowName", "reportTitle", "extension", "subsidiaries", "reportName", "generatereport"],
                        //     },
                        // },
                    ],
                    children:[],
                    // children: ["progress-basic"],
                    onChange: [
                        // {
                        //     event: "updatechild",
                        //     fieldsUpdate: [
                        //         {
                        //             name: "progress-basic",
                        //             feildnkeys: [
                        //                 {
                        //                     name: "activeTab",
                        //                     value: "none",
                        //                     checkcondition: "switch",
                        //                     switch: [
                        //                         {
                        //                             case: "Select Report",
                        //                             value: "Select Report"
                        //                         },
                        //                         {
                        //                             case: "Basic Filter",
                        //                             value: "Basic Filter"
                        //                         },
                        //                         {
                        //                             case: "Date Selection",
                        //                             value: "Date Selection"
                        //                         },
                        //                         {
                        //                             case: "Generate Report",
                        //                             value: "Generate Report"
                        //                         },
                        //                     ],
                        //                     backendcall: false,
                        //                 },
                        //             ],
                        //         },
                        //     ],
                        // },
                    ],
                    required: false,
                    mode: "super-edit",
                    icon: "",
                    formgrid: "none",
                    displayOrder: 1,
                    activeTab: "Select Report",
                    subformstructure: [],
                }
            ],
        },
    ],
};

export const reportFilterFormStructure = {
    component: "form",
    mode: "view",
    title: "",
    description:
        "",
    classvalue: "grid-cols-12 gap-0 pt-4 mt-0",
    baseurl: "api/sectiondetails",
    subformstructure: [
        {
            formgrid: 1,
            title: "",
            classvalue: "col-span-12 gap-4",
            validationRules: {
                required: ["logoupload"],
            },
            formtype: "tabs-form",
            tabs: ["Select Report"],
            fields: [
                {
                    type: "tabs-form",
                    tag: "tabs-form",
                    label: "Talbe Form",
                    formname: "table-form",
                    classvalue: {
                        container: "col-span-12 mb-2",
                        label: "text-gray-600",
                        field: "p-1",
                    },
                    functions: [
                        {
                            function: "store-value-in-messager",
                        }
                    ],
                    name: "report-tabs",
                    mode: "super-edit",
                    icon: "",
                    formgrid: "none",
                    displayOrder: 1,
                    tabs: [
                        {
                            id: "All", label: "All", value: "All", fieldNames: [],
                            children: ["reportName"],
                            
                        },
                        {
                            id: "Contractor Employee", label: "Contractor Employee", value: "Contractor Employee", fieldNames: [],
                            children: ["selectreport"],
                            functions: [
                                {
                                    function: "filterNonNestedOptions",
                                    fieldsUpdate: [
                                        {
                                            name: "selectreport",
                                            feildnkeys: [
                                                {
                                                    name: "options",
                                                    checkcondition: "selectedvalue",
                                                },
                                            ],
                                        },
                                    ],
                                    fromField: "selectreport",
                                }
                            ],
                        },
                        {
                            id: "Shift",
                            label: "Shift",
                            value: "Shift",
                            fieldNames: ["username", "email", "role"],
                            children: ["selectreport"],
                            functions: [
                                {
                                    function: "filterNonNestedOptions",
                                    fieldsUpdate: [
                                        {
                                            name: "selectreport",
                                            feildnkeys: [
                                                {
                                                    name: "options",
                                                    checkcondition: "selectedvalue",
                                                },
                                            ],
                                        },
                                    ],
                                    fromField: "selectreport",
                                }
                            ],
                        },
                        {
                            id: "Attendance",
                            label: "Attendance",
                            value: "Attendance",
                            fieldNames: ["street", "city", "zip"],
                            children: ["selectreport"],
                            functions: [
                                {
                                    function: "filterNonNestedOptions",
                                    fieldsUpdate: [
                                        {
                                            name: "selectreport",
                                            feildnkeys: [
                                                {
                                                    name: "options",
                                                    checkcondition: "selectedvalue",
                                                },
                                            ],
                                        },
                                    ],
                                    fromField: "selectreport",
                                }
                            ],
                        },
                        {
                            id: "Leave",
                            label: "Leave",
                            value: "Leave",
                            fieldNames: ["companyName", "industry", "location"],
                            children: ["selectreport"],
                            functions: [
                                {
                                    function: "filterNonNestedOptions",
                                    fieldsUpdate: [
                                        {
                                            name: "selectreport",
                                            feildnkeys: [
                                                {
                                                    name: "options",
                                                    checkcondition: "selectedvalue",
                                                },
                                            ],
                                        },
                                    ],
                                    fromField: "selectreport",
                                }
                            ],
                        },
                        {
                            id: "Contractor",
                            label: "Contractor",
                            value: "Contractor",
                            fieldNames: ["theme", "notifications", "privacy"],
                            children: ["selectreport"],
                            functions: [
                                {
                                    function: "filterNonNestedOptions",
                                    fieldsUpdate: [
                                        {
                                            name: "selectreport",
                                            feildnkeys: [
                                                {
                                                    name: "options",
                                                    checkcondition: "selectedvalue",
                                                },
                                            ],
                                        },
                                    ],
                                    fromField: "selectreport",
                                }
                            ],
                        },
                        {
                            id: "Salary",
                            label: "Salary",
                            value: "Salary",
                            fieldNames: ["theme", "notifications", "privacy"],
                            children: ["selectreport"],
                            functions: [
                                {
                                    function: "filterNonNestedOptions",
                                    fieldsUpdate: [
                                        {
                                            name: "selectreport",
                                            feildnkeys: [
                                                {
                                                    name: "options",
                                                    checkcondition: "selectedvalue",
                                                },
                                            ],
                                        },
                                    ],
                                    fromField: "selectreport",
                                }
                            ],
                        },
                        {
                            id: "Other",
                            label: "Other",
                            value: "Other",
                            fieldNames: ["theme", "notifications", "privacy"],
                            children: ["selectreport"],
                            functions: [
                                {
                                    function: "filterNonNestedOptions",
                                    fieldsUpdate: [
                                        {
                                            name: "selectreport",
                                            feildnkeys: [
                                                {
                                                    name: "options",
                                                    checkcondition: "selectedvalue",
                                                },
                                            ],
                                        },
                                    ],
                                    fromField: "selectreport",
                                }
                            ],
                        },
                    ],
                    subformstructure: [
                        {
                            formgrid: 2,
                            title: "",
                            classvalue: "col-span-12 gap-2 p-2",
                            validationRules: {
                                required: ["logoupload"],
                            },
                            component: {
                                container: "col-span-4 pt-8 bg-gray-100 pl-2",
                                title: {
                                    container: "bg-gray-100 p-2 mb-6 rounded-md",
                                    heading: "text-2xl",
                                    description: "text-sm",
                                },
                            },
                            tabs: ["All", "Contractor Employee", "Shift", "Attendance", "Leave", "Contractor", "Salary", "Other"],
                            fields: [
                                {
                                    tag: "dummy",
                                    formgrid: "none",
                                    mode: "super-edit",
                                    displayOrder: 1,
                                    classvalue: {
                                        container: "col-span-12 h-12 mb-2",
                                    },
                                },
                                {
                                    tag: "dummy",
                                    formgrid: "none",
                                    mode: "super-edit",
                                    displayOrder: 1,
                                    classvalue: {
                                        container: "col-span-3 mb-2",
                                    },
                                },
                                {
                                    type: "text",
                                    tag: "single-select-filter",
                                    label: "Select Reports",
                                    name: "reportName",
                                    placeholder: "",
                                    value: [],
                                    classvalue: {
                                        container: "col-span-6 mb-0",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    mode: "all-allow",
                                    required: true,
                                    icon: "",
                                    functions: [
                                        {
                                            function: "update-base-on-messengerValue",
                                            messengerName: "report-tabs",
                                        }
                                    ],
                                    children: [],
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    tag: "dummy",
                                    formgrid: "none",
                                    mode: "super-edit",
                                    displayOrder: 1,
                                    classvalue: {
                                        container: "col-span-12 h-12 mb-2",
                                    },
                                },
                            ],
                        },
                        {
                            formgrid: 2,
                            title: "",
                            classvalue: "col-span-12 gap-4",
                            validationRules: {
                                required: ["logoupload"],
                            },

                            tabs: ["All", "Contractor Employee", "Shift", "Attendance", "Leave", "Contractor", "Salary", "Other"],
                            formtype: "table-form",
                            fields: [
                                {
                                    tag: "dummy",
                                    formgrid: "none",
                                    mode: "super-edit",
                                    displayOrder: 1,
                                    classvalue: {
                                        container: "col-span-10 mb-2",
                                    },
                                },
                                {
                                    type: "button",
                                    tag: "button",
                                    label: "Save and Continue",
                                    classvalue: {
                                        container: "col-span-2 mb-2 ",
                                        label: "text-gray-600",
                                        button: "bg-[#2563eb] text-white",
                                    },
                                    children: ["progress-basic", "emp-select"],
                                    requiredfields: ["selectreport"],
                                    functions: [
                                        {
                                            function: "localStorage",
                                            storageName: "reportDiscription",
                                            storageType: "local",
                                            storageKey: "reportAreaSelected",
                                            storageValue: ["reportName"],
                                            postStructure: {
                                                reportName: "",
                                            }
                                        },
                                        {
                                            function: "messenger-tonext-component",
                                            validation: ["reportName"],
                                            fieldsUpdate: [
                                                {
                                                    name: "progressbar",
                                                    feildnkeys: [
                                                        {
                                                            name: "activeTab",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: "noerror",
                                                                    value: "Employee Filter",
                                                                },
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        }
                                    ],
                                    mode: "super-edit",
                                    icon: "Next",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ],
};

export const employeeFilterFormStructure = {
    component: "form",
    mode: "view",
    title: "",
    description:
        "",
    classvalue: "grid-cols-12 gap-0 pt-4 mt-0",
    baseurl: "api/sectiondetails",
    subformstructure: [
        {
            formgrid: 1,
            title: "",
            name: "basic-container",
            classvalue: "col-span-12 mb-6 rounded-md ",
            component: {
                container: "col-span-12",
                title: {
                    container: " rounded-md",
                    heading: "text-2xl ",
                    description: "text-sm",
                },
            },
            validationRules: {
                required: ["logoupload"],
            },
            tabs: ["Basic Filter"],
            fields: [
                {
                    tag: "container-section",
                    formgrid: "none",
                    mode: "super-edit",
                    displayOrder: 1,
                    classvalue: {
                        container: "col-span-12 mb-2",
                    },
                    subformstructure: [
                        {
                            formgrid: 1,
                            title: "Select Filteration Parameters",
                            name: "progress-basic",
                            classvalue: "col-span-3 mb-6 rounded-md ",
                            component: {
                                container: "col-span-12 pt-0   border-r  ",
                                title: {
                                    container: "",
                                    heading: "text-2xl ",
                                    description: "text-sm",
                                },
                            },
                            validationRules: {
                                required: ["logoupload"],
                            },
                            tabs: ["Basic Filter"],
                            fields: [
                                {
                                    type: "checkbox",
                                    tag: "checkbox",
                                    label: "",
                                    value: true,
                                    name: "subsidiariesselect",
                                    placeholder: "Subsidiary",

                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "subsidiaries",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                        {
                                                            name: "required",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: true
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: false
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                                {
                                                    name: "preview-subsidiary",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    children: ["subsidiaries", "preview-subsidiary"],
                                    required: false,
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "checkbox",
                                    tag: "checkbox",
                                    label: "",
                                    value: false,
                                    name: "divisionsselect",
                                    placeholder: "Division",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "divisions",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                        {
                                                            name: "required",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: true
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: false
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    children: ["divisions", "preview-division"],
                                    required: false,
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "checkbox",
                                    tag: "checkbox",
                                    label: "",
                                    value: false,
                                    name: "locationselect",
                                    placeholder: "Location",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "location",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                        {
                                                            name: "required",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: true
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: false
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                                // {
                                                //     name: "preview-location",
                                                //     feildnkeys: [
                                                //         {
                                                //             name: "mode",
                                                //             value: "none",
                                                //             checkcondition: "switch",
                                                //             switch: [
                                                //                 {
                                                //                     case: true,
                                                //                     value: "all-allow"
                                                //                 },
                                                //                 {
                                                //                     case: false,
                                                //                     value: "hidden"
                                                //                 }
                                                //             ],
                                                //             backendcall: false,
                                                //         },
                                                //     ],
                                                // },
                                            ],
                                        },
                                    ],
                                    children: ["location"],
                                    required: false,
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "checkbox",
                                    tag: "checkbox",
                                    label: "",
                                    value: false,
                                    name: "designationsselect",
                                    placeholder: "Designations",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "designations",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                        {
                                                            name: "required",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: true
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: false
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                                {
                                                    name: "preview-department",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    children: ["designations"],
                                    required: false,
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "checkbox",
                                    tag: "checkbox",
                                    label: "",
                                    value: false,
                                    name: "gradesselect",
                                    placeholder: "Grades",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "grades",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                        {
                                                            name: "required",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: true
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: false
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    children: ["grades"],
                                    required: false,
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "checkbox",
                                    tag: "checkbox",
                                    label: "",
                                    value: false,
                                    name: "departmentsselect",
                                    placeholder: "department",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "departments",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                        {
                                                            name: "required",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: true
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: false
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                                {
                                                    name: "preview-department",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    children: ["departments", "preview-departments"],
                                    required: false,
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "checkbox",
                                    tag: "checkbox",
                                    label: "",
                                    value: false,
                                    name: "subDepartmentsselect",
                                    placeholder: "Sub Department",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "subDepartments",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                        {
                                                            name: "required",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: true
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: false
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                                {
                                                    name: "preview-subDepartment",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    children: ["subDepartments", "preview-subDepartments"],
                                    required: false,
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "checkbox",
                                    tag: "checkbox",
                                    label: "",
                                    value: false,
                                    name: "sectionsselect",
                                    placeholder: "sections",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "sections",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                        {
                                                            name: "required",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: true
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: false
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                                {
                                                    name: "preview-section",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    children: ["sections", "preview-sections"],
                                    
                                    required: false,
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "checkbox",
                                    tag: "checkbox",
                                    label: "",
                                    value: false,
                                    name: "employeeCategoriesselect",
                                    placeholder: "Employee Categories",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "employeeCategories",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                        {
                                                            name: "required",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: true
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: false
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                                {
                                                    name: "preview-employeeCategories",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    children: ["employeeCategories", "employeeCategories-sections"],
                                    required: false,
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "checkbox",
                                    tag: "checkbox",
                                    label: "",
                                    value: false,
                                    name: "contractorselect",
                                    placeholder: "Contractor",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "contractor",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                        {
                                                            name: "required",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: true
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: false
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    children: ["contractor"],
                                    required: false,
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "checkbox",
                                    tag: "checkbox",
                                    label: "",
                                    value: false,
                                    name: "workOrderNumberselect",
                                    placeholder: "Work Order Number",
                                    classvalue: {
                                        container: "col-span-12 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "workOrderNumber",
                                                    feildnkeys: [
                                                        {
                                                            name: "mode",
                                                            value: "none",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: "all-allow"
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: "hidden"
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                        {
                                                            name: "required",
                                                            checkcondition: "switch",
                                                            switch: [
                                                                {
                                                                    case: true,
                                                                    value: true
                                                                },
                                                                {
                                                                    case: false,
                                                                    value: false
                                                                }
                                                            ],
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    children: ["workOrderNumber"],
                                    required: false,
                                    mode: "super-edit",
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                            ],
                        },
                        {
                            formgrid: 2,
                            title: "Filter The Data",
                            classvalue: "col-span-9 mb-6 rounded-md ",
                            validationRules: {
                                required: ["logoupload"],
                            },
                            component: {
                                container: "col-span-12  border-r  ",
                                title: {
                                    container: " rounded-md mb-0 pb-0",
                                    heading: "text-2xl ",
                                    description: "text-sm",
                                },
                            },
                            tabs: ["Basic Filter"],
                            fields: [
                                {
                                    type: "text",
                                    tag: "multi-select",
                                    label: "Subsidiaries",
                                    name: "subsidiaries",
                                    placeholder: "",
                                    value: [],
                                    classvalue: {
                                        container: "col-span-4 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    mode: "all-allow",
                                    children: ["divisions"],
                                    required: false,
                                    icon: "",
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "divisions",
                                                    feildnkeys: [
                                                        {
                                                            name: "options",
                                                            value: [
                                                                { value: "sub1", label: "Subsidiary-1" },
                                                            ],
                                                            checkcondition: "selectedvalue",
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    // functions: [
                                    //     {
                                    //         function: "first-update-options",
                                    //         fieldsUpdate: [
                                    //             {
                                    //                 name: "location",
                                    //                 feildnkeys: [
                                    //                     {
                                    //                         name: "options",
                                    //                         backendcall: false,
                                    //                     },
                                    //                 ],
                                    //             },
                                    //         ],
                                    //     }
                                    // ],
                                    options: [],
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "text",
                                    tag: "multi-select",
                                    label: "Location",
                                    name: "location",
                                    placeholder: "",
                                    value: [],
                                    classvalue: {
                                        container: "col-span-4 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    options: [],
                                    onChange: [],
                                    mode: "hidden",
                                    children: [],
                                    required: false,
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "text",
                                    tag: "multi-select",
                                    label: "Divisions",
                                    name: "divisions",
                                    placeholder: "",
                                    value: [],
                                    classvalue: {
                                        container: "col-span-4 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    mode: "hidden",
                                    children: ["departments", "designations"],
                                    required:false,
                                    icon: "",
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "departments",
                                                    feildnkeys: [
                                                        {
                                                            name: "options",
                                                            value: [
                                                                { value: "sub1", label: "Subsidiary-1" },
                                                            ],
                                                            checkcondition: "directaddvalue",
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                                {
                                                    name: "designations",
                                                    feildnkeys: [
                                                        {
                                                            name: "options",
                                                            value: [
                                                                { value: "sub1", label: "Subsidiary-1" },
                                                            ],
                                                            checkcondition: "directaddvalue",
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    options: [],
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "text",
                                    tag: "multi-select",
                                    label: "Designations",
                                    name: "designations",
                                    placeholder: "",
                                    value: [],
                                    classvalue: {
                                        container: "col-span-4 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "grades",
                                                    feildnkeys: [
                                                        {
                                                            name: "options",
                                                            value: [
                                                                { value: "sub1", label: "Subsidiary-1" },
                                                            ],
                                                            checkcondition: "directaddvalue",
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    mode: "hidden",
                                    children: ["grades"],
                                    required: false,
                                    icon: "",
                                    options: [],
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "text",
                                    tag: "multi-select",
                                    label: "Grades",
                                    name: "grades",
                                    placeholder: "",
                                    value: [],
                                    classvalue: {
                                        container: "col-span-4 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    mode: "hidden",
                                    children: ["grades"],
                                    required: false,
                                    icon: "",
                                    options: [],
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "text",
                                    tag: "multi-select",
                                    label: "Departments",
                                    name: "departments",
                                    placeholder: "",
                                    value: [],
                                    classvalue: {
                                        container: "col-span-4 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    mode: "hidden",
                                    children: ["subDepartments"],
                                    required: false,
                                    icon: "",
                                    options: [],
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "text",
                                    tag: "multi-select",
                                    label: "Sub Departments",
                                    name: "subDepartments",
                                    placeholder: "",
                                    value: [],
                                    classvalue: {
                                        container: "col-span-4 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "sections",
                                                    feildnkeys: [
                                                        {
                                                            name: "options",
                                                            value: [
                                                                { value: "sub1", label: "Subsidiary-1" },
                                                            ],
                                                            checkcondition: "directaddvalue",
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    mode: "hidden",
                                    children: ["sections"],
                                    required: false,
                                    icon: "",
                                    options: [],
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "text",
                                    tag: "multi-select",
                                    label: "Sections",
                                    name: "sections",
                                    placeholder: "",
                                    value: [],
                                    classvalue: {
                                        container: "col-span-4 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    mode: "hidden",
                                    children: [],
                                    required: tr,
                                    icon: "",
                                    options: [],
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "text",
                                    tag: "multi-select",
                                    label: "Employee Categories",
                                    name: "employeeCategories",
                                    placeholder: "",
                                    value: [],
                                    classvalue: {
                                        container: "col-span-4 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    options: [],
                                    onChange: [],
                                    mode: "hidden",
                                    children: [],
                                    required: false,
                                    icon: "",
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "text",
                                    tag: "multi-select",
                                    label: "Contractor",
                                    name: "contractor",
                                    placeholder: "",
                                    value: [],
                                    classvalue: {
                                        container: "col-span-4 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    onChange: [
                                        {
                                            event: "updatechild",
                                            fieldsUpdate: [
                                                {
                                                    name: "workOrderNumber",
                                                    feildnkeys: [
                                                        {
                                                            name: "options",
                                                            value: [
                                                                { value: "sub1", label: "Subsidiary-1" },
                                                            ],
                                                            checkcondition: "directaddvalue",
                                                            backendcall: false,
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                    mode: "hidden",
                                    children: ["workOrderNumber"],
                                    required: false,
                                    icon: "",
                                    options: [],
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                                {
                                    type: "text",
                                    tag: "multi-select",
                                    label: "Work Order Number",
                                    name: "workOrderNumber",
                                    placeholder: "",
                                    value: [],
                                    classvalue: {
                                        container: "col-span-4 mb-2",
                                        label: "text-gray-600",
                                        field: "p-1",
                                    },
                                    mode: "hidden",
                                    children: [],
                                    required: tr,
                                    icon: "",
                                    options: [],
                                    formgrid: "none",
                                    displayOrder: 1,
                                },
                            ],
                        },
                        // {
                        //     formgrid: 4,
                        //     title: "",
                        //     classvalue: "col-span-12 gap-4",
                        //     validationRules: {
                        //         required: ["logoupload"],
                        //     },
                        //     tabs: ["Basic Filter"],
                        //     formtype: "table-form",
                        //     fields: [
                        //         {
                        //             tag: "dummy",
                        //             formgrid: "none",
                        //             mode: "super-edit",
                        //             displayOrder: 1,
                        //             classvalue: {
                        //                 container: "col-span-10 mb-2",
                        //             },
                        //         },
                                // {
                                //     type: "button",
                                //     tag: "button",
                                //     label: "Back",
                                //     classvalue: {
                                //         container: "col-span-2 mb-2",
                                //         label: "text-gray-600",
                                //         button: "bg-red-500 text-white",
                                //     },
                                //     children: ["progress-basic"],

                                //     functions: [
                                //         {
                                //             function: "messenger-tonext-component",
                                //             fieldsUpdate: [
                                //                 {
                                //                     name: "progressbar",
                                //                     feildnkeys: [
                                //                         {
                                //                             name: "activeTab",
                                //                             checkcondition: "switch",
                                //                             switch: [
                                //                                 {
                                //                                     case: "noerror",
                                //                                     value: "Select Report",
                                //                                 },
                                //                             ],
                                //                             backendcall: false,
                                //                         },
                                //                     ],
                                //                 },
                                //             ],
                                //         }
                                //     ],
                                //     mode: "super-edit",
                                //     icon: "XCircle",
                                //     formgrid: "none",
                                //     displayOrder: 1,
                                // },
                                // {
                                //     type: "button",
                                //     tag: "button",
                                //     label: "Save & Continue",
                                //     classvalue: {
                                //         container: "col-span-2 mb-2 ",
                                //         label: "text-gray-600",
                                //         button: "bg-[#2563eb] text-white",
                                //     },
                                //     children: ["progress-basic"],
                                //     requiredfields: ["selectreport", "divisions", "departments", "subDepartments", "sections", "subsidiaries", "location"],
                                //     functions: [
                                //         {
                                //             function: "localStorage",
                                //             storageName: "reportDiscription",
                                //             storageType: "local",
                                //             storageKey: "reportAreaSelected",
                                //             storageValue: ["subsidiaries", "divisions", "departments", "subDepartments", "sections", "designations", "grades", "reportName","employeeCategories","contractor","workOrderNumber"],
                                //             postStructure: {
                                //                 subsidiaries: "",
                                //                 divisions: "",
                                //                 departments: "",
                                //                 subDepartments: "",
                                //                 sections: "",
                                //                 designations: "",
                                //                 grades: "",
                                //                 employeeCategories:"",
                                //                 contractor:"",
                                //                 workOrderNumber:""
                                //             }
                                //         },
                                //         {
                                //             function: "messenger-tonext-component",
                                //             validation: ["subsidiaries", "divisions", "departments", "subDepartments", "sections", "designations", "grades","employeeCategories","contractor","workOrderNumber"],
                                //             fieldsUpdate: [
                                //                 {
                                //                     name: "progressbar",
                                //                     feildnkeys: [
                                //                         {
                                //                             name: "activeTab",
                                //                             checkcondition: "switch",
                                //                             switch: [
                                //                                 {
                                //                                     case: "noerror",
                                //                                     value: "Basic Information",
                                //                                 },
                                //                             ],
                                //                             backendcall: false,
                                //                         },
                                //                     ],
                                //                 },
                                //             ],
                                //         }
                                //     ],
                                //     mode: "super-edit",
                                //     icon: "Save",
                                //     formgrid: "none",
                                //     displayOrder: 1,
                                // },
                        //     ],
                        // },
                    ]
                },
            ]
        },
        // {
        //     formgrid: 2,
        //     title: "Filter The Data",
        //     classvalue: "col-span-12 mb-6 rounded-md ",
        //     validationRules: {
        //         required: ["logoupload"],
        //     },
        //     component: {
        //         container: "col-span-12 pt-8 bg-gray-100  border-r  ",
        //         title: {
        //             container: "bg-gray-100 p-2 bg-gray-100 rounded-md mb-6 pb-6",
        //             heading: "text-2xl ",
        //             description: "text-sm",
        //         },
        //     },
        //     tabs: ["Simple Filter"],
        //     fields: [
        //         {
        //             type: "text",
        //             tag: "multi-select",
        //             label: "Select Filteration Key",
        //             name: "selectfilterationkey",
        //             placeholder: "",
        //             value: [],
        //             classvalue: {
        //                 container: "col-span-3 mb-0",
        //                 label: "text-gray-600",
        //                 field: "p-1",
        //             },
        //             mode: "all-allow",
        //             children: ["filervalue"],
        //             required: true,
        //             icon: "",
        //             options: [
        //                 { value: "apple", label: "Apple" },
        //                 { value: "banana", label: "Banana" },
        //                 { value: "orange", label: "Orange" },
        //                 { value: "strawberry", label: "Strawberry" },
        //                 { value: "grape", label: "Grape" },
        //                 { value: "watermelon", label: "Watermelon" },
        //                 { value: "pineapple", label: "Pineapple" },
        //                 { value: "mango", label: "Mango" },
        //                 { value: "kiwi", label: "Kiwi" },
        //                 { value: "peach", label: "Peach" },
        //             ],
        //             onChange: [
        //                 {
        //                     event: "updatechild",
        //                     fieldsUpdate: [
        //                         {
        //                             name: "filervalue",
        //                             feildnkeys: [
        //                                 {
        //                                     name: "options",
        //                                     value: [
        //                                         { value: "apple", label: "Apple" },
        //                                         { value: "banana", label: "Banana" },
        //                                         { value: "orange", label: "Orange" },
        //                                         { value: "strawberry", label: "Strawberry" },
        //                                         { value: "grape", label: "Grape" },
        //                                         { value: "watermelon", label: "Watermelon" },
        //                                         { value: "pineapple", label: "Pineapple" },
        //                                         { value: "mango", label: "Mango" },
        //                                         { value: "kiwi", label: "Kiwi" },
        //                                         { value: "peach", label: "Peach" },
        //                                     ],
        //                                     checkcondition: "directaddvalue",
        //                                     backendcall: false,
        //                                 },
        //                             ],
        //                         },
        //                     ],
        //                 },
        //             ],
        //             formgrid: "none",
        //             displayOrder: 1,
        //         },
        //         {
        //             tag: "dummy",
        //             formgrid: "none",
        //             mode: "super-edit",
        //             displayOrder: 1,
        //             classvalue: {
        //                 container: "col-span-9 h-12 mb-2",
        //             },
        //         },
        //         {
        //             tag: "dummy",
        //             formgrid: "none",
        //             mode: "super-edit",
        //             displayOrder: 1,
        //             classvalue: {
        //                 container: "col-span-3 h-12 mb-2",
        //             },
        //         },
        //         {
        //             type: "text",

        //             tag: "multi-select",
        //             label: "Filter The List",
        //             name: "filervalue",
        //             placeholder: "",
        //             value: [],
        //             classvalue: {
        //                 container: "col-span-6 mb-0",
        //                 label: "text-gray-600",
        //                 field: "p-1",
        //             },
        //             mode: "all-allow",
        //             children: [],
        //             required: true,
        //             icon: "",
        //             options: [],
        //             formgrid: "none",
        //             displayOrder: 1,
        //         },
        //         {
        //             tag: "dummy",
        //             formgrid: "none",
        //             mode: "super-edit",
        //             displayOrder: 1,
        //             classvalue: {
        //                 container: "col-span-3 h-12 mb-2",
        //             },
        //         },
        //         {
        //             tag: "dummy",
        //             formgrid: "none",
        //             mode: "super-edit",
        //             displayOrder: 1,
        //             classvalue: {
        //                 container: "col-span-6 mb-2",
        //             },
        //         },
        //         {
        //             type: "button",
        //             tag: "button",
        //             label: "Back",
        //             classvalue: {
        //                 container: "col-span-3 mb-2",
        //                 label: "text-gray-600",
        //                 button: "bg-red-500 text-white",
        //             },
        //             children: ["progress-basic"],
        //             onChange: [
        //                 {
        //                     event: "updatechild",
        //                     fieldsUpdate: [
        //                         {
        //                             name: "progress-basic",
        //                             feildnkeys: [
        //                                 {
        //                                     name: "activeTab",
        //                                     value: "Select Report",
        //                                     checkcondition: "directaddvalue",
        //                                     backendcall: false,
        //                                 },
        //                             ],
        //                         },
        //                     ],
        //                 },
        //             ],
        //             mode: "super-edit",
        //             icon: "XCircle",
        //             formgrid: "none",
        //             displayOrder: 1,
        //         },
        //         {
        //             type: "button",
        //             tag: "button",
        //             label: "Save & Next",
        //             classvalue: {
        //                 container: "col-span-3 mb-2 ",
        //                 label: "text-gray-600",
        //                 button: "bg-[#2563eb] text-white",
        //             },

        //             children: ["progress-basic"],
        //             requiredfields: ["selectreport", "filervalue"],
        //             functions: [
        //                 {
        //                     function: "validateRequiredFields",
        //                     fieldsUpdate: [
        //                         {
        //                             name: "progress-basic",
        //                             feildnkeys: [
        //                                 {
        //                                     name: "activeTab",
        //                                     value: "none",
        //                                     checkcondition: "switch",
        //                                     switch: [
        //                                         {
        //                                             case: "noerror",
        //                                             value: "Date Selection"
        //                                         }
        //                                     ],
        //                                     backendcall: false,
        //                                 },
        //                                 {
        //                                     name: "options",
        //                                     checkcondition: "switch",
        //                                     switch: [
        //                                         {
        //                                             case: "noerror",
        //                                             value: [
        //                                                 {
        //                                                     label: "Select Report", completed: true, value: "Select Report", status: "firststate"
        //                                                 },
        //                                                 {
        //                                                     label: "Filter", completed: true, value: "Filter", status: "completed",
        //                                                     children: ["progress-basic"],
        //                                                     requiredfields: ["selectreport"],
        //                                                     functions: [
        //                                                         {
        //                                                             function: "validateRequiredFields",
        //                                                             fieldsUpdate: [
        //                                                                 {
        //                                                                     name: "progress-basic",
        //                                                                     feildnkeys: [
        //                                                                         {
        //                                                                             name: "activeTab",
        //                                                                             value: "none",
        //                                                                             checkcondition: "switch",
        //                                                                             switch: [
        //                                                                                 {
        //                                                                                     case: "noerror",
        //                                                                                     value: "Basic Filter"
        //                                                                                 }
        //                                                                             ],
        //                                                                             backendcall: false,
        //                                                                         },
        //                                                                     ],
        //                                                                 },
        //                                                             ],
        //                                                         },
        //                                                     ],
        //                                                 },
        //                                                 {
        //                                                     label: "Date Selection", completed: false, value: "Date Selection",
        //                                                     status: "working",
        //                                                     children: ["progress-basic"],
        //                                                     requiredfields: ["selectreport", "organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectfilterationkey", "filervalue", "queryfilter"],
        //                                                     functions: [
        //                                                         {
        //                                                             function: "validateRequiredFields",
        //                                                             fieldsUpdate: [
        //                                                                 {
        //                                                                     name: "progress-basic",
        //                                                                     feildnkeys: [
        //                                                                         {
        //                                                                             name: "activeTab",
        //                                                                             value: "none",
        //                                                                             checkcondition: "switch",
        //                                                                             switch: [
        //                                                                                 {
        //                                                                                     case: "noerror",
        //                                                                                     value: "Date Selection"
        //                                                                                 }
        //                                                                             ],
        //                                                                             backendcall: false,
        //                                                                         },
        //                                                                     ],
        //                                                                 },
        //                                                             ],
        //                                                         },
        //                                                     ],
        //                                                 },
        //                                                 {
        //                                                     label: "Preview", completed: false, value: "Preview", status: "notstarted",
        //                                                     children: ["progress-basic", "emp-select"],
        //                                                     requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "selectfilterationkey", "filervalue", "queryfilter"],
        //                                                     functions: [
        //                                                         {
        //                                                             function: "validateRequiredFields",
        //                                                             fieldsUpdate: [
        //                                                                 {
        //                                                                     name: "progress-basic",
        //                                                                     feildnkeys: [
        //                                                                         {
        //                                                                             name: "activeTab",
        //                                                                             value: "none",
        //                                                                             checkcondition: "switch",
        //                                                                             switch: [
        //                                                                                 {
        //                                                                                     case: "noerror",
        //                                                                                     value: "Report Preview"
        //                                                                                 }
        //                                                                             ],
        //                                                                             backendcall: false,
        //                                                                         },
        //                                                                     ],
        //                                                                 },
        //                                                             ],
        //                                                         },
        //                                                     ],
        //                                                 },
        //                                                 {
        //                                                     label: "Report Status", completed: false, value: "Report Status", status: "notstarted",
        //                                                     children: ["progress-basic"],
        //                                                     requiredfields: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary", "selectdate", "weekstartdate", "weekenddate", "monthstartdate", "monthenddate", "yearstartdate", "yearenddate", "complexstartdate", "complexenddate", "start-report-generate", "selectfilterationkey", "filervalue", "queryfilter"],
        //                                                     functions: [
        //                                                         {
        //                                                             function: "validateRequiredFields",
        //                                                             fieldsUpdate: [
        //                                                                 {
        //                                                                     name: "progress-basic",
        //                                                                     feildnkeys: [
        //                                                                         {
        //                                                                             name: "activeTab",
        //                                                                             value: "none",
        //                                                                             checkcondition: "switch",
        //                                                                             switch: [
        //                                                                                 {
        //                                                                                     case: "noerror",
        //                                                                                     value: "Report Status"
        //                                                                                 }
        //                                                                             ],
        //                                                                             backendcall: false,
        //                                                                         },
        //                                                                     ],
        //                                                                 },
        //                                                             ],
        //                                                         },
        //                                                     ],
        //                                                 },
        //                                             ],
        //                                         }
        //                                     ],
        //                                     backendcall: false,
        //                                 },
        //                             ],
        //                         },
        //                         {
        //                             name: "preview-organization",
        //                             feildnkeys: [
        //                                 {
        //                                     name: "mode",
        //                                     value: "none",
        //                                     checkcondition: "switch",
        //                                     switch: [
        //                                         {
        //                                             case: "noerror",
        //                                             value: "hidden"
        //                                         }
        //                                     ],
        //                                     backendcall: false,
        //                                 },
        //                             ],
        //                         },
        //                         {
        //                             name: "preview-location",
        //                             feildnkeys: [
        //                                 {
        //                                     name: "mode",
        //                                     value: "none",
        //                                     checkcondition: "switch",
        //                                     switch: [
        //                                         {
        //                                             case: "noerror",
        //                                             value: "hidden"
        //                                         }
        //                                     ],
        //                                     backendcall: false,
        //                                 },
        //                             ],
        //                         },
        //                         {
        //                             name: "preview-subsidiary",
        //                             feildnkeys: [
        //                                 {
        //                                     name: "mode",
        //                                     value: "none",
        //                                     checkcondition: "switch",
        //                                     switch: [
        //                                         {
        //                                             case: "noerror",
        //                                             value: "hidden"
        //                                         }
        //                                     ],
        //                                     backendcall: false,
        //                                 },
        //                             ],
        //                         },
        //                         {
        //                             name: "preview-division",
        //                             feildnkeys: [
        //                                 {
        //                                     name: "mode",
        //                                     value: "none",
        //                                     checkcondition: "switch",
        //                                     switch: [
        //                                         {
        //                                             case: "noerror",
        //                                             value: "hidden"
        //                                         }
        //                                     ],
        //                                     backendcall: false,
        //                                 },
        //                             ],
        //                         },
        //                         {
        //                             name: "preview-department",
        //                             feildnkeys: [
        //                                 {
        //                                     name: "mode",
        //                                     value: "none",
        //                                     checkcondition: "switch",
        //                                     switch: [
        //                                         {
        //                                             case: "noerror",
        //                                             value: "hidden"
        //                                         }
        //                                     ],
        //                                     backendcall: false,
        //                                 },
        //                             ],
        //                         },
        //                         {
        //                             name: "preview-subdepartment",
        //                             feildnkeys: [
        //                                 {
        //                                     name: "mode",
        //                                     value: "none",
        //                                     checkcondition: "switch",
        //                                     switch: [
        //                                         {
        //                                             case: "noerror",
        //                                             value: "hidden"
        //                                         }
        //                                     ],
        //                                     backendcall: false,
        //                                 },
        //                             ],
        //                         },
        //                         {
        //                             name: "preview-section",
        //                             feildnkeys: [
        //                                 {
        //                                     name: "mode",
        //                                     value: "none",
        //                                     checkcondition: "switch",
        //                                     switch: [
        //                                         {
        //                                             case: "noerror",
        //                                             value: "hidden"
        //                                         }
        //                                     ],
        //                                     backendcall: false,
        //                                 },
        //                             ],
        //                         },
        //                         {
        //                             name: "preview-queryfilter",
        //                             feildnkeys: [
        //                                 {
        //                                     name: "mode",
        //                                     value: "none",
        //                                     checkcondition: "switch",
        //                                     switch: [
        //                                         {
        //                                             case: "noerror",
        //                                             value: "hidden"
        //                                         }
        //                                     ],
        //                                     backendcall: false,
        //                                 },
        //                             ],
        //                         },
        //                     ],
        //                 },
        //                 {
        //                     function: "localStorage",
        //                     storageName: "basicfilter",
        //                     storageType: "local",
        //                     storageValue: ["organization", "location", "division", "department", "subdepartment", "section", "subsidiary"],
        //                 }
        //             ],
        //             mode: "super-edit",
        //             icon: "Save",
        //             formgrid: "none",
        //             displayOrder: 1,
        //         },
        //     ],
        // },
        // {
        //     formgrid: 2,
        //     title: "Filter The Data",
        //     classvalue: "col-span-12 mb-6 rounded-md ",
        //     validationRules: {
        //         required: ["logoupload"],
        //     },
        //     component: {
        //         container: "col-span-12 pt-8 bg-gray-100  border-r  ",
        //         title: {
        //             container: "bg-gray-100 p-2 bg-gray-100 rounded-md mb-6 pb-6",
        //             heading: "text-2xl ",
        //             description: "text-sm",
        //         },
        //     },
        //     tabs: ["Query Filter"],
        //     fields: [
        //         {
        //             tag: "dummy",
        //             formgrid: "none",
        //             mode: "super-edit",
        //             displayOrder: 1,
        //             classvalue: {
        //                 container: "col-span-3 mb-2",
        //             },
        //         },
        //         {
        //             type: "text",
        //             tag: "textarea",
        //             label: "Write Query",
        //             name: "queryfilter",
        //             placeholder: "",
        //             value: [],
        //             classvalue: {
        //                 container: "col-span-6 mb-0",
        //                 label: "text-gray-600",
        //                 field: "p-1",
        //             },
        //             mode: "all-allow",
        //             children: [],
        //             required: true,
        //             icon: "",
        //             formgrid: "none",
        //             displayOrder: 1,
        //         },
        //         {
        //             tag: "dummy",
        //             formgrid: "none",
        //             mode: "super-edit",
        //             displayOrder: 1,
        //             classvalue: {
        //                 container: "col-span-3 h-12 mb-2",
        //             },
        //         },
        //         {
        //             tag: "dummy",
        //             formgrid: "none",
        //             mode: "super-edit",
        //             displayOrder: 1,
        //             classvalue: {
        //                 container: "col-span-6 mb-2",
        //             },
        //         },
        //         {
        //             type: "button",
        //             tag: "button",
        //             label: "Back",
        //             classvalue: {
        //                 container: "col-span-3 mb-2 mt-12",
        //                 label: "text-gray-600",
        //                 button: "bg-red-500 text-white",
        //             },
        //             children: ["progress-basic"],
        //             onChange: [
        //                 {
        //                     event: "updatechild",
        //                     fieldsUpdate: [
        //                         {
        //                             name: "progress-basic",
        //                             feildnkeys: [
        //                                 {
        //                                     name: "activeTab",
        //                                     value: "Select Report",
        //                                     checkcondition: "directaddvalue",
        //                                     backendcall: false,
        //                                 },
        //                             ],
        //                         },
        //                     ],
        //                 },
        //             ],
        //             mode: "super-edit",
        //             icon: "XCircle",
        //             formgrid: "none",
        //             displayOrder: 1,
        //         },
        //         {
        //             type: "button",
        //             tag: "button",
        //             label: "Next",
        //             classvalue: {
        //                 container: "col-span-3 mb-2 mt-12",
        //                 label: "text-gray-600",
        //                 button: "bg-[#2563eb] text-white",
        //             },
        //             children: ["progress-basic"],
        //             requiredfields: ["selectreport", "queryfilter"],
        //             functions: [
        //                 {
        //                     function: "localStorage",
        //                     storageName: "reportDiscription",
        //                     storageType: "local",
        //                     storageKey: "reportAreaSelected",
        //                     storageValue: ["organization", "subsidiaries","location","divisions","departments","subDepartments","sections"],
        //                     postStructure: {
        //                         reportName: "",
        //                     }
        //                 },
        //                 {
        //                     function: "messenger-tonext-component",
        //                     fieldsUpdate: [
        //                         {
        //                             name: "progressbar",
        //                             feildnkeys: [
        //                                 {
        //                                     name: "activeTab",
        //                                     checkcondition: "switch",
        //                                     switch: [
        //                                         {
        //                                             case: "noerror",
        //                                             value: "Basic Information",
        //                                         },
        //                                     ],
        //                                     backendcall: false,
        //                                 },
        //                             ],
        //                         },
        //                     ],
        //                 }
        //             ],
        //             mode: "super-edit",
        //             icon: "Save",
        //             formgrid: "none",
        //             displayOrder: 1,
        //         },
        //     ],
        // },
    ],
};

export const periodFilterFormStructure = {
    component: "form",
    mode: "view",
    title: "",
    description:
        "",
    classvalue: " grid-cols-12 gap-0 pt-4 mt-0 px-4",
    baseurl: "api/sectiondetails",
    subformstructure: [
        {
            formgrid: 1,
            title: "Date Range",
            name: "progress-basic",
            classvalue: "col-span-12 border-b border-gray-200 mb-0 pb-4 px-0 rounded-md ",
            component: {
                container: "col-span-12 pt-8  border-r  ",
                title: {
                    container: "p-2 pl-0 rounded-md mb-0 pb-0",
                    heading: "",
                    description: "text-sm",
                },
            },
            validationRules: {
                required: ["logoupload"],
            },
            tabs: ["Today"],
            fields: [
                {
                    type: "date",
                    tag: "select",
                    label: "Select Date",
                    name: "period",
                    placeholder: "",
                    value: "custom",
                    classvalue: {
                        container: "col-span-4 mb-0",
                        label: "text-gray-600",
                        field: "p-1",
                    },
                    options: [
                        { label: "Today", value: "today" },
                        { label: "This Week", value: "this_week" },
                        { label: "This Month", value: "this_month" },
                        { label: "This Quarter", value: "this_quarter" },
                        { label: "This Year", value: "this_year" },
                        { label: "Custom", value: "custom" }
                    ],
                    mode: "all-allow",
                    children: [],
                    required: true,
                    icon: "",
                    formgrid: "none",
                    displayOrder: 1,
                },
                {
                    type: "date",
                    tag: "input",
                    label: "from Date",
                    name: "fromDate",
                    placeholder: "",
                    functions: [
                        {
                            function: "before-current-date",
                        }
                    ],
                    value: [],
                    classvalue: {
                        container: "col-span-4 mb-0",
                        label: "text-gray-600",
                        field: "p-1",
                    },
                    mode: "all-allow",
                    children: [],
                    required: true,
                    icon: "",
                    formgrid: "none",
                    displayOrder: 1,
                },
                {
                    type: "date",
                    tag: "input",
                    label: "to Date",
                    name: "toDate",
                    placeholder: "",
                    value: [],
                    functions: [
                        {
                            function: "before-current-date",
                        }
                    ],
                    classvalue: {
                        container: "col-span-4 mb-0",
                        label: "text-gray-600",
                        field: "p-1",
                    },
                    mode: "all-allow",
                    children: [],
                    required: true,
                    icon: "",
                    formgrid: "none",
                    displayOrder: 1,
                },
            ],
        },
        {
            formgrid: 1,
            title: "Report Information",
            name: "progress-basic",
            classvalue: "col-span-12 border-b border-gray-200 mb-0 pb-4 px-0 rounded-md",
            component: {
                container: "pt-4  col-span-12 pt-2  border-r  ",
                title: {
                    container: " p-2 pl-0 rounded-md mb-0 pb-0",
                    heading: "text-2xl ",
                    description: "text-sm",
                },
            },
            validationRules: {
                required: ["logoupload"],
            },
            tabs: ["Today"],
            fields: [
                // {
                //     type: "date",
                //     tag: "single-select-filter",
                //     label: "Workflow Name",
                //     name: "workflowName",
                //     placeholder: "",
                //     value: [],
                //     classvalue: {
                //         container: "col-span-4 mb-0",
                //         label: "text-gray-600",
                //         field: "p-1",
                //     },
                //     options: [
                //         { label: "Report", value: "Report" },
                //         { label: "Status", value: "status" },
                //     ],
                //     mode: "all-allow",
                //     children: [],
                //     required: true,
                //     icon: "",
                //     formgrid: "none",
                //     displayOrder: 1,
                // },
                {
                    type: "text",
                    tag: "input",
                    label: "Report Title",
                    name: "reportTitle",
                    placeholder: "",
                    value: [],
                    classvalue: {
                        container: "col-span-6 mb-0",
                        label: "text-gray-600",
                        field: "p-1",
                    },
                    mode: "all-allow",
                    children: [],
                    required: true,
                    icon: "",
                    formgrid: "none",
                    displayOrder: 1,
                },
                {
                    type: "text",
                    tag: "select",
                    label: "Extension",
                    name: "extension",
                    placeholder: "Select Extension",
                    value: [],
                    classvalue: {
                        container: "col-span-6 mb-0",
                        label: "text-gray-600",
                        field: "p-1",
                    },
                    options: [
                        { label: "Pdf", value: "pdf" },
                        { label: "Excel", value: "excel" },
                    ],
                    mode: "all-allow",
                    children: [],
                    required: true,
                    icon: "",
                    formgrid: "none",
                    displayOrder: 1,
                },
            ],
        },
        {
            formgrid: 1,
            title: "",
            name: "progress-basic",
            classvalue: "col-span-12 ",
            component: {
                container: "",
                title: {
                    container: "",
                    heading: "text-2xl ",
                    description: "text-sm",
                },
            },
            validationRules: {
                required: ["logoupload"],
            },
            tabs: ["Today"],
            fields: [
                // {
                //     type: "date",
                //     tag: "single-select-filter",
                //     label: "Workflow Name",
                //     name: "workflowName",
                //     placeholder: "",
                //     value: [],
                //     classvalue: {
                //         container: "col-span-4 mb-0",
                //         label: "text-gray-600",
                //         field: "p-1",
                //     },
                //     options: [
                //         { label: "Report", value: "Report" },
                //         { label: "Status", value: "status" },
                //     ],
                //     mode: "all-allow",
                //     children: [],
                //     required: true,
                //     icon: "",
                //     formgrid: "none",
                //     displayOrder: 1,
                // },
                {
                    tag: "dummy",
                    formgrid: "none",
                    mode: "super-edit",
                    displayOrder: 1,
                    classvalue: {
                        container: "col-span-10 mb-2 mt-4",
                    },
                },
                // {
                //     type: "button",
                //     tag: "button",
                //     label: "Back",
                //     classvalue: {
                //         container: "col-span-2 mb-2 mt-4",
                //         label: "text-gray-600",
                //         button: "bg-red-500 text-white",
                //     },
                //     children: ["progressbar"],
                //     functions: [
                //         {
                //             function: "messenger-tonext-component",
                //             fieldsUpdate: [
                //                 {
                //                     name: "progressbar",
                //                     feildnkeys: [
                //                         {
                //                             name: "activeTab",
                //                             checkcondition: "switch",
                //                             validation:[],
                //                             switch: [
                //                                 {
                //                                     case: "noerror",
                //                                     value: "Employee Filter",
                //                                 },
                //                             ],
                //                             backendcall: false,
                //                         },
                //                     ],
                //                 },
                //             ],
                //         }
                //     ],
                //     mode: "super-edit",
                //     icon: "XCircle",
                //     required: true,
                //     formgrid: "none",
                //     displayOrder: 1,
                // },
                
                {
                    type: "submit",
                    tag: "button",
                    label: "Save and Continue",
                    required: true,
                    classvalue: {
                        container: "col-span-2 mb-2 mt-4",
                        label: "text-gray-600",
                        button: "bg-[#0061ff] text-white",
                    },
                    icon: "Save",
                    children: ["progress-basic", "emp-select"],
                    requiredfields: ["toDate", "fromDate", "period", "reportTitle", "extension"],
                    functions: [
                        {
                            function: "localStorage",
                            storageName: "reportDiscription",
                            storageType: "local",
                            storageKey: "reportAreaSelected",
                            storageValue: ["toDate", "fromDate", "period", "workflowName", "reportTitle", "extension", "subsidiaries", "divisions", "departments", "subDepartments", "sections", "designations", "grades", "reportName"],
                            postStructure: {
                                toDate: "",
                                fromDate: "",
                                period: "",
                                reportTitle: "",
                                extension: "",
                            }
                        },
                        {
                            function: "messenger-tonext-component",
                            validation: ["toDate", "fromDate", "period", "reportTitle", "extension"],
                            fieldsUpdate: [
                                {
                                    name: "progressbar",
                                    feildnkeys: [
                                        {
                                            name: "activeTab",
                                            checkcondition: "switch",
                                            switch: [
                                                {
                                                    case: "noerror",
                                                    value: "Preview",
                                                },
                                            ],
                                            backendcall: false,
                                        },
                                    ],
                                },
                            ],
                        }
                    ],
                    mode: "super-edit",
                    formgrid: "none",
                    displayOrder: 1,
                },
            ],
        },
    ],
};
