"use client";

import { useParams } from "next/navigation";

export function HeaderTitle() {
  const params = useParams<{ tag: string; item: string }>();

  return (
    <h3 className="text-gray-900 font-semibold font-[Roboto,Helvetica,Arial,sans-serif] mt-1 text-xs">
      {Object.keys(params).length !== 0 ? params.tag : "WORK FLOW"}
    </h3>
  );
}