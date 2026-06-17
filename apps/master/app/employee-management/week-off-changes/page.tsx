"use client";

import { Suspense } from "react";
import StepWeekOffs from "./_components/week-off-application/step-week-offs";

function EmployeeShiftPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StepWeekOffs recordId={""}/>
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
