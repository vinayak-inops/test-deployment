"use client";

import React from "react";
import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VerticalSidebar } from "@/components/tab/vertica-sidebar-tab";
import WfhApplication from "./wfh-application";
import WfhApplicationApprover from "./wfh-application-approver";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import WfhApplicationHeader from "./wfh-application-header";
import WfhCalendar from "./wfh-calendar";

type WfhTab = "wfhCalendar" | "wfhApplication" | "wfhApprover";

export default function WfhApplicationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "applicationApplier",
    screenName: "wfh",
  });
  const { responseData: roleApprover } = useRolePermissions({
    serviceName: "applicationApprover",
    screenName: "wfh",
  });

  const canViewApps = !!(rolePermissions?.self || rolePermissions?.all);
  const isSelfPermission = !!rolePermissions?.self;
  const isAllPermission = !!rolePermissions?.all;
  const isApprovalPermission = !!(
    rolePermissions?.approve ||
    rolePermissions?.reject ||
    rolePermissions?.cancel ||
    roleApprover?.approve ||
    roleApprover?.reject ||
    roleApprover?.cancel
  );
  const isApproverPermission =
    !!rolePermissions?.approve || !!roleApprover?.approve;
  const availableTabs = useMemo<WfhTab[]>(() => {
    const tabs: WfhTab[] = [];
    if (canViewApps) tabs.push("wfhCalendar", "wfhApplication");
    if (isApproverPermission) tabs.push("wfhApprover");
    return tabs;
  }, [canViewApps, isApproverPermission]);

  const activeId = useMemo<WfhTab>(() => {
    const tab = searchParams.get("tab") as WfhTab | null;
    if (tab && availableTabs.includes(tab)) return tab;
    return availableTabs[0] || "wfhApplication";
  }, [searchParams, availableTabs]);

  const sections = useMemo(() => {
    const items = [];
    if (canViewApps) {
      items.push(
        { id: "wfhCalendar", label: "WFH Calendar", icon: "grid" },
        { id: "wfhApplication", label: "WFH Application", icon: "book" },
      );
    }
    if (isApproverPermission) {
      items.push({ id: "wfhApprover", label: "WFH Approver", icon: "search" });
    }
    return [{ title: "WFH", items }];
  }, [canViewApps, isApproverPermission]);

  const handleItemClick = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", id);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      {(canViewApps || isApproverPermission) && (
          <WfhApplicationHeader
            title="WFH Applications"
            description="Manage work from home calendar, applications, and approvals"
            onRefilter={() => {
              // placeholder: wire to filters if needed
            }}
            onAddNew={() => {
              // placeholder: could open a create form if needed
            }}
          />
        )}
      <div className="flex justify-center">
        <div className="w-full max-w-7xl ">

        {availableTabs.length > 0 ? (
          <div className="flex w-full">
            <VerticalSidebar
              sections={sections}
              activeId={activeId}
              onItemClick={handleItemClick}
            />
            <div className="flex-1 overflow-auto pb-6 pt-0">
              {activeId === "wfhCalendar" && (
                <WfhCalendar
                  isSelfPermission={isSelfPermission}
                  isAllPermission={isAllPermission}
                />
              )}
              {activeId === "wfhApplication" && (
                <WfhApplication
                  isSelfPermission={isSelfPermission}
                  isAllPermission={isAllPermission}
                  isApprovalPermission={isApprovalPermission}
                />
              )}
              {activeId === "wfhApprover" && (
                <WfhApplicationApprover
                  isApprovalPermission={isApprovalPermission}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="px-5 py-10">
            <div className="max-w-2xl mx-auto text-center border border-yellow-200 bg-yellow-50 rounded-md p-6">
              <h2 className="text-sm font-semibold text-gray-800">
                Access Restricted
              </h2>
              <p className="text-xs text-gray-600 mt-1">
                You do not have permission to view WFH Applications. Please
                contact your administrator.
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
