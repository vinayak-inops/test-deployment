
import HolidayPage from "./_components/holiday-page";
import { Suspense } from "react";

function HolidayPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HolidayPage />
    </Suspense>
  );
}

export default function FormPage1() {
    return (
        <div className="w-full flex justify-center py-6 px-12">
    <div className="w-full">
    <HolidayPageWrapper />
    </div>
  </div>
    )
}