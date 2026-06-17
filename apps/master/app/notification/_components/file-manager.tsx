
'use client';
import React from "react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, CheckCircle, AlertCircle, Info, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import { useState, useEffect } from "react";


interface FileManagerProps {
  activeTab: string;
  notification: Array<{
    _id?: string;
    id?: string;
    title: string;
    message: string;
    type: string;
    priority?: string;
    status?: string;
    timestamp?: string;
    daysUntilExpiry?: string;
    createdOn?: string;
    expiry?: string;
    read: boolean;
  }>;
  onNotificationClick: (id: string) => void;
}
export default function FileManager({
  activeTab,
  notification,
  onNotificationClick,
}: FileManagerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset pagination to page 1 when activeTab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Filter notifications by tab
  const filteredData = activeTab === "all"
    ? notification
    : notification.filter((item: any) => item.type === activeTab);

  const unreadCount = filteredData.filter((n: any) => !n.read).length;

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  function getTypeIcon(type: string) {
    switch (type) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case "info":
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  }

  function getTypeBadgeVariant(type: string) {
    switch (type) {
      case "success":
        return "default";
      case "error":
        return "destructive";
      case "warning":
        return "secondary";
      case "info":
        return "outline";
      default:
        return "default";
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-0">
      <Card className="rounded-2xl shadow-sm border border-gray-200">
        <CardHeader className="border-b px-4 py-2 bg-white rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-semibold leading-tight">Notifications</CardTitle>
            <span className="ml-2 text-xs text-gray-500 font-normal">({unreadCount} unread)</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-b bg-gray-50">
                <TableHead className="w-10 text-center font-medium text-gray-700">Read</TableHead>
                <TableHead className="font-medium text-gray-700">Priority</TableHead>
                <TableHead className="font-medium text-gray-700">Title</TableHead>
                <TableHead className="font-medium text-gray-700">Message</TableHead>
                <TableHead className="font-medium text-gray-700">Status</TableHead>
                <TableHead className="text-right font-medium text-gray-700">Days to Expire</TableHead>
                <TableHead className="font-medium text-gray-700">Notification Receive Date</TableHead>
                <TableHead className="font-medium text-gray-700">Expiry</TableHead>
                <TableHead className="text-center font-medium text-gray-700">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedData.length > 0 ? (
                paginatedData.map((notification: any) => {
                  // Mark as important if high priority or within 2 days of expiry
                  const isImportant = (notification.priority?.toLowerCase?.() === 'high') || (notification.daysUntilExpiry !== undefined && Number(notification.daysUntilExpiry) <= 2);
                  return (
                    <TableRow
                      key={notification._id || notification.id}
                      className={`border-b last:border-0 transition-colors text-sm ${
                        !notification.read ? "bg-blue-50/60" : "bg-white"
                      } hover:bg-gray-100 cursor-pointer`}
                      onClick={() => onNotificationClick(notification._id || notification.id)}
                    >
                      <TableCell className="text-center align-middle">
                        {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full mx-auto" />}
                      </TableCell>
                      <TableCell className="align-middle text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          notification.priority?.toLowerCase() === 'high' 
                            ? 'bg-red-100 text-red-700' 
                            : notification.priority?.toLowerCase() === 'medium'
                            ? 'bg-yellow-100 text-yellow-700'
                            : notification.priority?.toLowerCase() === 'low'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {notification.priority || 'Normal'}
                        </span>
                      </TableCell>
                      <TableCell className="font-semibold align-middle whitespace-nowrap">{notification.title}</TableCell>
                      <TableCell className="text-gray-600 max-w-xs align-middle">
                        <div className="line-clamp-2 text-sm leading-tight">
                          {notification.message}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          notification.status?.toLowerCase() === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : notification.status?.toLowerCase() === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : notification.status?.toLowerCase() === 'expired'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {notification.status || 'Active'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs text-gray-500 align-middle whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Clock className="w-3 h-3" />
                          {notification.daysUntilExpiry ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              Number(notification.daysUntilExpiry) <= 2 
                                ? 'bg-red-100 text-red-700' 
                                : Number(notification.daysUntilExpiry) <= 7 
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {notification.daysUntilExpiry} days
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-xs text-gray-600 align-middle">
                        {notification.createdOn ? (
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                            {new Date(notification.createdOn).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: '2-digit'
                            })} {new Date(notification.createdOn).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-xs text-gray-600 align-middle">
                        {notification.expiry ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            new Date(notification.expiry) < new Date() 
                              ? 'bg-red-100 text-red-700' 
                              : new Date(notification.expiry) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {new Date(notification.expiry).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center align-middle">
                        <button
                          className="p-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                          onClick={e => { e.stopPropagation(); onNotificationClick(notification._id || notification.id); }}
                          title="View Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                    No {activeTab === "all" ? "" : activeTab} notifications found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t bg-white rounded-b-2xl">
            <div className="flex items-center text-sm text-gray-500">
              <span>
                Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of {filteredData.length} results
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevious}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                        currentPage === pageNumber
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border transition-colors ${
                  currentPage === totalPages
                    ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

