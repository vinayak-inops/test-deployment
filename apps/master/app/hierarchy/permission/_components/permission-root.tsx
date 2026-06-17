"use client";

import React, { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sidebar } from "@/components/fields/sidebar-local";
import FormApplication from "../out-duty/_components/form-application";
import PunchMusterPermissionsForm from "../punch-application/_components/form-muster-permissions";
import ShiftFormApplication from "../shift-application/_components/form-shift-application";
import OtFormApplication from "../ot-application/_components/form-ot-application";
import LeaveEncashmentFormApplication from "../leave-application/_components/form-encashment-application";
import CompOffFormApplication from "../leave-application/_components/form-compoff-application";
import MasterOrganizationForm from "../master/_components/form-master-organization";
import MasterContractorForm from "../master/_components/form-master-contractor";
import MasterPolicyForm from "../master/_components/form-master-policy";
import MasterAdvanceForm from "../master/_components/form-master-advance";
import MasterEmployeeForm from "../master/_components/form-master-employee";
import RolePermissionForm from "../role/_components/form-role-permissions";
import HrApproverForm from "../role/_components/form-hr-approver";
import MasterWageForm from "../wages/_components/form-master-wage";
import MasterEwaForm from "../ewa/_components/form-master-ewa";
import MasterBgmForm from "../bgm/_components/form-master-bgm";
import MusterPermissionForm from "../muster/_components/muster-permission";
import LeaveFormApplication from "../leave-application/_components/form-leave-application";
import DashboardForm from "../dashboard/_components/form-dashboard";
import PersonalDashboardForm from "../dashboard/_components/form-personal-dashboard";
import CsoDashboardForm from "../dashboard/_components/form-cso-dashboard";
import ManagerDashboardForm from "../dashboard/_components/form-manager-dashboard";
import ReportsForm from "../reports/_components/form-reports";
import ExcelUploadForm from "../excel-upload/_components/form-excel-upload";
import ChallanForm from "../challan/_components/form-challan";
import AiForm from "../ai/_components/form-ai";
import { useRequest } from "@repo/ui/hooks/api/useGetRequest";
import RoleTable from "../_components/role-table";
import PermissionHeader from "../_components/permission-header";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";
import { useCollectionFormStructure } from "@/hooks/form-functions/useCollectionFormStructure";
import ApplicationApplierForm from "../application/form-application-applier";
import ApplicationApproverForm from "../application/form-application-approver";

export default function PermissionRoot() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get URL params
  const formParam = searchParams.get('form');
  const entitlementCodeParam = searchParams.get('entitlementCode');

  // Determine if we're in form mode (similar to contractor-employee)
  const isFormMode = formParam !== null && entitlementCodeParam !== null;

  // Use URL params or defaults
  const activeId = formParam || "masterOrganization";
  const selectedEntitlementCode = entitlementCodeParam;

  const [outDutyInitial, setOutDutyInitial] = React.useState<any | null>(null);
  const [shiftInitial, setShiftInitial] = React.useState<any | null>(null);
  const [otInitial, setOtInitial] = React.useState<any | null>(null);
  const [masterOrganizationInitial, setMasterOrganizationInitial] = React.useState<any | null>(null);
  const [masterContractorInitial, setMasterContractorInitial] = React.useState<any | null>(null);
  const [masterPolicyInitial, setMasterPolicyInitial] = React.useState<any | null>(null);
  const [masterAdvanceInitial, setMasterAdvanceInitial] = React.useState<any | null>(null);
  const [masterEmployeeInitial, setMasterEmployeeInitial] = React.useState<any | null>(null);
  const [masterWageInitial, setMasterWageInitial] = React.useState<any | null>(null);
  const [masterEwaInitial, setMasterEwaInitial] = React.useState<any | null>(null);
  const [masterBgmInitial, setMasterBgmInitial] = React.useState<any | null>(null);
  const [hrApproverInitial, setHrApproverInitial] = React.useState<any | null>(null);
  const [hrApproverRecordId, setHrApproverRecordId] = React.useState<string | null>(null);
  const [applicationApplierInitial, setApplicationApplierInitial] = React.useState<any | null>(null);
  const [applicationApproverInitial, setApplicationApproverInitial] = React.useState<any | null>(null);
  const [musterInitial, setMusterInitial] = React.useState<any | null>(null);
  const [punchApplicationInitial, setPunchApplicationInitial] = React.useState<any | null>(null);
  const [leaveInitial, setLeaveInitial] = React.useState<any | null>(null);
  const [encashmentInitial, setEncashmentInitial] = React.useState<any | null>(null);
  const [compOffInitial, setCompOffInitial] = React.useState<any | null>(null);
  const [dashboardInitial, setDashboardInitial] = React.useState<any | null>(null);
  const [personalDashboardInitial, setPersonalDashboardInitial] = React.useState<any | null>(null);
  const [csoDashboardInitial, setCsoDashboardInitial] = React.useState<any | null>(null);
  const [managerDashboardInitial, setManagerDashboardInitial] = React.useState<any | null>(null);
  const [reportsInitial, setReportsInitial] = React.useState<any | null>(null);
  const [excelUploadInitial, setExcelUploadInitial] = React.useState<any | null>(null);
  const [challanInitial, setChallanInitial] = React.useState<any | null>(null);
  const [aiInitial, setAiInitial] = React.useState<any | null>(null);
  const [fullEntitlement, setFullEntitlement] = React.useState<any | null>(null);
  const tenantCode = useGetTenantCode();
  const {
    formStructure: permissionFormStructure,
    loading: permissionFormStructureLoading,
  } = useCollectionFormStructure({
    collectionName: "role_permission_form_structure",
  });
  const defaultHrApproverPayload = {
    hrapprover: {
      contractEmployeeApprover: {
        permissions: {
          approve: false,
        },
        isActive: false,
      },
      companyEmployeeApprover: {
        permissions: {
          approve: false,
        },
        isActive: false,
      },
      contracerApprover: {
        permissions: {
          approve: false,
        },
        isActive: false,
      },
    },
  };

  const normalizeRecordId = (value: any): string | null => {
    if (!value) return null;
    if (typeof value === "string") return value;
    if (typeof value === "object" && value.$oid) return String(value.$oid);
    return String(value);
  };

  const {
    refetch: fetchRole,
  } = useRequest<any>({
    url: "role_permissions/search",
    method: "POST",
    data: [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
      { field: "entitlementCode", value: selectedEntitlementCode, operator: "eq" },
      { field: "createdOn", value: "", operator: "desc" },
    ],
    onSuccess: (data) => {
      try {
        const list = Array.isArray((data as any)?.data)
          ? (data as any).data
          : Array.isArray(data)
            ? data
            : [data];

        const raw = list[0];
        setFullEntitlement(raw);
        setHrApproverRecordId(normalizeRecordId(raw?._id));
        const screenPermissions = raw?.screenPermissions ?? [];

        // ---------- Master (organization / contractor / policy / advance) ----------
        const masterEntry = screenPermissions.find(
          (sp: any) => sp.serviceName === "master",
        );
        const masterScreens = masterEntry?.screens ?? [];

        const ORGANIZATION_KEYS = [
          "organization",
          "location",
          "subsidiaries",
          "divisions",
          "departments",
          "designations",
          "grades",
          "subDepartments",
          "sections",
          "employeeCategories",
          "workSkill",
          "natureOfWork",
          "assetMaster",
          "trainingCategories",
          "leaveWages",
          "wagePeriod",
          "documentMaster",
          "skillLevels",
          "reasonCodes",
          "region",
          "mailGroupAssociation",
          "country",
          "state",
          "caste",
          "mailGroup",
        ];

        const orgScreens =
          masterScreens
            .filter(
              (s: any) =>
                ORGANIZATION_KEYS.includes(s.screenName) && s.permissions,
            )
            .map((s: any) => ({
              screenName: s.screenName,
              permissions: {
                view: !!s.permissions.view,
                edit: !!s.permissions.edit,
                add: !!s.permissions.add,
                delete: !!s.permissions.delete,
              },
            })) ?? [];

        const isActive = orgScreens.some((s: any) => {
          const p = s.permissions;
          return p.view || p.edit || p.add || p.delete;
        });

        setMasterOrganizationInitial({
          serviceName: "master",
          isActive,
          screens: orgScreens,
        });

        const CONTRACTOR_KEYS = [
          "contractorEmployee",
          "contractor",
          "companyEmployee",
          "companyEmployeeHris",
        ];

        const EMPLOYEE_KEYS = [
          "securityPass",
          "employeeShift",
          "bestEmployeeNomination",
          "employeeBalance",
          "employeeCategorySetting",
          "employeeCategoryTrainingDetails",
          "employeeTrainingCompletion",
        ];

        const contractorScreens =
          masterScreens
            .filter(
              (s: any) =>
                CONTRACTOR_KEYS.includes(s.screenName) && s.permissions,
            )
            .map((s: any) => ({
              screenName: s.screenName,
              permissions: {
                view: !!s.permissions.view,
                edit: !!s.permissions.edit,
                add: !!s.permissions.add,
                delete: !!s.permissions.delete,
              },
            })) ?? [];

        const contractorIsActive = contractorScreens.some((s: any) => {
          const p = s.permissions;
          return p.view || p.edit || p.add || p.delete;
        });

        setMasterContractorInitial({
          serviceName: "master",
          isActive: contractorIsActive,
          screens: contractorScreens,
        });

        const employeeScreens =
          masterScreens
            .filter(
              (s: any) =>
                EMPLOYEE_KEYS.includes(s.screenName) && s.permissions,
            )
            .map((s: any) => ({
              screenName: s.screenName,
              permissions: {
                view: !!s.permissions.view,
                edit: !!s.permissions.edit,
                add: !!s.permissions.add,
                delete: !!s.permissions.delete,
              },
            })) ?? [];

        const employeeManagement = employeeScreens.reduce((acc: any, s: any) => {
          const p = s.permissions || {};
          acc[s.screenName] = {
            isActive: !!(p.view || p.edit || p.add || p.delete),
            permissions: {
              view: !!p.view,
              edit: !!p.edit,
              add: !!p.add,
              delete: !!p.delete,
            },
          };
          return acc;
        }, {});

        const employeeIsActive = Object.values(employeeManagement).some((entry: any) => !!entry?.isActive);

        setMasterEmployeeInitial({
          employeeManagement,
          isActive: employeeIsActive,
        });

        const POLICY_KEYS = ["overTime", "holiday", "shiftPolicy", "leavePolicy", "shiftsLists", "compoff"];

        const policyScreens =
          masterScreens
            .filter(
              (s: any) => POLICY_KEYS.includes(s.screenName) && s.permissions,
            )
            .map((s: any) => ({
              screenName: s.screenName,
              permissions: {
                view: !!s.permissions.view,
                edit: !!s.permissions.edit,
                add: !!s.permissions.add,
                delete: !!s.permissions.delete,
              },
            })) ?? [];

        const policyIsActive = policyScreens.some((s: any) => {
          const p = s.permissions;
          return p.view || p.edit || p.add || p.delete;
        });

        setMasterPolicyInitial({
          serviceName: "master",
          isActive: policyIsActive,
          screens: policyScreens,
        });

        const ADVANCE_KEYS = [
          "manualComputation",
          "workOrderCompletion",
          "notification",
        ];

        const advanceScreens =
          masterScreens
            .filter(
              (s: any) => ADVANCE_KEYS.includes(s.screenName) && s.permissions,
            )
            .map((s: any) => ({
              screenName: s.screenName,
              permissions: { ...(s.permissions || {}) },
              ...(s.parentPermissions ? { parentPermissions: s.parentPermissions } : {}),
            })) ?? [];

        const advanceIsActive =
          !!advanceScreens.find(
            (s: any) =>
              s.screenName === "manualComputation" &&
              !!s.permissions?.manualComputation,
          ) ||
          advanceScreens.some((s: any) => {
            const p = s.permissions as any;
            return !!(p?.view || p?.edit || p?.add || p?.delete);
          });

        setMasterAdvanceInitial({
          serviceName: "master",
          isActive: advanceIsActive,
          screens: advanceScreens,
        });

        // ---------- Wage ----------
        const wageEntry = screenPermissions.find(
          (sp: any) => sp.serviceName === "wage" || sp.tileName === "wage",
        );
        if (wageEntry) {
          const wageScreens = wageEntry.screens || [];
          const WAGE_KEYS = ["wageMinimumWages", "wageProfessionalTax", "wageSalaryHeads", "wageSalaryTemplates"];

          const wageScreensFiltered =
            wageScreens
              .filter(
                (s: any) =>
                  WAGE_KEYS.includes(s.screenName) && s.permissions,
              )
              .map((s: any) => ({
                screenName: s.screenName,
                permissions: {
                  view: !!s.permissions.view,
                  edit: !!s.permissions.edit,
                  add: !!s.permissions.add,
                  delete: !!s.permissions.delete,
                },
              })) ?? [];

          // Add wageCalculationApplication screen if it exists
          const wageCalculationApp = wageScreens.find(
            (s: any) => s.screenName === "wageCalculationApplication" && s.permissions,
          );
          if (wageCalculationApp) {
            wageScreensFiltered.push({
              screenName: "wageCalculationApplication",
              permissions: {
                view: !!wageCalculationApp.permissions.view,
                apply: !!wageCalculationApp.permissions.apply,
              },
            });
          }

          const wageIsActive = wageScreensFiltered.some((s: any) => {
            const p = s.permissions;
            if (s.screenName === "wageCalculationApplication") {
              return !!(p.view || p.apply);
            }
            return !!(p.view || p.edit || p.add || p.delete);
          });

          setMasterWageInitial({
            serviceName: "wage",
            isActive: wageIsActive,
            screens: wageScreensFiltered,
          });
        }

        // ---------- EWA ----------
        const ewaEntry = screenPermissions.find(
          (sp: any) => sp.serviceName === "ewa" || sp.tileName === "ewa",
        );
        if (ewaEntry) {
          const ewaScreens = ewaEntry.screens || [];
          const EWA_KEYS = ["EWAEmployeeSettings", "EWAWithdrawalCategory", "EWAAllowedWithdrawal"];

          const ewaScreensFiltered =
            ewaScreens
              .filter(
                (s: any) =>
                  EWA_KEYS.includes(s.screenName) && s.permissions,
              )
              .map((s: any) => ({
                screenName: s.screenName,
                permissions: {
                  view: !!s.permissions.view,
                  edit: !!s.permissions.edit,
                  add: !!s.permissions.add,
                  delete: !!s.permissions.delete,
                },
              })) ?? [];

          const ewaIsActive = ewaScreensFiltered.some((s: any) => {
            const p = s.permissions;
            return !!(p.view || p.edit || p.add || p.delete);
          });

          setMasterEwaInitial({
            serviceName: "ewa",
            isActive: ewaIsActive,
            screens: ewaScreensFiltered,
          });
        }

        // ---------- BGM ----------
        const bgmEntry = screenPermissions.find(
          (sp: any) => sp.serviceName === "bgm" || sp.tileName === "bgm",
        );
        if (bgmEntry) {
          const bgmScreens = bgmEntry.screens || [];
          const verification = bgmScreens.find(
            (s: any) => s.screenName === "verfication" && s.permissions,
          );
          setMasterBgmInitial({
            serviceName: "bgm",
            isActive: !!verification?.permissions?.apply,
            screens: verification
              ? [{
                  screenName: "verfication",
                  permissions: {
                    apply: !!verification.permissions.apply,
                  },
                }]
              : [],
          });
        }

        // ---------- Applications: Out Duty / Shift / OT ----------
        const outDutyEntry = screenPermissions.find(
          (sp: any) => sp.serviceName === "outDuty" || sp.tileName === "outDuty-application",
        );
        if (outDutyEntry) {
          const odScreens = outDutyEntry.screens || [];
          const odMgmt = odScreens.find((s: any) => s.screenName === "outDutyManagement")
            ?.permissions || {};
          const odApp = odScreens.find((s: any) => s.screenName === "outDutyApplication")
            ?.permissions || {};

          setOutDutyInitial({
            outDutychApplicationsSelf: !!odMgmt.outDutychApplicationsSelf,
            outDutyApplicationsAll: !!odMgmt.outDutyApplicationsAll,
            outDutyApplicationsSelfCancel: !!odMgmt.outDutyApplicationsSelfCancel,
            outDutyApplicationsAllCancel: !!odMgmt.outDutyApplicationsAllCancel,
            outDutyApplicationApprover: !!odMgmt.outDutyApplicationApprover,
            outDutyApplicationsCancel: !!odApp.outDutyApplicationsCancel,
            outDutyApplicationsApprove: !!odApp.outDutyApplicationsApprove,
            outDutyApplicationsReject: !!odApp.outDutyApplicationsReject,
          });
        }

        const shiftEntry = screenPermissions.find(
          (sp: any) =>
            sp.serviceName === "shiftApplication" || sp.tileName === "shift-application",
        );
        if (shiftEntry) {
          const shScreens = shiftEntry.screens || [];
          const shMgmt = shScreens.find((s: any) => s.screenName === "shiftManagement")
            ?.permissions || {};
          const shApp = shScreens.find((s: any) => s.screenName === "shiftApplication")
            ?.permissions || {};

          setShiftInitial({
            shiftchApplicationsSelf: !!shMgmt.shiftchApplicationsSelf,
            shiftApplicationsAll: !!shMgmt.shiftApplicationsAll,
            shiftApplicationsSelfCancel: !!shMgmt.shiftApplicationsSelfCancel,
            shiftApplicationsAllCancel: !!shMgmt.shiftApplicationsAllCancel,
            shiftApplicationApprover: !!shMgmt.shiftApplicationApprover,
            shiftApplicationsCancel: !!shApp.shiftApplicationsCancel,
            shiftApplicationsApprove: !!shApp.shiftApplicationsApprove,
            shiftApplicationsReject: !!shApp.shiftApplicationsReject,
          });
        }

        const otEntry = screenPermissions.find(
          (sp: any) => sp.serviceName === "OT" || sp.tileName === "ot-application",
        );
        if (otEntry) {
          const otScreens = otEntry.screens || [];
          const otMgmt = otScreens.find((s: any) => s.screenName === "otManagement")
            ?.permissions || {};
          const otApp = otScreens.find((s: any) => s.screenName === "ot-application")
            ?.permissions || {};

          setOtInitial({
            otchApplicationsSelf: !!otMgmt.otchApplicationsSelf,
            otApplicationsAll: !!otMgmt.otApplicationsAll,
            otApplicationsSelfCancel: !!otMgmt.otApplicationsSelfCancel,
            otApplicationsAllCancel: !!otMgmt.otApplicationsAllCancel,
            otApplicationApprover: !!otMgmt.otApplicationApprover,
            otApplicationsCancel: !!otApp.otApplicationsCancel,
            otApplicationsApprove: !!otApp.otApplicationsApprove,
            otApplicationsReject: !!otApp.otApplicationsReject,
          });
        }

        // ---------- Muster & Punch Application ----------
        const musterEntry = screenPermissions.find(
          (sp: any) => sp.serviceName === "muster" || sp.tileName === "muster",
        );
        if (musterEntry) {
          const musterScreens = musterEntry.screens || [];

          const musterPunch = musterScreens.find((s: any) => s.screenName === "muster-punch")
            ?.permissions || {};
          const musterCalendar = musterScreens.find((s: any) => s.screenName === "muster-punch-calendar")
            ?.permissions || {};
          const suspectedPunches = musterScreens.find((s: any) => s.screenName === "suspectedPunches")
            ?.permissions || {};
          const addNewPunch = musterScreens.find((s: any) => s.screenName === "add-new-punch")
            ?.permissions || {};

          setMusterInitial({
            musterRollSelf: !!musterPunch.musterRollSelf,
            musterRollAll: !!musterPunch.musterRollAll,
            rawPunchSelf: !!musterPunch.rawPunchSelf,
            rawPunchAll: !!musterPunch.rawPunchAll,
            editPunch: !!musterCalendar.punchEditable,
            suspectedPunchAll: !!musterPunch.suspectedPunchAll,
            approve: !!suspectedPunches.approve,
            viewNewPunchSelf: !!addNewPunch.viewNewPunchSelf,
            viewNewPunchAll: !!addNewPunch.viewNewPunchAll,
            addNewPunchSelf: !!addNewPunch.addNewPunchSelf,
            addNewPunchAll: !!addNewPunch.addNewPunchAll,
          });

          const punchApp = musterScreens.find((s: any) => s.screenName === "punch-application")
            ?.permissions || {};

          setPunchApplicationInitial({
            punchApplicationsSelf: !!musterPunch.punchApplicationsSelf,
            punchApplicationsAll: !!musterPunch.punchApplicationsAll,
            punchApplicationApprover: !!musterPunch.punchApplicationApprover,
            punchApplicationsCancel: !!punchApp.punchApplicationsCancel,
            punchApplicationsApprove: !!punchApp.punchApplicationsApprove,
            punchApplicationsReject: !!punchApp.punchApplicationsReject,
            punchApplicationsSelfCancel: !!punchApp.punchApplicationsSelfCancel,
            punchApplicationsAllCancel: !!punchApp.punchApplicationsAllCancel,
          });
        }

        // ---------- Leave & Encashment ----------
        const leaveEntry = screenPermissions.find(
          (sp: any) => sp.serviceName === "leave",
        );
        if (leaveEntry) {
          const leaveScreens = leaveEntry.screens || [];

          const leaveManagement = leaveScreens.find((s: any) => s.screenName === "leaveManagement")
            ?.permissions || {};
          const leaveApplication = leaveScreens.find((s: any) => s.screenName === "leaveApplication")
            ?.permissions || {};
          const specialLeaveApplication = leaveScreens.find((s: any) => s.screenName === "specialLeaveApplication")
            ?.permissions || {};

          setLeaveInitial({
            leaveApplicationsOfTimeAwaySelf: !!leaveManagement.leaveApplicationsOfTimeAwaySelf,
            leaveApplicationsOfTimeAwayAll: !!leaveManagement.leaveApplicationsOfTimeAwayAll,
            leaveApplicationsOfLeaveOfAbsenceSelf: !!leaveManagement.leaveApplicationsOfLeaveOfAbsenceSelf,
            leaveApplicationsOfLeaveOfAbsenceAll: !!leaveManagement.leaveApplicationsOfLeaveOfAbsenceAll,
            newLeaveRequestSelf: !!leaveManagement.newLeaveRequestSelf,
            newLeaveRequestAll: !!leaveManagement.newLeaveRequestAll,
            timeOffBalanceSelf: !!leaveManagement.timeOffBalanceSelf,
            timeOffBalanceAll: !!leaveManagement.timeOffBalanceAll,
            leaveApplicationApprover: !!leaveApplication.leaveApplicationApprover,
            leaveApplicationSelfCancel: !!leaveApplication.leaveApplicationSelfCancel,
            leaveApplicationAllCancel: !!leaveApplication.leaveApplicationAllCancel,
            leaveApplicationCancel: !!leaveApplication.leaveApplicationCancel,
            leaveApplicationApprove: !!leaveApplication.leaveApplicationApprove,
            leaveApplicationReject: !!leaveApplication.leaveApplicationReject,
            specialLeaveApplicationApprover: !!specialLeaveApplication.specialLeaveApplicationApprover,
            specialLeaveApplicationSelfCancel: !!specialLeaveApplication.specialLeaveApplicationSelfCancel,
            specialLeaveApplicationAllCancel: !!specialLeaveApplication.specialLeaveApplicationAllCancel,
            specialLeaveApplicationCancel: !!specialLeaveApplication.specialLeaveApplicationCancel,
            specialLeaveApplicationApprove: !!specialLeaveApplication.specialLeaveApplicationApprove,
            specialLeaveApplicationReject: !!specialLeaveApplication.specialLeaveApplicationReject,
          });

          const encashmentManagement = leaveScreens.find((s: any) => s.screenName === "encashmentManagement")
            ?.permissions || {};

          setEncashmentInitial({
            leaveEncashmentSelf: !!leaveManagement.leaveEncashmentSelf,
            leaveEncashmentAll: !!leaveManagement.leaveEncashmentAll,
            leaveManagementApplicationApprover: !!leaveManagement.leaveManagementApplicationApprover,
            leaveManagementApplicationsSelfCancel: !!leaveManagement.leaveManagementApplicationsSelfCancel,
            leaveManagementApplicationsAllCancel: !!leaveManagement.leaveManagementApplicationsAllCancel,
            encashmentManagementCancel: !!encashmentManagement.encashmentManagementCancel,
            encashmentManagementApprove: !!encashmentManagement.encashmentManagementApprove,
            encashmentManagementReject: !!encashmentManagement.encashmentManagementReject,
          });

          const compoffApplication = leaveScreens.find((s: any) => s.screenName === "compoffApplication")
            ?.permissions || {};

          setCompOffInitial({
            compOffSelf: !!leaveManagement.compOffSelf,
            compOffAll: !!leaveManagement.compOffAll,
            compOffApplicationsApprover: !!leaveManagement.compOffApplicationsApprover,
            compOffApplicationsSelfCancel: !!leaveManagement.compOffApplicationsSelfCancel,
            compOffApplicationsAllCancel: !!leaveManagement.compOffApplicationsAllCancel,
            compOffApplicationsCancel: !!compoffApplication.compOffApplicationsCancel,
            compOffApplicationsApprove: !!compoffApplication.compOffApplicationsApprove,
            compOffApplicationsReject: !!compoffApplication.compOffApplicationsReject,
          });
        }

        // ---------- Dashboard ----------
        const dashboardEntry = screenPermissions.find(
          (sp: any) => sp.serviceName === "dashboard",
        );
        if (dashboardEntry) {
          const dashboardScreens = dashboardEntry.screens || [];
          const liveDashboard = dashboardScreens.find((s: any) => s.screenName === "liveDashboard")
            ?.permissions || {};
          const personaldashboard = dashboardScreens.find((s: any) => s.screenName === "personaldashboard")
            ?.permissions || {};
          const csoDashboard = dashboardScreens.find((s: any) => s.screenName === "csoDashboard")
            ?.permissions || {};
          const managerDashboard = dashboardScreens.find((s: any) => s.screenName === "managerDashboard")
            ?.permissions || {};

          setDashboardInitial({
            totalCount: !!liveDashboard.totalCount,
            workOrderCount: !!liveDashboard.workOrderCount,
            contractorCount: !!liveDashboard.contractorCount,
            departmentCount: !!liveDashboard.departmentCount,
          });

          setPersonalDashboardInitial({
            dashboard: {
              isActive: !!personaldashboard.view,
              personaldashboard: {
                isActive: !!personaldashboard.view,
                permissions: {
                  view: !!personaldashboard.view,
                },
              },
            },
          });

          setCsoDashboardInitial({
            csoDashboard: {
              isActive: !!csoDashboard.view,
              csoDashboard: {
                isActive: !!csoDashboard.view,
                permissions: {
                  view: !!csoDashboard.view,
                },
              },
            },
          });

          setManagerDashboardInitial({
            managerDashboard: {
              isActive: !!managerDashboard.view,
              managerDashboard: {
                isActive: !!managerDashboard.view,
                permissions: {
                  view: !!managerDashboard.view,
                },
              },
            },
          });
        }

        // ---------- Reports ----------
        const reportsEntry = screenPermissions.find(
          (sp: any) => sp.serviceName === "reports",
        );
        if (reportsEntry) {
          const reportsScreens = reportsEntry.screens || [];
          const reportsGenerate = reportsScreens.find((s: any) => s.screenName === "reportsGenerate")
            ?.permissions || {};

          setReportsInitial({
            reportsGenerate: !!reportsGenerate.reportsGenerate,
          });
        }

        // ---------- Excel Upload ----------
        const excelUploadEntry = screenPermissions.find(
          (sp: any) => sp.serviceName === "excel-upload",
        );
        if (excelUploadEntry) {
          const excelUploadScreens = excelUploadEntry.screens || [];
          const excelFileManager = excelUploadScreens.find((s: any) => s.screenName === "excelFileManager")
            ?.permissions || {};

          setExcelUploadInitial({
            excelUpload: {
              excelFileManager: {
                permissions: {
                  excelUpload: !!excelFileManager.excelUpload,
                },
                isActive: !!excelFileManager.excelUpload,
              },
            },
            isActive: !!excelFileManager.excelUpload,
          });
        }

        // ---------- Challan ----------
        const challanEntry = screenPermissions.find(
          (sp: any) => sp.serviceName === "challan" || sp.tileName === "challan",
        );
        if (challanEntry) {
          const challanScreens = challanEntry.screens || [];
          const challanUpload = challanScreens.find((s: any) => s.screenName === "challanUpload")
            ?.permissions || {};

          setChallanInitial({
            upload: !!challanUpload.upload,
            view: !!challanUpload.view,
          });
        }

        // ---------- AI ----------
        const aiEntry = screenPermissions.find(
          (sp: any) => sp.serviceName === "ai" || sp.tileName === "ai",
        );
        if (aiEntry) {
          const aiScreens = aiEntry.screens || [];
          const aiChat = aiScreens.find((s: any) => s.screenName === "aiChat")
            ?.permissions || {};

          setAiInitial({
            view: !!aiChat.view,
          });
        }

        // ---------- Hr Approver ----------
        // Support both old array schema and new object schema
        const hrApproverObject =
          raw?.hrapprover && typeof raw.hrapprover === "object" && !Array.isArray(raw.hrapprover)
            ? raw.hrapprover
            : null;
        const contractEmployeeApproverFromObject = hrApproverObject?.contractEmployeeApprover;
        const companyEmployeeApproverFromObject = hrApproverObject?.companyEmployeeApprover;
        const contracerApproverFromObject = hrApproverObject?.contracerApprover;

        const hrApproverArray = Array.isArray(raw?.hrapprover) ? raw.hrapprover : [];
        const contractEmployeeApproverFromArray = hrApproverArray.find(
          (s: any) => s?.screenName === "contractEmployeeApprover",
        );
        const companyEmployeeApproverFromArray = hrApproverArray.find(
          (s: any) => s?.screenName === "companyEmployeeApprover",
        );
        const contracerApproverFromArray = hrApproverArray.find(
          (s: any) => s?.screenName === "contracerApprover",
        );

        const contractEmployeeApprover =
          contractEmployeeApproverFromObject ||
          contractEmployeeApproverFromArray ||
          defaultHrApproverPayload.hrapprover.contractEmployeeApprover;
        const companyEmployeeApprover =
          companyEmployeeApproverFromObject ||
          companyEmployeeApproverFromArray ||
          defaultHrApproverPayload.hrapprover.companyEmployeeApprover;
        const contracerApprover =
          contracerApproverFromObject ||
          contracerApproverFromArray ||
          defaultHrApproverPayload.hrapprover.contracerApprover;

        setHrApproverInitial({
          _id: normalizeRecordId(raw?._id),
          hrapprover: {
            contractEmployeeApprover: {
              permissions: {
                approve: !!contractEmployeeApprover?.permissions?.approve,
              },
              isActive:
                contractEmployeeApprover?.isActive !== false &&
                !!contractEmployeeApprover?.permissions?.approve,
            },
            companyEmployeeApprover: {
              permissions: {
                approve: !!companyEmployeeApprover?.permissions?.approve,
              },
              isActive:
                companyEmployeeApprover?.isActive !== false &&
                !!companyEmployeeApprover?.permissions?.approve,
            },
            contracerApprover: {
              permissions: {
                approve: !!contracerApprover?.permissions?.approve,
              },
              isActive:
                contracerApprover?.isActive !== false &&
                !!contracerApprover?.permissions?.approve,
            },
          },
        });

        // ---------- Application Applier ----------
        setApplicationApplierInitial({
          _id: normalizeRecordId(raw?._id),
          applicationApplier: raw?.applicationApplier && typeof raw.applicationApplier === "object"
            ? raw.applicationApplier
            : {
              punch: {
                permissions: { cancel: false, reject: false, approve: false, self: false, all: false },
                isActive: false,
              },
              outDuty: {
                permissions: { cancel: false, reject: false, approve: false, self: false, all: false },
                isActive: false,
              },
              leave: {
                permissions: { cancel: false, reject: false, approve: false, self: false, all: false },
                isActive: false,
              },
              shiftChange: {
                permissions: { cancel: false, reject: false, approve: false, self: false, all: false },
                isActive: false,
              },
              overtime: {
                permissions: { cancel: false, reject: false, approve: false, self: false, all: false },
                isActive: false,
              },
              encashment: {
                permissions: { cancel: false, reject: false, approve: false, self: false, all: false },
                isActive: false,
              },
              compOff: {
                permissions: { cancel: false, reject: false, approve: false, self: false, all: false },
                isActive: false,
              },
              specialLeave: {
                permissions: { cancel: false, reject: false, approve: false, self: false, all: false },
                isActive: false,
              },
              isActive: false,
            },
        });

        // ---------- Application Approver ----------
        setApplicationApproverInitial({
          _id: normalizeRecordId(raw?._id),
          applicationApprover: raw?.applicationApprover && typeof raw.applicationApprover === "object"
            ? raw.applicationApprover
            : {
              punch: {
                permissions: { cancel: false, reject: false, approve: false },
                isActive: false,
              },
              outDuty: {
                permissions: { cancel: false, reject: false, approve: false },
                isActive: false,
              },
              leave: {
                permissions: { cancel: false, reject: false, approve: false },
                isActive: false,
              },
              shiftChange: {
                permissions: { cancel: false, reject: false, approve: false },
                isActive: false,
              },
              overtime: {
                permissions: { cancel: false, reject: false, approve: false },
                isActive: false,
              },
              encashment: {
                permissions: { cancel: false, reject: false, approve: false },
                isActive: false,
              },
              compOff: {
                permissions: { cancel: false, reject: false, approve: false },
                isActive: false,
              },
              specialLeave: {
                permissions: { cancel: false, reject: false, approve: false },
                isActive: false,
              },
              isActive: false,
            },
        });
      } catch (e) {
        console.error("Error processing role data:", e);
      }
    },
    onError: (error) => {
      console.error("Error fetching role data:", error);
    },
  });

  useEffect(() => {
    if (selectedEntitlementCode) {
      fetchRole();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEntitlementCode]);

  const isPermissionTabRequired = React.useCallback(
    (configKey: string) => {
      if (permissionFormStructureLoading) return false;
      const sectionConfig = (permissionFormStructure as Record<string, unknown> | null)?.[configKey];
      if (!sectionConfig || typeof sectionConfig !== "object") return false;
      const tabRequired = (sectionConfig as { tabRequired?: boolean }).tabRequired;
      return typeof tabRequired === "boolean" ? tabRequired : false;
    },
    [permissionFormStructure, permissionFormStructureLoading],
  );

  const showMasterContractor = isPermissionTabRequired("masterContractor");
  const showMasterEmployee = isPermissionTabRequired("masterEmployee");
  const showMasterAdvance = isPermissionTabRequired("masterAdvance");

  const sidebarVisibilityMap: Record<string, boolean> = React.useMemo(
    () => ({
      masterOrganization: isPermissionTabRequired("masterOrganization"),
      masterContractor:
        showMasterContractor || showMasterEmployee || showMasterAdvance,
      masterPolicy: isPermissionTabRequired("masterPolicy"),
      musterPermissions: isPermissionTabRequired("muster"),
      masterWage: isPermissionTabRequired("masterWage"),
      masterEwa: isPermissionTabRequired("masterEwa"),
      masterBgm: isPermissionTabRequired("masterBgm"),
      dashboard: isPermissionTabRequired("dashboard"),
      personalDashboard: isPermissionTabRequired("personalDashboard"),
      csoDashboard: isPermissionTabRequired("csoDashboard"),
      managerDashboard: isPermissionTabRequired("managerDashboard"),
      reports: isPermissionTabRequired("reports"),
      excelUpload: isPermissionTabRequired("excelUpload"),
      challan: isPermissionTabRequired("challan"),
      ai: isPermissionTabRequired("ai"),
      applicationApplier: isPermissionTabRequired("applicationApplier"),
      applicationApprover: isPermissionTabRequired("applicationApprover"),
      approver: isPermissionTabRequired("hrApprover"),
      rolePermissions: isPermissionTabRequired("roleControl"),
    }),
    [isPermissionTabRequired, showMasterAdvance, showMasterContractor, showMasterEmployee],
  );

  const sections = [
    {
      title: "Master",
      items: [
        { id: "masterOrganization", label: "Organization", icon: "grid" },
        { id: "masterContractor", label: "Management", icon: "file-text" },
        { id: "masterPolicy", label: "Policy", icon: "file-text" },
      ],
    },
    {
      title: "Muster",
      items: [{ id: "musterPermissions", label: "Muster Permissions", icon: "grid" }],
    },
    {
      title: "Wage",
      items: [{ id: "masterWage", label: "Wage Permissions", icon: "file-text" }],
    },
    {
      title: "EWA",
      items: [{ id: "masterEwa", label: "EWA Permissions", icon: "file-text" }],
    },
    {
      title: "BGM",
      items: [{ id: "masterBgm", label: "BGM Permissions", icon: "file-text" }],
    },
    {
      title: "Dashboard",
      items: [
        { id: "dashboard", label: "Dashboard Permissions", icon: "grid" },
        { id: "personalDashboard", label: "Personal Dashboard", icon: "grid" },
        { id: "csoDashboard", label: "CXO Dashboard", icon: "grid" },
        { id: "managerDashboard", label: "Manager Dashboard", icon: "grid" },
      ],
    },
    {
      title: "Reports",
      items: [{ id: "reports", label: "Reports Permissions", icon: "file-text" }],
    },
    {
      title: "Excel Upload",
      items: [{ id: "excelUpload", label: "Excel Upload Permissions", icon: "file-text" }],
    },
    {
      title: "Challan",
      items: [{ id: "challan", label: "Challan Permissions", icon: "file-text" }],
    },
    {
      title: "AI",
      items: [{ id: "ai", label: "AI Permissions", icon: "file-text" }],
    },
    {
      title: "Applications",
      items: [
        // { id: "punchApplication", label: "Punch Application", icon: "clock" },
        // { id: "shiftApplication", label: "Shift Application", icon: "calendar" },
        // { id: "outDutyApplication", label: "Out Duty Application", icon: "map-pin" },
        // { id: "otApplication", label: "OT Application", icon: "timer" },
        // { id: "encashmentApplication", label: "Encashment Application", icon: "calendar" },
        // { id: "compoffApplication", label: "Comp-Off Application", icon: "calendar" },
        // { id: "leaveApplication", label: "Leave Application", icon: "calendar" },
        { id: "applicationApplier", label: "Application Applier", icon: "file-text" },
        { id: "applicationApprover", label: "Application Approver", icon: "shield-check" },
      ],
    },
    {
      title: "Hr Approver",
      items: [{ id: "approver", label: "Hr Approver", icon: "shield-check" }],
    },
    {
      title: "Role & Permissions",
      items: [{ id: "rolePermissions", label: "Role & Permissions", icon: "file-text" }],
    },
  ];

  const visibleSections = React.useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => sidebarVisibilityMap[item.id] ?? true),
        }))
        .filter((section) => section.items.length > 0),
    [sections, sidebarVisibilityMap],
  );

  const visibleItemIds = React.useMemo(
    () => visibleSections.flatMap((section) => section.items.map((item) => item.id)),
    [visibleSections],
  );

  const isEmptyPermissionFormStructure =
    !permissionFormStructure ||
    (Array.isArray(permissionFormStructure) && permissionFormStructure.length === 0) ||
    (!Array.isArray(permissionFormStructure) && Object.keys(permissionFormStructure).length === 0);

  const resolvedActiveId =
    visibleItemIds.includes(activeId) ? activeId : visibleItemIds[0] || activeId;

  const refreshRole = async () => {
    await fetchRole();
  };
  const renderContent = () => {
    switch (resolvedActiveId) {
      case "masterOrganization":
        return (
          <MasterOrganizationForm
            initialData={masterOrganizationInitial || undefined}
            onSave={() => { }}
            mode={masterOrganizationInitial ? "edit" : "add"}
          />
        );
      case "masterContractor":
        return (
          <div className="space-y-6">
            {showMasterContractor && (
              <MasterContractorForm
                initialData={masterContractorInitial || undefined}
                onSave={() => { }}
                mode={masterContractorInitial ? "edit" : "add"}
              />
            )}
            {showMasterEmployee && (
              <MasterEmployeeForm
                initialData={masterEmployeeInitial || undefined}
                onSave={() => { }}
                mode={masterEmployeeInitial ? "edit" : "add"}
              />
            )}
            {showMasterAdvance && (
              <MasterAdvanceForm
                initialData={masterAdvanceInitial || undefined}
                onSave={() => { }}
                mode={masterAdvanceInitial ? "edit" : "add"}
              />
            )}
          </div>
        );
      case "masterPolicy":
        return (
          <MasterPolicyForm
            initialData={masterPolicyInitial || undefined}
            onSave={() => { }}
            mode={masterPolicyInitial ? "edit" : "add"}
          />
        );
      case "rolePermissions":
        return (
          <RolePermissionForm
            recordId={normalizeRecordId(fullEntitlement?._id)}
            entitlementCode={fullEntitlement?.entitlementCode}
            onSave={() => { }}
            mode={normalizeRecordId(fullEntitlement?._id) ? "edit" : "add"}
          />
        );
      case "masterWage":
        return (
          <MasterWageForm
            initialData={masterWageInitial || undefined}
            onSave={() => { }}
            mode={masterWageInitial ? "edit" : "add"}
          />
        );
      case "masterEwa":
        return (
          <MasterEwaForm
            initialData={masterEwaInitial || undefined}
            onSave={() => { }}
            mode={masterEwaInitial ? "edit" : "add"}
          />
        );
      case "masterBgm":
        return (
          <MasterBgmForm
            initialData={masterBgmInitial || undefined}
            onSave={() => { }}
            mode={masterBgmInitial ? "edit" : "add"}
          />
        );
      case "musterPermissions":
        return (
          <MusterPermissionForm
            onSave={() => { }}
            onSaveAddNewPunch={() => { }}
            mode={musterInitial ? "edit" : "add"}
          />
        );
      case "outDutyApplication":
        return (
          <FormApplication
            initialData={outDutyInitial || undefined}
            onSave={() => { }}
            mode={outDutyInitial ? "edit" : "add"}
          />
        );
      case "punchApplication":
        return (
          <PunchMusterPermissionsForm
            initialData={punchApplicationInitial || undefined}
            onSave={() => { }}
            mode={punchApplicationInitial ? "edit" : "add"}
          />
        );
      case "shiftApplication":
        return (
          <ShiftFormApplication
            initialData={shiftInitial || undefined}
            onSave={() => { }}
            mode={shiftInitial ? "edit" : "add"}
          />
        );
      case "otApplication":
        return (
          <OtFormApplication
            initialData={otInitial || undefined}
            onSave={() => { }}
            mode={otInitial ? "edit" : "add"}
          />
        );
      case "encashmentApplication":
        return (
          <LeaveEncashmentFormApplication
            initialData={encashmentInitial || undefined}
            onSave={() => { }}
            mode={encashmentInitial ? "edit" : "add"}
          />
        );
      case "compoffApplication":
        return (
          <CompOffFormApplication
            initialData={compOffInitial || undefined}
            onSave={() => { }}
            mode={compOffInitial ? "edit" : "add"}
          />
        );
      case "leaveApplication":
        return (
          <LeaveFormApplication
            initialData={leaveInitial || undefined}
            onSave={() => { }}
            mode={leaveInitial ? "edit" : "add"}
          />
        );
      case "dashboard":
        return (
          <DashboardForm
            initialData={dashboardInitial || undefined}
            onSave={() => { }}
            mode={dashboardInitial ? "edit" : "add"}
          />
        );
      case "personalDashboard":
        return (
          <PersonalDashboardForm
            initialData={personalDashboardInitial || undefined}
            onSave={() => { }}
            mode={personalDashboardInitial ? "edit" : "add"}
          />
        );
      case "csoDashboard":
        return (
          <CsoDashboardForm
            initialData={csoDashboardInitial || undefined}
            onSave={() => { }}
            mode={csoDashboardInitial ? "edit" : "add"}
          />
        );
      case "managerDashboard":
        return (
          <ManagerDashboardForm
            initialData={managerDashboardInitial || undefined}
            onSave={() => { }}
            mode={managerDashboardInitial ? "edit" : "add"}
          />
        );
      case "reports":
        return (
          <ReportsForm
            initialData={reportsInitial || undefined}
            onSave={() => { }}
            mode={reportsInitial ? "edit" : "add"}
          />
        );
      case "excelUpload":
        return (
          <ExcelUploadForm
            recordId={normalizeRecordId(fullEntitlement?._id)}
            onSave={() => { }}
            mode={excelUploadInitial ? "edit" : "add"}
          />
        );
      case "challan":
        return (
          <ChallanForm
            initialData={challanInitial || undefined}
            onSave={() => { }}
            mode={challanInitial ? "edit" : "add"}
          />
        );
      case "ai":
        return (
          <AiForm
            initialData={aiInitial || undefined}
            onSave={() => { }}
            mode={aiInitial ? "edit" : "add"}
          />
        );
      case "approver":
        return (
          <HrApproverForm
            initialData={hrApproverInitial || undefined}
            recordId={hrApproverRecordId}
            entitlementCode={fullEntitlement?.entitlementCode}
            onSave={refreshRole}
            mode={hrApproverInitial ? "edit" : "add"}
          />
        );
      case "applicationApplier":
        return (
          <ApplicationApplierForm
            initialData={applicationApplierInitial || undefined}
            onSave={refreshRole}
            mode={applicationApplierInitial ? "edit" : "add"}
          />
        );
      case "applicationApprover":
        return (
          <ApplicationApproverForm
            initialData={applicationApproverInitial || undefined}
            onSave={refreshRole}
            mode={applicationApproverInitial ? "edit" : "add"}
          />
        );
      default:
        return <div>Select an application from the sidebar</div>;
    }
  };

  const handleSidebarClick = (id: string) => {
    if (selectedEntitlementCode) {
      // Update URL with new form ID while keeping entitlementCode
      router.push(`/hierarchy/permission?entitlementCode=${selectedEntitlementCode}&form=${id}`);
    }
  };

  const handleViewMore = (role: { entitlementCode: string }) => {
    // Navigate to form view with entitlementCode and default form
    const defaultForm = visibleItemIds[0] || "masterOrganization";
    router.push(`/hierarchy/permission?entitlementCode=${role.entitlementCode}&form=${defaultForm}`);
  };

  const handleBackToTable = () => {
    // Navigate back to base URL (table view)
    router.push('/hierarchy/permission');
  };

  // If not in form mode, show the RoleTable (similar to contractor-employee pattern)
  if (!isFormMode) {
    return (
      <RoleTable
        onCreate={() => { }}
        onViewMore={handleViewMore}
      />
    );
  }

  if (permissionFormStructureLoading || isEmptyPermissionFormStructure) {
    return null;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] overflow-hidden relative">
      {selectedEntitlementCode && (
        <PermissionHeader
          entitlementCode={selectedEntitlementCode}
          onBack={handleBackToTable}
        />
      )}
      <div className="flex justify-center flex-1 overflow-hidden">
        <div className="w-full max-w-7xl h-full flex flex-col">
          <div className="flex w-full h-full overflow-hidden">
            <div className="flex-shrink-0 h-full">
              <Sidebar
                sections={visibleSections}
                activeId={resolvedActiveId}
                onItemClick={handleSidebarClick}
              />
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 pt-6 min-w-0">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


