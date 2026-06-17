"use client"
import { VerticalSidebar } from "@/components/tab/vertica-sidebar-tab";
import { useState } from "react";
import { Settings, MoreHorizontal } from "lucide-react";
import SettingApplicationHeader from "./setting-application-header";
import UnderDevelopment from "./under-development";
import PredefinedProperties from "../predefined-properties/predefined-properties";

export default function SettingsPage() {
  const [activeId, setActiveId] = useState<string>("preDefinedProps")
  const sections = [
    {
      title: "Settings",
      items: [
        { id: "preDefinedProps", label: "AI Chat Properties", icon: "settings" },
        { id: "apiConfig", label: "API Configuration", icon: "zap" },
        { id: "conversationSettings", label: "Conversation Settings", icon: "message-square" },
        { id: "dataManagement", label: "Data Management", icon: "database" },
      ],
    },
  ]

  return (
    <>
    <div className="w-full px-12">
        
        <SettingApplicationHeader title="AI Chat Settings" description="Configure and manage your AI chat preferences, conversations, and settings" />
      </div>
    <div className='flex justify-center min-h-screen'>
      
      <div className="w-full max-w-7xl ">
        {/* Global header spanning sidebar and content */}

        <div className="flex w-full ">
          <VerticalSidebar
          sections={sections}
          activeId={activeId}
          onItemClick={(id:any) => setActiveId(id as string)}
          />
          <div className="flex-1 overflow-auto p-8 pt-6">
            {activeId === 'preDefinedProps' && (
              <div>
                <PredefinedProperties />
              </div>
            )}
            {activeId === 'apiConfig' && (
              <UnderDevelopment />
            )}
            {activeId === 'conversationSettings' && (
              <UnderDevelopment />
            )}
            {activeId === 'dataManagement' && (
              <UnderDevelopment />
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}