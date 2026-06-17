"use client"

import { useEffect, useState } from "react"
import { Card } from "@repo/ui/components/ui/card"

interface GoalCardProps {
  title: string
  date: string
  current: number
  target: number
}

export default function GoalCard({ title, date, current, target }: GoalCardProps) {
  const [mounted, setMounted] = useState(false)

  // Handle hydration mismatch by only rendering the chart on the client
  useEffect(() => {
    setMounted(true)
  }, [])

  const percentage = Math.round((current / target) * 100)

  return (
    <Card className="overflow-hidden bg-blue-500 text-white shadow-lg">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold">{title}</h3>
            <p className="text-white">{date}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">
              {current} <span className="text-blue-100">/ {target}</span>
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          {mounted && (
            <div className="relative h-10 w-10">
              <svg viewBox="0 0 36 36">
                {/* Background circle */}
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#85B7E8"
                  strokeWidth="3"
                />

                {/* Progress arc - dynamically calculated */}
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="3"
                  strokeDasharray={`${percentage}, 100`}
                  strokeLinecap="round"
                  transform="rotate(-90, 18, 18)"
                />
              </svg>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
