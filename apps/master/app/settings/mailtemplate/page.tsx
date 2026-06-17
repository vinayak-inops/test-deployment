import EmailTemplatesPage from "./components/email-templates-page";
import { Suspense } from "react";

function MailTemplatePageWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmailTemplatesPage />
    </Suspense>
  );
}

export default function MailTemplatePageRoute() {
  return (
    <div className="w-full flex justify-center">
      <div className="w-full px-12">
        <MailTemplatePageWrapper />
      </div>
    </div>
  )
}