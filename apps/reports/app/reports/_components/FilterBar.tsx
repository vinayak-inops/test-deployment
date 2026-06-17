'use client';

import { useState, useRef } from 'react';
import { Search, Grid, List, Filter, Plus } from 'lucide-react';
import { TableViewerButton } from './generate-reports/table-viewer-button';

interface FilterBarProps {
  onFilterChange?: (filters: { searchTerm: string; selectedFilters: string[] }) => void;
  onViewModeChange?: (mode: "grid" | "list") => void;
  currentViewMode?: "grid" | "list";
  onGenerateReport?: () => void;
  totalSelected?: number;
}

export default function FilterBar({ 
  onFilterChange, 
  onViewModeChange,
  currentViewMode = 'grid',
  onGenerateReport,
  totalSelected = 0
}: FilterBarProps) {
  const [viewMode, setViewMode] = useState(currentViewMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const filters = ['PDF', 'Excel', 'Report', 'Generated'];

  const toggleFilter = (filter: string) => {
    const newFilters = selectedFilters.includes(filter)
      ? selectedFilters.filter(f => f !== filter)
      : [...selectedFilters, filter];
    
    setSelectedFilters(newFilters);
    onFilterChange?.({ searchTerm, selectedFilters: newFilters });
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    onFilterChange?.({ searchTerm: value, selectedFilters });
  };

  const handleViewModeChange = (mode: "grid" | "list") => {
    setViewMode(mode);
    onViewModeChange?.(mode);
  };

  return (
    <div className="w-full">
      <div className="px-2 pb-2">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Search with Filter */}
          <div className="flex-1 max-w-3xl relative">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-gray-400 focus-within:shadow-sm transition-all bg-white">
              <Search className="absolute left-3 text-gray-400 pointer-events-none" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search Projects..."
                className="flex-1 pl-10 pr-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
              />
              
              {/* Filter Button Inside Search */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(!filterOpen)}
                  className={`px-3 py-2.5 border-l border-gray-300 transition-colors flex items-center gap-1.5 ${
                    filterOpen || selectedFilters.length > 0
                      ? 'bg-blue-50 hover:bg-blue-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <Filter size={16} className={filterOpen || selectedFilters.length > 0 ? 'text-blue-600' : 'text-gray-600'} />
                  <span className={`text-sm ${filterOpen || selectedFilters.length > 0 ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
                    Filter
                  </span>
                </button>
                
                {filterOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setFilterOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-56 border border-gray-200 rounded-md shadow-lg z-20 py-2">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                        Filter by
                      </div>
                      {filters.map(filter => (
                        <button
                          key={filter}
                          onClick={() => toggleFilter(filter)}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between ${
                            selectedFilters.includes(filter)
                              ? 'bg-blue-50 text-blue-700 font-medium'
                              : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                          }`}
                        >
                          <span>{filter}</span>
                          {selectedFilters.includes(filter) && (
                            <span className="text-blue-600 font-semibold">✓</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-md">
              <button
                onClick={() => handleViewModeChange('list')}
                className={`p-2.5 rounded-l-md transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <List size={18} />
              </button>
              <button
                onClick={() => handleViewModeChange('grid')}
                className={`p-2.5 rounded-r-md border-l border-gray-300 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                    : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Grid size={18} />
              </button>
            </div>

            {/* Generate Reports Button */}
            <TableViewerButton
              totalSelected={totalSelected}
              onOpen={onGenerateReport || (() => {})}
              variant="inline"
            />
          </div>
        </div>
      </div>
    </div>
  );
}