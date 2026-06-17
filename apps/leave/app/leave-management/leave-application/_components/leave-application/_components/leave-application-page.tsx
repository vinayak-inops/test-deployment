"use client"
import React from 'react'
import LeaveApplication from './leave-application';
import LeaveApplicationApprover from './leave-application-approver';
import { useRolePermissions } from '@/hooks/role-control/useRolePermissionsByScreenArray';

export default function LeaveApplicationPage() {
    // Get role permissions for approve/reject/cancel
            const { responseData: rolePermissions } = useRolePermissions({
                serviceName: 'applicationApplier',
                screenName: 'leave'
            });
            const { responseData: roleApprover } = useRolePermissions({
                serviceName: 'applicationApprover',
                screenName: 'leave'
            });
        // Note: shiftchApplicationsSelf has a typo in the backend (with 'ch'), matching the permission structure
        const canViewApps = !!(rolePermissions?.self || rolePermissions?.all);
        const isSelfPermission = !!rolePermissions?.self;
        const isAllPermission = !!rolePermissions?.all;
        const isApprover = !!(rolePermissions?.approve || rolePermissions?.reject || rolePermissions?.cancel || roleApprover?.approve || roleApprover?.reject || roleApprover?.cancel);
       
    return (
        <div className='w-full flex justify-center'>
           <div className='w-full max-w-7xl'>
             {canViewApps && (
               <LeaveApplication 
                 isSelfPermission={isSelfPermission}
                 isAllPermission={isAllPermission}
               />
             )}
             {isApprover && (
               <div className={canViewApps ? 'mt-4 mb-6' : ''}>
                 <LeaveApplicationApprover />
               </div>
             )}
             {!canViewApps && !isApprover && (
               <div className='px-5 py-10'>
                 <div className='max-w-2xl mx-auto text-center border border-yellow-200 bg-yellow-50 rounded-md p-6'>
                   <h2 className='text-sm font-semibold text-gray-800'>Access Restricted</h2>
                   <p className='text-xs text-gray-600 mt-1'>You do not have permission to view Leave Applications. Please contact your administrator.</p>
                 </div>
               </div>
             )}
           </div>
        </div>
    )
}
