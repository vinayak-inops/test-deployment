import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Bearer token is required" }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const body = await request.json();
    const {
      entitlementCode,
      tenantCode,
      data, // payload from Out Duty form
    } = body;

    if (!entitlementCode || !tenantCode) {
      return NextResponse.json(
        { error: "entitlementCode and tenantCode are required" },
        { status: 400 },
      );
    }

    // 1) Load current role_permissions from original backend
    const searchBody = [
      { field: "tenantCode", value: tenantCode, operator: "eq" },
      { field: "entitlementCode", value: entitlementCode, operator: "eq" },
    ];

    const queryRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/query/attendance/role_permissions/search`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(searchBody),
      },
    );

    if (!queryRes.ok) {
      const text = await queryRes.text();
      return NextResponse.json(
        { error: "Failed to load role permissions", details: text },
        { status: queryRes.status },
      );
    }

    const list = await queryRes.json();
    const base = Array.isArray(list) ? list[0] : list;
    const existingScreenPermissions: any[] = base?.screenPermissions || [];

    let outDutyEntryFound = false;

    const updatedScreenPermissions = existingScreenPermissions.map((sp) => {
      if (!(sp.serviceName === "outDuty" || sp.tileName === "outDuty-application")) {
        return sp;
      }

      outDutyEntryFound = true;
      const existingScreens = sp.screens || [];

      let outDutyManagementScreen = existingScreens.find((s: any) => s.screenName === "outDutyManagement");
      let outDutyApplicationScreen = existingScreens.find((s: any) => s.screenName === "outDutyApplication");

      if (!outDutyManagementScreen) {
        outDutyManagementScreen = { screenName: "outDutyManagement", permissions: {} };
      }
      if (!outDutyApplicationScreen) {
        outDutyApplicationScreen = { screenName: "outDutyApplication", permissions: {} };
      }

      const updatedOutDutyManagement = {
        ...outDutyManagementScreen,
        permissions: {
          ...(outDutyManagementScreen.permissions || {}),
          outDutychApplicationsSelf: !!data.outDutychApplicationsSelf,
          outDutyApplicationsAll: !!data.outDutyApplicationsAll,
          outDutyApplicationsSelfCancel: !!data.outDutyApplicationsSelfCancel,
          outDutyApplicationsAllCancel: !!data.outDutyApplicationsAllCancel,
          outDutyApplicationApprover: !!data.outDutyApplicationApprover,
        },
      };

      const updatedOutDutyApplication = {
        ...outDutyApplicationScreen,
        permissions: {
          ...(outDutyApplicationScreen.permissions || {}),
          outDutyApplicationsCancel: !!data.outDutyApplicationsCancel,
          outDutyApplicationsApprove: !!data.outDutyApplicationsApprove,
          outDutyApplicationsReject: !!data.outDutyApplicationsReject,
        },
      };

      const outDutyManagementPerms = updatedOutDutyManagement.permissions || {};
      const outDutyManagementIsActive = Object.values(outDutyManagementPerms).some((v) => !!v);

      const outDutyApplicationPerms = updatedOutDutyApplication.permissions || {};
      const outDutyApplicationIsActive = Object.values(outDutyApplicationPerms).some((v) => !!v);

      const mergedScreens = existingScreens
        .filter((s: any) => s.screenName !== "outDutyManagement" && s.screenName !== "outDutyApplication")
        .map((screen: any) => {
          const perms = screen.permissions || {};
          const screenIsActive = Object.values(perms).some((v) => !!v);
          return {
            ...screen,
            isActive: screenIsActive,
          };
        });

      mergedScreens.push({
        ...updatedOutDutyManagement,
        isActive: outDutyManagementIsActive,
      });

      mergedScreens.push({
        ...updatedOutDutyApplication,
        isActive: outDutyApplicationIsActive,
      });

      const isActive = mergedScreens.some((screen: any) => {
        const perms = screen.permissions || {};
        return Object.values(perms).some((v) => !!v);
      });

      return {
        ...sp,
        screens: mergedScreens,
        isActive,
      };
    });

    // If outDuty entry doesn't exist, create it
    if (!outDutyEntryFound) {
      const newOutDutyManagement = {
        screenName: "outDutyManagement",
        permissions: {
          outDutychApplicationsSelf: !!data.outDutychApplicationsSelf,
          outDutyApplicationsAll: !!data.outDutyApplicationsAll,
          outDutyApplicationsSelfCancel: !!data.outDutyApplicationsSelfCancel,
          outDutyApplicationsAllCancel: !!data.outDutyApplicationsAllCancel,
          outDutyApplicationApprover: !!data.outDutyApplicationApprover,
        },
      };
      const newOutDutyApplication = {
        screenName: "outDutyApplication",
        permissions: {
          outDutyApplicationsCancel: !!data.outDutyApplicationsCancel,
          outDutyApplicationsApprove: !!data.outDutyApplicationsApprove,
          outDutyApplicationsReject: !!data.outDutyApplicationsReject,
        },
      };

      const outDutyManagementPerms = newOutDutyManagement.permissions || {};
      const outDutyManagementIsActive = Object.values(outDutyManagementPerms).some((v) => !!v);

      const outDutyApplicationPerms = newOutDutyApplication.permissions || {};
      const outDutyApplicationIsActive = Object.values(outDutyApplicationPerms).some((v) => !!v);

      const isActive = outDutyManagementIsActive || outDutyApplicationIsActive;

      updatedScreenPermissions.push({
        serviceName: "outDuty",
        tileName: "outDuty-application",
        screens: [
          {
            ...newOutDutyManagement,
            isActive: outDutyManagementIsActive,
          },
          {
            ...newOutDutyApplication,
            isActive: outDutyApplicationIsActive,
          },
        ],
        isActive,
      });
    }

    const payload = {
      ...base,
      screenPermissions: updatedScreenPermissions,
    };

    const commandBody = {
      tenant: tenantCode,
      action: "insert",
      collectionName: "role_permissions",
      data: payload,
      id: payload._id,
    };

    const cmdRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/command/attendance/role_permissions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(commandBody),
      },
    );

    const cmdData = await cmdRes.json();

    if (!cmdRes.ok) {
      return NextResponse.json(
        { error: "Failed to save role permissions", details: cmdData },
        { status: cmdRes.status },
      );
    }

    return NextResponse.json(cmdData);
  } catch (error) {
    console.error("Error in /api/permissions/out-duty:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


