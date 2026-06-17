"use client"

import StepByStepFilter from "@/components/common/step-by-step-filter";
import { useState } from "react";

export default function Home() {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div>
      <StepByStepFilter isOpen={true} onClose={() => {}} />
    </div>
  );
}
