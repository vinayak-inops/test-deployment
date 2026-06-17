"use client"

import { Edit, ChevronLeft, ChevronRight } from "lucide-react"

interface PredefinedProperty {
  id?: string
  _id?: string
  prop: string
  description: string
  tenantCode?: string
  organizationCode?: string
}

interface PredefinedPropertiesTableViewProps {
  properties: PredefinedProperty[]
  loading: boolean
  searchTerm: string
  currentPage: number
  itemsPerPage: number
  totalPages: number
  startIndex: number
  endIndex: number
  totalItems: number
  expandedTitles: Set<string>
  expandedDescriptions: Set<string>
  onTitleToggle: (propertyId: string, e: React.MouseEvent) => void
  onDescriptionToggle: (propertyId: string, e: React.MouseEvent) => void
  onEdit: (id: string) => void
  onPageChange: (page: number) => void
}

export default function PredefinedPropertiesTableView({
  properties,
  loading,
  searchTerm,
  currentPage,
  itemsPerPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  expandedTitles,
  expandedDescriptions,
  onTitleToggle,
  onDescriptionToggle,
  onEdit,
  onPageChange,
}: PredefinedPropertiesTableViewProps) {
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page)
    }
  }

  return (
    <>
      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50">
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  S.No
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Props
                </th>
                <th className="px-6 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-500">Loading properties...</p>
                    </div>
                  </td>
                </tr>
              ) : properties.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className="text-sm text-gray-500">
                      {searchTerm ? "No properties found matching your search" : "No properties found"}
                    </p>
                  </td>
                </tr>
              ) : (
                properties.map((property, index) => (
                  <tr 
                    key={property._id} 
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">{startIndex + index + 1}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="inline-flex items-center">
                        <span 
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-medium bg-gray-100 text-gray-900 cursor-pointer hover:bg-gray-200 transition-colors"
                          onClick={(e) => onTitleToggle(property._id || "", e)}
                        >
                          {expandedTitles.has(property._id || "") || property.prop.length <= 20
                            ? property.prop
                            : `${property.prop.substring(0, 20)}...`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-2xl">
                        <p
                          className={`text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words ${
                            !expandedDescriptions.has(property._id || "")
                              ? "line-clamp-4"
                              : ""
                          }`}
                        >
                          {property.description}
                        </p>
                        {property.description.length > 100 && (
                          <button
                            type="button"
                            onClick={(e) => onDescriptionToggle(property._id || "", e)}
                            className="mt-2 text-xs text-gray-700 hover:text-black font-medium transition-colors duration-150"
                          >
                            {expandedDescriptions.has(property._id || "")
                              ? "Read less"
                              : "Read more"}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onEdit(property._id || "")}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-md text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100"
                          aria-label="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalItems > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(endIndex, totalItems)}
            </span>{" "}
            of <span className="font-medium">{totalItems}</span> results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => goToPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        currentPage === page
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white"
                          : "text-blue-700 bg-white border border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      {page}
                    </button>
                  )
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return (
                    <span key={page} className="px-2 text-gray-500">
                      ...
                    </span>
                  )
                }
                return null
              })}
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
