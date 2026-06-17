"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FolderPlus } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className=" bg-white rounded-tl-2xl h-full">
      {/* Hero Banner */}
      {/* <div className="relative h-[200px] bg-[#023430] overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: 0.2,
          }}
        />
        <h1 className="relative z-10 text-white text-4xl font-bold p-8">
          Projects
        </h1>
      </div> */}

      {/* Filters Bar */}
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex gap-2">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              <SelectItem value="me">My Projects</SelectItem>
              <SelectItem value="shared">Shared with me</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="development">Development</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date modified" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Most relevant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevant">Most Relevant</SelectItem>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.5 5.25H13.5M1.5 9.75H13.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>

          <Button className="bg-white text-black hover:bg-gray-100">
            <Plus className="w-4 h-4 mr-2" />
            Add new
          </Button>
        </div>
      </div>

      {/* Empty State */}
      <div className="
      text-center">
        <div className="relative flex justify-center mb-4">
          <Image
            width={150}
            height={80}
            src="/images/excel-file.png"
            alt="Empty folder illustration"
            className=" object-contain"
          />
        </div>
        <h5 className="text-lg font-semibold mb-1">
          Projects is the home for all your content
        </h5>
        <p className="text-gray-600 mb-6 text-[14px]">
          Find all of your personal and shared designs here. Create a design or
          folder to get started.
        </p>
        <div className="flex justify-center gap-4">
          {/* <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 mr-2" />
            Create design
          </Button> */}
          <Button className="bg-blue-600 hover:bg-blue-700 text-sm">
            <FolderPlus className="w-4 h-4 mr-2" />
            Upload Excel File
          </Button>
        </div>
      </div>

      {/* Help Button */}
      {/* <Button
        className="fixed bottom-6 right-6 rounded-full w-12 h-12 bg-purple-600 hover:bg-purple-700"
        size="icon"
      >
        <HelpCircle className="w-6 h-6" />
      </Button> */}
    </div>
  );
}
