
import { LayoutDashboard, ChevronDown } from "lucide-react";
interface DashboardItem {
  label: string;
  initial: string;
  isActive?: boolean;
}

interface DashboardSectionProps {
  items?: DashboardItem[];
}

const DashboardSection = ({ 
  items = [
    { label: "Analytics", initial: "A", isActive: true },
    { label: "User", initial: "Y", isActive: false }
  ] 
}: DashboardSectionProps) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between px-3 py-2 bg-[rgba(255,255,255,0.04)] rounded-lg mb-2 menu-item-hover">
        <div className="flex items-center gap-3">
          <LayoutDashboard size={20} className="text-[white]" />
          <span className="text-sm">Dashboards</span>
        </div>
        <ChevronDown size={16} className="text-gray-400" />
      </div>
      <div className="space-y-1 pl-3">
        {items.map((item, index) => (
          <div 
            key={index} 
            className={`flex items-center gap-3 px-3 py-2 ${item.isActive ? 'active-item' : 'menu-item-hover'} rounded-lg`}
          >
            <span className={`w-6 h-6 flex items-center justify-center ${item.isActive ? 'bg-white text-[#1a73e8]' : 'text-gray-400'} ${item.isActive ? 'rounded-lg font-medium' : ''}`}>
              {item.initial}
            </span>
            <span className="text-sm">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardSection;