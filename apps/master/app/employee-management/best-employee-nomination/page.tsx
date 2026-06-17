import BestEmployeeNominationPage from "./_component/best-employee-nomination-page";
import { Suspense } from "react";

function PageInner() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BestEmployeeNominationPage />
    </Suspense>
  );
}

export default function Page() {
  return (
    <div className="w-full flex justify-center py-0 px-12">
      <div className="w-full">
        <PageInner />
      </div>
    </div>
  );
}