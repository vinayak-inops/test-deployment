"use client";

import IconComponent from "@/components/icon/icon-component";
import { CommentPropsBox } from "@/type/work-flow/create-work-flow/props";
import { Button } from "@repo/ui/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export default function CommentSelectBox({ username, content }: CommentPropsBox) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <div className="flex items-start gap-3 p-4 border-b hover:bg-gray-50 transition-colors duration-200 pt-0">
      <div className="flex-grow min-w-0">
        <div className="font-medium text-base">{username}</div>
        <AnimatePresence initial={false} mode="wait">
          {expanded ? (
            <motion.div
              key="full-content"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="text-sm text-gray-600 mt-1"
            >
              {content}
            </motion.div>
          ) : (
            <motion.div
              key="preview-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm text-gray-600 mt-1 line-clamp-1"
            >
              {content}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="items-center gap-2 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleExpand}
          aria-label={expanded ? "Collapse comment" : "Expand comment"}
          className="rounded-full hover:bg-gray-100 transition-all duration-200"
        >
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <IconComponent
              icon={"ChevronDown"}
              size={20}
              className={"h-4 w-4"}
            />
          </motion.div>
        </Button>
      </div>
    </div>
  );
}
