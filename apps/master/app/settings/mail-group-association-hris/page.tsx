import { Suspense } from "react";
import MailGroupAssociationPage from "./_components/mail-group-association-page";

function MailGroupAssociationWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MailGroupAssociationPage />
    </Suspense>
  );
}

export default function Page() {
  return (
    <div className="w-full flex justify-center pb-4 px-12">
      <div className="w-full">
        <MailGroupAssociationWrapper />
      </div>
    </div>
  )
}