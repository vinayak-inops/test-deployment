'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Check, X, ChevronDown, Search } from 'lucide-react';
import { Button } from '@repo/ui/components/ui/button';
import { Badge } from '@repo/ui/components/ui/badge';
import { cn } from '@repo/ui/utils/shadcnui/cn';

interface Option {
  value: string;
  label: string;
}

interface FilterField {
  name: string;
  label: string;
  placeholder: string;
  parentField?: string;
  options: Option[];
  selectedValues: string[];
  isEnabled: boolean;
  isRequired: boolean;
}

interface EmployeeValueFilterProps {
  organizationData?: any;
  onFilterChange?: (filters: Record<string, string[]>) => void;
  initialFilters?: Record<string, string[]>;
}

const PARENT_FIELD_MAP: Record<string, string | undefined> = {
  subsidiaries: undefined,
  location: undefined,
  divisions: 'subsidiaries',
  designations: 'divisions',
  grades: 'designations',
  departments: 'divisions',
  subDepartments: 'departments',
  sections: 'subDepartments'
};

const FIELD_LABELS: Record<string, string> = {
  subsidiaries: 'Subsidiaries',
  location: 'Location',
  divisions: 'Divisions',
  designations: 'Designations',
  grades: 'Grades',
  departments: 'Departments',
  subDepartments: 'Sub Departments',
  sections: 'Sections'
};

const FIELD_PLACEHOLDERS: Record<string, string> = {
  subsidiaries: 'Select items...',
  location: 'Select items...',
  divisions: 'Select parent first...',
  designations: 'Select parent first...',
  grades: 'Select parent first...',
  departments: 'Select parent first...',
  subDepartments: 'Select parent first...',
  sections: 'Select parent first...'
};

export default function EmployeeValueFilter({ 
  organizationData, 
  onFilterChange, 
  initialFilters = {} 
}: EmployeeValueFilterProps) {
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>(initialFilters);
  const [filterCheckboxes, setFilterCheckboxes] = useState<Record<string, boolean>>({
    divisions: false,
    location: false,
    designations: false,
    grades: false,
    departments: false,
    subDepartments: false,
    sections: false
  });

  // Initialize with organization data
  const availableOptions = useMemo(() => {
    if (!organizationData) return {} as Record<string, Option[]>;
    
    return {
      subsidiaries: organizationData.subsidiaries || [],
      location: organizationData.location || [],
      divisions: organizationData.divisions || [],
      designations: organizationData.designations || [],
      grades: organizationData.grades || [],
      departments: organizationData.departments || [],
      subDepartments: organizationData.subDepartments || [],
      sections: organizationData.sections || []
    } as Record<string, Option[]>;
  }, [organizationData]);

  // Filter options based on parent selections
  const filteredOptions = useMemo(() => {
    const filtered: Record<string, Option[]> = {};

    // Initialize with available options, ensuring all are arrays
    Object.keys(PARENT_FIELD_MAP).forEach(fieldName => {
      filtered[fieldName] = availableOptions[fieldName] || [];
    });

    // Apply parent filtering
    Object.keys(PARENT_FIELD_MAP).forEach(fieldName => {
      const parentField = PARENT_FIELD_MAP[fieldName];
      if (parentField && selectedFilters[parentField]) {
        const parentValues = selectedFilters[parentField];
        const fieldData = availableOptions[fieldName] || [];
        
        filtered[fieldName] = fieldData.filter((item: any) => {
          if (fieldName === 'divisions') {
            return parentValues.includes(item.subsidiaryCode);
          } else if (fieldName === 'departments') {
            return parentValues.includes(item.divisionCode);
          } else if (fieldName === 'subDepartments') {
            return parentValues.includes(item.departmentCode);
          } else if (fieldName === 'sections') {
            return parentValues.includes(item.subDepartmentCode);
          } else if (fieldName === 'designations') {
            return parentValues.includes(item.divisionCode);
          } else if (fieldName === 'grades') {
            return parentValues.includes(item.designationCode);
          }
          return true;
        });
      }
    });

    return filtered;
  }, [availableOptions, selectedFilters]);

  // Check if field should be enabled (parent dependency only)
  const isFieldEnabledByParent = (fieldName: string): boolean => {
    const parentField = PARENT_FIELD_MAP[fieldName];
    if (!parentField) return true;
    
    const parentValues = selectedFilters[parentField];
    return parentValues && parentValues.length > 0;
  };

  // Whether user opted-in to filter this field (left panel)
  const isFieldSelectedInLeftPanel = (fieldName: string): boolean => {
    // Subsidiaries has no checkbox; always available
    if (fieldName === 'subsidiaries') return true;
    return Boolean(filterCheckboxes[fieldName]);
  };

  // Final enabled state combines left selection and parent dependency
  const canInteractWithField = (fieldName: string): boolean =>
    isFieldSelectedInLeftPanel(fieldName) && isFieldEnabledByParent(fieldName);

  // Handle filter checkbox change
  const handleFilterCheckboxChange = (fieldName: string, checked: boolean) => {
    setFilterCheckboxes(prev => ({
      ...prev,
      [fieldName]: checked
    }));

    // When a field is unchecked, clear it and all its descendants
    if (!checked) {
      const queue: string[] = [fieldName];
      const toClear = new Set<string>();
      while (queue.length) {
        const current = queue.shift() as string;
        toClear.add(current);
        Object.keys(PARENT_FIELD_MAP).forEach(child => {
          if (PARENT_FIELD_MAP[child] === current) queue.push(child);
        });
      }
      if (toClear.size > 0) {
        const newFilters = { ...selectedFilters } as Record<string, string[]>;
        toClear.forEach(f => { newFilters[f] = []; });
        setSelectedFilters(newFilters);
        onFilterChange?.(newFilters);
      }
    }
  };

  // Handle dropdown value change
  const handleDropdownChange = (fieldName: string, values: string[]) => {
    const newFilters = { ...selectedFilters, [fieldName]: values };
    setSelectedFilters(newFilters);
    
    // Clear child field selections when parent changes
    const childFields = Object.keys(PARENT_FIELD_MAP).filter(
      key => PARENT_FIELD_MAP[key] === fieldName
    );
    
    childFields.forEach(childField => {
      newFilters[childField] = [];
    });
    
    setSelectedFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  // Handle item selection/deselection
  const handleItemToggle = (fieldName: string, value: string) => {
    const currentValues = selectedFilters[fieldName] || [];
    const isSelected = currentValues.includes(value);
    
    const newValues = isSelected
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    handleDropdownChange(fieldName, newValues);
  };

  // Handle select all for a field
  const handleSelectAll = (fieldName: string) => {
    const options = filteredOptions[fieldName] || [];
    const allValues = options.map(opt => opt.value);
    const currentValues = selectedFilters[fieldName] || [];
    
    const newValues = currentValues.length === allValues.length ? [] : allValues;
    handleDropdownChange(fieldName, newValues);
  };

  // Get display text for dropdown
  const getDropdownDisplayText = (fieldName: string): string => {
    const values = selectedFilters[fieldName] || [];
    if (values.length === 0) {
      return canInteractWithField(fieldName) 
        ? FIELD_PLACEHOLDERS[fieldName] 
        : 'Select parent first...';
    }
    return `${values.length} item${values.length > 1 ? 's' : ''} selected`;
  };

  // Get item label by value
  const getItemLabel = (fieldName: string, value: string): string => {
    const options = availableOptions[fieldName] || [];
    const item = options.find((opt: Option) => opt.value === value);
    return item?.label || value;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900">Basic Filter</h3>
        <p className="text-sm text-gray-500 mt-1">
          Select filter parameters and apply filters to your data
        </p>
      </div>

      <div className="flex">
        {/* Left Side - Select Filtration Parameters */}
        <div className="w-1/2 p-6 border-r border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Select Filtration Parameters
          </h4>
          
          <div className="space-y-3">
            {Object.entries(filterCheckboxes).map(([fieldName, checked]) => (
              <label key={fieldName} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => handleFilterCheckboxChange(fieldName, e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {fieldName === 'department' ? 'Department' : 
                   fieldName === 'subDepartment' ? 'Sub Department' : 
                   fieldName}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Right Side - Filter The Data */}
        <div className="w-1/2 p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Filter The Data
          </h4>
          
          <div className="grid grid-cols-3 gap-4">
            {/* Row 1 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Subsidiaries
              </label>
              <DropdownField
                fieldName="subsidiaries"
                options={filteredOptions.subsidiaries || []}
                selectedValues={selectedFilters.subsidiaries || []}
                isEnabled={true}
                placeholder={FIELD_PLACEHOLDERS.subsidiaries}
                onValueChange={(values) => handleDropdownChange('subsidiaries', values)}
                onItemToggle={(value) => handleItemToggle('subsidiaries', value)}
                onSelectAll={() => handleSelectAll('subsidiaries')}
                getItemLabel={(value) => getItemLabel('subsidiaries', value)}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <DropdownField
                fieldName="location"
                options={filteredOptions.location || []}
                selectedValues={selectedFilters.location || []}
                isEnabled={canInteractWithField('location')}
                placeholder={FIELD_PLACEHOLDERS.location}
                onValueChange={(values) => handleDropdownChange('location', values)}
                onItemToggle={(value) => handleItemToggle('location', value)}
                onSelectAll={() => handleSelectAll('location')}
                getItemLabel={(value) => getItemLabel('location', value)}
              />
              {!isFieldSelectedInLeftPanel('location') && (
                <p className="text-xs text-gray-400 mt-1">Enable this filter from left panel</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Divisions
              </label>
              <DropdownField
                fieldName="divisions"
                options={filteredOptions.divisions || []}
                selectedValues={selectedFilters.divisions || []}
                isEnabled={canInteractWithField('divisions')}
                placeholder={FIELD_PLACEHOLDERS.divisions}
                onValueChange={(values) => handleDropdownChange('divisions', values)}
                onItemToggle={(value) => handleItemToggle('divisions', value)}
                onSelectAll={() => handleSelectAll('divisions')}
                getItemLabel={(value) => getItemLabel('divisions', value)}
              />
              {!isFieldSelectedInLeftPanel('divisions') && (
                <p className="text-xs text-gray-400 mt-1">Enable this filter from left panel</p>
              )}
              {isFieldSelectedInLeftPanel('divisions') && !isFieldEnabledByParent('divisions') && (
                <p className="text-xs text-gray-400 mt-1">
                  Please select a parent field first to enable this selection
                </p>
              )}
            </div>

            {/* Row 2 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Designations
              </label>
              <DropdownField
                fieldName="designations"
                options={filteredOptions.designations || []}
                selectedValues={selectedFilters.designations || []}
                isEnabled={canInteractWithField('designations')}
                placeholder={FIELD_PLACEHOLDERS.designations}
                onValueChange={(values) => handleDropdownChange('designations', values)}
                onItemToggle={(value) => handleItemToggle('designations', value)}
                onSelectAll={() => handleSelectAll('designations')}
                getItemLabel={(value) => getItemLabel('designations', value)}
              />
              {!isFieldSelectedInLeftPanel('designations') && (
                <p className="text-xs text-gray-400 mt-1">Enable this filter from left panel</p>
              )}
              {isFieldSelectedInLeftPanel('designations') && !isFieldEnabledByParent('designations') && (
                <p className="text-xs text-gray-400 mt-1">
                  Please select a parent field first to enable this selection
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Grades
              </label>
              <DropdownField
                fieldName="grades"
                options={filteredOptions.grades || []}
                selectedValues={selectedFilters.grades || []}
                isEnabled={canInteractWithField('grades')}
                placeholder={FIELD_PLACEHOLDERS.grades}
                onValueChange={(values) => handleDropdownChange('grades', values)}
                onItemToggle={(value) => handleItemToggle('grades', value)}
                onSelectAll={() => handleSelectAll('grades')}
                getItemLabel={(value) => getItemLabel('grades', value)}
              />
              {!isFieldSelectedInLeftPanel('grades') && (
                <p className="text-xs text-gray-400 mt-1">Enable this filter from left panel</p>
              )}
              {isFieldSelectedInLeftPanel('grades') && !isFieldEnabledByParent('grades') && (
                <p className="text-xs text-gray-400 mt-1">
                  Please select a parent field first to enable this selection
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Departments
              </label>
              <DropdownField
                fieldName="departments"
                options={filteredOptions.departments || []}
                selectedValues={selectedFilters.departments || []}
                isEnabled={canInteractWithField('departments')}
                placeholder={FIELD_PLACEHOLDERS.departments}
                onValueChange={(values) => handleDropdownChange('departments', values)}
                onItemToggle={(value) => handleItemToggle('departments', value)}
                onSelectAll={() => handleSelectAll('departments')}
                getItemLabel={(value) => getItemLabel('departments', value)}
              />
              {!isFieldSelectedInLeftPanel('departments') && (
                <p className="text-xs text-gray-400 mt-1">Enable this filter from left panel</p>
              )}
              {isFieldSelectedInLeftPanel('departments') && !isFieldEnabledByParent('departments') && (
                <p className="text-xs text-gray-400 mt-1">
                  Please select a parent field first to enable this selection
                </p>
              )}
            </div>

            {/* Row 3 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Sub Departments
              </label>
              <DropdownField
                fieldName="subDepartments"
                options={filteredOptions.subDepartments || []}
                selectedValues={selectedFilters.subDepartments || []}
                isEnabled={canInteractWithField('subDepartments')}
                placeholder={FIELD_PLACEHOLDERS.subDepartments}
                onValueChange={(values) => handleDropdownChange('subDepartments', values)}
                onItemToggle={(value) => handleItemToggle('subDepartments', value)}
                onSelectAll={() => handleSelectAll('subDepartments')}
                getItemLabel={(value) => getItemLabel('subDepartments', value)}
              />
              {!isFieldSelectedInLeftPanel('subDepartments') && (
                <p className="text-xs text-gray-400 mt-1">Enable this filter from left panel</p>
              )}
              {isFieldSelectedInLeftPanel('subDepartments') && !isFieldEnabledByParent('subDepartments') && (
                <p className="text-xs text-gray-400 mt-1">
                  Please select a parent field first to enable this selection
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Sections
              </label>
              <DropdownField
                fieldName="sections"
                options={filteredOptions.sections || []}
                selectedValues={selectedFilters.sections || []}
                isEnabled={canInteractWithField('sections')}
                placeholder={FIELD_PLACEHOLDERS.sections}
                onValueChange={(values) => handleDropdownChange('sections', values)}
                onItemToggle={(value) => handleItemToggle('sections', value)}
                onSelectAll={() => handleSelectAll('sections')}
                getItemLabel={(value) => getItemLabel('sections', value)}
              />
              {!isFieldSelectedInLeftPanel('sections') && (
                <p className="text-xs text-gray-400 mt-1">Enable this filter from left panel</p>
              )}
              {isFieldSelectedInLeftPanel('sections') && !isFieldEnabledByParent('sections') && (
                <p className="text-xs text-gray-400 mt-1">
                  Please select a parent field first to enable this selection
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dropdown Field Component
interface DropdownFieldProps {
  fieldName: string;
  options: Option[];
  selectedValues: string[];
  isEnabled: boolean;
  placeholder: string;
  onValueChange: (values: string[]) => void;
  onItemToggle: (value: string) => void;
  onSelectAll: () => void;
  getItemLabel: (value: string) => string;
}

function DropdownField({
  fieldName,
  options,
  selectedValues,
  isEnabled,
  placeholder,
  onValueChange,
  onItemToggle,
  onSelectAll,
  getItemLabel
}: DropdownFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleToggle = (value: string) => {
    onItemToggle(value);
  };

  const handleSelectAll = () => {
    onSelectAll();
  };

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        className={cn(
          "w-full justify-between bg-white border border-gray-200 rounded-lg shadow-sm",
          "hover:border-gray-300 hover:shadow-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500",
          "transition-all duration-200",
          isOpen && "border-blue-500 ring-2 ring-blue-500 shadow-lg",
          !isEnabled && "opacity-50 cursor-not-allowed bg-gray-100"
        )}
        onClick={() => isEnabled && setIsOpen(!isOpen)}
        disabled={!isEnabled}
      >
        <span className={cn(
          "truncate font-medium",
          selectedValues.length > 0 ? "text-gray-900" : "text-gray-500"
        )}>
          {getDropdownDisplayText()}
        </span>
        <ChevronDown className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isOpen ? "transform rotate-180" : ""
        )} />
      </Button>

      {/* Dropdown Modal */}
      {isOpen && isEnabled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-4 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  {FIELD_LABELS[fieldName]}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                {selectedValues.length > 0 
                  ? `${selectedValues.length} item${selectedValues.length > 1 ? 's' : ''} selected`
                  : 'Select one or more items'
                }
              </p>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Search items..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
            </div>

            {/* Options List */}
            <div className="flex-1 overflow-y-auto max-h-64">
              {filteredOptions.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="text-gray-400 mb-2">
                    <Search className="h-8 w-8 mx-auto" />
                  </div>
                  <p className="text-sm text-gray-500">No items found</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your search</p>
                </div>
              ) : (
                <div className="p-2">
                  {/* Select All Button */}
                  <button
                    type="button"
                    className="w-full flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100 mb-2"
                    onClick={handleSelectAll}
                  >
                    <div className={cn(
                      "flex h-4 w-4 items-center justify-center rounded border mr-3 transition-all",
                      selectedValues.length === filteredOptions.length
                        ? "bg-blue-600 border-blue-600"
                        : "border-gray-300"
                    )}>
                      {selectedValues.length === filteredOptions.length && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span className="font-medium">Select All</span>
                    <span className="ml-auto text-xs text-gray-400">
                      ({filteredOptions.length} items)
                    </span>
                  </button>
                  
                  {/* Individual Options */}
                  <div className="space-y-1">
                    {filteredOptions.map((item) => {
                      const selected = selectedValues.includes(item.value);
                      return (
                        <button
                          key={item.value}
                          type="button"
                          className={cn(
                            "w-full flex items-center px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-200",
                            selected && "bg-blue-50 border border-blue-100"
                          )}
                          onClick={() => handleToggle(item.value)}
                        >
                          <div className={cn(
                            "flex h-4 w-4 items-center justify-center rounded border mr-3 transition-all",
                            selected
                              ? "bg-blue-600 border-blue-600 scale-110"
                              : "border-gray-300"
                          )}>
                            {selected && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <span className={cn(
                            "transition-colors",
                            selected && "font-medium text-blue-900"
                          )}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {selectedValues.length > 0 && (
                    <span>{selectedValues.length} item{selectedValues.length > 1 ? 's' : ''} selected</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Selected Items Display */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedValues.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full"
            >
              {getItemLabel(value)}
              <button
                type="button"
                onClick={() => handleToggle(value)}
                className="ml-1.5 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                aria-label={`Remove ${getItemLabel(value)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );

  function getDropdownDisplayText(): string {
    if (selectedValues.length === 0) {
      return placeholder;
    }
    return `${selectedValues.length} item${selectedValues.length > 1 ? 's' : ''} selected`;
  }
}