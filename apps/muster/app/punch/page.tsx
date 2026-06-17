"use client";
import React from "react";
import CashFlowChart from "./_components/cash-flow-chart";
import Component from "./_components/dashboard-metrics";
import PunchSystem from "./_components/punch-system";
import TaskManagerActions from "./_components/task-manager-actions";
import WorkingHours from "./_components/working-hours";
import ServiceName from "./_components/serviceName";

// Lightweight client-side cookie helper
const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const cookies = document.cookie.split(';').map(c => c.trim());
  for (const c of cookies) {
    if (c.startsWith(name + '=')) return decodeURIComponent(c.slice(name.length + 1));
  }
  return undefined;
};


export default function Home() {
  const [isClient, setIsClient] = React.useState(false);
  const [allowedServices, setAllowedServices] = React.useState<string[]>([]);
  const [musterService, setMusterService] = React.useState<any>(null);

  // Load allowed services (serviceName[]) from cookie
  React.useEffect(() => {
    setIsClient(true);
    try {
      const raw = getCookie("roleServices");
      const parsed = raw ? JSON.parse(raw) : [];
      setAllowedServices(parsed);
    } catch {
      setAllowedServices([]);
    }
  }, []);

  // If muster not allowed, softly redirect to launchdesk
  React.useEffect(() => {
    if (!isClient) return;
    const muster = allowedServices.find((service: any) => service.serviceName === 'muster');
    setMusterService(muster);
    if (!muster) {
      // router.replace('/launchdesk');
    }
  }, [isClient, allowedServices]);

  return (
    <div className="flex justify-center">
      {/* Main Content Area - Left Side */}
      <ServiceName />
      {/* <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="mb-0">
          {
            musterService?.screens?.map((screen: any) =>
              screen?.components?.map((component: any, idx: number) =>
                component?.componentType === "punch-metrics" && (
                  <Component itemsPerView={3} />
                )
              )
            )
          }
        </div>
        <div className="px-5 mb-6 mt-2">
          {
            musterService?.screens?.map((screen: any) =>
              screen?.components?.map((component: any, idx: number) =>
                component?.componentType === "working-hours" && (
                  <WorkingHours />
                )
              )
            )
          }
          {
            musterService?.screens?.map((screen: any) =>
              screen?.components?.map((component: any, idx: number) =>
                component?.componentType === "punch-chart" && (
                  <CashFlowChart />
                )
              )
            )
          }
        </div>
      </div>
      <div className="w-[28%]  overflow-y-auto scrollbar-hide pb-6">
        <PunchSystem />
      </div> */}
    </div>
  );
}
