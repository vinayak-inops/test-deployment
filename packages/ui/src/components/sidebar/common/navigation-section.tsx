import React from 'react';
import { Grid, ShoppingBag, KeyRound, FileText, Settings } from "lucide-react";
import MenuItem from "./menu-item";
import SectionTitle from "./section-title";
import { PagesDropdown } from "./pages-dropdown";
import DashboardSection from './dashboard-section';

interface NavigationItem {
  icon: React.ReactNode;
  label: string;
}

const NavigationSection: React.FC = () => {
  const workflowItems: NavigationItem[] = [
    { icon: <Grid className="w-5 h-5" />, label: "Work Flow UI" },
    { icon: <ShoppingBag className="w-5 h-5" />, label: "Reports" },
    { icon: <KeyRound className="w-5 h-5" />, label: "Authentication" },
  ];

  const docsItems: NavigationItem[] = [
    { icon: <FileText className="w-5 h-5" />, label: "Basic" },
    { icon: <Settings className="w-5 h-5" />, label: "Components" },
  ];

  return (
    <nav className="flex-1 overflow-y-auto">
      <div className="p-4">
        {/* Dashboards Section */}
        <DashboardSection />

        {/* Pages Section */}
        <SectionTitle title="Work Flow" />
        <PagesDropdown />

        {/* Workflow Menu Items */}
        {workflowItems.map((item, index) => (
          <MenuItem key={index} icon={item.icon} label={item.label} />
        ))}

        {/* Docs Section */}
        <div className="mt-6">
          <SectionTitle title="Docs" />
        </div>

        {/* Docs Menu Items */}
        {docsItems.map((item, index) => (
          <MenuItem key={index} icon={item.icon} label={item.label} />
        ))}
      </div>
    </nav>
  );
};

export default NavigationSection;