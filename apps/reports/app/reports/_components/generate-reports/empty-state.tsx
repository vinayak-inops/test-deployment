"use client"

import { Filter, Building2 } from "lucide-react"
import { Button } from "@repo/ui/components/ui/button"

interface EmptyStateProps {
  onOpen: () => void
}

export function EmptyState({ onOpen }: EmptyStateProps) {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-full min-h-[400px]">
          <div className="text-center">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-700 mb-3">View Tables</h3>
            <p className="text-gray-500 text-sm mb-4">
              Click the <span className="font-medium">"Select Tables"</span> button in the top-right corner to open the table viewer
            </p>
            <Button
              onClick={onOpen}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Filter className="h-4 w-4 mr-2" />
              Open Table Viewer
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

