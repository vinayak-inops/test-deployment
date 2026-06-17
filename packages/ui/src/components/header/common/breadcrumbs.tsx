"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { useParams } from "next/navigation";

export function Breadcrumbs() {
  const params = useParams<{ tag: string; item: string }>();

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <Link href="/" className="text-gray-500 hover:text-gray-700">
        <Home className="h-4 w-4" />
      </Link>
      <span className="text-gray-300 text-xs">/</span>
      <Link href="/work-flow" className="text-gray-500 hover:text-gray-700 text-xs">
        Work Flow
      </Link>
      {Object.keys(params).length !== 0 && (
        <>
          <span className="text-gray-300">/</span>
          <Link href="/analytics" className="text-[#344767] hover:text-gray-700 text-xs">
            {params.tag}
          </Link>
        </>
      )}
    </div>
  );
}