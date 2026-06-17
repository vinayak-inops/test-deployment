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
      type, // "organization" | "contractor" | "policy" | "advance"
      data, // payload from the corresponding form on the client
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

    let masterEntryFound = false;

    const updatedScreenPermissions = existingScreenPermissions.map((sp) => {
      // All master*-related forms operate on serviceName === "master"
      if (sp.serviceName !== "master") return sp;

      masterEntryFound = true;
      const existingScreens = sp.screens || [];

      switch (type) {
        case "organization": {
          // Define which screens belong to organization category
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

          const updatedScreensFromForm: any[] = data?.screens || [];
          const updatedMap = new Map(
            updatedScreensFromForm.map((s: any) => [s.screenName, s.permissions]),
          );

          // Filter out organization screens from existing, keep only non-organization screens
          const nonOrganizationScreens = existingScreens.filter(
            (screen: any) => !ORGANIZATION_KEYS.includes(screen.screenName),
          );

          // Process organization screens from form: replace permissions explicitly (not merge)
          // and filter out screens with all false permissions
          const organizationScreens = updatedScreensFromForm
            .filter((screen: any) => ORGANIZATION_KEYS.includes(screen.screenName))
            .map((screen: any) => {
              const perms = screen.permissions || {};
              const screenIsActive = !!(perms.view || perms.edit || perms.add || perms.delete);
              return {
                screenName: screen.screenName,
                permissions: {
                  view: !!perms.view,
                  edit: !!perms.edit,
                  add: !!perms.add,
                  delete: !!perms.delete,
                },
                isActive: screenIsActive,
              };
            })
            .filter((screen: any) => screen.isActive); // Remove screens with all false permissions

          // Combine: organization screens (from form) + non-organization screens (from existing)
          const mergedScreens = [...nonOrganizationScreens, ...organizationScreens];

          // service-level isActive true if any permission in any screen is truthy
          const isActive = mergedScreens.some((screen: any) => {
            const perms = screen.permissions || {};
            return Object.values(perms).some((v) => !!v);
          });

          return {
            ...sp,
            screens: mergedScreens,
            isActive,
          };
        }
        case "contractor": {
          const updatedScreensFromForm: any[] = data?.screens || [];
          const updatedMap = new Map(
            updatedScreensFromForm.map((s: any) => [s.screenName, s.permissions]),
          );

          const mergedScreens = existingScreens.map((screen: any) => {
            if (!updatedMap.has(screen.screenName)) {
              const perms = screen.permissions || {};
              const screenIsActive = Object.values(perms).some((v) => !!v);
              return {
                ...screen,
                isActive: screenIsActive,
              };
            }

            const newPerm = updatedMap.get(screen.screenName);
            const mergedPerms = {
              ...(screen.permissions || {}),
              ...newPerm,
            };
            const screenIsActive = Object.values(mergedPerms).some((v) => !!v);

            return {
              ...screen,
              permissions: mergedPerms,
              isActive: screenIsActive,
            };
          });

          // Add new screens that don't exist yet
          const existingScreenNames = new Set(existingScreens.map((s: any) => s.screenName));
          updatedScreensFromForm.forEach((newScreen: any) => {
            if (!existingScreenNames.has(newScreen.screenName)) {
              const perms = newScreen.permissions || {};
              const screenIsActive = Object.values(perms).some((v) => !!v);
              mergedScreens.push({
                screenName: newScreen.screenName,
                permissions: { ...newScreen.permissions },
                isActive: screenIsActive,
              });
            }
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
        }
        case "policy": {
          // Define which screens belong to policy category
          const POLICY_KEYS = ["overTime", "holiday", "shiftPolicy", "leavePolicy", "shiftsLists", "compoff"];

          const updatedScreensFromForm: any[] = data?.screens || [];
          const updatedMap = new Map(
            updatedScreensFromForm.map((s: any) => [s.screenName, s.permissions]),
          );

          // Filter out policy screens from existing, keep only non-policy screens
          const nonPolicyScreens = existingScreens.filter(
            (screen: any) => !POLICY_KEYS.includes(screen.screenName),
          );

          // Process policy screens from form: replace permissions explicitly (not merge)
          // and filter out screens with all false permissions
          const policyScreens = updatedScreensFromForm
            .filter((screen: any) => POLICY_KEYS.includes(screen.screenName))
            .map((screen: any) => {
              const perms = screen.permissions || {};
              const screenIsActive = !!(perms.view || perms.edit || perms.add || perms.delete);
              return {
                screenName: screen.screenName,
                permissions: {
                  view: !!perms.view,
                  edit: !!perms.edit,
                  add: !!perms.add,
                  delete: !!perms.delete,
                },
                isActive: screenIsActive,
              };
            })
            .filter((screen: any) => screen.isActive); // Remove screens with all false permissions

          // Combine: policy screens (from form) + non-policy screens (from existing)
          const mergedScreens = [...nonPolicyScreens, ...policyScreens];

          // service-level isActive true if any permission in any screen is truthy
          const isActive = mergedScreens.some((screen: any) => {
            const perms = screen.permissions || {};
            return Object.values(perms).some((v) => !!v);
          });

          return {
            ...sp,
            screens: mergedScreens,
            isActive,
          };
        }
        case "advance": {
          const updatedScreensFromForm: any[] = data?.screens || [];
          const updatedMap = new Map(
            updatedScreensFromForm.map((s: any) => [s.screenName, s.permissions]),
          );

          const mergedScreens = existingScreens.map((screen: any) => {
            if (!updatedMap.has(screen.screenName)) {
              const perms = screen.permissions || {};
              const screenIsActive = Object.values(perms).some((v) => !!v);
              return {
                ...screen,
                isActive: screenIsActive,
              };
            }

            const newPerm = updatedMap.get(screen.screenName);
            const mergedPerms = {
              ...(screen.permissions || {}),
              ...newPerm,
            };
            const screenIsActive = Object.values(mergedPerms).some((v) => !!v);

            return {
              ...screen,
              permissions: mergedPerms,
              isActive: screenIsActive,
              ...(screen.parentPermissions
                ? { parentPermissions: screen.parentPermissions }
                : {}),
            };
          });

          // Add new screens that don't exist yet
          const existingScreenNames = new Set(existingScreens.map((s: any) => s.screenName));
          updatedScreensFromForm.forEach((newScreen: any) => {
            if (!existingScreenNames.has(newScreen.screenName)) {
              const perms = newScreen.permissions || {};
              const screenIsActive = Object.values(perms).some((v) => !!v);
              mergedScreens.push({
                screenName: newScreen.screenName,
                permissions: { ...newScreen.permissions },
                isActive: screenIsActive,
                ...(newScreen.parentPermissions
                  ? { parentPermissions: newScreen.parentPermissions }
                  : {}),
              });
            }
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
        }
        default:
          return sp;
      }
    });

    // If master entry doesn't exist, create it
    if (!masterEntryFound && data?.screens) {
      if (type === "organization") {
        // For organization type, filter out screens with all false permissions
        const ORGANIZATION_KEYS = [
          "organization", "location", "subsidiaries", "divisions", "departments",
          "designations", "grades", "subDepartments", "sections", "employeeCategories",
          "workSkill", "natureOfWork", "assetMaster", "trainingCategories", "leaveWages",
          "wagePeriod", "documentMaster", "skillLevels", "reasonCodes", "region",
          "mailGroupAssociation", "country", "state", "caste", "mailGroup",
        ];
        
        const updatedScreensFromForm: any[] = data.screens || [];
        const newScreens = updatedScreensFromForm
          .filter((screen: any) => ORGANIZATION_KEYS.includes(screen.screenName))
          .map((screen: any) => {
            const perms = screen.permissions || {};
            const screenIsActive = !!(perms.view || perms.edit || perms.add || perms.delete);
            return {
              screenName: screen.screenName,
              permissions: {
                view: !!perms.view,
                edit: !!perms.edit,
                add: !!perms.add,
                delete: !!perms.delete,
              },
              isActive: screenIsActive,
            };
          })
          .filter((screen: any) => screen.isActive); // Remove screens with all false permissions

        const isActive = newScreens.length > 0;

        updatedScreenPermissions.push({
          serviceName: "master",
          screens: newScreens,
          isActive,
        });
      } else if (type === "policy") {
        // For policy type, filter out screens with all false permissions
        const POLICY_KEYS = ["overTime", "holiday", "shiftPolicy", "leavePolicy", "shiftsLists", "compoff"];
        
        const updatedScreensFromForm: any[] = data.screens || [];
        const newScreens = updatedScreensFromForm
          .filter((screen: any) => POLICY_KEYS.includes(screen.screenName))
          .map((screen: any) => {
            const perms = screen.permissions || {};
            const screenIsActive = !!(perms.view || perms.edit || perms.add || perms.delete);
            return {
              screenName: screen.screenName,
              permissions: {
                view: !!perms.view,
                edit: !!perms.edit,
                add: !!perms.add,
                delete: !!perms.delete,
              },
              isActive: screenIsActive,
            };
          })
          .filter((screen: any) => screen.isActive); // Remove screens with all false permissions

        const isActive = newScreens.length > 0;

        updatedScreenPermissions.push({
          serviceName: "master",
          screens: newScreens,
          isActive,
        });
      } else {
        // For other types (contractor, advance), use existing logic
        const updatedScreensFromForm: any[] = data.screens || [];
        const newScreens = updatedScreensFromForm.map((screen: any) => {
          const perms = screen.permissions || {};
          const screenIsActive = Object.values(perms).some((v) => !!v);
          return {
            screenName: screen.screenName,
            permissions: { ...screen.permissions },
            isActive: screenIsActive,
            ...(screen.parentPermissions
              ? { parentPermissions: screen.parentPermissions }
              : {}),
          };
        });

        const isActive = newScreens.some((screen: any) => {
          const perms = screen.permissions || {};
          return Object.values(perms).some((v) => !!v);
        });

        updatedScreenPermissions.push({
          serviceName: "master",
          screens: newScreens,
          isActive,
        });
      }
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
    console.error("Error in /api/permissions/master:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


