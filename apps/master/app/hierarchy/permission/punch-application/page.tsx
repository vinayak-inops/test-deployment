"use client"

import React from "react"
import FormApplication from "../out-duty/_components/form-application"

export default function PunchApplicationPage() {
  const handleSave = (data: any) => {
    // Add your save logic here
  }

  return (
    <div className="w-full">
      <FormApplication onSave={handleSave} mode="add" />
    </div>
  )
}
