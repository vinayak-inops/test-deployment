"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowRight, 
  Briefcase, 
  ClipboardCheck, 
  Users, 
  ShieldCheck, 
  CalendarClock,
  Handshake 
} from "lucide-react";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";

const canAccess = (p: any): boolean =>
  !!(p?.view || p?.edit || p?.add || p?.delete);

export default function ContractorDashboard() {
  const router = useRouter();

  // ─── Role permissions — one per contractor[].page ────────────────────────────

  const { responseData: p_contractor } = useRolePermissions({
    serviceName: "user",
    screenName: "contractor",
  });

  const { responseData: p_workOrderCompletion } = useRolePermissions({
    serviceName: "setting",
    screenName: "workOrderCompletion",
  });

  // ─── Card definitions (mirrors contractor array 1-to-1) ─────────────────────

  const allCards = [
    {
      id: "contractor",
      title: "Contractor",
      description: "Manage contractor profiles and assignments.",
      icon: Briefcase,
      href: "/contractor-management/contractor",
      visible: canAccess(p_contractor),
    },
    {
      id: "workOrderCompletion",
      title: "Work Order Completion",
      description: "Track and manage work order completion records.",
      icon: ClipboardCheck,
      href: "/contractor-management/work-order-completion",
      visible: canAccess(p_workOrderCompletion),
    },
  ];

  const visibleCards = allCards.filter((card) => card.visible);

  const mid = Math.ceil(visibleCards.length / 2);
  const leftCards  = visibleCards.slice(0, mid);
  const rightCards = visibleCards.slice(mid);

  // ─── Card renderer ───────────────────────────────────────────────────────────

  const renderCard = (card: (typeof allCards)[number]) => {
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
                <span className="text-gray-600">Contractor</span>
              </nav>

              {/* Title */}
              <h1 className="mb-2 text-xl font-semibold leading-snug text-gray-900">
                Contractor Management
              </h1>

              {/* Description */}
              <p className="mb-5 text-sm leading-relaxed text-gray-500">
                Manage contractor profiles, assignments, and work order completion tracking.
              </p>

              {/* Divider */}
              <div className="mb-5 h-px bg-gray-200" />

              {/* Quick stats / tag pills */}
              <div className="space-y-2">
                {[
                  { label: "Contractors", icon: Handshake },
                  { label: "Work Orders", icon: ClipboardCheck },
                  { label: "Assignments", icon: Briefcase },
                  { label: "Tracking", icon: CalendarClock },
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
                    <span className="font-medium text-gray-600">Contractor Profiles</span>
                    {" — "}manage contractor details &amp; assignments
                  </span>
                </div>
                <div className="flex items-start gap-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                  <span className="mt-0.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-indigo-400" />
                  <span>
                    <span className="font-medium text-gray-600">Work Order Management</span>
                    {" — "}track completion &amp; performance
                  </span>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Card grid ── */}
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-2">

            {/* Left column */}
            {leftCards.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-100 p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  <h2 className="text-base font-semibold text-gray-700">
                    Contractor Management
                  </h2>
                  <span className="cursor-help text-sm text-blue-600">?</span>
                </div>
                <div className="space-y-3">
                  {leftCards.map(renderCard)}
                </div>
              </div>
            )}

            {/* Right column — only rendered when cards overflow left */}
            {rightCards.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-gray-100 p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" />
                  <h2 className="text-base font-semibold text-gray-700">
                    Contractor Management
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