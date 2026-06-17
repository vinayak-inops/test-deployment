"use client";

export const dynamic = "force-dynamic";

import PreferencesPage from "./_components/preferences-page";
import ReportsEditer from "@/app/reports/_components/reports-editer";
import PopupSelecter from "./_components/popup-selecter";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ReportsPage from "./_components/individuals/reports-page";

export default function Home() {
  // if (loading) return <div>Loading...</div>;
  // if (error) return <div>Error: {error}</div>;
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const id = searchParams.get('id');

  // Check if both mode=all and id are present
  if (mode === 'all' && id) {
    return <div className="w-full h-full overflow-hidden">
      <ReportsPage id={id} />
    </div>;
  }

  // Default render for other cases (when mode !== 'all' or no id provided)
  return (
    <div>
      {/* {open && <PopupSelecter open={open} setOpen={setOpen} />} */}
      <div className="pt-2">
      <ReportsEditer open={open} setOpen={setOpen}/>
      </div>
    </div>
    // <ContacterEmpEditer/>
  );
}