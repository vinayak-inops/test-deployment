"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"
import PredefinedPropertiesPopup from "./predefined-properties-popup"
import PredefinedPropertiesFilter from "./predefined-properties-filter"
import PredefinedPropertiesTableView from "./predefined-properties-table-view"

interface PredefinedProperty {
  id?: string
  _id?: string
  prop: string
  description: string
  tenantCode?: string
  organizationCode?: string
}

function PredefinedPropertiesTable() {
  const tenantCode = useGetTenantCode()
  const [properties, setProperties] = useState<PredefinedProperty[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedField, setSelectedField] = useState("prop")
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [editingProperty, setEditingProperty] = useState<PredefinedProperty | null>(null)
  const [action, setAction] = useState<any>(null)
  const [expandedTitles, setExpandedTitles] = useState<Set<string>>(new Set())
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const itemsPerPage = 10
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Calculate offset and limit based on current page
  const offset = (currentPage - 1) * itemsPerPage
  const limit = itemsPerPage

  // Debounce search term - update after 350ms of no typing
  useEffect(() => {
    // Show searching state when user is typing
    if (searchTerm !== debouncedSearchTerm) {
      setIsSearching(true)
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setIsSearching(false)
    }, 350)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchTerm, debouncedSearchTerm])

  // Build API data array with filters using useMemo
  const apiData = useMemo(() => {
    const filters: any[] = [
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
      { field: "createdOn", operator: "desc", value: "" }
    ]

    // Add search filter if search term exists
    if (debouncedSearchTerm.trim()) {
      filters.push({
        field: selectedField, // Dynamic field based on selected filter (prop or description)
        operator: "like",
        value: debouncedSearchTerm.trim() // Trim only start and end whitespace
      })
    }

    return filters
  }, [tenantCode, debouncedSearchTerm, selectedField])

  // Count API data (without sort)
  const countApiData = useMemo(() => {
    return apiData.filter((f: any) => f.field !== "createdOn")
  }, [apiData])

  // Count API call to get total collection length
  const {
    data: countData,
    loading: countLoading,
    error: countError,
    refetch: refetchCount,
  }: {
    data: any
    loading: any
    error: any
    refetch: any
  } = useRequest<any>({
    url: "preDefinedProps/count",
    method: "POST",
    data: countApiData,
    onSuccess: (data: any) => {
      setTotalCount(data || 0)
    },
    onError: (error: any) => {
    },
    dependencies: [tenantCode, debouncedSearchTerm, selectedField]
  })

  // Search API call with dynamic offset and limit
  const {
    data,
    error,
    loading,
    refetch,
  }: {
    data: any
    error: any
    loading: any
    refetch: any
  } = useRequest<any[]>({
    url: `preDefinedProps/search?offset=${offset}&limit=${limit}`,
    method: "POST",
    data: apiData,
    onSuccess: (data: any) => {
      // Filter out deleted items
      const active = (data || []).filter((item: any) => item?.isDeleted !== true)
      
      // Map data to include both _id and id for compatibility
      const filteredData = active.map((item: any) => ({
        _id: item._id,
        prop: item.prop || "",
        description: item.description || "",
        tenantCode: item.tenantCode || "",
        organizationCode: item.organizationCode || "",
      }))
      
      setProperties(filteredData)
    },
    onError: (error: any) => {
    },
    dependencies: [tenantCode, currentPage, offset, limit, debouncedSearchTerm, selectedField]
  })

  // Refetch when action changes (after save/delete)
  useEffect(() => {
      refetch()
      refetchCount()
  }, [action])

  // Reset to page 1 when debounced search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, selectedField])

  // Pagination calculations based on total count
  const totalPages = Math.ceil(totalCount / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)
  
  // Display properties directly from API (server-side filtering)
  const displayProperties = properties

  const handleAdd = () => {
    setEditingProperty(null)
    setIsPopupOpen(true)
  }

  const handleEdit = (_id: string) => {
    const property = properties.find((p) => p._id === _id)
    if (property) {
      setEditingProperty(property)
      setIsPopupOpen(true)
    }
  }


  const handleSaveProperty = (data: PredefinedProperty) => {
    setIsPopupOpen(false)
    setEditingProperty(null)
    setAction(Date.now()) // Trigger refetch after save
    return true
  }

  const toggleTitleExpansion = (propertyId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedTitles((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId)
      } else {
        newSet.add(propertyId)
      }
      return newSet
    })
  }

  const toggleDescriptionExpansion = (propertyId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedDescriptions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(propertyId)) {
        newSet.delete(propertyId)
      } else {
        newSet.add(propertyId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-0">
      <div className="space-y-4">
        {/* Filter Component */}
        <PredefinedPropertiesFilter
          searchTerm={searchTerm}
          selectedField={selectedField}
          onSearchChange={setSearchTerm}
          onFieldChange={setSelectedField}
          onAddClick={handleAdd}
        />

        {/* Table Component */}
        <PredefinedPropertiesTableView
          properties={displayProperties}
          loading={loading || countLoading}
          searchTerm={searchTerm}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          totalPages={totalPages}
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={totalCount}
          expandedTitles={expandedTitles}
          expandedDescriptions={expandedDescriptions}
          onTitleToggle={toggleTitleExpansion}
          onDescriptionToggle={toggleDescriptionExpansion}
          onEdit={handleEdit}
          onPageChange={setCurrentPage}
        />
        </div>

      {/* Popup */}
      <PredefinedPropertiesPopup
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false)
          setEditingProperty(null)
        }}
        onSubmit={handleSaveProperty}
        initialValues={editingProperty}
      />
    </div>
  )
}

export default PredefinedPropertiesTable