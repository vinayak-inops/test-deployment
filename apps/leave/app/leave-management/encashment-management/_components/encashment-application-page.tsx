"use client"
import React from 'react'
import EncashmentManagementApplication from './encashment-application';
import EncashmentApplicationApprover from './encashment-application-approver';
import { useRolePermissions } from '@/hooks/role-control/useRolePermissionsByScreenArray';
import EncashmentApplicationHeader from './encashment-application-header';

export default function EncashmentManagementPage() {
     // Get role permissions for approve/reject/cancel
            const { responseData: rolePermissions } = useRolePermissions({
                serviceName: 'applicationApplier',
                screenName: 'encashment'
            });
            const { responseData: roleApprover } = useRolePermissions({
                serviceName: 'applicationApprover',
                screenName: 'encashment'
            });
        // Note: shiftchApplicationsSelf has a typo in the backend (with 'ch'), matching the permission structure
        const canViewApps = !!(rolePermissions?.self || rolePermissions?.all);
        const isSelfPermission = !!rolePermissions?.self;
        const isAllPermission = !!rolePermissions?.all;
        const isApprovalPermission = !!(rolePermissions?.approve || rolePermissions?.reject || rolePermissions?.cancel || roleApprover?.approve || roleApprover?.reject || roleApprover?.cancel);
        const isApproverPermission = !!rolePermissions?.approve || !!roleApprover?.approve;
    
    return (
        <div className='w-full'>
          {(canViewApps || isApproverPermission) && (
            <EncashmentApplicationHeader
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
              {canViewApps && (
                <EncashmentManagementApplication 
                  isSelfPermission={isSelfPermission}
                  isAllPermission={isAllPermission}
                  isApprovalPermission={isApprovalPermission}
                />
              )}
              {isApproverPermission && (
                <div className={canViewApps ? 'mt-8' : ''}>
                  <EncashmentApplicationApprover 
                    isApprovalPermission={isApprovalPermission}
                  />
                </div>
              )}
              {!canViewApps && !isApproverPermission && (
                <div className='px-5 py-10'>
                  <div className='max-w-2xl mx-auto text-center border border-yellow-200 bg-yellow-50 rounded-md p-6'>
                    <h2 className='text-sm font-semibold text-gray-800'>Access Restricted</h2>
                    <p className='text-xs text-gray-600 mt-1'>You do not have permission to view Encashment Applications. Please contact your administrator.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    )
}
