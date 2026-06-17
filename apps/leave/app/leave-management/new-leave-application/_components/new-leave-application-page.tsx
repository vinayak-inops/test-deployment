"use client"
import React, { useState } from 'react'
import { NewRequestPage } from '../../components/new-request-page'
export default function NewLeaveApplicationPage() {
    const [currentPage, setCurrentPage] = useState("dashboard")
    return (
        <div>
            <NewRequestPage onBack={() => setCurrentPage("dashboard")} />
        </div>
    )
}