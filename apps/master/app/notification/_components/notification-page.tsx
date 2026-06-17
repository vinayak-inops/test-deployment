"use client"
import React from 'react'
import { useState, useEffect } from 'react';
import NotificationTab from './notification-tab';
import FileManager from './file-manager';
import NotificationSearch from './notification-serach';
import { useRequest } from '@repo/ui/hooks/api/useGetRequest';
import { useRolePermissions } from "@/hooks/role-control/useRolePermissionsByScreenArray";
import { useEmpHierarchy } from "@/hooks/hierarchy/emp-hierarchy";
import NotificationPopup from './notification-popup';
import PageNotFound from "@/components/page-notfound";
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode";

export default function NotificationPage() {
    const [activeTab, setActiveTab] = useState('all');
    const [notification, setNotification] = useState<any[]>([])
    const [filteredNotifications, setFilteredNotifications] = useState<any[]>([])
    const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState<{field: string, value: string} | null>(null);
    const tenantCode = useGetTenantCode();
    const { employeeIds } = useEmpHierarchy();

    const { 
      responseData: rolePermissions, 
  } = useRolePermissions({
      serviceName: "settings",
      screenName: "notification"
  });


    // Extract permission states from the hook response
    const viewMode = rolePermissions?.view || false;
    const editMode = rolePermissions?.edit || false;
    const addMode = rolePermissions?.add || false;
    const deleteMode = rolePermissions?.delete || false;

   
    const {
        data:notificationData,
        error:singleError,
        loading:notificationLoading,
        refetch:fetchNotificationData
    }: {
        data: any;
        error:any,
        loading:any,
        refetch:any,
    } = useRequest<any[]>({
        url: 'notifications/search',
        method: 'POST',
        data: [
            {
                field: "tenantCode",
                value: tenantCode,
                operator: "eq",
            }
        ],
        onSuccess: (data: any) => {
            const filteredData = data.map((item: any) => {
                return {
                    _id: item._id,
                    tenantCode: item.tenantCode,
                    title: item.title,
                    type: item.type,
                    message: (item.message || '').substring(0, 100) + ((item.message || '').length > 100 ? '...' : ''),
                    daysUntilExpiry: item.daysUntilExpiry,
                    priority: item.priority,
                    status: item.status,
                    createdOn: item.createdOn,
                    expiry: item.expiry,
                }
            });
            setNotification([...filteredData].reverse());
            setFilteredNotifications([...filteredData].reverse());
        },
        onError: (error: any) => {
            console.error('Error loading organization data:', error);
        }
    });

    useEffect(() => {
        fetchNotificationData();
    }, [tenantCode]);


  const handleNotificationClick = (notificationId: string) => {
    setSelectedNotificationId(notificationId);
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setSelectedNotificationId(null);
  };

  const handleSearch = (field: string, value: string) => {
    setSearchQuery({ field, value });
    // The useEffect will handle updating filteredNotifications when searchQuery changes
  };

  const handleClearSearch = () => {
    setSearchQuery(null);
    // The useEffect will handle updating filteredNotifications when searchQuery changes
  };

  // Update filtered notifications when activeTab changes
  useEffect(() => {
    let filtered = [...notification];
    
    // Apply tab filtering
    if (activeTab !== 'all') {
      filtered = filtered.filter((item: any) => {
        if (activeTab === 'active') return item.status === 'active';
        if (activeTab === 'expired') return item.status === 'expired';
        if (activeTab === 'urgent') return item.priority === 'high' || item.priority === 'urgent';
        return true;
      });
    }
    
    // Apply search filtering if search query exists
    if (searchQuery) {
      filtered = filtered.filter((item: any) => {
        const fieldValue = item[searchQuery.field]?.toString().toLowerCase() || '';
        return fieldValue.includes(searchQuery.value.toLowerCase());
      });
    }
    
    setFilteredNotifications(filtered);
  }, [activeTab, notification, searchQuery]);

  return (
    <>
      {
        (!viewMode && !editMode && !addMode) ? (
          <PageNotFound />
        ) : (
          <div className="w-full max-w-7xl min-h-screen mx-auto flex flex-col gap-0">
            
            <div className="flex gap-0">
              {/* Left Side - Notifications */}
              <div className="flex-1">
                
            <NotificationTab activeTab={activeTab} setActiveTab={setActiveTab} />
              </div>
              
              {/* Right Side - Search */}
              <div className="w-80">
                <NotificationSearch 
                  onSearch={handleSearch}
                  onClear={handleClearSearch}
                />
              </div>
            </div>
            <FileManager 
                  activeTab={activeTab} 
                  notification={filteredNotifications}
                  onNotificationClick={handleNotificationClick}
                />
            
            {selectedNotificationId && (
              <NotificationPopup 
                id={selectedNotificationId} 
                isOpen={isPopupOpen}
                onClose={handleClosePopup}
              />
            )}
          </div>
        )
      }
    </>
  );
}