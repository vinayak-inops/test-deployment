"use client"

import { useState, useMemo, useEffect } from "react"
import { Trash2, Filter, Search as SearchIcon, X } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"
import { Input } from "@repo/ui/components/ui/input"
import { Label } from "@repo/ui/components/ui/label"
import { Separator } from "@repo/ui/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@repo/ui/components/ui/table"
import { SubFormTitle } from "../../../../../../components/header/sub-form-title"
import { SingleSelectField } from "@/components/fields/single-select-field"

export interface AssetChargeItem {
  assetCode: string
  assetName: string
  assetCharges: number
}

export interface AssetOption {
  assetCode: string
  assetName?: string
}

export interface WorkOrderAssetChargesSectionProps {
  value: AssetChargeItem[]
  onChange: (charges: AssetChargeItem[]) => void
  assetOptions?: AssetOption[]
  disabled?: boolean
  loading?: boolean
  fieldConfig?: Partial<
    Record<"assetCode" | "assetName" | "assetCharges", { required?: boolean; visible?: boolean; label?: string }>
  >
}

const pageSize = 5
const INPUT_CLASS =
  "h-9 border-gray-300 px-3 py-1.5 text-sm focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
const LABEL_CLASS = "block text-xs font-medium text-gray-700 uppercase tracking-wide"

export function WorkOrderAssetChargesSection({
  value,
  onChange,
  assetOptions = [],
  disabled = false,
  loading = false,
  fieldConfig,
}: WorkOrderAssetChargesSectionProps) {
  const [addFormOpen, setAddFormOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [searchField, setSearchField] = useState<"code" | "name">("name")
  const [formAssetCode, setFormAssetCode] = useState("")
  const [formCharges, setFormCharges] = useState<number>(0)
  const [page, setPage] = useState(1)

  const list = value ?? []

  const filteredList = useMemo(() => {
    const q = searchTerm.toLowerCase().trim()
    if (!q) return list
    return list.filter((row) => {
      if (searchField === "code") return row.assetCode?.toLowerCase().includes(q)
      return row.assetName?.toLowerCase().includes(q)
    })
  }, [list, searchTerm, searchField])

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredList.slice(start, start + pageSize)
  }, [filteredList, page])

  useEffect(() => {
    const maxPage = Math.max(1, Math.ceil(filteredList.length / pageSize))
    if (page > maxPage) setPage(maxPage)
  }, [filteredList.length, page])

  const removeAt = (filteredIndex: number) => {
    const toRemove = filteredList[filteredIndex]
    if (toRemove == null) return
    const listIndex = list.indexOf(toRemove)
    if (listIndex === -1) return
    onChange(list.filter((_, i) => i !== listIndex))
  }

  const handleAddOpen = () => {
    setFormAssetCode("")
    setFormCharges(0)
    setAddFormOpen(true)
  }

  const selectedAsset = useMemo(
    () => assetOptions.find((a) => a.assetCode === formAssetCode),
    [assetOptions, formAssetCode]
  )
  const assetSelectOptions = useMemo(
    () =>
      assetOptions.map((a) => ({
        value: a.assetCode || "",
        label: a.assetName || a.assetCode || "",
        tooltip: a.assetName ? `${a.assetName} (${a.assetCode})` : a.assetCode,
      })),
    [assetOptions]
  )

  const handleAddSave = () => {
    const asset = assetOptions.find((a) => a.assetCode === formAssetCode)
    const assetName = asset?.assetName ?? ""
    if (!formAssetCode.trim()) return
    onChange([
      ...list,
      {
        assetCode: formAssetCode.trim(),
        assetName: assetName || formAssetCode,
        assetCharges: Number(formCharges) || 0,
      },
    ])
    setFormAssetCode("")
    setFormCharges(0)
    setAddFormOpen(false)
  }

  const showAssetCode = fieldConfig?.assetCode?.visible ?? true
  const showAssetName = fieldConfig?.assetName?.visible ?? true
  const showAssetCharges = fieldConfig?.assetCharges?.visible ?? true
  const assetCodeLabel = fieldConfig?.assetCode?.label || "Asset Code"
  const assetNameLabel = fieldConfig?.assetName?.label || "Asset Name"
  const assetChargesLabel = fieldConfig?.assetCharges?.label || "Charges"
  const isAssetCodeRequired = fieldConfig?.assetCode?.required ?? true
  const isAssetChargesRequired = fieldConfig?.assetCharges?.required ?? true

  useEffect(() => {
    if (showAssetCode && showAssetName) return
    setSearchField(showAssetCode ? "code" : "name")
  }, [showAssetCode, showAssetName])

  if (!showAssetCode && !showAssetName && !showAssetCharges) return null

  return (
    <div className="relative bg-white rounded-lg">
      <div>
        <h2 className="text-base font-medium text-gray-900">
          Asset Charges Per Day ({list.length})
        </h2>
        <div className="mt-1 border-b border-gray-200" />
      </div>

      <div className="pt-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <div className="flex bg-muted/50 rounded-lg border flex-1">
              <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
                <Filter className="w-4 h-4 text-muted-foreground mr-2" />
                <Select
                  value={searchField}
                  onValueChange={(val: "code" | "name") => setSearchField(val)}
                >
                  <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {showAssetCode && (
                      <SelectItem value="code" className="text-sm">
                        Code
                      </SelectItem>
                    )}
                    {showAssetName && (
                      <SelectItem value="name" className="text-sm">
                        Name
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 flex items-center bg-background rounded-r-lg">
                <div className="relative flex-1">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    autoComplete="off"
                    placeholder={`Search by ${searchField === "code" ? "code" : "name"}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent"
                  />
                </div>
              </div>
            </div>

            {addFormOpen && (
              <div className="absolute z-30 left-0 top-full mt-3 w-[min(520px,100%)]">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg space-y-3 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">Add Asset Charge</span>
                    <button
                      type="button"
                      onClick={() => setAddFormOpen(false)}
                      className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <SubFormTitle title="Asset Selection" />
                    <SingleSelectField
                      id="assetCode"
                      label={assetCodeLabel}
                      required={isAssetCodeRequired}
                      placeholder="Search by code or name..."
                      disabled={disabled}
                      value={formAssetCode}
                      onChange={setFormAssetCode}
                      options={assetSelectOptions}
                      allowOnlyProvidedOptions
                    />
                  </div>

                  {selectedAsset && (
                    <p className="text-xs text-gray-600">
                      Selected: <span className="font-medium">{selectedAsset.assetName || selectedAsset.assetCode}</span>
                      {selectedAsset.assetName && (
                        <span className="text-gray-500 ml-1">(Code: {selectedAsset.assetCode})</span>
                      )}
                    </p>
                  )}

                  <Separator />

                  <div className="space-y-3">
                    <SubFormTitle title="Charge Details" />
                    {showAssetCharges && (
                    <div className="space-y-2">
                    <Label className={LABEL_CLASS}>{assetChargesLabel} {isAssetChargesRequired && <span className="text-red-500">*</span>}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={formCharges === 0 ? "" : formCharges}
                      onChange={(e) =>
                        setFormCharges(e.target.value ? Number(e.target.value) : 0)
                      }
                      className={INPUT_CLASS}
                      placeholder="0"
                      disabled={disabled}
                    />
                    </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAddFormOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleAddSave}
                      disabled={!formAssetCode?.trim()}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Button
            type="button"
            onClick={handleAddOpen}
            size="default"
            className="h-10 bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading || disabled}
          >
            Add Asset Charge
          </Button>
        </div>

        <div className="border rounded-lg bg-slate-50/40">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide w-10">
                  SL
                </TableHead>
                {showAssetCode && (
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    {assetCodeLabel}
                  </TableHead>
                )}
                {showAssetName && (
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide">
                    {assetNameLabel}
                  </TableHead>
                )}
                {showAssetCharges && (
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide w-24">
                    {assetChargesLabel}
                  </TableHead>
                )}
                {!disabled && (
                  <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right w-20">
                    Action
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedList.length > 0 ? (
                paginatedList.map((row, idx) => {
                  const filteredIndex = (page - 1) * pageSize + idx
                  return (
                    <TableRow
                      key={`${row.assetCode}-${filteredIndex}-${idx}`}
                      className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors"
                    >
                      <TableCell className="py-1.5 pl-4 text-xs text-gray-900">
                        {filteredIndex + 1}
                      </TableCell>
                      {showAssetCode && (
                        <TableCell className="py-1.5 font-mono text-[11px] text-gray-900">
                          {row.assetCode}
                        </TableCell>
                      )}
                      {showAssetName && (
                        <TableCell className="py-1.5 text-sm text-gray-900 truncate max-w-[200px]" title={row.assetName}>
                          {row.assetName || "-"}
                        </TableCell>
                      )}
                      {showAssetCharges && (
                        <TableCell className="py-1.5 text-sm text-gray-900">
                          {row.assetCharges}
                        </TableCell>
                      )}
                      {!disabled && (
                        <TableCell className="py-1.5 pr-4 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-full"
                            onClick={() => removeAt(filteredIndex)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={1 + (showAssetCode ? 1 : 0) + (showAssetName ? 1 : 0) + (showAssetCharges ? 1 : 0) + (disabled ? 0 : 1)}
                    className="py-8 text-center text-sm text-gray-500"
                  >
                    No asset charges. Click &quot;Add Asset Charge&quot; to add one.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filteredList.length > pageSize && (
            <div className="flex items-center justify-between px-4 py-2 border-t bg-slate-50">
              <p className="text-[11px] text-gray-500">
                Showing{" "}
                <span className="font-semibold">
                  {(page - 1) * pageSize + 1}-
                  {Math.min(page * pageSize, filteredList.length)}
                </span>{" "}
                of <span className="font-semibold">{filteredList.length}</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  disabled={page * pageSize >= filteredList.length}
                  onClick={() =>
                    setPage((p) => (p * pageSize >= filteredList.length ? p : p + 1))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
