"use client";
import ContractEmployeePage from "./_components/contract-employee-page";
import { Suspense } from "react"

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContractEmployeePage />
    </Suspense>
  );
}
 