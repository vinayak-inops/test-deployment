"use client";

import React, { useState } from 'react';
import { permissionTabs } from '@/json/fields/tabs';


interface TabProps {
  activeTab: string;
  setActiveTab: (tabId: string) => void;
}

export default function Tab({ activeTab, setActiveTab }: TabProps) {
  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="py-4 mb-2">
      {/* Filter Tabs */}
      <div className="flex items-center justify-start">
        <div className="flex bg-gray-50 rounded-xl p-0">
          {permissionTabs.map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`px-5 text-sm font-medium transition-colors whitespace-nowrap py-2 border-b-2 ${
                  activeTab === tab.id
                    ? 'text-gray-900 border-gray-900 bg-white'
                    : 'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300'
                } ${
                  index === 0 ? 'rounded-l-xl' : 
                  index === permissionTabs.length - 1 ? 'rounded-r-xl' : 
                  ''
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}