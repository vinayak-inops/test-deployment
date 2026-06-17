"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowDownAZ, ArrowUpAZ, ArrowUp01, ArrowDown10 } from "lucide-react"

interface ColumnSortMenuProps {
  onSortAsc: () => void
  onSortDesc: () => void
  onAlphaAsc?: () => void
  onAlphaDesc?: () => void
}

export default function ColumnSortMenu({ onSortAsc, onSortDesc, onAlphaAsc, onAlphaDesc }: ColumnSortMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 p-0 text-gray-500 hover:text-gray-900">
          <ArrowUp01 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-gray-500">SORT OPTIONS</DropdownMenuLabel>
        <DropdownMenuItem onClick={onSortAsc} className="flex items-center gap-2">
          <ArrowUp01 className="h-4 w-4" />
          <span>Sort Ascending</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onSortDesc} className="flex items-center gap-2">
          <ArrowDown10 className="h-4 w-4" />
          <span>Sort Descending</span>
        </DropdownMenuItem>
        {(onAlphaAsc || onAlphaDesc) && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500">ALPHABETICAL</DropdownMenuLabel>
            {onAlphaAsc && (
              <DropdownMenuItem onClick={onAlphaAsc} className="flex items-center gap-2">
                <ArrowUpAZ className="h-4 w-4" />
                <span>A to Z</span>
              </DropdownMenuItem>
            )}
            {onAlphaDesc && (
              <DropdownMenuItem onClick={onAlphaDesc} className="flex items-center gap-2">
                <ArrowDownAZ className="h-4 w-4" />
                <span>Z to A</span>
              </DropdownMenuItem>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


