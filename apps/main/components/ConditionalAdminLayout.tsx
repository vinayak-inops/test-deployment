"use client";

import React from "react";
import { usePathname } from "next/navigation";
import AdminWrapper from "./adminWrapper";

const ROUTES_WITHOUT_ADMIN_WRAPPER = ["/auth-controller"];

export default function ConditionalAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const skipAdminWrapper = ROUTES_WITHOUT_ADMIN_WRAPPER.some(
    (route) => pathname === route || pathname?.startsWith(`${route}/`)
  );

  const main = <main className="min-h-screen">{children}</main>;

  if (skipAdminWrapper) {
    return main;
  }

  return <AdminWrapper>{main}</AdminWrapper>;
}
