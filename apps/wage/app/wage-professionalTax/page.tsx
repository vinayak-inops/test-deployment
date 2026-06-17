import WageProfessionalForm from "./components/wage-professinal-form";
import WageProfessionalTaxPage from "./components/wageProfessionalTaxPage";
import { Suspense } from "react";

function PageInner() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WageProfessionalTaxPage />
      {/* <WageProfessionalForm mode="add" /> */}
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