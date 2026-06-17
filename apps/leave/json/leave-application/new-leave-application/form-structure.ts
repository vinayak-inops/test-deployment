export const leaveApplicationForm = {
    component: "form",
    mode: "edit",
    title: "Apply Leave",
    name: "leaveapplication",
    description: "Submit and manage your leave requests with detailed duration and dates",
    classvalue: "grid-cols-12",
    baseurl: "api/leaveapplication",
    subformstructure: [
      {
        formgrid: 1,
        title: "Basic Information",
        classvalue: "col-span-12 gap-4 pb-0",
        component: {
          container: "",
          title: {
            container: "mb-2",
            heading: "text-2xl",
            description: "text-sm",
          },
        },
        validationRules: {
          required: [
            "policy_name",
            "organization",
            "effective_from",
            "effective_to",
            "leave_types",
            "leave_code",
            "gender_allowed",
            "marital_status",
            "minimum_service_period",
            "leave_type",
          ],
        },
        fields: [
          {
            type: "date",
            tag: "input",
            label: "From Date*",
            name: "fromDate",
            placeholder: "Select from date",
            classvalue: {
              container: "col-span-3 mb-3",
              label: "text-gray-600",
              field: "p-2",
            },
            required: true,
            fieldGrid: 1,
            displayOrder: 1,
            children:["fromDate"],
            formgrid: "none",
            functions: [
              {
                  function: "storeValue-forlocaluse",
              }
          ],
          },
          {
            type: "date",
            tag: "input",
            label: "To Date*",
            name: "toDate",
            children:["toDate"],
            placeholder: "Select to date",
            classvalue: {
              container: "col-span-3 mb-3",
              label: "text-gray-600",
              field: "p-2",
            },
            requiredfields:[],
            required: true,
            fieldGrid: 1,
            displayOrder: 2,
            formgrid: "none",
            functions: [
              {
                  function: "storeValue-forlocaluse",
              }
            ]
          },
          // {
          //   type: "select",
          //   tag: "select",
          //   label: "From Duration*",
          //   name: "fromDuration",
          //   placeholder: "Select duration",
          //   classvalue: {
          //     container: "col-span-3 mb-3",
          //     label: "text-gray-600",
          //     field: "p-2",
          //   },
          //   options: [
          //     { label: "Full Day", value: "Full-Day" },
          //     { label: "First Half", value: "First-Half" },
          //     { label: "Second Half", value: "Second-Half" },
          //   ],
          //   required: true,
          //   fieldGrid: 1,
          //   displayOrder: 3,
          //   formgrid: "none",
          // },
          // {
          //   type: "select",
          //   tag: "select",
          //   label: "To Duration*",
          //   name: "toDuration",
          //   placeholder: "Select duration",
          //   classvalue: {
          //     container: "col-span-3 mb-3",
          //     label: "text-gray-600",
          //     field: "p-2",
          //   },
          //   options: [
          //     { label: "Full Day", value: "Full-Day" },
          //     { label: "First Half", value: "First-Half" },
          //     { label: "Second Half", value: "Second-Half" },
          //   ],
          //   required: true,
          //   fieldGrid: 1,
          //   displayOrder: 3,
          //   formgrid: "none",
          // },
          {
            type: "textarea",
            tag: "textarea",
            label: "Remarks*",
            name: "remarks",
            placeholder: "Enter remarks",
            classvalue: {
              container: "col-span-12 mb-0  rounded-md",
              label: "text-gray-600 bg-[#f8fafc] p-2",
              field: "p-2 h-52 border border-gray-100",
            },
            required: true,
            fieldGrid: 1,
            displayOrder: 5,
            formgrid: "none",
          },
        ],
      },
    //   {
    //     formgrid: 1,
    //     title: "",
    //     classvalue: "col-span-12 gap-4",
    //     validationRules: {
    //         required: ["logoupload"],
    //     },
        
    //     tabs: ["settings"],
    //     formtype: "table-form",
    //     fields: [
    //         {
    //             type: "table-form",
    //             tag: "table-form",
    //             label: "Talbe Form",
    //             formname: "table-form",
    //             classvalue: {
    //                 container: "col-span-12 mb-2",
    //                 label: "text-gray-600",
    //                 field: "p-1",
    //             },
    //             tabledata: [
    //                 {
    //                     _id: "1",
    //                     date: "",
    //                     leaveCode: "",
    //                     duration: "",
    //                 },
    //                 {
    //                     _id: "2",
    //                     date: "",
    //                     leaveCode: "",
    //                     duration: "",
    //                 },
    //                 {
    //                     _id: "3",
    //                     date: "",
    //                     leaveCode: "",
    //                     duration: "",
    //                 }
    //             ],
    //             funtinality: {
    //                 tabletype: {
    //                     type: "data",
    //                     classvalue: {
    //                         container: "col-span-12 mb-2",
    //                         tableheder: {
    //                             container: "bg-[#f8fafc]",
    //                         },
    //                         label: "text-gray-600",
    //                         field: "p-1",
    //                     },
    //                 },
    //                 columnfunctionality: {
    //                     draggable: {
    //                         status: true,
    //                     },
    //                     handleRenameColumn: {
    //                         status: true,
    //                     },
    //                     slNumber: {
    //                         status: true,
    //                     },
    //                     selectCheck: {
    //                         status: false,
    //                     },
    //                     activeColumn: {
    //                         status: false,
    //                     },
    //                 },
    //                 textfunctionality: {
    //                     expandedCells: {
    //                         status: true,
    //                     },
    //                 },
    //                 filterfunctionality: {
    //                     handleSortAsc: {
    //                         status: false,
    //                     },
    //                     handleSortDesc: {
    //                         status: false,
    //                     },
    //                     search: {
    //                         status: false,
    //                     },
    //                 },
    //                 outsidetablefunctionality: {
    //                     paginationControls: {
    //                         status: false,
    //                         start: "",
    //                         end: "",
    //                     },
    //                     entriesPerPageSelector: {
    //                         status: false,
    //                     },
    //                 },
    //                 buttons: {
    //                     save: {
    //                         label: "Save",
    //                         status: false,
    //                         classvalue: {
    //                             container: "col-span-12 mb-2",
    //                             label: "text-gray-600",
    //                             field: "p-1",
    //                         },
    //                         function: () => {},
    //                     },
    //                     submit: {
    //                         label: "Submit",
    //                         status: false,
    //                         classvalue: {
    //                             container: "col-span-12 mb-2",
    //                             label: "text-gray-600",
    //                             field: "p-1",
    //                         },
    //                         function: () => {},
    //                     },
    //                     addnew: {
    //                         label: "Create Leave Policy",
    //                         status: false,
    //                         classvalue: {
    //                             container: "col-span-12 mb-2",
    //                             label: "text-gray-600",
    //                             field: "p-1",
    //                         },
    //                         function: () => {
    //                             {}
    //                         },
    //                     },
    //                     cancel: {
    //                         label: "Cancel",
    //                         status: false,
    //                         classvalue: {
    //                             container: "col-span-12 mb-2",
    //                             label: "text-gray-600",
    //                             field: "p-1",
    //                         },
    //                         function: () => {},
    //                     },
    //                     actionDelete: {
    //                         label: "Delete",
    //                         status: true,
    //                         classvalue: {
    //                             container: "col-span-12 mb-2",
    //                             label: "text-gray-600",
    //                             field: "p-1",
    //                         },
    //                         function: (id: string) => {},
    //                     },
    //                     actionLink: {
    //                         label: "link",
    //                         status: false,
    //                         classvalue: {
    //                             container: "col-span-12 mb-2",
    //                             label: "text-gray-600",
    //                             field: "p-1",
    //                         },
    //                         function: (item: any) => {
    //                           {};
    //                         },
    //                     },
    //                     actionEdit: {
    //                         label: "Edit",
    //                         status: true,
    //                         classvalue: {
    //                             container: "col-span-12 mb-2",
    //                             label: "text-gray-600",
    //                             field: "p-1",
    //                         },
    //                         function: (id: string) => {
    //                             // Get the updated form JSON
    //                             {}
    //                         },
    //                     },
    //                 },
    //             },
    //             mode: "super-edit",
    //             icon: "",
    //             formgrid: "none",
    //             displayOrder: 1,
    //             columnsname: ["date", "leaveCode", "duration"],
    //         },
    //         {
    //             type: "date",
    //             tag: "input",
    //             label: "Date",
    //             name: "date",
    //             columnsname: "date",
    //             classvalue: {
    //                 container: "mb-2",
    //                 label: "text-gray-600",
    //                 field: "p-1",
    //             },
    //             required: true,
    //             options: [],
    //             mode: "super-edit",
    //             formgrid: "table-form",
    //             displayOrder: 1,
    //         },
    //         {
    //             type: "",
    //             tag: "select",
    //             label: "LeaveCode",
    //             name: "leaveCode",
    //             columnsname: "leaveCode",
    //             classvalue: {
    //                 container: "mb-2",
    //                 label: "text-gray-600",
    //                 field: "p-1",
    //             },
    //             required: true,
    //             options: [
    //                 { label: "Full Day", value: "Full-Day" },
    //                 { label: "First Half", value: "First-Half" },
    //                 { label: "Second Half", value: "Second-Half" },
    //             ],
    //             mode: "super-edit",
    //             formgrid: "table-form",
    //             displayOrder: 2,
    //         },
    //         {
    //             type: "",
    //             tag: "select",
    //             label: "Duration",
    //             name: "duration",
    //             columnsname: "duration",
    //             classvalue: {
    //                 container: "mb-2",
    //                 label: "text-gray-600",
    //                 field: "p-1",
    //             },
    //             options: [
    //                 { label: "Full Day", value: "Full-Day" },
    //                 { label: "First Half", value: "First-Half" },
    //                 { label: "Second Half", value: "Second-Half" },
    //             ],
    //             required: true,
    //             mode: "super-edit",
    //             formgrid: "table-form",
    //             displayOrder: 7,
    //         },
    //     ],
    // },
    //   {
    //     formgrid: 4,
    //     title: "",
    //     classvalue: "col-span-12 gap-4 mt-4",
    //     component: {
    //       container: "",
    //       title: {
    //         container: "mb-2",
    //         heading: "text-2xl",
    //         description: "text-sm",
    //       },
    //     },
    //     validationRules: {
    //       required: [
    //         "policy_name",
    //         "organization",
    //         "effective_from",
    //         "effective_to",
    //         "leave_types",
    //         "leave_code",
    //         "gender_allowed",
    //         "marital_status",
    //         "minimum_service_period",
    //         "leave_type",
    //       ],
    //     },
    //     fields: [
    //       {
    //         tag: "dummy",
    //         formgrid: "none",
    //         mode: "super-edit",
    //         displayOrder: 1,
    //         classvalue: {
    //           container: "col-span-6 h-12 mb-2",
    //         },
    //       },
    //       {
    //         type: "onSubmit",
    //         tag: "button",
    //         label: "Cancel",
    //         name: "cancelLeave",
    //         placeholder: "",
    //         value: [],
    //         classvalue: {
    //           container: "col-span-3 mb-0 ",
    //           label: "text-gray-600",
    //           button: "bg-red-600 text-white",
    //         },
    //         mode: "all-allow",
    //         required: true,
    //         icon: "",
    //         children: ["selectLeaveArea"],
    //         requiredfields: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus"],
    //         functions: [
    //           {
    //             function: "localStorage",
    //             storageName: "policyDiscription",
    //             storageType: "local",
    //             storageKey: "policyAreaSelected",
    //             storageValue: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus","minimumServicePeriodRequired","minimumDaysPerApplication","maximumApplicationAllowed-type","maximumApplicationAllowed-count","maximumDaysPerApplicationAllowed-type","maximumDaysPerApplicationAllowed-count"],
    //             postStructure: {
    //               leaveCode:"",
    //               leaveTitle:"",  
    //               effectiveFrom:"",
    //               genderAllowed:"",
    //               maritalStatus:"",
    //               minimumServicePeriodRequired:"",
    //               minimumDaysPerApplication:"",
    //               maximumApplicationAllowed:{
    //                 type:"",
    //                 count:""
    //               },
    //               maximumDaysPerApplicationAllowed:{
    //                 type:"",
    //                 count:""
    //               }
    //             }
    //           },
    //           {
    //             function: "messenger-tonext-component",
    //             fieldsUpdate: [
    //               {
    //                   name: "progressbar",
    //                   feildnkeys: [
    //                     {
    //                       name: "activeTab",
    //                       checkcondition: "switch",
    //                       switch: [
    //                         {
    //                           case: "noerror",
    //                           value: "Add Leave Area",
    //                         },
    //                       ],
    //                       backendcall: false,
    //                     },
    //                   ],
    //               },
    //           ],
    //           }
    //         ],
    //         options: [],
    //         formgrid: "none",
    //         displayOrder: 1,
    //       },
    //       {
    //         type: "onSubmit",
    //         tag: "button",
    //         label: "Submit Leave Application",
    //         name: "submitLeave",
    //         placeholder: "",
    //         value: [],
    //         classvalue: {
    //           container: "col-span-3 mb-0 ",
    //           label: "text-gray-600",
    //           button: "bg-[#2563eb] text-white",
    //         },
    //         mode: "all-allow",
    //         required: true,
    //         icon: "",
    //         children: ["selectLeaveArea"],
    //         requiredfields: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus"],
    //         functions: [
    //           {
    //             function: "localStorage",
    //             storageName: "policyDiscription",
    //             storageType: "local",
    //             storageKey: "policyAreaSelected",
    //             storageValue: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus","minimumServicePeriodRequired","minimumDaysPerApplication","maximumApplicationAllowed-type","maximumApplicationAllowed-count","maximumDaysPerApplicationAllowed-type","maximumDaysPerApplicationAllowed-count"],
    //             postStructure: {
    //               leaveCode:"",
    //               leaveTitle:"",  
    //               effectiveFrom:"",
    //               genderAllowed:"",
    //               maritalStatus:"",
    //               minimumServicePeriodRequired:"",
    //               minimumDaysPerApplication:"",
    //               maximumApplicationAllowed:{
    //                 type:"",
    //                 count:""
    //               },
    //               maximumDaysPerApplicationAllowed:{
    //                 type:"",
    //                 count:""
    //               }
    //             }
    //           },
    //           {
    //             function: "messenger-tonext-component",
    //             fieldsUpdate: [
    //               {
    //                   name: "progressbar",
    //                   feildnkeys: [
    //                     {
    //                       name: "activeTab",
    //                       checkcondition: "switch",
    //                       switch: [
    //                         {
    //                           case: "noerror",
    //                           value: "Add Leave Area",
    //                         },
    //                       ],
    //                       backendcall: false,
    //                     },
    //                   ],
    //               },
    //           ],
    //           }
    //         ],
    //         options: [],
    //         formgrid: "none",
    //         displayOrder: 1,
    //       },
    //     ],
    //   },
    ],
  };

  export const leaveApplicationSubmitForm = {
    component: "form",
    mode: "edit",
    title: "",
    name: "leaveapplication",
    description: "",
    classvalue: "grid-cols-12",
    baseurl: "api/leaveapplication",
    subformstructure: [
      {
        formgrid: 4,
        title: "",
        classvalue: "col-span-12 gap-4 mt-4",
        component: {
          container: "",
          title: {
            container: "mb-2",
            heading: "text-2xl",
            description: "text-sm",
          },
        },
        validationRules: {
          required: [
            "policy_name",
            "organization",
            "effective_from",
            "effective_to",
            "leave_types",
            "leave_code",
            "gender_allowed",
            "marital_status",
            "minimum_service_period",
            "leave_type",
          ],
        },
        fields: [
          {
            tag: "dummy",
            formgrid: "none",
            mode: "super-edit",
            displayOrder: 1,
            classvalue: {
              container: "col-span-6 h-12 mb-2",
            },
          },
          {
            type: "onSubmit",
            tag: "button",
            label: "Cancel",
            name: "cancelLeave",
            placeholder: "",
            value: [],
            classvalue: {
              container: "col-span-3 mb-0 ",
              label: "text-gray-600",
              button: "bg-red-600 text-white",
            },
            mode: "all-allow",
            required: true,
            icon: "",
            children: ["selectLeaveArea"],
            requiredfields: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus"],
            functions: [
              {
                function: "localStorage",
                storageName: "policyDiscription",
                storageType: "local",
                storageKey: "policyAreaSelected",
                storageValue: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus","minimumServicePeriodRequired","minimumDaysPerApplication","maximumApplicationAllowed-type","maximumApplicationAllowed-count","maximumDaysPerApplicationAllowed-type","maximumDaysPerApplicationAllowed-count"],
                postStructure: {
                  leaveCode:"",
                  leaveTitle:"",  
                  effectiveFrom:"",
                  genderAllowed:"",
                  maritalStatus:"",
                  minimumServicePeriodRequired:"",
                  minimumDaysPerApplication:"",
                  maximumApplicationAllowed:{
                    type:"",
                    count:""
                  },
                  maximumDaysPerApplicationAllowed:{
                    type:"",
                    count:""
                  }
                }
              },
              {
                function: "messenger-tonext-component",
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
                              value: "Add Leave Area",
                            },
                          ],
                          backendcall: false,
                        },
                      ],
                  },
              ],
              }
            ],
            options: [],
            formgrid: "none",
            displayOrder: 1,
          },
          {
            type: "onSubmit",
            tag: "button",
            label: "Save Leave Application",
            name: "submitLeave",
            placeholder: "",
            value: [],
            classvalue: {
              container: "col-span-3 mb-0 ",
              label: "text-gray-600",
              button: "bg-[#2563eb] text-white",
            },
            mode: "all-allow",
            required: true,
            icon: "",
            children: ["selectLeaveArea"],
            requiredfields: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus"],
            functions: [
              {
                function: "localStorage",
                storageName: "policyDiscription",
                storageType: "local",
                storageKey: "policyAreaSelected",
                storageValue: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus","minimumServicePeriodRequired","minimumDaysPerApplication","maximumApplicationAllowed-type","maximumApplicationAllowed-count","maximumDaysPerApplicationAllowed-type","maximumDaysPerApplicationAllowed-count"],
                postStructure: {
                  leaveCode:"",
                  leaveTitle:"",  
                  effectiveFrom:"",
                  genderAllowed:"",
                  maritalStatus:"",
                  minimumServicePeriodRequired:"",
                  minimumDaysPerApplication:"",
                  maximumApplicationAllowed:{
                    type:"",
                    count:""
                  },
                  maximumDaysPerApplicationAllowed:{
                    type:"",
                    count:""
                  }
                }
              },
              {
                function: "messenger-tonext-component",
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
                              value: "Add Leave Area",
                            },
                          ],
                          backendcall: false,
                        },
                      ],
                  },
              ],
              }
            ],
            options: [],
            formgrid: "none",
            displayOrder: 1,
          },
        ],
      },
    ],
  };



