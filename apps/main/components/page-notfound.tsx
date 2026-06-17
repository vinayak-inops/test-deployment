"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/ui/button';
import { Shield, ArrowLeft, Home } from 'lucide-react';
import useCurrentDomain from "@/hooks/api/useCurrentDomain";


export default function PageNotFound() {
  const router = useRouter();
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center p-10 max-w-md mx-4">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="bg-blue-200 rounded-full p-4">
            <Shield className="h-10 w-10 text-blue-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-blue-700 mb-2">Permission Check</h1>
        <p className="text-base text-gray-600 mb-8">We're verifying your access rights. Please wait a moment.</p>

        {/* Loading Spinner */}
        <div className="mb-8 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-200 border-t-blue-600"></div>
        </div>

        {/* Single Action Button */}
        <div className="flex justify-center">
          <Button
            className="flex items-center gap-2 px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition shadow"
            onClick={() => router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/launchdesk`)}
          >
            <Home className="h-5 w-5" /> Home
          </Button>
        </div>
      </div>
    </div>
  );
}