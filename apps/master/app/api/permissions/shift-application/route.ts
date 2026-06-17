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
    data,
  } = body;

  if (!entitlementCode || !tenantCode) {
      return NextResponse.json(
      { error: "entitlementCode and tenantCode are required" },
        { status: 400 },
      );
    }

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

    let shiftEntryFound = false;

    const updatedScreenPermissions = existingScreenPermissions.map((sp) => {
      if (!(
        sp.serviceName === "shiftApplication" ||
        sp.tileName === "shift-application"
      )) {
        return sp;
      }

      shiftEntryFound = true;
      const existingScreens = sp.screens || [];

      let shiftManagementScreen = existingScreens.find((s: any) => s.screenName === "shiftManagement");
      let shiftApplicationScreen = existingScreens.find((s: any) => s.screenName === "shiftApplication");

      if (!shiftManagementScreen) {
        shiftManagementScreen = { screenName: "shiftManagement", permissions: {} };
      }
      if (!shiftApplicationScreen) {
        shiftApplicationScreen = { screenName: "shiftApplication", permissions: {} };
      }

      const updatedShiftManagement = {
        ...shiftManagementScreen,
        permissions: {
          ...(shiftManagementScreen.permissions || {}),
          shiftchApplicationsSelf: !!data.shiftchApplicationsSelf,
          shiftApplicationsAll: !!data.shiftApplicationsAll,
          shiftApplicationsSelfCancel: !!data.shiftApplicationsSelfCancel,
          shiftApplicationsAllCancel: !!data.shiftApplicationsAllCancel,
          shiftApplicationApprover: !!data.shiftApplicationApprover,
        },
      };

      const updatedShiftApplication = {
        ...shiftApplicationScreen,
        permissions: {
          ...(shiftApplicationScreen.permissions || {}),
          shiftApplicationsCancel: !!data.shiftApplicationsCancel,
          shiftApplicationsApprove: !!data.shiftApplicationsApprove,
          shiftApplicationsReject: !!data.shiftApplicationsReject,
        },
      };

      const shiftManagementPerms = updatedShiftManagement.permissions || {};
      const shiftManagementIsActive = Object.values(shiftManagementPerms).some((v) => !!v);

      const shiftApplicationPerms = updatedShiftApplication.permissions || {};
      const shiftApplicationIsActive = Object.values(shiftApplicationPerms).some((v) => !!v);

      const mergedScreens = existingScreens
        .filter((s: any) => s.screenName !== "shiftManagement" && s.screenName !== "shiftApplication")
        .map((screen: any) => {
          const perms = screen.permissions || {};
          const screenIsActive = Object.values(perms).some((v) => !!v);
          return {
            ...screen,
            isActive: screenIsActive,
          };
        });

      mergedScreens.push({
        ...updatedShiftManagement,
        isActive: shiftManagementIsActive,
      });

      mergedScreens.push({
        ...updatedShiftApplication,
        isActive: shiftApplicationIsActive,
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

    // If shift entry doesn't exist, create it
    if (!shiftEntryFound) {
      const newShiftManagement = {
        screenName: "shiftManagement",
        permissions: {
          shiftchApplicationsSelf: !!data.shiftchApplicationsSelf,
          shiftApplicationsAll: !!data.shiftApplicationsAll,
          shiftApplicationsSelfCancel: !!data.shiftApplicationsSelfCancel,
          shiftApplicationsAllCancel: !!data.shiftApplicationsAllCancel,
          shiftApplicationApprover: !!data.shiftApplicationApprover,
        },
      };
      const newShiftApplication = {
        screenName: "shiftApplication",
        permissions: {
          shiftApplicationsCancel: !!data.shiftApplicationsCancel,
          shiftApplicationsApprove: !!data.shiftApplicationsApprove,
          shiftApplicationsReject: !!data.shiftApplicationsReject,
        },
      };

      const shiftManagementPerms = newShiftManagement.permissions || {};
      const shiftManagementIsActive = Object.values(shiftManagementPerms).some((v) => !!v);

      const shiftApplicationPerms = newShiftApplication.permissions || {};
      const shiftApplicationIsActive = Object.values(shiftApplicationPerms).some((v) => !!v);

      const isActive = shiftManagementIsActive || shiftApplicationIsActive;

      updatedScreenPermissions.push({
        serviceName: "shiftApplication",
        tileName: "shift-application",
        screens: [
          {
            ...newShiftManagement,
            isActive: shiftManagementIsActive,
          },
          {
            ...newShiftApplication,
            isActive: shiftApplicationIsActive,
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
    console.error("Error in /api/permissions/shift-application:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


