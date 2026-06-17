"use client";

import { useState } from "react";
import { ChevronDown, MoreHorizontal, Plus, Star } from "lucide-react";
import { Dispatch, SetStateAction } from "react";
import { FaClipboardList, FaTimes, FaSearch } from "react-icons/fa";

export default function BigPopupWrapper({
  children,
  open,
  setOpen,
  content,
}: Readonly<{
  children: React.ReactNode;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  content?: {
    title: string;
    description: string;
  };
}>) {


  return (

    <div className={`fixed inset-0 bg-black/30 flex items-center justify-center z-50 font-sans ${open ? "flex" : "hidden"}`}>
      <div className="bg-white rounded-2xl shadow-2xl w-[1100px] h-[600px] flex overflow-hidden relative">
        {/* Close Button */}
        <button
          className="absolute top-4 right-4 z-20 p-2 rounded-full hover:bg-gray-200 transition"
          aria-label="Close"
          onClick={() => setOpen(false)} // Add your close logic here
        >
          <FaTimes className="text-xl text-gray-500" />
        </button>
        {/* Resizable Panel Group */}
        {children}
        <style>{`
            .custom-scroll::-webkit-scrollbar {
                width: 8px;
                background: transparent;
            }
            .custom-scroll::-webkit-scrollbar-thumb {
                background: #e5e7eb;
                border-radius: 4px;
            }
        `}</style>
      </div>
    </div>
  );
}
