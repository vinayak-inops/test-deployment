"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Check, X, ChevronDown, Search } from "lucide-react";
import { cn } from "../../../../utils/shadcnui/cn";
import { Button } from "../../../ui/button";
import { Badge } from "../../../ui/badge";
import { useWatch } from "react-hook-form";
import { useFormContext } from "../../../../context/FormContext";
import { FormStructure } from "../../../../type/dynamic-form/types";

// CSS animations as style objects
const animations = {
  slideInUp: {
    animation: 'slideInUp 0.3s ease-out forwards',
  },
  fadeIn: {
    animation: 'fadeIn 0.3s ease-out forwards',
  },
  scaleIn: {
    animation: 'scaleIn 0.2s ease-out forwards',
  },
  dropdownEnter: {
    animation: 'dropdownEnter 0.2s ease-out forwards',
  },
  dropdownExit: {
    animation: 'dropdownExit 0.2s ease-in forwards',
  }
};

// CSS keyframes as style tag
const keyframesCSS = `
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.8);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @keyframes dropdownEnter {
    from {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes dropdownExit {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(-10px) scale(0.95);
    }
  }
`;

interface Option {
  value: string;
  label: string;
}

interface Field {
  name: string;
  label: string;
  required?: boolean;
  options?: Option[];
  classvalue?: {
    container?: string;
  };
  onChange?: Array<{
    event: string;
    children?: string[];
  }>;
  functions?: Array<{
    function: string;
    storageName?: string;
    storageValue?: string[];
  }>;
}

interface SingleSelectFilterDropdownProps {
  field: any;
  tag: string;
  fields: any;
}

export default function SingleSelectFilterDropdown({
  field,
  tag,
  fields
}: SingleSelectFilterDropdownProps) {
  const {
    register,
    errors,
    setValue,
    watch,
    valueUpdate,
    eventHandler,
    control,
    messenger,
    setMessenger,
    fromValue
  } = useFormContext();

  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [localValue, setLocalValue] = useState<string>("");

  // Memoize watched value
  const watchedValue = useWatch({
    control,
    name: field.name,
    defaultValue: ""
  });

  // Memoize selected item
  const selectedItem = useMemo(() => {
    if (typeof watchedValue === "string") return watchedValue;
    if (Array.isArray(watchedValue)) return watchedValue[0] || "";
    return "";
  }, [watchedValue]);

  // Single effect to handle value initialization and updates
  useEffect(() => {
    if (!field?.name) {
      
      return;
    }

    try {
      const currentValue = watch(field.name);
      const fieldValue = field.value;
      const formFieldValue = fromValue?.[field.name];

      // Determine which value to use - give first priority to watch value
      let valueToSet = "";
      
      // First check if watch has a value
      if (currentValue && typeof currentValue === "string" && currentValue !== "") {
        valueToSet = currentValue;
      } 
      // If watch doesn't have value, then check fromValue
      else if (formFieldValue && typeof formFieldValue === "string" && formFieldValue !== "") {
        valueToSet = formFieldValue;
      } 
      // If neither watch nor fromValue has value, check field default value
      else if (fieldValue && typeof fieldValue === "string" && fieldValue !== "") {
        valueToSet = fieldValue;
      }

      // Only update if value has changed and is different from localValue
      if (valueToSet !== localValue && valueToSet !== "") {
        setValue(field.name, valueToSet, {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        });
        setLocalValue(valueToSet);
      }
    } catch (error) {
    }
  }, [field?.name, field?.value, fromValue?.[field?.name], watchedValue, setValue, localValue]);

  // Register field with validation
  useEffect(() => {
    if (!field?.name) {
      return;
    }

    try {
      register(field.name, {
        required: field.required ? "This field is required" : false,
        validate: (value: any) => {
          if (field.required && (!value || value === "")) {
            return "Please select an option";
          }
          return true;
        }
      });
    } catch (error) {
    }
  }, [field?.name, field?.required, register]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleItemSelect = useCallback((value: string) => {
    if (!field?.name) {
      return;
    }

    try {
      setValue(field.name, value, { 
        shouldValidate: true, 
        shouldDirty: true,
        shouldTouch: true 
      });
      setLocalValue(value);
      setIsOpen(false);

      // Handle child updates
      if (field.onChange && Array.isArray(field.onChange)) {
        field.onChange.forEach((event: any) => {
          if (event.event === "updatechild" && field.children) {
            setTimeout(() => {
              try {
                eventHandler(field?.children, setValue, value, field);
              } catch (error) {
              }
            }, 0);
          }
        });
      }
    } catch (error) {
    }
  }, [field, setValue, eventHandler]);

  const handleClear = useCallback(() => {
    if (!field?.name) {
      return;
    }

    try {
      setValue(field.name, "", { 
        shouldValidate: true, 
        shouldDirty: true,
        shouldTouch: true 
      });
      setLocalValue("");
    } catch (error) {
    }
  }, [field?.name, setValue]);

  // Helper function to get options from messenger
  const getMessengerOptions = useCallback((messenger: any, fieldName: string) => {
    const value = messenger?.[fieldName];
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value.options)) return value.options;
    return [];
  }, []);

  // Helper function to check if item matches filter value
  const itemMatchesFilter = useCallback((item: any, filterValue: string) => {
    const fieldsToCheck = ['category', 'type', 'tab', 'group', 'value'];
    return fieldsToCheck.some(field => item[field] === filterValue);
  }, []);

  // Helper function to get filter value from messenger
  const getFilterValue = useCallback((messenger: any, messengerName: string) => {
    if (!messenger?.messengerValue || !Array.isArray(messenger.messengerValue)) {
      return null;
    }
    
    const matchingItem = messenger.messengerValue.find((item: any) => item.name === messengerName);
    return matchingItem?.value || null;
  }, []);

  // Memoize filtered items
  const filteredItems = useMemo(() => {
    // Get base options
    const hasFieldOptions = field.options && field.options.length > 0;
    const messengerOptions = getMessengerOptions(messenger, field.name);
    const hasMessengerOptions = messengerOptions.length > 0;
    
    let options = hasFieldOptions ? field.options : (hasMessengerOptions ? messengerOptions : []);
    
    // Apply messenger filtering
    if (field.functions && field.functions.length > 0) {
      const updateFunction = field.functions.find((func: any) => func.function === "update-base-on-messengerValue");
      
      if (updateFunction) {
        const filterValue = getFilterValue(messenger, updateFunction.messengerName);
       
        
        if (filterValue && filterValue !== "all" && filterValue !== "All") {
          options = options.filter((item: any) => itemMatchesFilter(item, filterValue));
        }
      }
    }
    
    // Apply search filter
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      options = options.filter((item: any) => {
        const searchableFields = ['label', 'value', 'description', 'name'];
        return searchableFields.some(field => 
          item[field]?.toLowerCase().includes(searchLower)
        );
      });
    }
    
    return options;
  }, [field.options, field.functions, messenger?.messengerValue, messenger?.[field.name], field.name, searchValue, getMessengerOptions, getFilterValue, itemMatchesFilter]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  }, []);

  const toggleDropdown = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);


  // Memoize selected option
  const selectedOption = useMemo(() => {
    // Get base options
    const hasFieldOptions = field.options && field.options.length > 0;
    const messengerOptions = getMessengerOptions(messenger, field.name);
    const hasMessengerOptions = messengerOptions.length > 0;
    
    let options = hasFieldOptions ? field.options : (hasMessengerOptions ? messengerOptions : []);
    
    // Apply messenger filtering (same as filteredItems)
    if (field.functions && field.functions.length > 0) {
      const updateFunction = field.functions.find((func: any) => func.function === "update-base-on-messengerValue");
      
      if (updateFunction) {
        const filterValue = getFilterValue(messenger, updateFunction.messengerName);
        
        if (filterValue && filterValue !== "all" && filterValue !== "All") {
          options = options.filter((item: any) => itemMatchesFilter(item, filterValue));
        }
      }
    }
    
    return options.find((item: any) => item.value === selectedItem);
  }, [field.options, field.functions, messenger?.messengerValue, messenger?.[field.name], field.name, selectedItem, getMessengerOptions, getFilterValue, itemMatchesFilter]);

  // Check if we have options to show
  const hasFieldOptions = field.options && field.options.length > 0;
  const messengerOptions = getMessengerOptions(messenger, field.name);
  const hasMessengerOptions = messengerOptions.length > 0;
  const shouldShowDropdown = hasFieldOptions || hasMessengerOptions;

  return (
    <div className={`w-full ${field?.classvalue?.container || ''}`} role="combobox" aria-expanded={isOpen}>
      <style dangerouslySetInnerHTML={{ __html: keyframesCSS }} />
      {!field?.name ? (
        <div className="text-red-500">Invalid field configuration</div>
      ) : (
        <div className="flex flex-col">
          <div className="relative" ref={dropdownRef}>
            <label
              htmlFor={`${field.name}-dropdown`}
              className="text-sm font-semibold text-gray-700 mb-2"
            >
              {field.label}
              {field.required && <span className="text-red-500" aria-hidden="true">*</span>}
            </label>
            {shouldShowDropdown ? (
              <Button
                id={`${field.name}-dropdown`}
                type="button"
                variant="outline"
                className="w-full justify-between bg-white border border-gray-300 rounded-xl shadow-sm hover:shadow-md focus:shadow-lg focus:border-blue-500 transition-all duration-150 py-2 px-4 text-base"
                onClick={toggleDropdown}
                aria-haspopup="listbox"
                aria-controls={`${field.name}-listbox`}
              >
                <span className={!selectedItem ? "text-gray-400" : "text-gray-900 font-medium"}>
                  {selectedOption ? selectedOption.label : "Select an option..."}
                </span>
                <ChevronDown className="ml-2 h-5 w-5 shrink-0 opacity-60" />
              </Button>
            ) : (
              <div className="text-sm text-gray-500 py-2 px-3 border border-gray-300 rounded-md bg-gray-50">
                No options available for {field.label}
              </div>
            )}

            {isOpen && shouldShowDropdown && (
              <div
                className="absolute bg-white z-20 mt-2 w-full rounded-xl border border-gray-200 shadow-2xl"
                style={animations.dropdownEnter}
                role="listbox"
                id={`${field.name}-listbox`}
              >
                <div className="flex items-center border-b border-gray-100 px-4 py-2 bg-gray-50 rounded-t-xl">
                  <Search className="mr-2 h-4 w-4 opacity-50" aria-hidden="true" />
                  <input
                    className="h-9 w-full rounded-md bg-gray-100 border border-gray-200 text-sm outline-none px-3 placeholder:text-xs placeholder:text-gray-400 focus:border-blue-400 focus:bg-white transition-all"
                    placeholder="Search options..."
                    value={searchValue}
                    onChange={handleSearchChange}
                    aria-label="Search options"
                  />
                </div>

                <div className="max-h-60 overflow-auto p-1">
                  {filteredItems.length === 0 ? (
                    <div className="py-6 text-center text-sm text-gray-400" style={animations.fadeIn}>
                      No options found.
                    </div>
                  ) : (
                    <ul className="space-y-1">
                      {filteredItems.map((item: any, index: number) => {
                        const selected = selectedItem === item.value;
                        return (
                          <li
                            key={item.value}
                            className={`cursor-pointer flex items-center px-4 py-2 rounded-lg transition-all duration-300 ease-in-out transform hover:scale-[1.02] ${selected ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' : 'hover:bg-gray-100 text-gray-700'}`}
                            style={{
                              ...animations.slideInUp,
                              animationDelay: `${index * 50}ms`,
                              animationFillMode: 'both'
                            }}
                            onClick={() => handleItemSelect(item.value)}
                            role="option"
                            aria-selected={selected}
                          >
                            <div
                              className={cn(
                                "flex h-4 w-4 items-center justify-center rounded-sm border mr-2 transition-all duration-200",
                                selected
                                  ? "bg-blue-600 border-blue-600 scale-110"
                                  : "opacity-50 border-gray-300"
                              )}
                            >
                              {selected && <Check className="h-3 w-3 text-white" style={animations.scaleIn} aria-hidden="true" />}
                            </div>
                            <span className="transition-all duration-200">{item.label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedItem && (
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge
                variant="secondary"
                className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full"
                role="listitem"
              >
                {selectedOption?.label || selectedItem}
                <button
                  type="button"
                  onClick={handleClear}
                  className="ml-1.5 hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${selectedOption?.label || selectedItem}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              </Badge>
            </div>
          )}

          <input
            type="hidden"
            {...register(field.name, {
              required: field.required ? "This field is required" : false,
              validate: (value: any) => {
                if (field.required && (!value || value === "")) {
                  return "Please select an option";
                }
                return true;
              }
            })}
          />
          {errors[field.name]?.message && (
            <span className="text-sm text-red-500 mt-1" role="alert">
              {String(errors[field.name]?.message || 'Invalid input')}
            </span>
          )}
        </div>
      )}
    </div>
  );
} 