import type { LucideIcon } from "lucide-react"

interface SubFormTitleProps {
  title: string
  icon?: LucideIcon
  className?: string
}

export function SubFormTitle({ title, icon: Icon, className = "" }: SubFormTitleProps) {
  return (
    <h3 className={`text-sm font-semibold text-gray-800 flex items-center gap-2 ${className}`.trim()}>
      {Icon && <Icon className="h-5 w-5 text-blue-600" />}
      {title}
    </h3>
  )
}
