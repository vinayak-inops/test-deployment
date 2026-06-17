"use client";

import type React from "react";

import { Dispatch, SetStateAction, useState } from "react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/ui/dialog";
import { Input } from "@repo/ui/components/ui/input";
import { X, ChevronRight } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { FileUploader } from "./file-uploader";

// Define the role options
const roleOptions = [
  { id: "workspace-owner", label: "Workspace owner" },
  { id: "admin", label: "Admin" },
  { id: "member", label: "Member" },
  { id: "viewer", label: "Viewer" },
  { id: "guest", label: "Guest" },
  { id: "contributor", label: "Contributor" },
];

export default function PopupForm({
  open,
  setOpen,
  nameOfExcel,
  setNameOfExcel,
  workFlowName,
  setWorkFlowName,
}: {
  setOpen: Dispatch<SetStateAction<boolean>>;
  open: boolean;
  nameOfExcel: string;
  setNameOfExcel: React.Dispatch<React.SetStateAction<string>>;
  workFlowName: string;
  setWorkFlowName: React.Dispatch<React.SetStateAction<string>>;
}) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setOpen(false);
  };

  return (
    <div className="flex items-center justify-center p-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-white rounded-lg border-none">
          <div className="px-6 pt-6">
            <DialogHeader className="flex items-start justify-between">
              <DialogTitle className="text-lg font-medium text-gray-800">
                Invite members
              </DialogTitle>
              {/* <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setOpen(false)}>
                <X className="h-4 w-4 text-gray-400" />
              </Button> */}
            </DialogHeader>
            <p className="text-sm text-gray-500 mt-1">
              Type or paste in emails below, separated by commas
            </p>
          </div>
          <div className="pb-6">
            {/* <FileUploader /> */}
          </div>
          <form onSubmit={handleSubmit} className="p-6 pt-0">
            <div className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="emails"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email addresses
                </label>
                <Input
                  id="emails"
                  value={nameOfExcel}
                  onChange={(e) => setNameOfExcel(e.target.value)}
                  placeholder="Search names or emails"
                  className="border border-gray-300 rounded-md"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700"
                >
                  Role
                </label>
                <div className=" rounded-md max-h-[150px] overflow-y-auto">
                  {roleOptions.map((role) => (
                    <div
                      key={role.id}
                      className={cn(
                        "flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 rounded-lg",
                        workFlowName === role.id && "bg-gray-100"
                      )}
                      onClick={() => setWorkFlowName(role.id)}
                    >
                      <span className="flex-1 text-sm text-gray-700">
                        {role.label}
                      </span>
                      {workFlowName === role.id && (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  className="bg-blue-200 hover:bg-blue-300 text-blue-700 font-medium"
                >
                  Send invite
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
