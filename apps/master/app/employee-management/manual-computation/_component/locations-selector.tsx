"use client"

import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react"
import { Check, X, Search as SearchIcon, Filter, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface LocationOption {
  code: string
  name: string
}

interface LocationsSelectorProps {
  selectedLocationCodes: string[]
  setSelectedLocationCodes: Dispatch<SetStateAction<string[]>>
  filteredLocationsBase: LocationOption[]
  locationMap: Map<string, LocationOption>
  resetKey?: string
}

export default function LocationsSelector({
  selectedLocationCodes,
  setSelectedLocationCodes,
  filteredLocationsBase,
  locationMap,
  resetKey,
}: LocationsSelectorProps) {
  const [locationsAddOpen, setLocationsAddOpen] = useState(false)
  const [locationsSearchTerm, setLocationsSearchTerm] = useState("")
  const [locationsAddSearchTerm, setLocationsAddSearchTerm] = useState("")
  const [locationsPage, setLocationsPage] = useState(1)
  const locationsPageSize = 5

  useEffect(() => {
    if (locationsAddOpen) setLocationsAddSearchTerm("")
  }, [locationsAddOpen])

  useEffect(() => {
    setLocationsAddOpen(false)
    setLocationsSearchTerm("")
    setLocationsAddSearchTerm("")
    setLocationsPage(1)
  }, [resetKey])

  const selectedLocations = useMemo(() => {
    return selectedLocationCodes
      .map((code) => locationMap.get(code))
      .filter(Boolean) as LocationOption[]
  }, [selectedLocationCodes, locationMap])

  const filteredSelectedLocations = useMemo(() => {
    const q = locationsSearchTerm.toLowerCase().trim()
    if (!q) return selectedLocations
    return selectedLocations.filter((loc) => {
      return loc.code.toLowerCase().includes(q) || loc.name?.toLowerCase().includes(q)
    })
  }, [selectedLocations, locationsSearchTerm])

  const paginatedSelectedLocations = useMemo(() => {
    const start = (locationsPage - 1) * locationsPageSize
    return filteredSelectedLocations.slice(start, start + locationsPageSize)
  }, [filteredSelectedLocations, locationsPage, locationsPageSize])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredSelectedLocations.length / locationsPageSize))
    if (locationsPage > maxPage) setLocationsPage(maxPage)
  }, [filteredSelectedLocations.length, locationsPage, locationsPageSize])

  const addFilteredLocations = useMemo(() => {
    const q = locationsAddSearchTerm.toLowerCase().trim()
    if (!q) return filteredLocationsBase
    return filteredLocationsBase.filter((loc) => {
      return loc.code.toLowerCase().includes(q) || loc.name?.toLowerCase().includes(q)
    })
  }, [filteredLocationsBase, locationsAddSearchTerm])

  const toggleLocation = (code: string) => {
    setSelectedLocationCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleSelectAllLocations = () => {
    const allInFilter = addFilteredLocations.map((loc) => loc.code)
    const allSelected = allInFilter.every((code) => selectedLocationCodes.includes(code))
    if (allSelected) {
      setSelectedLocationCodes((prev) => prev.filter((code) => !allInFilter.includes(code)))
    } else {
      setSelectedLocationCodes((prev) => Array.from(new Set([...prev, ...allInFilter])))
    }
  }

  const removeLocation = (code: string) => {
    setSelectedLocationCodes((prev) => prev.filter((c) => c !== code))
  }

  const allAddFilteredLocationsSelected =
    addFilteredLocations.length > 0 &&
    addFilteredLocations.every((loc) => selectedLocationCodes.includes(loc.code))

  return (
    <div className="md:col-span-3 space-y-2 relative">
      <Label className="text-sm font-semibold text-gray-700 block">Locations</Label>
      <div className="relative flex items-center gap-3">
        <div className="flex-1">
          <div className="flex bg-muted/50 rounded-lg border">
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
              <Filter className="w-4 h-4 text-muted-foreground mr-2" />
              <span className="text-sm font-medium text-foreground">Location</span>
            </div>
            <div className="flex-1 flex items-center bg-background rounded-r-lg">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  autoComplete="off"
                  placeholder="Search selected locations..."
                  value={locationsSearchTerm}
                  onChange={(e) => setLocationsSearchTerm(e.target.value)}
                  className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                />
              </div>
            </div>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => setLocationsAddOpen((prev) => !prev)}
          size="default"
          className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Add Locations
        </Button>
        {locationsAddOpen && (
          <div className="absolute left-0 top-full mt-3 z-50 w-full max-w-[520px]">
            <div className="w-full bg-white border border-gray-200 rounded-lg shadow-lg space-y-2 p-3 relative">
            <div className="flex bg-muted/50 rounded-lg border">
              <div className="flex-1 flex items-center bg-background rounded-l-lg">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search locations..."
                    value={locationsAddSearchTerm}
                    onChange={(e) => setLocationsAddSearchTerm(e.target.value)}
                    className="pl-10 pr-3 py-2 h-10 border-none rounded-l-lg text-sm focus:ring-0 focus:outline-none bg-transparent"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLocationsAddOpen(false)}
                className="px-3 py-2 bg-background rounded-r-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border rounded-lg bg-white">
              <Command shouldFilter={false} className="rounded-lg">
                {addFilteredLocations.length > 0 && (
                  <div className="flex items-center justify-between px-2 py-1.5 border-b border-dashed border-gray-200 bg-gray-50 rounded-t-lg">
                    <button
                      type="button"
                      onClick={handleSelectAllLocations}
                      className="flex items-center gap-2 text-xs font-medium text-gray-700 hover:text-blue-700"
                    >
                      <Check
                        className={`h-4 w-4 rounded-sm border ${
                          allAddFilteredLocationsSelected
                            ? "opacity-100 text-green-600 border-green-500"
                            : "opacity-70 text-transparent border-gray-300"
                        }`}
                      />
                      <span>Select all ({addFilteredLocations.length})</span>
                    </button>
                  </div>
                )}
                <CommandList className="max-h-[200px]">
                  <CommandEmpty className="py-4 text-center text-sm text-gray-500">
                    No locations found.
                  </CommandEmpty>
                  <CommandGroup>
                    {addFilteredLocations.map((loc) => {
                      const isSelected = selectedLocationCodes.includes(loc.code)
                      return (
                        <CommandItem
                          key={loc.code}
                          value={`${loc.code}-${loc.name}`}
                          onSelect={() => toggleLocation(loc.code)}
                          className="cursor-pointer"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 rounded-sm border ${
                              isSelected
                                ? "opacity-100 text-green-600 border-green-500"
                                : "opacity-70 text-transparent border-gray-300"
                            }`}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{loc.name || "N/A"}</div>
                            <div className="text-xs text-gray-500">Code: {loc.code}</div>
                          </div>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>
            </div>
          </div>
        )}
      </div>

      <div className="border rounded-lg bg-slate-50/40">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                Location Code
              </TableHead>
              <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                Location Name
              </TableHead>
              <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSelectedLocations.length > 0 ? (
              paginatedSelectedLocations.map((loc) => (
                <TableRow
                  key={loc.code}
                  className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                >
                  <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900">
                    {loc.code}
                  </TableCell>
                  <TableCell className="py-1.5 text-sm text-gray-900">
                    {loc.name || loc.code}
                  </TableCell>
                  <TableCell className="py-1.5 pr-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                      onClick={() => removeLocation(loc.code)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-gray-500">
                  No locations selected. Click &quot;Add Locations&quot; to select locations.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {filteredSelectedLocations.length > locationsPageSize && (
          <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
            <p className="text-[11px] text-gray-500">
              Showing{" "}
              <span className="font-semibold">
                {Math.min((locationsPage - 1) * locationsPageSize + 1, filteredSelectedLocations.length)}-
                {Math.min(locationsPage * locationsPageSize, filteredSelectedLocations.length)}
              </span>{" "}
              of <span className="font-semibold">{filteredSelectedLocations.length}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[11px]"
                disabled={locationsPage === 1}
                onClick={() => setLocationsPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[11px]"
                disabled={locationsPage * locationsPageSize >= filteredSelectedLocations.length}
                onClick={() =>
                  setLocationsPage((p) =>
                    p * locationsPageSize >= filteredSelectedLocations.length ? p : p + 1
                  )
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
