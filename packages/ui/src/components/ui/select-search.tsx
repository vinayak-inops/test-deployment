import * as React from "react"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "../../utils/shadcnui/cn"
import { Button } from "./button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

export interface SelectSearchOption {
  value: string
  label: string
}

export interface SelectSearchProps {
  options: SelectSearchOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  searchPlaceholder?: string
  emptyMessage?: string
}

const SelectSearch = React.forwardRef<HTMLButtonElement, SelectSearchProps>(
  ({ 
    options, 
    value, 
    onValueChange, 
    placeholder = "Select option...", 
    disabled = false,
    className,
    searchPlaceholder = "Search...",
    emptyMessage = "No options found.",
    ...props 
  }, ref) => {
    const [open, setOpen] = React.useState(false)

    const selectedOption = options.find((option) => option.value === value)

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between px-3",
              !selectedOption && "text-muted-foreground",
              className
            )}
            disabled={disabled}
            {...props}
          >
            <span className="flex-1 text-left truncate min-w-0">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onValueChange?.(currentValue === value ? "" : currentValue)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    )
  }
)

SelectSearch.displayName = "SelectSearch"

export { SelectSearch }