"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { Label } from "@repo/ui/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@repo/ui/components/ui/command"
import { Check, Search, ChevronsUpDown, X } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MultiSelectOption {
  value: string
  label?: string
  tooltip?: string
}

interface MultiSelectFieldProps {
  id?: string
  label: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
  value?: string[]
  onChange: (value: string[]) => void
  options: MultiSelectOption[]
  className?: string
  errorMessage?: string
  allowOnlyProvidedOptions?: boolean
  /** Maximum number of selections allowed. Undefined = no limit. */
  maxSelections?: number
  /** Show selected count in trigger instead of individual chips when count > this threshold */
  collapseAfter?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getOptionDisplay = (opt?: MultiSelectOption, fallbackValue?: string): string => {
  if (!opt) return fallbackValue ?? ""
  const name = (opt.label ?? "").trim()
  const code = (opt.value ?? "").trim()

  if (!name) return code
  if (!code) return name
  if (name.toLowerCase() === code.toLowerCase()) return code

  return `${name} (${code})`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MultiSelectField({
  id,
  label,
  required,
  placeholder = "Select",
  disabled,
  value = [],
  onChange,
  options,
  className,
  errorMessage,
  allowOnlyProvidedOptions = true,
  maxSelections,
  collapseAfter = 3,
}: MultiSelectFieldProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const triggerRef = useRef<HTMLButtonElement>(null)

  // ── Derived maps ───────────────────────────────────────────────────────────

  const map = useMemo(() => {
    const m = new Map<string, MultiSelectOption>()
    for (const opt of options) m.set(opt.value, opt)
    return m
  }, [options])

  const selected = useMemo(() => new Set(value), [value])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return options
    return options.filter(
      (o) =>
        o.value.toLowerCase().includes(term) ||
        (o.label ?? "").toLowerCase().includes(term)
    )
  }, [options, search])

  // ── Sync: remove values that no longer exist in options ───────────────────

  useEffect(() => {
    if (!allowOnlyProvidedOptions) return
    if (!value || value.length === 0) return
    if (!options || options.length === 0) return

    const invalid = value.filter((v) => !map.has(v))
    if (invalid.length > 0) {
      onChange(value.filter((v) => map.has(v)))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, map, allowOnlyProvidedOptions])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const toggle = (optValue: string) => {
    if (selected.has(optValue)) {
      // Deselect
      onChange(value.filter((v) => v !== optValue))
    } else {
      // Select — respect maxSelections
      if (maxSelections !== undefined && selected.size >= maxSelections) return
      onChange([...value, optValue])
    }
  }

  const removeChip = (e: React.MouseEvent, optValue: string) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== optValue))
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  // ── Trigger display ────────────────────────────────────────────────────────

  const selectedCount = value.length
  const isMaxReached = maxSelections !== undefined && selectedCount >= maxSelections

  const rootClassName = ["space-y-2", className].filter(Boolean).join(" ")

  return (
    <div className={rootClassName}>
      {/* Label */}
      <Label
        htmlFor={id}
        className="block text-xs font-medium text-gray-700 uppercase tracking-wide"
      >
        {label}{" "}
        {required && <span className="text-red-500 normal-case">*</span>}
        {maxSelections !== undefined && (
          <span className="text-gray-400 normal-case font-normal ml-1">
            (max {maxSelections})
          </span>
        )}
      </Label>

      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch("") }}>
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            id={id}
            disabled={disabled}
            className={`relative w-full min-h-9 rounded-md border px-3 py-1.5 pr-16 text-left text-sm transition focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 ${
              disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white"
            } ${errorMessage ? "border-red-500" : "border-gray-300"}`}
          >
            {selectedCount === 0 ? (
              /* Placeholder */
              <span className="text-gray-400">{placeholder}</span>
            ) : selectedCount <= collapseAfter ? (
              /* Chips — shown when few items selected */
              <div className="flex flex-wrap gap-1 pr-1">
                {value.map((v) => {
                  const opt = map.get(v)
                  return (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 rounded bg-gray-100 border border-gray-200 px-1.5 py-0.5 text-xs text-gray-700 font-medium max-w-[160px]"
                    >
                      <span className="truncate">{getOptionDisplay(opt, v)}</span>
                      {!disabled && (
                        <span
                          role="button"
                          tabIndex={-1}
                          onClick={(e) => removeChip(e, v)}
                          className="flex-shrink-0 text-gray-400 hover:text-gray-700 cursor-pointer"
                          aria-label={`Remove ${v}`}
                        >
                          <X className="h-3 w-3" />
                        </span>
                      )}
                    </span>
                  )
                })}
              </div>
            ) : (
              /* Collapsed summary */
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center rounded bg-gray-800 text-white text-xs font-semibold px-2 py-0.5 min-w-[22px]">
                  {selectedCount}
                </span>
                <span className="text-gray-600 text-sm">
                  {selectedCount === options.length ? "All selected" : `items selected`}
                </span>
              </div>
            )}

            {/* Right controls */}
            <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {selectedCount > 0 && !disabled && (
                <span
                  role="button"
                  tabIndex={-1}
                  onClick={clearAll}
                  className="text-gray-400 hover:text-gray-700 cursor-pointer"
                  aria-label="Clear all"
                >
                  <X className="h-3.5 w-3.5" />
                </span>
              )}
              <ChevronsUpDown className="h-4 w-4 text-gray-400" />
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] max-w-[420px] bg-white border border-gray-200 rounded-md shadow-sm">
          <Command shouldFilter={false} className="bg-white">

            {/* Search input */}
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

            {/* Selection summary bar */}
            {selectedCount > 0 && (
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 bg-gray-50">
                <span className="text-xs text-gray-500">
                  {selectedCount} selected
                  {maxSelections !== undefined && ` / ${maxSelections}`}
                </span>
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs text-gray-500 hover:text-gray-800 underline underline-offset-2"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Max reached warning */}
            {isMaxReached && (
              <div className="px-3 py-1.5 bg-amber-50 border-b border-amber-100">
                <p className="text-xs text-amber-700">
                  Maximum of {maxSelections} items reached
                </p>
              </div>
            )}

            <CommandList className="max-h-[260px] overflow-y-auto overflow-x-auto bg-white">
              {filtered.length === 0 && <CommandEmpty>No results</CommandEmpty>}
              {filtered.length > 0 && (
                <CommandGroup>
                  {filtered.map((opt) => {
                    const isSelected = selected.has(opt.value)
                    const isDisabledItem = !isSelected && isMaxReached

                    return (
                      <CommandItem
                        key={opt.value}
                        value={`${opt.value}${opt.label ? ` ${opt.label}` : ""}`}
                        onSelect={() => {
                          if (!isDisabledItem) toggle(opt.value)
                        }}
                        className={`flex items-center justify-between ${
                          isDisabledItem ? "opacity-40 cursor-not-allowed" : ""
                        } ${isSelected ? "bg-gray-50" : ""}`}
                        title={opt.tooltip ?? opt.label}
                      >
                        {/* Checkbox visual */}
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className={`flex-shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                              isSelected
                                ? "bg-gray-900 border-gray-900"
                                : "border-gray-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </span>

                          {/* Label */}
                          <span className="overflow-x-auto whitespace-nowrap pr-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
                            {opt.label && opt.label !== opt.value ? (
                              <>
                                {opt.label}{" "}
                                <span className="text-gray-400">({opt.value})</span>
                              </>
                            ) : (
                              opt.value
                            )}
                          </span>
                        </span>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              )}
            </CommandList>

            {/* Footer: Select all (only when no search active) */}
            {!search && options.length > 1 && !maxSelections && (
              <div className="border-t border-gray-100 px-3 py-2 bg-gray-50">
                <button
                  type="button"
                  onClick={() =>
                    selectedCount === options.length
                      ? onChange([])
                      : onChange(options.map((o) => o.value))
                  }
                  className="text-xs text-gray-600 hover:text-gray-900 underline underline-offset-2"
                >
                  {selectedCount === options.length ? "Deselect all" : "Select all"}
                </button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {errorMessage && <p className="text-red-500 text-xs mt-1">{errorMessage}</p>}
    </div>
  )
}

export default MultiSelectField