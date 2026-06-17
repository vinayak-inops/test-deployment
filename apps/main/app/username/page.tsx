"use client"
import React from 'react'
import { Username } from './_components/username'
import Header from '@/components/header/header'
import { navItems } from '@/json/menu/menu'

export default function UsernamePage() {
    return (
        <>
        <div className="sticky top-0 z-[100]">
            {/* <MainHeader navItems={navItems} /> */}
            <Header serviceName="Main" navItems={navItems} />
        </div>
        <div className="w-full flex justify-center py-0">
            <div className="w-full">
                <Username
                    duplicateData={[]}
                    refetch={() => { }}
                />
            </div>
        </div>
        </>
        
    )
}