import CompoffManagementPage from "./components/compoffPage";
import { Suspense } from "react";

function CompoffManagementPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompoffManagementPage />
    </Suspense>
  );
}

export default function FormPage1() {
    return (
        <div className="w-full flex justify-center py-6">
      <div className="w-full px-12">
        <CompoffManagementPageWrapper />
      </div>
    </div>
    )
}