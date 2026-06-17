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
      type, // "muster" | "punchApplication"
      data,
    } = body;

    if (!entitlementCode || !tenantCode || !type) {
      return NextResponse.json(
        { error: "entitlementCode, tenantCode and type are required" },
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

    let musterEntryFound = false;

    const updatedScreenPermissions = existingScreenPermissions.map((sp) => {
      if (!(sp.serviceName === "muster" || sp.tileName === "muster")) return sp;

      musterEntryFound = true;
      const existingScreens = sp.screens || [];

      const mergedScreens = existingScreens.map((screen: any) => {
        if (type === "muster") {
          // Logic from handleMusterSave
          if (screen.screenName === "muster-punch") {
            return {
              ...screen,
              permissions: {
                ...(screen.permissions || {}),
                musterRollSelf: !!data.musterRollSelf,
                musterRollAll: !!data.musterRollAll,
                rawPunchSelf: !!data.rawPunchSelf,
                rawPunchAll: !!data.rawPunchAll,
                suspectedPunchAll: !!data.suspectedPunchAll,
                ...(screen.permissions?.punchApplicationsSelf !== undefined
                  ? { punchApplicationsSelf: screen.permissions.punchApplicationsSelf }
                  : {}),
                ...(screen.permissions?.punchApplicationsAll !== undefined
                  ? { punchApplicationsAll: screen.permissions.punchApplicationsAll }
                  : {}),
              },
            };
          }

          if (screen.screenName === "muster-punch-calendar") {
            return {
              ...screen,
              permissions: {
                ...(screen.permissions || {}),
                punchEditable: !!data.editPunch,
              },
            };
          }

          if (screen.screenName === "suspectedPunches") {
            return {
              ...screen,
              permissions: {
                ...(screen.permissions || {}),
                approve: !!data.approve,
              },
            };
          }
        }

        if (type === "addNewPunch") {
          if (screen.screenName === "add-new-punch") {
            return {
              ...screen,
              permissions: {
                ...(screen.permissions || {}),
                viewNewPunchSelf: !!data.viewNewPunchSelf,
                viewNewPunchAll: !!data.viewNewPunchAll,
                addNewPunchSelf: !!data.addNewPunchSelf,
                addNewPunchAll: !!data.addNewPunchAll,
              },
            };
          }
        }

        if (type === "punchApplication") {
          // Logic from handlePunchApplicationSave
          if (screen.screenName === "muster-punch") {
            return {
              ...screen,
              permissions: {
                ...(screen.permissions || {}),
                punchApplicationsSelf: !!data.punchApplicationsSelf,
                punchApplicationsAll: !!data.punchApplicationsAll,
                punchApplicationApprover: !!data.punchApplicationApprover,
                ...(screen.permissions?.musterRollSelf !== undefined
                  ? { musterRollSelf: screen.permissions.musterRollSelf }
                  : {}),
                ...(screen.permissions?.musterRollAll !== undefined
                  ? { musterRollAll: screen.permissions.musterRollAll }
                  : {}),
                ...(screen.permissions?.rawPunchSelf !== undefined
                  ? { rawPunchSelf: screen.permissions.rawPunchSelf }
                  : {}),
                ...(screen.permissions?.rawPunchAll !== undefined
                  ? { rawPunchAll: screen.permissions.rawPunchAll }
                  : {}),
                ...(screen.permissions?.suspectedPunchAll !== undefined
                  ? { suspectedPunchAll: screen.permissions.suspectedPunchAll }
                  : {}),
              },
            };
          }

          if (screen.screenName === "punch-application") {
            return {
              ...screen,
              permissions: {
                ...(screen.permissions || {}),
                punchApplicationsCancel: !!data.punchApplicationsCancel,
                punchApplicationsApprove: !!data.punchApplicationsApprove,
                punchApplicationsReject: !!data.punchApplicationsReject,
                punchApplicationsSelfCancel: !!data.punchApplicationsSelfCancel,
                punchApplicationsAllCancel: !!data.punchApplicationsAllCancel,
              },
            };
          }
        }

        return screen;
      });

      // Add new screens if they don't exist
      const existingScreenNames = new Set(existingScreens.map((s: any) => s.screenName));
      
      if (type === "muster") {
        if (!existingScreenNames.has("muster-punch")) {
          mergedScreens.push({
            screenName: "muster-punch",
            permissions: {
              musterRollSelf: !!data.musterRollSelf,
              musterRollAll: !!data.musterRollAll,
              rawPunchSelf: !!data.rawPunchSelf,
              rawPunchAll: !!data.rawPunchAll,
              suspectedPunchAll: !!data.suspectedPunchAll,
            },
          });
        }
        if (!existingScreenNames.has("muster-punch-calendar")) {
          mergedScreens.push({
            screenName: "muster-punch-calendar",
            permissions: {
              punchEditable: !!data.editPunch,
            },
          });
        }
        if (!existingScreenNames.has("suspectedPunches")) {
          mergedScreens.push({
            screenName: "suspectedPunches",
            permissions: {
              approve: !!data.approve,
            },
          });
        }
      }

      if (type === "addNewPunch") {
        if (!existingScreenNames.has("add-new-punch")) {
          mergedScreens.push({
            screenName: "add-new-punch",
            permissions: {
              viewNewPunchSelf: !!data.viewNewPunchSelf,
              viewNewPunchAll: !!data.viewNewPunchAll,
              addNewPunchSelf: !!data.addNewPunchSelf,
              addNewPunchAll: !!data.addNewPunchAll,
            },
          });
        }
      }

      if (type === "punchApplication") {
        if (!existingScreenNames.has("muster-punch")) {
          mergedScreens.push({
            screenName: "muster-punch",
            permissions: {
              punchApplicationsSelf: !!data.punchApplicationsSelf,
              punchApplicationsAll: !!data.punchApplicationsAll,
              punchApplicationApprover: !!data.punchApplicationApprover,
            },
          });
        }
        if (!existingScreenNames.has("punch-application")) {
          mergedScreens.push({
            screenName: "punch-application",
            permissions: {
              punchApplicationsCancel: !!data.punchApplicationsCancel,
              punchApplicationsApprove: !!data.punchApplicationsApprove,
              punchApplicationsReject: !!data.punchApplicationsReject,
              punchApplicationsSelfCancel: !!data.punchApplicationsSelfCancel,
              punchApplicationsAllCancel: !!data.punchApplicationsAllCancel,
            },
          });
        }
      }

      const mergedWithIsActive = mergedScreens.map((screen: any) => {
        const perms = screen.permissions || {};
        const screenIsActive = Object.values(perms).some((v) => !!v);
        return {
          ...screen,
          isActive: screenIsActive,
        };
      });

      const isActive = mergedWithIsActive.some((screen: any) => {
        const perms = screen.permissions || {};
        return Object.values(perms).some((v) => !!v);
      });

      return {
        ...sp,
        screens: mergedWithIsActive,
        isActive,
      };
    });

    // If muster entry doesn't exist, create it
    if (!musterEntryFound) {
      const newScreens: any[] = [];

      if (type === "muster") {
        newScreens.push({
          screenName: "muster-punch",
          permissions: {
            musterRollSelf: !!data.musterRollSelf,
            musterRollAll: !!data.musterRollAll,
            rawPunchSelf: !!data.rawPunchSelf,
            rawPunchAll: !!data.rawPunchAll,
            suspectedPunchAll: !!data.suspectedPunchAll,
          },
        });
        newScreens.push({
          screenName: "muster-punch-calendar",
          permissions: {
            punchEditable: !!data.editPunch,
          },
        });
        newScreens.push({
          screenName: "suspectedPunches",
          permissions: {
            approve: !!data.approve,
          },
        });
      }

      if (type === "addNewPunch") {
        newScreens.push({
          screenName: "add-new-punch",
          permissions: {
            viewNewPunchSelf: !!data.viewNewPunchSelf,
            viewNewPunchAll: !!data.viewNewPunchAll,
            addNewPunchSelf: !!data.addNewPunchSelf,
            addNewPunchAll: !!data.addNewPunchAll,
          },
        });
      }

      if (type === "punchApplication") {
        newScreens.push({
          screenName: "muster-punch",
          permissions: {
            punchApplicationsSelf: !!data.punchApplicationsSelf,
            punchApplicationsAll: !!data.punchApplicationsAll,
            punchApplicationApprover: !!data.punchApplicationApprover,
          },
        });
        newScreens.push({
          screenName: "punch-application",
          permissions: {
            punchApplicationsCancel: !!data.punchApplicationsCancel,
            punchApplicationsApprove: !!data.punchApplicationsApprove,
            punchApplicationsReject: !!data.punchApplicationsReject,
            punchApplicationsSelfCancel: !!data.punchApplicationsSelfCancel,
            punchApplicationsAllCancel: !!data.punchApplicationsAllCancel,
          },
        });
      }

      const screensWithIsActive = newScreens.map((screen: any) => {
        const perms = screen.permissions || {};
        const screenIsActive = Object.values(perms).some((v) => !!v);
        return {
          ...screen,
          isActive: screenIsActive,
        };
      });

      const isActive = screensWithIsActive.some((screen: any) => {
        const perms = screen.permissions || {};
        return Object.values(perms).some((v) => !!v);
      });

      updatedScreenPermissions.push({
        serviceName: "muster",
        tileName: "muster",
        screens: screensWithIsActive,
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
    console.error("Error in /api/permissions/muster:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


