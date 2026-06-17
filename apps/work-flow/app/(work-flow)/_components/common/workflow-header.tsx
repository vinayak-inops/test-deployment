import { Search } from "lucide-react";
import { Input } from "@repo/ui/components/ui/input";
import { useState } from "react";
import { WorkflowHeaderProps } from "@/type/work-flow/create-work-flow/props";

export function WorkflowHeader({ title, description }: WorkflowHeaderProps) {
  const [value, setValue] = useState("");
  return (
    <div className="space-y-4">
      <div>
        <h6 className="text-xl font-semibold">{title}</h6>
        <p className="text-[#7b809a] text-base">{description}</p>
      </div>

      <div className="relative">
        {/* <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" /> */}
        <Input
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search nodes..."
          className="pl-9 bg-white border-[#7b809a] placeholder:text-[#7b809a] text-black"
        />
      </div>
    </div>
  );
}
