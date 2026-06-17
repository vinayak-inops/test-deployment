import { Suspense } from "react";
import FormController from "./_components/form-controller";

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="px-12"><FormController /></div>
    </Suspense>
  );
}
