import Component from "../_components/dashboard-metrics";
import PunchSystem from "../_components/punch-system";
import FileManager from "./_components/file-manager";




export default function Home() {
  return (
    <div className="flex pr-12 pl-7 h-full bg-gray-50">
      {/* Main Content Area - Left Side */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Top Section - Dashboard Metrics */}
        <div className="mb-0">
          <Component itemsPerView={4} />
        </div>
        <div className="px-5 mb-6">
          <FileManager />
        </div>
      </div>
    </div>
  );
}
