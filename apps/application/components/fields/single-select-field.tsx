"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { Label } from "@repo/ui/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/components/ui/command"
import { Check, Search, ChevronsUpDown } from "lucide-react"

export interface SingleSelectOption {
  value: string
  label?: string
  tooltip?: string
}

interface SingleSelectFieldProps {
  id?: string
  label: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
  value?: string
  onChange: (value: string) => void
  options: SingleSelectOption[]
  showOnlyValueInTrigger?: boolean
  className?: string
  errorMessage?: string
  allowOnlyProvidedOptions?: boolean
  showValueInOptions?: boolean
  // Infinite scroll props
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onSearch?: (searchTerm: string) => void
  searchDebounce?: number
}

const safeSelectText = (value: unknown, fallback = ""): string => {
  if (value === null || value === undefined) return fallback
  if (typeof value === "string") return value || fallback
  if (typeof value === "number" || typeof value === "boolean") return String(value)
  if (typeof value === "object") {
    const first = Object.values(value).find((v) => typeof v === "string")
    return (first as string) || fallback
  }
  return fallback
}

const getOptionDisplay = (opt?: SingleSelectOption, fallbackValue?: unknown) => {
  if (!opt) return safeSelectText(fallbackValue)
  const name = (opt.label ?? "").trim()
  const code = (opt.value ?? "").trim()

  if (!name) return code
  if (!code) return name
  if (name.toLowerCase() === code.toLowerCase()) return code

  return `${name} (${code})`
}

export function SingleSelectField({
  id,
  label,
  required,
  placeholder = "Select",
  disabled,
  value,
  onChange,
  options,
  showOnlyValueInTrigger = true,
  className,
  errorMessage,
  allowOnlyProvidedOptions = true,
  showValueInOptions = true,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onSearch,
  searchDebounce = 500,
}: SingleSelectFieldProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const normalizedValue = safeSelectText(value)

  // Debounce search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearch(search)
      onSearch?.(search)
    }, searchDebounce)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [search, onSearch, searchDebounce])

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearch("")
      setDebouncedSearch("")
    }
  }, [open])

  const map = useMemo(() => {
    const m = new Map<string, SingleSelectOption>()
    for (const opt of options) m.set(opt.value, opt)
    return m
  }, [options])

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase()
    if (!term) return options
    return options.filter((o) =>
      o.value.toLowerCase().includes(term) || (o.label ?? "").toLowerCase().includes(term)
    )
  }, [options, debouncedSearch])

  const current = normalizedValue ? map.get(normalizedValue) : undefined

  // Handle scroll for infinite loading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (!hasMore || isLoading || !onLoadMore) return
    
    const target = e.target as HTMLDivElement
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50
    
    if (bottom) {
      onLoadMore()
    }
  }

  // If current value is not in options, clear it (keeps children in sync with parent changes)
  useEffect(() => {
    if (!allowOnlyProvidedOptions) return
    if (!normalizedValue) return
    // Avoid clearing while options are not yet loaded
    if (!options || options.length === 0) return
    if (!map.has(normalizedValue)) {
      onChange("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, map, normalizedValue, allowOnlyProvidedOptions])

  const triggerText = normalizedValue
    ? showOnlyValueInTrigger
      ? getOptionDisplay(current, normalizedValue)
      : getOptionDisplay(current, normalizedValue)
    : placeholder

  const rootClassName = ["space-y-2", className].filter(Boolean).join(" ")

  return (
    <div className={rootClassName}>
      <Label htmlFor={id} className="block text-xs font-medium text-gray-700 uppercase tracking-wide">
        {label} {required && <span className="text-red-500 normal-case">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            id={id}
            className={`relative w-full h-9 rounded-md border px-3 py-1.5 pr-8 text-left text-sm transition focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 ${
              disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
            } ${errorMessage ? "border-red-500" : "border-gray-300"}`}
            disabled={disabled}
          >
            <span className="block overflow-x-auto whitespace-nowrap pr-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              {triggerText}
            </span>
            <ChevronsUpDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[420px] bg-white border border-gray-200 rounded-md shadow-sm">
          <Command shouldFilter={false} className="bg-white">
            <div className="p-2 border-b border-gray-200 sticky top-0 z-10 bg-white">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <CommandInput
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Search..."
                  className="pl-8 h-9"
                />
              </div>
            </div>
            <CommandList 
              className="max-h-[260px] overflow-y-auto overflow-x-auto bg-white"
              ref={scrollContainerRef}
              onScroll={handleScroll}
            >
              {filtered.length === 0 && !isLoading && <CommandEmpty>No results</CommandEmpty>}
              {filtered.length > 0 && (
                <CommandGroup>
                  {filtered.map((opt) => {
                    const isSelected = normalizedValue === opt.value
                    return (
                      <CommandItem
                        key={opt.value}
                        value={`${opt.value}${opt.label ? ` ${opt.label}` : ""}`}
                        onSelect={() => {
                          onChange(opt.value)
                          setOpen(false)
                        }}
                        className="flex items-center justify-between"
                        title={opt.tooltip ?? opt.label}
                      >
                        <span className="overflow-x-auto whitespace-nowrap pr-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                          {opt.label && opt.label !== opt.value ? (
                            <>
                              {opt.label} <span className="text-gray-400">{showValueInOptions && `(${opt.value})`}</span>
                            </>
                          ) : (
                            opt.value
                          )}
                        </span>
                        <Check className={`h-4 w-4 ml-2 text-green-600 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                </div>
              )}
              {!isLoading && hasMore && filtered.length > 0 && (
                <div 
                  className="py-4 text-center text-sm text-blue-600 hover:text-blue-800 cursor-pointer border-t border-gray-100"
                  onClick={() => onLoadMore?.()}
                >
                  Load more...
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {errorMessage && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
    </div>
  )
}

export default SingleSelectField