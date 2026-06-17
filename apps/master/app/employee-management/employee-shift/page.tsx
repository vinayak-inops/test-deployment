"use client";

import EmployeeShiftPage from "./_components/employee-shift-page";
import { Suspense } from "react";

function EmployeeShiftPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmployeeShiftPage />
    </Suspense>
  );
}

export default function Home() {
 

  return (
    <div>
      {/* <EmployeeShiftPage/> */}
      <EmployeeShiftPageWrapper />
    </div>
  );
}
