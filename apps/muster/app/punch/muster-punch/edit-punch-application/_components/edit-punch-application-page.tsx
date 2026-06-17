"use client"
import React from 'react'
import EditPunchApplication from './edit-punch-application';
import { useRolePermissions } from '@/hooks/role-control/useRolePermissionsByScreenArray';

export default function EditPunchApplicationPage({ employeeID }: { employeeID?: string }) {
    const { responseData: rolePermissions } = useRolePermissions({
        serviceName: 'applicationApplier',
        screenName: 'editPunchApplication'
    });

    const canViewApps = !!(rolePermissions?.all || rolePermissions?.self);

    return (
        <div className='w-full flex justify-center'>
           <div className='w-full max-w-7xl'>
             {canViewApps ? (
               <EditPunchApplication employeeID={employeeID} />
             ) : (
               <div className='px-5 py-10'>
                 <div className='max-w-2xl mx-auto text-center border border-yellow-200 bg-yellow-50 rounded-md p-6'>
                   <h2 className='text-sm font-semibold text-gray-800'>Access Restricted</h2>
                   <p className='text-xs text-gray-600 mt-1'>You do not have permission to view Punch Applications. Please contact your administrator.</p>
                 </div>
               </div>
             )}
           </div>
        </div>
    )
}