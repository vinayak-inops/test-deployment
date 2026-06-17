"use client"

import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@repo/ui/components/ui/select"

export type MailGroupSearchField = "mailGroup" | "primaryEmail" | "ccEmail" | "createdBy"

interface MailGroupAssociationFilterBarProps {
  searchField: MailGroupSearchField
  setSearchField: (value: MailGroupSearchField) => void
  searchTerm: string
  setSearchTerm: (value: string) => void
  canAdd?: boolean
  onAdd?: () => void
}

export default function MailGroupAssociationFilterBar({
  searchField,
  setSearchField,
  searchTerm,
  setSearchTerm,
  canAdd = false,
  onAdd,
}: MailGroupAssociationFilterBarProps) {
  const fieldLabels: Record<MailGroupSearchField, string> = {
    mailGroup: "Mail Group",
    primaryEmail: "Primary Email",
    ccEmail: "CC Email",
    createdBy: "Created By",
  }

  const selectedFieldLabel = fieldLabels[searchField]

  return (
    <div className="w-full px-8 py-4 pb-0">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <div className="flex bg-muted/50 rounded-lg border flex-1">
          <div className="flex items-center bg-background border-r rounded-l-lg px-3 py-2 w-44">
            <Select value={searchField} onValueChange={(v) => setSearchField(v as MailGroupSearchField)}>
              <SelectTrigger className="w-full h-6 border-none p-0 text-sm font-medium text-foreground focus:ring-0 bg-transparent shadow-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mailGroup">Mail Group</SelectItem>
                <SelectItem value="primaryEmail">Primary Email</SelectItem>
                <SelectItem value="ccEmail">CC Email</SelectItem>
                <SelectItem value="createdBy">Created By</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 flex items-center bg-background rounded-r-lg min-w-0">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="text"
                placeholder={`Search by ${selectedFieldLabel.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-3 py-2 h-10 border-none rounded-none text-sm focus:ring-0 focus:outline-none bg-transparent w-full placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
