"use client";

import { Search, Filter } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select";

interface SearchField {
  value: string;
  label: string;
}

interface ShiftListFilterBarProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedField: string;
  setSelectedField: (value: string) => void;
  searchFields: SearchField[];
  filtersApplied: boolean;
  onFilterClick: () => void;
  selectedFilterLabel?: string;
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAddClick?: () => void;
  addButtonDisabled?: boolean;
}

export default function ShiftListFilterBar({
  searchTerm,
  setSearchTerm,
  selectedField,
  setSelectedField,
  searchFields,
  filtersApplied,
  onFilterClick,
  selectedFilterLabel = "Filter",
  showAddButton = false,
  addButtonLabel = "Add New",
  onAddClick,
  addButtonDisabled = false,
}: ShiftListFilterBarProps) {
  const selectedFieldLabel = searchFields.find((field) => field.value === selectedField)?.label || "";

  return (
    <div className="w-full px-8 py-4 pb-0">
      <div className="mx-auto flex max-w-7xl items-center gap-4">
        <div className="flex flex-1 rounded-lg border bg-muted/50">
          <div className="flex w-48 items-center rounded-l-lg border-r bg-background px-3 py-2">
            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedField}
              onValueChange={(value) => {
                setSelectedField(value);
              }}
              disabled={!filtersApplied}
            >
              <SelectTrigger className="h-6 w-full border-none bg-transparent p-0 text-sm font-medium text-foreground shadow-none focus:ring-0">
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

          <div className="flex min-w-0 flex-1 items-center rounded-r-lg bg-background">
            <div className="relative w-full flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Search by ${selectedFieldLabel.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                disabled={!filtersApplied}
                className="h-10 w-full rounded-none border-none bg-transparent py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
        </div>
        {showAddButton && (
          <button
            type="button"
            onClick={onAddClick}
            disabled={addButtonDisabled}
            className="h-10 whitespace-nowrap rounded-md bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addButtonLabel}
          </button>
        )}
      </div>
    </div>
  );
}
