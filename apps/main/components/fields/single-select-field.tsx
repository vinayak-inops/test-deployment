"use client"

import { useEffect, useMemo, useState } from "react"
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
}

const getOptionDisplay = (opt?: SingleSelectOption, fallbackValue?: string) => {
  if (!opt) return fallbackValue ?? ""
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
}: SingleSelectFieldProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const map = useMemo(() => {
    const m = new Map<string, SingleSelectOption>()
    for (const opt of options) m.set(opt.value, opt)
    return m
  }, [options])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return options
    return options.filter((o) =>
      o.value.toLowerCase().includes(term) || (o.label ?? "").toLowerCase().includes(term)
    )
  }, [options, search])

  const current = value ? map.get(value) : undefined

  // If current value is not in options, clear it (keeps children in sync with parent changes)
  useEffect(() => {
    if (!allowOnlyProvidedOptions) return
    if (!value) return
    // Avoid clearing while options are not yet loaded
    if (!options || options.length === 0) return
    if (!map.has(value)) {
      onChange("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, map, value, allowOnlyProvidedOptions])

  const triggerText = value
    ? showOnlyValueInTrigger
      ? getOptionDisplay(current, value)
      : getOptionDisplay(current, value)
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
            <span className="block truncate">{triggerText}</span>
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
            <CommandList className="max-h-[260px] overflow-y-auto bg-white">
              {filtered.length === 0 && <CommandEmpty>No results</CommandEmpty>}
              {filtered.length > 0 && (
                <CommandGroup>
                  {filtered.map((opt) => {
                    const isSelected = value === opt.value
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
                        <span className="truncate">
                          {opt.label && opt.label !== opt.value ? (
                            <>
                              {opt.label} <span className="text-gray-400">({opt.value})</span>
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
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {errorMessage && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
    </div>
  )
}

export default SingleSelectField
