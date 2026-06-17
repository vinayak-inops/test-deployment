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
      type, // "leave" | "encashment" | "compoff"
      data,
    } = body;

    if (!entitlementCode || !tenantCode || !type) {
      return NextResponse.json(
        { error: "entitlementCode, tenantCode and type are required" },
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

    let leaveEntryFound = false;

    const updatedScreenPermissions = existingScreenPermissions.map((sp) => {
      if (sp.serviceName !== "leave") return sp;

      leaveEntryFound = true;
      const existingScreens = sp.screens || [];

      const mergedScreens = existingScreens.map((screen: any) => {
        if (type === "leave") {
          // Logic from handleLeaveSave
          if (screen.screenName === "leaveManagement") {
            return {
              ...screen,
              permissions: {
                ...(screen.permissions || {}),
                leaveApplicationsOfTimeAwaySelf: !!data.leaveApplicationsOfTimeAwaySelf,
                leaveApplicationsOfTimeAwayAll: !!data.leaveApplicationsOfTimeAwayAll,
                leaveApplicationsOfLeaveOfAbsenceSelf: !!data.leaveApplicationsOfLeaveOfAbsenceSelf,
                leaveApplicationsOfLeaveOfAbsenceAll: !!data.leaveApplicationsOfLeaveOfAbsenceAll,
                newLeaveRequestSelf: !!data.newLeaveRequestSelf,
                newLeaveRequestAll: !!data.newLeaveRequestAll,
                timeOffBalanceSelf: !!data.timeOffBalanceSelf,
                timeOffBalanceAll: !!data.timeOffBalanceAll,
                ...(screen.permissions?.leaveEncashmentSelf !== undefined
                  ? { leaveEncashmentSelf: screen.permissions.leaveEncashmentSelf }
                  : {}),
                ...(screen.permissions?.leaveEncashmentAll !== undefined
                  ? { leaveEncashmentAll: screen.permissions.leaveEncashmentAll }
                  : {}),
                ...(screen.permissions?.leaveManagementApplicationApprover !== undefined
                  ? { leaveManagementApplicationApprover: screen.permissions.leaveManagementApplicationApprover }
                  : {}),
                ...(screen.permissions?.leaveManagementApplicationsSelfCancel !== undefined
                  ? { leaveManagementApplicationsSelfCancel: screen.permissions.leaveManagementApplicationsSelfCancel }
                  : {}),
                ...(screen.permissions?.leaveManagementApplicationsAllCancel !== undefined
                  ? { leaveManagementApplicationsAllCancel: screen.permissions.leaveManagementApplicationsAllCancel }
                  : {}),
              },
            };
          }

          if (screen.screenName === "leaveApplication") {
            return {
              ...screen,
              permissions: {
                ...(screen.permissions || {}),
                leaveApplicationApprover: !!data.leaveApplicationApprover,
                leaveApplicationSelfCancel: !!data.leaveApplicationSelfCancel,
                leaveApplicationAllCancel: !!data.leaveApplicationAllCancel,
                leaveApplicationCancel: !!data.leaveApplicationCancel,
                leaveApplicationApprove: !!data.leaveApplicationApprove,
                leaveApplicationReject: !!data.leaveApplicationReject,
              },
            };
          }

          if (screen.screenName === "specialLeaveApplication") {
            return {
              ...screen,
              permissions: {
                ...(screen.permissions || {}),
                specialLeaveApplicationApprover: !!data.specialLeaveApplicationApprover,
                specialLeaveApplicationSelfCancel: !!data.specialLeaveApplicationSelfCancel,
                specialLeaveApplicationAllCancel: !!data.specialLeaveApplicationAllCancel,
                specialLeaveApplicationCancel: !!data.specialLeaveApplicationCancel,
                specialLeaveApplicationApprove: !!data.specialLeaveApplicationApprove,
                specialLeaveApplicationReject: !!data.specialLeaveApplicationReject,
              },
            };
          }
        }

        if (type === "encashment") {
          // Logic from handleEncashmentSave
          if (screen.screenName === "leaveManagement") {
            return {
              ...screen,
              permissions: {
                ...(screen.permissions || {}),
                leaveEncashmentSelf: !!data.leaveEncashmentSelf,
                leaveEncashmentAll: !!data.leaveEncashmentAll,
                leaveManagementApplicationApprover: !!data.leaveManagementApplicationApprover,
                leaveManagementApplicationsSelfCancel: !!data.leaveManagementApplicationsSelfCancel,
                leaveManagementApplicationsAllCancel: !!data.leaveManagementApplicationsAllCancel,
                ...(screen.permissions?.leaveApplicationsOfTimeAwaySelf !== undefined
                  ? { leaveApplicationsOfTimeAwaySelf: screen.permissions.leaveApplicationsOfTimeAwaySelf }
                  : {}),
                ...(screen.permissions?.leaveApplicationsOfTimeAwayAll !== undefined
                  ? { leaveApplicationsOfTimeAwayAll: screen.permissions.leaveApplicationsOfTimeAwayAll }
                  : {}),
                ...(screen.permissions?.leaveApplicationsOfLeaveOfAbsenceSelf !== undefined
                  ? { leaveApplicationsOfLeaveOfAbsenceSelf: screen.permissions.leaveApplicationsOfLeaveOfAbsenceSelf }
                  : {}),
                ...(screen.permissions?.leaveApplicationsOfLeaveOfAbsenceAll !== undefined
                  ? { leaveApplicationsOfLeaveOfAbsenceAll: screen.permissions.leaveApplicationsOfLeaveOfAbsenceAll }
                  : {}),
                ...(screen.permissions?.newLeaveRequestSelf !== undefined
                  ? { newLeaveRequestSelf: screen.permissions.newLeaveRequestSelf }
                  : {}),
                ...(screen.permissions?.newLeaveRequestAll !== undefined
                  ? { newLeaveRequestAll: screen.permissions.newLeaveRequestAll }
                  : {}),
                ...(screen.permissions?.timeOffBalanceSelf !== undefined
                  ? { timeOffBalanceSelf: screen.permissions.timeOffBalanceSelf }
                  : {}),
                ...(screen.permissions?.timeOffBalanceAll !== undefined
                  ? { timeOffBalanceAll: screen.permissions.timeOffBalanceAll }
                  : {}),
                ...(screen.permissions?.approvalRequestAll !== undefined
                  ? { approvalRequestAll: screen.permissions.approvalRequestAll }
                  : {}),
              },
            };
          }

          if (screen.screenName === "encashmentManagement") {
            return {
              ...screen,
              permissions: {
                ...(screen.permissions || {}),
                encashmentManagementCancel: !!data.encashmentManagementCancel,
                encashmentManagementApprove: !!data.encashmentManagementApprove,
                encashmentManagementReject: !!data.encashmentManagementReject,
              },
            };
          }
        }

        if (type === "compoff") {
          // Logic from handleCompOffSave
          if (screen.screenName === "leaveManagement") {
            return {
              ...screen,
              permissions: {
                ...(screen.permissions || {}),
                compOffSelf: !!data.compOffSelf,
                compOffAll: !!data.compOffAll,
                compOffApplicationsApprover: !!data.compOffApplicationsApprover,
                compOffApplicationsSelfCancel: !!data.compOffApplicationsSelfCancel,
                compOffApplicationsAllCancel: !!data.compOffApplicationsAllCancel,
                ...(screen.permissions?.leaveEncashmentSelf !== undefined
                  ? { leaveEncashmentSelf: screen.permissions.leaveEncashmentSelf }
                  : {}),
                ...(screen.permissions?.leaveEncashmentAll !== undefined
                  ? { leaveEncashmentAll: screen.permissions.leaveEncashmentAll }
                  : {}),
                ...(screen.permissions?.leaveManagementApplicationApprover !== undefined
                  ? { leaveManagementApplicationApprover: screen.permissions.leaveManagementApplicationApprover }
                  : {}),
                ...(screen.permissions?.leaveManagementApplicationsSelfCancel !== undefined
                  ? { leaveManagementApplicationsSelfCancel: screen.permissions.leaveManagementApplicationsSelfCancel }
                  : {}),
                ...(screen.permissions?.leaveManagementApplicationsAllCancel !== undefined
                  ? { leaveManagementApplicationsAllCancel: screen.permissions.leaveManagementApplicationsAllCancel }
                  : {}),
                ...(screen.permissions?.leaveApplicationsOfTimeAwaySelf !== undefined
                  ? { leaveApplicationsOfTimeAwaySelf: screen.permissions.leaveApplicationsOfTimeAwaySelf }
                  : {}),
                ...(screen.permissions?.leaveApplicationsOfTimeAwayAll !== undefined
                  ? { leaveApplicationsOfTimeAwayAll: screen.permissions.leaveApplicationsOfTimeAwayAll }
                  : {}),
                ...(screen.permissions?.leaveApplicationsOfLeaveOfAbsenceSelf !== undefined
                  ? { leaveApplicationsOfLeaveOfAbsenceSelf: screen.permissions.leaveApplicationsOfLeaveOfAbsenceSelf }
                  : {}),
                ...(screen.permissions?.leaveApplicationsOfLeaveOfAbsenceAll !== undefined
                  ? { leaveApplicationsOfLeaveOfAbsenceAll: screen.permissions.leaveApplicationsOfLeaveOfAbsenceAll }
                  : {}),
                ...(screen.permissions?.newLeaveRequestSelf !== undefined
                  ? { newLeaveRequestSelf: screen.permissions.newLeaveRequestSelf }
                  : {}),
                ...(screen.permissions?.newLeaveRequestAll !== undefined
                  ? { newLeaveRequestAll: screen.permissions.newLeaveRequestAll }
                  : {}),
                ...(screen.permissions?.timeOffBalanceSelf !== undefined
                  ? { timeOffBalanceSelf: screen.permissions.timeOffBalanceSelf }
                  : {}),
                ...(screen.permissions?.timeOffBalanceAll !== undefined
                  ? { timeOffBalanceAll: screen.permissions.timeOffBalanceAll }
                  : {}),
              },
            };
          }

          if (screen.screenName === "compoffApplication") {
            return {
              ...screen,
              permissions: {
                ...(screen.permissions || {}),
                compOffApplicationsCancel: !!data.compOffApplicationsCancel,
                compOffApplicationsApprove: !!data.compOffApplicationsApprove,
                compOffApplicationsReject: !!data.compOffApplicationsReject,
              },
            };
          }
        }

        return screen;
      });

      // Add new screens if they don't exist
      const existingScreenNames = new Set(existingScreens.map((s: any) => s.screenName));

      if (type === "leave") {
        if (!existingScreenNames.has("leaveManagement")) {
          mergedScreens.push({
            screenName: "leaveManagement",
            permissions: {
              leaveApplicationsOfTimeAwaySelf: !!data.leaveApplicationsOfTimeAwaySelf,
              leaveApplicationsOfTimeAwayAll: !!data.leaveApplicationsOfTimeAwayAll,
              leaveApplicationsOfLeaveOfAbsenceSelf: !!data.leaveApplicationsOfLeaveOfAbsenceSelf,
              leaveApplicationsOfLeaveOfAbsenceAll: !!data.leaveApplicationsOfLeaveOfAbsenceAll,
              newLeaveRequestSelf: !!data.newLeaveRequestSelf,
              newLeaveRequestAll: !!data.newLeaveRequestAll,
              timeOffBalanceSelf: !!data.timeOffBalanceSelf,
              timeOffBalanceAll: !!data.timeOffBalanceAll,
            },
          });
        }
        if (!existingScreenNames.has("leaveApplication")) {
          mergedScreens.push({
            screenName: "leaveApplication",
            permissions: {
              leaveApplicationApprover: !!data.leaveApplicationApprover,
              leaveApplicationSelfCancel: !!data.leaveApplicationSelfCancel,
              leaveApplicationAllCancel: !!data.leaveApplicationAllCancel,
              leaveApplicationCancel: !!data.leaveApplicationCancel,
              leaveApplicationApprove: !!data.leaveApplicationApprove,
              leaveApplicationReject: !!data.leaveApplicationReject,
            },
          });
        }
        if (!existingScreenNames.has("specialLeaveApplication")) {
          mergedScreens.push({
            screenName: "specialLeaveApplication",
            permissions: {
              specialLeaveApplicationApprover: !!data.specialLeaveApplicationApprover,
              specialLeaveApplicationSelfCancel: !!data.specialLeaveApplicationSelfCancel,
              specialLeaveApplicationAllCancel: !!data.specialLeaveApplicationAllCancel,
              specialLeaveApplicationCancel: !!data.specialLeaveApplicationCancel,
              specialLeaveApplicationApprove: !!data.specialLeaveApplicationApprove,
              specialLeaveApplicationReject: !!data.specialLeaveApplicationReject,
            },
          });
        }
      }

      if (type === "encashment") {
        if (!existingScreenNames.has("leaveManagement")) {
          mergedScreens.push({
            screenName: "leaveManagement",
            permissions: {
              leaveEncashmentSelf: !!data.leaveEncashmentSelf,
              leaveEncashmentAll: !!data.leaveEncashmentAll,
              leaveManagementApplicationApprover: !!data.leaveManagementApplicationApprover,
              leaveManagementApplicationsSelfCancel: !!data.leaveManagementApplicationsSelfCancel,
              leaveManagementApplicationsAllCancel: !!data.leaveManagementApplicationsAllCancel,
            },
          });
        }
        if (!existingScreenNames.has("encashmentManagement")) {
          mergedScreens.push({
            screenName: "encashmentManagement",
            permissions: {
              encashmentManagementCancel: !!data.encashmentManagementCancel,
              encashmentManagementApprove: !!data.encashmentManagementApprove,
              encashmentManagementReject: !!data.encashmentManagementReject,
            },
          });
        }
      }

      if (type === "compoff") {
        if (!existingScreenNames.has("leaveManagement")) {
          mergedScreens.push({
            screenName: "leaveManagement",
            permissions: {
              compOffSelf: !!data.compOffSelf,
              compOffAll: !!data.compOffAll,
              compOffApplicationsApprover: !!data.compOffApplicationsApprover,
              compOffApplicationsSelfCancel: !!data.compOffApplicationsSelfCancel,
              compOffApplicationsAllCancel: !!data.compOffApplicationsAllCancel,
            },
          });
        }
        if (!existingScreenNames.has("compoffApplication")) {
          mergedScreens.push({
            screenName: "compoffApplication",
            permissions: {
              compOffApplicationsCancel: !!data.compOffApplicationsCancel,
              compOffApplicationsApprove: !!data.compOffApplicationsApprove,
              compOffApplicationsReject: !!data.compOffApplicationsReject,
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

    // If leave entry doesn't exist, create it
    if (!leaveEntryFound) {
      const newScreens: any[] = [];

      if (type === "leave") {
        newScreens.push({
          screenName: "leaveManagement",
          permissions: {
            leaveApplicationsOfTimeAwaySelf: !!data.leaveApplicationsOfTimeAwaySelf,
            leaveApplicationsOfTimeAwayAll: !!data.leaveApplicationsOfTimeAwayAll,
            leaveApplicationsOfLeaveOfAbsenceSelf: !!data.leaveApplicationsOfLeaveOfAbsenceSelf,
            leaveApplicationsOfLeaveOfAbsenceAll: !!data.leaveApplicationsOfLeaveOfAbsenceAll,
            newLeaveRequestSelf: !!data.newLeaveRequestSelf,
            newLeaveRequestAll: !!data.newLeaveRequestAll,
            timeOffBalanceSelf: !!data.timeOffBalanceSelf,
            timeOffBalanceAll: !!data.timeOffBalanceAll,
          },
        });
        newScreens.push({
          screenName: "leaveApplication",
          permissions: {
            leaveApplicationApprover: !!data.leaveApplicationApprover,
            leaveApplicationSelfCancel: !!data.leaveApplicationSelfCancel,
            leaveApplicationAllCancel: !!data.leaveApplicationAllCancel,
            leaveApplicationCancel: !!data.leaveApplicationCancel,
            leaveApplicationApprove: !!data.leaveApplicationApprove,
            leaveApplicationReject: !!data.leaveApplicationReject,
          },
        });
        newScreens.push({
          screenName: "specialLeaveApplication",
          permissions: {
            specialLeaveApplicationApprover: !!data.specialLeaveApplicationApprover,
            specialLeaveApplicationSelfCancel: !!data.specialLeaveApplicationSelfCancel,
            specialLeaveApplicationAllCancel: !!data.specialLeaveApplicationAllCancel,
            specialLeaveApplicationCancel: !!data.specialLeaveApplicationCancel,
            specialLeaveApplicationApprove: !!data.specialLeaveApplicationApprove,
            specialLeaveApplicationReject: !!data.specialLeaveApplicationReject,
          },
        });
      }

      if (type === "encashment") {
        newScreens.push({
          screenName: "leaveManagement",
          permissions: {
            leaveEncashmentSelf: !!data.leaveEncashmentSelf,
            leaveEncashmentAll: !!data.leaveEncashmentAll,
            leaveManagementApplicationApprover: !!data.leaveManagementApplicationApprover,
            leaveManagementApplicationsSelfCancel: !!data.leaveManagementApplicationsSelfCancel,
            leaveManagementApplicationsAllCancel: !!data.leaveManagementApplicationsAllCancel,
          },
        });
        newScreens.push({
          screenName: "encashmentManagement",
          permissions: {
            encashmentManagementCancel: !!data.encashmentManagementCancel,
            encashmentManagementApprove: !!data.encashmentManagementApprove,
            encashmentManagementReject: !!data.encashmentManagementReject,
          },
        });
      }

      if (type === "compoff") {
        newScreens.push({
          screenName: "leaveManagement",
          permissions: {
            compOffSelf: !!data.compOffSelf,
            compOffAll: !!data.compOffAll,
            compOffApplicationsApprover: !!data.compOffApplicationsApprover,
            compOffApplicationsSelfCancel: !!data.compOffApplicationsSelfCancel,
            compOffApplicationsAllCancel: !!data.compOffApplicationsAllCancel,
          },
        });
        newScreens.push({
          screenName: "compoffApplication",
          permissions: {
            compOffApplicationsCancel: !!data.compOffApplicationsCancel,
            compOffApplicationsApprove: !!data.compOffApplicationsApprove,
            compOffApplicationsReject: !!data.compOffApplicationsReject,
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
        serviceName: "leave",
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
    console.error("Error in /api/permissions/leave:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


