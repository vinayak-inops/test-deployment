"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray"
import PageNotFound from "@/components/page-notfound"
import LeavePolicyController from "./leave-policy-controller"

const SECTION_ORDER = [
  "organization",
  "policyDetails",
  "rulesRestrictions",
  "accrualSettings",
  "balanceManagement",
  "encashment",
] as const

type SectionId = (typeof SECTION_ORDER)[number]

const SUB_TABS = [
  "rulesRestrictions",
  "accrualSettings", 
  "balanceManagement",
  "encashment",
] as const

type SubTabId = (typeof SUB_TABS)[number]

const LEAVE_POLICY_COLLECTION_URL = "validate"

export function LeaveManagementForm({ duplicateData: _duplicateData }: { duplicateData: any }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const mode = searchParams.get("mode")
  const id = searchParams.get("id")
  const form = searchParams.get("form")
  const [activeSubTab, setActiveSubTab] = useState<SubTabId>("rulesRestrictions")

  const LEAVE_POLICY_SEARCH_URL = form === "temp" ? "draft/leave_policy/search" : "leave_policy/search"
  const isEditMode = mode === "edit"
  const isViewMode = mode === "view"

  const { responseData: rolePermissions } = useRolePermissions({
    serviceName: "policy",
    screenName: "leavePolicy",
  })
  const viewMode = rolePermissions?.view || false
  const editMode = rolePermissions?.edit || false
  const addMode = rolePermissions?.add || false
  const isModeAllowed =
    (viewMode && mode === "view") ||
    (editMode && mode === "edit") ||
    (addMode && mode === "add")

  const [activeSection, setActiveSection] = useState<SectionId>("organization")

  const sidebarSections = useMemo(
    () => [
      {
        title: "Leave Policy Setup",
        items: [
          { id: "organization", label: "Organization", icon: "building" },
          { id: "policyDetails", label: "Policy Details", icon: "shield-check" },
          { id: "rulesRestrictions", label: "Rules & Restrictions", icon: "rule" },
          { id: "accrualSettings", label: "Accrual Settings", icon: "calendar" },
          { id: "balanceManagement", label: "Balance Management", icon: "balance" },
          { id: "encashment", label: "Encashment", icon: "cash" },
        ],
      },
    ],
    []
  )

  const goToNextTab = () => {
    const i = SECTION_ORDER.indexOf(activeSection)
    if (i >= 0 && i < SECTION_ORDER.length - 1) setActiveSection(SECTION_ORDER[i + 1])
  }

  const goToPreviousTab = () => {
    const i = SECTION_ORDER.indexOf(activeSection)
    if (i > 0) setActiveSection(SECTION_ORDER[i - 1])
  }

  const handleBack = () => router.push("/policy-management/leave-policy")

  const getPageTitle = () => {
    switch (mode) {
      case "add":
        return "Add New Leave Policy"
      case "edit":
        return "Edit Leave Policy"
      case "view":
        return "View Leave Policy"
      default:
        return "Leave Policy Management"
    }
  }

  const getPageDescription = () => {
    switch (mode) {
      case "add":
        return "Create a new leave policy with comprehensive configuration"
      case "edit":
        return "Update existing leave policy details"
      case "view":
        return "View leave policy details (read-only)"
      default:
        return "Manage leave policy configuration"
    }
  }

  if (!isModeAllowed) {
    return <PageNotFound />
  }

  return (
    <div className="">
    
                  <LeavePolicyController activeSection={activeSection} />
              
    </div>
  )
}