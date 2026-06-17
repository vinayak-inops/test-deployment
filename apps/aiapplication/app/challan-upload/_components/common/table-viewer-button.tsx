"use client";

import { FileText } from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";

interface TableViewerButtonProps {
  totalSelected?: number;
  onOpen: () => void;
  variant?: "fixed" | "inline";
  label?: string;
}

export function TableViewerButton({
  totalSelected = 0,
  onOpen,
  variant = "fixed",
  label = "Upload Challan",
}: TableViewerButtonProps) {
  const buttonContent = (
    <>
      <FileText size={16} className="mr-2" />
      {label}
      {totalSelected > 0 && (
        <Badge variant="secondary" className="ml-2 bg-white text-blue-700">
          {totalSelected}
        </Badge>
      )}
    </>
  );

  if (variant === "fixed") {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Button onClick={onOpen} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
          {buttonContent}
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={onOpen} className="bg-blue-600 hover:bg-blue-700 text-white">
      {buttonContent}
    </Button>
  );
}
