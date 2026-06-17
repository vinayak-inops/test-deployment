"use client";

import DashboardCards from "./_components/DashboardCards";
import { navItems } from "@/json/menu/menu";
import Header from "@/components/header/header";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import ServiceName from "./_components/service-name";

export default function Home() {
  const router = useRouter();

  const { responseData: shiftApplierPerms } = useRolePermissions({
    serviceName: "applicationApplier",
    screenName: "shiftChange",
  });
  const { responseData: shiftApproverPerms } = useRolePermissions({
    serviceName: "applicationApprover",
    screenName: "shiftChange",
  });

  const { responseData: otApplierPerms } = useRolePermissions({
    serviceName: "applicationApplier",
    screenName: "overtime",
  });
  const { responseData: otApproverPerms } = useRolePermissions({
    serviceName: "applicationApprover",
    screenName: "overtime",
  });

  const { responseData: outDutyApplierPerms } = useRolePermissions({
    serviceName: "applicationApplier",
    screenName: "outDuty",
  });
  const { responseData: outDutyApproverPerms } = useRolePermissions({
    serviceName: "applicationApprover",
    screenName: "outDuty",
  });

  const { responseData: compOffApplierPerms } = useRolePermissions({
    serviceName: "applicationApplier",
    screenName: "compOff",
  });
  const { responseData: compOffApproverPerms } = useRolePermissions({
    serviceName: "applicationApprover",
    screenName: "compOff",
  });

  const { responseData: encashmentApplierPerms } = useRolePermissions({
    serviceName: "applicationApplier",
    screenName: "encashment",
  });
  const { responseData: encashmentApproverPerms } = useRolePermissions({
    serviceName: "applicationApprover",
    screenName: "encashment",
  });

  const { responseData: leaveApplierPerms } = useRolePermissions({
    serviceName: "applicationApplier",
    screenName: "leave",
  });
  const { responseData: leaveApproverPerms } = useRolePermissions({
    serviceName: "applicationApprover",
    screenName: "leave",
  });

  const { responseData: specialLeaveApplierPerms } = useRolePermissions({
    serviceName: "applicationApplier",
    screenName: "specialLeave",
  });
  const { responseData: specialLeaveApproverPerms } = useRolePermissions({
    serviceName: "applicationApprover",
    screenName: "specialLeave",
  });

  const { responseData: punchApplierPerms } = useRolePermissions({
    serviceName: "applicationApplier",
    screenName: "punch",
  });
  const { responseData: punchApproverPerms } = useRolePermissions({
    serviceName: "applicationApprover",
    screenName: "punch",
  });
  const { responseData: wfhApplierPerms } = useRolePermissions({
    serviceName: "applicationApplier",
    screenName: "wfh",
  });
  const { responseData: wfhApproverPerms } = useRolePermissions({
    serviceName: "applicationApprover",
    screenName: "wfh",
  });

  const canShiftApplications = !!(
    shiftApplierPerms?.self ||
    shiftApplierPerms?.all ||
    shiftApproverPerms?.approve ||
    shiftApproverPerms?.reject ||
    shiftApproverPerms?.cancel
  );

  const canOtApplications = !!(
    otApplierPerms?.self ||
    otApplierPerms?.all ||
    otApproverPerms?.approve ||
    otApproverPerms?.reject ||
    otApproverPerms?.cancel
  );

  const canOutDutyApplications = !!(
    outDutyApplierPerms?.self ||
    outDutyApplierPerms?.all ||
    outDutyApproverPerms?.approve ||
    outDutyApproverPerms?.reject ||
    outDutyApproverPerms?.cancel
  );

  const canCompOffApplications = !!(
    compOffApplierPerms?.self ||
    compOffApplierPerms?.all ||
    compOffApproverPerms?.approve ||
    compOffApproverPerms?.reject ||
    compOffApproverPerms?.cancel
  );

  const canEncashmentApplications = !!(
    encashmentApplierPerms?.self ||
    encashmentApplierPerms?.all ||
    encashmentApproverPerms?.approve ||
    encashmentApproverPerms?.reject ||
    encashmentApproverPerms?.cancel
  );

  const canLeaveApplications = !!(
    leaveApplierPerms?.self ||
    leaveApplierPerms?.all ||
    leaveApproverPerms?.approve ||
    leaveApproverPerms?.reject ||
    leaveApproverPerms?.cancel
  );

  const canSpecialLeaveApplications = !!(
    specialLeaveApplierPerms?.self ||
    specialLeaveApplierPerms?.all ||
    specialLeaveApproverPerms?.approve ||
    specialLeaveApproverPerms?.reject ||
    specialLeaveApproverPerms?.cancel
  );

  const canPunchApplications = !!(
    punchApplierPerms?.self ||
    punchApplierPerms?.all ||
    punchApproverPerms?.approve ||
    punchApproverPerms?.reject ||
    punchApproverPerms?.cancel
  );
  const canWfhApplications = !!(
    wfhApplierPerms?.self ||
    wfhApplierPerms?.all ||
    wfhApproverPerms?.approve ||
    wfhApproverPerms?.reject ||
    wfhApproverPerms?.cancel
  );

  const applicationCards = useMemo(
    () => [
      {
        title: "Leave Management",
        description: "Apply and manage leave and special leave requests.",
        badge: "Leave",
        iconBg: "bg-sky-100",
        iconColor: "text-sky-600",
        borderHover: "hover:border-sky-300",
        path: "M8 7V3m8 4V3m-9 8h10m-11 8h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z",
        visible: canLeaveApplications || canSpecialLeaveApplications,
        onClick: () => router.push("/leave/leave-management-contractor"),
      },
      {
        title: "Punch Application",
        description: "Submit and manage punch change requests.",
        badge: "Punch",
        iconBg: "bg-yellow-100",
        iconColor: "text-yellow-700",
        borderHover: "hover:border-yellow-300",
        path: "M12 6v6h4m5 0a9 9 0 11-18 0 9 9 0 0118 0z",
        visible: canPunchApplications,
        onClick: () => router.push("/muster/punch/punch-application"),
      },
      {
        title: "Shift Application",
        description: "Submit and track employee shift change applications.",
        badge: "Scheduling",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        borderHover: "hover:border-blue-300",
        path: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        visible: canShiftApplications,
        onClick: () => router.push("/application/shift-management/shift-application"),
      },
      {
        title: "OT Application",
        description: "Create overtime requests and review approval status.",
        badge: "Time",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        borderHover: "hover:border-green-300",
        path: "M12 6v6m0 0v6m0-6h6m-6 0H6",
        visible: canOtApplications,
        onClick: () => router.push("/application/ot-management/ot-application"),
      },
      {
        title: "Out Duty Application",
        description: "Apply out-duty requests with date and movement details.",
        badge: "Movement",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        borderHover: "hover:border-amber-300",
        path: "M8 7V3m8 4V3m-9 8h10m-11 8h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z",
        visible: canOutDutyApplications,
        onClick: () => router.push("/application/out-duty-management/out-duty-application"),
      },
      {
        title: "Comp Off Application",
        description: "Apply for compensatory off for overtime work.",
        badge: "Comp Off",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        borderHover: "hover:border-amber-300",
        path: "M4 6a2 2 0 012-2h12a2 2 0 012 2v1H4V6zm0 3h16v9a2 2 0 01-2 2H6a2 2 0 01-2-2V9zm7 2v5m-2.5-2.5h5",
        visible: canCompOffApplications,
        onClick: () => router.push("/leave/leave-management/compoff-application"),
      },
      {
        title: "WFH Application",
        description: "Apply and manage work from home requests.",
        badge: "WFH",
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
        borderHover: "hover:border-indigo-300",
        path: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
        visible: canWfhApplications,
        onClick: () => router.push("/leave/leave-management/wfh-application"),
      },
      {
        title: "Leave Encashment",
        description: "Convert unused leave days to cash.",
        badge: "Encashment",
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
        borderHover: "hover:border-purple-300",
        path: "M12 8c-1.657 0-3-1.12-3-2.5S10.343 3 12 3s3 1.12 3 2.5S13.657 8 12 8zm7 3H5a2 2 0 00-2 2v3a5 5 0 005 5h8a5 5 0 005-5v-3a2 2 0 00-2-2z",
        visible: canEncashmentApplications,
        onClick: () => router.push("/leave/leave-management/encashment-management"),
      },
    ],
    [
      canCompOffApplications,
      canEncashmentApplications,
      canLeaveApplications,
      canOtApplications,
      canOutDutyApplications,
      canPunchApplications,
      canShiftApplications,
      canSpecialLeaveApplications,
      canWfhApplications,
      router,
    ]
  );

  const visibleApplicationCards = applicationCards.filter((card) => card.visible);

  return (
    <>
      <div className="sticky top-0 z-[100]">
        <Header serviceName="Main" navItems={navItems} />
      </div>

      <div className="mx-auto w-full  px-12 py-6 lg:px-6 xl:h-[calc(100dvh-88px)] xl:overflow-hidden">
        <div className="grid grid-cols-1 gap-6 xl:h-full xl:grid-cols-[70%_30%]">
          <div className="min-w-0 xl:h-full xl:overflow-y-auto xl:pr-1">
            <DashboardCards />
            {/* <ServiceName/> */}
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-50 p-5 shadow-sm xl:h-full xl:overflow-y-auto">
            <div className="mb-5 rounded-xl">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold tracking-wide text-slate-700">APPLICATIONS & DATA ENTRY</h2>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">?</span>
              </div>
            </div>

            <div className="space-y-3">
              {visibleApplicationCards.map((card) => (
                <button
                  key={card.title}
                  onClick={card.onClick}
                  className={`group w-full rounded-xl border border-slate-200 bg-white p-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${card.borderHover}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-xl ${card.iconBg} transition-transform duration-200 group-hover:scale-105`}>
                      <svg className={`h-4 w-4 ${card.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.path} />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between gap-2  ">
                        <h3 className="truncate text-sm font-semibold text-slate-900 mt-1">{card.title}</h3>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">{card.badge}</span>
                      </div>
                      {/* <p className="text-xs leading-5 text-slate-600">{card.description}</p> */}
                    </div>
                  </div>
                </button>
              ))}
              {visibleApplicationCards.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                  No application modules available with your current permissions.
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
