"use client"

import React from "react"
import { Button } from "@repo/ui/components/ui/button"
import { cn } from "@repo/ui/lib/utils"

type ButtonSize = "sm" | "default" | "lg" | "icon"
type ButtonVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "ghost"
  | "link"
  | "outline"

export interface ActionButtonsProps {
  layout?: "end" | "start" | "between" | "center"
  gap?: string

  primaryLabel?: string
  secondaryLabel?: string

  onPrimary?: () => void
  onSecondary?: () => void

  primaryVariant?: ButtonVariant
  secondaryVariant?: ButtonVariant

  primaryDisabled?: boolean
  secondaryDisabled?: boolean

  primaryLoading?: boolean
  secondaryLoading?: boolean

  primarySize?: ButtonSize
  secondarySize?: ButtonSize

  className?: string
  primaryClassName?: string
  secondaryClassName?: string
}

export default function ActionButtons({
  layout = "end",
  gap = "gap-2",
  primaryLabel = "Submit",
  secondaryLabel = "Cancel",
  onPrimary,
  onSecondary,
  primaryVariant = "default",
  secondaryVariant = "outline",
  primaryDisabled = false,
  secondaryDisabled = false,
  primaryLoading = false,
  secondaryLoading = false,
  primarySize = "sm",
  secondarySize = "sm",
  className,
  primaryClassName,
  secondaryClassName,
}: ActionButtonsProps) {
  const layoutClass =
    layout === "end"
      ? "justify-end"
      : layout === "start"
      ? "justify-start"
      : layout === "between"
      ? "justify-between"
      : "justify-center"

  return (
    <div className={cn("flex", gap, layoutClass, className)}>
      {secondaryLabel && (
        <Button
          type="button"
          variant={secondaryVariant}
          size={secondarySize}
          onClick={onSecondary}
          disabled={secondaryDisabled || secondaryLoading}
          className={cn("px-3 py-1.5 h-8 text-sm", secondaryClassName)}
        >
          {secondaryLoading ? "Please wait…" : secondaryLabel}
        </Button>
      )}
      {primaryLabel && (
        <Button
          type="button"
          variant={primaryVariant}
          size={primarySize}
          onClick={onPrimary}
          disabled={primaryDisabled || primaryLoading}
          className={cn("px-3 py-1.5 h-8 text-sm", primaryClassName)}
        >
          {primaryLoading ? "Processing…" : primaryLabel}
        </Button>
      )}
    </div>
  )
}

