"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import MusterSearchPopup from "./_components/muster-search-popup";

export default function Page() {
  const [showPopup, setShowPopup] = useState(true);
  const [showComponent, setShowComponent] = useState(false);
  const searchParams = useSearchParams();
  const preSelectedEmployeeId = searchParams.get("employeeId") || undefined;

  useEffect(() => {
    // Show popup when page loads
    setShowPopup(true);
    setShowComponent(false);
  }, []);

  const handlePopupClose = () => {
    setShowPopup(false);
    setShowComponent(true);
  };

  return (
    <>
      {showPopup && (
        <MusterSearchPopup 
          isOpen={showPopup} 
          onClose={handlePopupClose}
          preSelectedEmployeeId={preSelectedEmployeeId}
        />
      )}
      {/* <Component /> */}
    </>
  );
}
