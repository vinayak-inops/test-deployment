// Type definitions for role permissions
export interface ScreenPermission {
  screenName: string
  route?: string
  parentRoute?: string
  parentPermissions?: string[]
  componentType?: string
  permissions?: Record<string, boolean>
}

export interface ServicePermission {
  serviceName: string
  tileName?: string
  screens: ScreenPermission[]
}

export type RolePermission = ServicePermission[]

// Role permissions configuration
export const rolePermission: RolePermission = [
  {
    serviceName: "mainNOTALLOWED",
    screens: [
      {
        screenName: "roleNOTALLOED",
        route: "/role",
      },
      {
        screenName: "testNOTALLOED",
        route: "/test",
      },
      {
        screenName: "websocketNOTALLOED",
        route: "/websocket",
      },
      {
        screenName: "homeNOTALLOED",
        route: "/",
      },
      {
        screenName: "loginNOTALLOED",
        route: "/login",
      },
      {
        screenName: "launchdeskNOTALLOED",
        route: "/launchdesk",
      },
      {
        screenName: "launchdeskNOTALLOED",
        route: "/documentUpload",
      },
    ],
  },
  {
    serviceName: "dashboard",
    screens: [
      {
        screenName: "liveDashboard",
        permissions: {
          totalCount: true,
          workOrderCount: true,
          contractorCount: false,
          departmentCount: true,
        },
      },
      {
        screenName: "personaldashboard",
        permissions: {
          view: false,
        },
      },
      {
        screenName: "csoDashboard",
        permissions: {
          view: false,
        },
      },
      {
        screenName: "managerDashboard",
        permissions: {
          view: false,
        },
      },
    ],
  },
  {
    serviceName: "reports",
    screens: [
      {
        screenName: "reportsGenerate",
        permissions: {
          reportsGenerate: true,
        },
      }
    ],
  },
  {
    serviceName: "master",
    screens: [
      {
        screenName: "organization",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "location",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: false,
        },
      },
      {
        screenName: "subsidiaries",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "divisions",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "departments",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "designations",
        permissions: {
          view: false,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "grades",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "subDepartments",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: false,
        },
      },
      {
        screenName: "sections",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "employeeCategories",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "workSkill",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "natureOfWork",
        permissions: {
          view: true,
          edit: false,
          add: false,
          delete: true,
        },
      },
      {
        screenName: "assetMaster",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "trainingCategories",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "leaveWages",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "wagePeriod",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "documentMaster",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "skillLevels",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "reasonCodes",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "region",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "mailGroupAssociation",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "country",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "state",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "caste",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "mailGroup",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "centralServerDetails",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "maxEmployeesPerSubsidiary",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "globalServerDetails",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: false,
        },
      },
      {
        screenName: "communicationSoftware",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: false,
        },
      },
      {
        screenName: "contractorEmployee",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: false,
        },
      },
      {
        screenName: "contractor",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "companyEmployee",
        permissions: {
          view: true,
          edit: false,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "securityPass",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "rolePermissions",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "employeeShift",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "policy",
        route: "/#",
      },
      {
        screenName: "overTime",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "advance",
      },
      {
        screenName: "manualComputation",
        permissions: {
          manualComputation: true,
        },
      },
      {
        screenName: "employeeCategorySetting",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "bestEmployeeNomination",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "holiday",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "shiftPolicy",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "shiftsLists",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "leavePolicy",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "workOrderCompletion",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "employeeBalance",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "compoffNOTALLOED",
        route: "/master/compoff",
      },
      {
        screenName: "schedulerConfigurationNOTALLOED",
        route: "/master/scheduler-configurations",
      },
      {
        screenName: "notification",
        permissions: {
          view: true,
          edit: false,
          add: false,
          delete: true,
        },
      },
      {
        screenName: "notificationNOTALLOED",
      },
      {
        screenName: "page-test",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "permission",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
    ],
  },
  {
    serviceName: "excel-upload",
    screens: [
      {
        screenName: "excelFileManager",
        permissions: {
          excelUpload: true,
        },
      }
    ],
  },
  {
    tileName: "muster",
    serviceName: "muster",
    screens: [
      {
        screenName: "muster-punch",
        permissions: {
          musterRollSelf: false,
          musterRollAll: true,
          rawPunchSelf: false,
          rawPunchAll: true,
          punchApplicationsSelf: false,
          punchApplicationsAll: true,
          suspectedPunchAll: true,
          addNewPunchAll: true,
          addNewPunchSelf: false,
        },
      },
      {
        screenName: "punch-application",
        permissions: {
          punchApplicationsCancel: true,
          punchApplicationsApprove: true,
          punchApplicationsReject: true,
        },
        route: "",
      },
      {
        screenName: "muster-punch-calendar",
        permissions: {
          addNewPunch: false,
          knowStatusOfApplication: false,
          punchEditable: true,
        },
      },
      {
        screenName: "muster-punch-tableNOTALLOED",
        permissions: {
          addNewPunch: false,
          knowStatusOfApplication: false,
          punchEditable: false,
        },
      },
      {
        screenName: "suspectedPunches",
        permissions: {
          approve: true,
        },
        route: "",
      },
    ],
  },
  {
    tileName: "ot-application",
    serviceName: "OT",
    screens: [
      {
        screenName: "otManagement",
        permissions: {
          otPolicy: true,
          otchApplicationsSelf: true,
          otApplicationsAll: true,
        },
      },
      {
        screenName: "ot-application",
        permissions: {
          otApplicationsCancel: true,
          otApplicationsApprove: true,
          otApplicationsReject: true,
        },
      },
    ],
  },
  {
    tileName: "shift-application",
    serviceName: "shiftApplication",
    screens: [
      {
        screenName: "shiftManagement",
        permissions: {
          shiftPolicy: true,
          shiftchApplicationsSelf: true,
          shiftApplicationsAll: true,
        },
      },
      {
        screenName: "shiftApplication",
        permissions: {
          shiftApplicationsCancel: true,
          shiftApplicationsApprove: true,
          shiftApplicationsReject: true,
        },
      },
    ],
  },
  {
    tileName: "outDuty-application",
    serviceName: "outDuty",
    screens: [
      {
        screenName: "outDutyManagement",
        permissions: {
          outDutychApplicationsSelf: true,
          outDutyApplicationsAll: true,
        },
      },
      {
        screenName: "outDutyApplication",
        permissions: {
          outDutyApplicationsCancel: true,
          outDutyApplicationsApprove: true,
          outDutyApplicationsReject: true,
        },
        route: "",
      },
    ],
  },
  {
    tileName: "wage",
    serviceName: "wage",
    screens: [
      {
        screenName: "wageMinimumWages",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "wageProfessionalTax",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "wageSalaryHeads",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
      {
        screenName: "wageSalaryTemplates",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
    ],
  },
  {
    serviceName: "leave",
    screens: [
      {
        screenName: "leaveManagement",
        permissions: {
          leaveApplicationsOfTimeAwaySelf: true,
          leaveApplicationsOfTimeAwayAll: true,
          leaveApplicationsOfLeaveOfAbsenceSelf: true,
          leaveApplicationsOfLeaveOfAbsenceAll: true,
          newLeaveRequestSelf: true,
          newLeaveRequestAll: true,
          timeOffBalanceSelf: true,
          timeOffBalanceAll: true,
          leaveEncashmentSelf: true,
          leaveEncashmentAll: true,
          approvalRequestSelf: true,
          approvalRequestAll: true,
        },
      },
      {
        screenName: "encashmentManagement",
        permissions: {
          encashmentManagementCancel: true,
          encashmentManagementApprove: true,
          encashmentManagementReject: true,
        },
      },
      {
        screenName: "leaveApplication",
        permissions: {
          leaveApplicationCancel: true,
          leaveApplicationApprove: true,
          leaveApplicationReject: true,
        },
      },
      {
        screenName: "specialLeaveApplication",
        permissions: {
          specialLeaveApplicationCancel: true,
          specialLeaveApplicationApprove: true,
          specialLeaveApplicationReject: true,
        },
      },
    ],
  },
  {
    serviceName: "role",
    screens: [
      {
        screenName: "rolePermissions",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      },
       {
        screenName: "userEntitlements",
        permissions: {
          view: true,
          edit: true,
          add: true,
          delete: true,
        },
      }
    ],
  },
  {
    serviceName: "aiAssistantNOTALLOWED",
    screens: [],
  },
]

// Default export for Next.js compatibility
export default rolePermission
