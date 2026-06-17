"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ShieldCheck,
  UserCog,
  Users,
  BadgeCheck,
  Building2,
  Handshake,
} from "lucide-react";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";

// For roleControl service — view | edit | add | delete
const canAccess = (p: any): boolean =>
  !!(p?.view || p?.edit || p?.add || p?.delete);

// For hrapprover service — approve only
const canApprove = (p: any): boolean =>
  !!(p?.approve);

export default function HierarchyDashboard() {
  const router = useRouter();

  // ─── Left: roleControl permissions (view/edit/add/delete) ───────────────────

  const { responseData: p_rolePermissions }       = useRolePermissions({ serviceName: "roleControl", screenName: "rolePermissions" });
  const { responseData: p_userEntitlements }      = useRolePermissions({ serviceName: "roleControl", screenName: "userEntitlements" });
  const { responseData: p_userEntitlementsHris }  = useRolePermissions({ serviceName: "roleControl", screenName: "userEntitlementsHris" });

  // ─── Right: hrapprover permissions (approve) ────────────────────────────────

  const { responseData: p_contractEmployeeApprover } = useRolePermissions({ serviceName: "hrapprover", screenName: "contractEmployeeApprover" });
  const { responseData: p_companyEmployeeApprover }  = useRolePermissions({ serviceName: "hrapprover", screenName: "companyEmployeeApprover" });
  const { responseData: p_contracerApprover }        = useRolePermissions({ serviceName: "hrapprover", screenName: "contracerApprover" });

  // ─── Left cards — access based ───────────────────────────────────────────────

  const leftCards = [
    {
      id: "rolePermissions",
      title: "Permission",
      description: "Manage role-based permissions across the system.",
      icon: ShieldCheck,
      href: "/hierarchy/permission",
      visible: canAccess(p_rolePermissions),
    },
    {
      id: "userEntitlements",
      title: "User Entitlements",
      description: "Configure user entitlements and access rights.",
      icon: UserCog,
      href: "/hierarchy/user-entitlements",
      visible: canAccess(p_userEntitlements),
    },
    {
      id: "userEntitlementsHris",
      title: "User Entitlements (HRIS)",
      description: "Configure HRIS user entitlements and access rights.",
      icon: Users,
      href: "/hierarchy/user-entitlements-hris",
      visible: canAccess(p_userEntitlementsHris),
    },
  ].filter((card) => card.visible);

  // ─── Right cards — approve based ─────────────────────────────────────────────

  const rightCards = [
    {
      id: "contractEmployeeApprover",
      title: "Employee Approval",
      description: "Manage contract employee approval workflows.",
      icon: BadgeCheck,
      href: "/application-management/contract-employee-approve",
      visible: canApprove(p_contractEmployeeApprover),
    },
    {
      id: "companyEmployeeApprover",
      title: "Company Employee Approval",
      description: "Manage company employee approval workflows.",
      icon: Building2,
      href: "/application-management/company-employee-approve",
      visible: canApprove(p_companyEmployeeApprover),
    },
    {
      id: "contracerApprover",
      title: "Contractor Approval",
      description: "Manage contractor approval workflows and assignments.",
      icon: Handshake,
      href: "/application-management/contractor-approve",
      visible: canApprove(p_contracerApprover),
    },
  ].filter((card) => card.visible);

  // ─── Card renderer ───────────────────────────────────────────────────────────

  const renderCard = (card: (typeof leftCards)[number]) => {
    const Icon = card.icon;
    return (
      <button
        key={card.id}
        type="button"
        onClick={() => router.push(card.href)}
        className="group w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-all duration-200 hover:shadow-md"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between gap-3">
              <h3 className="font-semibold text-gray-900">{card.title}</h3>
              <ArrowRight className="h-4 w-4 text-gray-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">{card.description}</p>
          </div>
        </div>
      </button>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      <style jsx global>{`
        @keyframes slideInFromLeft {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translateY(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInItem {
          0% {
            transform: translateX(-100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-slide-in-from-left {
          animation: slideInFromLeft 0.5s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards;
        }

        .animate-slide-in-item {
          animation: slideInItem 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards;
          opacity: 0;
          transform: translateX(-100%);
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
          opacity: 0;
        }
      `}</style>

      <div className="px-4 py-6 md:px-8">
        <div className="mx-auto flex w-full max-w-7xl gap-8">

          {/* ── Left sidebar heading with slide animation ── */}
          <aside className="hidden w-56 flex-shrink-0 lg:block animate-slide-in-from-left">
            <div className="sticky top-6">
              {/* Breadcrumb */}
              <nav className="mb-4 flex items-center gap-1 text-xs text-gray-400">
                <span>Management</span>
                <span>/</span>
                <span className="text-gray-600">Hierarchy & Approvals</span>
              </nav>

              {/* Title */}
              <h1 className="mb-2 text-xl font-semibold leading-snug text-gray-900">
                Hierarchy & Approvals
              </h1>

              {/* Description */}
              <p className="mb-5 text-sm leading-relaxed text-gray-500">
                Manage permissions, entitlements, and approval workflows across your organization.
              </p>

              {/* Divider */}
              <div className="mb-5 h-px bg-gray-200" />

              {/* Quick stats / tag pills */}
              <div className="space-y-2">
                {[
                  { label: "Permissions", icon: ShieldCheck },
                  { label: "Entitlements", icon: UserCog },
                  { label: "Approvals", icon: BadgeCheck },
                  { label: "Workflows", icon: Handshake },
                ].map(({ label, icon: Icon }, index) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-500 animate-slide-in-item"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <Icon className="h-3.5 w-3.5 text-blue-400" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="my-5 h-px bg-gray-200 animate-fade-in" style={{ animationDelay: "0.2s" }} />

              {/* Section legend */}
              <div className="space-y-3 text-xs text-gray-400">
                <div className="flex items-start gap-2 animate-fade-in" style={{ animationDelay: "0.25s" }}>
                  <span className="mt-0.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-blue-400" />
                  <span>
                    <span className="font-medium text-gray-600">Role Management</span>
                    {" — "}permissions &amp; entitlements
                  </span>
                </div>
                <div className="flex items-start gap-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                  <span className="mt-0.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-indigo-400" />
                  <span>
                    <span className="font-medium text-gray-600">Approval Flows</span>
                    {" — "}employees, contractors &amp; more
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Card grid ── */}
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-2">

            {/* Left — Permissions & Hierarchy (view/edit/add/delete) */}
            {leftCards.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-100 p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <h2 className="text-base font-semibold text-gray-700">
                    Permissions & Hierarchy
                  </h2>
                  <span className="cursor-help text-sm text-blue-600">?</span>
                </div>
                <div className="space-y-3">
                  {leftCards.map(renderCard)}
                </div>
              </div>
            )}

            {/* Right — Approvals (approve) */}
            {rightCards.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-100 p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  <h2 className="text-base font-semibold text-gray-700">
                    Approvals & Entitlements
                  </h2>
                  <span className="cursor-help text-sm text-blue-600">?</span>
                </div>
                <div className="space-y-3">
                  {rightCards.map(renderCard)}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}