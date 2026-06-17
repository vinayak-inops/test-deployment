import { CardHeader } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { X } from "lucide-react"

interface GradientFormHeaderProps {
  title: string
  description: string
  icon: LucideIcon
  onClose?: () => void
}

export function GradientFormHeader({ title, description, icon: Icon, onClose }: GradientFormHeaderProps) {
  return (
    <CardHeader className={`px-5 py-3 border-b border-gray-200 ${onClose ? "flex items-center gap-2 flex-shrink-0" : ""}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="p-1.5 bg-gray-100 rounded-lg">
          <Icon className="h-4 w-4 text-blue-600" />
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </CardHeader>
  )
}
