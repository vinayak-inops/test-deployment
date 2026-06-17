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

    const updatedScreensFromForm: any[] = data?.screens || [];
    let wageEntryFound = false;

    const updatedScreenPermissions = existingScreenPermissions.map((sp) => {
      if (!(sp.serviceName === "wage" || sp.tileName === "wage")) return sp;

      wageEntryFound = true;
      const existingScreens = sp.screens || [];

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
            route: newScreen.route || "",
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
    });

    // If wage entry doesn't exist, create it
    if (!wageEntryFound && updatedScreensFromForm.length > 0) {
      const newScreens = updatedScreensFromForm.map((screen: any) => {
        const perms = screen.permissions || {};
        const screenIsActive = Object.values(perms).some((v) => !!v);
        return {
          screenName: screen.screenName,
          route: screen.route || "",
          permissions: { ...screen.permissions },
          isActive: screenIsActive,
        };
      });

      const isActive = newScreens.some((screen: any) => {
        const perms = screen.permissions || {};
        return Object.values(perms).some((v) => !!v);
      });

      updatedScreenPermissions.push({
        serviceName: "wage",
        tileName: "wage",
        screens: newScreens,
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
    console.error("Error in /api/permissions/wage:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


