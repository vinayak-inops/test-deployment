"use client"
import React from 'react'
import EditPunchApplication from './edit-punch-application';
import EditPunchApplicationApprover from './edit-punch-application-approver';
import { useRolePermissions } from '@/hooks/role-control/useRolePermissionsByScreenArray';
import EditPunchApplicationHeader from './edit-punch-application-header';

export default function EditPunchApplicationPage() {
    const { responseData: rolePermissions } = useRolePermissions({
        serviceName: 'applicationApplier',
        screenName: 'editPunchApplication'
    });
    const { responseData: roleApprover } = useRolePermissions({
        serviceName: 'applicationApprover',
        screenName: 'editPunchApplication'
    });

    const isSelfPermission = !!(
        rolePermissions?.self ||
        rolePermissions?.editPunchSelf
    );
    const isAllPermission = !!(
        rolePermissions?.all ||
        rolePermissions?.editPunchAll
    );
    const canViewApps = isSelfPermission || isAllPermission;
    const isApprovalPermission = !!(
        rolePermissions?.approve ||
        rolePermissions?.reject ||
        rolePermissions?.cancel ||
        roleApprover?.approve ||
        roleApprover?.reject ||
        roleApprover?.cancel
    );
    const canAccessPage = canViewApps || isApprovalPermission;

    return (
        <div className='w-full'>
           {canAccessPage && (
             <EditPunchApplicationHeader
               onRefilter={() => {
                 // placeholder: wire to filters if needed
               }}
               onAddNew={() => {
                 // placeholder: could open a create form if needed
               }}
             />
           )}
           <div className='w-full flex justify-center'>
           <div className='w-full max-w-7xl'>
             {canAccessPage ? (
               <>
                 {canViewApps && <EditPunchApplication isSelfPermission={isSelfPermission} isAllPermission={isAllPermission} isApprovalPermission={isApprovalPermission} />}
                 {isApprovalPermission && (
                   <div className={canViewApps ? 'mt-8' : ''}>
                     <EditPunchApplicationApprover isApprovalPermission={isApprovalPermission} />
                   </div>
                 )}
               </>
             ) : (
               <div className='px-5 py-10'>
                 <div className='max-w-2xl mx-auto text-center border border-yellow-200 bg-yellow-50 rounded-md p-6'>
                   <h2 className='text-sm font-semibold text-gray-800'>Access Restricted</h2>
                   <p className='text-xs text-gray-600 mt-1'>You do not have permission to view Edit Punch Applications. Please contact your administrator.</p>
                 </div>
               </div>
             )}
           </div>
           </div>
        </div>
    )
}
