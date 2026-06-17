"use client";
import { Button } from "@repo/ui/components/ui/button";
import { CardTitle } from "@repo/ui/components/ui/card";
import { Input } from "@repo/ui/components/ui/input";
import { Label } from "@repo/ui/components/ui/label";
import { Textarea } from "@repo/ui/components/ui/textarea";
import { useState } from "react";

export default function WorkFlowForm({
  newWorkFlowFun,
}: {
  newWorkFlowFun: (title: string, description: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    newWorkFlowFun(title, description);
  };

  return (
    <div className="shadow-lg bg-white p-5 rounded-xl">
      <div>
        <CardTitle className="text-base">Create New Work Flow</CardTitle>
      </div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              onChange={(e) => setTitle(e.target.value)}
              id="title"
              placeholder="Enter title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              onChange={(e) => setDescription(e.target.value)}
              id="description"
              placeholder="Enter description"
              className="min-h-[100px]"
              required
            />
          </div>
          <Button type="submit" className="w-full">
            Submit
          </Button>
        </form>
      </div>
    </div>
  );
}
