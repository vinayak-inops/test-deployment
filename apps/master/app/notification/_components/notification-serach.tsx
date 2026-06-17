'use client';
import React, { useState, useCallback } from 'react';
import { Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NotificationSearchProps {
  onSearch: (field: string, value: string) => void;
  onClear: () => void;
}

export default function NotificationSearch({ onSearch, onClear }: NotificationSearchProps) {
  const [selectedField, setSelectedField] = useState('title');
  const [searchValue, setSearchValue] = useState('');

  const searchFields = [
    { value: 'title', label: 'Title' },
    { value: 'message', label: 'Message' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'type', label: 'Type' },
    { value: 'createdOn', label: 'Created On' },
    { value: 'expiry', label: 'Expiry' },
    { value: 'daysUntilExpiry', label: 'Days Until Expiry' },
  ];

  const handleClear = useCallback(() => {
    setSearchValue('');
    onClear();
  }, [onClear]);

  // Auto search when value changes - fixed dependency array
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchValue.trim()) {
        onSearch(selectedField, searchValue.trim());
      } else {
        onClear();
      }
    }, 300); // Debounce search by 300ms

    return () => clearTimeout(timeoutId);
  }, [searchValue, selectedField]); // Removed onSearch and onClear from dependencies

  return (
    <div className="py-4 mb-2">
      <div className="flex items-center justify-start">
        <div className="flex bg-gray-50 rounded-xl p-0 w-full">
          {/* Field Selection - Left Side */}
          <div className="flex items-center bg-white border border-gray-200 rounded-l-xl px-3 py-2 w-32">
            <Filter className="w-4 h-4 text-gray-500 mr-2" />
            <Select value={selectedField} onValueChange={setSelectedField}>
              <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-gray-900 focus:ring-0 bg-transparent shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-[100px] shadow-none border border-gray-200">
                {searchFields.map((field) => (
                  <SelectItem key={field.value} value={field.value} className="text-sm">
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Field - Right Side */}
          <div className="flex-1 flex items-center bg-white border-t border-r border-b border-gray-200 rounded-r-xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder={`Search by ${searchFields.find(f => f.value === selectedField)?.label.toLowerCase()}...`}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}