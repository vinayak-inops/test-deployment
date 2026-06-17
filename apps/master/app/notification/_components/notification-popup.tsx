"use client"
import React from 'react'
import { useRequest } from '@repo/ui/hooks/api/useGetRequest';
import { useEffect, useState, useRef } from 'react';
import { X, Calendar, AlertTriangle, Clock, User, Building } from 'lucide-react';

interface NotificationPopupProps {
    id: string;
    isOpen: boolean;
    onClose: () => void;
}

interface NotificationData {
    _id: string;
    organizationCode: string;
    tenantCode: string;
    employeeID: string;
    type: string;
    title: string;
    message: string;
    expiry: string;
    daysUntilExpiry: number;
    priority: string;
    status: string;
    createdOn: string;
}

export default function NotificationPopup({
        id,
        isOpen,
        onClose
}: NotificationPopupProps) {
        const [notification, setNotification] = useState<NotificationData | null>(null);
        const timerRef = useRef<number | null>(null)
        const hoverRef = useRef(false)
    
        const { data, error, loading, refetch } = useRequest<NotificationData[]>({
                url: `map/notifications/search?_id=${id}`,
                onSuccess: (data) => {
                        if (data && data.length > 0) {
                                setNotification(data[0]);
                        }
                }
        });

        useEffect(() => { 
                refetch();
        }, [ id]);

        useEffect(() => {
            // Auto-dismiss after 6 seconds unless hovered
            if (!isOpen) return
            const startTimer = () => {
                clearTimeoutIfNeeded()
                timerRef.current = window.setTimeout(() => {
                    if (!hoverRef.current) onClose()
                }, 6000)
            }

            const clearTimeoutIfNeeded = () => {
                if (timerRef.current) {
                    window.clearTimeout(timerRef.current)
                    timerRef.current = null
                }
            }

            startTimer()

            return () => {
                clearTimeoutIfNeeded()
            }
        }, [isOpen, notification])

        if (!isOpen) return null;

        const getPriorityColor = (priority: string | undefined) => {
        switch (priority?.toLowerCase()) {
            case 'high':
                return 'text-red-600 bg-red-100';
            case 'medium':
                return 'text-yellow-600 bg-yellow-100';
            case 'low':
                return 'text-green-600 bg-green-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusColor = (status: string | undefined) => {
        switch (status?.toLowerCase()) {
            case 'blocked':
                return 'text-red-600 bg-red-100';
            case 'active':
                return 'text-green-600 bg-green-100';
            case 'pending':
                return 'text-yellow-600 bg-yellow-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getTypeIcon = (type: string | undefined) => {
        switch (type?.toLowerCase()) {
            case 'labourlicense':
                return <User className="h-5 w-5" />;
            case 'workorder':
                return <Building className="h-5 w-5" />;
            case 'wcpolicy':
                return <AlertTriangle className="h-5 w-5" />;
            default:
                return <AlertTriangle className="h-5 w-5" />;
        }
    };

  const formatType = (t?: string) => {
    if (!t) return '-'
    try { return t.charAt(0).toUpperCase() + t.slice(1) } catch { return t }
  }

  const formatDays = (d?: number) => {
    const n = d ?? 0
    return `${n} day${n === 1 ? '' : 's'}`
  }

  const formatDateTime = (iso?: string) => {
    if (!iso) return '-'
    try {
      const d = new Date(iso)
      return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    } catch {
      return iso
    }
  }

    return (
        // top-right toast container
        <div className="fixed top-5 right-5 z-50 flex flex-col items-end space-y-3">
          <div
            role="status"
            aria-live="polite"
            onMouseEnter={() => { hoverRef.current = true; if (timerRef.current) window.clearTimeout(timerRef.current) }}
            onMouseLeave={() => { hoverRef.current = false; timerRef.current = window.setTimeout(() => onClose(), 4000) }}
            className="w-full max-w-md bg-white border border-gray-100 rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 animate-slide-in"
          >
                <div className="p-3 border-b border-gray-100 flex items-start gap-3">
              <div className="flex-shrink-0 p-2 rounded-md bg-blue-50">
                {getTypeIcon(notification?.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3 pb-2 border-b border-gray-100">
                  <div className="flex-1">
                    {/* Subject (Type) */}
                    <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">{formatType(notification?.type)}</div>
                    <h4 className="text-sm font-semibold text-gray-900">{notification?.title}</h4>
                    {/* Employee ID below grid */}
                    <div className="mt-2 text-xs text-gray-500">Employee ID: <span className="font-medium text-gray-800">{notification?.employeeID ?? '-'}</span></div>
                  </div>
                  <div className="ml-2 flex-shrink-0 flex flex-col items-end gap-1 min-w-[110px]">
                    {/* Notification date (Created On) */}
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-400">{formatDateTime(notification?.createdOn)}</div>
                      <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification?.priority)} border ${getPriorityColor(notification?.priority).includes('bg-') ? 'border-transparent' : 'border-gray-200'}`}>
                        {notification?.priority ?? 'N/A'}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(notification?.status)} border ${getStatusColor(notification?.status).includes('bg-') ? 'border-transparent' : 'border-gray-200'}`}>
                        {notification?.status ?? 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* full content area with scroll if long */}
            <div className="max-h-[60vh] overflow-y-auto p-3 space-y-3">
              <div>
                <h5 className="text-sm font-medium text-gray-800">Message</h5>
                <div className="mt-1 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  <p className="whitespace-pre-wrap">{notification?.message}</p>
                </div>
              </div>

              {(notification?.daysUntilExpiry ?? 0) <= 7 && (
                <div className="mt-1 p-3 bg-red-50 border border-red-200 rounded text-sm">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <h4 className="font-semibold text-red-800">Urgent Notice</h4>
                  </div>
                  <p className="text-red-700 mt-1 text-sm">This notification expires on <span className="font-medium">{formatDateTime(notification?.expiry)}</span> — <span className="font-medium">{formatDays(notification?.daysUntilExpiry)}</span> left. Please take immediate action.</p>
                </div>
              )}
            </div>
          </div>
        </div>
    )
}