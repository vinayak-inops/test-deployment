"use client"
import React from 'react'
import OtApplication from './ot-application';
import OtApplicationApprover from './ot-application-approver';
import { useRolePermissions } from '@/hooks/role-control/useRolePermissions';

export default function OtApplicationPage() {
    const { responseData: rolePermissions } = useRolePermissions({
        serviceName: 'OT',
        screenName: 'ot-application'
    });

    const canViewApps = !!(rolePermissions?.otchApplicationsSelf || rolePermissions?.otApplicationsAll);
    const isSelfPermission = !!rolePermissions?.otchApplicationsSelf;
    const isAllPermission = !!rolePermissions?.otApplicationsAll;
    const isApprovalPermission = !!(rolePermissions?.otApplicationsApprove || rolePermissions?.otApplicationsReject || rolePermissions?.otApplicationsCancel);
    const isApproverPermission = !!rolePermissions?.otApplicationsApprover;

    return (
        <div className='w-full'>
          <div className='w-full flex justify-center'>
            <div className='w-full max-w-7xl'>
              {canViewApps && (
                <OtApplication 
                  isSelfPermission={isSelfPermission}
                  isAllPermission={isAllPermission}
                  isApprovalPermission={isApprovalPermission}
                />
              )}
              {isApproverPermission && (
                <div className={canViewApps ? 'mt-4' : ''}>
                  <OtApplicationApprover 
                    isApprovalPermission={isApprovalPermission}
                  />
                </div>
              )}
              {!canViewApps && !isApproverPermission && (
                <div className='px-5 py-10'>
                  <div className='max-w-2xl mx-auto text-center border border-yellow-200 bg-yellow-50 rounded-md p-6'>
                    <h2 className='text-sm font-semibold text-gray-800'>Access Restricted</h2>
                    <p className='text-xs text-gray-600 mt-1'>You do not have permission to view OT Applications. Please contact your administrator.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
    )
}
