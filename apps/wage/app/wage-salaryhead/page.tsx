import WageSalaryHeadsPage from "./components/wageSalaryHeadsPage";
import { Suspense } from "react";

function PageInner() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WageSalaryHeadsPage/>
    </Suspense>
  );
}

export default function Page() {
  return (
    <div className="w-full flex justify-center py-6 px-12">
      <div className="w-full">
        <PageInner />
      </div>
    </div>
  );
}