"use client"

import React from "react"
import { ArrowRight, Check, X } from "lucide-react"

import { cn } from "@/lib/utils"

export interface SuccessAlertCardProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  onClose?: () => void
  className?: string
}

export default function SuccessAlertCard({
  title = "Credits purchased successfully!",
  description = "You've successfully added credits to your account. Start generating images with more customization.",
  actionLabel = "View credit balance",
  onAction,
  onClose,
  className,
}: SuccessAlertCardProps) {
  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className={cn(
          "w-full max-w-3xl",
          className
        )}
      >
        <div className="flex items-start gap-3 px-5 py-4  rounded-lg border border-gray-200 bg-white shadow-xl">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#16a34a] text-white">
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-[15px] font-semibold leading-6 text-[#222222]">
                {title}
              </h3>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#8b8b8b] transition-colors hover:bg-[#f5f5f5] hover:text-[#222222]"
                  aria-label="Close success alert"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <p className="mt-1 max-w-[440px] text-[14px] leading-7 text-[#555555]">
              {description}
            </p>

            {actionLabel && (
              <button
                type="button"
                onClick={onAction}
                className="mt-3 inline-flex items-center gap-1 text-[14px] font-semibold text-[#222222] transition-opacity hover:opacity-70"
              >
                <span>{actionLabel}</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
