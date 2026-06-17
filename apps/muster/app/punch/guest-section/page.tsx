import { Users } from "lucide-react";
import Component from "../_components/dashboard-metrics";
import PunchSystem from "../_components/punch-system";
import EnhancedHeader from "../today-punch/_components/enhanced-header";
import FileManager from "../today-punch/_components/file-manager";
import InfoBoxs from "../today-punch/_components/info-boxs";

const UsersIcon = () => <Users className="w-5 h-5 text-gray-700" />;




export default function Home() {
  return (
    <div className=" px-12 py-4 w-full h-full">
      <div className="mb-6">
        <InfoBoxs />
      </div>
        <div className=" pb-6">
            {/* <EnhancedHeader title="Guest Section" description="View All Entries" IconComponent={UsersIcon} recordCount={10} organizationType="Guest" lastSync={1714857600} uptime={100} /> */}
          <FileManager />
        </div>
    </div>
  );
}
