'use client';

import { useState } from 'react';
import { ManagerDashboard } from '@/components/ManagerDashboard';
import { DrillDownModal, DrillDownData, DrillDownLevel } from '@/components/DrillDownModal';

export default function Page() {
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState(false);

  const handleDrillDown = (level: DrillDownLevel, title: string, data?: any) => {
    setDrillDownData({ level, title, data });
    setIsDrillDownOpen(true);
  };

  const handleDrillDeeper = (nextLevel: DrillDownLevel, data: any) => {
    let title = '';
    switch (nextLevel) {
      case 'department':
        title = `Department: ${data.name}`;
        break;
      case 'contractor':
        title = `Contractor: ${data.name}`;
        break;
      case 'employee':
        title = `Employee: ${data.name}`;
        break;
      default:
        title = 'Organization Overview';
    }
    setDrillDownData({ level: nextLevel, title, data });
  };

 

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8 w-full">
        <ManagerDashboard
          onDrillDown={(section, data) => handleDrillDown('org', section, data)}
        />
        <DrillDownModal
          isOpen={isDrillDownOpen}
          onClose={() => setIsDrillDownOpen(false)}
          drillDownData={drillDownData}
          onDrillDeeper={handleDrillDeeper}
        />
      </div>
    </div>
  );
}
