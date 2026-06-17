"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@repo/ui/components/ui/button';
import { Home } from 'lucide-react';
import useCurrentDomain from "@/hooks/api/useCurrentDomain";

export default function PageNotFound() {
  const router = useRouter();
  const NEXT_PUBLIC_NEXTAUTH_URL= useCurrentDomain()
  return (
    <div className=" flex mt-10 justify-center">
      <div className=" border border-gray-300 rounded-lg p-8 max-w-lg mx-4 text-center">
        <h1 className="text-xl font-semibold text-blue-800 mb-2">Access Restricted</h1>
        <p className="text-base text-gray-700 mb-4">
          You do not have the required permissions to access this page. Please contact your administrator if you believe this is an error.
        </p>
        <Button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 transition mx-auto"
          onClick={() => router.push(`${NEXT_PUBLIC_NEXTAUTH_URL}/launchdesk`)}
        >
          <Home className="h-4 w-4" /> Home
        </Button>
      </div>
    </div>
  );
}