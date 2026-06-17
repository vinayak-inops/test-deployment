import { MoreVertical } from "lucide-react"

interface EditPunchApplicationHeaderProps {
  title?: string
  description?: string
  onRefilter?: () => void
  onAddNew?: () => void
  canAdd?: boolean
}

function EditPunchApplicationHeader({
  title = "Edit Punch Applications",
  description = "Manage and review edit punch application requests",
  onRefilter,
  onAddNew,
  canAdd = true,
}: EditPunchApplicationHeaderProps) {
  return (
    <div className="backdrop-blur border-b border-slate-200 px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-slate-800 hover:bg-slate-50 transition-colors"
            aria-label="More options"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditPunchApplicationHeader
