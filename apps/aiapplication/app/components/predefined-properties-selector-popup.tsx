"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { X, Search, Check, Zap, RefreshCw, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRequest } from "@repo/ui/hooks/api/useGetRequest"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

interface PredefinedProperty {
  id?: string
  _id?: string
  prop: string
  description: string
  tenantCode?: string
  organizationCode?: string
}

interface PredefinedPropertiesSelectorPopupProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (property: PredefinedProperty) => void
}

const searchFields = [
  { value: "prop", label: "Props" },
  { value: "description", label: "Description" },
]

export default function PredefinedPropertiesSelectorPopup({
  isOpen,
  onClose,
  onSelect,
}: PredefinedPropertiesSelectorPopupProps) {
  const tenantCode = useGetTenantCode()
  const [properties, setProperties] = useState<PredefinedProperty[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedField, setSelectedField] = useState("prop")
  const [selectedProperty, setSelectedProperty] = useState<PredefinedProperty | null>(null)
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const initialLimit = 15
  const loadMoreLimit = 15

  // Debounce search term - update after 350ms of no typing
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setOffset(0)
      setProperties([])
      setHasMore(true)
    }, 350)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [searchTerm])

  // Build API data array with filters using useMemo (server-side filtering like table)
  const apiData = useMemo(() => {
    const filters: any[] = [
      { field: "tenantCode", operator: "eq", value: tenantCode || "" },
      { field: "createdOn", operator: "desc", value: "" }
    ]

    // Add search filter if search term exists (server-side filtering)
    if (debouncedSearchTerm.trim()) {
      filters.push({
        field: selectedField,
        operator: "like",
        value: debouncedSearchTerm.trim()
      })
    }

    return filters
  }, [tenantCode, debouncedSearchTerm, selectedField])

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
    url: `preDefinedProps/search?offset=${offset}&limit=${offset === 0 ? initialLimit : loadMoreLimit}`,
    method: "POST",
    data: apiData,
    onSuccess: (data: any) => {
      const active = (data || []).filter((item: any) => item?.isDeleted !== true)
      
      const filteredData = active.map((item: any) => ({
        _id: item._id,
        prop: item.prop || "",
        description: item.description || "",
        tenantCode: item.tenantCode || "",
        organizationCode: item.organizationCode || "",
      }))
      
      if (offset === 0) {
        setProperties(filteredData)
        // Clear selection when properties list changes and no properties available
        // or if selected property has invalid description
        if (filteredData.length === 0) {
          setSelectedProperty(null)
        } else {
          setSelectedProperty((prev) => {
            // Clear selection if prev is invalid (null, empty object, or missing required fields)
            if (!prev || !prev._id || !prev.description || prev.description.trim() === "") {
              return null
            }
            const stillExists = filteredData.find((p: PredefinedProperty) => p._id === prev._id)
            if (!stillExists || !stillExists.description || stillExists.description.trim() === "") {
              return null
            }
            return prev
          })
        }
      } else {
        setProperties((prev: PredefinedProperty[]) => {
          const existingIds = new Set(prev.map((p: PredefinedProperty) => p._id))
          const newItems = filteredData.filter((item: PredefinedProperty) => !existingIds.has(item._id))
          return [...prev, ...newItems]
        })
      }
      
      const expectedLimit = offset === 0 ? initialLimit : loadMoreLimit
      setHasMore(filteredData.length === expectedLimit)
      setLoadingMore(false)
    },
    onError: (error: any) => {
      setLoadingMore(false)
    },
    dependencies: [tenantCode, offset, debouncedSearchTerm, selectedField]
  })

  // Load more function
  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      setLoadingMore(true)
      setOffset((prev) => prev + (prev === 0 ? initialLimit : loadMoreLimit))
    }
  }

  // Infinite scroll handler
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight
    
    if (scrollBottom < 100) {
      loadMore()
    }
  }

  useEffect(() => {
    if (isOpen) {
      setSearchTerm("")
      setDebouncedSearchTerm("")
      setSelectedField("prop")
      setProperties([])
      setSelectedProperty(null)
      setHasMore(true)
      setOffset(0)
    } else {
      setOffset(0)
      setProperties([])
    }
  }, [isOpen])

  // Display properties directly from API (server-side filtering)
  const displayProperties = properties

  const handleSelectProperty = (property: PredefinedProperty) => {
    // Only allow selection when there are properties available and description is not null or empty
    if (displayProperties.length > 0 && property.description && property.description.trim() !== "") {
      setSelectedProperty(property)
    }
  }

  const handleConfirm = () => {
    // Only confirm if selected property exists and has a valid description
    if (selectedProperty && selectedProperty.description && selectedProperty.description.trim() !== "") {
      onSelect(selectedProperty)
      onClose()
    }
  }

  const handleRefetch = () => {
    setOffset(0)
    setProperties([])
    setHasMore(true)
    refetch()
  }

  useEffect(() => {
    handleRefetch()
  }, [tenantCode, isOpen])

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "hidden"
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = "unset"
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50 px-4 animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-transparent w-full max-w-2xl flex flex-col animate-in zoom-in-95 duration-200">
        <div className="bg-white rounded-xl shadow-2xl border border-blue-200 w-full max-h-[85vh] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-blue-100">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">
                Select Predefined Property
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefetch}
                  disabled={loading}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-150 p-1.5 rounded-lg hover:bg-gray-100 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Refresh properties"
                  title="Refresh properties"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-all duration-150 p-1.5 rounded-lg hover:bg-gray-100 active:scale-95"
                  aria-label="Close popup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search Section */}
          <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/30">
            <div className="flex bg-blue-50 rounded-lg border border-blue-200 flex-1">
              {/* Field Selection - Left Side */}
              <div className="flex items-center bg-white border-r border-blue-200 rounded-l-lg px-3 py-2 w-40">
                <Filter className="w-4 h-4 text-gray-400 mr-2" />
                <Select value={selectedField} onValueChange={setSelectedField}>
                  <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-gray-900 focus:ring-0 bg-transparent shadow-none">
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
              <div className="flex-1 flex items-center bg-white rounded-r-lg relative">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors" />
                  <Input
                    type="text"
                    placeholder={`Search by ${searchFields.find((f) => f.value === selectedField)?.label.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm text-gray-900 placeholder:text-gray-400 focus:ring-0 focus:outline-none bg-transparent transition-all duration-200"
                    autoFocus
                  />
                </div>
                {searchTerm && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Properties List */}
          <div 
            ref={scrollContainerRef}
            className="flex-1 px-6 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent"
            onScroll={handleScroll}
          >
            {loading && properties.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin"></div>
                  <p className="text-sm text-gray-500 font-medium">Loading properties...</p>
                </div>
              </div>
            ) : displayProperties.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-gray-500 font-medium">
                  {debouncedSearchTerm ? "No properties found matching your search" : "No properties available"}
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {displayProperties.map((property, index, array) => (
                  <div
                    key={property._id}
                    className={`w-full transition-all duration-150 ${
                      index !== array.length - 1 ? "border-b border-blue-100 pb-0 mb-0" : "pb-0"
                    }`}
                  >
                    <button
                      onClick={() => handleSelectProperty(property)}
                      disabled={displayProperties.length === 0 || !property.description || property.description.trim() === ""}
                      className={`w-full text-left transition-all duration-150 rounded-lg p-3 -mx-1 hover:bg-blue-50 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
                        selectedProperty && selectedProperty._id && selectedProperty.description && selectedProperty.description.trim() !== "" && selectedProperty._id === property._id ? "bg-blue-50" : ""
                      }`}
                    >
                      <div>
                        {/* Property Name (Title) - Top */}
                        <div className="flex items-center justify-between mb-0">
                          <span className="text-sm font-semibold text-gray-900 tracking-tight">
                            {property.prop}
                          </span>
                          {selectedProperty && selectedProperty._id && selectedProperty.description && selectedProperty.description.trim() !== "" && selectedProperty._id === property._id && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm">
                              <Check className="w-3.5 h-3.5" />
                              <span className="text-xs font-medium">Selected</span>
                            </div>
                          )}
                        </div>

                        {/* Description */}
                        <div>
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                            {property.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
                
                {/* Loading more indicator */}
                {loadingMore && (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="text-xs text-gray-500">Loading more...</p>
                    </div>
                  </div>
                )}
                
                {/* End of list indicator */}
                {!hasMore && displayProperties.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-xs text-gray-400">No more properties to load</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-blue-100 bg-blue-50/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 active:scale-95 shadow-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!selectedProperty || !selectedProperty.description || selectedProperty.description.trim() === ""}
              className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700 shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Insert Property
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

