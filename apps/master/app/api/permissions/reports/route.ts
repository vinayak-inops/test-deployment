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

    let reportsEntryFound = false;

    const updatedScreenPermissions = existingScreenPermissions.map((sp) => {
      if (sp.serviceName !== "reports") return sp;

      reportsEntryFound = true;
      const existingScreens = sp.screens || [];

      let reportsGenerateScreen = existingScreens.find((s: any) => s.screenName === "reportsGenerate");
      
      if (!reportsGenerateScreen) {
        reportsGenerateScreen = {
          screenName: "reportsGenerate",
          permissions: {},
        };
      }

      const updatedReportsGenerate = {
        ...reportsGenerateScreen,
        permissions: {
          ...(reportsGenerateScreen.permissions || {}),
          reportsGenerate: !!data.reportsGenerate,
        },
      };

      const reportsGeneratePerms = updatedReportsGenerate.permissions || {};
      const reportsGenerateIsActive = Object.values(reportsGeneratePerms).some((v) => !!v);

      const mergedScreens = existingScreens
        .filter((s: any) => s.screenName !== "reportsGenerate")
        .map((screen: any) => {
          const perms = screen.permissions || {};
          const screenIsActive = Object.values(perms).some((v) => !!v);
          return {
            ...screen,
            isActive: screenIsActive,
          };
        });

      mergedScreens.push({
        ...updatedReportsGenerate,
        isActive: reportsGenerateIsActive,
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

    // If reports entry doesn't exist, create it
    if (!reportsEntryFound) {
      const newReportsGenerate = {
        screenName: "reportsGenerate",
        permissions: {
          reportsGenerate: !!data.reportsGenerate,
        },
      };
      const reportsGeneratePerms = newReportsGenerate.permissions || {};
      const reportsGenerateIsActive = Object.values(reportsGeneratePerms).some((v) => !!v);

      const isActive = reportsGenerateIsActive;

      updatedScreenPermissions.push({
        serviceName: "reports",
        screens: [
          {
            ...newReportsGenerate,
            isActive: reportsGenerateIsActive,
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
    console.error("Error in /api/permissions/reports:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


