"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Command, Database, FileText, MoreHorizontal } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { useForm } from "react-hook-form";

import { useDispatch, useSelector } from "react-redux";
import { setFormTab, setOpenWorkFlow, setWorkFlowName } from "@inops/store/src/slices/features/work-flow/create-work-flow/workflow-slice";
import { Textarea } from "@repo/ui/components/ui/textarea";

// Define the form data structure
type WorkflowFormData = {
  title: string;
  description: string;
};

export default function NewWorkFlow({
  onAddNode,
}: {
  onAddNode: (node: { node: string; stateData?: any }) => void;
}) {
  
  const dispatch = useDispatch();

  // Configure react-hook-form with validation rules
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<WorkflowFormData>({
    mode: "onChange", // Validate on change
    defaultValues: {
      title: "",
      description: "",
    },
  });

  // Get current form values for conditional rendering
  const title = watch("title");
  const description = watch("description");

  const titleRef = useRef<HTMLInputElement>(null);

  // Focus title input on mount
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Handle workflow creation
  const onSubmit = (data: WorkflowFormData) => {
    onAddNode({
      node: "start-flow",
      stateData: {
        state: { title: data.title, description: data.description },
      },
    });
    dispatch(setWorkFlowName({ title: data.title, description: data.description }));
    dispatch(setFormTab("first-state"));
    dispatch(setOpenWorkFlow(false));
  };

  return (
    <div className="w-full relative z-10 p-4 rounded-lg shadow-sm border bg-white h-full border-gray-100 flex justify-center items-center">
      <div className="max-w-[580px] w-full">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="min-h-[200px] cursor-text"
        >
          <div>
            <Input
              {...register("title", {
                required: "Title is required",
                minLength: {
                  value: 3,
                  message: "Title must be at least 3 characters",
                },
              })}
              ref={(e) => {
                register("title").ref(e);
                titleRef.current = e;
              }}
              className={`text-4xl border-0 font-bold ${errors.title ? "border-red-500 focus:border-red-500" : ""}`}
              placeholder="New Work Flow"
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">
                {errors.title.message}
              </p>
            )}

            {title?.trim() !== "" && (
              <>
                <Textarea
                  {...register("description", {
                    required: "Description is required",
                    minLength: {
                      value: 10,
                      message: "Description must be at least 10 characters",
                    },
                  })}
                  className={`text-sm h-32 border-0 mt-2 ${errors.description ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="Description related to the workflow"
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description.message}
                  </p>
                )}
              </>
            )}
          </div>

          {title?.trim() !== "" && description?.trim() !== "" && (
            <div className="mt-4 flex justify-end">
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                disabled={!isValid}
              >
                Create Workflow
              </Button>
            </div>
          )}
        </form>

        <div className="">
          <div className="mt-4 relative z-10">
            <p className="text-sm text-gray-500 mb-2">Get started with</p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                className="bg-gray-100 hover:bg-gray-100 rounded-full border-0 shadow-sm"
                type="button"
              >
                <Command className="h-4 w-4 mr-2" />
                Ask AI
              </Button>
              <Button
                variant="outline"
                className="bg-gray-100 hover:bg-gray-100 rounded-full border-0 shadow-sm"
                type="button"
              >
                <Database className="h-4 w-4 mr-2" />
                Database
              </Button>
              <Button
                variant="outline"
                className="bg-gray-100 hover:bg-gray-100 rounded-full border-0 shadow-sm"
                type="button"
              >
                <FileText className="h-4 w-4 mr-2" />
                Form
              </Button>
              <Button
                variant="outline"
                className="bg-gray-100 hover:bg-gray-100 rounded-full border-0 shadow-sm"
                type="button"
              >
                <svg
                  className="h-4 w-4 mr-2"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 4h16v16H4V4z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M4 9h16M9 4v16"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                Templates
              </Button>
              <Button
                variant="outline"
                className="bg-gray-100 hover:bg-gray-100 rounded-full border-0 shadow-sm"
                type="button"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
