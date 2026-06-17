"use client";

import React, { Dispatch, SetStateAction, useEffect, useRef } from "react";
import TopTitleDescription from "../titleline/top-title-discription";

const Ptag = ({ textvalue }: { textvalue: string }) => {
  return <p className="text-sm text-gray-500 mt-2 mb-4">{textvalue}</p>;
};

export default function MiniPopupWrapper({
  children,
  open,
  setOpen,
  content,
  functionToClose,
}: Readonly<{
  children: React.ReactNode;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  content?: {
    title: string;
    description: string;
  };
  functionToClose?: any;
}>) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(event.target as Node) &&
        open &&
        setOpen
      ) {
        setOpen(false);
      }
    };

    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open && setOpen) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscKey);

    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "";
    };
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      if (overlayRef.current) overlayRef.current.style.opacity = "1";
      if (dialogRef.current) {
        dialogRef.current.style.opacity = "1";
        dialogRef.current.style.transform = "translateY(0)";
      }
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[150]">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-200"
        style={{ opacity: 0 }}
      />

      {/* Dialog wrapper */}
      <div className="relative z-10 flex items-center justify-center p-4 w-full h-full">
        <div
          ref={dialogRef}
          className="bg-white rounded-lg shadow-xl sm:max-w-[425px] w-full max-h-[90vh] overflow-hidden transition-all duration-200 transform"
          style={{ opacity: 0, transform: "translateY(10px)" }}
          role="dialog"
          aria-modal="true"
        >
          {/* Scrollable content */}
          <div className="flex flex-col max-h-[90vh] overflow-auto">
            <div className={`px-6 ${content ? "pt-6" : ""}`}>
              {content && (
                <div className="flex items-start justify-between">
                  <TopTitleDescription titleValue={content} />
                  <button
                    onClick={() => {
                      setOpen(false);
                    }}
                    className="ml-4 text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Close</span>
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Inner scrollable area */}
            <div className="px-6 pb-6 overflow-auto">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
