"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Settings,
  Mail,
  Bell,
  MailCheck,
  ClipboardList,
  Plug,
  CalendarX,
  FileText,
  Clock,
  CalendarClock,
  ShieldCheck,
  Database,
  Cog,
} from "lucide-react";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";

const canAccess = (p: any): boolean =>
  !!(p?.view || p?.edit || p?.add || p?.delete);

export default function SettingsDashboard() {
  const router = useRouter();

  // ─── Role permissions — one per settings[].page ──────────────────────────────

  const { responseData: p_employeeCategorySetting }     = useRolePermissions({ serviceName: "setting", screenName: "employeeCategorySetting" });
  const { responseData: p_mailGroupAssociation }        = useRolePermissions({ serviceName: "setting", screenName: "mailGroupAssociation" });
  const { responseData: p_mailGroupAssociationHris }    = useRolePermissions({ serviceName: "setting", screenName: "mailGroupAssociationHris" });
  const { responseData: p_notification }                = useRolePermissions({ serviceName: "setting", screenName: "notification" });
  const { responseData: p_reportTask }                  = useRolePermissions({ serviceName: "setting", screenName: "reportTask" });
  const { responseData: p_apiIntegrationConfig }        = useRolePermissions({ serviceName: "setting", screenName: "apiIntegrationConfig" });
  const { responseData: p_continuousDaysBlocking }      = useRolePermissions({ serviceName: "setting", screenName: "continuousDaysBlocking" });
  const { responseData: p_emailTemplates }              = useRolePermissions({ serviceName: "setting", screenName: "emailTemplates" });
  const { responseData: p_schedulerConfigurationsHris } = useRolePermissions({ serviceName: "setting", screenName: "schedulerConfigurationsHris" });
  const { responseData: p_schedulerConfigurations }     = useRolePermissions({ serviceName: "setting", screenName: "schedulerConfigurations" });

  // ─── Card definitions (mirrors settings array 1-to-1) ───────────────────────

  const allCards = [
    {
      id: "employeeCategorySetting",
      title: "Employee Category Setting",
      description: "Configure and manage employee category settings.",
      icon: Settings,
      href: "/settings/employee-category-setting",
      visible: canAccess(p_employeeCategorySetting),
    },
    {
      id: "mailGroupAssociation",
      title: "Mail Group Association",
      description: "Manage mail group associations for contract employees.",
      icon: Mail,
      href: "/settings/mail-group-association",
      visible: canAccess(p_mailGroupAssociation),
    },
    {
      id: "mailGroupAssociationHris",
      title: "Mail Group Association (HRIS)",
      description: "Manage mail group associations for HRIS employees.",
      icon: MailCheck,
      href: "/settings/mail-group-association-hris",
      visible: canAccess(p_mailGroupAssociationHris),
    },
    {
      id: "notification",
      title: "Notification",
      description: "Configure and manage system notification settings.",
      icon: Bell,
      href: "/notification",
      visible: canAccess(p_notification),
    },
    {
      id: "reportTask",
      title: "Report Task",
      description: "Configure and manage scheduled report task settings.",
      icon: ClipboardList,
      href: "/settings/report-task",
      visible: canAccess(p_reportTask),
    },
    {
      id: "apiIntegrationConfig",
      title: "API Integration Config",
      description: "Manage API integration configurations and credentials.",
      icon: Plug,
      href: "/settings/api_Integration-config",
      visible: canAccess(p_apiIntegrationConfig),
    },
    {
      id: "continuousDaysBlocking",
      title: "Continuous Days Blocking",
      description: "Configure rules for blocking continuous working days.",
      icon: CalendarX,
      href: "/settings/continuous-days-blocking",
      visible: canAccess(p_continuousDaysBlocking),
    },
    {
      id: "emailTemplates",
      title: "Email Templates",
      description: "Create and manage reusable email notification templates.",
      icon: FileText,
      href: "/settings/mailtemplate",
      visible: canAccess(p_emailTemplates),
    },
    {
      id: "schedulerConfigurationsHris",
      title: "Scheduler Configurations (HRIS)",
      description: "Manage scheduler job configurations for HRIS employees.",
      icon: CalendarClock,
      href: "/settings/scheduler-configurations-hris",
      visible: canAccess(p_schedulerConfigurationsHris),
    },
    {
      id: "schedulerConfigurations",
      title: "Scheduler Configurations",
      description: "Manage scheduler job configurations for contract employees.",
      icon: Clock,
      href: "/settings/scheduler-configurations",
      visible: canAccess(p_schedulerConfigurations),
    },
  ];

  const visibleCards = allCards.filter((card) => card.visible);

  const mid        = Math.ceil(visibleCards.length / 2);
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
                <span>Administration</span>
                <span>/</span>
                <span className="text-gray-600">Settings</span>
              </nav>

              {/* Title */}
              <h1 className="mb-2 text-xl font-semibold leading-snug text-gray-900">
                System Settings
              </h1>

              {/* Description */}
              <p className="mb-5 text-sm leading-relaxed text-gray-500">
                Configure and manage system-wide settings, integrations, and configurations.
              </p>

              {/* Divider */}
              <div className="mb-5 h-px bg-gray-200" />

              {/* Quick stats / tag pills */}
              <div className="space-y-2">
                {[
                  { label: "Integrations", icon: Plug },
                  { label: "Notifications", icon: Bell },
                  { label: "Email", icon: Mail },
                  { label: "Schedulers", icon: CalendarClock },
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
                    <span className="font-medium text-gray-600">Core Configurations</span>
                    {" — "}categories, emails &amp; notifications
                  </span>
                </div>
                <div className="flex items-start gap-2 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                  <span className="mt-0.5 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-indigo-400" />
                  <span>
                    <span className="font-medium text-gray-600">Advanced Settings</span>
                    {" — "}APIs, schedulers &amp; integrations
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
                    Settings
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
                    Settings
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