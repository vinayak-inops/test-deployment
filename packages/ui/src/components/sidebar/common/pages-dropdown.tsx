"use client"

import { AnimatePresence, motion } from "framer-motion"
import { ArrowUpRight, SquareGantt, ChevronRight, Image, LayoutPanelTop } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export const PagesDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleDropdown = () => {
    setIsOpen(!isOpen)
  }

  const pageItems = [
    { name: "Leave ", icon: SquareGantt },
    { name: "Shift Change", icon: SquareGantt },
    { name: "Punch Regularization", icon: SquareGantt },
  ]

  return (
    <div>
      <div
        className="flex items-center justify-between px-3 py-2 menu-item-hover rounded-lg mb-1 cursor-pointer"

      >
        <div className="flex items-center gap-3">
          <Image className="w-5 h-5" />
          <span className="text-sm">Work Flow</span>
        </div>
        <motion.div 
          animate={{ rotate: isOpen ? 180 : 0 }} 
          transition={{ duration: 0.3 }}
        >
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </motion.div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <div
            className="pl-4 space-y-1 overflow-hidden"
          >
            <Link href="/work-flow/work-flow" className="flex items-center justify-between px-3 py-2 bg-[rgba(255,255,255,0.04)] rounded-lg mb-2 menu-item-hover">
              <div className="flex items-center gap-3">
                <LayoutPanelTop className="w-5 h-5 text-[white]" />
                <span className="text-sm">New Work Flow</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </Link>
            {pageItems?.map((item, index) => (
              <button
                key={index}
                className="flex items-center px-3 py-2 menu-item-hover rounded-lg"
              >
                <item.icon className="w-4 h-4 mr-2 text-gray-400" />
                <span className="text-sm">{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}