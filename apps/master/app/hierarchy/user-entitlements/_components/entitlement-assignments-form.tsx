"use client"

import React, { useCallback } from 'react'
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, User, ChevronRight, ChevronLeft } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/components/ui/select'
import { useRouter } from 'next/navigation'

interface EntitlementAssignmentsFormProps {
  assignments: any[]
  totalCount: number
  isLoading: boolean
  countLoading: boolean
  searchTerm: string
  setSearchTerm: (term: string) => void
  debouncedSearchTerm: string
  selectedField: string
  setSelectedField: (field: string) => void
  currentPage: number
  setCurrentPage: (page: number) => void
  itemsPerPage: number
  viewMode: boolean
  editMode: boolean
  addMode: boolean
  deleteMode: boolean
  onAddNew?: () => void
  onEdit?: (assignment: any, mode?: "add" | "edit" | "view") => void
  onDelete?: (assignment: any) => void
  view?: "list" | "form"
}

export default function EntitlementAssignmentsForm({
  assignments,
  totalCount,
  isLoading,
  countLoading,
  searchTerm,
  setSearchTerm,
  debouncedSearchTerm,
  selectedField,
  setSelectedField,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  viewMode,
  editMode,
  addMode,
  deleteMode,
  onAddNew,
  onEdit,
  onDelete,
  view
}: EntitlementAssignmentsFormProps) {
  const router = useRouter()

  const searchFields = [
    { value: 'employeeID', label: 'Employee ID' },
    { value: 'entitlementCode', label: 'Entitlement Code' },
    { value: 'level', label: 'Level' }
  ]

  // Pagination calculations based on total count
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }, [currentPage])

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }, [currentPage, totalPages])

  const handleAddNew = () => {
    if (onAddNew) {
      onAddNew()
      return
    }
    router.push('/hierarchy/user-entitlements/create')
  }

  const handleView = (assignment: any) => {
    if (onEdit) {
      onEdit(assignment, "view")
      return
    }
    router.push(`/hierarchy/user-entitlements/view?id=${assignment._id}`)
  }

  const handleEdit = (assignment: any) => {
    if (onEdit) {
      onEdit(assignment, "edit")
      return
    }
    router.push(`/hierarchy/user-entitlements/edit?id=${assignment._id}`)
  }


  const handleDelete = (assignment: any) => {
    if (onDelete) {
      onDelete(assignment)
    }
  }

  // If user has no view permission, let the auto-navigation effect
  // send them directly to the form instead of showing the table.
  if (!viewMode) {
    return null
  }

    return (
    <div className="w-full max-w-5xl mx-auto pt-6">
      <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-xl font-semibold text-gray-900 mb-0">
          Entitlement Assignments
        </h1>
        <p className="text-base text-gray-600">
          Manage employee entitlement assignments and hierarchy
        </p>
      </div>

      {/* Search Field and Add Button */}
      <div className="flex items-center gap-4">
        <div className="flex bg-muted/50 rounded-lg border flex-1">
          {/* Field Selection - Left Side */}
          <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
            <Filter className="w-4 h-4 text-muted-foreground mr-2" />
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {searchFields.map((field) => (
                  <SelectItem key={field.value} value={field.value} className="text-sm">
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Field - Right Side */}
          <div className="flex-1 flex items-center bg-background rounded-r-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Search by ${searchFields.find(f => f.value === selectedField)?.label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
              />
            </div>
          </div>
        </div>
        {addMode && (
          <Button onClick={handleAddNew} size="default" className="h-10 bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add New Assignment
          </Button>
        )}
      </div>

      {/* Assignments List */}
      {(isLoading || countLoading) ? (
        <div className="text-center py-16">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments found</h3>
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            {debouncedSearchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first entitlement assignment'}
          </p>
          {!debouncedSearchTerm && (
            <Button onClick={handleAddNew} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {assignments.map((assignment, index) => (
              <div
                key={assignment._id || index}
                className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-all cursor-pointer"
                onClick={() => handleView(assignment)}
              >
                <div className="flex items-center justify-between">
                  {/* Left side: Icon and Content */}
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 mb-0.5">
                        {assignment?.employeeID || "N/A"}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {assignment.entitlementCode || "No entitlement code"}
                      </p>
                    </div>
                  </div>

                  {/* Right side: Actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {editMode && (
                      <button
                        onClick={() => handleEdit(assignment)}
                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {deleteMode && (
                      <button
                        onClick={() => handleDelete(assignment)}
                        className="p-1.5 rounded-md hover:bg-red-50 text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    {viewMode && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            title="More options"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => handleView(assignment)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Assignment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {startIndex + 1} to {endIndex} of {totalCount} results
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePrevious}
                          disabled={currentPage === 1}
                          className="h-8 px-3 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300"
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        
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
                              <Button
                                key={pageNumber}
                                variant={currentPage === pageNumber ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(pageNumber)}
                                className={`h-8 w-8 p-0 ${
                                  currentPage === pageNumber 
                                    ? 'bg-gray-600 hover:bg-gray-700 text-white border-gray-600' 
                                    : 'hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                {pageNumber}
                              </Button>
                            );
                          })}
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNext}
                          disabled={currentPage === totalPages}
                          className="h-8 px-3 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300"
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
      </div>
    </div>
    )
}