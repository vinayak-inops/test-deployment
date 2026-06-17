export const formStructure = {
  tenantCode: "YOUR_TENANT_CODE",
    masterEmployee: {
    tabRequired: true,
      label: "Employee",
      title: "Module",
      subtitle: "Employee",
      manualComputation: {
        label: "Manual Computation",
        visible: true,
        rowLabel: "Allow manual computation for all applicable employees",
        sections: {
          permissions: {
            fields: {
              view: { visible: true },
              apply: { visible: true },
            },
          },
        },
      },
      fields: {
        securityPass: {
          label: "Security Pass",
          visible: true,
          sections: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: true },
              },
            },
          },
        },
        employeeShift: {
          label: "Employee Shift",
          visible: true,
          sections: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: true },
              },
            },
          },
        },
        bestEmployeeNomination: {
          label: "Best Employee Nomination",
          visible: true,
          sections: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: true },
              },
            },
          },
        },
        employeeBalance: {
          label: "Employee Balance",
          visible: true,
          sections: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: false },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
        employeeCategoryTrainingDetails: {
          label: "Employee Category Training Details",
          visible: true,
          sections: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: true },
              },
            },
          },
        },
        employeeTrainingCompletion: {
          label: "Employee Training Completion",
          visible: true,
          sections: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
      },
    },
    masterAdvance: {
    tabRequired: true,
      label: "Advance",
      title: "Module",
      subtitle: "Advance",
      fields: {
        employeeCategorySetting: {
          label: "Employee Category Setting",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: true },
              },
            },
          },
        },
        workOrderCompletion: {
          label: "Work Order Completion",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
        mailGroupAssociation: {
          label: "Mail Group Association",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        mailGroupAssociationHris: {
          label: "Mail Group Association HRIS",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: false },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
        Notification: {
          label: "Notification",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: true },
              },
            },
          },
        },
      },
    },
    masterContractor: {
    tabRequired: true,
      label: "Contractor",
      title: "Module",
      subtitle: "Contractor",
      fields: {
        contractorEmployee: {
          label: "Contractor Employee",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: true },
              },
            },
          },
        },
        contractor: {
          label: "Contractor",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
        companyEmployee: {
          label: "Company Employee",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        companyEmployeeHris: {
          label: "Company Employee HRIS",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: false },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
      },
    },
    masterOrganization: {
    tabRequired: true,
      label: "Organization",
      title: "Module",
      subtitle: "Organization",
      fields: {
        organization: {
          label: "Organization",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: true },
              },
            },
          },
        },
        location: {
          label: "Location",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        subsidiaries: {
          label: "Subsidiaries",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        divisions: {
          label: "Divisions",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        departments: {
          label: "Departments",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        designations: {
          label: "Designations",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        grades: {
          label: "Grades",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        subDepartments: {
          label: "Sub Departments",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        sections: {
          label: "Sections",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        employeeCategories: {
          label: "Employee Categories",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        workSkill: {
          label: "Work Skill",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        natureOfWork: {
          label: "Nature Of Work",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        assetMaster: {
          label: "Asset Master",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        leaveWages: {
          label: "Leave Wages",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: false },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
        wagePeriod: {
          label: "Wage Period",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
        documentMaster: {
          label: "Document Master",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        skillLevels: {
          label: "Skill Levels",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        reasonCodes: {
          label: "Reason Codes",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
        region: {
          label: "Region",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        country: {
          label: "Country",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
        state: {
          label: "State",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
        caste: {
          label: "Caste",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        mailGroup: {
          label: "Mail Group",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
      },
    },
    masterPolicy: {
    tabRequired: true,
      label: "Policy",
      title: "Module",
      subtitle: "Policy",
      fields: {
        overTime: {
          label: "Over Time",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
        holiday: {
          label: "Holiday",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        shiftPolicy: {
          label: "Shift Policy",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        leavePolicy: {
          label: "Leave Policy",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        shiftsLists: {
          label: "Shifts Lists",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
        compoff: {
          label: "Comp Off",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
      },
    },
    applicationApplier: {
    tabRequired: true,
      label: "Application Applier",
      title: "Module",
      subtitle:
        "Configure apply and action permissions for all application modules",
      description:
        "Configure apply and action permissions for all application modules",
      fields: {
        punch: {
          label: "Punch",
          visible: true,
          fields: {
            permissions: {
              fields: {
                self: { visible: true },
                all: { visible: true },
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
        outDuty: {
          label: "Out Duty",
          visible: true,
          fields: {
            permissions: {
              fields: {
                self: { visible: true },
                all: { visible: true },
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
        leave: {
          label: "Leave",
          visible: true,
          fields: {
            permissions: {
              fields: {
                self: { visible: true },
                all: { visible: true },
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
        shiftChange: {
          label: "Shift Change",
          visible: true,
          fields: {
            permissions: {
              fields: {
                self: { visible: true },
                all: { visible: true },
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
        overtime: {
          label: "Overtime",
          visible: true,
          fields: {
            permissions: {
              fields: {
                self: { visible: true },
                all: { visible: true },
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
        encashment: {
          label: "Encashment",
          visible: true,
          fields: {
            permissions: {
              fields: {
                self: { visible: true },
                all: { visible: true },
                approve: { visible: false },
                reject: { visible: false },
                cancel: { visible: true },
              },
            },
          },
        },
        compOff: {
          label: "Comp Off",
          visible: true,
          fields: {
            permissions: {
              fields: {
                self: { visible: true },
                all: { visible: true },
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
        specialLeave: {
          label: "Special Leave",
          visible: true,
          fields: {
            permissions: {
              fields: {
                self: { visible: true },
                all: { visible: true },
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
      },
    },
    applicationApprover: {
    tabRequired: true,
      label: "Application Approver",
      title: "Module",
      subtitle: "Configure approver actions for all application modules",
      description: "Configure approver actions for all application modules",
      fields: {
        punch: {
          label: "Punch",
          visible: true,
          fields: {
            permissions: {
              fields: {
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
        outDuty: {
          label: "Out Duty",
          visible: true,
          fields: {
            permissions: {
              fields: {
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
        leave: {
          label: "Leave",
          visible: true,
          fields: {
            permissions: {
              fields: {
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
        shiftChange: {
          label: "Shift Change",
          visible: true,
          fields: {
            permissions: {
              fields: {
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
        overtime: {
          label: "Overtime",
          visible: true,
          fields: {
            permissions: {
              fields: {
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
        encashment: {
          label: "Encashment",
          visible: true,
          fields: {
            permissions: {
              fields: {
                approve: { visible: true },
                reject: { visible: false },
                cancel: { visible: true },
              },
            },
          },
        },
        compOff: {
          label: "Comp Off",
          visible: true,
          fields: {
            permissions: {
              fields: {
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
        specialLeave: {
          label: "Special Leave",
          visible: true,
          fields: {
            permissions: {
              fields: {
                approve: { visible: true },
                reject: { visible: true },
                cancel: { visible: true },
              },
            },
          },
        },
      },
    },
    masterWage: {
    tabRequired: true,
      label: "Wage",
      title: "Module",
      subtitle: "Wage",
      fields: {
        wageMinimumWages: {
          label: "Minimum Wages",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        wageProfessionalTax: {
          label: "Professional Tax",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
        wageSalaryHeads: {
          label: "Salary Heads",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        wageSalaryTemplates: {
          label: "Salary Templates",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
      },
      wageCalculationApplication: {
        label: "Wage Calculation Application",
        visible: true,
        rowLabel: "Wage Calculation Application",
        fields: {
          permissions: {
            fields: {
              view: { visible: true },
              apply: { visible: true },
            },
          },
        },
      },
    },
    roleControl: {
    tabRequired: true,
      label: "Role & Permissions",
      title: "Critical Modules",
      sectionTitle: "Critical Modules",
      subtitle:
        "High impact area - changes here affect access across the entire application.",
      description:
        "High impact area - changes here affect access across the entire application.",
      confirmTitle: "Confirm Role Change",
      confirmDescription:
        "You are updating role & user entitlement permissions. This can impact access for many users.",
      confirmBody:
        "Please review your changes carefully. Proceed only if you are sure about this update.",
      fields: {
        rolePermissions: {
          label: "Role Permissions",
          description:
            "Control who can configure and assign role-based access for all modules.",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: true },
              },
            },
          },
        },
        userEntitlements: {
          label: "User Entitlements",
          description:
            "Control who can manage user-to-role mapping and entitlement assignments.",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        userEntitlementsHris: {
          label: "Company User Entitlements",
          description:
            "Control who can manage company employee entitlement assignments.",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: true },
                delete: { visible: false },
              },
            },
          },
        },
        contractEmployeeApprover: {
          label: "Contract Employee Approver",
          description: "Control who can manage contract employee approvers.",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
        contractEmployeeApproverHris: {
          label: "Company Employee Approver",
          description: "Control who can manage company employee approvers.",
          visible: true,
          fields: {
            permissions: {
              fields: {
                view: { visible: true },
                edit: { visible: true },
                add: { visible: false },
                delete: { visible: false },
              },
            },
          },
        },
      },
    },
    hrApprover: {
    tabRequired: true,
      label: "Hr Approver Permissions",
      title: "HR Approver Permissions",
      subtitle: "Manage HR contract employee approval access",
      fields: {
        contractEmployeeApproverApprove: {
          fields: {
            permissions: {
              fields: {
                approve: {
                  label: "Approve",
                  visible: true,
                  required: false,
                },
              },
            },
          },
        },
        companyEmployeeApproverApprove: {
          fields: {
            permissions: {
              fields: {
                approve: {
                  label: "Approve",
                  visible: true,
                  required: false,
                },
              },
            },
          },
        },
        contracerApproverApprove: {
          fields: {
            permissions: {
              fields: {
                approve: {
                  label: "Approve",
                  visible: true,
                  required: false,
                },
              },
            },
          },
        },
      },
    },
    challan: {
    tabRequired: true,
      label: "Challan Permissions",
      title: "Challan Upload",
      sectionTitle: "Challan Upload",
      subtitle: "Manage challan upload permissions",
      description: "Manage challan upload permissions",
      fields: {
        challanUpload: {
          label: "Challan Upload",
          rowLabel: "Challan Upload",
          fields: {
            permissions: {
              fields: {
                upload: {
                  label: "Upload",
                  visible: true,
                },
                view: {
                  label: "View",
                  visible: true,
                },
              },
            },
          },
        },
      },
    },
    ai: {
    tabRequired: true,
      label: "AI Permissions",
      title: "AI Chat",
      sectionTitle: "AI Chat",
      subtitle: "Manage AI chat permissions",
      description: "Manage AI chat permissions",
      fields: {
        aiChat: {
          label: "AI Chat",
          rowLabel: "AI Chat",
          fields: {
            permissions: {
              fields: {
                view: {
                  label: "View",
                  visible: true,
                },
              },
            },
          },
        },
      },
    },
    excelUpload: {
    tabRequired: true,
      label: "Excel Upload Permissions",
      title: "Excel File Manager",
      sectionTitle: "Excel File Manager",
      subtitle: "Manage excel file upload permissions and access controls",
      description: "Manage excel file upload permissions and access controls",
      fields: {
        excelFileManager: {
          label: "Excel File Manager",
          rowLabel: "Excel File Manager",
          fields: {
            permissions: {
              fields: {
                excelUpload: {
                  label: "Excel Upload",
                  visible: true,
                },
              },
            },
          },
        },
      },
    },
    dashboard: {
    tabRequired: true,
      label: "Dashboard Permissions",
      title: "Live Dashboard",
      sectionTitle: "Live Dashboard",
      subtitle: "Manage dashboard view permissions and access controls",
      description: "Manage dashboard view permissions and access controls",
      fields: {
        liveDashboard: {
          label: "Live Dashboard",
          rowLabel: "Live Dashboard",
          fields: {
            permissions: {
              fields: {
                totalCount: {
                  label: "Total Count",
                  visible: true,
                },
                workOrderCount: {
                  label: "Work Order Count",
                  visible: true,
                },
                contractorCount: {
                  label: "Contractor Count",
                  visible: true,
                },
                departmentCount: {
                  label: "Department Count",
                  visible: true,
                },
              },
            },
          },
        },
      },
    },
    personalDashboard: {
    tabRequired: true,
      label: "Personal Dashboard Permissions",
      title: "Personal Dashboard",
      sectionTitle: "Personal Dashboard",
      subtitle: "Manage personal dashboard view permissions and access controls",
      description: "Manage personal dashboard view permissions and access controls",
      fields: {
        personaldashboard: {
          label: "Personal Dashboard",
          rowLabel: "Personal Dashboard",
          fields: {
            permissions: {
              fields: {
                view: {
                  label: "View",
                  visible: true,
                },
              },
            },
          },
        },
      },
    },
    csoDashboard: {
    tabRequired: true,
      label: "CSO Dashboard Permissions",
      title: "CSO Dashboard",
      sectionTitle: "CSO Dashboard",
      subtitle: "Manage CSO dashboard view permissions and access controls",
      description: "Manage CSO dashboard view permissions and access controls",
      fields: {
        csoDashboard: {
          label: "CSO Dashboard",
          rowLabel: "CSO Dashboard",
          fields: {
            permissions: {
              fields: {
                view: {
                  label: "View",
                  visible: true,
                },
              },
            },
          },
        },
      },
    },
    managerDashboard: {
    tabRequired: true,
      label: "Manager Dashboard Permissions",
      title: "Manager Dashboard",
      sectionTitle: "Manager Dashboard",
      subtitle: "Manage manager dashboard view permissions and access controls",
      description: "Manage manager dashboard view permissions and access controls",
      fields: {
        managerDashboard: {
          label: "Manager Dashboard",
          rowLabel: "Manager Dashboard",
          fields: {
            permissions: {
              fields: {
                view: {
                  label: "View",
                  visible: true,
                },
              },
            },
          },
        },
      },
    },
    reports: {
    tabRequired: true,
      label: "Reports Permissions",
      title: "Reports Generate",
      sectionTitle: "Reports Generate",
      subtitle: "Manage reports generation permissions and access controls",
      description: "Manage reports generation permissions and access controls",
      fields: {
        reportsGenerate: {
          label: "Reports Generate",
          rowLabel: "Reports Generate",
          fields: {
            permissions: {
              fields: {
                reportsGenerate: {
                  label: "Reports Generate",
                  visible: true,
                },
              },
            },
          },
        },
      },
    },
    muster: {
    tabRequired: true,
      label: "Muster Permissions",
      title: "Muster",
      subtitle: "Configure muster roll, raw punch, added punch, and suspected punch permissions",
      description: "Configure muster roll, raw punch, added punch, and suspected punch permissions",
      fields: {
        musterPunch: {
          label: "Muster Punch",
          visible: true,
          fields: {
            permissions: {
              fields: {
                self: {
                  label: "Muster Roll",
                  visible: true,
                },
                all: {
                  label: "Muster Roll",
                  visible: true,
                },
                editPunch: {
                  label: "Edit Punch",
                  visible: true,
                },
              },
            },
          },
        },
        rawPunch: {
          label: "Raw Punch",
          visible: true,
          fields: {
            permissions: {
              fields: {
                self: {
                  label: "Raw Punch",
                  visible: true,
                },
                all: {
                  label: "Raw Punch",
                  visible: true,
                },
              },
            },
          },
        },
        addNewPunch: {
          label: "Add New Punch",
          visible: true,
          fields: {
            permissions: {
              fields: {
                self: {
                  label: "View Added Punches Self",
                  visible: true,
                },
                all: {
                  label: "View Added Punches All",
                  visible: true,
                },
                addPunchSelf: {
                  label: "Add New Punch for Self",
                  visible: true,
                },
                addPunchAll: {
                  label: "Add New Punch for All Employees",
                  visible: true,
                },
              },
            },
          },
        },
        suspectedPunches: {
          label: "Suspected Punches",
          visible: true,
          fields: {
            permissions: {
              fields: {
                all: {
                  label: "Suspected Punches",
                  visible: true,
                },
                approve: {
                  label: "Approve suspected punches",
                  visible: true,
                },
              },
            },
          },
        },
      },
    },
} as const;
