"use client"

import { useRouter } from "next/navigation";
import AttendancePopup from "../_components/attendance-popup";
import PunchCalendar from "../_components/punch-calendar";
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import PageNotFound from "@/components/page-notfound";
import useCurrentDomain from "@/hooks/api/useCurrentDomain";

export default function Home() {
  const router = useRouter();

  const pageName = "muster-punch"


  // Use the role permissions hook with proper initialization
  const { 
      responseData: rolePermissions, 
  } = useRolePermissions({
      serviceName: "muster",
      screenName: "rawPunch" // Fallback to "location" if transformedParam is undefined
  });

  // Derive permissions from rolePermissions
  const canRawPunch = !!(rolePermissions?.all || rolePermissions?.self);
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()


  const handleClose = () => {
    router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/muster/punch`);
  };

  return (
    <>{
      canRawPunch ? (
        <div className="w-full px-12 h-full">
      <AttendancePopup isOpen={true} onClose={handleClose} onSubmit={() => {}} />
      <div className=" py-4 ">
        <PunchCalendar />
      </div>
    </div>
      ) : (
        <PageNotFound />
      )
    }
    </>
  );
}
