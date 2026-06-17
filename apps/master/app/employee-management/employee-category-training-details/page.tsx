"use client"

import { Suspense } from "react"
import EmployeeCategoryTrainingDetailsPage from "./_components/employee-category-training-details-page"

function PageInner() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmployeeCategoryTrainingDetailsPage />
    </Suspense>
  )
}

export default function Page() {
  return (
    <div className="w-full flex justify-center py-0 px-12">
      <div className="w-full">
        <PageInner />
      </div>
    </div>
  )
}