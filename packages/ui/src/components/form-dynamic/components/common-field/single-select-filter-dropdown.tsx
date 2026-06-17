"use client";

import React, { useState } from "react";
import { useFormContext } from "../../../../context/FormContext";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../../../../utils/shadcnui/cn";
import { Button } from "../../../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../../../ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../ui/popover";

interface SingleSelectFilterDropdownProps {
  field: any;
  tag: string;
  fields: any;
}

export default function SingleSelectFilterDropdown({
  field,
  tag,
  fields,
}: SingleSelectFilterDropdownProps) {
  const {
    register,
    errors,
    setValue,
    control,
    eventHandler,
    valueUpdate,
    watch,
    formStructure,
    validateRequiredFields,
    setError,
    functionToHandleEvent,
    tabController,
    fromValue,
    setFormValue,
    messenger,
    setMessenger,
    fieldUpdateControl,
    onFieldUpdate
  } = useFormContext();

  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const selectedValue = watch(field.name);

  const filteredOptions = field.options?.filter((option: any) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleSelect = (value: string) => {
    setValue(field.name, value, { shouldValidate: true });
    setSearchValue("");
    setOpen(false);
    
    if (field.onChange) {
      field.onChange.forEach((event: any) => {
        if (event.event === "updatechild") {
          setTimeout(() => {
            eventHandler(field.children, setValue, value, field);
          }, 0);
        }
      });
    }
  };

  return (
    <div className={`w-full ${field?.classvalue?.container}`}>
      <label className={`block text-sm font-medium text-gray-700 ${field?.classvalue?.label}`}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-1">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={`w-full justify-between ${field?.classvalue?.field}`}
            >
              {selectedValue ? (
                field.options.find((opt: any) => opt.value === selectedValue)?.label
              ) : (
                <span className="text-gray-500">Select {field.label}</span>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0">
            <Command>
              <CommandInput 
                placeholder={`Search ${field.label}...`}
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup>
                {filteredOptions?.map((option: any) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedValue === option.value
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {errors[field.name] && (
        <p className="mt-1 text-sm text-red-600">
          {String(errors[field.name]?.message || 'Invalid input')}
        </p>
      )}
    </div>
  );
} 