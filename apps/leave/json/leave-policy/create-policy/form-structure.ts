import { SubFormStructureConfig } from "./../../../../../packages/ui/src/type/dynamic-form/sub-form-types";
export const leavePolicyForm = {
  component: "form",
  mode: "edit",
  title: "Create Leave Policy",
  name: "leavepolicy",
  description: "Create a new leave policy for your organization",
  classvalue: "grid-cols-12",
  baseurl: "api/leavepolicy",
  subformstructure: [
    {
      formgrid: 1,
      title: "Basic Information",
      classvalue: "col-span-12 gap-4 pb-4",
      component: {
        container: "",
        title: {
          container: "mb-2 bg-gray-100 p-2 rounded-md",
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
          type: "select",
          tag: "select",
          label: "Leave Code*",
          name: "leaveCode",
          placeholder: "Select leave code",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 1,
          formgrid: "none",
          options: [
            { label: "Annual Leave", value: "AL" },
            { label: "Sick Leave", value: "SL" },
            { label: "Casual Leave", value: "CL" },
            { label: "Maternity Leave", value: "ML" },
            { label: "Paternity Leave", value: "PL" },
          ],
        },
        {
          type: "textinput",
          tag: "input",
          label: "Leave Policy Title*",
          name: "leaveTitle",
          placeholder: "Enter policy name",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 2,
          formgrid: "none",
        },
        {
          type: "date",
          tag: "input",
          label: "Effective From*",
          name: "effectiveFrom",
          placeholder: "Select effective date",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 3,
          formgrid: "none",
        },
      ],
    },
    {
      formgrid: 2,
      title: "Applicability",
      classvalue: "col-span-12 gap-4 pb-4",
      component: {
        container: "",
        title: {
          container: "mb-2 bg-gray-100 p-2 rounded-md",
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
          type: "select",
          tag: "select",
          label: "Gender Allowed*",
          name: "genderAllowed",
          placeholder: "Select gender allowed",
          classvalue: {
            container: "col-span-4  mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 4,
          formgrid: "none",
          options: [
            { label: "All", value: "All" },
            { label: "Male", value: "Male" },
            { label: "Female", value: "Female" },
          ],
        },
        {
          type: "select",
          tag: "select",
          label: "Marital Status*",
          name: "maritalStatus",
          placeholder: "Select marital status",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 5,
          formgrid: "none",
          options: [
            { label: "Married", value: "married" },
            { label: "Un-married", value: "un-married" },
            { label: "Divorced", value: "divorced" },
            { label: "Single", value: "single" },
          ],
        },
        {
          type: "number",
          tag: "input",
          label: "Minimum Service Period (Months)*",
          name: "minimumServicePeriodRequired",
          placeholder: "Enter minimum service period",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 6,
          formgrid: "none",
        },
        {
          type: "number",
          tag: "input",
          label: "Maximum Days Per Application*",
          name: "minimumDaysPerApplication",
          placeholder: "Enter maximum days",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 10,
          formgrid: "none",
        },
        {
          type: "select",
          tag: "select",
          label: "Maximum Application Allowed*",
          name: "maximumApplicationAllowed-type",
          placeholder: "Select maximum application allowed",
          classvalue: {
            container: "col-span-4",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 10,
          formgrid: "none",
          options: [
            { label: "Monthly", value: "monthly" },
            { label: "Yearly", value: "yearly" },
            { label: "Half Yearly", value: "half-yearly" },
            { label: "Quarterly", value: "quarterly" },
            { label: "Half Monthly", value: "half-monthly" },
          ],
        },
        {
          type: "number",
          tag: "input",
          label: "Maximum Application Allowed*",
          name: "maximumApplicationAllowed-count",
          placeholder: "Enter maximum application allowed",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 12,
          formgrid: "none",
        },

        {
          type: "select",
          tag: "select",
          label: "Maximum Days Per Application Allowed*",
          name: "maximumApplicationAllowed-type",
          placeholder: "Select maximum days per application allowed",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 13,
          formgrid: "none",
          options: [
            { label: "Monthly", value: "monthly" },
            { label: "Yearly", value: "yearly" },
            { label: "Half Yearly", value: "half-yearly" },
            { label: "Quarterly", value: "quarterly" },
            { label: "Half Monthly", value: "half-monthly" },
          ],
        },
        {
          type: "number",
          tag: "input",
          label: "Maximum Days Per Application Allowed*",
          name: "maximumDaysPerApplicationAllowed-count",
          placeholder: "Enter maximum days per application allowed",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 14,
          formgrid: "none",
        },
      ],
    },
    {
      formgrid: 3,
      title: "Setting",
      classvalue: "col-span-12 gap-4 pb-4 mt-4",
      component: {
        container: "",
        title: {
          container: "mb-2 bg-gray-100 p-2 rounded-md",
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
          type: "checkbox",
          tag: "checkbox",
          label: "Half Day Allowed",
          name: "half_day_allowed",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 1,
          formgrid: "none",
        },

        {
          type: "checkbox",
          tag: "checkbox",
          label: "Can Start Or End On Holiday",
          name: "canStartOrEndOnHoliday",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: false,
          fieldGrid: 1,
          displayOrder: 2,
          formgrid: "none",
        },
        {
          type: "checkbox",
          tag: "checkbox",
          label: "Can Start Or End On Week Off",
          name: "canStartOrEndOnWeekOff",
          classvalue: {
            container: "col-span-4 mb-2",
            label: "text-gray-600",
            field: "p-2",
          },
          required: false,
          fieldGrid: 1,
          displayOrder: 3,
          formgrid: "none",
        },
        {
          type: "checkbox",
          tag: "checkbox",
          label: "Allowed In Notice Period",
          name: "allowedInNoticePeriod",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: false,
          fieldGrid: 1,
          displayOrder: 4,
          formgrid: "none",
        },
        {
          type: "checkbox",
          tag: "checkbox",
          label: "Sandwich Holiday As Leave",
          name: "sandwichHolidayAsLeave-countAsLeave",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: false,
          fieldGrid: 1,
          displayOrder: 5,
          formgrid: "none",
        },
        {
          type: "number",
          tag: "input",
          label: "Sandwich Holiday As Leave*",
          name: "sandwichHolidayAsLeave-minimumLeaveDays",
          placeholder: "Enter sandwich holiday as leave",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 6,
          formgrid: "none",
        },
        {
          type: "checkbox",
          tag: "checkbox",
          label: "Sandwich Week Off As Leave",
          name: "sandwichWeekOffAsLeave-countAsLeave",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: false,
          fieldGrid: 1,
          displayOrder: 7,
          formgrid: "none",
        },
        {
          type: "number",
          tag: "input",
          label: "Sandwich Week Off As Leave*",
          name: "sandwichWeekOffAsLeave-minimumLeaveDays",
          placeholder: "Enter sandwich week off as leave",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 8,
          formgrid: "none",
        },
        {
          type: "number",
          tag: "input",
          label: "Pre Application Apply Before Days*",
          name: "preApplication-applyBeforeDays",
          placeholder: "Enter pre application apply before days",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 9,
          formgrid: "none",
        },
        {
          type: "number",
          tag: "input",
          label: "Pre Application Apply Before Days*",
          name: "preApplication-applyBeforeDays",
          placeholder: "Enter pre application apply before days",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 10,
          formgrid: "none",
        },
        {
          type: "number",
          tag: "input",
          label: "Maximum Back Days Application Allowed*",
          name: "maximumBackDaysApplicationAllowed",
          placeholder: "Enter maximum back days application allowed",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 11,
          formgrid: "none",
        },
        {
          type: "number",
          tag: "input",
          label: "Maximum Back Days Application Allowed*",
          name: "maximumFutureDaysApplicationAllowed",
          placeholder: "Enter maximum back days application allowed",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 12,
          formgrid: "none",
        },
        {
          type: "number",
          tag: "input",
          label: "Require Docs If Leave Days Exceeds*",
          name: "requireDocsIfLeaveDaysExceeds",
          placeholder: "Enter require docs if leave days exceeds",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 13,
          formgrid: "none",
        },
        {
          type: "checkbox",
          tag: "checkbox",
          label: "Delegate Applicable",
          name: "delegateApplicable",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: false,
          fieldGrid: 1,
          displayOrder: 14,
          formgrid: "none",
        },
      ],
    },
    {
      formgrid: 4,
      title: "Approval Settings",
      classvalue: "col-span-12 gap-4 mt-4",
      component: {
        container: "",
        title: {
          container: "mb-2 bg-gray-100 p-2 rounded-md",
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
          type: "checkbox",
          tag: "checkbox",
          label: "Alert Manager After Approval",
          name: "alertManagerAfterApproval",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: false,
          fieldGrid: 1,
          displayOrder: 5,
          formgrid: "none",
        },
        {
          type: "number",
          tag: "input",
          label: "Alert Manager Days Before Leave Start*",
          name: "alertManagerDaysBeforeLeaveStart",
          placeholder: "Enter alert manager days before leave start",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 6,
          formgrid: "none",
        },
        {
          type: "number",
          tag: "input",
          label: "Reminder Frequency To Approver*",
          name: "reminderFrequencyToApprover",
          placeholder: "Enter reminder frequency to approver",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 8,
          formgrid: "none",
        },
        {
          type: "checkbox",
          tag: "checkbox",
          label: "Auto Approve If Date Crossed",
          name: "autoApproveIfDateCrossed",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: false,
          fieldGrid: 1,
          displayOrder: 9,
          formgrid: "none",
        },
        {
          type: "checkbox",
          tag: "checkbox",
          label: "Auto Approval Allowed",
          name: "autoApprovalAllowed",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: false,
          fieldGrid: 1,
          displayOrder: 10,
          formgrid: "none",
        },
        {
          type: "number",
          tag: "input",
          label: "Days For Auto Approval*",
          name: "daysForAutoApproval",
          placeholder: "Enter days for auto approval",
          classvalue: {
            container: "col-span-4 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 13,
          formgrid: "none",
        },
      ],
    },
    {
      formgrid: 4,
      title: "",
      classvalue: "col-span-12 gap-4 mt-4",
      component: {
        container: "",
        title: {
          container: "",
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
            container: "col-span-10 h-12 mb-2",
          },
        },
        {
          type: "button",
          tag: "button",
          label: "Save",
          name: "savePolicy",
          placeholder: "",
          value: [],
          classvalue: {
            container: "col-span-1 mb-0 ",
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
            }
          ],
          options: [],
          formgrid: "none",
          displayOrder: 1,
        },
        {
          type: "button",
          tag: "button",
          label: "Continue",
          name: "continuePolicy",
          placeholder: "",
          value: [],
          classvalue: {
            container: "col-span-1 mb-0 ",
            label: "text-gray-600",
            button: "bg-green-600 text-white",
          },
          mode: "all-allow",
          required: true,
          icon: "",
          children: ["selectLeaveArea"],
          requiredfields: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus"],
          functions: [
            {
              function: "messenger-tonext-component",
              validation: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus"],
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
          displayOrder: 2,
        },
      ],
    },
  ],
};

export const leavePolicyTableForm = {
  component: "form",
  mode: "edit",
  title: "Leave Policy Select Area",
  name: "leavepolicy",
  description: "Select the area for the leave policy",
  classvalue: "grid-cols-12",
  baseurl: "api/leavepolicy",
  subformstructure: [
    {
      formgrid: 1,
      title: "",
      classvalue: "col-span-12 gap-4 pb-4",
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
          type: "table",
          tag: "table-form",
          label: "Leave Code*",
          name: "selectLeaveArea",
          funtinality: {
            tabletype: {
              type: "data",
              classvalue: {
                container: "col-span-12 mb-2",
                tableheder: {
                  container: "bg-[#f8fafc]",
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
                status: true,
              },
              selectCheck: {
                status: false,
              },
              activeColumn: {
                status: true,
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
                label: "Create Leave Policy",
                status: true,
                classvalue: {
                  container: "col-span-12 mb-2",
                  label: "text-gray-600",
                  field: "p-1",
                },
                children: ["AddLeaveArea"],
                functions: [
                  {
                    function: "updateElement",
                    fieldsUpdate: [
                      {
                        name: "AddLeaveArea",
                        feildnkeys: [
                          {
                            templateValue: "mode",
                            value: true,
                          },
                        ],
                      },
                    ],
                  },
                ],
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
                status: true,
                classvalue: {
                  container: "col-span-12 mb-2",
                  label: "text-gray-600",
                  field: "p-1",
                },
                function: (id: string) => {},
              },
              actionLink: {
                label: "link",
                status: true,
                classvalue: {
                  container: "col-span-12 mb-2",
                  label: "text-gray-600",
                  field: "p-1",
                },
                function: (item: any) => {
                  {};
                },
              },
              actionEdit: {
                label: "Edit",
                status: true,
                classvalue: {
                  container: "col-span-12 mb-2",
                  label: "text-gray-600",
                  field: "p-1",
                },
                function: (id: string) => {},
              },
            },
          },
          mainTableData:"location",
          localStorageName:"policy-selectLeaveArea-table",
          tabledata: [
          ],
          placeholder: "Select leave code",
          classvalue: {
            container: "col-span-12 mb-3",
            label: "text-gray-600",
            field: "p-2",
          },
          required: true,
          fieldGrid: 1,
          displayOrder: 1,
          formgrid: "none",
        },
      ],
    },
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
            container: "col-span-9 h-12 mb-2",
          },
        },
        {
          type: "onSubmit",
          tag: "button",
          label: "Save the Policy",
          name: "saveArea",
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
              function: "localStorageInsertValue",
              storageName: "policyDiscription",
              storageType: "local",
              storageKey: "policyAreaSelected",
              storageValue: ["location","subsidiary","designation","leaveType"],
              postStructure: {
                location:"",
                subsidiary:"",
                designation:"",
                leaveType:"",
              }
            },
          ],
          options: [],
          formgrid: "none",
          displayOrder: 1,
        },
      ],
    },
  ],
};

export const leavePolicySubmitForm = {
  component: "form",
  mode: "edit",
  title: "",
  name: "leavepolicy",
  description: "",
  classvalue: "grid-cols-12 -mt-4 -",
  baseurl: "api/leavepolicy",
  subformstructure: [
    {
      formgrid: 2,
      title: "",
      classvalue: "col-span-12 mb-0  rounded-md ",
      validationRules: {
        required: ["logoupload"],
      },
      component: {
        container: "col-span-12 pt-0  border-r  ",
        title: {
          container: " mb-4 -mb-2",
          heading: "text-2xl ",
          description: "text-sm",
        },
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
          label: "Back to Policy",
          name: "saveArea",
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
          functions: [
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
                            value: "Leave Policy",
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
          type: "button",
          tag: "button",
          label: "Save",
          name: "saveAreaOnly",
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
              function: "localStorageInsertValue",
              storageName: "policyDiscription",
              storageType: "local",
              storageKey: "policyAreaSelected",
              storageValue: ["location","subsidiary","designation","leaveType"],
              postStructure: {
                location:"",
                subsidiary:"",
                designation:"",
                leaveType:"",
              }
            }
          ],
          options: [],
          formgrid: "none",
          displayOrder: 1,
        },
        {
          type: "button",
          tag: "button",
          label: "Continue",
          name: "continueArea",
          placeholder: "",
          value: [],
          classvalue: {
            container: "col-span-3 mb-0 ",
            label: "text-gray-600",
            button: "bg-green-600 text-white",
          },
          mode: "all-allow",
          required: true,
          icon: "",
          children: ["selectLeaveArea"],
          requiredfields: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus"],
          functions: [
            {
              function: "messenger-tonext-component",
              validation: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus"],
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
          options: [],
          formgrid: "none",
          displayOrder: 2,
        },
      ],
    },
  ],
};

export const leavePolicyTablePopup = {
  component: "form",
  mode: "edit",
  title: "",
  name: "leavepolicy",
  description: "",
  classvalue: "grid-cols-12 -mt-4 -",
  baseurl: "api/leavepolicy",
  subformstructure: [
    {
      formgrid: 2,
      title: "Select The Area",
      classvalue: "col-span-12 mb-0  rounded-md ",
      validationRules: {
        required: ["logoupload"],
      },
      component: {
        container: "col-span-12 pt-0  border-r  ",
        title: {
          container: " mb-4 -mb-2",
          heading: "text-2xl ",
          description: "text-sm",
        },
      },
      fields: [
        {
          type: "text",
          tag: "multi-select",
          label: "Location",
          name: "location",
          placeholder: "",
          value: [],
          classvalue: {
            container: "col-span-12 mb-0",
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
          tag: "multi-select",
          label: "Subsidiary",
          name: "subsidiaries",
          placeholder: "",
          value: [],
          classvalue: {
            container: "col-span-12 mb-0",
            label: "text-gray-600",
            field: "p-1",
          },
          mode: "all-allow",
          children: ["divisions"],
          required: true,
          icon: "",
          options: [],
          formgrid: "none",
          displayOrder: 1,
        },
        {
          type: "text",
          tag: "multi-select",
          label: "Designation",
          name: "designations",
          placeholder: "",
          value: [],
          classvalue: {
            container: "col-span-12 mb-0",
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
          children: ["grades"],
          required: true,
          icon: "",
          options: [],
          formgrid: "none",
          displayOrder: 1,
        },
        
        {
          type: "onSubmit",
          tag: "button",
          label: "Save the Area",
          name: "saveArea",
          placeholder: "",
          value: [],
          classvalue: {
            container: "col-span-12 mb-0 ",
            label: "text-gray-600",
            button: "bg-[#2563eb] text-white",
          },
          mode: "all-allow",
          required: true,
          icon: "",
          children: ["selectLeaveArea"],
          requiredfields: ["location","subsidiaries", "designations"],
          functions: [
            {
              function: "tableValueUpadte",
              fieldsUpdate: [
                {
                  name: "selectLeaveArea",
                  feildnkeys: [
                    {
                      name: "tabledata",
                      checkcondition: "selectedvalue",
                      backendcall: false,
                      tebleColumn: [
                        "location",
                        "subsidiaries",
                        "designations",
                      ],
                    },
                  ],
                },
                {
                  name: "AddLeaveArea",
                  feildnkeys: [
                    {
                      name: "formgrid",
                      value: "tempte",
                      checkcondition: "directaddvalue",
                      backendcall: false,
                    },
                  ],
                },
              ],
            },
            {
              function: "localStorageInsertValue",
              storageName: "policy-selectLeaveArea-table",
              storageType: "local",
              storageKey: "policyLocationsTable",
              storageValue: ["location", "subsidiaries", "designations"],
            },
            {
              function: "messenger-tonext-component",
              fieldsUpdate: [
                {
                    name: "locationSelectPopup",
                    feildnkeys: [
                      {
                        name: "activeTab",
                        checkcondition: "switch",
                        switch: [
                          {
                            case: "noerror",
                            value: "false",
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

export const leavePolicyProgressBar = {
  component: "form",
  mode: "view",
  title: "",
  description: "",
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
          name: "progressLeavepolicy",
          classvalue: {
            container: "col-span-12 ",
            label: "text-gray-600",
            field: "p-1",
          },
          options: [
            {
              label: "Leave Policy",
              completed: false,
              parentFields: {
                localstorage: "policyDiscription",
                field: [],
              },
              requiredfields: [],
              selectFields: {
                localstorage: "policyDiscription",
                field: [],
              },
              childrenFields: {
                localstorage: "policyDiscription",
                field: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus"],
              },
              value: "Leave Policy",
              status: "completed",
              children: ["progressLeavepolicy"],
              functions: [
                {
                  function: "validateRequiredFields",
                  fieldsUpdate: [
                    {
                      name: "progressLeavepolicy",
                      feildnkeys: [
                        {
                          name: "activeTab",
                          value: "none",
                          checkcondition: "switch",
                          switch: [
                            {
                              case: "noerror",
                              value: "Leave Policy",
                            },
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
              label: "Add Leave Area",
              completed: false,
              value: "Add Leave Area",
              status: "completed",
              parentFields: {
                field: [],
                localstorage: "policyDiscription",
              },
              selectFields: {
                localstorage: "policyDiscription",
                field: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus"],
              },
              childrenFields: {
                localstorage: "policyDiscription",
                field: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalS","location"],
              },
              children: ["progressLeavepolicy"],
              requiredfields: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus"],
              functions: [
                {
                  function: "validateRequiredFields",
                  fieldsUpdate: [
                    {
                      name: "progressLeavepolicy",
                      feildnkeys: [
                        {
                          name: "activeTab",
                          value: "none",
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
                },
              ],
            },
            {
              label: "Preview",
              completed: false,
              value: "Preview",
              parentFields: {
                field: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus"],
                localstorage: "policyDiscription",
              },
              selectFields: {
                localstorage: "policyDiscription",
                field: ["leaveCode", "leaveTitle","effectiveFrom","genderAllowed","maritalStatus","location"],
              },
              childrenFields: {
                localstorage: "policyDiscription",
                field: [],
              },
              status: "notstarted",
              children: ["progress-basic"],
              requiredfields: [
                "selectreport",
                "organization",
                "location",
                "division",
                "department",
                "subdepartment",
                "section",
                "subsidiary",
                "selectfilterationkey",
                "filervalue",
                "queryfilter",
              ],
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
                              value: "Preview",
                            },
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
                      value: "none",
                      checkcondition: "switch",
                      switch: [
                        {
                          case: "Select Report",
                          value: "Select Report",
                        },
                        {
                          case: "Basic Filter",
                          value: "Basic Filter",
                        },
                        {
                          case: "Date Selection",
                          value: "Date Selection",
                        },
                        {
                          case: "Generate Report",
                          value: "Generate Report",
                        },
                      ],
                      backendcall: false,
                    },
                  ],
                },
              ],
            },
          ],
          required: false,
          mode: "super-edit",
          icon: "",
          formgrid: "none",
          displayOrder: 1,
          activeTab: "Leave Policy",
          subformstructure: [
            // {
            //   formgrid: 1,
            //   title: "",
            //   classvalue: "col-span-12 gap-4",
            //   validationRules: {
            //     required: ["logoupload"],
            //   },
            //   formtype: "tabs-form",
            //   tabs: ["Leave Policy"],
            //   fields: [
            //     {
            //       type: "tabs-form",
            //       tag: "sub-form",
            //       classvalue: {
            //         container: "col-span-12 mb-2",
            //         label: "text-gray-600",
            //         field: "p-1",
            //       },
            //       name: "policyForm",
            //       formgrid: "none",
            //       displayOrder: 1,
            //       FormStructure: leavePolicyForm,
            //     },
            //   ],
            // },
            // {
            //   formgrid: 1,
            //   title: "",
            //   classvalue: "col-span-12 gap-4",
            //   validationRules: {
            //     required: ["logoupload"],
            //   },
            //   formtype: "tabs-form",
            //   tabs: ["Add Leave Area"],
            //   fields: [
            //     {
            //       type: "tabs-form",
            //       tag: "sub-form",
            //       classvalue: {
            //         container: "col-span-12 mb-2",
            //         label: "text-gray-600",
            //         field: "p-1",
            //       },
            //       name: "policyForm",
            //       formgrid: "none",
            //       displayOrder: 1,
            //       FormStructure: leavePolicyTableForm,
            //     },
            //   ],
            // },
            // {
            //   formgrid: 1,
            //   title: "",
            //   classvalue: "col-span-12 gap-4",
            //   validationRules: {
            //     required: ["logoupload"],
            //   },
            //   formtype: "tabs-form",
            //   tabs: ["Add Leave Area"],
            //   fields: [
            //     {
            //       type: "tabs-form",
            //       tag: "sub-form",
            //       classvalue: {
            //         container: "col-span-12 mb-2",
            //         label: "text-gray-600",
            //         field: "p-1",
            //       },
            //       name: "policyForm",
            //       formgrid: "none",
            //       displayOrder: 1,
            //       FormStructure: leavePolicyTablePopup,
            //     },
            //   ],
            // },
          ],
        },
      ],
    },
  ],
};
