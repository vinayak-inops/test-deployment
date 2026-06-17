import { Suspense } from 'react';
import OverTimePage from './_components/over-time-page';

export default function OTPolicyPage() {
  return (
    <div className="w-full flex justify-center py-6">
      <div className="w-full px-12">
        <Suspense fallback={<div>Loading...</div>}>
          <OverTimePage />
        </Suspense>
      </div>
    </div>
  );
}