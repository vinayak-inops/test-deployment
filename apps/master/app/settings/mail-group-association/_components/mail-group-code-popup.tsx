"use client"

import { useMemo, useState } from "react"
import { gql, useQuery } from "@apollo/client"
import { client } from "@repo/ui/hooks/api/dynamic-graphql"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Check, Filter, Search as SearchIcon, X } from "lucide-react"
import { useGetTenantCode } from "@/hooks/api/search/useGetTenantCode"

interface MailGroupItem {
  mailGroupCode: string
  mailGroupName: string
}

interface MailGroupCodePopupProps {
  open: boolean
  onClose: () => void
  onSelect: (item: MailGroupItem) => void
}

const FETCH_ORGANIZATION_MAIL_GROUPS = gql`
  query FetchOrganization($criteriaRequests: [CriteriaRequest!]!, $collection: String!) {
    fetchOrganization(criteriaRequests: $criteriaRequests, collection: $collection) {
      mailGroup {
        mailGroupName
        mailGroupCode
      }
    }
  }
`

export default function MailGroupCodePopup({ open, onClose, onSelect }: MailGroupCodePopupProps) {
  const tenantCode = useGetTenantCode()
  const [search, setSearch] = useState("")

  const { data, loading } = useQuery(FETCH_ORGANIZATION_MAIL_GROUPS, {
    client,
    skip: !open || !tenantCode,
    variables: {
      criteriaRequests: [{ field: "tenantCode", operator: "eq", value: tenantCode }],
      collection: "organization",
    },
    fetchPolicy: "network-only",
  })

  const rows = useMemo(() => {
    const list = (data?.fetchOrganization?.[0]?.mailGroup || []) as MailGroupItem[]
    const query = search.trim().toLowerCase()
    if (!query) return list
    return list.filter(
      (item) =>
        (item.mailGroupCode || "").toLowerCase().includes(query) ||
        (item.mailGroupName || "").toLowerCase().includes(query)
    )
  }, [data, search])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 w-full max-w-4xl flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Filter className="h-4 w-4 text-gray-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Select Mail Group</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Search and select a mail group code.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
          <div className="flex bg-muted/50 rounded-lg border w-full">
            <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-40">
              <Filter className="w-4 h-4 text-muted-foreground mr-2" />
              <Select value="mailGroup">
                <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mailGroup" className="text-sm">Mail Group</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 flex items-center bg-background rounded-r-lg min-w-0">
              <div className="relative flex-1 w-full">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search by mail group code or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent w-full placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">Loading mail groups...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">No mail groups found</p>
            </div>
          ) : (
            <div className="border rounded-lg bg-slate-50/40 overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded-full">
              <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="py-2 pl-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Sl No</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Mail Group Code</TableHead>
                  <TableHead className="py-2 text-[11px] font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap">Mail Group Name</TableHead>
                  <TableHead className="py-2 pr-4 text-[11px] font-semibold text-slate-600 uppercase tracking-wide text-right whitespace-nowrap sticky right-0 bg-slate-50 z-10">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((item, index) => {
                  const isEven = index % 2 === 1
                  return (
                    <TableRow key={item.mailGroupCode} className="hover:bg-slate-50/80 odd:bg-white even:bg-slate-50/60 transition-colors">
                      <TableCell className="py-1.5 pl-4 font-mono text-[11px] text-gray-900 whitespace-nowrap">{index + 1}</TableCell>
                      <TableCell className="py-1.5 font-mono text-[11px] text-gray-900 whitespace-nowrap">{item.mailGroupCode}</TableCell>
                      <TableCell className="py-1.5 text-sm text-gray-900 whitespace-nowrap">{item.mailGroupName}</TableCell>
                      <TableCell className={`py-1.5 pr-4 text-right sticky right-0 z-10 ${isEven ? "bg-slate-50/60" : "bg-white"}`}>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 rounded-full text-slate-400 hover:text-blue-600 hover:bg-slate-100"
                          onClick={() => {
                            onSelect(item)
                            onClose()
                          }}
                          title="Select"
                          aria-label={`Select ${item.mailGroupCode}`}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
          </div>
    </div>
  )
}
