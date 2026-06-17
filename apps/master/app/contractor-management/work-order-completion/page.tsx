import { Suspense } from "react";
import WorkOrderCompletionPage from "./_components/work-order-completion-page";

function WorkOrderCompletionWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkOrderCompletionPage />
    </Suspense>
  );
}

export default function Page() {
  return (
    <div className="w-full flex justify-center py-6 px-12">
      <div className="w-full">
        <WorkOrderCompletionWrapper />
      </div>
    </div>
  )
}