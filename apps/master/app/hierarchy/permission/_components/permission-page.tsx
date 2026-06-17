"use client"
import React, { useState } from 'react'
function PermissionPage() {
  const [activeTab, setActiveTab] = useState('Entitlement Assignments')
  return (
    <div>
        {/* <Tab activeTab={activeTab} setActiveTab={setActiveTab} /> */}
        {activeTab === 'Entitlement Assignments' && <></>}
    </div>
  )
}

export default PermissionPage