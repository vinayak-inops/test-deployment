import MailConfigurationPageComponent from "./_components/mailconfigurationpage";
import { Suspense } from "react";

function MailConfigurationPageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MailConfigurationPageComponent />
    </Suspense>
  );
}

export default function MailConfigurationPageRoute() {
  return (
    <div className="w-full flex justify-center py-6">
      <div className="w-full px-12">
        <MailConfigurationPageWrapper />
      </div>
    </div>
  )
}